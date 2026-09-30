import { AppShell } from "@/components/AppShell";
import { OpremaObrazec } from "@/app/oprema/OpremaObrazec";
import { naloziSifrante } from "@/lib/sifranti";
import { createClient } from "@/lib/supabase/server";

export default async function DodajPage() {
  const supabase = await createClient();
  const sifranti = await naloziSifrante(supabase);

  return (
    <AppShell
      title="Dodaj rabljeno opremo"
      subtitle="Po shranjevanju se odpre urejanje, kjer dodaš slike."
      back="/"
    >
      <div className="mx-auto max-w-5xl">
        <OpremaObrazec sifranti={sifranti} />
      </div>
    </AppShell>
  );
}
