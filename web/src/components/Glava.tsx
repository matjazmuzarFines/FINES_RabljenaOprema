"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronLeft, Eye, LogOut } from "lucide-react";
import { odjava } from "@/app/actions";
import { InfoGumb } from "@/components/InfoGumb";
import { Button, IconButton, NavPovezava } from "@/components/ui";
import { lahkoZapustim } from "@/lib/neshranjeno";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";

// Glava aplikacije: logo, Nazaj (razen domače strani), "i" (spremembe), Izhod; spodaj 4 px oranžna črta.
export function Glava({ back, backHint, samoOgled }: { back?: string; backHint: string; samoOgled: boolean }) {
  const router = useRouter();
  const nazaj = () => back && lahkoZapustim() && router.push(back);

  return (
    <header className="sticky top-0 z-40 border-b-4 border-fines-500 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center gap-2 px-3 sm:px-4">
        <NavPovezava href="/" title="Pojdi na domačo stran (seznam opreme)" className="flex shrink-0 items-center">
          <Image src="/fines-logo.png" alt="FINES d.o.o. logotip" width={136} height={36} priority />
        </NavPovezava>
        {back && (
          <Button hint={backHint} variant="neutral" icon={ChevronLeft} className="ml-2 hidden sm:inline-flex" onClick={nazaj}>
            Nazaj
          </Button>
        )}
        <span className="ml-2 hidden min-w-0 flex-1 truncate text-base font-bold text-ink-800 md:block">Rabljena oprema</span>
        {samoOgled && (
          <span
            className="ml-auto inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full bg-ink-100 px-3 text-xs font-bold text-ink-600 md:ml-0"
            title={NAMIG_SAMO_OGLED}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Samo ogled</span>
          </span>
        )}
        <div className={`flex items-center gap-1 sm:gap-2 ${samoOgled ? "" : "ml-auto md:ml-0"}`}>
          {back && <IconButton hint={backHint} icon={ChevronLeft} className="sm:hidden" onClick={nazaj} />}
          <InfoGumb />
          <form action={odjava} onSubmit={(e) => !lahkoZapustim() && e.preventDefault()}>
            <Button type="submit" hint="Odjava in izhod iz aplikacije" variant="primary" icon={LogOut}>
              <span className="hidden sm:inline">Izhod</span>
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
