import { PDFParse } from "pdf-parse";

export type FacturaExtraida = {
  nroComprobante?: string;
  fechaComprobante?: Date;
  total?: number;
  clienteNombre?: string;
  clienteCuit?: string;
  letra?: string; // A | B | C | M
  codComprobante?: string; // 001, 006, 011...
  cae?: string;
  caeVto?: Date;
  textoCrudo: string;
};

// Datos conocidos del emisor (la empresa). Se usan para EXCLUIR: nunca asignar
// el CUIT/razón social del emisor como si fueran del cliente (comprador).
export type EmisorInfo = {
  cuit?: string | null;
  razonSocial?: string | null;
  nombre?: string | null;
};

// Código AFIP de comprobante -> letra.
const COD_LETRA: Record<string, string> = {
  "001": "A", "002": "A", "003": "A",
  "006": "B", "007": "B", "008": "B",
  "011": "C", "012": "C", "013": "C",
  "051": "M", "052": "M", "053": "M",
};

export async function extractFacturaData(
  buffer: Buffer,
  emisor?: EmisorInfo,
): Promise<FacturaExtraida> {
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

  const emisorCuit = digits(emisor?.cuit);
  const emisorNames = [emisor?.razonSocial, emisor?.nombre]
    .map(normName)
    .filter((s) => s.length >= 3);

  const cod = parseCodComprobante(flat);
  return {
    nroComprobante: parseNroComprobante(flat),
    fechaComprobante: parseFecha(lines),
    total: parseTotal(flat),
    clienteNombre: parseCliente(lines, emisorNames),
    clienteCuit: parseClienteCuit(lines, emisorCuit),
    letra: parseLetra(flat, cod),
    codComprobante: cod,
    cae: parseCae(flat),
    caeVto: parseCaeVto(flat),
    textoCrudo: text,
  };
}

// ----------------------------------------------------------------------------
// N° de comprobante
// ----------------------------------------------------------------------------
function parseNroComprobante(flat: string): string | undefined {
  // 1) Punto de Venta + Comprobante Nro (etiquetas AFIP).
  const pv = flat.match(/punto\s+de\s+venta\.?\s*:?\s*0*(\d{1,5})/i)
    ?? flat.match(/pto\.?\s*v?(?:ta|enta)\.?\s*:?\s*0*(\d{1,5})/i);
  const cn = flat.match(/comp(?:robante)?\.?\s*(?:nro|n[°ºo]|number|n\.?)\.?\s*:?\s*0*(\d{1,8})/i);
  if (pv && cn) return `${pv[1].padStart(4, "0")}-${cn[1].padStart(8, "0")}`;

  // 2) Patrón ya formateado PPPP-NNNNNNNN (lo más común y fiable).
  const comboRe = /\b(\d{4,5})-(\d{6,8})\b/g;
  const c = comboRe.exec(flat);
  if (c) return `${c[1].padStart(4, "0")}-${c[2].padStart(8, "0")}`;

  // 3) "Factura/Comprobante N° 12345678" o "N° 0001-00000123".
  const lbl = flat.match(
    /(?:factura|comprobante|comp\.?|n[°º]|nro|numero|número)\s*:?\s*([0-9]{4,5}-[0-9]{6,8}|[0-9]{6,13})/i,
  );
  if (lbl) {
    const v = lbl[1];
    if (v.includes("-")) {
      const [a, b] = v.split("-");
      return `${a.padStart(4, "0")}-${b.padStart(8, "0")}`;
    }
    return v;
  }

  if (cn) return cn[1].padStart(8, "0");
  return undefined;
}

// ----------------------------------------------------------------------------
// Fecha (de emisión) — evita Vto/Período
// ----------------------------------------------------------------------------
function parseFecha(lines: string[]): Date | undefined {
  // Preferir la línea de "Fecha de Emisión".
  for (const l of lines) {
    if (/vencimiento|vto|per[ií]odo|desde|hasta/i.test(l)) continue;
    const m = l.match(
      /fecha(?:\s+de\s+emisi[oó]n)?\.?\s*:?\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/i,
    );
    if (m) {
      const d = toDate(m[1], m[2], m[3]);
      if (d) return d;
    }
  }
  // Fallback: primera fecha del documento que no sea de vencimiento/período.
  for (const l of lines) {
    if (/vencimiento|vto|per[ií]odo|desde|hasta/i.test(l)) continue;
    const m = l.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/);
    if (m) {
      const d = toDate(m[1], m[2], m[3]);
      if (d) return d;
    }
  }
  return undefined;
}

