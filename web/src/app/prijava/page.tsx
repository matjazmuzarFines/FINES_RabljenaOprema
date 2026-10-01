"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Field, TextInput } from "@/components/ui";
import { DOVOLJENA_DOMENA } from "@/lib/config";
import { createClient } from "@/lib/supabase/client";

// Uporabniško ime brez @ se pretvori v e-mail (FINES -> fines@fines.si); Supabase za prijavo z geslom zahteva e-mail.
const vEmail = (uporabnik: string) => {
  const u = uporabnik.trim().toLowerCase();
  return u.includes("@") ? u : `${u}@${DOVOLJENA_DOMENA}`;
};

export default function PrijavaPage() {
  const router = useRouter();
  const [uporabnik, setUporabnik] = useState("");
  const [geslo, setGeslo] = useState("");
  const [napaka, setNapaka] = useState<string | null>(null);
  const [nalaganje, setNalaganje] = useState(false);

  async function prijava(e: FormEvent) {
    e.preventDefault();
    setNalaganje(true);
    setNapaka(null);
    const { error } = await createClient().auth.signInWithPassword({ email: vEmail(uporabnik), password: geslo });
    if (error) {
      setNalaganje(false);
      setNapaka("Napačno uporabniško ime ali geslo.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh items-center justify-center border-t-[3px] border-brand px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <Image src="/fines-logo.png" alt="FINES d.o.o. logotip" width={136} height={36} priority />
        <h1 className="mt-6 text-2xl font-bold">Rabljena oprema</h1>
        <p className="mt-1 text-[15px] text-ink-muted">Prijava v aplikacijo</p>

        <form onSubmit={prijava} className="mt-6 flex flex-col gap-4">
          <Field label="Uporabniško ime">
            <TextInput
              autoComplete="username"
              autoCapitalize="none"
              required
              autoFocus
              value={uporabnik}
              onChange={(e) => setUporabnik(e.target.value)}
            />
          </Field>
          <Field label="Geslo">
            <TextInput
              type="password"
              autoComplete="current-password"
              required
              value={geslo}
              onChange={(e) => setGeslo(e.target.value)}
            />
          </Field>
          <Button type="submit" disabled={nalaganje} title="Prijava v aplikacijo Rabljena oprema">
            {nalaganje ? "Prijavljam ..." : "Prijava"}
          </Button>
        </form>

        {napaka && (
          <p role="alert" className="mt-4 rounded-lg border border-warn bg-warn-soft px-3 py-2 text-sm text-ink">
            {napaka}
          </p>
        )}
      </div>
    </div>
  );
}
