"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { IconButton, Modal } from "@/components/ui";
import { prikazDatuma } from "@/lib/datum";
import { TRENUTNA_VERZIJA, VERZIJE } from "@/lib/verzije";

// Gumb "i" v glavi: popup z zgodovino sprememb in verzij (Esc, X ali klik na ozadje zapre)
export function InfoGumb() {
  const [odprt, setOdprt] = useState(false);
  return (
    <>
      <IconButton
        hint={`Prikaži verzije in spremembe (v${TRENUTNA_VERZIJA})`}
        icon={Info}
        onClick={() => setOdprt(true)}
      />
      <Modal open={odprt} title="Verzije in spremembe" onClose={() => setOdprt(false)} sirina="max-w-2xl">
        <div className="flex flex-col gap-5">
          {VERZIJE.map((v) => (
            <section key={v.verzija}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-base font-bold text-fines-500">Verzija {v.verzija}</h3>
                <span className="text-xs text-ink-500">{prikazDatuma(v.datum)}</span>
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-700">
                {v.spremembe.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Modal>
    </>
  );
}
