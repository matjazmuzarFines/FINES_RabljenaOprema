"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { ImageOff, RefreshCw, RotateCcw } from "lucide-react";
import { EmailGumb, PdfGumb } from "@/components/PdfGumb";
import { Button, Field, Score, Select, StatusBadge, TextInput, Toggle } from "@/components/ui";
import type { OpremaSSliko } from "@/lib/types";

type Filtri = {
  id: string;
  serijska: string;
  naziv: string;
  skupina: string;
  status: string;
  ocena: string;
  prikaziProdano: boolean;
};

const PRAZNI_FILTRI: Filtri = { id: "", serijska: "", naziv: "", skupina: "", status: "", ocena: "", prikaziProdano: false };
const KLJUC_FILTROV = "rbo-filtri";
const PRODANO = "3. PRODANO";

const razlicne = (vrednosti: (string | number | null)[]) =>
  [...new Set(vrednosti.filter((v) => v !== null && v !== "").map(String))].sort((a, b) =>
    a.localeCompare(b, "sl", { numeric: true }),
  );

export function OpremaSeznam({ oprema }: { oprema: OpremaSSliko[] }) {
  const router = useRouter();
  const [osvezujem, startOsvezitev] = useTransition();
  const [filtri, setFiltri] = useState<Filtri>(PRAZNI_FILTRI);

  // Filtri ostanejo nastavljeni ob vrnitvi z urejanja (samo v tem zavihku brskalnika)
  useEffect(() => {
    try {
      const shranjeni = sessionStorage.getItem(KLJUC_FILTROV);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- enkratno branje iz sessionStorage ob nalaganju
      if (shranjeni) setFiltri({ ...PRAZNI_FILTRI, ...JSON.parse(shranjeni) });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KLJUC_FILTROV, JSON.stringify(filtri));
    } catch {}
  }, [filtri]);

  const nastavi = <K extends keyof Filtri>(k: K, v: Filtri[K]) => setFiltri((f) => ({ ...f, [k]: v }));

  const moznosti = useMemo(
    () => ({
      skupina: razlicne(oprema.map((o) => o.skupina_opreme)),
      status: razlicne(oprema.map((o) => o.status_prodaje)),
      ocena: razlicne(oprema.map((o) => o.ocena)),
    }),
    [oprema],
  );

  const prikazana = useMemo(() => {
    const id = filtri.id.trim();
    const serijska = filtri.serijska.trim().toLowerCase();
    const besede = filtri.naziv.toLowerCase().split(/\s+/).filter(Boolean);
    return oprema.filter(
      (o) =>
        (!id || String(o.id_oprema).includes(id)) &&
        (!filtri.skupina || o.skupina_opreme === filtri.skupina) &&
        (!filtri.status || o.status_prodaje === filtri.status) &&
        (!filtri.ocena || String(o.ocena) === filtri.ocena) &&
        (!serijska || (o.serijska_stevilka ?? "").toLowerCase().includes(serijska)) &&
        besede.every((b) => o.oprema_naziv.toLowerCase().includes(b)) &&
        (filtri.prikaziProdano || o.status_prodaje !== PRODANO),
    );
  }, [oprema, filtri]);

  return (
    <div className="flex flex-col gap-5">
      {/* suppressHydrationWarning: upravitelji gesel (npr. Proton Pass) dodajo filtrom svoje atribute */}
      <section
        aria-label="Filtri"
        className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5"
        suppressHydrationWarning
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          <Field label="ID">
            <TextInput
              value={filtri.id}
              onChange={(e) => nastavi("id", e.target.value)}
              placeholder="npr. 147"
              type="search"
              inputMode="numeric"
            />
          </Field>
          <Field label="Serijska številka">
            <TextInput
              value={filtri.serijska}
              onChange={(e) => nastavi("serijska", e.target.value)}
              placeholder="npr. 24.1234.123"
              type="search"
            />
          </Field>
          <Field label="Naziv">
            <TextInput
              value={filtri.naziv}
              onChange={(e) => nastavi("naziv", e.target.value)}
              placeholder="npr. FBM 40"
              type="search"
            />
          </Field>
          <Field label="Skupina opreme">
            <Select options={moznosti.skupina} value={filtri.skupina} onChange={(e) => nastavi("skupina", e.target.value)} />
          </Field>
          <Field label="Status prodaje">
            <Select options={moznosti.status} value={filtri.status} onChange={(e) => nastavi("status", e.target.value)} />
          </Field>
          <Field label="Ocena stanja">
            <Select options={moznosti.ocena} value={filtri.ocena} onChange={(e) => nastavi("ocena", e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Toggle
            checked={filtri.prikaziProdano}
            onChange={(v) => nastavi("prikaziProdano", v)}
            label="Prikaži prodano"
            title={filtri.prikaziProdano ? "Skrij prodano opremo" : "Prikaži tudi prodano opremo"}
          />
          <div className="ml-auto flex flex-wrap gap-2">
            <Button variant="brand" onClick={() => setFiltri(PRAZNI_FILTRI)} title="Počisti vse filtre in prikaži vso opremo">
              <RotateCcw size={16} />
              Ponastavi filtre
            </Button>
            <Button
              variant="info"
              disabled={osvezujem}
              onClick={() => startOsvezitev(() => router.refresh())}
              title="Ponovno naloži opremo in slike iz baze"
            >
              <RefreshCw size={16} className={osvezujem ? "animate-spin" : ""} />
              {osvezujem ? "Osvežujem ..." : "Osveži podatke"}
            </Button>
          </div>
        </div>
      </section>

      <p className="text-sm text-ink-muted">
        Prikazano <strong className="text-ink">{prikazana.length}</strong> od {oprema.length}
      </p>

      {prikazana.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-surface p-10 text-center text-ink-muted">
          Ni opreme, ki bi ustrezala filtrom.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5">
          {prikazana.map((o) => (
            <li key={o.id_oprema}>
              <OpremaKartica o={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpremaKartica({ o }: { o: OpremaSSliko }) {
  const prodano = o.status_prodaje === PRODANO;
  // Celotna kartica je klikljiva (povezava čez celo kartico); gumba PDF sta nad povezavo (z-10)
  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-sm transition ` +
        `hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus-within:border-brand ` +
        (prodano ? "opacity-70" : "")}
    >
      <Link
        href={`/oprema/${o.id_oprema}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-brand"
        title={`Odpri in uredi opremo ID ${o.id_oprema}`}
        aria-label={`Uredi opremo ${o.oprema_naziv} (ID ${o.id_oprema})`}
      />
      <div className="pointer-events-none relative aspect-[4/3] bg-[#f1efec]">
        {o.slika_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- podpisani Supabase URL-ji
          <img src={o.slika_url} alt={o.oprema_naziv} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
            <ImageOff size={32} />
            <span className="text-sm">Ni predstavne slike</span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-md bg-dark/85 px-2 py-1 text-sm font-bold text-white">
          ID {o.id_oprema}
        </span>
        <span className="absolute right-3 top-3">
          <StatusBadge status={o.status_prodaje} />
        </span>
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start justify-end gap-3">
          <div className="min-w-[9rem] flex-1">
            <h2 className="break-words text-lg font-bold leading-snug text-ink group-hover:text-brand">{o.oprema_naziv}</h2>
            {o.skupina_opreme && <p className="text-sm text-ink-muted">{o.skupina_opreme}</p>}
          </div>
          <div className="pointer-events-auto relative z-10 flex shrink-0 gap-1.5">
            <PdfGumb vrsta="osnovni" idOprema={o.id_oprema} size="iconSm" />
            <PdfGumb
              vrsta="kartoteka"
              idOprema={o.id_oprema}
              size="iconSm"
              disabled={!o.ima_kartoteko}
              namig={o.ima_kartoteko ? undefined : "Kartoteka opreme nima zapisov"}
            />
            <PdfGumb
              vrsta="tehnicni-list"
              idOprema={o.id_oprema}
              size="iconSm"
              disabled={!o.ima_tehnicni_list}
              namig={o.ima_tehnicni_list ? undefined : "Tehnični list ni izpolnjen"}
            />
            <EmailGumb idOprema={o.id_oprema} size="iconSm" />
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-muted">Ident</dt>
          <dd className="truncate font-medium">{o.koda || "–"}</dd>
          <dt className="text-ink-muted">Serijska</dt>
          <dd className="truncate font-medium">{o.serijska_stevilka || "–"}</dd>
          <dt className="text-ink-muted">Leto</dt>
          <dd className="font-medium">{o.leto_proizvodnje ?? "–"}</dd>
          <dt className="self-center text-ink-muted">Stanje</dt>
          <dd>
            <Score value={o.ocena} />
          </dd>
        </dl>
        {o.komentar && (
          <p className="line-clamp-3 border-t border-line pt-3 text-sm italic text-ink-muted">{o.komentar}</p>
        )}
      </div>
    </article>
  );
}
