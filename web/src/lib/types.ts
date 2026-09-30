// Vrstica pogleda v_rbo_oprema_prodaja (oprema + zadnja prodaja + predstavna slika)
export type OpremaVrstica = {
  id_oprema: number;
  datum_prejema: string | null;
  predstavna_slika: string | null;
  kolicina: number;
  em: string | null;
  koda: string | null;
  serijska_stevilka: string | null;
  leto_proizvodnje: number | null;
  skupina_opreme: string | null;
  oprema_naziv: string;
  lastnistvo: string | null;
  skladisce: string | null;
  komentar: string | null;
  ocena: number | null;
  id_prodaja: number | null;
  imenovani_prodajalec: string | null;
  garancijski_rok_meseci: number | null;
  cena_nove: number | null;
  rabat_procent: number | null;
  prodajna_cena: number | null;
  datum_prodaje: string | null;
  komentar_ob_prodaji: string | null;
  status_prodaje: string | null;
};

export type OpremaSSliko = OpremaVrstica & { slika_url: string | null };