// ----------------------------------------------------------------------------
// Total — prefiere "Importe Total", evita subtotales
// ----------------------------------------------------------------------------
function parseTotal(flat: string): number | undefined {
  const grab = (re: RegExp): number[] => {
    const out: number[] = [];
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, "gi");
    while ((m = r.exec(flat)) !== null) {
      const n = parseARNumber(m[1]);
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
    return out;
  };

  // Prioridad: Importe Total / Total a Pagar / Total Final.
  let cand = grab(/importe\s+total\s*:?\s*\$?\s*([\d.,]+)/);
  if (!cand.length) cand = grab(/total\s+(?:a\s+pagar|final|general)\s*:?\s*\$?\s*([\d.,]+)/);
  if (!cand.length) {
    // "Total: $..." pero NO "Subtotal".
    const r = /(^|[^a-z])total\s*:?\s*\$?\s*([\d.,]+)/gi;
    let m: RegExpExecArray | null;
    while ((m = r.exec(flat)) !== null) {
      const ctx = flat.slice(Math.max(0, m.index - 4), m.index + 6).toLowerCase();
      if (ctx.includes("sub")) continue;
      const n = parseARNumber(m[2]);
      if (Number.isFinite(n) && n > 0) cand.push(n);
    }
  }
  if (!cand.length) return undefined;
  // El total suele ser el mayor valor candidato.
  return Math.max(...cand);
}

// ----------------------------------------------------------------------------
// Cliente (receptor) — excluye al emisor conocido
// ----------------------------------------------------------------------------
const CLIENTE_LABELS: { re: RegExp; prio: number }[] = [
  { re: /apellido\s+y\s+nombre\s*\/?\s*raz[oó]n\s+social\s*:?\s*(.+)/i, prio: 5 },
  { re: /se[ñn]or(?:\/?es)?\s*:?\s*(.+)/i, prio: 4 },
  { re: /raz[oó]n\s+social\s*:?\s*(.+)/i, prio: 3 },
  { re: /cliente\s*:?\s*(.+)/i, prio: 3 },
  { re: /nombre\s*(?:y\s+apellido)?\s*:?\s*(.+)/i, prio: 2 },
];

function parseCliente(lines: string[], emisorNames: string[]): string | undefined {
  const candidates: { value: string; prio: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    for (const { re, prio } of CLIENTE_LABELS) {
      const m = lines[i].match(re);
      if (!m) continue;
      let val = clean(m[1]);
      // Si la etiqueta está sola, tomar la línea siguiente.
      if (!val && i + 1 < lines.length) val = clean(lines[i + 1]);
      val = trimTrailingFields(val);
      if (!val || val.length < 2) continue;
      if (isLabelNoise(val)) continue;
      candidates.push({ value: val, prio });
    }
  }
  // Excluir candidatos que coincidan con el emisor.
  const filtered = candidates.filter((c) => !matchesEmisor(c.value, emisorNames));
  const pool = filtered.length ? filtered : [];
  if (!pool.length) return undefined;
  pool.sort((a, b) => b.prio - a.prio);
  return pool[0].value;
}

// ----------------------------------------------------------------------------
// CUIT del cliente — excluye el CUIT del emisor
// ----------------------------------------------------------------------------
function parseClienteCuit(lines: string[], emisorCuit: string): string | undefined {
  const cuitRe = /\b(\d{2}[-\s]?\d{8}[-\s]?\d)\b/g;
  const found: { cuit: string; idx: number }[] = [];
  lines.forEach((l, idx) => {
    let m: RegExpExecArray | null;
    const r = new RegExp(cuitRe.source, "g");
    while ((m = r.exec(l)) !== null) {
      const d = digits(m[1]);
      if (d.length === 11) found.push({ cuit: d, idx });
    }
  });
  // Quitar el del emisor.
  const others = found.filter((f) => f.cuit !== emisorCuit);
  if (!others.length) return undefined;

  // Preferir el CUIT cercano a una etiqueta de receptor.
  const receptorIdx = lines.findIndex((l) =>
    /apellido\s+y\s+nombre|se[ñn]or|cliente|raz[oó]n\s+social|comprador|adquirente/i.test(l),
  );
  if (receptorIdx >= 0) {
    let best = others[0];
    let bestDist = Math.abs(others[0].idx - receptorIdx);
    for (const o of others) {
      const dist = Math.abs(o.idx - receptorIdx);
      if (dist < bestDist) {
        best = o;
        bestDist = dist;
      }
    }
    return formatCuit(best.cuit);
  }
  return formatCuit(others[0].cuit);
}

