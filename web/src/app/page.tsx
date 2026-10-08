import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, ErrorText, buttonClass } from "@/components/ui";
import { NAMIG_SAMO_OGLED, jeSamoOgled } from "@/lib/vloga";
import { OpremaSeznam } from "@/app/OpremaSeznam";
import { podpisaniUrlji } from "@/lib/slike";
import { createClient } from "@/lib/supabase/server";
import type { OpremaSSliko, OpremaVrstica } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const samoOgled = await jeSamoOgled(supabase);
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
        samoOgled ? (
          <Button variant="success" icon={Plus} disabled hint={NAMIG_SAMO_OGLED}>
            Dodaj rabljeno opremo
          </Button>
        ) : (
          <Link href="/dodaj" className={buttonClass("success")} title="Dodaj novo rabljeno opremo na seznam">
            <Plus className="h-4 w-4 shrink-0" aria-hidden />
            Dodaj rabljeno opremo
          </Link>
        )
      }
    >
      {error ? <ErrorText>Podatkov ni bilo mogoče naložiti: {error.message}</ErrorText> : <OpremaSeznam oprema={oprema} />}
    </AppShell>
  );
}
