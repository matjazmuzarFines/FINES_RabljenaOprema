// Odprtokodni AI model za semantično iskanje (multilingual-e5-small, razume tudi slovenščino).
// Teče samo v brskalniku: Transformers.js se naloži s CDN (ni npm paketa), model s Hugging Face
// (~120 MB ob prvi uporabi, nato ga brskalnik hrani v predpomnilniku).

import { opisOcene } from "@/lib/sifranti";
import type { OpremaVrstica } from "@/lib/types";

const TRANSFORMERS_URL = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1";
const MODEL = "Xenova/multilingual-e5-small";

type Extractor = (
  besedila: string[],
  moznosti: { pooling: "mean"; normalize: boolean },
) => Promise<{ tolist(): number[][] }>;

type Napredek = { status: string; file?: string; loaded?: number; total?: number };

let extractor: Promise<Extractor> | null = null;

/** Naloži model (samo enkrat na stran). napredek dobi odstotek prenosa 0-100. */
export function naloziModel(napredek?: (procent: number) => void): Promise<Extractor> {
  if (!extractor) {
    const datoteke = new Map<string, { loaded: number; total: number }>();
    extractor = (async () => {
      const { pipeline } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ TRANSFORMERS_URL);
      return pipeline("feature-extraction", MODEL, {
        dtype: "q8",
        progress_callback: (p: Napredek) => {
          if (p.status !== "progress" || !p.file || !p.total) return;
          datoteke.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
          let nalozeno = 0;
          let skupaj = 0;
          for (const d of datoteke.values()) {
            nalozeno += d.loaded;
            skupaj += d.total;
          }
          napredek?.(Math.round((nalozeno / skupaj) * 100));
        },
      }) as Promise<Extractor>;
    })();
    // ob napaki (npr. brez povezave) naj naslednji poskus nalaga znova
    extractor.catch(() => {
      extractor = null;
    });
  }
  return extractor;
}

/** Vektorji (384 števil, normalizirani). Model e5 zahteva predpono "query: " ali "passage: ". */
export async function vektorji(besedila: string[]): Promise<number[][]> {
  const model = await naloziModel();
  const rezultat = await model(besedila, { pooling: "mean", normalize: true });
  return rezultat.tolist();
}

/** Opis opreme, iz katerega se izračuna vektor. Ob spremembi teh podatkov se vektor izračuna znova. */
export function besediloOpreme(o: OpremaVrstica): string {
  return [
    o.oprema_naziv,
    o.skupina_opreme && `Skupina: ${o.skupina_opreme}`,
    o.koda && `Ident: ${o.koda}`,
    o.leto_proizvodnje && `Leto proizvodnje: ${o.leto_proizvodnje}`,
    o.ocena && `Stanje: ${opisOcene(o.ocena)}`,
    o.komentar,
  ]
    .filter(Boolean)
    .join(". ");
}
