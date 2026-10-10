"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ImageOff, Search, Sparkles, X } from "lucide-react";
import { Button, ErrorText, Score, StatusBadge } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { OpremaSSliko } from "@/lib/types";
import { imaOznake, jeStetje, oznakeVprasanja, razsiriVprasanje } from "./iskanje";
import { besediloOpreme, naloziModel, vektorji } from "./model";

// AI iskanje (poskusno). Odstranitev: glej README.md v tej mapi.

const PRODANO = "3. PRODANO";
const PAKET = 8; // koliko opreme naenkrat pretvori v vektorje (manjši paketi = odzivnejša stran)
const ST_ZADETKOV = 8;

const postavk = (n: number) => {
  const r = n % 100;
  return `${n} ${r === 1 ? "postavka" : r === 2 ? "postavki" : r === 3 || r === 4 ? "postavke" : "postavk"}`;
};

const evri = (n: number) => n.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

export function AiIskanje({ oprema }: { oprema: OpremaSSliko[] }) {
  const [vprasanje, setVprasanje] = useState("");
  const [stanje, setStanje] = useState<string | null>(null); // besedilo med delom (nalaganje, priprava, iskanje)
  const [napaka, setNapaka] = useState<string | null>(null);
  const [zadetki, setZadetki] = useState<OpremaSSliko[] | null>(null);
  const [povzetek, setPovzetek] = useState<string | null>(null);

  async function isci(e: FormEvent) {
    e.preventDefault();
    const besedilo = vprasanje.trim();
    if (!besedilo || stanje) return;
    setNapaka(null);
    setZadetki(null);
    try {
      setStanje("Nalagam AI model ...");
      await naloziModel((p) => setStanje(`Nalagam AI model (samo prvič, ~120 MB): ${p} %`));

      // Vektorji za novo ali spremenjeno opremo (izračuna jih brskalnik, shranijo se v bazo)
      const supabase = createClient();
      const { data: shranjeni, error } = await supabase.from("rbo_ai_vektor").select("id_oprema, besedilo");
      if (error) throw new Error(error.message);
      const obstojeci = new Map((shranjeni ?? []).map((r): [number, string] => [r.id_oprema, r.besedilo]));
      const zaPripravo = oprema.filter((o) => obstojeci.get(o.id_oprema) !== besediloOpreme(o));
      for (let i = 0; i < zaPripravo.length; i += PAKET) {
        setStanje(`Pripravljam opremo za iskanje: ${i} / ${zaPripravo.length}`);
        const paket = zaPripravo.slice(i, i + PAKET);
        const v = await vektorji(paket.map((o) => `passage: ${besediloOpreme(o)}`));
        const { error: napakaZapisa } = await supabase.from("rbo_ai_vektor").upsert(
          paket.map((o, j) => ({
            id_oprema: o.id_oprema,
            besedilo: besediloOpreme(o),
            vektor: v[j],
            posodobljeno: new Date().toISOString(),
          })),
          { onConflict: "id_oprema" },
        );
        if (napakaZapisa) throw new Error(napakaZapisa.message);
      }

      setStanje("Iščem ...");
      const [poizvedba] = await vektorji([`query: ${razsiriVprasanje(besedilo)}`]);
      const { data, error: napakaIskanja } = await supabase.rpc("rbo_ai_isci", { poizvedba, stevilo: oprema.length });
      if (napakaIskanja) throw new Error(napakaIskanja.message);
      const poId = new Map(oprema.map((o) => [o.id_oprema, o]));
      const razvrscena = ((data ?? []) as { id_oprema: number }[])
        .map((r) => poId.get(r.id_oprema))
        .filter((o): o is OpremaSSliko => !!o && o.status_prodaje !== PRODANO);

      // Oznake iz vprašanja (FB, FD64 ...) omejijo zadetke, model jih samo razvrsti
      const oznake = oznakeVprasanja(besedilo, oprema);
      if (oznake.length > 0) {
        const najdeno = razvrscena.filter((o) => imaOznake(o, oznake));
        const kolicina = najdeno.reduce((v, o) => v + (o.kolicina ?? 0), 0);
        setPovzetek(
          `Oprema z oznako ${oznake.map((z) => z.toUpperCase()).join(" + ")}: ${postavk(najdeno.length)}` +
            (kolicina !== najdeno.length ? `, skupna količina ${kolicina}` : "") +
            " (brez prodane opreme).",
        );
        setZadetki(najdeno);
      } else {
        setPovzetek(
          jeStetje(besedilo)
            ? "Za štetje napiši oznako opreme (npr. »koliko je FB peči«). Spodaj je najbolj podobna oprema:"
            : "Najbolj ustreza opisu (od najboljšega zadetka naprej):",
        );
        setZadetki(razvrscena.slice(0, ST_ZADETKOV));
      }
    } catch (err) {
      setNapaka(`AI iskanje ni uspelo: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setStanje(null);
    }
  }

  return (
    <section aria-label="AI iskanje opreme" className="fp-card flex flex-col gap-3 p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fines-50 text-fines-500">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-bold text-ink-900">Iščeš rabljeno opremo?</h2>
          <p className="text-sm text-ink-500">Napiši s svojimi besedami, kaj iščeš, AI poišče najbolj ustrezno opremo.</p>
        </div>
      </div>

      <form onSubmit={isci} className="flex flex-wrap items-end gap-3">
        <span className="relative min-w-0 flex-1 basis-64">
          <Search className="pointer-events-none absolute left-2.5 top-3 h-4 w-4 text-ink-400" aria-hidden />
          <input
            type="search"
            value={vprasanje}
            onChange={(e) => setVprasanje(e.target.value)}
            placeholder="npr. konvekcijska peč za pekarno, malo rabljena"
            title="Opiši opremo, ki jo iščeš"
            aria-label="Kaj iščeš"
            disabled={!!stanje}
            suppressHydrationWarning
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-8 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-fines-500 focus:outline-none focus:ring-2 focus:ring-fines-100 disabled:bg-ink-100"
          />
        </span>
        <Button type="submit" icon={Sparkles} disabled={!!stanje || !vprasanje.trim()} hint="Poišči opremo, ki ustreza opisu">
          Poišči
        </Button>
        {zadetki && (
          <Button variant="neutral" icon={X} onClick={() => setZadetki(null)} hint="Skrij rezultate AI iskanja">
            Počisti
          </Button>
        )}
      </form>

      {stanje && (
        <p role="status" className="text-sm font-medium text-sync-600">
          {stanje}
        </p>
      )}
      {napaka && <ErrorText>{napaka}</ErrorText>}

      {zadetki &&
        (zadetki.length === 0 ? (
          <p className="text-sm text-ink-500">{povzetek ?? "Ni opreme, ki bi ustrezala opisu."}</p>
        ) : (
          <>
            <p className="text-sm font-medium text-ink-700">{povzetek}</p>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              {zadetki.map((o) => (
                <li key={o.id_oprema}>
                  <Zadetek o={o} />
                </li>
              ))}
            </ul>
          </>
        ))}
    </section>
  );
}

function Zadetek({ o }: { o: OpremaSSliko }) {
  return (
    <Link
      href={`/oprema/${o.id_oprema}`}
      title={`Odpri opremo ID ${o.id_oprema}`}
      className="flex h-full gap-3 rounded-lg border border-ink-200 bg-white p-2 transition hover:border-fines-500 hover:shadow-md"
    >
      <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-md bg-ink-100">
        {o.slika_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- podpisani Supabase URL-ji
          <img src={o.slika_url} alt={o.oprema_naziv} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full items-center justify-center text-ink-400">
            <ImageOff size={20} />
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-ink-500">ID {o.id_oprema}</span>
          <StatusBadge status={o.status_prodaje} />
        </span>
        <span className="break-words text-sm font-bold leading-snug text-ink-900">{o.oprema_naziv}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {o.prodajna_cena != null && <span className="font-bold tabular-nums text-fines-600">{evri(o.prodajna_cena)}</span>}
          <Score value={o.ocena} />
        </span>
      </span>
    </Link>
  );
}
