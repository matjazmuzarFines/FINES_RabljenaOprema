// Vnosna polja obrazcev in razdelek (kartica). Enaka višina (40 px), obroba in fokus kot filtri.

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { FilterNaslov } from "./Filtri";

const POLJE =
  "h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 " +
  "placeholder:text-ink-400 focus:border-fines-500 focus:outline-none focus:ring-2 focus:ring-fines-100 " +
  "disabled:cursor-not-allowed disabled:bg-ink-100 disabled:text-ink-500";

/** Polje obrazca z naslovom nad njim (isti slog kot naslovi filtrov). */
export function Field({
  label,
  children,
  error,
  required,
  group,
  className = "",
}: {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  group?: boolean; // za sestavljene kontrole (npr. ocena): brez <label>, da klik ob kontroli ne sproži izbire
  className?: string;
}) {
  const Tag = group ? "div" : "label";
  return (
    <Tag className={`flex min-w-0 flex-col justify-end ${className}`}>
      <FilterNaslov>
        {label}
        {required && <span className="ml-0.5 text-fines-500">*</span>}
      </FilterNaslov>
      {children}
      {error && <span className="mt-1 text-xs font-semibold text-nok-600">{error}</span>}
    </Tag>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${POLJE} ${className}`} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${POLJE} h-auto min-h-24 py-2 leading-relaxed ${className}`} />;
}

export function Select({
  options,
  placeholder = "Vse",
  className = "",
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  options: (string | { value: string; label: string })[];
  placeholder?: string;
}) {
  return (
    <select {...props} className={`${POLJE} cursor-pointer px-2 ${className}`}>
      <option value="">{placeholder}</option>
      {options.map((o) => {
        const { value, label } = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

/** Razdelek (kartica fp-card z naslovom; akcije desno zgoraj). */
export function Section({
  title,
  actions,
  children,
  className = "",
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`fp-card p-3 sm:p-4 ${className}`}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="border-l-4 border-fines-500 pl-3 text-base font-bold text-ink-900">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
