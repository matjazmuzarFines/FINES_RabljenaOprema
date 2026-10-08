"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button, useToast } from "@/components/ui";
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
  const obvesti = useToast();

  function izbrisi() {
    if (!confirm("Izbrišem celoten tehnični list (vse podatke in sliko krmiljenja)?")) return;
    startBrisanje(async () => {
      const r = await izbrisiTehnicniList(idOprema);
      if (r.napaka) obvesti("error", r.napaka);
    });
  }

  return (
    <Button
      variant="danger"
      icon={Trash2}
      onClick={izbrisi}
      disabled={brisem || !obstaja || samoOgled}
      hint={
        samoOgled
          ? NAMIG_SAMO_OGLED
          : obstaja
            ? "Izbriši celoten tehnični list in sliko krmiljenja"
            : "Tehnični list še ni shranjen"
      }
    >
      {brisem ? "Brišem ..." : "Izbriši"}
    </Button>
  );
}
