// Enotni gradniki aplikacije. Vsaka vrsta komponente ima eno obliko, velikost in senčenje
// (rbo_instructions.md: "Vse komponente morajo biti standardne in enotne").

import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/*
 * Barve gumbov (rbo_instructions.md):
 * - brand (oranžna): funkcija samo na strani (navigacija, Nazaj, Izhod, filtri, izračun)
 * - ok (zelena): dodaj / shrani / naloži v bazo
 * - danger (rdeča): izbriši / odstrani
 * - info (modra): prenos PDF, osvežitev, zunanje funkcije
 * Belih gumbov ni. Vsak gumb mora imeti title (namig ob prehodu z miško).
 */
type Variant = "brand" | "ok" | "danger" | "info";

const variantClass: Record<Variant, string> = {
  brand: "bg-brand text-white hover:bg-brand-hover active:bg-brand-pressed",
  ok: "bg-ok text-white hover:bg-ok-hover",
  danger: "bg-danger text-white hover:bg-danger-hover",
  info: "bg-info text-white hover:bg-info-hover",
};

type Size = "md" | "sm" | "icon" | "iconSm" | "iconXs";

const sizeClass: Record<Size, string> = {
  md: "h-11 gap-2 px-5 text-[15px]",
  sm: "h-9 gap-1.5 px-3 text-sm",
  icon: "h-11 w-11 shrink-0",
  iconSm: "h-9 w-9 shrink-0",
  iconXs: "h-7 w-7 shrink-0",
};

export const buttonClass = (variant: Variant = "brand", size: Size = "md") =>
  `inline-flex items-center justify-center rounded-lg font-semibold shadow-sm transition-colors ` +
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ` +
  `disabled:cursor-not-allowed disabled:bg-[#dcdcdc] disabled:text-ink-faint disabled:border-transparent ` +
  `disabled:shadow-none disabled:hover:bg-[#dcdcdc] ` +
  `${sizeClass[size]} ${variantClass[variant]}`;

export function Button({
  variant = "brand",
  size = "md",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; title: string }) {
  return <button {...props} className={`${buttonClass(variant, size)} ${className}`} />;
}

const fieldClass =
  "h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] text-ink shadow-sm " +
  "placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 " +
  "disabled:cursor-not-allowed disabled:bg-[#f3f2f0] disabled:text-ink-muted disabled:shadow-none";

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
    <Tag className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <span className="text-[13px] font-semibold uppercase tracking-wide text-ink-muted">
        {label}
        {required && <span className="ml-0.5 text-brand">*</span>}
      </span>
      {children}
      {error && <span className="text-sm font-medium text-danger">{error}</span>}
    </Tag>
  );
}

export function TextInput({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClass} ${className}`} />;
}

export function TextArea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea rows={4} {...props} className={`${fieldClass} h-auto min-h-28 py-2.5 leading-relaxed ${className}`} />;
}

// Razdelek obrazca (kartica z naslovom)
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
    <section className={`rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="border-l-4 border-brand pl-3 text-lg font-bold text-ink">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
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
    <select {...props} className={`${fieldClass} cursor-pointer pr-8 ${className}`}>
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

export function Toggle({
  checked,
  onChange,
  label,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      title={title}
      onClick={() => onChange(!checked)}
      className="inline-flex cursor-pointer select-none items-center gap-3"
    >
      <span
        className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-brand" : "bg-[#c9c6c1]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </span>
      <span className={`text-[15px] ${checked ? "font-semibold text-brand" : "text-ink-muted"}`}>{label}</span>
    </button>
  );
}

// Status prodaje (šifrant). Barve prevzete iz Power Apps aplikacije.
const statusStyle: Record<string, string> = {
  "0. NI ZA PRODAJO": "bg-[#dc0000] text-white",
  "1. NI UREJENO ZA PRODAJO": "bg-[#ffc800] text-ink",
  "2. NEPRODANO": "bg-[#f0620f] text-white",
  "3. PRODANO": "bg-[#b4b4b4] text-ink",
  "4. POSOJENO": "bg-[#00b4ff] text-white",
};

export function StatusBadge({ status }: { status: string | null }) {
  if (!status) {
    return (
      <span className="inline-flex h-7 items-center rounded-full border border-line bg-surface px-3 text-xs font-semibold text-ink-muted">
        Brez statusa
      </span>
    );
  }
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-bold tracking-wide ${
        statusStyle[status] ?? "bg-ink text-white"
      }`}
    >
      {status.replace(/^\d+\.\s*/, "")}
    </span>
  );
}

// Izbira ocene stanja 1–6 (enak videz kot Score); vrednost gre v skrito polje obrazca
export function ScorePicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <div className="flex w-fit flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={value ?? ""} />
      <div role="radiogroup" aria-label="Ocena stanja" className="inline-flex overflow-hidden rounded-lg border border-line shadow-sm">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === i}
            title={value === i ? "Odstrani oceno stanja" : `Ocena stanja ${i} od 6`}
            onClick={() => onChange(value === i ? null : i)}
            className={`h-11 w-11 border-r border-line text-[15px] font-semibold last:border-r-0 transition-colors disabled:cursor-not-allowed ${
              value !== null && i <= value ? "bg-brand text-white" : "bg-surface text-ink hover:bg-brand-soft"
            }`}
          >
            {i}
          </button>
        ))}
      </div>
      <span className="text-sm text-ink-muted">{value ? `${value} od 6` : "Brez ocene"}</span>
    </div>
  );
}

// Ocena stanja 1–6
export function Score({ value }: { value: number | null }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={value ? `Ocena ${value} od 6` : "Brez ocene"}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <span key={i} className={`h-2.5 w-4 rounded-sm ${value && i <= value ? "bg-brand" : "bg-[#e4e1dc]"}`} />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-ink">{value ?? "–"}</span>
    </span>
  );
}
