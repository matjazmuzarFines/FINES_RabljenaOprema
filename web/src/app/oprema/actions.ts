"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { STATUSI } from "@/lib/sifranti";
import { createClient } from "@/lib/supabase/server";

export type ShraniStanje = {
  ok?: boolean;
  sporocilo?: string;
  napake?: Record<string, string>;
  idProdaja?: number; // novo ustvarjena prodaja, da naslednje shranjevanje ne ustvari še ene
};

const besedilo = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v === "" ? null : v;
};

function stevilo(fd: FormData, k: string, napake: Record<string, string>, opis: string, min?: number, max?: number) {
  const v = besedilo(fd, k);
  if (v === null) return null;
  const n = Number(v.replace(",", "."));
  if (!Number.isFinite(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
    napake[k] = min !== undefined && max !== undefined ? `${opis} mora biti med ${min} in ${max}.` : `${opis} ni veljavno število.`;
    return null;
  }
  return n;
}

export async function shraniOpremo(_prej: ShraniStanje, fd: FormData): Promise<ShraniStanje> {
  const napake: Record<string, string> = {};
  const idOprema = besedilo(fd, "id_oprema");
  const idProdaja = besedilo(fd, "id_prodaja");

  const oprema = {
    datum_prejema: besedilo(fd, "datum_prejema"),
    kolicina: stevilo(fd, "kolicina", napake, "Količina", 0, 100000) ?? 1,
    em: besedilo(fd, "em"),
    koda: besedilo(fd, "koda"),
    oprema_naziv: besedilo(fd, "oprema_naziv"),
    serijska_stevilka: besedilo(fd, "serijska_stevilka"),
    leto_proizvodnje: stevilo(fd, "leto_proizvodnje", napake, "Leto proizvodnje", 1950, 2100),
    skupina_opreme: besedilo(fd, "skupina_opreme"),
    lastnistvo: besedilo(fd, "lastnistvo"),
    skladisce: besedilo(fd, "skladisce"),
    komentar: besedilo(fd, "komentar"),
    ocena: stevilo(fd, "ocena", napake, "Ocena", 1, 6),
  };
  if (!oprema.oprema_naziv) napake.oprema_naziv = "Naziv opreme je obvezen.";

  const prodaja = {
    status_prodaje: besedilo(fd, "status_prodaje"),
    imenovani_prodajalec: besedilo(fd, "imenovani_prodajalec"),
    garancijski_rok_meseci: stevilo(fd, "garancijski_rok_meseci", napake, "Garancija", 0, 120),
    cena_nove: stevilo(fd, "cena_nove", napake, "Cena nove", 0, 10_000_000),
    rabat_procent: stevilo(fd, "rabat_procent", napake, "Rabat", 0, 100),
    prodajna_cena: stevilo(fd, "prodajna_cena", napake, "Prodajna cena", 0, 10_000_000),
    datum_prodaje: besedilo(fd, "datum_prodaje"),
    komentar_ob_prodaji: besedilo(fd, "komentar_ob_prodaji"),
  };
  if (prodaja.status_prodaje && !(STATUSI as readonly string[]).includes(prodaja.status_prodaje)) {
    napake.status_prodaje = "Neveljaven status prodaje.";
  }

  if (Object.keys(napake).length > 0) {
    return { ok: false, sporocilo: "Preveri označena polja.", napake };
  }

  const supabase = await createClient();

  // 1) Oprema
  let id: number;
  if (idOprema) {
    id = Number(idOprema);
    const { error } = await supabase.from("rbo_oprema").update(oprema).eq("id", id);
    if (error) return { ok: false, sporocilo: `Shranjevanje opreme ni uspelo: ${error.message}` };
  } else {
    const { data, error } = await supabase.from("rbo_oprema").insert(oprema).select("id").single();
    if (error) {
      const namig = error.code === "23505" ? " (števec ID ni nastavljen – poženi setval za rbo_oprema)" : "";
      return { ok: false, sporocilo: `Dodajanje opreme ni uspelo: ${error.message}${namig}` };
    }
    id = data.id;
  }

  // 2) Prodaja: posodobi obstoječo ali ustvari novo in jo poveži z opremo
  const imaProdajo = Object.values(prodaja).some((v) => v !== null);
  let novaProdaja: number | undefined;
  if (idProdaja) {
    const { error } = await supabase.from("rbo_prodaja").update(prodaja).eq("id_prodaja", Number(idProdaja));
    if (error) return { ok: false, sporocilo: `Oprema je shranjena, prodaja pa ne: ${error.message}` };
  } else if (imaProdajo) {
    const { data, error } = await supabase.from("rbo_prodaja").insert(prodaja).select("id_prodaja").single();
    if (error) return { ok: false, sporocilo: `Oprema je shranjena, prodaja pa ne: ${error.message}` };
    const povezava = await supabase
      .from("ln_rbo_oprema_prodaja")
      .insert({ id_prodaja: data.id_prodaja, id_oprema: id });
    if (povezava.error) return { ok: false, sporocilo: `Povezava s prodajo ni uspela: ${povezava.error.message}` };
    novaProdaja = data.id_prodaja;
  }

  revalidatePath("/");
  revalidatePath(`/oprema/${id}`);

  if (!idOprema) redirect(`/oprema/${id}?novo=1`);
  return { ok: true, sporocilo: "Spremembe so shranjene.", idProdaja: novaProdaja };
}

// Izbris = skrij (visible = false) opremo in njene prodaje; vrstice ostanejo v bazi.
export async function izbrisiOpremo(idOprema: number): Promise<{ napaka?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.from("rbo_oprema").update({ visible: false }).eq("id", idOprema);
  if (error) return { napaka: `Brisanje ni uspelo: ${error.message}` };

  const povezave = await supabase.from("ln_rbo_oprema_prodaja").select("id_prodaja").eq("id_oprema", idOprema);
  const idProdaj = (povezave.data ?? []).map((p) => p.id_prodaja);
  if (idProdaj.length > 0) {
    const prodaja = await supabase.from("rbo_prodaja").update({ visible: false }).in("id_prodaja", idProdaj);
    if (prodaja.error) return { napaka: `Oprema je izbrisana, prodaja pa ne: ${prodaja.error.message}` };
  }

  revalidatePath("/");
  redirect("/");
}
