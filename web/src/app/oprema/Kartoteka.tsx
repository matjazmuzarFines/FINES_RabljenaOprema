"use client";

import { useState, useTransition } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { PdfGumb } from "@/components/PdfGumb";
import { Button, ErrorText, Field, FilterPolje, IconButton, Section, TextArea, TextInput } from "@/components/ui";
import { danes, prikazDatuma } from "@/lib/datum";
import type { ZapisKartoteke } from "@/lib/types";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";
import { dodajZapisKartoteke, izbrisiKartoteko, izbrisiZapisKartoteke } from "./actions";

const evri = (n: number) => n.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

// Najnovejši zgoraj; pri enakem datumu kasneje dodan zgoraj
const urejeno = (zapisi: ZapisKartoteke[]) =>
  zapisi
    .map((z, i) => ({ z, i }))
    .sort((a, b) => b.z.datum_vnosa.localeCompare(a.z.datum_vnosa) || (b.z.id ?? b.i) - (a.z.id ?? a.i))
    .map(({ z }) => z);

/**
 * Kartoteka opreme.
 * - Obstoječa oprema (podan idOprema): "Dodaj zapis" takoj shrani v bazo; na voljo je prenos PDF.
 * - Nova oprema: zapisi so lokalni v skritem polju "kartoteka" in se shranijo skupaj z opremo.
 */
