import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { odjava } from "@/app/actions";
import { buttonClass } from "@/components/ui";

// Okvir vsake strani: Fines logo, gumb Nazaj (razen domače strani), gumb Izhod.
export function AppShell({
  title,
  subtitle,
  back,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  back?: string; // URL za gumb Nazaj; brez njega (domača stran) gumba ni
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-t-[3px] border-brand bg-surface/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-3 px-4 sm:px-6">
          <Link href="/" aria-label="FINES – domača stran" className="shrink-0">
            <Image src="/fines-logo.png" alt="FINES d.o.o. logotip" width={136} height={36} priority />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            {back && (
              <Link href={back} className={buttonClass("neutral")}>
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Nazaj</span>
              </Link>
            )}
            <form action={odjava}>
              <button type="submit" className={buttonClass("neutral")} title="Odjava iz aplikacije">
                <LogOut size={18} />
                <span className="hidden sm:inline">Izhod</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1800px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
            {subtitle && <p className="mt-1 text-[15px] text-ink-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </main>

      <footer className="border-t border-brand/15 bg-surface py-4 text-center text-xs text-ink-faint">
        FINES d.o.o. | Rabljena oprema
      </footer>
    </div>
  );
}
