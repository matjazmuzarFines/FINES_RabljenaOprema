// Datum LLLL-MM-DD -> "1. 10. 2026" (brez pretvorbe časovnih pasov)
export const prikazDatuma = (d: string | null) => {
  if (!d) return "–";
  const [l, m, dan] = d.slice(0, 10).split("-");
  return `${Number(dan)}. ${Number(m)}. ${l}`;
};

// Današnji lokalni datum v obliki LLLL-MM-DD
export const danes = () => new Date().toLocaleDateString("sv-SE");
