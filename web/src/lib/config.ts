export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Supabase Storage bucket s slikami opreme in (neobvezna) podmapa v njem
export const SLIKE_BUCKET = process.env.NEXT_PUBLIC_SLIKE_BUCKET ?? "Slike_rabljena_oprema";
export const SLIKE_MAPA = (process.env.NEXT_PUBLIC_SLIKE_MAPA ?? "").replace(/^\/+|\/+$/g, "");

// Prijava je dovoljena samo s službenim e-mailom
export const DOVOLJENA_DOMENA = "fines.si";
