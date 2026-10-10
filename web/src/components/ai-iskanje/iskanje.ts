// Pravila nad AI modelom: oznake opreme (FB, FD64 ...), štetje (»koliko ...«) in sinonimi.
// Model dobro razume pomen, slabo pa šifre in števila, zato jih obravnavamo ločeno.

import type { OpremaVrstica } from "@/lib/types";
import { SINONIMI } from "./pravila";

const normaliziraj = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

const besede = (s: string | null) => (s ?? "").split(/[^\p{L}\p{N}]+/u).filter(Boolean);

// Oznaka je beseda s številko (FD64, 40) ali kratica iz velikih črk (FB, FBM)
const jeOznaka = (beseda: string) => /\p{N}/u.test(beseda) || /^\p{Lu}{2,5}$/u.test(beseda);

// Beseda opreme ustreza oznaki, če je enaka ali se z njo začne in nadaljuje s številko (FB -> FB, FB40; ne FBM)
const ustreza = (beseda: string, oznaka: string) =>
  beseda === oznaka || (beseda.startsWith(oznaka) && /\p{N}/u.test(beseda[oznaka.length]));

const oznakeOpreme = (o: OpremaVrstica) =>
  [...besede(o.oprema_naziv), ...besede(o.koda)].filter(jeOznaka).map(normaliziraj);

/** Besede vprašanja, ki so oznake obstoječe opreme (npr. »fb« iz »koliko je FB peči«). */
export function oznakeVprasanja(vprasanje: string, oprema: OpremaVrstica[]): string[] {
  const vse = new Set(oprema.flatMap(oznakeOpreme));
  return [
    ...new Set(
      besede(vprasanje)
        .map(normaliziraj)
        .filter((b) => b.length >= 2 && [...vse].some((w) => ustreza(w, b))),
    ),
  ];
}

/** Ali ima oprema vse oznake iz vprašanja. */
export const imaOznake = (o: OpremaVrstica, oznake: string[]) => {
  const njene = oznakeOpreme(o);
  return oznake.every((z) => njene.some((w) => ustreza(w, z)));
};

export const jeStetje = (vprasanje: string) => /^\s*koliko\b/i.test(vprasanje);

/** Vprašanje, dopolnjeno s pravili iz pravila.ts (za model). */
export function razsiriVprasanje(vprasanje: string): string {
  const n = normaliziraj(vprasanje);
  const dodatki = Object.entries(SINONIMI)
    .filter(([kljuc]) => n.includes(normaliziraj(kljuc)))
    .map(([, dodatek]) => dodatek);
  return [vprasanje, ...dodatki].join(". ");
}
