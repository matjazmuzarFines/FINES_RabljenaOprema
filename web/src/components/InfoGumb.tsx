"use client";

import { useRef } from "react";
import { Info, X } from "lucide-react";
import { buttonClass } from "@/components/ui";
import { prikazDatuma } from "@/lib/datum";
import { TRENUTNA_VERZIJA, VERZIJE } from "@/lib/verzije";

// Gumb "i" v glavi: popup z zgodovino sprememb in verzij (Esc, X ali klik na ozadje zapre)
export function InfoGumb() {
  const okno = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => okno.current?.showModal()}
        className={buttonClass("brand", "icon")}
        title={`Verzija ${TRENUTNA_VERZIJA} – zgodovina sprememb`}
        aria-label="Prikaži zgodovino sprememb in verzij"
      >
        <Info size={20} />
      </button>
      <dialog
        ref={okno}
        onClick={(e) => e.target === e.currentTarget && okno.current?.close()}
        aria-label="Zgodovina sprememb"
        className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-xl bg-surface p-0 text-ink shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="border-l-4 border-brand pl-3 text-lg font-bold">Spremembe in verzije</h2>
          <button
            type="button"
            onClick={() => okno.current?.close()}
            className={buttonClass("brand", "iconSm")}
            title="Zapri zgodovino sprememb"
            aria-label="Zapri zgodovino sprememb"
          >
            <X size={18} />
          </button>
        </div>
        <ol className="flex max-h-[70dvh] flex-col gap-5 overflow-y-auto px-5 py-4">
          {VERZIJE.map((v) => (
            <li key={v.verzija}>
              <p className="flex items-baseline gap-2">
                <span className="text-base font-bold text-brand">{v.verzija}</span>
                <span className="text-sm text-ink-muted">{prikazDatuma(v.datum)}</span>
              </p>
              <ul className="mt-1.5 list-disc pl-5 text-[15px] leading-relaxed">
                {v.spremembe.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </dialog>
    </>
  );
}
