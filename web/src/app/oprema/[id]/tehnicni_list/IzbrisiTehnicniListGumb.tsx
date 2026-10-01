"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { izbrisiTehnicniList } from "@/app/oprema/actions";

export function IzbrisiTehnicniListGumb({ idOprema, obstaja }: { idOprema: number; obstaja: boolean }) {
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
      disabled={brisem || !obstaja}
      title={obstaja ? "Izbriši celoten tehnični list in sliko krmiljenja" : "Tehnični list še ni shranjen"}
    >
      <Trash2 size={18} />
      {brisem ? "Brišem ..." : "Izbriši"}
    </Button>
  );
}
