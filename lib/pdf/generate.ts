import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { renderHtmlToPdf } from "./render";
import { mergePdfs } from "./merge";

/**
 * Genera el PDF branded de un presupuesto:
 *  render de /render/presupuesto/[id]?template=... → guarda en storage →
 *  setea pdfUrl + estado "generated".
 */
export async function generatePresupuestoPdf(
  presupuestoId: string,
): Promise<string> {
  const presupuesto = await prisma.presupuesto.findUnique({
    where: { id: presupuestoId },
  });
  if (!presupuesto) throw new Error("Presupuesto no encontrado.");

  const template = presupuesto.templateId || "classic";
  const pdf = await renderHtmlToPdf(
    `/render/presupuesto/${presupuestoId}?template=${template}`,
  );

  const key = `presupuestos/${presupuestoId}.pdf`;
  const url = await storage.put(key, pdf, "application/pdf");

  await prisma.presupuesto.update({
    where: { id: presupuestoId },
    data: { pdfUrl: url, estado: "generated" },
  });

  return url;
}

/**
 * Genera el PDF branded de una factura:
 *  render de la portada → merge [portada, original] (original intacto en 2+) →
 *  guarda en storage → setea archivoBrandedUrl + estado "processed".
 */
export async function generateFacturaBrandedPdf(
  facturaId: string,
): Promise<string> {
  const factura = await prisma.facturaUpload.findUnique({
    where: { id: facturaId },
  });
  if (!factura) throw new Error("Factura no encontrada.");

  // El original se guardó en storage al subirlo; la url es /api/files/<key>.
  const originalKey = factura.archivoOriginalUrl.replace(/^\/api\/files\//, "");
  const original = await storage.get(originalKey);

  const portada = await renderHtmlToPdf(`/render/factura-portada/${facturaId}`);
  const branded = await mergePdfs([portada, original]);

  const key = `facturas/${facturaId}-branded.pdf`;
  const url = await storage.put(key, branded, "application/pdf");

  await prisma.facturaUpload.update({
    where: { id: facturaId },
    data: { archivoBrandedUrl: url, estado: "processed" },
  });

  return url;
}
