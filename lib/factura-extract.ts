import { PDFParse } from "pdf-parse";

export type FacturaExtraida = {
  nroComprobante?: string;
  fechaComprobante?: Date;
  total?: number;
  clienteNombre?: string;
  clienteCuit?: string;
  textoCrudo: string;
};

// Extrae datos de una factura electrónica AFIP/ARCA a partir del texto embebido
// del PDF, usando heurísticas sobre las etiquetas estándar. Best-effort: los
// campos que no se detectan quedan undefined (el usuario puede corregir luego).
export async function extractFacturaData(buffer: Buffer): Promise<FacturaExtraida> {
  let text = "";
  try {
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getText();
    text = res.text ?? "";
  } catch {
    return { textoCrudo: "" };
  }

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const flat = lines.join("\n");

  return {
    nroComprobante: parseNroComprobante(flat),
    fechaComprobante: parseFecha(flat),
    total: parseTotal(flat),
    clienteNombre: parseCliente(lines),
    clienteCuit: parseClienteCuit(lines),
    textoCrudo: text,
  };
}

// --- N° de comprobante: "Punto de Venta: 0001  Comp. Nro: 00000123" ---
function parseNroComprobante(flat: string): string | undefined {
  const pv = flat.match(/punto\s+de\s+venta:?\s*0*(\d{1,5})/i);
  const cn = flat.match(/comp(?:robante)?\.?\s*(?:nro|n[°º]|number)\.?:?\s*0*(\d{1,8})/i);
  if (pv && cn) {
    return `${pv[1].padStart(4, "0")}-${cn[1].padStart(8, "0")}`;
  }
  // Fallback: patrón PPPP-NNNNNNNN ya formateado en el texto.
  const combo = flat.match(/\b(\d{4,5})-(\d{8})\b/);
  if (combo) return `${combo[1].padStart(4, "0")}-${combo[2]}`;
  if (cn) return cn[1].padStart(8, "0");
  return undefined;
}

// --- Fecha: "Fecha de Emisión: 03/06/2026" (o primera dd/mm/yyyy) ---
function parseFecha(flat: string): Date | undefined {
  const m =
    flat.match(/fecha\s+de\s+emisi[oó]n:?\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/i) ??
    flat.match(/fecha:?\s*(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})/i) ??
    flat.match(/(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/);
  if (!m) return undefined;
  const d = Number(m[1]);
  const mo = Number(m[2]);
  let y = Number(m[3]);
  if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12) return undefined;
  // UTC para que no se corra un día al formatear.
  return new Date(Date.UTC(y, mo - 1, d));
}

// --- Total: "Importe Total: $ 302.500,00" (toma el mayor si hay varios) ---
function parseTotal(flat: string): number | undefined {
  const candidates: number[] = [];
  const re = /importe\s+total:?\s*\$?\s*([\d.,]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(flat)) !== null) {
    const n = parseARNumber(m[1]);
    if (Number.isFinite(n)) candidates.push(n);
  }
  if (candidates.length === 0) {
    const t = flat.match(/\btotal\b:?\s*\$?\s*([\d.,]+)/i);
    if (t) {
      const n = parseARNumber(t[1]);
      if (Number.isFinite(n)) candidates.push(n);
    }
  }
  if (candidates.length === 0) return undefined;
  return Math.max(...candidates);
}

// --- Cliente: "Apellido y Nombre / Razón Social: <nombre>" (receptor) ---
function parseCliente(lines: string[]): string | undefined {
  // Preferimos la etiqueta del receptor.
  for (const l of lines) {
    const m = l.match(/apellido\s+y\s+nombre.*?raz[oó]n\s+social:?\s*(.+)/i);
    if (m && m[1].trim()) return clean(m[1]);
  }
  // Si solo hay "Razón Social", el primero suele ser el emisor; tomamos el último.
  const razones = lines
    .map((l) => l.match(/raz[oó]n\s+social:?\s*(.+)/i)?.[1])
    .filter((x): x is string => !!x && x.trim().length > 0);
  if (razones.length >= 2) return clean(razones[razones.length - 1]);
  return undefined;
}

// --- CUIT del cliente: el CUIT cercano (arriba) a la línea del receptor ---
function parseClienteCuit(lines: string[]): string | undefined {
  const cuitRe = /\b(\d{2}-?\d{8}-?\d)\b/;
  const idx = lines.findIndex((l) =>
    /apellido\s+y\s+nombre.*?raz[oó]n\s+social/i.test(l),
  );
  if (idx >= 0) {
    // Buscar CUIT en la línea del receptor o las anteriores cercanas.
    for (let i = idx; i >= Math.max(0, idx - 3); i--) {
      const m = lines[i].match(cuitRe);
      if (m) return formatCuit(m[1]);
    }
  }
  // Fallback: si hay 2+ CUITs, el segundo distinto suele ser el receptor.
  const cuits = lines
    .map((l) => l.match(cuitRe)?.[1])
    .filter((x): x is string => !!x)
    .map(formatCuit);
  const distintos = Array.from(new Set(cuits));
  if (distintos.length >= 2) return distintos[1];
  return undefined;
}

// --- Helpers ---
function parseARNumber(s: string): number {
  let v = s.replace(/[^\d.,]/g, "");
  if (v.includes(",")) {
    // formato AR: punto miles, coma decimal
    v = v.replace(/\./g, "").replace(",", ".");
  } else if ((v.match(/\./g) ?? []).length > 1) {
    // varios puntos => miles
    v = v.replace(/\./g, "");
  }
  return parseFloat(v);
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function formatCuit(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
  return raw;
}
