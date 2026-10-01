// Pomanjša sliko v brskalniku (najdaljša stranica max 1920 px) in jo pretvori v JPG.
// Upošteva EXIF orientacijo (slike s telefona niso zasukane).
export async function pripraviSliko(datoteka: Blob, maxStranica = 1920, kakovost = 0.85): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(datoteka, { imageOrientation: "from-image" });
  } catch {
    throw new Error("Te vrste slike ni mogoče prebrati. Uporabi JPG ali PNG.");
  }
  const faktor = Math.min(1, maxStranica / Math.max(bitmap.width, bitmap.height));
  const sirina = Math.round(bitmap.width * faktor);
  const visina = Math.round(bitmap.height * faktor);

  const canvas = document.createElement("canvas");
  canvas.width = sirina;
  canvas.height = visina;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff"; // prosojno ozadje PNG -> belo
  ctx.fillRect(0, 0, sirina, visina);
  ctx.drawImage(bitmap, 0, 0, sirina, visina);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Pretvorba slike ni uspela."))), "image/jpeg", kakovost),
  );
}
