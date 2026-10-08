"use client";

/** Ena možnost izbirnika: vrednost, napis na gumbu in hover tekst. */
export type Moznost<T> = { value: T; label: string; hint: string };

/**
 * Lestvica (ocena, garancija ...): gumbi 40 px, stisnjeni v eno skupino.
 * kumulativno: obarvajo se vse stopnje do izbrane (ocena); sicer samo izbrana (garancija).
 * Zaklenjena lestvica je siva in se ne da klikniti.
 */
export function Lestvica<T extends string | number>({
  options,
  value,
  onChange,
  kumulativno,
  zaklenjeno,
  zaklenjenoHint,
  label,
}: {
  options: Moznost<T>[];
  value: T | null;
  onChange: (v: T) => void;
  kumulativno?: boolean;
  zaklenjeno?: boolean;
  /** Hover tekst, ko je lestvica zaklenjena. */
  zaklenjenoHint?: string;
  label: string;
}) {
  const izbrani = options.findIndex((o) => o.value === value);
  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-disabled={zaklenjeno}
      className={`inline-flex w-fit overflow-hidden rounded-lg border border-ink-200 shadow-sm ${zaklenjeno ? "opacity-50" : ""}`}
    >
      {options.map((o, i) => {
        const obarvan = izbrani >= 0 && (kumulativno ? i <= izbrani : i === izbrani);
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            disabled={zaklenjeno}
            title={zaklenjeno ? zaklenjenoHint : o.hint}
            onClick={() => onChange(o.value)}
            className={`h-10 min-w-10 border-r border-ink-200 px-3 text-sm font-bold transition-colors last:border-r-0 disabled:cursor-not-allowed ${
              obarvan ? "bg-fines-500 text-white" : zaklenjeno ? "bg-ink-100 text-ink-500" : "bg-white text-ink-700 hover:bg-fines-50"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Izbira DA / NE: izbran DA je zelen, izbran NE rdeč, neizbran bel z obrobo. */
export function DaNe({
  value,
  onChange,
  hintDa,
  hintNe,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  hintDa: string;
  hintNe: string;
  label: string;
}) {
  const gumb = (da: boolean) => {
    const izbran = value === da;
    return (
      <button
        type="button"
        role="radio"
        aria-checked={izbran}
        title={da ? hintDa : hintNe}
        onClick={() => onChange(da)}
        className={`h-10 min-w-12 rounded-lg border-2 px-3 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
          izbran
            ? da
              ? "border-ok-500 bg-ok-500 text-white"
              : "border-nok-500 bg-nok-500 text-white"
            : "border-ink-200 bg-white text-ink-600 hover:border-fines-500"
        }`}
      >
        {da ? "DA" : "NE"}
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2">
      {gumb(true)}
      {gumb(false)}
    </div>
  );
}
