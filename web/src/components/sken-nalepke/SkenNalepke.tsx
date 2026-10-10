"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, Circle, Loader2, ScanLine, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { pripraviSliko } from "@/lib/pripraviSliko";
import { preberiNalepko } from "./ocr";
import { IMENA_POLJ, razcleni, type Polje } from "./razcleni";

// Sken serijske nalepke (poskusno): prebere nalepko in vpiše osnovne podatke v prazna polja obrazca.
// Odstranitev: glej README.md v tej mapi.

type Stanje =
  | { vrsta: "prazno" }
  | { vrsta: "delam"; besedilo: string }
  | { vrsta: "konec"; vpisano: [Polje, string][]; preskoceno: [Polje, string][]; besedilo: string }
  | { vrsta: "napaka"; besedilo: string };

// Navodila za dobro fotografijo nalepke (prikazana pred skeniranjem in ob slabem rezultatu)
const NASVETI = [
  "Fotografiraj od blizu: nalepka naj zapolni večino slike.",
  "Telefon drži vzporedno z nalepko, ne poševno.",
  "Slika naj bo ostra, dovolj osvetljena in brez odseva bliskavice.",
  "Nalepko prej obriši (prah, maščoba, umazanija).",
  "Poškodovane, zbledele ali ukrivljene nalepke se morda ne preberejo.",
];

