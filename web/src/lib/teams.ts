import "server-only";

// Obvestilo v Teams prek Power Automate flowa (sprožilec "When a Teams webhook request is received").
// URL flowa je skrivnost: samo v TEAMS_WEBHOOK_URL na strežniku (nikoli NEXT_PUBLIC_).
// Imena polj so enaka kot v prejšnjem flowu iz Power Apps.

export type TeamsNovaOprema = {
  id: number;
  datumPrejema: string | null; // LLLL-MM-DD
  ident: string | null;
  naziv: string;
  serijska: string | null;
  ocena: number | null;
  komentar: string | null;
  povezava: string; // URL opreme v aplikaciji
};

const datumSl = (d: string | null) => {
  const iso = d ?? new Date().toLocaleDateString("sv-SE");
  const [l, m, dan] = iso.split("-");
  return `${dan}.${m}.${l}`;
};

// Vrne null ob uspehu ali če obvestila niso nastavljena, sicer besedilo napake.
export async function obvestiTeamsNovaOprema(o: TeamsNovaOprema): Promise<string | null> {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return null;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID: String(o.id),
        Date: datumSl(o.datumPrejema),
        Ident: o.ident ?? "",
        Serial: o.serijska ?? "",
        Komentar: o.komentar ?? "",
        Ocena: o.ocena != null ? String(o.ocena) : "",
        Naziv: o.naziv,
        Povezava: o.povezava,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) return null;
    // npr. {"error":{"code":"DirectApiAuthorizationRequired", ...}} -> pokažemo kodo napake
    const odgovor = await r.text().catch(() => "");
    const koda = odgovor.match(/"code"\s*:\s*"([^"]+)"/)?.[1];
    console.error(`[Teams] HTTP ${r.status}: ${odgovor.slice(0, 500)}`);
    return `HTTP ${r.status}${koda ? ` ${koda}` : ""}`;
  } catch (e) {
    console.error("[Teams]", e);
    return e instanceof Error ? e.message : String(e);
  }
}
