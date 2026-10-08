// Status prodaje (značka in barve kartic-filtrov), ocena stanja 1-5 in znak garancije.

import { ShieldCheck } from "lucide-react";
import { NAJVISJA_OCENA, opisOcene } from "@/lib/sifranti";
import type { KarticaBarva } from "./FilterKartica";
import { Lestvica } from "./Izbira";

export const BREZ_STATUSA = "Brez statusa";

type StatusBarve = { znacka: string; kartica: KarticaBarva };

// Barve statusov (prevzete iz Power Apps, preslikane na barvne žetone Fines)
const STATUSI: Record<string, StatusBarve> = {
  "0. NI ZA PRODAJO": {
    znacka: "bg-nok-500 text-white",
    kartica: { trak: "bg-nok-500", aktivna: "border-nok-500 bg-nok-50", ikona: "text-nok-500" },
  },
  "1. NI UREJENO ZA PRODAJO": {
    znacka: "bg-warn-400 text-ink-900",
    kartica: { trak: "bg-warn-400", aktivna: "border-warn-500 bg-warn-50", ikona: "text-warn-500" },
  },
  "2. NEPRODANO": {
    znacka: "bg-fines-500 text-white",
    kartica: { trak: "bg-fines-500", aktivna: "border-fines-500 bg-fines-50", ikona: "text-fines-500" },
  },
  "3. PRODANO": {
    znacka: "bg-ink-500 text-white",
    kartica: { trak: "bg-ink-500", aktivna: "border-ink-500 bg-ink-100", ikona: "text-ink-600" },
  },
  "4. POSOJENO": {
    znacka: "bg-sync-500 text-white",
    kartica: { trak: "bg-sync-500", aktivna: "border-sync-500 bg-sync-50", ikona: "text-sync-500" },
  },
};

const PRIVZETO: StatusBarve = {
  znacka: "border border-ink-200 bg-white text-ink-600",
  kartica: { trak: "bg-ink-300", aktivna: "border-ink-400 bg-ink-100", ikona: "text-ink-500" },
};

/** "2. NEPRODANO" -> "NEPRODANO" */
export const imeStatusa = (status: string | null) => (status ? status.replace(/^\d+\.\s*/, "") : BREZ_STATUSA);

export const barvaStatusaKartice = (status: string | null) => (STATUSI[status ?? ""] ?? PRIVZETO).kartica;

export function StatusBadge({ status }: { status: string | null }) {
  return (
    <span
      title={`Status prodaje: ${imeStatusa(status).toLowerCase()}`}
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold tracking-wide ${
        (STATUSI[status ?? ""] ?? PRIVZETO).znacka
      }`}
    >
      {imeStatusa(status)}
    </span>
  );
}

// Izbira ocene stanja 1–5 (lestvica) z opisom ocene desno; vrednost gre v skrito polje obrazca
export function ScorePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <input type="hidden" name={name} value={value ?? ""} />
      <Lestvica
        label="Ocena stanja"
        kumulativno
        value={value}
        onChange={(v) => onChange(v === value ? null : v)}
        options={OCENE_MOZNOSTI.map((m) => ({
          ...m,
          hint: m.value === value ? "Odstrani oceno stanja" : m.hint,
        }))}
      />
      <span className={`text-sm ${value ? "font-semibold text-ink-900" : "text-ink-500"}`}>
        {value ? opisOcene(value) : "Brez ocene"}
      </span>
    </div>
  );
}

const OCENE_MOZNOSTI = Array.from({ length: NAJVISJA_OCENA }, (_, i) => i + 1).map((i) => ({
  value: i,
  label: String(i),
  hint: `Ocena ${i}: ${opisOcene(i).toLowerCase()}`,
}));

// Ocena stanja 1–5 (črtice, številka in opis ocene)
export function Score({ value }: { value: number | null }) {
  return (
    <span
      className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5"
      title={value ? `Ocena stanja ${value} od ${NAJVISJA_OCENA}: ${opisOcene(value).toLowerCase()}` : "Oprema nima ocene stanja"}
    >
      {OCENE_MOZNOSTI.map(({ value: i }) => (
        <span key={i} className={`h-2.5 w-4 rounded-sm ${value && i <= value ? "bg-fines-500" : "bg-ink-200"}`} />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-ink-900">{value ?? "–"}</span>
      {value && <span className="ml-1.5 text-xs text-ink-500">{opisOcene(value)}</span>}
    </span>
  );
}

/** Znak garancije (moder pečat z ščitom in številom mesecev). Brez garancije se ne prikaže. */
export function GarancijaZnak({ meseci, className = "" }: { meseci: number | null; className?: string }) {
  if (!meseci) return null;
  return (
    <span
      title={`Garancija ${meseci} mesecev`}
      className={`flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-white bg-sync-500 text-white shadow-md ring-2 ring-sync-500/40 ${className}`}
    >
      <ShieldCheck className="h-5 w-5" aria-hidden />
      <span className="text-[11px] font-bold leading-tight">{meseci} mes.</span>
    </span>
  );
}
