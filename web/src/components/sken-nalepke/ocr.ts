// Branje besedila s slike (OCR) z odprtokodnim PaddleOCR (PP-OCRv6, latinica). Teče v brskalniku.
// Knjižnica se naloži s CDN (ni npm paketa; Turbopack je ne zna zapakirati zaradi njenega workerja).
// Modela (~31 MB) sta v public/ocr/ (izvorni strežnik PaddleOCR je iz Evrope zelo počasen),
// brskalnik ju prenese ob prvi uporabi.

import type { Okvir } from "./razcleni";

const PADDLEOCR_URL = "https://cdn.jsdelivr.net/npm/@paddleocr/paddleocr-js@0.4.2/+esm";
const MODELI = "/ocr";

type Ocr = { predict: (slika: Blob) => Promise<{ items: Okvir[] }[]> };

let ocr: Promise<Ocr> | null = null;

// onnxruntime ob zagonu modela izpiše nenevarni opozorili (»[W:onnxruntime:...] Some nodes were not assigned ...«)
// kot console.error, kar Next.js v razvoju prikaže kot napako. Skrijemo samo ti opozorili.
let opozorilaSkrita = false;
function skrijOpozorilaOnnx() {
  if (opozorilaSkrita) return;
  opozorilaSkrita = true;
  const izvirni = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("[W:onnxruntime:")) return;
    izvirni.apply(console, args);
  };
}

function naloziOcr(): Promise<Ocr> {
  if (!ocr) {
    skrijOpozorilaOnnx();
    ocr = (async () => {
      const { PaddleOCR } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ PADDLEOCR_URL);
      return PaddleOCR.create({
        textDetectionModelName: "PP-OCRv6_small_det",
        textDetectionModelAsset: { url: `${MODELI}/PP-OCRv6_small_det.tar` },
        textRecognitionModelName: "PP-OCRv6_small_rec",
        textRecognitionModelAsset: { url: `${MODELI}/PP-OCRv6_small_rec.tar` },
      }) as Promise<Ocr>;
    })();
    // ob napaki (npr. brez povezave) naj naslednji poskus nalaga znova
    ocr.catch(() => {
      ocr = null;
    });
  }
  return ocr;
}

/** Prebere okvirje besedila s slike (besedilo + položaj na sliki). */
export async function preberiNalepko(slika: Blob, faza: (opis: string) => void): Promise<Okvir[]> {
  faza("Nalagam bralnik (samo prvič, ~31 MB) ...");
  const bralnik = await naloziOcr();
  faza("Berem nalepko ...");
  const [rezultat] = await bralnik.predict(slika);
  return rezultat?.items ?? [];
}
