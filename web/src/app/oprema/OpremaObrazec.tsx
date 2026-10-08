"use client";

import { useActionState, useRef, useState, useTransition, type FormEvent } from "react";
import { Calculator } from "lucide-react";
import {
  DaNe,
  Field,
  IconButton,
  Lestvica,
  SaveBar,
  ScorePicker,
  Section,
  Select,
  TextArea,
  TextInput,
  useSpremembeObrazca,
} from "@/components/ui";
import { ENOTE_MERE, GARANCIJE, STATUSI, type Sifranti } from "@/lib/sifranti";
import { danes } from "@/lib/datum";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";
import type { OpremaVrstica, ZapisKartoteke } from "@/lib/types";
import { shraniOpremo, type ShraniStanje } from "./actions";
import { Kartoteka } from "./Kartoteka";

const GARANCIJE_MOZNOSTI = GARANCIJE.map((m) => ({ value: m as number, label: `${m} mes.`, hint: `Garancija ${m} mesecev` }));

const niz = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function OpremaObrazec({
  oprema,
  sifranti,
  kartoteka,
  samoOgled = false,
}: {
  oprema?: OpremaVrstica;
  sifranti: Sifranti;
  kartoteka?: ZapisKartoteke[];
  samoOgled?: boolean; // uporabnik brez pravic urejanja: vsa polja in gumbi za urejanje so onemogočeni
}) {
  const novo = !oprema;
  const [, startTransition] = useTransition();
  const [ocena, setOcena] = useState<number | null>(oprema?.ocena ?? null);
  const [cenaNove, setCenaNove] = useState(niz(oprema?.cena_nove));
  const [rabat, setRabat] = useState(niz(oprema?.rabat_procent));
  const [prodajnaCena, setProdajnaCena] = useState(niz(oprema?.prodajna_cena));
  const zacetnaGarancija = oprema?.garancijski_rok_meseci ?? 0;
  const [imaGarancijo, setImaGarancijo] = useState(zacetnaGarancija > 0);
  const [garancija, setGarancija] = useState<number | null>(zacetnaGarancija > 0 ? zacetnaGarancija : null);
  const obrazec = useRef<HTMLFormElement>(null);
  const spremembe = useSpremembeObrazca(obrazec, [ocena, prodajnaCena, imaGarancijo, garancija]);
  // Po uspešnem shranjevanju so trenutne vrednosti novo izhodišče
  const [stanje, formAction, shranjujem] = useActionState<ShraniStanje, FormData>(async (prej, fd) => {
    const r = await shraniOpremo(prej, fd);
    if (r.ok) spremembe.potrdi();
    return r;
  }, {});

  // Prekliči: vrni vsa polja na zadnje shranjene vrednosti
  function ponastavi() {
    obrazec.current?.reset();
    setOcena(oprema?.ocena ?? null);
    setCenaNove(niz(oprema?.cena_nove));
    setRabat(niz(oprema?.rabat_procent));
    setProdajnaCena(niz(oprema?.prodajna_cena));
    setImaGarancijo(zacetnaGarancija > 0);
    setGarancija(zacetnaGarancija > 0 ? zacetnaGarancija : null);
    requestAnimationFrame(spremembe.preracunaj);
  }

  const n = (s: string) => Number(s.replace(",", "."));
  const izracunana =
    cenaNove && rabat && Number.isFinite(n(cenaNove)) && Number.isFinite(n(rabat))
      ? Math.round(n(cenaNove) * (1 - n(rabat) / 100) * 100) / 100
      : null;

  // Brez samodejnega ponastavljanja obrazca po oddaji (React to naredi pri <form action>), da vnosi ostanejo.
  function oddaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  const napaka = (k: string) => stanje.napake?.[k];
  const idProdaja = stanje.idProdaja ?? oprema?.id_prodaja;

  return (
    <form ref={obrazec} onSubmit={oddaj} onChange={spremembe.preracunaj} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="id_oprema" value={niz(oprema?.id_oprema)} />
      <input type="hidden" name="id_prodaja" value={niz(idProdaja)} />

      {/* fieldset disabled onemogoči vsa polja in gumbe v razdelkih (display: contents ohrani postavitev) */}
      <fieldset disabled={samoOgled} className="contents">
      <Section title="Osnovni podatki">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <Field label="Naziv opreme" required error={napaka("oprema_naziv")} className="sm:col-span-2 2xl:col-span-3">
            <TextInput name="oprema_naziv" defaultValue={niz(oprema?.oprema_naziv)} placeholder="npr. FBM 40" required />
          </Field>
          <Field label="Ident (koda)">
            <TextInput name="koda" defaultValue={niz(oprema?.koda)} placeholder="npr. 100-601.1014" />
          </Field>
          <Field label="Serijska številka">
            <TextInput name="serijska_stevilka" defaultValue={niz(oprema?.serijska_stevilka)} placeholder="npr. 24.1234.123" />
          </Field>
          <Field label="Skupina opreme">
            <Select
              name="skupina_opreme"
              options={sifranti.skupina}
              placeholder="— izberi —"
              defaultValue={niz(oprema?.skupina_opreme)}
            />
          </Field>
          <Field label="Leto proizvodnje" error={napaka("leto_proizvodnje")}>
            <TextInput
              name="leto_proizvodnje"
              inputMode="numeric"
              defaultValue={niz(oprema?.leto_proizvodnje)}
              placeholder="npr. 2018"
            />
          </Field>
          <Field label="Datum prejema">
            <TextInput type="date" name="datum_prejema" defaultValue={oprema ? niz(oprema.datum_prejema) : danes()} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Količina" error={napaka("kolicina")}>
              <TextInput name="kolicina" inputMode="numeric" defaultValue={niz(oprema?.kolicina ?? 1)} />
            </Field>
            <Field label="EM">
              <Select name="em" options={ENOTE_MERE} placeholder="—" defaultValue={oprema ? niz(oprema.em) : "kos"} />
            </Field>
          </div>
        </div>
      </Section>

      <Section title="Stanje in lokacija">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Ocena stanja" error={napaka("ocena")} group className="sm:col-span-2">
            <ScorePicker name="ocena" value={ocena} onChange={setOcena} />
          </Field>
          <Field label="Lastništvo">
            <Select name="lastnistvo" options={sifranti.lastnistvo} placeholder="— izberi —" defaultValue={niz(oprema?.lastnistvo)} />
          </Field>
          <Field label="Skladišče">
            <Select name="skladisce" options={sifranti.skladisce} placeholder="— izberi —" defaultValue={niz(oprema?.skladisce)} />
          </Field>
          <Field label="Komentar" className="sm:col-span-2">
            <TextArea name="komentar" defaultValue={niz(oprema?.komentar)} placeholder="Stanje, posebnosti, kaj je treba urediti ..." />
          </Field>
        </div>
      </Section>

      <Section title="Prodaja">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          <Field label="Status prodaje" error={napaka("status_prodaje")}>
            <Select name="status_prodaje" options={[...STATUSI]} placeholder="— izberi —" defaultValue={niz(oprema?.status_prodaje)} />
          </Field>
          <Field label="Imenovani prodajalec">
            <Select
              name="imenovani_prodajalec"
              options={sifranti.prodajalec}
              placeholder="— izberi —"
              defaultValue={niz(oprema?.imenovani_prodajalec)}
            />
          </Field>
          <Field label="Garancija" error={napaka("garancijski_rok_meseci")} group className="sm:col-span-2 2xl:col-span-3">
            {/* NE = 0 mesecev; DA brez izbranega roka = prazno (napaka ob shranjevanju) */}
            <input type="hidden" name="garancijski_rok_meseci" value={imaGarancijo ? niz(garancija) : "0"} />
            <div className="flex flex-wrap items-center gap-3">
              <DaNe
                label="Ali ima oprema garancijo"
                value={imaGarancijo}
                onChange={setImaGarancijo}
                hintDa="Oprema ima garancijo - izberi rok"
                hintNe="Oprema nima garancije"
              />
              <Lestvica
                label="Garancijski rok"
                options={GARANCIJE_MOZNOSTI}
                value={garancija}
                onChange={setGarancija}
                zaklenjeno={!imaGarancijo}
                zaklenjenoHint="Za izbiro roka najprej izberi DA"
              />
              {imaGarancijo && garancija !== null && !(GARANCIJE as readonly number[]).includes(garancija) && (
                <span className="text-sm text-ink-500">Trenutno {garancija} mesecev</span>
              )}
            </div>
          </Field>
          <Field label="Cena nove (€)" error={napaka("cena_nove")}>
            <TextInput name="cena_nove" inputMode="decimal" value={cenaNove} onChange={(e) => setCenaNove(e.target.value)} />
          </Field>
          <Field label="Rabat (%)" error={napaka("rabat_procent")}>
            <TextInput name="rabat_procent" inputMode="decimal" value={rabat} onChange={(e) => setRabat(e.target.value)} />
          </Field>
          <Field label="Prodajna cena (€)" error={napaka("prodajna_cena")}>
            <div className="flex gap-2">
              <TextInput
                name="prodajna_cena"
                inputMode="decimal"
                value={prodajnaCena}
                onChange={(e) => setProdajnaCena(e.target.value)}
                placeholder={izracunana !== null ? `izračun: ${izracunana}` : ""}
              />
              <IconButton
                variant="primary"
                icon={Calculator}
                disabled={izracunana === null}
                hint="Izračunaj prodajno ceno iz cene in rabata"
                onClick={() => izracunana !== null && setProdajnaCena(String(izracunana))}
              />
            </div>
          </Field>
          <Field label="Datum prodaje">
            <TextInput type="date" name="datum_prodaje" defaultValue={niz(oprema?.datum_prodaje)} />
          </Field>
          <Field label="Komentar ob prodaji" className="sm:col-span-2 2xl:col-span-3">
            <TextArea name="komentar_ob_prodaji" rows={3} defaultValue={niz(oprema?.komentar_ob_prodaji)} />
          </Field>
        </div>
      </Section>
      </fieldset>

      <Kartoteka idOprema={oprema?.id_oprema} zacetniZapisi={kartoteka} samoOgled={samoOgled} />

      <SaveBar
        steviloSprememb={spremembe.stevilo}
        shranjujem={shranjujem}
        onReset={ponastavi}
        sporocilo={stanje.sporocilo ? { ok: !!stanje.ok, besedilo: stanje.sporocilo } : undefined}
        shraniLabel={novo ? "Dodaj opremo" : "Shrani"}
        shraniHint={novo ? "Shrani novo rabljeno opremo v bazo" : "Shrani spremembe rabljene opreme"}
        onemogoceno={samoOgled ? NAMIG_SAMO_OGLED : undefined}
      />
    </form>
  );
}
