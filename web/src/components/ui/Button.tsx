import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

// Barva pove, kaj gumb naredi (app_instructions.md, "Barve")
export type ButtonVariant =
  | "primary" // oranžna - funkcija znotraj aplikacije (PDF, ZIP, izračun, izhod)
  | "success" // zelena - dodaj, potrdi, shrani
  | "danger" // rdeča - izbriši, odstrani
  | "warning" // rumena - opozorilo
  | "sync" // modra - funkcija zunaj aplikacije (e-mail, Power Automate, osveži podatke)
  | "neutral"; // bela z obrobo - samo prikaz / navigacija (nazaj, ponastavi filtre, prekliči)

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-fines-500 text-white hover:bg-fines-600 active:bg-fines-700",
  success: "bg-ok-500 text-white hover:bg-ok-600",
  danger: "bg-nok-500 text-white hover:bg-nok-600",
  warning: "bg-warn-400 text-ink-900 hover:bg-warn-500",
  sync: "bg-sync-500 text-white hover:bg-sync-600",
  neutral: "bg-white text-ink-700 border border-ink-200 hover:bg-ink-100",
};

const OSNOVA =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold shadow-sm transition-colors " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fines-500 " +
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

/** Razredi gumba - tudi za povezave (<Link>), ki morajo izgledati kot gumb. */
export const buttonClass = (variant: ButtonVariant = "primary", size: "md" | "lg" = "md") =>
  `${OSNOVA} ${size === "lg" ? "h-12 px-5 text-base" : "h-10 px-4 text-sm"} ${VARIANTS[variant]}`;

/** Razredi okroglega gumba z ikono - tudi za povezave. */
export const iconButtonClass = (variant: "ghost" | ButtonVariant = "ghost") =>
  `inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ` +
  `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fines-500 ` +
  `disabled:cursor-not-allowed disabled:opacity-50 ` +
  (variant === "ghost" ? "text-ink-600 hover:bg-ink-100 hover:text-fines-500" : `${VARIANTS[variant]} shadow-sm`);

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title"> & {
  /** Hover tekst - kaj točno gumb naredi (max 6-8 besed). Obvezno. */
  hint: string;
  variant?: ButtonVariant;
  icon?: LucideIcon;
  size?: "md" | "lg";
  children?: ReactNode;
};

export function Button({
  hint,
  variant = "primary",
  icon: Icon,
  size = "md",
  className = "",
  children,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      title={hint}
      aria-label={typeof children === "string" ? undefined : hint}
      className={`${buttonClass(variant, size)} ${className}`}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "title" | "children"> & {
  hint: string;
  icon: LucideIcon;
  variant?: "ghost" | ButtonVariant;
  /** Med izvajanjem se namesto ikone vrti kolešček. */
  delam?: boolean;
};

/** Okrogel gumb samo z ikono (puščice, info, zapri, PDF ...). */
export function IconButton({
  hint,
  icon: Icon,
  variant = "ghost",
  delam,
  className = "",
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button type={type} title={hint} aria-label={hint} className={`${iconButtonClass(variant)} ${className}`} {...rest}>
      <Icon className={`h-5 w-5 ${delam ? "hidden" : ""}`} aria-hidden />
      {delam && <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
    </button>
  );
}
