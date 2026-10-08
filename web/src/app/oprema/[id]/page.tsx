import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { SlikeUrejevalnik } from "@/components/SlikeUrejevalnik";
import { NavPovezava, StatusBadge, SuccessText, WarningText, buttonClass } from "@/components/ui";
import { OpremaObrazec } from "@/app/oprema/OpremaObrazec";
import { naloziSifrante } from "@/lib/sifranti";
import { slikeOpreme } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaVrstica, ZapisKartoteke } from "@/lib/types";
import { jeSamoOgled } from "@/lib/vloga";
import { IzbrisiGumb } from "./IzbrisiGumb";

export default async function UrediPage({ params, searchParams }: PageProps<"/oprema/[id]">) {
  const { id } = await params;
  const { novo, kartoteka, teams } = await searchParams;
  const idOprema = Number(id);
  if (!Number.isInteger(idOprema)) notFound();

  const supabase = await createClient();
  const [opremaRes, slike, kartotekaRes, sifranti, samoOgled] = await Promise.all([
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
    jeSamoOgled(supabase),
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
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={oprema.status_prodaje} />
          <NavPovezava
            href={`/oprema/${oprema.id_oprema}/tehnicni_list`}
            className={buttonClass("neutral")}
            title="Odpri tehnični list opreme"
          >
            <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
            Tehnični list
          </NavPovezava>
          <IzbrisiGumb idOprema={oprema.id_oprema} naziv={oprema.oprema_naziv} samoOgled={samoOgled} />
        </div>
      }
    >
      {(novo || kartoteka === "napaka" || teams) && (
        <div className="mb-4 flex flex-col gap-2">
          {novo && <SuccessText>Oprema je dodana (ID {oprema.id_oprema}). Zdaj lahko dodaš slike.</SuccessText>}
          {kartoteka === "napaka" && (
            <WarningText>Zapisov kartoteke ni bilo mogoče shraniti. Dodaj jih ponovno v razdelku Kartoteka opreme.</WarningText>
          )}
          {teams && (
            <WarningText>
              Oprema je shranjena, vendar obvestilo v Teams ni bilo poslano. Ekipo obvesti ročno.
              <span className="mt-1 block font-normal">Podrobnosti: {String(teams)}</span>
            </WarningText>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <OpremaObrazec
          key={oprema.id_oprema}
          oprema={oprema}
          sifranti={sifranti}
          kartoteka={(kartotekaRes.data ?? []) as ZapisKartoteke[]}
          samoOgled={samoOgled}
        />
        <div className="xl:sticky xl:top-24">
          <SlikeUrejevalnik
            idOprema={oprema.id_oprema}
            slike={slike}
            vrste={["Predstavna", "Slika1", "Slika2", "Slika3", "Slika4", "Slika5", "Slika6"]}
            samoOgled={samoOgled}
          />
        </div>
      </div>
    </AppShell>
  );
}
