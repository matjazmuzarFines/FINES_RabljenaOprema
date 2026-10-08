import type { ReactNode } from "react";
import { Glava } from "@/components/Glava";
import { createClient } from "@/lib/supabase/server";
import { TRENUTNA_VERZIJA } from "@/lib/verzije";
import { jeSamoOgled } from "@/lib/vloga";

// Okvir vsake strani: glava (logo, Nazaj, i, Izhod), naslov in podnaslov levo, akcije desno zgoraj.
export async function AppShell({
  title,
  subtitle,
  back,
  backHint = "Nazaj na seznam rabljene opreme",
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string; // URL za gumb Nazaj; brez njega (domača stran) gumba ni
  backHint?: string; // hover tekst za gumb Nazaj
  actions?: ReactNode;
  children: ReactNode;
}) {
  const samoOgled = await jeSamoOgled(await createClient());
  return (
    <div className="flex min-h-dvh flex-col">
      <Glava back={back} backHint={backHint} samoOgled={samoOgled} />

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-3 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-bold text-ink-900">{title}</h1>
            {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-end gap-2">{actions}</div>}
        </div>
        {children}
      </main>

      <footer className="border-t border-ink-200 bg-white px-4 py-2 text-center text-xs text-ink-500">
        FINES d.o.o. | Rabljena oprema | Verzija {TRENUTNA_VERZIJA}
      </footer>
    </div>
  );
}
