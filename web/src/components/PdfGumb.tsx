"use client";

import { useState } from "react";
import { ClipboardList, FileArchive, FileClock, FileImage, Loader2, Mail, type LucideIcon } from "lucide-react";
import { Button, IconButton, useToast, type ButtonVariant } from "@/components/ui";
import type { VrstaPdf } from "@/lib/pdf";

const OPIS: Record<VrstaPdf, { namig: string; Ikona: LucideIcon }> = {
  osnovni: { namig: "Prenesi osnovne podatke s slikami (PDF)", Ikona: FileImage },
  kartoteka: { namig: "Prenesi kartoteko opreme kot PDF", Ikona: FileClock },
  "tehnicni-list": { namig: "Prenesi tehnični list opreme kot PDF", Ikona: ClipboardList },
};

const napakaBesedilo = (e: unknown) => `Ni uspelo: ${e instanceof Error ? e.message : e}`;

// Okrogel gumb izvoza; med pripravo se vrti.
// Oranžen = funkcija v aplikaciji (PDF, ZIP), moder = funkcija zunaj aplikacije (e-mail v Outlooku).
function IzvozGumb({
  namig,
  Ikona,
  disabled,
  akcija,
  variant = "primary",
}: {
  namig: string;
  Ikona: LucideIcon;
  disabled?: boolean;
  akcija: () => Promise<void>;
  variant?: ButtonVariant;
}) {
  const [delam, setDelam] = useState(false);
  const obvesti = useToast();

  async function klik() {
    setDelam(true);
    try {
      await akcija();
    } catch (e) {
      obvesti("error", napakaBesedilo(e));
    } finally {
      setDelam(false);
    }
  }

  return <IconButton hint={namig} icon={Ikona} variant={variant} onClick={klik} disabled={disabled || delam} delam={delam} />;
}

// PDF se ustvari v brskalniku iz podatkov v bazi (knjižnica se naloži šele ob kliku)
export function PdfGumb({
  vrsta,
  idOprema,
  disabled,
  namig,
}: {
  vrsta: VrstaPdf;
  idOprema: number;
  disabled?: boolean;
  namig?: string; // nadomesti privzeti namig (npr. ko tehnični list še ne obstaja)
}) {
  const { namig: privzeti, Ikona } = OPIS[vrsta];
  return (
    <IzvozGumb
      namig={namig ?? privzeti}
      Ikona={Ikona}
      disabled={disabled}
      akcija={async () => (await import("@/lib/pdf")).prenesiPdf(vrsta, idOprema)}
    />
  );
}

// Pripravi e-mail za Outlook (datoteka .eml) z zadevo, besedilom in PDF priponkami
export function EmailGumb({ idOprema }: { idOprema: number }) {
  return (
    <IzvozGumb
      namig="Pripravi e-mail s PDF priponkami za Outlook"
      Ikona={Mail}
      variant="sync"
      akcija={async () => (await import("@/lib/pdf")).pripraviEmail(idOprema)}
    />
  );
}

// ZIP vseh slik opreme (gumb v naslovu razdelka Slike)
export function ZipSlikGumb({ idOprema, disabled }: { idOprema: number; disabled?: boolean }) {
  return (
    <IzvozGumb
      namig={disabled ? "Oprema nima slik za prenos" : "Prenesi vse slike opreme kot ZIP"}
      disabled={disabled}
      Ikona={FileArchive}
      akcija={async () => (await import("@/lib/pdf")).prenesiZipSlik(idOprema)}
    />
  );
}

type SkupinskaAkcija = VrstaPdf | "email";

const SKUPINSKO: Record<SkupinskaAkcija, { besedilo: string; namig: string; Ikona: LucideIcon }> = {
  osnovni: { besedilo: "Osnovni podatki", namig: "Prenesi osnovne podatke izbrane opreme (ZIP)", Ikona: FileImage },
  "tehnicni-list": { besedilo: "Tehnični listi", namig: "Prenesi tehnične liste izbrane opreme (ZIP)", Ikona: ClipboardList },
  kartoteka: { besedilo: "Kartoteke", namig: "Prenesi kartoteke izbrane opreme (ZIP)", Ikona: FileClock },
  email: { besedilo: "E-mail", namig: "Pripravi e-mail z dokumenti izbrane opreme", Ikona: Mail },
};

// Gumbi za izbrano opremo: ZIP PDF-jev po vrsti dokumenta in e-mail z vsemi priponkami.
// onemogoceno: vrste dokumentov, ki jih nima nobena izbrana oprema (namig pove zakaj).
export function SkupinskiGumbi({
  idji,
  onemogoceno = {},
}: {
  idji: number[];
  onemogoceno?: Partial<Record<SkupinskaAkcija, string>>;
}) {
  const [delam, setDelam] = useState<{ akcija: SkupinskaAkcija; opravljeno: number; vseh: number } | null>(null);
  const obvesti = useToast();

  async function izvedi(akcija: SkupinskaAkcija) {
    setDelam({ akcija, opravljeno: 0, vseh: idji.length });
    const napredek = (opravljeno: number, vseh: number) => setDelam({ akcija, opravljeno, vseh });
    try {
      const pdf = await import("@/lib/pdf");
      if (akcija === "email") await pdf.pripraviEmail(idji, napredek);
      else await pdf.prenesiZipPdfjev(akcija, idji, napredek);
    } catch (e) {
      obvesti("error", napakaBesedilo(e));
    } finally {
      setDelam(null);
    }
  }

  return (
    <>
      {(Object.keys(SKUPINSKO) as SkupinskaAkcija[]).map((akcija) => {
        const { besedilo, namig, Ikona } = SKUPINSKO[akcija];
        const razlog = onemogoceno[akcija];
        const tece = delam?.akcija === akcija;
        return (
          <Button
            key={akcija}
            variant={akcija === "email" ? "sync" : "primary"}
            icon={tece ? Loader2 : Ikona}
            className={tece ? "[&>svg]:animate-spin" : ""}
            onClick={() => izvedi(akcija)}
            disabled={!!delam || !!razlog || idji.length === 0}
            hint={razlog ?? namig}
          >
            {tece ? `Pripravljam ${Math.min(delam.opravljeno + 1, delam.vseh)}/${delam.vseh}` : besedilo}
          </Button>
        );
      })}
    </>
  );
}
