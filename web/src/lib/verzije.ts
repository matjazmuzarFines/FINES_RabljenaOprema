// Zgodovina sprememb (gumb "i" v glavi). Najnovejša verzija je prva.
// Manjši popravki: 1.01 -> 1.02; nova funkcija ali podstran: 1.xx -> 2.01.
export const VERZIJE: { verzija: string; datum: string; spremembe: string[] }[] = [
  {
    verzija: "2.01",
    datum: "2026-10-06",
    spremembe: [
      "Na pregledu opreme je prikazana prodajna cena (zavihek Prodaja).",
      "Izbira več opreme hkrati (kvadratek na kartici, gumb »Izberi prikazane«).",
      "Vrstica z izbrano opremo: prenos osnovnih podatkov, tehničnih listov in kartotek kot ZIP PDF-jev ter e-mail z vsemi priponkami. Oprema brez podatkov za dokument se preskoči.",
      "Pri urejanju opreme gumb za prenos vseh slik kot ZIP (desno zgoraj v razdelku Slike).",
      "Gumb »i« z zgodovino sprememb in verzij.",
    ],
  },
  {
    verzija: "1.01",
    datum: "2026-10-01",
    spremembe: [
      "Prenova aplikacije iz Power Apps (Vercel + Supabase): seznam opreme s filtri, dodajanje in urejanje opreme, prodaja, slike, kartoteka in tehnični list.",
      "PDF dokumenti (osnovni podatki, kartoteka, tehnični list) in priprava e-maila za Outlook.",
      "Prijava s službenim računom in vloga »samo ogled«.",
    ],
  },
];

export const TRENUTNA_VERZIJA = VERZIJE[0].verzija;
