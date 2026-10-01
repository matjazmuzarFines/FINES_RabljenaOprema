// PDF dokumenti opreme (ustvarijo se v brskalniku): kartoteka opreme in tehnični list.
// Pisava DejaVu Sans podpira č, š, ž. Podatki se naložijo iz baze ob kliku na prenos.
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";
import { danes, prikazDatuma } from "@/lib/datum";
import { pripraviSliko } from "@/lib/pripraviSliko";
import { MESTA_SLIK, slikeOpreme, type ObstojecaSlika, type VrstaSlike } from "@/lib/slike";
import { createClient } from "@/lib/supabase/client";
import { TL_SKLOPI, type OpremaVrstica, type TehnicniList, type ZapisKartoteke } from "@/lib/types";

const A4: [number, number] = [595.28, 841.89];
const ROB = 42;
const SIRINA = A4[0] - 2 * ROB;
const ORANZNA = rgb(232 / 255, 89 / 255, 12 / 255);
const TEMNA = rgb(0.1, 0.1, 0.1);
const SIVA = rgb(0.42, 0.42, 0.42);
const CRTA = rgb(0.86, 0.85, 0.83);
const OZADJE_SLIKE = rgb(0.95, 0.94, 0.93);

export const evri = (n: number) =>
  n.toLocaleString("sl-SI", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

// ---------------------------------------------------------------------------
// Podatki

export type PodatkiOpreme = {
  oprema: OpremaVrstica;
  kartoteka: ZapisKartoteke[];
  tehnicniList: TehnicniList | null;
  slike: Partial<Record<VrstaSlike, ObstojecaSlika>>;
};

export async function naloziPodatkeOpreme(idOprema: number): Promise<PodatkiOpreme> {
  const supabase = createClient();
  const [oprema, kartoteka, tl, slike] = await Promise.all([
    supabase.from("v_rbo_oprema_prodaja").select("*").eq("id_oprema", idOprema).single(),
    supabase
      .from("rbo_kartoteka")
      .select("id, datum_vnosa, besedilo_vnosa, strosek")
      .eq("id_oprema", idOprema)
      .eq("visible", true)
      .order("datum_vnosa", { ascending: false })
      .order("id", { ascending: false }),
    supabase.from("rbo_tehnicni_list").select("*").eq("id_oprema", idOprema).eq("visible", true).maybeSingle(),
    slikeOpreme(supabase, idOprema),
  ]);
  if (oprema.error) throw new Error(`Opreme ni bilo mogoče naložiti: ${oprema.error.message}`);
  return {
    oprema: oprema.data as OpremaVrstica,
    kartoteka: (kartoteka.data ?? []) as ZapisKartoteke[],
    tehnicniList: (tl.data as TehnicniList | null) ?? null,
    slike,
  };
}

// ---------------------------------------------------------------------------
// Pomožno

const naloziBajte = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Prenos ni uspel: ${url}`);
  return new Uint8Array(await r.arrayBuffer());
};

// Fotografije se pred vgradnjo pomanjšajo (manjši PDF); ob napaki PDF nastane brez slike
async function vgradiFotografijo(pdf: PDFDocument, url: string | null | undefined, maxStranica = 1400) {
  if (!url) return null;
  try {
    const blob = await (await fetch(url)).blob();
    const jpg = await pripraviSliko(blob, maxStranica, 0.8);
    return await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
  } catch {
    return null;
  }
}

// Razbije besedilo v vrstice, ki ustrezajo širini (upošteva tudi prelome vrstic in predolge besede)
function prelomi(besedilo: string, font: PDFFont, velikost: number, sirina: number): string[] {
  const vrstice: string[] = [];
  for (const odstavek of besedilo.replace(/\r/g, "").split("\n")) {
    let vrstica = "";
    for (const beseda of odstavek.split(/\s+/).filter(Boolean)) {
      const kandidat = vrstica ? `${vrstica} ${beseda}` : beseda;
      if (font.widthOfTextAtSize(kandidat, velikost) <= sirina) {
        vrstica = kandidat;
        continue;
      }
      if (vrstica) vrstice.push(vrstica);
      let ostanek = beseda;
      while (font.widthOfTextAtSize(ostanek, velikost) > sirina) {
        let n = ostanek.length;
        while (n > 1 && font.widthOfTextAtSize(ostanek.slice(0, n), velikost) > sirina) n--;
        vrstice.push(ostanek.slice(0, n));
        ostanek = ostanek.slice(n);
      }
      vrstica = ostanek;
    }
    vrstice.push(vrstica);
  }
  return vrstice;
}

// Piše dokument od zgoraj navzdol in sam doda novo stran, ko zmanjka prostora
class Pisec {
  stran: PDFPage;
  y: number;

  private constructor(
    readonly pdf: PDFDocument,
    readonly navadna: PDFFont,
    readonly krepka: PDFFont,
    readonly logo: PDFImage | null,
  ) {
    this.stran = pdf.addPage(A4);
    this.y = A4[1] - ROB;
  }

  static async ustvari(naslov: string) {
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    pdf.setTitle(naslov);
    pdf.setAuthor("FINES d.o.o.");
    const [navadna, krepka, logo] = await Promise.all([
      naloziBajte("/fonts/DejaVuSans.ttf").then((b) => pdf.embedFont(b, { subset: true })),
      naloziBajte("/fonts/DejaVuSans-Bold.ttf").then((b) => pdf.embedFont(b, { subset: true })),
      naloziBajte("/fines-logo.png")
        .then((b) => pdf.embedPng(b))
        .catch(() => null),
    ]);
    return new Pisec(pdf, navadna, krepka, logo);
  }

  novaStran() {
    this.stran = this.pdf.addPage(A4);
    this.y = A4[1] - ROB;
  }

  prostor(visina: number) {
    if (this.y - visina < ROB + 30) this.novaStran();
  }

  tekst(t: string, x: number, velikost: number, font = this.navadna, barva = TEMNA) {
    this.stran.drawText(t, { x, y: this.y, size: velikost, font, color: barva });
  }

  desno(t: string, y: number, velikost: number, font: PDFFont, barva = TEMNA) {
    this.stran.drawText(t, { x: A4[0] - ROB - font.widthOfTextAtSize(t, velikost), y, size: velikost, font, color: barva });
  }

  glava(naslovDokumenta: string) {
    if (this.logo) {
      const s = this.logo.scaleToFit(120, 32);
      this.stran.drawImage(this.logo, { x: ROB, y: this.y - s.height, width: s.width, height: s.height });
    }
    this.desno(naslovDokumenta, this.y - 14, 16, this.krepka);
    this.desno(`Natisnjeno: ${prikazDatuma(danes())}`, this.y - 28, 9, this.navadna, SIVA);
    this.y -= 44;
    this.stran.drawRectangle({ x: ROB, y: this.y, width: SIRINA, height: 2, color: ORANZNA });
    this.y -= 26;
  }

  nazivOpreme(o: OpremaVrstica) {
    for (const v of prelomi(o.oprema_naziv, this.krepka, 18, SIRINA)) {
      this.tekst(v, ROB, 18, this.krepka);
      this.y -= 22;
    }
    this.tekst([`ID ${o.id_oprema}`, o.skupina_opreme].filter(Boolean).join("  ·  "), ROB, 10, this.navadna, SIVA);
    this.y -= 22;
  }

  // potrebno: koliko prostora mora ostati pod naslovom (da naslov ne ostane sam na dnu strani)
  podnaslov(t: string, potrebno = 50) {
    this.y -= 8;
    this.prostor(potrebno);
    this.stran.drawRectangle({ x: ROB, y: this.y - 4, width: 3, height: 16, color: ORANZNA });
    this.tekst(t, ROB + 10, 13, this.krepka);
    this.y -= 24;
  }

  // Tabela oznaka / vrednost; stolpcev = 1 ali 2
  tabela(pari: [string, string][], sirina = SIRINA, stolpcev: 1 | 2 = 1) {
    const sirinaStolpca = (sirina - (stolpcev - 1) * 20) / stolpcev;
    const sirinaOznake = Math.min(120, sirinaStolpca * 0.42);
    for (let i = 0; i < pari.length; i += stolpcev) {
      const vrsta = pari.slice(i, i + stolpcev).map(([oznaka, vrednost]) => ({
        oznaka,
        vrstice: prelomi(vrednost || "–", this.krepka, 10, sirinaStolpca - sirinaOznake),
      }));
      const visina = Math.max(...vrsta.map((c) => c.vrstice.length)) * 13;
      this.prostor(visina + 5);
      vrsta.forEach((c, j) => {
        const x = ROB + j * (sirinaStolpca + 20);
        this.stran.drawText(c.oznaka, { x, y: this.y, size: 9, font: this.navadna, color: SIVA });
        c.vrstice.forEach((v, k) =>
          this.stran.drawText(v, { x: x + sirinaOznake, y: this.y - k * 13, size: 10, font: this.krepka, color: TEMNA }),
        );
      });
      this.y -= visina + 5;
    }
  }

  odstavek(oznaka: string, besedilo: string) {
    this.prostor(30);
    this.tekst(oznaka, ROB, 9, this.navadna, SIVA);
    this.y -= 14;
    for (const v of prelomi(besedilo, this.navadna, 10, SIRINA)) {
      this.prostor(14);
      this.tekst(v, ROB, 10);
      this.y -= 14;
    }
  }

  // Slika, umeščena v okvir (ohrani razmerje stranic)
  slikaVOkvir(slika: PDFImage | null, x: number, yZgoraj: number, w: number, h: number) {
    this.stran.drawRectangle({ x, y: yZgoraj - h, width: w, height: h, color: OZADJE_SLIKE });
    if (!slika) {
      const t = "Ni slike";
      this.stran.drawText(t, {
        x: x + (w - this.navadna.widthOfTextAtSize(t, 9)) / 2,
        y: yZgoraj - h / 2 - 3,
        size: 9,
        font: this.navadna,
        color: SIVA,
      });
      return;
    }
    const s = slika.scaleToFit(w, h);
    this.stran.drawImage(slika, { x: x + (w - s.width) / 2, y: yZgoraj - h + (h - s.height) / 2, width: s.width, height: s.height });
  }

  static VISINA_VRSTE_SLIK = ((SIRINA - 16) / 2) * 0.72 + 26;

  mrezaSlik(slike: { naslov: string; slika: PDFImage | null }[]) {
    const stolpcev = 2;
    const w = (SIRINA - 16) / stolpcev;
    const h = w * 0.72;
    for (let i = 0; i < slike.length; i += stolpcev) {
      this.prostor(h + 26);
      slike.slice(i, i + stolpcev).forEach((s, j) => {
        const x = ROB + j * (w + 16);
        this.stran.drawText(s.naslov, { x, y: this.y, size: 9, font: this.krepka, color: TEMNA });
        this.slikaVOkvir(s.slika, x, this.y - 6, w, h);
      });
      this.y -= h + 26;
    }
  }

  async koncaj(nogaLevo: string) {
    const strani = this.pdf.getPages();
    strani.forEach((s, i) => {
      const desno = `Stran ${i + 1} / ${strani.length}`;
      s.drawRectangle({ x: ROB, y: ROB - 2, width: SIRINA, height: 0.5, color: CRTA });
      s.drawText(nogaLevo, { x: ROB, y: ROB - 16, size: 8, font: this.navadna, color: SIVA });
      s.drawText(desno, {
        x: A4[0] - ROB - this.navadna.widthOfTextAtSize(desno, 8),
        y: ROB - 16,
        size: 8,
        font: this.navadna,
        color: SIVA,
      });
    });
    const bajti = await this.pdf.save();
    return new Blob([bajti as BlobPart], { type: "application/pdf" });
  }
}

const osnovniPodatki = (o: OpremaVrstica): [string, string][] => [
  ["Ident (koda)", o.koda ?? ""],
  ["Serijska številka", o.serijska_stevilka ?? ""],
  ["Leto proizvodnje", o.leto_proizvodnje?.toString() ?? ""],
  ["Datum prejema", o.datum_prejema ? prikazDatuma(o.datum_prejema) : ""],
  ["Količina", `${o.kolicina} ${o.em ?? ""}`.trim()],
  ["Lastništvo", o.lastnistvo ?? ""],
  ["Skladišče", o.skladisce ?? ""],
  ["Ocena stanja", o.ocena ? `${o.ocena} / 6` : ""],
  ["Status prodaje", o.status_prodaje ?? ""],
];

// ---------------------------------------------------------------------------
// Kartoteka opreme

export async function ustvariKartotekoPdf({ oprema, kartoteka, slike }: PodatkiOpreme): Promise<Blob> {
  const p = await Pisec.ustvari(`Kartoteka opreme ${oprema.id_oprema} – ${oprema.oprema_naziv}`);
  const predstavna = await vgradiFotografijo(p.pdf, slike.Predstavna?.url, 900);

  p.glava("Kartoteka opreme");
  p.nazivOpreme(oprema);

  // osnovni podatki levo, predstavna slika desno
  const zacetekY = p.y;
  if (predstavna) p.slikaVOkvir(predstavna, A4[0] - ROB - 200, zacetekY + 8, 200, 150);
  p.tabela(osnovniPodatki(oprema), predstavna ? SIRINA - 220 : SIRINA);
  if (predstavna) p.y = Math.min(p.y, zacetekY - 160);
  if (oprema.komentar) {
    p.y -= 6;
    p.odstavek("Komentar", oprema.komentar);
  }

  p.podnaslov("Zgodovina");
  const skupaj = kartoteka.reduce((s, z) => s + (z.strosek ?? 0), 0);
  if (skupaj > 0) {
    p.tekst(`Skupni stroški: ${evri(skupaj)}`, ROB, 10, p.krepka);
    p.y -= 20;
  }
  if (kartoteka.length === 0) p.tekst("V kartoteki ni zapisov.", ROB, 10, p.navadna, SIVA);

  const urejeni = [...kartoteka].sort(
    (a, b) => b.datum_vnosa.localeCompare(a.datum_vnosa) || (b.id ?? 0) - (a.id ?? 0),
  );
  const xBesedila = ROB + 22;
  for (const z of urejeni) {
    const vrstice = prelomi(z.besedilo_vnosa, p.navadna, 10, SIRINA - 22);
    p.prostor(30);
    p.stran.drawCircle({ x: ROB + 5, y: p.y + 3.5, size: 4, color: ORANZNA });
    p.tekst(prikazDatuma(z.datum_vnosa), xBesedila, 10, p.krepka);
    if (z.strosek != null) p.desno(`Strošek: ${evri(z.strosek)}`, p.y, 10, p.krepka);
    p.y -= 15;
    for (const v of vrstice) {
      p.prostor(14);
      p.stran.drawRectangle({ x: ROB + 4.5, y: p.y - 3, width: 1, height: 15, color: CRTA });
      p.tekst(v, xBesedila, 10);
      p.y -= 14;
    }
    p.y -= 8;
  }

  return p.koncaj(`FINES d.o.o. | Rabljena oprema | Kartoteka ID ${oprema.id_oprema}`);
}

// ---------------------------------------------------------------------------
// Tehnični list

export async function ustvariTehnicniListPdf({ oprema, tehnicniList, slike }: PodatkiOpreme): Promise<Blob> {
  const p = await Pisec.ustvari(`Tehnični list ${oprema.id_oprema} – ${oprema.oprema_naziv}`);
  const fotografije = await Promise.all(
    MESTA_SLIK.map(async (m) => ({ naslov: m.naslov, slika: await vgradiFotografijo(p.pdf, slike[m.vrsta]?.url) })),
  );

  p.glava("Tehnični list");
  p.nazivOpreme(oprema);

  p.podnaslov("Podatki opreme");
  p.tabela(osnovniPodatki(oprema), SIRINA, 2);

  for (const sklop of TL_SKLOPI) {
    p.podnaslov(sklop.naslov);
    p.tabela(
      sklop.polja.map((f) => [f.oznaka, tehnicniList?.[f.kljuc]?.toString() ?? ""]),
      SIRINA,
      2,
    );
  }
  if (tehnicniList?.opis) {
    p.podnaslov("Opis");
    for (const v of prelomi(tehnicniList.opis, p.navadna, 10, SIRINA)) {
      p.prostor(14);
      p.tekst(v, ROB, 10);
      p.y -= 14;
    }
  }

  p.podnaslov("Slike", Pisec.VISINA_VRSTE_SLIK + 30);
  p.mrezaSlik(fotografije);

  return p.koncaj(`FINES d.o.o. | Rabljena oprema | Tehnični list ID ${oprema.id_oprema}`);
}

// ---------------------------------------------------------------------------
// Osnovni podatki (za kupca): brez prodajnih podatkov, statusa, lastništva, skladišča in komentarja

export async function ustvariOsnovnePodatkePdf({ oprema, slike }: PodatkiOpreme): Promise<Blob> {
  const p = await Pisec.ustvari(`Osnovni podatki ${oprema.id_oprema} – ${oprema.oprema_naziv}`);
  const mesta = MESTA_SLIK.filter((m) => m.vrsta !== "Krmiljenje" && slike[m.vrsta]?.url);
  const fotografije = (
    await Promise.all(
      mesta.map(async (m) => ({ naslov: m.naslov, slika: await vgradiFotografijo(p.pdf, slike[m.vrsta]?.url) })),
    )
  ).filter((f) => f.slika);

  p.glava("Rabljena oprema");
  p.nazivOpreme(oprema);

  p.podnaslov("Osnovni podatki");
  p.tabela(
    [
      ["Skupina opreme", oprema.skupina_opreme ?? ""],
      ["Ident (koda)", oprema.koda ?? ""],
      ["Serijska številka", oprema.serijska_stevilka ?? ""],
      ["Leto proizvodnje", oprema.leto_proizvodnje?.toString() ?? ""],
      ["Ocena stanja", oprema.ocena ? `${oprema.ocena} / 6` : ""],
    ],
    SIRINA,
    2,
  );

  if (fotografije.length > 0) {
    p.podnaslov("Slike", Pisec.VISINA_VRSTE_SLIK + 30);
    p.mrezaSlik(fotografije);
  }

  return p.koncaj(`FINES d.o.o. | Rabljena oprema | ID ${oprema.id_oprema}`);
}

// ---------------------------------------------------------------------------
// Prenos

export type VrstaPdf = "osnovni" | "kartoteka" | "tehnicni-list";

const PREDPONA: Record<VrstaPdf, string> = {
  osnovni: "Osnovni_podatki",
  kartoteka: "Kartoteka",
  "tehnicni-list": "Tehnicni_list",
};

const USTVARI: Record<VrstaPdf, (p: PodatkiOpreme) => Promise<Blob>> = {
  osnovni: ustvariOsnovnePodatkePdf,
  kartoteka: ustvariKartotekoPdf,
  "tehnicni-list": ustvariTehnicniListPdf,
};

// Ime datoteke samo z ASCII znaki (č -> c ...), da ga razume vsak e-mail odjemalec
export const imeDatotekePdf = (vrsta: VrstaPdf, o: OpremaVrstica) =>
  `${PREDPONA[vrsta]}_${o.id_oprema}_${o.oprema_naziv}`
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/_+/g, "_") + ".pdf";

export function prenesiDatoteko(blob: Blob, ime: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = ime;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function prenesiPdf(vrsta: VrstaPdf, idOprema: number) {
  const podatki = await naloziPodatkeOpreme(idOprema);
  prenesiDatoteko(await USTVARI[vrsta](podatki), imeDatotekePdf(vrsta, podatki.oprema));
}

// ---------------------------------------------------------------------------
// E-mail za Outlook: datoteka .eml z oznako X-Unsent, ki jo Outlook odpre kot novo (neposlano) sporočilo.
// Priponke: osnovni podatki vedno, kartoteka in tehnični list, če obstajata.

const CRLF = "\r\n";

function base64(bajti: Uint8Array) {
  let niz = "";
  for (let i = 0; i < bajti.length; i += 0x8000) niz += String.fromCharCode(...bajti.subarray(i, i + 0x8000));
  return btoa(niz);
}
const vrstice76 = (b64: string) => b64.replace(/.{1,76}/g, (m) => m + CRLF);
const utf8Glava = (t: string) => `=?UTF-8?B?${base64(new TextEncoder().encode(t))}?=`;

export async function pripraviEmail(idOprema: number) {
  const podatki = await naloziPodatkeOpreme(idOprema);
  const vrste: VrstaPdf[] = ["osnovni"];
  if (podatki.tehnicniList) vrste.push("tehnicni-list");
  if (podatki.kartoteka.length > 0) vrste.push("kartoteka");

  const priponke = await Promise.all(
    vrste.map(async (v) => ({
      ime: imeDatotekePdf(v, podatki.oprema),
      bajti: new Uint8Array(await (await USTVARI[v](podatki)).arrayBuffer()),
    })),
  );

  const meja = `----=_RBO_${Date.now().toString(36)}`;
  const html =
    `<html><body style="font-family:Calibri,Arial,sans-serif;font-size:11pt">` +
    `<p>Pozdravljeni,</p><p>V priponki pošiljam podatke o omenjeni rabljeni opremi.</p>` +
    `</body></html>`;

  const deli = [
    "X-Unsent: 1",
    "To: ",
    `Subject: ${utf8Glava(podatki.oprema.oprema_naziv)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${meja}"`,
    "",
    `--${meja}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    vrstice76(base64(new TextEncoder().encode(html))),
    ...priponke.flatMap((p) => [
      `--${meja}`,
      `Content-Type: application/pdf; name="${p.ime}"`,
      `Content-Disposition: attachment; filename="${p.ime}"`,
      "Content-Transfer-Encoding: base64",
      "",
      vrstice76(base64(p.bajti)),
    ]),
    `--${meja}--`,
    "",
  ];

  const ime = imeDatotekePdf("osnovni", podatki.oprema).replace(/^Osnovni_podatki_/, "E-mail_").replace(/\.pdf$/, ".eml");
  prenesiDatoteko(new Blob([deli.join(CRLF)], { type: "message/rfc822" }), ime);
}