export function Kartoteka({
  idOprema,
  zacetniZapisi = [],
  samoOgled = false,
}: {
  idOprema?: number;
  zacetniZapisi?: ZapisKartoteke[];
  samoOgled?: boolean; // brez pravic urejanja: samo pregled in PDF
}) {
  const [zapisi, setZapisi] = useState(zacetniZapisi);
  const [datum, setDatum] = useState(danes);
  const [besedilo, setBesedilo] = useState("");
  const [strosek, setStrosek] = useState("");
  const [napaka, setNapaka] = useState<string | null>(null);
  const [shranjujem, startShranjevanje] = useTransition();
  const lokalno = idOprema === undefined;

  function dodaj() {
    setNapaka(null);
    if (!datum) return setNapaka("Vnesi datum.");
    if (!besedilo.trim()) return setNapaka("Vnesi besedilo zapisa.");
    const s = strosek.trim() === "" ? null : Number(strosek.replace(",", "."));
    if (s !== null && (!Number.isFinite(s) || s < 0)) return setNapaka("Strošek mora biti pozitivno število.");

    const pocisti = () => {
      setBesedilo("");
      setStrosek("");
    };
    if (lokalno) {
      setZapisi((z) => [...z, { datum_vnosa: datum, besedilo_vnosa: besedilo.trim(), strosek: s }]);
      pocisti();
      return;
    }
    startShranjevanje(async () => {
      const r = await dodajZapisKartoteke(idOprema, datum, besedilo, s);
      if (r.napaka || !r.zapis) return setNapaka(r.napaka ?? "Zapis ni shranjen.");
      setZapisi((z) => [...z, r.zapis!]);
      pocisti();
    });
  }

  function izbrisiZapis(z: ZapisKartoteke) {
    const kratko = z.besedilo_vnosa.length > 60 ? `${z.besedilo_vnosa.slice(0, 60)} ...` : z.besedilo_vnosa;
    if (!confirm(`Izbrišem zapis z dne ${prikazDatuma(z.datum_vnosa)}?\n\n${kratko}`)) return;
    setNapaka(null);
    if (lokalno || z.id === undefined) {
      setZapisi((vsi) => vsi.filter((x) => x !== z));
      return;
    }
    const id = z.id;
    startShranjevanje(async () => {
      const r = await izbrisiZapisKartoteke(id);
      if (r.napaka) return setNapaka(r.napaka);
      setZapisi((vsi) => vsi.filter((x) => x.id !== id));
    });
  }

  function izbrisiVse() {
    if (!confirm(`Izbrišem celotno kartoteko opreme (${zapisi.length} zapisov)?`)) return;
    setNapaka(null);
    if (idOprema === undefined) {
      setZapisi([]);
      return;
    }
    startShranjevanje(async () => {
      const r = await izbrisiKartoteko(idOprema);
      if (r.napaka) return setNapaka(r.napaka);
      setZapisi([]);
    });
  }

  const prikaz = urejeno(zapisi);
  const skupaj = zapisi.reduce((v, z) => v + (z.strosek ?? 0), 0);

  return (
    <Section
      title="Kartoteka opreme"
      actions={
        <div className="flex items-end gap-2">
          {idOprema !== undefined && (
            <FilterPolje label="Izvoz">
              <PdfGumb
                vrsta="kartoteka"
                idOprema={idOprema}
                disabled={zapisi.length === 0}
                namig={zapisi.length === 0 ? "Kartoteka opreme nima zapisov" : undefined}
              />
            </FilterPolje>
          )}
          <Button
            variant="danger"
            icon={Trash2}
            onClick={izbrisiVse}
            disabled={shranjujem || zapisi.length === 0 || samoOgled}
            hint={samoOgled ? NAMIG_SAMO_OGLED : "Izbriši celotno kartoteko opreme (vse zapise)"}
          >
            Izbriši
          </Button>
        </div>
      }
    >
      {lokalno && <input type="hidden" name="kartoteka" value={JSON.stringify(zapisi)} />}

      {/* Vnosna polja nimajo atributa name, zato se ne oddajo z obrazcem opreme */}
      <fieldset disabled={samoOgled} className="contents">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-[12rem_12rem_minmax(0,1fr)]">
        <Field label="Datum vnosa">
          <TextInput type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </Field>
        <Field label="Strošek (€)">
          <TextInput inputMode="decimal" value={strosek} onChange={(e) => setStrosek(e.target.value)} placeholder="0,00" />
        </Field>
        <Field label="Zapis v kartoteko" className="col-span-full">
          <TextArea
            rows={3}
            value={besedilo}
            onChange={(e) => setBesedilo(e.target.value)}
            placeholder="Kaj se je zgodilo z opremo (servis, posoja, ogled kupca, menjava dela ...)"
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        {napaka && (
          <div className="mr-auto">
            <ErrorText>{napaka}</ErrorText>
          </div>
        )}
        {!napaka && lokalno && zapisi.length > 0 && (
          <p className="mr-auto text-sm text-ink-500">Zapisi se shranijo skupaj z opremo.</p>
        )}
        <Button
          variant="success"
          icon={Plus}
          onClick={dodaj}
          disabled={shranjujem}
          hint={
            samoOgled
              ? NAMIG_SAMO_OGLED
              : lokalno
                ? "Dodaj zapis v kartoteko (shrani se skupaj z novo opremo)"
                : "Dodaj in shrani zapis v kartoteko opreme"
          }
        >
          {shranjujem ? "Shranjujem ..." : "Dodaj zapis"}
        </Button>
      </div>
      </fieldset>

      <div className="mt-5 border-t border-ink-200 pt-4">
        {skupaj > 0 && (
          <p className="mb-3 text-sm text-ink-500">
            Skupni stroški: <strong className="tabular-nums text-ink-900">{evri(skupaj)}</strong>
          </p>
        )}
        {prikaz.length === 0 ? (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-ink-500">
            <History size={18} /> V kartoteki še ni zapisov.
          </p>
        ) : (
          <ol className="max-h-[28rem] overflow-y-auto pr-2">
            {prikaz.map((z, i) => (
              <li key={z.id ?? `lokalno-${i}`} className="relative flex gap-4 pb-5 last:pb-1">
                {/* časovnica: pika + navpična črta */}
                <div className="relative flex w-3 shrink-0 justify-center">
                  <span className="z-10 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-fines-500 ring-2 ring-fines-200" />
                  {i < prikaz.length - 1 && <span className="absolute bottom-[-0.25rem] top-4 w-0.5 bg-ink-200" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-ink-900">
                    {prikazDatuma(z.datum_vnosa)}
                    {z.strosek != null && (
                      <span className="rounded bg-fines-50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-fines-700">
                        Strošek: {evri(z.strosek)}
                      </span>
                    )}
                    {!z.id && (
                      <span className="rounded bg-warn-50 px-1.5 py-0.5 text-xs font-semibold text-warn-700">ni še shranjeno</span>
                    )}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-ink-900">{z.besedilo_vnosa}</p>
                </div>
                <IconButton
                  variant="danger"
                  icon={Trash2}
                  onClick={() => izbrisiZapis(z)}
                  disabled={shranjujem || samoOgled}
                  hint={samoOgled ? NAMIG_SAMO_OGLED : `Izbriši zapis z dne ${prikazDatuma(z.datum_vnosa)}`}
                />
              </li>
            ))}
          </ol>
        )}
      </div>
    </Section>
  );
}
