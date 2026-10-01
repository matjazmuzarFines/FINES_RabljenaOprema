import type { SupabaseClient } from "@supabase/supabase-js";

// Uporabnik z app_metadata.vloga = "ogled" (npr. FINESVIEW) lahko samo gleda in prenaša PDF/e-mail.
// Omejitev velja tudi v bazi (RLS: rbo_lahko_ureja()), aplikacija le onemogoči polja in gumbe.
export const NAMIG_SAMO_OGLED = "Samo ogled – nimaš pravic za urejanje";

export async function jeSamoOgled(supabase: SupabaseClient) {
  const { data } = await supabase.auth.getClaims();
  const meta = data?.claims?.app_metadata as { vloga?: string } | undefined;
  return meta?.vloga === "ogled";
}
