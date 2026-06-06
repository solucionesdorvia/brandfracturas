import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { extractFacturaData } from "../lib/factura-extract.ts";
import { extractQrFromPdf } from "../lib/factura-qr.ts";
import { mergePdfs, countPages, extractPagesFrom } from "../lib/pdf/merge.ts";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const tenant = await prisma.brandProfile.findFirst();
const EMISOR = { cuit: tenant.cuit, razonSocial: tenant.razonSocial, nombre: tenant.nombre };
let pass = 0, fail = 0;
const ok = (c: boolean, msg: string) => { if (c) { pass++; } else { fail++; console.log("   ✗ FALLA:", msg); } };

async function mkPdf(pages: string[][], opts: { qrUrl?: string } = {}): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const [pi, lines] of pages.entries()) {
    const pg = doc.addPage([595.28, 841.89]);
    let y = 800; for (const l of lines) { pg.drawText(l, { x: 40, y, size: 10, font }); y -= 16; }
    if (pi === 0 && opts.qrUrl) {
      const qrPng = Buffer.from((await QRCode.toDataURL(opts.qrUrl, { width: 280, margin: 1 })).split(",")[1], "base64");
      const img = await doc.embedPng(qrPng); pg.drawImage(img, { x: 440, y: 60, width: 100, height: 100 });
    }
  }
  return Buffer.from(await doc.save());
}

async function encrypt(buf: Buffer): Promise<Buffer> {
  // usar pypdf para encriptar (como facturas reales)
  const tmp = `/tmp/itin-${randomUUID()}.pdf`, out = `/tmp/itout-${randomUUID()}.pdf`;
  await fs.writeFile(tmp, buf);
  const { execSync } = await import("node:child_process");
  execSync(`python3 -c "from pypdf import PdfReader,PdfWriter; r=PdfReader('${tmp}'); w=PdfWriter(); [w.add_page(p) for p in r.pages]; w.encrypt(user_password='',owner_password='o',use_128bit=True); open('${out}','wb').write(w.write.__self__ and b'') or w.write(open('${out}','wb'))"`);
  const res = await fs.readFile(out); await fs.rm(tmp,{force:true}); await fs.rm(out,{force:true}); return res;
}

