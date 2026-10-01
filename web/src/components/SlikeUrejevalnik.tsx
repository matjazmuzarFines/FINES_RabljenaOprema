"use client";

import { useRef, useState, useSyncExternalStore, type DragEvent, type ReactNode } from "react";
import { Camera, ImagePlus, Images, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Section, buttonClass } from "@/components/ui";
import { SLIKE_BUCKET } from "@/lib/config";
import { pripraviSliko } from "@/lib/pripraviSliko";
import { MESTA_SLIK, imeDatoteke, potSlike, type ObstojecaSlika, type VrstaSlike } from "@/lib/slike";
import { createClient } from "@/lib/supabase/client";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";

// Telefon/tablica (prst kot glavni kazalec): ponudimo Kamera + Galerija; na računalniku samo nalaganje datoteke.
const DOTIK = "(pointer: coarse)";
function useNapravaNaDotik() {
  return useSyncExternalStore(
    (obvesti) => {
      const mq = window.matchMedia(DOTIK);
      mq.addEventListener("change", obvesti);
      return () => mq.removeEventListener("change", obvesti);
    },
    () => window.matchMedia(DOTIK).matches,
    () => false,
  );
}

// Gumb pod sliko (zelen = shrani v bazo): na ozkih poljih samo ikona, na širših še besedilo
function GumbSlike({
  ikona,
  besedilo,
  namig,
  onClick,
  disabled,
}: {
  ikona: ReactNode;
  besedilo: string;
  namig: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={namig}
      aria-label={namig}
      className={`${buttonClass("ok", "sm")} min-w-0 flex-1`}
    >
      {ikona}
      <span className="hidden truncate @[15rem]:inline">{besedilo}</span>
    </button>
  );
}

/** Mreža slik opreme; vsaka slika se ob izbiri takoj naloži v Storage in zapiše v rbo_slike. */
export function SlikeUrejevalnik({
  idOprema,
  slike,
  vrste,
  naslov = "Slike",
  velika = "Predstavna",
  samoOgled = false,
}: {
  idOprema: number;
  slike: Partial<Record<VrstaSlike, ObstojecaSlika>>;
  vrste: VrstaSlike[];
  naslov?: string;
  velika?: VrstaSlike; // ta slika je čez celo širino
  samoOgled?: boolean; // brez pravic urejanja: slike se samo prikazujejo
}) {
  const [stanje, setStanje] = useState(slike);
  const nastavi = (vrsta: VrstaSlike, s: ObstojecaSlika | undefined) => setStanje((p) => ({ ...p, [vrsta]: s }));
  const mesta = MESTA_SLIK.filter((m) => vrste.includes(m.vrsta));

  return (
    <Section title={naslov}>
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        {samoOgled
          ? "Klikni sliko za ogled v polni velikosti."
          : "Slika se shrani takoj. Na računalniku jo lahko povlečeš na polje, na telefonu ali tablici jo posnameš s kamero."}
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {mesta.map((m) => (
          <MestoSlike
            key={m.vrsta}
            {...m}
            idOprema={idOprema}
            slika={stanje[m.vrsta]}
            onSpremeni={(s) => nastavi(m.vrsta, s)}
            velika={m.vrsta === velika || mesta.length === 1}
            samoOgled={samoOgled}
          />
        ))}
      </div>
    </Section>
  );
}

