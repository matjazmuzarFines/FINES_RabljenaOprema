"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CheckCircle2, RotateCcw, Save, TriangleAlert } from "lucide-react";
import { useNeshranjeno } from "@/lib/neshranjeno";
import { Button } from "./Button";

function vrednostiObrazca(obrazec: HTMLFormElement | null) {
  const m = new Map<string, string>();
  if (!obrazec) return m;
  for (const [k, v] of new FormData(obrazec)) {
    if (typeof v === "string") m.set(k, m.has(k) ? `${m.get(k)}\n${v}` : v);
  }
  return m;
}

/**
 * Šteje spremenjena polja obrazca glede na stanje ob nalaganju (ali zadnjem shranjevanju)
 * in ob odhodu s strani opozori na neshranjene spremembe.
 * - preracunaj: pokliči ob onChange obrazca (samodejno tudi ob spremembi `odvisnosti`)
 * - potrdi: po uspešnem shranjevanju (trenutne vrednosti postanejo izhodišče)
 */
export function useSpremembeObrazca(obrazec: RefObject<HTMLFormElement | null>, odvisnosti: unknown[] = []) {
  const izhodisce = useRef<Map<string, string> | null>(null);
  const [stevilo, setStevilo] = useState(0);

  function preracunaj() {
    if (!izhodisce.current) return;
    const zdaj = vrednostiObrazca(obrazec.current);
    let n = 0;
    for (const k of new Set([...izhodisce.current.keys(), ...zdaj.keys()])) {
      if ((izhodisce.current.get(k) ?? "") !== (zdaj.get(k) ?? "")) n++;
    }
    setStevilo(n);
  }

  function potrdi() {
    izhodisce.current = vrednostiObrazca(obrazec.current);
    setStevilo(0);
  }

  useEffect(() => {
    izhodisce.current = vrednostiObrazca(obrazec.current);
  }, [obrazec]);

  // Polja, ki jih nastavi koda (skrita polja, izračun) - onChange se ne sproži
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => preracunaj(), odvisnosti);

  useNeshranjeno(stevilo > 0);
  return { stevilo, preracunaj, potrdi };
}

/**
 * Spodnja lepljiva vrstica obrazca: število neshranjenih sprememb, Prekliči (neutral) in Shrani (zelen).
 * Gumb Shrani je submit gumb obrazca, v katerem je vrstica.
 */
export function SaveBar({
  steviloSprememb,
  shranjujem,
  onReset,
  sporocilo,
  shraniLabel = "Shrani",
  shraniHint,
  onemogoceno,
  shraniBrezSprememb,
}: {
  steviloSprememb: number;
  shranjujem: boolean;
  onReset: () => void;
  /** Rezultat zadnjega shranjevanja. */
  sporocilo?: { ok: boolean; besedilo: string };
  shraniLabel?: string;
  shraniHint: string;
  /** Razlog, zakaj shranjevanje ni mogoče (npr. samo ogled) - prikaže se kot hover tekst. */
  onemogoceno?: string;
  /** Shrani je omogočen tudi brez sprememb (npr. nov zapis s predizpolnjenimi podatki). */
  shraniBrezSprememb?: boolean;
}) {
  const imaSpremembe = steviloSprememb > 0;
  return (
    <div className="sticky bottom-0 z-30 flex flex-wrap items-center gap-3 rounded-xl border border-ink-200 bg-white/95 px-3 py-3 shadow-[0_-2px_8px_rgb(0_0_0/0.06)] backdrop-blur sm:px-4">
      <span className="flex min-w-0 flex-1 items-center gap-2 text-sm">
        {imaSpremembe ? (
          <strong className="text-warn-700">Neshranjene spremembe: {steviloSprememb}</strong>
        ) : sporocilo ? (
          <span role="status" className={`flex items-center gap-2 font-semibold ${sporocilo.ok ? "text-ok-600" : "text-nok-600"}`}>
            {sporocilo.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <TriangleAlert className="h-4 w-4 shrink-0" />}
            {sporocilo.besedilo}
          </span>
        ) : (
          <span className="text-ink-500">Ni neshranjenih sprememb</span>
        )}
      </span>
      {imaSpremembe && sporocilo && !sporocilo.ok && (
        <span role="alert" className="flex w-full items-center gap-2 text-sm font-semibold text-nok-600 sm:order-first sm:w-auto">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          {sporocilo.besedilo}
        </span>
      )}
      <Button
        hint="Zavrzi neshranjene spremembe"
        variant="neutral"
        icon={RotateCcw}
        disabled={!imaSpremembe || shranjujem}
        onClick={onReset}
      >
        Prekliči
      </Button>
      <Button
        type="submit"
        hint={onemogoceno ?? shraniHint}
        variant="success"
        icon={Save}
        disabled={(!imaSpremembe && !shraniBrezSprememb) || shranjujem || !!onemogoceno}
      >
        {shranjujem ? "Shranjujem ..." : shraniLabel}
      </Button>
    </div>
  );
}