async function renderPortada(facturaId: string): Promise<Buffer> {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.goto(`http://localhost:3000/render/factura-portada/${facturaId}`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.evaluateHandle("document.fonts.ready");
  const pdf = Buffer.from(await page.pdf({ format: "A4", printBackground: true, margin: {top:"0",right:"0",bottom:"0",left:"0"} }));
  await browser.close(); return pdf;
}

async function runCase(name: string, original: Buffer, expect: any) {
  console.log(`\n=== ${name} ===`);
  const ext = await extractFacturaData(original, EMISOR);
  const qr = await extractQrFromPdf(original);
  console.log(`   datos: nro=${ext.nroComprobante} total=${ext.total} cliente=${ext.clienteNombre} cuit=${ext.clienteCuit} qr=${qr.qrText?"sí":"no"}`);
  if (expect.nro !== undefined) ok(ext.nroComprobante === expect.nro, `nro esperado ${expect.nro} got ${ext.nroComprobante}`);
  if (expect.total !== undefined) ok(ext.total === expect.total, `total esperado ${expect.total} got ${ext.total}`);
  if (expect.cliente !== undefined) ok(ext.clienteNombre === expect.cliente, `cliente esperado ${expect.cliente} got ${ext.clienteNombre}`);
  if (expect.clienteCuit !== undefined) ok(ext.clienteCuit === expect.clienteCuit, `cuit esperado ${expect.clienteCuit} got ${ext.clienteCuit}`);
  ok(ext.clienteCuit !== EMISOR.cuit.replace(/\D/g,"").replace(/(\d{2})(\d{8})(\d)/,"$1-$2-$3"), "cuit cliente != emisor");
  if (expect.qr === true) ok(!!qr.qrText, "QR debería extraerse");

  // crear factura + portada + merge
  const okey = `facturas/originals/${randomUUID()}.pdf`;
  await save(okey, original);
  let qrUrl = null, qrText = null;
  if (qr.qrPng) { const qk = `facturas/qr/${randomUUID()}.png`; await save(qk, qr.qrPng); qrUrl = `/api/files/${qk}`; qrText = qr.qrText; }
  const f = await prisma.facturaUpload.create({ data: { tenantId: tenant.id, archivoOriginalUrl: `/api/files/${okey}`, nroComprobante: ext.nroComprobante, fechaComprobante: ext.fechaComprobante, total: ext.total, clienteNombre: ext.clienteNombre, clienteCuit: ext.clienteCuit, letra: ext.letra, codComprobante: ext.codComprobante, cae: ext.cae, caeVto: ext.caeVto, qrUrl, qrText, estado: "uploaded" } });
  const portada = await renderPortada(f.id);
  const branded = await mergePdfs([portada, original]);
  const total = await countPages(branded);
  const origPages = await countPages(original);
  ok(total === 1 + origPages, `branded paginas ${total} esperado ${1+origPages}`);
  // verificar páginas 2+ == original (cantidad)
  const tail = await extractPagesFrom(branded, 1);
  ok(await countPages(tail) === origPages, "paginas 2+ conservan el original");
  await prisma.facturaUpload.delete({ where: { id: f.id } });
}

async function save(key: string, buf: Buffer) { const full = path.resolve(process.cwd(), "storage", key); await fs.mkdir(path.dirname(full), { recursive: true }); await fs.writeFile(full, buf); }

// limpiar
await prisma.facturaUpload.deleteMany({});

const QRURL = "https://www.afip.gob.ar/fe/qr/?p=" + Buffer.from(JSON.stringify({ver:1,cuit:30710000007})).toString("base64");

// CASO 1: ARCA B, multipágina (3), con QR
await runCase("ARCA B multipágina + QR", await mkPdf([
  ["FACTURA","Cod. 006","Razon Social: Dorvia Soluciones S.A.S.","CUIT: 30-71000000-7","Punto de Venta: 0003   Comp. Nro: 00004567","Fecha de Emision: 12/06/2026","CUIT: 30-55554444-3","Apellido y Nombre / Razon Social: Ingenieria del Sur S.A.","Importe Total: $ 1.815.000,00","CAE N°: 71234567890123"],
  ["Detalle pagina 2"],["Detalle pagina 3"],
], { qrUrl: QRURL }), { nro:"0003-00004567", total:1815000, cliente:"Ingenieria del Sur S.A.", clienteCuit:"30-55554444-3", qr:true });

// CASO 2: ENCRIPTADA (el bug que reportaron)
await runCase("Encriptada (permisos)", await encrypt(await mkPdf([
  ["FACTURA","Cod. 006","CUIT: 30-71000000-7","Punto de Venta: 0001   Comp. Nro: 00000123","Fecha de Emision: 01/06/2026","CUIT: 30-99887766-5","Apellido y Nombre / Razon Social: Cliente Encriptado SA","Importe Total: $ 100.000,00"],
  ["pagina 2"],
])), { nro:"0001-00000123", total:100000, cliente:"Cliente Encriptado SA" });

// CASO 3: Consumidor Final sin CUIT (no debe poner el del emisor)
await runCase("Consumidor Final sin CUIT", await mkPdf([
  ["FACTURA","Cod. 006","Razon Social: Estudio Dorvia","CUIT: 30-71000000-7","Comp. Nro: 0002-00000050","Fecha: 05/06/2026","Señor/es: Consumidor Final","Total: $ 15.000,00"],
]), { nro:"0002-00000050", total:15000, cliente:"Consumidor Final", clienteCuit: undefined });

// CASO 4: No-ARCA formato libre
await runCase("No-ARCA formato libre", await mkPdf([
  ["RECIBO","Emisor: Dorvia","Cliente: Construcciones del Norte SRL","CUIT Cliente: 33-99887766-5","Comprobante N° 0010-00000777","Fecha 20/05/2026","TOTAL A PAGAR: $ 2.500.000,00"],
]), { nro:"0010-00000777", total:2500000, cliente:"Construcciones del Norte SRL", clienteCuit:"33-99887766-5" });

console.log(`\n========== RESULTADO: ${pass} OK, ${fail} fallas ==========`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