function Nasveti({ naslov }: { naslov: string }) {
  return (
    <div className="text-xs text-ink-600">
      <p className="font-semibold">{naslov}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        {NASVETI.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </div>
  );
}

/** Vpiše vrednost v polje obrazca, kot bi jo vpisal uporabnik (sproži onChange obrazca). */
function vpisi(polje: HTMLInputElement | HTMLSelectElement, vrednost: string) {
  const proto = polje instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(polje, vrednost);
  polje.dispatchEvent(new Event("input", { bubbles: true }));
  polje.dispatchEvent(new Event("change", { bubbles: true }));
}

export function SkenNalepke({ skupine }: { skupine: string[] }) {
  const koren = useRef<HTMLDivElement>(null);
  const [stanje, setStanje] = useState<Stanje>({ vrsta: "prazno" });
  const [predogled, setPredogled] = useState<string | null>(null);
  const [vlecem, setVlecem] = useState(false);

  useEffect(() => () => void (predogled && URL.revokeObjectURL(predogled)), [predogled]);

  async function obdelaj(datoteka: File | undefined) {
    if (!datoteka || stanje.vrsta === "delam") return;
    if (!datoteka.type.startsWith("image/")) {
      setStanje({ vrsta: "napaka", besedilo: "Izberi sliko (JPG ali PNG)." });
      return;
    }
    setPredogled(URL.createObjectURL(datoteka));
    setStanje({ vrsta: "delam", besedilo: "Pripravljam sliko ..." });
    try {
      // 1600 px je dovolj za ostro branje in hitreje od polne ločljivosti telefona
      const slika = await pripraviSliko(datoteka, 1600, 0.92);
      const okvirji = await preberiNalepko(slika, (faza) => setStanje({ vrsta: "delam", besedilo: faza }));

      // obstoječa oprema za predlog skupine po nazivu (npr. FB -> skupina, v kateri so ostale FB)
      const { data: obstojeca } = await createClient()
        .from("rbo_oprema")
        .select("oprema_naziv, skupina_opreme")
        .eq("visible", true);
      const najdeno = razcleni(okvirji, skupine, obstojeca ?? []);

      // vpiše samo v prazna polja, da ne prepiše tega, kar je uporabnik že vnesel
      const obrazec = koren.current?.closest("form");
      const vpisano: [Polje, string][] = [];
      const preskoceno: [Polje, string][] = [];
      for (const [polje, vrednost] of Object.entries(najdeno) as [Polje, string][]) {
        const el = obrazec?.elements.namedItem(polje);
        if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) continue;
        if (el.value.trim()) preskoceno.push([polje, vrednost]);
        else {
          vpisi(el, vrednost);
          vpisano.push([polje, vrednost]);
        }
      }
      setStanje({ vrsta: "konec", vpisano, preskoceno, besedilo: okvirji.map((o) => o.text).join("\n") });
    } catch (err) {
      setStanje({ vrsta: "napaka", besedilo: err instanceof Error ? err.message : String(err) });
    }
  }

  function spusti(e: DragEvent) {
    e.preventDefault();
    setVlecem(false);
    obdelaj(e.dataTransfer.files[0]);
  }

  const barve = vlecem
    ? "border-fines-500 bg-fines-50"
    : stanje.vrsta === "delam"
      ? "border-sync-500 bg-sync-50"
      : stanje.vrsta === "konec"
        ? "border-ok-500 bg-ok-50"
        : stanje.vrsta === "napaka"
          ? "border-nok-500 bg-nok-50"
          : "border-dashed border-ink-300 bg-ink-50 hover:bg-ink-100";

  const Ikona =
    stanje.vrsta === "delam" ? Loader2 : stanje.vrsta === "konec" ? CheckCircle2 : stanje.vrsta === "napaka" ? XCircle : Circle;
  const barvaIkone =
    stanje.vrsta === "delam"
      ? "animate-spin text-sync-500"
      : stanje.vrsta === "konec"
        ? "text-ok-500"
        : stanje.vrsta === "napaka"
          ? "text-nok-500"
          : "text-ink-400";

  const status =
    stanje.vrsta === "prazno"
      ? "Fotografiraj ali povleci sliko nalepke"
      : stanje.vrsta === "konec"
        ? stanje.vpisano.length
          ? `Vpisano: ${stanje.vpisano.length} ${stanje.vpisano.length === 1 ? "podatek" : stanje.vpisano.length === 2 ? "podatka" : stanje.vpisano.length < 5 ? "podatki" : "podatkov"}`
          : "Ni novih podatkov za vpis"
        : stanje.besedilo;

  return (
    // okvir je visok kot polja Osnovnih podatkov (od naslova prvega do spodnjega roba zadnjega polja)
    <div
      ref={koren}
      onDragOver={(e) => {
        e.preventDefault();
        setVlecem(true);
      }}
      onDragLeave={() => setVlecem(false)}
      onDrop={spusti}
      className={`relative flex w-full shrink-0 flex-col gap-2 rounded-lg border-2 p-3 transition-colors lg:w-72 ${barve}`}
    >
      <label
        title="Fotografiraj serijsko nalepko in samodejno izpolni podatke"
        className={`flex min-h-0 flex-1 cursor-pointer flex-col gap-2 ${predogled ? "" : "justify-center"}`}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={stanje.vrsta === "delam"}
          onChange={(e) => {
            obdelaj(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Ikona className={`absolute right-2 top-2 h-5 w-5 ${barvaIkone}`} aria-hidden />
        <span className="flex items-center gap-3 pr-6">
          <ScanLine className="h-8 w-8 shrink-0 text-fines-500" aria-hidden />
          <span className="flex flex-col">
            <span className="text-sm font-bold text-ink-900">Skeniraj nalepko</span>
            <span role="status" className="text-xs text-ink-600">
              {status}
            </span>
          </span>
        </span>
        {stanje.vrsta === "prazno" && <Nasveti naslov="Za dobro branje:" />}
        {predogled && (
          // eslint-disable-next-line @next/next/no-img-element -- lokalni predogled izbrane slike
          <img src={predogled} alt="Slika nalepke" className="max-h-32 min-h-0 w-full flex-1 rounded-md bg-white object-contain" />
        )}
      </label>

      {stanje.vrsta === "konec" && (
        <div className="flex flex-col gap-1 border-t border-ink-200 pt-2 text-xs">
          {stanje.vpisano.map(([p, v]) => (
            <span key={p} className="text-ok-600">
              ✓ {IMENA_POLJ[p]}: <strong>{v}</strong>
            </span>
          ))}
          {stanje.preskoceno.map(([p, v]) => (
            <span key={p} className="text-warn-700" title="Polje je že izpolnjeno, zato ni prepisano">
              Že izpolnjeno, ni prepisano – {IMENA_POLJ[p]}: <strong>{v}</strong>
            </span>
          ))}
          {stanje.vpisano.length + stanje.preskoceno.length < 3 && (
            <div className="mt-1 rounded-md bg-warn-50 p-2">
              <Nasveti naslov="Prebranih je malo podatkov. Poskusi znova z boljšo sliko:" />
            </div>
          )}
          {stanje.besedilo && (
            <details className="mt-1 text-ink-500">
              <summary className="cursor-pointer" title="Prikaži celotno besedilo, prebrano z nalepke">
                Prebrano besedilo
              </summary>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-ink-50 p-2 font-mono">
                {stanje.besedilo}
              </pre>
            </details>
          )}
        </div>
      )}
      {stanje.vrsta === "napaka" && <Nasveti naslov="Poskusi znova; za dobro branje:" />}
    </div>
  );
}
