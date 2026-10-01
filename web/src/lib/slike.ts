import type { SupabaseClient } from "@supabase/supabase-js";
import { SLIKE_BUCKET, SLIKE_MAPA } from "@/lib/config";

export type VrstaSlike = "Predstavna" | "Slika1" | "Slika2" | "Slika3" | "Slika4" | "Slika5" | "Slika6" | "Krmiljenje";
export type ObstojecaSlika = { ime: string; url: string | null };

export const MESTA_SLIK: { vrsta: VrstaSlike; naslov: string; namig: string }[] = [
  { vrsta: "Predstavna", naslov: "Predstavna slika", namig: "Zunanjost – zaprta peč" },
  { vrsta: "Slika1", naslov: "Slika 1", namig: "Notranjost" },
  { vrsta: "Slika2", naslov: "Slika 2", namig: "Serijska tablica" },
  { vrsta: "Slika3", naslov: "Slika 3", namig: "Dodatna slika" },
  { vrsta: "Slika4", naslov: "Slika 4", namig: "Dodatna slika" },
  { vrsta: "Slika5", naslov: "Slika 5", namig: "Dodatna slika" },
  { vrsta: "Slika6", naslov: "Slika 6", namig: "Dodatna slika" },
  { vrsta: "Krmiljenje", naslov: "Slika krmiljenja", namig: "Krmilnik / upravljalna plošča" },
];

// Poimenovanje kot v Power Apps / SharePoint: "{ID} - predstavna.jpg", "{ID} - Slika{n}.jpg", "{ID} - krmiljenje.jpg"
export const imeDatoteke = (id: number, vrsta: VrstaSlike) =>
  vrsta === "Predstavna" || vrsta === "Krmiljenje" ? `${id} - ${vrsta.toLowerCase()}.jpg` : `${id} - ${vrsta}.jpg`;

export const potSlike = (imeSlike: string) => (SLIKE_MAPA ? `${SLIKE_MAPA}/${imeSlike}` : imeSlike);

// Podpisani URL-ji (veljajo 1 uro) za seznam imen slik; vrne map ime -> URL.
export async function podpisaniUrlji(supabase: SupabaseClient, imena: string[]) {
  const urlji = new Map<string, string>();
  if (imena.length === 0) return urlji;

  const { data, error } = await supabase.storage
    .from(SLIKE_BUCKET)
    .createSignedUrls(imena.map(potSlike), 60 * 60);
  if (error) {
    console.error("Podpisovanje URL-jev slik ni uspelo:", error.message);
    return urlji;
  }
  data.forEach((d, i) => {
    if (d.signedUrl) urlji.set(imena[i], d.signedUrl);
  });
  return urlji;
}

// Vse slike opreme kot map vrsta -> {ime, url}
export async function slikeOpreme(supabase: SupabaseClient, idOprema: number) {
  const { data } = await supabase.from("rbo_slike").select("vrsta_slike, ime_slike").eq("id_oprema", idOprema);
  const zapisi = (data ?? []) as { vrsta_slike: VrstaSlike; ime_slike: string }[];
  const urlji = await podpisaniUrlji(supabase, zapisi.map((z) => z.ime_slike));
  return Object.fromEntries(
    zapisi.map((z) => [z.vrsta_slike, { ime: z.ime_slike, url: urlji.get(z.ime_slike) ?? null }]),
  ) as Partial<Record<VrstaSlike, ObstojecaSlika>>;
}
