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
  ima_tehnicni_list?: boolean;
  ima_kartoteko?: boolean;
};

export type OpremaSSliko = OpremaVrstica & { slika_url: string | null };

// Zapis v rbo_kartoteka; id manjka pri zapisih, ki še niso shranjeni (nova oprema)
export type ZapisKartoteke = {
  id?: number;
  datum_vnosa: string; // LLLL-MM-DD
  besedilo_vnosa: string;
  strosek?: number | null; // EUR
};

// rbo_tehnicni_list (brez id in id_oprema)
export type TehnicniList = {
  tip_opreme: string | null;
  naziv: string | null;
  leto_izdelave: number | null;
  serijska: string | null;
  dimenzija: string | null;
  teza: string | null;
  delovne_ure: string | null;
  prikljucna_moc: string | null;
  elektricni_priklop: string | null;
  varovalke: string | null;
  temperatura: string | null;
  priklop_vode: string | null;
  odvod_pare: string | null;
  kapaciteta_pekacev: string | null;
  razdalja_med_pekaci: string | null;
  opis: string | null;
};

// Polja tehničnega lista po sklopih (obrazec in PDF)
export const TL_SKLOPI: { naslov: string; polja: { kljuc: keyof TehnicniList; oznaka: string; namig?: string }[] }[] = [
  {
    naslov: "Osnovni podatki",
    polja: [
      { kljuc: "tip_opreme", oznaka: "Tip opreme" },
      { kljuc: "naziv", oznaka: "Naziv" },
      { kljuc: "leto_izdelave", oznaka: "Leto izdelave", namig: "npr. 2018" },
      { kljuc: "serijska", oznaka: "Serijska številka" },
      { kljuc: "dimenzija", oznaka: "Dimenzija", namig: "npr. 1200 × 900 × 1800 mm" },
      { kljuc: "teza", oznaka: "Teža", namig: "npr. 250 kg" },
    ],
  },
  {
    naslov: "Podatki obratovanja",
    polja: [
      { kljuc: "delovne_ure", oznaka: "Delovne ure" },
      { kljuc: "prikljucna_moc", oznaka: "Priključna moč", namig: "npr. 9,5 kW" },
      { kljuc: "elektricni_priklop", oznaka: "Električni priklop", namig: "npr. 3N~ 400 V 50 Hz" },
      { kljuc: "varovalke", oznaka: "Varovalke", namig: "npr. 3 × 16 A" },
      { kljuc: "temperatura", oznaka: "Temperatura", namig: "npr. 30–300 °C" },
      { kljuc: "priklop_vode", oznaka: "Priklop vode" },
      { kljuc: "odvod_pare", oznaka: "Odvod pare" },
    ],
  },
  {
    naslov: "Peka",
    polja: [
      { kljuc: "kapaciteta_pekacev", oznaka: "Kapaciteta pekačev", namig: "npr. 10 × GN 1/1" },
      { kljuc: "razdalja_med_pekaci", oznaka: "Razdalja med pekači", namig: "npr. 70 mm" },
    ],
  },
];
