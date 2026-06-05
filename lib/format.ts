const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
});

export function formatARS(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  return ARS.format(Number.isFinite(n) ? n : 0);
}

const DATE = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return DATE.format(d);
}
