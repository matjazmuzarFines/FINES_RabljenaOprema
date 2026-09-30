import type { SupabaseClient } from "@supabase/supabase-js";
import { SLIKE_BUCKET, SLIKE_MAPA } from "@/lib/config";

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
