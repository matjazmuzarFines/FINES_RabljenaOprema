"use client";

import Link from "next/link";
import { useActionState, useTransition, type FormEvent } from "react";
import { Check, Save, TriangleAlert } from "lucide-react";
import { Button, Field, Section, TextArea, TextInput, buttonClass } from "@/components/ui";
import { shraniTehnicniList, type ShraniStanje } from "@/app/oprema/actions";
import { TL_SKLOPI, type TehnicniList } from "@/lib/types";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";

const niz = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function TehnicniListObrazec({
  idOprema,
  tl,
  nov,
  samoOgled = false,
}: {
  idOprema: number;
  tl: TehnicniList;
  nov: boolean;
  samoOgled?: boolean; // brez pravic urejanja: vsa polja onemogočena
}) {
  const [stanje, formAction, shranjujem] = useActionState<ShraniStanje, FormData>(shraniTehnicniList, {});
  const [, startTransition] = useTransition();

  // Brez samodejnega ponastavljanja obrazca po oddaji, da vnosi ostanejo
  function oddaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={oddaj} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="id_oprema" value={idOprema} />

      {nov && !samoOgled && (
        <p className="rounded-xl border border-warn bg-warn-soft px-4 py-3 text-[15px]">
          Tehnični list še ni shranjen. Osnovni podatki so predizpolnjeni iz opreme.
        </p>
      )}

      <fieldset disabled={samoOgled} className="contents">
      {TL_SKLOPI.map((sklop) => (
        <Section key={sklop.naslov} title={sklop.naslov}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {sklop.polja.map((p) => (
              <Field key={p.kljuc} label={p.oznaka} error={stanje.napake?.[p.kljuc]}>
                <TextInput
                  name={p.kljuc}
                  defaultValue={niz(tl[p.kljuc])}
                  placeholder={p.namig}
                  inputMode={p.kljuc === "leto_izdelave" ? "numeric" : undefined}
                />
              </Field>
            ))}
          </div>
        </Section>
      ))}

      <Section title="Opis">
        <Field label="Opis opreme">
          <TextArea name="opis" rows={6} defaultValue={niz(tl.opis)} placeholder="Dodatni opis, posebnosti, oprema ..." />
        </Field>
      </Section>
      </fieldset>

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        {stanje.sporocilo && (
          <p role="status" className={`flex items-center gap-2 text-sm font-medium ${stanje.ok ? "text-ok" : "text-ink"}`}>
            {stanje.ok ? <Check size={18} /> : <TriangleAlert size={18} className="text-warn" />}
            {stanje.sporocilo}
          </p>
        )}
        <div className="ml-auto flex gap-2">
          <Link
            href={`/oprema/${idOprema}`}
            className={buttonClass("brand")}
            title="Prekliči neshranjene spremembe in se vrni na urejanje opreme"
          >
            Prekliči
          </Link>
          <Button
            type="submit"
            variant="ok"
            disabled={shranjujem || samoOgled}
            title={samoOgled ? NAMIG_SAMO_OGLED : "Shrani tehnični list opreme"}
          >
            <Save size={18} />
            {shranjujem ? "Shranjujem ..." : "Shrani"}
          </Button>
        </div>
      </div>
    </form>
  );
}
