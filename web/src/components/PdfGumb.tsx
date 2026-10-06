"use client";

import { useState, type ComponentType } from "react";
import { ClipboardList, FileArchive, FileClock, FileImage, Loader2, Mail } from "lucide-react";
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

// ZIP vseh slik opreme (gumb v naslovu razdelka Slike)
export function ZipSlikGumb({ idOprema, disabled }: { idOprema: number; disabled?: boolean }) {
  return (
    <ModerGumb
      namig={disabled ? "Oprema nima slik za prenos" : "Prenesi vse slike opreme kot ZIP"}
      disabled={disabled}
      Ikona={FileArchive}
      size="iconSm"
      akcija={async () => (await import("@/lib/pdf")).prenesiZipSlik(idOprema)}
    />
  );
}

type SkupinskaAkcija = VrstaPdf | "email";

const SKUPINSKO: Record<SkupinskaAkcija, { besedilo: string; namig: string; Ikona: ComponentType<{ size?: number }> }> = {
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

  async function izvedi(akcija: SkupinskaAkcija) {
    setDelam({ akcija, opravljeno: 0, vseh: idji.length });
    const napredek = (opravljeno: number, vseh: number) => setDelam({ akcija, opravljeno, vseh });
    try {
      const pdf = await import("@/lib/pdf");
      if (akcija === "email") await pdf.pripraviEmail(idji, napredek);
      else await pdf.prenesiZipPdfjev(akcija, idji, napredek);
    } catch (e) {
      alert(`Ni uspelo: ${e instanceof Error ? e.message : e}`);
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
            type="button"
            variant="info"
            size="sm"
            onClick={() => izvedi(akcija)}
            disabled={!!delam || !!razlog || idji.length === 0}
            title={razlog ?? namig}
            aria-label={razlog ?? namig}
          >
            {tece ? <Loader2 size={16} className="animate-spin" /> : <Ikona size={16} />}
            {tece ? `Pripravljam ${Math.min(delam.opravljeno + 1, delam.vseh)}/${delam.vseh}` : besedilo}
          </Button>
        );
      })}
    </>
  );
}
