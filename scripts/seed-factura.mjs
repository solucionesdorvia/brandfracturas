import { PrismaClient } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const prisma = new PrismaClient();
// original 2 páginas
const orig = await PDFDocument.create();
const font = await orig.embedFont(StandardFonts.Helvetica);
for (const [i, txt] of ["FACTURA LEGAL ORIGINAL - CAE 71234567890123", "PAGINA 2 DEL COMPROBANTE"].entries()) {
  const pg = orig.addPage([595.28, 841.89]);
  pg.drawText(txt, { x: 50, y: 780, size: 13, font, color: rgb(0,0,0) });
  pg.drawText(`original p${i+1}`, { x: 50, y: 755, size: 10, font });
}
const bytes = Buffer.from(await orig.save());
const uuid = randomUUID();
const key = `facturas/originals/${uuid}.pdf`;
const full = path.resolve(process.cwd(), "storage", key);
await fs.mkdir(path.dirname(full), { recursive: true });
await fs.writeFile(full, bytes);

const tenant = await prisma.brandProfile.findFirst();
const f = await prisma.facturaUpload.create({
  data: {
    tenantId: tenant.id,
    archivoOriginalUrl: `/api/files/${key}`,
    nroComprobante: "0001-00000777",
    fechaComprobante: new Date("2026-06-03"),
    total: 242000,
    clienteNombre: "Comercial Sur S.A.",
    estado: "uploaded",
  },
});
console.log("FACTURA_ID=" + f.id);
await prisma.$disconnect();
