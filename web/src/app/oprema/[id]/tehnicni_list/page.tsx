import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PdfGumb } from "@/components/PdfGumb";
import { SlikeUrejevalnik } from "@/components/SlikeUrejevalnik";
import { slikeOpreme } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaVrstica, TehnicniList } from "@/lib/types";
import { IzbrisiTehnicniListGumb } from "./IzbrisiTehnicniListGumb";
import { TehnicniListObrazec } from "./TehnicniListObrazec";

export default async function TehnicniListPage({ params }: PageProps<"/oprema/[id]/tehnicni_list">) {
  const { id } = await params;
  const idOprema = Number(id);
  if (!Number.isInteger(idOprema)) notFound();

  const supabase = await createClient();
  const [opremaRes, tlRes, slike] = await Promise.all([
    supabase.from("v_rbo_oprema_prodaja").select("*").eq("id_oprema", idOprema).maybeSingle(),
    supabase.from("rbo_tehnicni_list").select("*").eq("id_oprema", idOprema).eq("visible", true).maybeSingle(),
    slikeOpreme(supabase, idOprema),
  ]);
  if (opremaRes.error) throw new Error(opremaRes.error.message);
  const oprema = opremaRes.data as OpremaVrstica | null;
  if (!oprema) notFound();

  // Nov tehnični list: osnovni podatki iz opreme (kot v Power Apps)
  const obstojeci = tlRes.data as TehnicniList | null;
  const tl: TehnicniList = obstojeci ?? {
    tip_opreme: oprema.skupina_opreme,
    naziv: oprema.oprema_naziv,
    leto_izdelave: oprema.leto_proizvodnje,
    serijska: oprema.serijska_stevilka,
    dimenzija: null,
    teza: null,
    delovne_ure: null,
    prikljucna_moc: null,
    elektricni_priklop: null,
    varovalke: null,
    temperatura: null,
    priklop_vode: null,
    odvod_pare: null,
    kapaciteta_pekacev: null,
    razdalja_med_pekaci: null,
    opis: null,
  };

  return (
    <AppShell
      title={`Tehnični list – ${oprema.oprema_naziv}`}
      subtitle={[`ID ${oprema.id_oprema}`, oprema.skupina_opreme, oprema.serijska_stevilka].filter(Boolean).join(" · ")}
      back={`/oprema/${oprema.id_oprema}`}
      backTitle="Nazaj na urejanje rabljene opreme"
      actions={
        <div className="flex items-center gap-2">
          <PdfGumb
            vrsta="tehnicni-list"
            idOprema={oprema.id_oprema}
            disabled={!obstojeci}
            namig={obstojeci ? undefined : "Tehnični list še ni izpolnjen (najprej ga shrani)"}
          />
          <IzbrisiTehnicniListGumb idOprema={oprema.id_oprema} obstaja={!!obstojeci || !!slike.Krmiljenje} />
        </div>
      }
    >
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,460px)]">
        {/* key: po izbrisu se obrazec in slika izrišeta na novo (prazna) */}
        <TehnicniListObrazec key={obstojeci ? "obstojeci" : "nov"} idOprema={oprema.id_oprema} tl={tl} nov={!obstojeci} />
        <div className="xl:sticky xl:top-24">
          <SlikeUrejevalnik
            key={slike.Krmiljenje?.ime ?? "brez"}
            idOprema={oprema.id_oprema}
            slike={slike}
            vrste={["Krmiljenje"]}
            naslov="Slika krmiljenja"
            velika="Krmiljenje"
          />
        </div>
      </div>
    </AppShell>
  );
}
