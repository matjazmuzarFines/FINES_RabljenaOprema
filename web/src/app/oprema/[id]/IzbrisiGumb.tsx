"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { izbrisiOpremo } from "@/app/oprema/actions";

export function IzbrisiGumb({ idOprema, naziv }: { idOprema: number; naziv: string }) {
  const [brisem, startBrisanje] = useTransition();
  const [napaka, setNapaka] = useState<string | null>(null);

  function izbrisi() {
    if (!confirm(`Izbrišem opremo »${naziv}« (ID ${idOprema})?\n\nOprema ne bo več prikazana v aplikaciji.`)) return;
    setNapaka(null);
    startBrisanje(async () => {
      const r = await izbrisiOpremo(idOprema);
      if (r?.napaka) setNapaka(r.napaka);
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="danger" onClick={izbrisi} disabled={brisem}>
        <Trash2 size={18} />
        {brisem ? "Brišem ..." : "Izbriši"}
      </Button>
      {napaka && <p className="text-sm font-medium text-danger">{napaka}</p>}
    </div>
  );
}
