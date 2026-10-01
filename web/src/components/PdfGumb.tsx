"use client";

import { useState, type ComponentType } from "react";
import { ClipboardList, FileClock, FileImage, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui";
import type { VrstaPdf } from "@/lib/pdf";

const OPIS: Record<VrstaPdf, { namig: string; Ikona: ComponentType<{ size?: number }> }> = {
  osnovni: { namig: "Prenesi osnovne podatke opreme s slikami kot PDF (za kupca)", Ikona: FileImage },
  kartoteka: { namig: "Prenesi kartoteko opreme (zgodovino) kot PDF", Ikona: FileClock },
  "tehnicni-list": { namig: "Prenesi tehnični list opreme kot PDF", Ikona: ClipboardList },
};

type Velikost = "icon" | "iconSm";

// Moder gumb (funkcija izven aplikacije); med pripravo se vrti
function ModerGumb({
  namig,
  Ikona,
  size,
  disabled,
  akcija,
}: {
  namig: string;
  Ikona: ComponentType<{ size?: number }>;
  size: Velikost;
  disabled?: boolean;
  akcija: () => Promise<void>;
}) {
  const [delam, setDelam] = useState(false);
  const velikost = size === "icon" ? 20 : 17;

  async function klik() {
    setDelam(true);
    try {
      await akcija();
    } catch (e) {
      alert(`Ni uspelo: ${e instanceof Error ? e.message : e}`);
    } finally {
      setDelam(false);
    }
  }

  return (
    <Button
      type="button"
      variant="info"
      size={size}
      onClick={klik}
      disabled={disabled || delam}
      title={namig}
      aria-label={namig}
    >
      {delam ? <Loader2 size={velikost} className="animate-spin" /> : <Ikona size={velikost} />}
    </Button>
  );
}

// PDF se ustvari v brskalniku iz podatkov v bazi (knjižnica se naloži šele ob kliku)
export function PdfGumb({
  vrsta,
  idOprema,
  disabled,
  namig,
  size = "icon",
}: {
  vrsta: VrstaPdf;
  idOprema: number;
  disabled?: boolean;
  namig?: string; // nadomesti privzeti namig (npr. ko tehnični list še ne obstaja)
  size?: Velikost;
}) {
  const { namig: privzeti, Ikona } = OPIS[vrsta];
  return (
    <ModerGumb
      namig={namig ?? privzeti}
      Ikona={Ikona}
      size={size}
      disabled={disabled}
      akcija={async () => (await import("@/lib/pdf")).prenesiPdf(vrsta, idOprema)}
    />
  );
}

// Pripravi e-mail za Outlook (datoteka .eml) z zadevo, besedilom in PDF priponkami
export function EmailGumb({ idOprema, size = "icon" }: { idOprema: number; size?: Velikost }) {
  return (
    <ModerGumb
      namig="Pripravi e-mail v Outlooku s podatki o opremi v priponki"
      Ikona={Mail}
      size={size}
      akcija={async () => (await import("@/lib/pdf")).pripraviEmail(idOprema)}
    />
  );
}
