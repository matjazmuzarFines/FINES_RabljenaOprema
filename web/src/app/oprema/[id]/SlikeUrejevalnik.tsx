"use client";

import { useRef, useState, useSyncExternalStore, type DragEvent, type ReactNode } from "react";
import { Camera, ImagePlus, Images, Loader2, RefreshCw, Trash2, Upload } from "lucide-react";
import { Section, buttonClass } from "@/components/ui";
import { SLIKE_BUCKET } from "@/lib/config";
import { pripraviSliko } from "@/lib/pripraviSliko";
import { potSlike } from "@/lib/slike";
import { createClient } from "@/lib/supabase/client";

export type VrstaSlike = "Predstavna" | "Slika1" | "Slika2" | "Slika3" | "Slika4" | "Slika5" | "Slika6";
export type ObstojecaSlika = { ime: string; url: string | null };

const MESTA: { vrsta: VrstaSlike; naslov: string; namig: string }[] = [
  { vrsta: "Predstavna", naslov: "Predstavna slika", namig: "Zunanjost – zaprta peč" },
  { vrsta: "Slika1", naslov: "Slika 1", namig: "Notranjost" },
  { vrsta: "Slika2", naslov: "Slika 2", namig: "Serijska tablica" },
  { vrsta: "Slika3", naslov: "Slika 3", namig: "Dodatna slika" },
  { vrsta: "Slika4", naslov: "Slika 4", namig: "Dodatna slika" },
  { vrsta: "Slika5", naslov: "Slika 5", namig: "Dodatna slika" },
  { vrsta: "Slika6", naslov: "Slika 6", namig: "Dodatna slika" },
];

// Poimenovanje datotek kot v Power Apps / SharePoint: "{ID} - predstavna.jpg", "{ID} - Slika{n}.jpg"
const imeDatoteke = (id: number, vrsta: VrstaSlike) =>
  vrsta === "Predstavna" ? `${id} - predstavna.jpg` : `${id} - ${vrsta}.jpg`;

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

// Gumb pod sliko: na ozkih poljih samo ikona, na širših še besedilo
function GumbSlike({
  ikona,
  besedilo,
  onClick,
  disabled,
}: {
  ikona: ReactNode;
  besedilo: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={besedilo}
      aria-label={besedilo}
      className={`${buttonClass("neutral", "sm")} min-w-0 flex-1`}
    >
      {ikona}
      <span className="hidden truncate @[15rem]:inline">{besedilo}</span>
    </button>
  );
}

export function SlikeUrejevalnik({
  idOprema,
  slike,
}: {
  idOprema: number;
  slike: Partial<Record<VrstaSlike, ObstojecaSlika>>;
}) {
  const [stanje, setStanje] = useState(slike);
  const nastavi = (vrsta: VrstaSlike, s: ObstojecaSlika | undefined) => setStanje((p) => ({ ...p, [vrsta]: s }));

  return (
    <Section title="Slike">
      <p className="-mt-2 mb-4 text-sm text-ink-muted">
        Slika se shrani takoj. Na računalniku jo lahko povlečeš na polje, na telefonu ali tablici jo posnameš s kamero.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MESTA.map((m) => (
          <MestoSlike
            key={m.vrsta}
            {...m}
            idOprema={idOprema}
            slika={stanje[m.vrsta]}
            onSpremeni={(s) => nastavi(m.vrsta, s)}
            velika={m.vrsta === "Predstavna"}
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
}: {
  vrsta: VrstaSlike;
  naslov: string;
  namig: string;
  idOprema: number;
  slika: ObstojecaSlika | undefined;
  onSpremeni: (s: ObstojecaSlika | undefined) => void;
  velika: boolean;
}) {
  const vnos = useRef<HTMLInputElement>(null);
  const kamera = useRef<HTMLInputElement>(null);
  const dotik = useNapravaNaDotik();
  const [delam, setDelam] = useState<"nalagam" | "brisem" | null>(null);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [vlecem, setVlecem] = useState(false);

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
    nalozi(e.dataTransfer.files[0]);
  }

  return (
    <div className={`flex flex-col gap-2 ${velika ? "col-span-2 sm:col-span-3" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-ink">{naslov}</span>
        <span className="truncate text-xs text-ink-muted">{namig}</span>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setVlecem(true);
        }}
        onDragLeave={() => setVlecem(false)}
        onDrop={spusti}
        className={`relative overflow-hidden rounded-lg border-2 bg-[#f1efec] ${velika ? "aspect-[16/10]" : "aspect-[4/3]"} ${
          vlecem ? "border-brand bg-brand-soft" : slika ? "border-transparent" : "border-dashed border-line"
        }`}
      >
        {slika?.url ? (
          <a href={slika.url} target="_blank" rel="noreferrer" title="Odpri v polni velikosti">
            {/* eslint-disable-next-line @next/next/no-img-element -- podpisani Supabase URL / lokalni predogled */}
            <img src={slika.url} alt={naslov} className="h-full w-full object-cover" />
          </a>
        ) : (
          <button
            type="button"
            onClick={() => vnos.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-faint hover:text-brand"
          >
            <ImagePlus size={velika ? 36 : 26} />
            <span className="text-xs font-medium">{slika ? "Slike ni v shrambi" : "Dodaj sliko"}</span>
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
            <GumbSlike ikona={<Camera size={16} />} besedilo="Kamera" disabled={!!delam} onClick={() => kamera.current?.click()} />
            <GumbSlike ikona={<Images size={16} />} besedilo="Galerija" disabled={!!delam} onClick={() => vnos.current?.click()} />
          </>
        ) : (
          <GumbSlike
            ikona={slika ? <RefreshCw size={16} /> : <Upload size={16} />}
            besedilo={slika ? "Zamenjaj" : "Naloži"}
            disabled={!!delam}
            onClick={() => vnos.current?.click()}
          />
        )}
        {slika && (
          <button
            type="button"
            disabled={!!delam}
            onClick={odstrani}
            title="Odstrani sliko"
            aria-label="Odstrani sliko"
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
