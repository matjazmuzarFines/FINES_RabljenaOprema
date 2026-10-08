"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { CheckSquare, ImageOff, RefreshCw, RotateCcw, Square, X } from "lucide-react";
import { EmailGumb, PdfGumb, SkupinskiGumbi } from "@/components/PdfGumb";
import {
  Button,
  FilterIskanje,
  FilterIzbira,
  FilterKartica,
  FilterPolje,
  FilterVrstica,
  GarancijaZnak,
  Score,
  StatusBadge,
  barvaStatusaKartice,
  imeStatusa,
} from "@/components/ui";
import { OCENE, STATUSI } from "@/lib/sifranti";
import type { OpremaSSliko } from "@/lib/types";

type Filtri = {
  id: string;
  serijska: string;
  naziv: string;
  skupina: string;
  ocena: string;
  skritiStatusi: string[]; // izklopljene kartice statusov ("" = brez statusa)
};

const PRODANO = "3. PRODANO";
const PRAZNI_FILTRI: Filtri = { id: "", serijska: "", naziv: "", skupina: "", ocena: "", skritiStatusi: [PRODANO] };
const KLJUC_FILTROV = "rbo-filtri";
const KLJUC_IZBORA = "rbo-izbor";

const evri = (n: number) => n.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const postavk = (n: number) => {
  const r = n % 100;
  return `${n} ${r === 1 ? "postavka" : r === 2 ? "postavki" : r === 3 || r === 4 ? "postavke" : "postavk"}`;
};

const razlicne = (vrednosti: (string | number | null)[]) =>
  [...new Set(vrednosti.filter((v) => v !== null && v !== "").map(String))].sort((a, b) =>
    a.localeCompare(b, "sl", { numeric: true }),
  );

const vse = (moznosti: string[]) => [{ value: "", label: "Vse" }, ...moznosti.map((m) => ({ value: m, label: m }))];

