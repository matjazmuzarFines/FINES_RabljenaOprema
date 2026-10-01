import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SlikeUrejevalnik } from "@/components/SlikeUrejevalnik";
import { StatusBadge, buttonClass } from "@/components/ui";
import { OpremaObrazec } from "@/app/oprema/OpremaObrazec";
import { naloziSifrante } from "@/lib/sifranti";
import { slikeOpreme } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaVrstica, ZapisKartoteke } from "@/lib/types";
import { IzbrisiGumb } from "./IzbrisiGumb";

export default async function UrediPage({ params, searchParams }: PageProps<"/oprema/[id]">) {
  const { id } = await params;
  const { novo, kartoteka, teams } = await searchParams;
  const idOprema = Number(id);
  if (!Number.isInteger(idOprema)) notFound();

  const supabase = await createClient();
  const [opremaRes, slike, kartotekaRes, sifranti] = await Promise.all([
    supabase.from("v_rbo_oprema_prodaja").select("*").eq("id_oprema", idOprema).maybeSingle(),
    slikeOpreme(supabase, idOprema),
    supabase
      .from("rbo_kartoteka")
      .select("id, datum_vnosa, besedilo_vnosa, strosek")
      .eq("id_oprema", idOprema)
      .eq("visible", true)
      .order("datum_vnosa", { ascending: false })
      .order("id", { ascending: false }),
    naloziSifrante(supabase),
  ]);
  if (opremaRes.error) throw new Error(opremaRes.error.message);
  const oprema = opremaRes.data as OpremaVrstica | null;
  if (!oprema) notFound();

  return (
    <AppShell
      title={oprema.oprema_naziv}
      subtitle={[`ID ${oprema.id_oprema}`, oprema.skupina_opreme, oprema.serijska_stevilka].filter(Boolean).join(" · ")}
      back="/"
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/oprema/${oprema.id_oprema}/tehnicni_list`}
            className={buttonClass("brand")}
            title="Odpri tehnični list opreme"
          >
            <ClipboardList size={18} />
            Tehnični list
          </Link>
          <StatusBadge status={oprema.status_prodaje} />
          <IzbrisiGumb idOprema={oprema.id_oprema} naziv={oprema.oprema_naziv} />
        </div>
      }
    >
      {novo && (
        <p className="mb-5 flex items-center gap-2 rounded-xl border border-ok/40 bg-ok/10 px-4 py-3 text-[15px] font-medium">
          <CircleCheck className="text-ok" size={20} />
          Oprema je dodana (ID {oprema.id_oprema}). Zdaj lahko dodaš slike.
        </p>
      )}
      {kartoteka === "napaka" && (
        <p className="mb-5 rounded-xl border border-warn bg-warn-soft px-4 py-3 text-[15px] font-medium">
          Zapisov kartoteke ni bilo mogoče shraniti. Dodaj jih ponovno v razdelku Kartoteka opreme.
        </p>
      )}
      {teams && (
        <p className="mb-5 rounded-xl border border-warn bg-warn-soft px-4 py-3 text-[15px] font-medium">
          Oprema je shranjena, vendar obvestilo v Teams ni bilo poslano. Ekipo obvesti ročno.
          <span className="mt-1 block text-sm font-normal text-ink-muted">Podrobnosti: {String(teams)}</span>
        </p>
      )}
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <OpremaObrazec
          key={oprema.id_oprema}
          oprema={oprema}
          sifranti={sifranti}
          kartoteka={(kartotekaRes.data ?? []) as ZapisKartoteke[]}
        />
        <div className="xl:sticky xl:top-24">
          <SlikeUrejevalnik
            idOprema={oprema.id_oprema}
            slike={slike}
            vrste={["Predstavna", "Slika1", "Slika2", "Slika3", "Slika4", "Slika5", "Slika6"]}
          />
        </div>
      </div>
    </AppShell>
  );
}
