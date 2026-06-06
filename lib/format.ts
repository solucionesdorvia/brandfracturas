const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatARS(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return ARS.format(Number.isFinite(n) ? n : 0);
}

// Número sin símbolo de moneda (para celdas de tablas densas).
const NUM = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNum(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return NUM.format(Number.isFinite(n) ? n : 0);
}

// timeZone UTC para fechas date-only (p.ej. <input type="date">), así no se
// corren un día por el offset horario (-3 en AR).
const DATE = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE.format(d);
}
