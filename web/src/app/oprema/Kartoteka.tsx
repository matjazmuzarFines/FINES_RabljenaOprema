"use client";

import { useState, useTransition } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { PdfGumb } from "@/components/PdfGumb";
import { Button, Field, Section, TextArea, TextInput } from "@/components/ui";
import { danes, prikazDatuma } from "@/lib/datum";
import type { ZapisKartoteke } from "@/lib/types";
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
export function Kartoteka({ idOprema, zacetniZapisi = [] }: { idOprema?: number; zacetniZapisi?: ZapisKartoteke[] }) {
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
        <div className="flex items-center gap-2">
          {idOprema !== undefined && (
            <PdfGumb
              vrsta="kartoteka"
              idOprema={idOprema}
              disabled={zapisi.length === 0}
              namig={zapisi.length === 0 ? "Kartoteka opreme nima zapisov" : undefined}
            />
          )}
          <Button
            type="button"
            variant="danger"
            onClick={izbrisiVse}
            disabled={shranjujem || zapisi.length === 0}
            title="Izbriši celotno kartoteko opreme (vse zapise)"
          >
            <Trash2 size={18} />
            Izbriši
          </Button>
        </div>
      }
    >
      {lokalno && <input type="hidden" name="kartoteka" value={JSON.stringify(zapisi)} />}

      {/* Vnosna polja nimajo atributa name, zato se ne oddajo z obrazcem opreme */}
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
        {napaka && <p className="mr-auto text-sm font-medium text-danger">{napaka}</p>}
        {!napaka && lokalno && zapisi.length > 0 && (
          <p className="mr-auto text-sm text-ink-muted">Zapisi se shranijo skupaj z opremo.</p>
        )}
        <Button
          type="button"
          variant="ok"
          onClick={dodaj}
          disabled={shranjujem}
          title={lokalno ? "Dodaj zapis v kartoteko (shrani se skupaj z novo opremo)" : "Dodaj in shrani zapis v kartoteko opreme"}
        >
          <Plus size={18} />
          {shranjujem ? "Shranjujem ..." : "Dodaj zapis"}
        </Button>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        {skupaj > 0 && (
          <p className="mb-3 text-sm text-ink-muted">
            Skupni stroški: <strong className="text-ink">{evri(skupaj)}</strong>
          </p>
        )}
        {prikaz.length === 0 ? (
          <p className="flex items-center gap-2 py-6 text-sm text-ink-muted">
            <History size={18} /> V kartoteki še ni zapisov.
          </p>
        ) : (
          <ol className="max-h-[28rem] overflow-y-auto pr-2">
            {prikaz.map((z, i) => (
              <li key={z.id ?? `lokalno-${i}`} className="relative flex gap-4 pb-5 last:pb-1">
                {/* časovnica: pika + navpična črta */}
                <div className="relative flex w-3 shrink-0 justify-center">
                  <span className="z-10 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand ring-2 ring-brand/30" />
                  {i < prikaz.length - 1 && <span className="absolute bottom-[-0.25rem] top-4 w-0.5 bg-line" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-ink">
                    {prikazDatuma(z.datum_vnosa)}
                    {z.strosek != null && (
                      <span className="rounded bg-brand-soft px-1.5 py-0.5 text-xs font-semibold text-brand-pressed">
                        Strošek: {evri(z.strosek)}
                      </span>
                    )}
                    {!z.id && (
                      <span className="rounded bg-warn-soft px-1.5 py-0.5 text-xs font-medium text-ink">ni še shranjeno</span>
                    )}
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] text-ink">{z.besedilo_vnosa}</p>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="iconXs"
                  onClick={() => izbrisiZapis(z)}
                  disabled={shranjujem}
                  title={`Izbriši zapis kartoteke z dne ${prikazDatuma(z.datum_vnosa)}`}
                  aria-label={`Izbriši zapis z dne ${prikazDatuma(z.datum_vnosa)}`}
                >
                  <Trash2 size={14} />
                </Button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Section>
  );
}
