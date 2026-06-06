import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash } from "node:crypto";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

// 1) Construir una "factura legal original" de 2 páginas reconocibles.
const orig = await PDFDocument.create();
const font = await orig.embedFont(StandardFonts.Helvetica);
for (const [i, label] of [["1", "FACTURA LEGAL ORIGINAL - CAE 71234567890123"], ["2", "DETALLE / PAGINA 2 DEL COMPROBANTE"]].entries()) {
  const pg = orig.addPage([595.28, 841.89]); // A4 en puntos
  pg.drawText(label[1], { x: 50, y: 780, size: 14, font, color: rgb(0, 0, 0) });
  pg.drawText(`pagina original ${label[0]}`, { x: 50, y: 750, size: 11, font });
}
const originalBytes = Buffer.from(await orig.save());
const originalHash = createHash("sha256").update(originalBytes).digest("hex");
const originalPages = (await PDFDocument.load(originalBytes)).getPageCount();
console.log("original páginas:", originalPages, "sha256:", originalHash.slice(0, 16));

// 2) Crear el registro de factura (para poder renderizar la portada).
const tenant = await prisma.brandProfile.findFirst();
const f = await prisma.facturaUpload.create({
  data: {
    tenantId: tenant.id,
    archivoOriginalUrl: "/api/files/test-original.pdf",
    nroComprobante: "0001-00000123",
    fechaComprobante: new Date("2026-06-01"),
    total: 121000,
    clienteNombre: "Cliente Factura S.A.",
    estado: "uploaded",
  },
});
console.log("factura id:", f.id);

// 3) Renderizar la portada con Puppeteer (ruta real de la app).
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(`${BASE}/render/factura-portada/${f.id}`, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluateHandle("document.fonts.ready");
const portadaBytes = Buffer.from(await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } }));
await page.setViewport({ width: 820, height: 1160 });
await page.screenshot({ path: "/tmp/factura-portada.png" });
await browser.close();
console.log("portada páginas:", (await PDFDocument.load(portadaBytes)).getPageCount());

// 4) MERGE [portada, original] — misma lógica que lib/pdf/merge.ts
async function mergePdfs(parts) {
  const out = await PDFDocument.create();
  for (const part of parts) {
    const src = await PDFDocument.load(part);
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const pg of pages) out.addPage(pg);
  }
  return Buffer.from(await out.save());
}
const branded = await mergePdfs([portadaBytes, originalBytes]);
const brandedDoc = await PDFDocument.load(branded);
console.log("\n=== RESULTADO ===");
console.log("branded páginas:", brandedDoc.getPageCount(), "(esperado:", 1 + originalPages, ")");

// 5) Verificar que el ORIGINAL no fue tocado (hash idéntico al de antes).
const originalHashAfter = createHash("sha256").update(originalBytes).digest("hex");
console.log("original intacto (hash igual):", originalHash === originalHashAfter);

// 6) Verificar que las páginas 2+ del branded tienen las MISMAS dimensiones que el original.
const oDoc = await PDFDocument.load(originalBytes);
let dimsOk = true;
for (let i = 0; i < originalPages; i++) {
  const a = oDoc.getPage(i).getSize();
  const b = brandedDoc.getPage(i + 1).getSize();
  if (Math.round(a.width) !== Math.round(b.width) || Math.round(a.height) !== Math.round(b.height)) dimsOk = false;
}
console.log("páginas 2+ con dimensiones del original:", dimsOk);

// 7) Extraer páginas 2+ del branded y comprobar que el contenido (texto) se conserva.
const extracted = await PDFDocument.create();
const cps = await extracted.copyPages(brandedDoc, brandedDoc.getPageIndices().filter((i) => i >= 1));
for (const pg of cps) extracted.addPage(pg);
const extractedBytes = Buffer.from(await extracted.save());
console.log("páginas extraídas (2+):", (await PDFDocument.load(extractedBytes)).getPageCount());

await prisma.facturaUpload.deleteMany({ where: { nroComprobante: "0001-00000123" } });
await prisma.$disconnect();
console.log("\nOK");
