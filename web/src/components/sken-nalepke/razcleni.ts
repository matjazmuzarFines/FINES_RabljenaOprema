// Iz prebranih okvirjev besedila (OCR) poišče osnovne podatke opreme (brez datuma prejema, količine in EM).
// Na nalepki je oznaka (npr. »SERIAL NUMBER:« / »Serijska št.«), vrednost pa desno od nje ali pod njo.
// OCR se pri oznakah zmoti (»PROCUCT TYPE«), zato se oznake primerjajo približno.

export type Polje = "oprema_naziv" | "koda" | "serijska_stevilka" | "leto_proizvodnje" | "skupina_opreme";
export type Najdeno = Partial<Record<Polje, string>>;
export type Okvir = { text: string; poly: number[][] };

export const IMENA_POLJ: Record<Polje, string> = {
  oprema_naziv: "Naziv opreme",
  koda: "Ident (koda)",
  serijska_stevilka: "Serijska številka",
  leto_proizvodnje: "Leto proizvodnje",
  skupina_opreme: "Skupina opreme",
};

type IskanoPolje = Exclude<Polje, "skupina_opreme">;

// Oznake na nalepkah (sl, en, de). Pri več oznakah za isto polje ima prednost prej naštet.
const OZNAKE: Record<IskanoPolje, string[]> = {
  oprema_naziv: ["product type", "tip proizvoda", "tip produkta", "model", "modell", "typ", "type", "tip", "bezeichnung"],
  koda: ["product code", "koda proizvoda", "sifra izdelka", "ident", "art nr", "artikel nr", "item no", "part no"],
  serijska_stevilka: [
    "serial number",
    "serial no",
    "serial nr",
    "serijska stevilka",
    "serijska st",
    "ser nr",
    "s n",
    "serien nr",
    "fabrik nr",
  ],
  leto_proizvodnje: [
    "production year",
    "product year",
    "leto izdelave",
    "leto proizvodnje",
    "year",
    "mfg date",
    "datum proizvodnje",
    "baujahr",
  ],
};

// Ostale oznake na nalepkah: niso vrednost nobenega polja
const DRUGE_OZNAKE = [
  "weight", "masa", "teza", "ip code", "ip koda", "ip zascita", "ip protection", "tray capacity", "kapaciteta", "capacity",
  "water press", "tlak vode", "rated in power", "nazivna vhodna moc", "nazivna vh moc", "supply system", "napajalni sistem",
  "fuses", "varovalke", "voltage", "napetost", "el napetost", "current", "tok", "power", "moc", "max moc", "max power",
  "consumption", "potrosnja", "gas", "plin", "cat", "v code", "koda za preverjanje", "serial number code", "product code",
  "made in slovenia", "made in eu", "stopnja zascite", "protection level", "factory code", "product",
];

const normaliziraj = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]+/g, " ")
    .trim();

function razdalja(a: string, b: string): number {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prej = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prej + (a[i - 1] === b[j - 1] ? 0 : 1));
      prej = t;
    }
  }
  return d[b.length];
}

/** Ali je besedilo (približno) enako oznaki; dovoljena ~1 napaka na 4 črke. */
function jeOznaka(besedilo: string, oznaka: string): boolean {
  const a = normaliziraj(besedilo).replace(/ /g, "");
  const b = oznaka.replace(/ /g, "");
  if (!a || Math.abs(a.length - b.length) > 2) return false;
  return razdalja(a, b) <= (b.length <= 3 ? 0 : Math.floor(b.length / 4));
}

const VSE_OZNAKE = [...Object.values(OZNAKE).flat(), ...DRUGE_OZNAKE];
const jeKateraOznaka = (besedilo: string) => VSE_OZNAKE.some((o) => jeOznaka(besedilo, o));

type Skatla = { text: string; x1: number; x2: number; y1: number; y2: number; h: number; cy: number };

