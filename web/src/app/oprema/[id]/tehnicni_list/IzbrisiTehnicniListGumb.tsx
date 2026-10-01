"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { izbrisiTehnicniList } from "@/app/oprema/actions";
import { NAMIG_SAMO_OGLED } from "@/lib/vloga";

export function IzbrisiTehnicniListGumb({
  idOprema,
  obstaja,
  samoOgled,
}: {
  idOprema: number;
  obstaja: boolean;
  samoOgled: boolean;
}) {
  const [brisem, startBrisanje] = useTransition();

  function izbrisi() {
    if (!confirm("Izbrišem celoten tehnični list (vse podatke in sliko krmiljenja)?")) return;
    startBrisanje(async () => {
      const r = await izbrisiTehnicniList(idOprema);
      if (r.napaka) alert(r.napaka);
    });
  }

  return (
    <Button
      type="button"
      variant="danger"
      onClick={izbrisi}
      disabled={brisem || !obstaja || samoOgled}
      title={
        samoOgled
          ? NAMIG_SAMO_OGLED
          : obstaja
            ? "Izbriši celoten tehnični list in sliko krmiljenja"
            : "Tehnični list še ni shranjen"
      }
    >
      <Trash2 size={18} />
      {brisem ? "Brišem ..." : "Izbriši"}
    </Button>
  );
}
