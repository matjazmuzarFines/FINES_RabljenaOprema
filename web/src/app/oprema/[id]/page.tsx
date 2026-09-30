import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/ui";
import { OpremaObrazec } from "@/app/oprema/OpremaObrazec";
import { naloziSifrante } from "@/lib/sifranti";
import { podpisaniUrlji } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaVrstica } from "@/lib/types";
import { IzbrisiGumb } from "./IzbrisiGumb";
import { SlikeUrejevalnik, type ObstojecaSlika, type VrstaSlike } from "./SlikeUrejevalnik";

export default async function UrediPage({ params, searchParams }: PageProps<"/oprema/[id]">) {
  const { id } = await params;
  const { novo } = await searchParams;
  const idOprema = Number(id);
  if (!Number.isInteger(idOprema)) notFound();

  const supabase = await createClient();
  const [opremaRes, slikeRes, sifranti] = await Promise.all([
    supabase.from("v_rbo_oprema_prodaja").select("*").eq("id_oprema", idOprema).maybeSingle(),
    supabase.from("rbo_slike").select("vrsta_slike, ime_slike").eq("id_oprema", idOprema),
    naloziSifrante(supabase),
  ]);
  if (opremaRes.error) throw new Error(opremaRes.error.message);
  const oprema = opremaRes.data as OpremaVrstica | null;
  if (!oprema) notFound();

  const zapisi = (slikeRes.data ?? []) as { vrsta_slike: VrstaSlike; ime_slike: string }[];
  const urlji = await podpisaniUrlji(supabase, zapisi.map((z) => z.ime_slike));
  const slike: Partial<Record<VrstaSlike, ObstojecaSlika>> = Object.fromEntries(
    zapisi.map((z) => [z.vrsta_slike, { ime: z.ime_slike, url: urlji.get(z.ime_slike) ?? null }]),
  );

  return (
    <AppShell
      title={oprema.oprema_naziv}
      subtitle={[`ID ${oprema.id_oprema}`, oprema.skupina_opreme, oprema.serijska_stevilka].filter(Boolean).join(" · ")}
      back="/"
      actions={
        <div className="flex items-center gap-3">
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
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
        <OpremaObrazec key={oprema.id_oprema} oprema={oprema} sifranti={sifranti} />
        <div className="xl:sticky xl:top-24">
          <SlikeUrejevalnik idOprema={oprema.id_oprema} slike={slike} />
        </div>
      </div>
    </AppShell>
  );
}