// ----------------------------------------------------------------------------
// Letra / código / CAE
// ----------------------------------------------------------------------------
function parseCodComprobante(flat: string): string | undefined {
  const m = flat.match(/c[oó]d(?:igo)?\.?\s*:?\s*0*(\d{1,3})\b/i);
  if (m) return m[1].padStart(3, "0");
  return undefined;
}

function parseLetra(flat: string, cod?: string): string | undefined {
  const m = flat.match(/factura\s+([abcm])\b/i)
    ?? flat.match(/comprobante\s+([abcm])\b/i)
    ?? flat.match(/^\s*([ABCM])\s*$/m);
  if (m) return m[1].toUpperCase();
  if (cod && COD_LETRA[cod]) return COD_LETRA[cod];
  return undefined;
}

function parseCae(flat: string): string | undefined {
  const m = flat.match(/cae\s*(?:n[°ºo]?|nro|number)?\.?\s*:?\s*(\d{14})/i);
  return m ? m[1] : undefined;
}

function parseCaeVto(flat: string): Date | undefined {
  const m = flat.match(
    /(?:vto|vencimiento)\.?\s*(?:de\s*)?(?:cae)?\s*:?\s*(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/i,
  );
  if (!m) return undefined;
  return toDate(m[1], m[2], m[3]);
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
function toDate(dd: string, mm: string, yy: string): Date | undefined {
  const d = Number(dd);
  const mo = Number(mm);
  let y = Number(yy);
  if (y < 100) y += 2000;
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 2000 || y > 2100) return undefined;
  return new Date(Date.UTC(y, mo - 1, d));
}

function parseARNumber(s: string): number {
  let v = s.replace(/[^\d.,]/g, "");
  if (v.includes(",")) {
    v = v.replace(/\./g, "").replace(",", ".");
  } else if ((v.match(/\./g) ?? []).length > 1) {
    v = v.replace(/\./g, "");
  }
  return parseFloat(v);
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

// Corta el valor cuando empieza otro campo en la misma línea (CUIT, DNI, etc.).
function trimTrailingFields(s: string): string {
  const cut = s.split(
    /\s+(?:c\.?u\.?i\.?t|cuit|dni|condici[oó]n|domicilio|i\.?v\.?a|iva|tel|telefono|email|ingresos\s+brutos|fecha)\b/i,
  )[0];
  return clean(cut ?? s);
}

function digits(s?: string | null): string {
  return (s ?? "").replace(/\D/g, "");
}

function formatCuit(raw: string): string {
  const d = digits(raw);
  if (d.length === 11) return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
  return raw;
}

// Normaliza un nombre para comparar: sin acentos, mayúsculas, sin puntuación
// ni sufijos societarios.
function normName(s?: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\b(SAS|SRL|SA|SCA|SH|SAU|SOCIEDAD|ANONIMA|RESPONSABILIDAD|LIMITADA)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ¿El texto corresponde al emisor conocido?
function matchesEmisor(value: string, emisorNames: string[]): boolean {
  const v = normName(value);
  if (!v) return false;
  for (const e of emisorNames) {
    if (!e) continue;
    if (v === e) return true;
    // Contención fuerte (uno dentro del otro) con longitud relevante.
    if (e.length >= 4 && (v.includes(e) || e.includes(v))) return true;
  }
  return false;
}

// Descarta valores que en realidad son fragmentos de etiqueta / ruido.
function isLabelNoise(v: string): boolean {
  return /^(cuit|dni|domicilio|condici[oó]n|iva|fecha|total|importe|comprobante|factura|raz[oó]n|apellido)\b/i.test(
    v.trim(),
  );
}