function skatla(o: Okvir): Skatla {
  const xs = o.poly.map((p) => p[0]);
  const ys = o.poly.map((p) => p[1]);
  const y1 = Math.min(...ys);
  const y2 = Math.max(...ys);
  return { text: o.text.trim(), x1: Math.min(...xs), x2: Math.max(...xs), y1, y2, h: y2 - y1, cy: (y1 + y2) / 2 };
}

const LETO = /(?<!\d)(19[5-9]\d|20\d{2})(?!\d)/;
// Fines formati: serijska 24.1113.024 (tudi 18.0391.005.1.370) ali F011115330, ident 100-601.3007
const FORMAT_SERIJSKA = /^(?:\d{2}\.\d{4}\.\d{3}(?:\.[\d.]+)?|F\d{9})$/;
const FORMAT_KODA = /^100-\d{3}(?:\.\d+)?$/;

function veljavna(polje: IskanoPolje, vrednost: string): string | null {
  const v = vrednost.replace(/^[\s:.#=\-|]+/, "").replace(/\s+/g, " ").trim();
  if (!v || jeKateraOznaka(v) || /www\.|@|\.(si|com|eu)\b/i.test(v)) return null;
  if (polje === "leto_proizvodnje") {
    const l = v.match(LETO)?.[1];
    return l && Number(l) <= new Date().getFullYear() ? l : null;
  }
  if (polje === "oprema_naziv") return /[\p{L}\p{N}]{2}/u.test(v) ? v.slice(0, 80) : null;
  // serijska, ident: šifra s številkami, npr. 24.1113.024 ali 100-601.3007
  const sifra = v
    .split(" ")
    .find((b) => /\d/.test(b) && b.length >= 3)
    ?.replace(/[.\-/:]+$/, "");
  if (!sifra) return null;
  // ident ni serijska in obratno (vrednosti sta na nalepki pogosto ena pod drugo)
  if (polje === "koda" && FORMAT_SERIJSKA.test(sifra)) return null;
  if (polje === "serijska_stevilka" && FORMAT_KODA.test(sifra)) return null;
  return sifra;
}

/** Vrednost za oznako: najprej desno v isti vrstici, sicer pod oznako. */
function vrednostZa(oznaka: Skatla, skatle: Skatla[], polje: IskanoPolje): string | null {
  const desno = skatle
    .filter((s) => s !== oznaka && s.x1 > oznaka.x2 - oznaka.h * 0.5 && Math.abs(s.cy - oznaka.cy) < oznaka.h * 1.2)
    // najbližja: vodoravni odmik + navpični zamik (ta šteje trikrat)
    .sort((a, b) => a.x1 - oznaka.x2 + 3 * Math.abs(a.cy - oznaka.cy) - (b.x1 - oznaka.x2 + 3 * Math.abs(b.cy - oznaka.cy)));
  const spodaj = skatle
    .filter(
      (s) =>
        s !== oznaka &&
        s.y1 > oznaka.cy &&
        s.y1 < oznaka.y2 + oznaka.h * 3 &&
        s.x1 < oznaka.x2 &&
        s.x2 > oznaka.x1,
    )
    .sort((a, b) => a.y1 - b.y1);
  for (const s of [...desno.slice(0, 2), ...spodaj.slice(0, 2)]) {
    const v = veljavna(polje, s.text);
    if (v) return v;
  }
  return null;
}

/**
 * okvirji: rezultat OCR; skupine: šifrant skupin opreme;
 * obstojeca: obstoječa oprema (naziv + skupina) za predlog skupine po nazivu.
 */
export function razcleni(
  okvirji: Okvir[],
  skupine: string[],
  obstojeca: { oprema_naziv: string; skupina_opreme: string | null }[] = [],
): Najdeno {
  const najdeno: Najdeno = {};
  const skatle = okvirji.map(skatla).filter((s) => s.text);
  const odZgoraj = [...skatle].sort((a, b) => a.y1 - b.y1);

  for (const polje of Object.keys(OZNAKE) as IskanoPolje[]) {
    // oznake po prednosti, pri isti oznaki najvišja na nalepki
    for (const oznaka of OZNAKE[polje]) {
      for (const s of odZgoraj) {
        // oznaka in vrednost v istem okvirju: »SERIAL No.: 681652512«
        const [pred, ...za] = s.text.split(":");
        if (za.length && jeOznaka(pred, oznaka)) {
          const v = veljavna(polje, za.join(":"));
          if (v) {
            najdeno[polje] = v;
            break;
          }
        }
        if (!jeOznaka(s.text, oznaka)) continue;
        const v = vrednostZa(s, skatle, polje);
        if (v) {
          najdeno[polje] = v;
          break;
        }
      }
      if (najdeno[polje]) break;
    }
  }

  const besedilo = skatle.map((s) => s.text).join("\n");

  // Oznaka ni prebrana (npr. zabrisana), vrednost pa ima prepoznaven Finesov format
  const serijska = skatle.find((s) => FORMAT_SERIJSKA.test(s.text))?.text;
  const koda = skatle.find((s) => FORMAT_KODA.test(s.text))?.text;
  if (!najdeno.serijska_stevilka && serijska) najdeno.serijska_stevilka = serijska;
  if (!najdeno.koda && koda) najdeno.koda = koda;

  // Leto brez oznake: samo če je na nalepki natanko eno smiselno leto
  if (!najdeno.leto_proizvodnje) {
    const leta = [...new Set([...besedilo.matchAll(new RegExp(LETO, "g"))].map((m) => Number(m[1])))].filter(
      (l) => l >= 1980 && l <= new Date().getFullYear(),
    );
    if (leta.length === 1) najdeno.leto_proizvodnje = String(leta[0]);
  }
  // Finesova serijska se začne z letom izdelave: 18.0391.005 -> 2018
  const izSerijske = najdeno.serijska_stevilka?.match(/^(\d{2})\.\d{4}\./)?.[1];
  if (!najdeno.leto_proizvodnje && izSerijske && 2000 + Number(izSerijske) <= new Date().getFullYear()) {
    najdeno.leto_proizvodnje = String(2000 + Number(izSerijske));
  }

  // Skupina: ime skupine na nalepki, sicer najpogostejša skupina obstoječe opreme z isto oznako v nazivu (npr. FB)
  const tekst = ` ${normaliziraj(besedilo)} `;
  const poImenu = skupine
    .filter((s) => normaliziraj(s).length >= 3 && tekst.includes(` ${normaliziraj(s)} `))
    .sort((a, b) => b.length - a.length)[0];
  if (poImenu) najdeno.skupina_opreme = poImenu;
  else if (najdeno.oprema_naziv) {
    const oznaka = najdeno.oprema_naziv.match(/^\p{L}+/u)?.[0];
    if (oznaka && oznaka.length >= 2) {
      const vzorec = new RegExp(`(?<![\\p{L}])${oznaka}(?![\\p{L}])`, "iu");
      const stevec = new Map<string, number>();
      for (const o of obstojeca) {
        if (o.skupina_opreme && vzorec.test(o.oprema_naziv)) stevec.set(o.skupina_opreme, (stevec.get(o.skupina_opreme) ?? 0) + 1);
      }
      const naj = [...stevec.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      if (naj && skupine.includes(naj)) najdeno.skupina_opreme = naj;
    }
  }
  if (!najdeno.skupina_opreme) {
    // ime linije na nalepki (npr. PRO-COOK), s katerim se začne naziv obstoječe opreme (»Pro cook F3 611 IG«)
    const crke = (t: string) => normaliziraj(t).replace(/ /g, "");
    const stevec = new Map<string, number>();
    for (const s of skatle) {
      const ime = crke(s.text);
      if (ime.length < 4 || ime === "fines" || jeKateraOznaka(s.text)) continue;
      for (const o of obstojeca) {
        if (o.skupina_opreme && crke(o.oprema_naziv).startsWith(ime)) {
          stevec.set(o.skupina_opreme, (stevec.get(o.skupina_opreme) ?? 0) + 1);
        }
      }
    }
    const naj = [...stevec.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (naj && skupine.includes(naj)) najdeno.skupina_opreme = naj;
  }

  return najdeno;
}
