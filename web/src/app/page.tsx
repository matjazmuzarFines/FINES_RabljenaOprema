import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { buttonClass } from "@/components/ui";
import { OpremaSeznam } from "@/app/OpremaSeznam";
import { podpisaniUrlji } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaSSliko, OpremaVrstica } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("v_rbo_oprema_prodaja")
    .select("*")
    .order("id_oprema", { ascending: false });

  const vrstice = (data ?? []) as OpremaVrstica[];
  const urlji = await podpisaniUrlji(
    supabase,
    vrstice.map((v) => v.predstavna_slika).filter((s): s is string => !!s),
  );
  const oprema: OpremaSSliko[] = vrstice.map((v) => ({
    ...v,
    slika_url: v.predstavna_slika ? (urlji.get(v.predstavna_slika) ?? null) : null,
  }));

  return (
    <AppShell
      title="Rabljena oprema"
      subtitle="Upravljanje in pregled rabljene Fines opreme"
      actions={
        <Link href="/dodaj" className={buttonClass("ok")}>
          <Plus size={18} />
          Dodaj rabljeno opremo
        </Link>
      }
    >
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/40 bg-danger/5 p-4 text-[15px]">
          Podatkov ni bilo mogoče naložiti: {error.message}
        </p>
      ) : (
        <OpremaSeznam oprema={oprema} />
      )}
    </AppShell>
  );
}
