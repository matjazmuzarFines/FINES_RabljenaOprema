import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

/** Opozorilo: rumeno ozadje, ikona trikotnika, temno rumen tekst. */
export function WarningText({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-warn-50 px-3 py-2 text-sm font-medium text-warn-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Uspeh (isti slog kot opozorilo, zelen). */
export function SuccessText({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="flex items-start gap-2 rounded-lg bg-ok-50 px-3 py-2 text-sm font-medium text-ok-600">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Napaka (isti slog kot opozorilo, rdeč). */
export function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-nok-50 px-3 py-2 text-sm font-medium text-nok-600">
      <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