function MestoSlike({
  vrsta,
  naslov,
  namig,
  idOprema,
  slika,
  onSpremeni,
  velika,
  samoOgled,
}: {
  vrsta: VrstaSlike;
  naslov: string;
  namig: string;
  idOprema: number;
  slika: ObstojecaSlika | undefined;
  onSpremeni: (s: ObstojecaSlika | undefined) => void;
  velika: boolean;
  samoOgled: boolean;
}) {
  const vnos = useRef<HTMLInputElement>(null);
  const kamera = useRef<HTMLInputElement>(null);
  const dotik = useNapravaNaDotik();
  const [delam, setDelam] = useState<"nalagam" | "brisem" | null>(null);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [vlecem, setVlecem] = useState(false);
  const kaj = naslov.toLowerCase(); // npr. "predstavna slika", "slika 3", "slika krmiljenja"

  async function nalozi(datoteka: File | undefined) {
    if (!datoteka) return;
    if (!datoteka.type.startsWith("image/")) {
      setNapaka("Izbrana datoteka ni slika.");
      return;
    }
    setDelam("nalagam");
    setNapaka(null);
    try {
      const blob = await pripraviSliko(datoteka);
      const ime = imeDatoteke(idOprema, vrsta);
      const supabase = createClient();

      const up = await supabase.storage
        .from(SLIKE_BUCKET)
        .upload(potSlike(ime), blob, { upsert: true, contentType: "image/jpeg", cacheControl: "60" });
      if (up.error) throw new Error(`Nalaganje ni uspelo: ${up.error.message}`);

      const zapis = await supabase
        .from("rbo_slike")
        .upsert({ id_oprema: idOprema, vrsta_slike: vrsta, ime_slike: ime }, { onConflict: "id_oprema,vrsta_slike" });
      if (zapis.error) throw new Error(`Slika je naložena, zapis v bazo pa ni uspel: ${zapis.error.message}`);

      // Stara datoteka z drugačnim imenom (npr. .png) ni več v uporabi
      if (slika && slika.ime !== ime) await supabase.storage.from(SLIKE_BUCKET).remove([potSlike(slika.ime)]);

      onSpremeni({ ime, url: URL.createObjectURL(blob) });
    } catch (e) {
      setNapaka(e instanceof Error ? e.message : "Nalaganje ni uspelo.");
    } finally {
      setDelam(null);
      if (vnos.current) vnos.current.value = "";
      if (kamera.current) kamera.current.value = "";
    }
  }

  async function odstrani() {
    if (!slika || !confirm(`Odstranim sliko »${naslov}«?`)) return;
    setDelam("brisem");
    setNapaka(null);
    const supabase = createClient();
    const zapis = await supabase.from("rbo_slike").delete().eq("id_oprema", idOprema).eq("vrsta_slike", vrsta);
    if (zapis.error) {
      setNapaka(`Brisanje ni uspelo: ${zapis.error.message}`);
      setDelam(null);
      return;
    }
    await supabase.storage.from(SLIKE_BUCKET).remove([potSlike(slika.ime)]);
    onSpremeni(undefined);
    setDelam(null);
  }

  function spusti(e: DragEvent) {
    e.preventDefault();
    setVlecem(false);
    if (!samoOgled) nalozi(e.dataTransfer.files[0]);
  }

  const onemogoceno = !!delam || samoOgled;
  const namigUrejanja = (besedilo: string) => (samoOgled ? NAMIG_SAMO_OGLED : besedilo);

  return (
    <div className={`flex flex-col gap-2 ${velika ? "col-span-2 sm:col-span-3" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-ink">{naslov}</span>
        <span className="truncate text-xs text-ink-muted">{namig}</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!samoOgled) setVlecem(true);
        }}
        onDragLeave={() => setVlecem(false)}
        onDrop={spusti}
        className={`relative overflow-hidden rounded-lg border-2 bg-[#f1efec] ${velika ? "aspect-[16/10]" : "aspect-[4/3]"} ${
          vlecem ? "border-brand bg-brand-soft" : slika ? "border-transparent" : "border-dashed border-line"
        }`}
      >
        {slika?.url ? (
          <a href={slika.url} target="_blank" rel="noreferrer" title={`Odpri ${kaj} v polni velikosti`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- podpisani Supabase URL / lokalni predogled */}
            <img src={slika.url} alt={naslov} className="h-full w-full object-cover" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => vnos.current?.click()}
            disabled={samoOgled}
            title={namigUrejanja(`Naloži ${kaj} opreme`)}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-faint enabled:hover:text-brand disabled:cursor-not-allowed"
          >
            <ImagePlus size={velika ? 36 : 26} />
            <span className="text-xs font-medium">
              {slika ? "Slike ni v shrambi" : samoOgled ? "Ni slike" : "Dodaj sliko"}
            </span>
          </button>
        )}
        {delam && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="animate-spin text-brand" size={28} />
          </div>
        )}
      </div>

      <input ref={vnos} type="file" accept="image/*" className="hidden" onChange={(e) => nalozi(e.target.files?.[0])} />
      {/* capture: telefon/tablica odpre neposredno fotoaparat (zadnjo kamero) */}
      <input
        ref={kamera}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => nalozi(e.target.files?.[0])}
      />

      <div className="@container flex w-full gap-2">
        {dotik ? (
          <>
            <GumbSlike
              ikona={<Camera size={16} />}
              besedilo="Kamera"
              namig={namigUrejanja(`Posnemi ${kaj} opreme s fotoaparatom`)}
              disabled={onemogoceno}
              onClick={() => kamera.current?.click()}
            />
            <GumbSlike
              ikona={<Images size={16} />}
              besedilo="Galerija"
              namig={namigUrejanja(`Izberi ${kaj} opreme iz galerije`)}
              disabled={onemogoceno}
              onClick={() => vnos.current?.click()}
            />
          </>
        ) : (
          <GumbSlike
            ikona={slika ? <RefreshCw size={16} /> : <Upload size={16} />}
            besedilo={slika ? "Zamenjaj" : "Naloži"}
            namig={namigUrejanja(slika ? `Zamenjaj ${kaj} opreme` : `Naloži ${kaj} opreme`)}
            disabled={onemogoceno}
            onClick={() => vnos.current?.click()}
          />
        )}
        {slika && (
          <button
            type="button"
            disabled={onemogoceno}
            onClick={odstrani}
            title={namigUrejanja(`Odstrani ${kaj} opreme`)}
            aria-label={`Odstrani ${kaj} opreme`}
            className={buttonClass("danger", "iconSm")}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      {napaka && <p className="text-xs font-medium text-danger">{napaka}</p>}
    </div>
  );
}
