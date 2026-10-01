"use client";

import Link from "next/link";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import { Calculator, Check, Save, TriangleAlert } from "lucide-react";
import { Button, Field, ScorePicker, Section, Select, TextArea, TextInput, buttonClass } from "@/components/ui";
import { ENOTE_MERE, STATUSI, type Sifranti } from "@/lib/sifranti";
import { danes } from "@/lib/datum";
import type { OpremaVrstica, ZapisKartoteke } from "@/lib/types";
import { shraniOpremo, type ShraniStanje } from "./actions";
import { Kartoteka } from "./Kartoteka";

const GARANCIJE = [0, 6, 12, 24, 36];
const oznakaGarancije = (m: number) =>
  m === 0 ? "Brez" : m % 12 === 0 ? `${m / 12} ${m === 12 ? "leto" : m === 24 ? "leti" : "leta"}` : `${m} mesecev`;

const niz = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function OpremaObrazec({
  oprema,
  sifranti,
  kartoteka,
}: {
  oprema?: OpremaVrstica;
  sifranti: Sifranti;
  kartoteka?: ZapisKartoteke[];
}) {
  const novo = !oprema;
  const [stanje, formAction, shranjujem] = useActionState<ShraniStanje, FormData>(shraniOpremo, {});
  const [, startTransition] = useTransition();
  const [ocena, setOcena] = useState<number | null>(oprema?.ocena ?? null);
  const [cenaNove, setCenaNove] = useState(niz(oprema?.cena_nove));
  const [rabat, setRabat] = useState(niz(oprema?.rabat_procent));
  const [prodajnaCena, setProdajnaCena] = useState(niz(oprema?.prodajna_cena));

  const n = (s: string) => Number(s.replace(",", "."));
  const izracunana =
    cenaNove && rabat && Number.isFinite(n(cenaNove)) && Number.isFinite(n(rabat))
      ? Math.round(n(cenaNove) * (1 - n(rabat) / 100) * 100) / 100
      : null;

  const garancije = [...new Set([...GARANCIJE, ...(oprema?.garancijski_rok_meseci != null ? [oprema.garancijski_rok_meseci] : [])])]
    .sort((a, b) => a - b)
    .map((m) => ({ value: String(m), label: oznakaGarancije(m) }));

  // Brez samodejnega ponastavljanja obrazca po oddaji (React to naredi pri <form action>), da vnosi ostanejo.
  function oddaj(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => formAction(fd));
  }

  const napaka = (k: string) => stanje.napake?.[k];
  const idProdaja = stanje.idProdaja ?? oprema?.id_prodaja;

  return (
    <form onSubmit={oddaj} className="flex flex-col gap-5" noValidate>
      <input type="hidden" name="id_oprema" value={niz(oprema?.id_oprema)} />
      <input type="hidden" name="id_prodaja" value={niz(idProdaja)} />

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
          <Field label="Garancijski rok" error={napaka("garancijski_rok_meseci")}>
            <Select
              name="garancijski_rok_meseci"
              options={garancije}
              placeholder="— izberi —"
              defaultValue={niz(oprema?.garancijski_rok_meseci)}
            />
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
              <Button
                type="button"
                variant="brand"
                size="icon"
                disabled={izracunana === null}
                title="Izračunaj prodajno ceno iz cene nove in rabata"
                onClick={() => izracunana !== null && setProdajnaCena(String(izracunana))}
              >
                <Calculator size={18} />
              </Button>
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

      <Kartoteka idOprema={oprema?.id_oprema} zacetniZapisi={kartoteka} />

      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-line bg-surface/95 px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.05)] backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        {stanje.sporocilo && (
          <p
            role="status"
            className={`flex items-center gap-2 text-sm font-medium ${stanje.ok ? "text-ok" : "text-ink"}`}
          >
            {stanje.ok ? <Check size={18} /> : <TriangleAlert size={18} className="text-warn" />}
            {stanje.sporocilo}
          </p>
        )}
        <div className="ml-auto flex gap-2">
          <Link
            href="/"
            className={buttonClass("brand")}
            title="Prekliči neshranjene spremembe in se vrni na seznam opreme"
          >
            Prekliči
          </Link>
          <Button
            type="submit"
            variant="ok"
            disabled={shranjujem}
            title={novo ? "Shrani novo rabljeno opremo v bazo" : "Shrani spremembe rabljene opreme"}
          >
            <Save size={18} />
            {shranjujem ? "Shranjujem ..." : novo ? "Dodaj opremo" : "Shrani"}
          </Button>
        </div>
      </div>
    </form>
  );
}
