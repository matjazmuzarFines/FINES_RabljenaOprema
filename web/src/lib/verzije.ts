// Zgodovina sprememb (gumb "i" v glavi). Najnovejša verzija je prva.
// Manjši popravki: 1.01 -> 1.02; nova funkcija ali podstran: 1.xx -> 2.01.
export const VERZIJE: { verzija: string; datum: string; spremembe: string[] }[] = [
  {
    verzija: "4.01",
    datum: "2026-10-10",
    spremembe: [
      "Poskusno AI iskanje na domači strani: »Iščeš rabljeno opremo?« – opiši s svojimi besedami, kaj iščeš, in prikaže se najbolj ustrezna oprema (prodana oprema se ne prikaže).",
      "Odprtokodni model (multilingual-e5-small) teče v brskalniku; ob prvi uporabi se prenese ~120 MB, podatki ne gredo k zunanjim AI storitvam.",
      "Oznake opreme v vprašanju (npr. FB, FD64) omejijo zadetke na opremo s to oznako; »Koliko …« prikaže število postavk in količino; sinonimi za interne izraze.",
    ],
  },
  {
    verzija: "3.01",
    datum: "2026-10-08",
    spremembe: [
      "Ocena stanja je od 1 do 5 (ocena 6 je ukinjena, obstoječe ocene 6 so postale 5). Ob oceni je opis: 1 uničeno, neuporabno, neurejeno · 2 zelo rabljeno · 3 vidno rabljeno · 4 očiščeno, skoraj novo · 5 kot novo.",
      "Prodaja: garancija z izbiro DA/NE in lestvico 6, 12 ali 24 mesecev (pri NE je lestvica zaklenjena).",
      "Pregled opreme: moder znak garancije v levem spodnjem kotu slike (samo oprema z garancijo).",
      "PDF osnovnih podatkov: ocena z opisom in garancija.",
      "Barve gumbov: prenos PDF/ZIP je oranžen (funkcija v aplikaciji), e-mail moder (Outlook), beli gumbi samo spremenijo prikaz (Nazaj, Ponastavi filtre, Tehnični list ...); Izhod oranžen.",
    ],
  },
  {
    verzija: "2.02",
    datum: "2026-10-08",
    spremembe: [
      "Poenotenje s standardnimi komponentami Fines (app_instructions.md): barve, gumbi 40 px, polja, kartice, okna in obvestila enaki kot v ostalih Fines aplikacijah.",
      "Glava: logo, Nazaj, »i« in Izhod v enotnem slogu, spodaj oranžna črta; verzija v nogi.",
      "Pregled opreme: kartice statusov prodaje s številom opreme (klik prikaže / skrije status) namesto spustnega seznama in stikala »Prikaži prodano«.",
      "Filtri v eni vrstici z naslovi nad polji; iskalna polja z lupo.",
      "Gumbi za izvoz (PDF, e-mail, ZIP) so beli z obrobo, pod naslovom »Izvoz«; Osveži podatke je moder.",
      "Obrazca opreme in tehničnega lista: spodnja vrstica s številom neshranjenih sprememb, Prekliči in Shrani; opozorilo pred odhodom s strani.",
      "Napake pri prenosu se prikažejo kot obvestilo na vrhu strani.",
    ],
  },
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
