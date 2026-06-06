import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractFacturaData } from "../lib/factura-extract.ts";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

// 1) Factura AFIP de ejemplo (3 páginas para probar merge multi-página)
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const lines = [
  "ORIGINAL","FACTURA","Cod. 006   B",
  "Razon Social: Dorvia Soluciones S.A.S.","CUIT: 30-71000000-7",
  "Punto de Venta: 0003   Comp. Nro: 00004567",
  "Fecha de Emision: 12/06/2026","CUIT: 30-55554444-3",
  "Apellido y Nombre / Razon Social: Ingenieria del Sur S.A.",
  "Importe Total: $ 1.815.000,00","CAE N°: 71234567890123",
];
let pg = doc.addPage([595.28,841.89]); let y=800;
for (const l of lines){ pg.drawText(l,{x:40,y,size:10,font}); y-=18; }
doc.addPage([595.28,841.89]).drawText("Pagina 2 - detalle", {x:40,y:800,size:11,font});
const originalBytes = Buffer.from(await doc.save());

// 2) Extracción real
const ext = await extractFacturaData(originalBytes);
console.log("EXTRAIDO:", { nro: ext.nroComprobante, fecha: ext.fechaComprobante?.toISOString().slice(0,10), total: ext.total, cliente: ext.clienteNombre });

// 3) Guardar original en storage + crear registro con lo extraído
const key = `facturas/originals/${randomUUID()}.pdf`;
const full = path.resolve(process.cwd(),"storage",key);
await fs.mkdir(path.dirname(full),{recursive:true}); await fs.writeFile(full, originalBytes);
const tenant = await prisma.brandProfile.findFirst();
const f = await prisma.facturaUpload.create({ data:{
  tenantId: tenant.id, archivoOriginalUrl:`/api/files/${key}`,
  nroComprobante: ext.nroComprobante ?? null, fechaComprobante: ext.fechaComprobante ?? null,
  total: ext.total ?? null, clienteNombre: ext.clienteNombre ?? null, estado:"uploaded",
}});

// 4) Render portada con los datos leídos + screenshot
const browser = await puppeteer.launch({ headless:true, args:["--no-sandbox"] });
const page = await browser.newPage(); await page.setViewport({width:820,height:1160});
await page.goto(`http://localhost:3000/render/factura-portada/${f.id}`,{waitUntil:"networkidle0"});
await page.evaluateHandle("document.fonts.ready");
await page.screenshot({ path:"/tmp/portada-auto.png" });
const portadaBytes = Buffer.from(await page.pdf({format:"A4",printBackground:true,margin:{top:"0",right:"0",bottom:"0",left:"0"}}));
await browser.close();

// 5) Merge y verificación
const out = await PDFDocument.create();
for (const part of [portadaBytes, originalBytes]){ const s=await PDFDocument.load(part); const ps=await out.copyPages(s,s.getPageIndices()); ps.forEach(p=>out.addPage(p)); }
const branded = await PDFDocument.load(Buffer.from(await out.save()));
console.log("branded páginas:", branded.getPageCount(), "(esperado 3)");

await prisma.facturaUpload.delete({ where:{ id:f.id }});
await fs.rm(full,{force:true});
await prisma.$disconnect();
console.log("OK");
