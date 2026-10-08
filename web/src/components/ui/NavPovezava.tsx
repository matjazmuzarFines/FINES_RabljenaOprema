"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { lahkoZapustim } from "@/lib/neshranjeno";

/** Povezava, ki pri neshranjenih spremembah pred odhodom vpraša za potrditev. */
export function NavPovezava({ onClick, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        if (!lahkoZapustim()) e.preventDefault();
        else onClick?.(e);
      }}
    />
  );
}
