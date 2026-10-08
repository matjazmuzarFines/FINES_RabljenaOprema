"use client";

import { useActionState, useRef, useTransition, type FormEvent } from "react";
import { Field, SaveBar, Section, TextArea, TextInput, WarningText, useSpremembeObrazca } from "@/components/ui";
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
  const [, startTransition] = useTransition();
  const obrazec = useRef<HTMLFormElement>(null);
  const spremembe = useSpremembeObrazca(obrazec);
  // Po uspešnem shranjevanju so trenutne vrednosti novo izhodišče
  const [stanje, formAction, shranjujem] = useActionState<ShraniStanje, FormData>(async (prej, fd) => {
    const r = await shraniTehnicniList(prej, fd);
    if (r.ok) spremembe.potrdi();
    return r;
  }, {});

  function ponastavi() {
    obrazec.current?.reset();
    requestAnimationFrame(spremembe.preracunaj);
  }

  // Brez samodejnega ponastavljanja obrazca po oddaji, da vnosi ostanejo
  function oddaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  return (
    <form ref={obrazec} onSubmit={oddaj} onChange={spremembe.preracunaj} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id_oprema" value={idOprema} />

      {nov && !samoOgled && (
        <WarningText>Tehnični list še ni shranjen. Osnovni podatki so predizpolnjeni iz opreme.</WarningText>
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

      <SaveBar
        steviloSprememb={spremembe.stevilo}
        shranjujem={shranjujem}
        onReset={ponastavi}
        sporocilo={stanje.sporocilo ? { ok: !!stanje.ok, besedilo: stanje.sporocilo } : undefined}
        shraniHint="Shrani tehnični list opreme"
        shraniBrezSprememb={nov}
        onemogoceno={samoOgled ? NAMIG_SAMO_OGLED : undefined}
      />
    </form>
  );
}