export function OpremaSeznam({ oprema }: { oprema: OpremaSSliko[] }) {
  const router = useRouter();
  const [osvezujem, startOsvezitev] = useTransition();
  const [filtri, setFiltri] = useState<Filtri>(PRAZNI_FILTRI);
  const [izbrani, setIzbrani] = useState<number[]>([]);

  // Filtri ostanejo nastavljeni ob vrnitvi z urejanja (samo v tem zavihku brskalnika)
  useEffect(() => {
    try {
      const shranjeni = sessionStorage.getItem(KLJUC_FILTROV);
      if (shranjeni) {
        const f = { ...PRAZNI_FILTRI, ...JSON.parse(shranjeni) };
        if (!Array.isArray(f.skritiStatusi)) f.skritiStatusi = PRAZNI_FILTRI.skritiStatusi;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- enkratno branje iz sessionStorage ob nalaganju
        setFiltri(f);
      }
      const izbor = sessionStorage.getItem(KLJUC_IZBORA);
      if (izbor) setIzbrani(JSON.parse(izbor));
    } catch {}
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(KLJUC_IZBORA, JSON.stringify(izbrani));
    } catch {}
  }, [izbrani]);
  useEffect(() => {
    try {
      sessionStorage.setItem(KLJUC_FILTROV, JSON.stringify(filtri));
    } catch {}
  }, [filtri]);

  const nastavi = <K extends keyof Filtri>(k: K, v: Filtri[K]) => setFiltri((f) => ({ ...f, [k]: v }));
  const preklopiStatus = (s: string) =>
    nastavi(
      "skritiStatusi",
      filtri.skritiStatusi.includes(s) ? filtri.skritiStatusi.filter((x) => x !== s) : [...filtri.skritiStatusi, s],
    );

  const moznosti = useMemo(
    () => ({
      skupina: razlicne(oprema.map((o) => o.skupina_opreme)),
      ocena: Object.entries(OCENE).map(([n, opis]) => ({ value: n, label: `${n} – ${opis}` })),
    }),
    [oprema],
  );

  // Vsi filtri razen statusa (kartice statusov kažejo število glede na ostale filtre)
  const poFiltrih = useMemo(() => {
    const id = filtri.id.trim();
    const serijska = filtri.serijska.trim().toLowerCase();
    const besede = filtri.naziv.toLowerCase().split(/\s+/).filter(Boolean);
    return oprema.filter(
      (o) =>
        (!id || String(o.id_oprema).includes(id)) &&
        (!filtri.skupina || o.skupina_opreme === filtri.skupina) &&
        (!filtri.ocena || String(o.ocena) === filtri.ocena) &&
        (!serijska || (o.serijska_stevilka ?? "").toLowerCase().includes(serijska)) &&
        besede.every((b) => o.oprema_naziv.toLowerCase().includes(b)),
    );
  }, [oprema, filtri]);

  const prikazana = useMemo(
    () => poFiltrih.filter((o) => !filtri.skritiStatusi.includes(o.status_prodaje ?? "")),
    [poFiltrih, filtri.skritiStatusi],
  );

  // Kartice: vsi statusi iz šifranta + morebitni drugi statusi v podatkih (tudi brez statusa)
  const statusi = useMemo(() => {
    const kljuci: string[] = [...STATUSI];
    for (const o of oprema) if (!kljuci.includes(o.status_prodaje ?? "")) kljuci.push(o.status_prodaje ?? "");
    return kljuci.map((s) => ({ s, stevilo: poFiltrih.filter((o) => (o.status_prodaje ?? "") === s).length }));
  }, [oprema, poFiltrih]);

  // Izbor ostane tudi, ko filter opremo skrije; akcije veljajo za vso izbrano opremo
  const izbranaOprema = useMemo(() => {
    const ids = new Set(izbrani);
    return oprema.filter((o) => ids.has(o.id_oprema));
  }, [oprema, izbrani]);
  const izbraniIdji = izbranaOprema.map((o) => o.id_oprema);
  const vsiPrikazaniIzbrani = prikazana.length > 0 && prikazana.every((o) => izbrani.includes(o.id_oprema));
  const preklopi = (id: number) =>
    setIzbrani((iz) => (iz.includes(id) ? iz.filter((x) => x !== id) : [...iz, id]));
  const izberiPrikazane = () =>
    setIzbrani((iz) =>
      vsiPrikazaniIzbrani
        ? iz.filter((id) => !prikazana.some((o) => o.id_oprema === id))
        : [...new Set([...iz, ...prikazana.map((o) => o.id_oprema)])],
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Kartice-filtri: povzetek statusov prodaje, klik prikaže / skrije status */}
      <section aria-label="Status prodaje" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {statusi.map(({ s, stevilo }) => {
          const aktivna = !filtri.skritiStatusi.includes(s);
          const ime = imeStatusa(s || null);
          return (
            <FilterKartica
              key={s}
              aktivna={aktivna}
              onClick={() => preklopiStatus(s)}
              hint={`${aktivna ? "Skrij" : "Prikaži"} opremo s statusom ${ime.toLowerCase()}`}
              barva={barvaStatusaKartice(s || null)}
              naslov={ime}
              podnaslov={postavk(stevilo)}
            />
          );
        })}
      </section>

      <section aria-label="Filtri" className="fp-card p-3 sm:p-4">
        <FilterVrstica>
          <FilterIskanje
            label="ID"
            value={filtri.id}
            onChange={(v) => nastavi("id", v)}
            placeholder="npr. 147"
            hint="Išči opremo po ID številki"
            inputMode="numeric"
            className="w-full sm:w-32"
          />
          <FilterIskanje
            label="Serijska številka"
            value={filtri.serijska}
            onChange={(v) => nastavi("serijska", v)}
            placeholder="npr. 24.1234.123"
            hint="Išči opremo po serijski številki"
            className="w-full sm:w-52"
          />
          <FilterIskanje
            label="Naziv"
            value={filtri.naziv}
            onChange={(v) => nastavi("naziv", v)}
            placeholder="npr. FBM 40"
            hint="Išči opremo po besedah v nazivu"
          />
          <FilterIzbira
            label="Skupina opreme"
            value={filtri.skupina}
            options={vse(moznosti.skupina)}
            onChange={(v) => nastavi("skupina", v)}
            hint="Prikaži samo izbrano skupino opreme"
            className="w-full sm:w-56"
          />
          <FilterIzbira
            label="Ocena stanja"
            value={filtri.ocena}
            options={[{ value: "", label: "Vse" }, ...moznosti.ocena]}
            onChange={(v) => nastavi("ocena", v)}
            hint="Prikaži samo opremo z izbrano oceno"
            className="w-full sm:w-72"
          />
          <FilterPolje label="Akcije" className="sm:ml-auto">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="neutral"
                icon={RotateCcw}
                onClick={() => setFiltri(PRAZNI_FILTRI)}
                hint="Počisti filtre in skrij prodano opremo"
              >
                Ponastavi filtre
              </Button>
              <Button
                variant="sync"
                icon={RefreshCw}
                className={osvezujem ? "[&>svg]:animate-spin" : ""}
                disabled={osvezujem}
                onClick={() => startOsvezitev(() => router.refresh())}
                hint="Ponovno naloži opremo in slike iz baze"
              >
                {osvezujem ? "Osvežujem ..." : "Osveži podatke"}
              </Button>
            </div>
          </FilterPolje>
        </FilterVrstica>
      </section>

      {izbraniIdji.length > 0 && (
        <section
          aria-label="Izbrana oprema"
          className="flex flex-wrap items-end gap-3 rounded-xl border-2 border-fines-500 bg-fines-50 p-3 shadow-sm sm:p-4"
        >
          <FilterPolje label="Izbrano">
            <span
              className="inline-flex h-10 items-center text-base font-bold text-fines-600"
              title="Število izbrane opreme za skupni izvoz"
            >
              {postavk(izbraniIdji.length)}
            </span>
          </FilterPolje>
          <FilterPolje label="Izvoz">
            <div className="flex flex-wrap gap-2">
              <SkupinskiGumbi
                idji={izbraniIdji}
                onemogoceno={{
                  "tehnicni-list": izbranaOprema.some((o) => o.ima_tehnicni_list)
                    ? undefined
                    : "Nobena izbrana oprema nima tehničnega lista",
                  kartoteka: izbranaOprema.some((o) => o.ima_kartoteko)
                    ? undefined
                    : "Nobena izbrana oprema nima kartoteke",
                }}
              />
            </div>
          </FilterPolje>
          <Button variant="neutral" icon={X} className="ml-auto" onClick={() => setIzbrani([])} hint="Počisti izbor vse opreme">
            Počisti izbor
          </Button>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          Prikazano <strong className="text-ink-900">{prikazana.length}</strong> od {oprema.length}
        </p>
        <Button
          variant="neutral"
          icon={vsiPrikazaniIzbrani ? Square : CheckSquare}
          onClick={izberiPrikazane}
          disabled={prikazana.length === 0}
          hint={vsiPrikazaniIzbrani ? "Odznači vso prikazano opremo" : "Izberi vso prikazano opremo"}
        >
          {vsiPrikazaniIzbrani ? "Odznači prikazane" : "Izberi prikazane"}
        </Button>
      </div>

      {prikazana.length === 0 ? (
        <p className="fp-card p-10 text-center text-sm text-ink-500">Ni opreme za izbrane filtre.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 min-[2200px]:grid-cols-5">
          {prikazana.map((o) => (
            <li key={o.id_oprema}>
              <OpremaKartica o={o} izbrana={izbrani.includes(o.id_oprema)} onIzberi={() => preklopi(o.id_oprema)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OpremaKartica({ o, izbrana, onIzberi }: { o: OpremaSSliko; izbrana: boolean; onIzberi: () => void }) {
  const prodano = o.status_prodaje === PRODANO;
  // Celotna kartica je klikljiva (povezava čez celo kartico); gumbi izvoza so nad povezavo (z-10)
  return (
    <article
      className={
        "fp-card group relative flex h-full flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-fines-500 hover:shadow-md focus-within:border-fines-500 " +
        (izbrana ? "!border-fines-500 ring-2 ring-fines-500 " : "") +
        (prodano ? "opacity-70" : "")
      }
    >
      <Link
        href={`/oprema/${o.id_oprema}`}
        className="absolute inset-0 z-0 rounded-xl focus-visible:outline-2 focus-visible:outline-fines-500"
        title={`Odpri in uredi opremo ID ${o.id_oprema}`}
        aria-label={`Uredi opremo ${o.oprema_naziv} (ID ${o.id_oprema})`}
      />
      <div className="pointer-events-none relative aspect-[4/3] bg-ink-100">
        {o.slika_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- podpisani Supabase URL-ji
          <img src={o.slika_url} alt={o.oprema_naziv} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-400">
            <ImageOff size={32} />
            <span className="text-sm">Ni predstavne slike</span>
          </div>
        )}
        <span className="absolute left-3 top-3 flex items-center gap-2">
          <label
            className="pointer-events-auto relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md bg-ink-800/85 hover:bg-ink-800"
            title={izbrana ? "Odstrani opremo iz izbora" : "Izberi opremo za skupni izvoz"}
          >
            <input
              type="checkbox"
              checked={izbrana}
              onChange={onIzberi}
              aria-label={`Izberi opremo ID ${o.id_oprema}`}
              className="h-5 w-5 cursor-pointer accent-fines-500"
            />
          </label>
          <span className="rounded-md bg-ink-800/85 px-2 py-1 font-mono text-sm font-bold text-white">ID {o.id_oprema}</span>
        </span>
        <span className="absolute right-3 top-3">
          <StatusBadge status={o.status_prodaje} />
        </span>
        <GarancijaZnak meseci={o.garancijski_rok_meseci} className="absolute bottom-3 left-3" />
      </div>

      <div className="pointer-events-none relative flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-start justify-end gap-3">
          <div className="min-w-[9rem] flex-1">
            <h2 className="break-words text-base font-bold leading-snug text-ink-900 group-hover:text-fines-600">
              {o.oprema_naziv}
            </h2>
            {o.skupina_opreme && <p className="text-sm text-ink-500">{o.skupina_opreme}</p>}
          </div>
          <div className="pointer-events-auto relative z-10 flex shrink-0 gap-1">
            <PdfGumb vrsta="osnovni" idOprema={o.id_oprema} />
            <PdfGumb
              vrsta="kartoteka"
              idOprema={o.id_oprema}
              disabled={!o.ima_kartoteko}
              namig={o.ima_kartoteko ? undefined : "Kartoteka opreme nima zapisov"}
            />
            <PdfGumb
              vrsta="tehnicni-list"
              idOprema={o.id_oprema}
              disabled={!o.ima_tehnicni_list}
              namig={o.ima_tehnicni_list ? undefined : "Tehnični list ni izpolnjen"}
            />
            <EmailGumb idOprema={o.id_oprema} />
          </div>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-ink-500">Ident</dt>
          <dd className="truncate font-mono font-medium">{o.koda || "–"}</dd>
          <dt className="text-ink-500">Serijska</dt>
          <dd className="truncate font-mono font-medium">{o.serijska_stevilka || "–"}</dd>
          <dt className="text-ink-500">Leto</dt>
          <dd className="font-medium tabular-nums">{o.leto_proizvodnje ?? "–"}</dd>
          <dt className="text-ink-500">Cena</dt>
          <dd className="font-bold tabular-nums text-fines-600" title="Prodajna cena (razdelek Prodaja)">
            {o.prodajna_cena != null ? evri(o.prodajna_cena) : "–"}
          </dd>
          <dt className="self-center text-ink-500">Stanje</dt>
          <dd>
            <Score value={o.ocena} />
          </dd>
        </dl>
        {o.komentar && (
          <p className="line-clamp-3 border-t border-ink-200 pt-3 text-sm italic text-ink-500">{o.komentar}</p>
        )}
      </div>
    </article>
  );
}
