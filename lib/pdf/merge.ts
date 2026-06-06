import { PDFDocument } from "pdf-lib";

/**
 * Mergea varios PDFs en uno solo, en orden. Las páginas se COPIAN tal cual
 * (copyPages preserva los content streams, fuentes e imágenes originales:
 * no se re-renderiza ni se rasteriza ni se estampa nada encima).
 *
 * Uso en facturas: mergePdfs([portadaBranded, facturaOriginal]) → la portada
 * queda como hoja 1 y la factura legal intacta en las hojas 2+.
 */
// Muchas facturas reales vienen con encriptación de permisos (firma/edición).
// pdf-lib lanza error al abrirlas salvo ignoreEncryption. Esto NO modifica el
// original: solo permite leer sus páginas para copiarlas tal cual.
const LOAD_OPTS = { ignoreEncryption: true } as const;

export async function mergePdfs(parts: Buffer[]): Promise<Buffer> {
  const out = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(part, LOAD_OPTS);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  const bytes = await out.save();
  return Buffer.from(bytes);
}

/** Cantidad de páginas de un PDF (para validaciones/verificación). */
export async function countPages(buffer: Buffer): Promise<number> {
  const doc = await PDFDocument.load(buffer, LOAD_OPTS);
  return doc.getPageCount();
}

/**
 * Extrae las páginas [fromIndex..] de un PDF a un nuevo PDF. Se usa para
 * verificar que las hojas 2+ del branded conservan el contenido del original.
 */
export async function extractPagesFrom(
  buffer: Buffer,
  fromIndex: number,
): Promise<Buffer> {
  const src = await PDFDocument.load(buffer, LOAD_OPTS);
  const out = await PDFDocument.create();
  const indices = src
    .getPageIndices()
    .filter((i) => i >= fromIndex);
  const pages = await out.copyPages(src, indices);
  for (const page of pages) out.addPage(page);
  const bytes = await out.save();
  return Buffer.from(bytes);
}
