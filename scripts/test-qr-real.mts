import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { extractFacturaData } from "../lib/factura-extract.ts";
import { extractQrFromPdf } from "../lib/factura-qr.ts";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
const REAL_QR_URL = "https://www.afip.gob.ar/fe/qr/?p=" + Buffer.from(JSON.stringify({ver:1,cuit:30710000007,ptoVta:3,nroCmp:4567,importe:1815000,codAut:71234567890123})).toString("base64");

// 1) PDF AFIP con texto + QR real embebido
const qrPng = Buffer.from((await QRCode.toDataURL(REAL_QR_URL,{width:300,margin:1})).split(",")[1],"base64");
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const pg = doc.addPage([595.28,841.89]);
for (const [i,l] of ["ORIGINAL","FACTURA","Cod. 006","CUIT: 30-71000000-7","Punto de Venta: 0003   Comp. Nro: 00004567","Fecha de Emision: 12/06/2026","CUIT: 30-55554444-3","Apellido y Nombre / Razon Social: Ingenieria del Sur S.A.","Importe Total: $ 1.815.000,00","CAE N°: 71234567890123","Fecha de Vto. de CAE: 22/06/2026"].entries()) pg.drawText(l,{x:40,y:800-i*18,size:10,font});
const qimg = await doc.embedPng(qrPng); pg.drawImage(qimg,{x:430,y:60,width:110,height:110});
const originalBytes = Buffer.from(await doc.save());

// 2) Extracción de datos + QR real
const ext = await extractFacturaData(originalBytes);
const qr = await extractQrFromPdf(originalBytes);
console.log("QR extraído fuente:", qr.fuente, "| decodifica a:", qr.qrText?.slice(0,45)+"...");
console.log("coincide con el real:", qr.qrText === REAL_QR_URL);

// 3) Guardar original + QR en storage, crear factura
const key=`facturas/originals/${randomUUID()}.pdf`; const full=path.resolve(process.cwd(),"storage",key);
await fs.mkdir(path.dirname(full),{recursive:true}); await fs.writeFile(full,originalBytes);
const qrKey=`facturas/qr/${randomUUID()}.png`; const qrFull=path.resolve(process.cwd(),"storage",qrKey);
await fs.mkdir(path.dirname(qrFull),{recursive:true}); await fs.writeFile(qrFull, qr.qrPng);
const tenant=await prisma.brandProfile.findFirst();
const f=await prisma.facturaUpload.create({data:{tenantId:tenant.id,archivoOriginalUrl:`/api/files/${key}`,nroComprobante:ext.nroComprobante,fechaComprobante:ext.fechaComprobante,total:ext.total,clienteNombre:ext.clienteNombre,clienteCuit:ext.clienteCuit,letra:ext.letra,codComprobante:ext.codComprobante,cae:ext.cae,caeVto:ext.caeVto,qrUrl:`/api/files/${qrKey}`,qrText:qr.qrText,estado:"uploaded"}});

// 4) Render portada y verificar que el QR mostrado decodifica al real
const browser=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage(); await page.setViewport({width:820,height:1160});
await page.goto(`http://localhost:3000/render/factura-portada/${f.id}`,{waitUntil:"networkidle0"});
await page.evaluateHandle("document.fonts.ready");
await page.screenshot({path:"/tmp/portada-qr-real.png"});
const shownSrc = await page.evaluate(()=>document.querySelector('img[alt="QR AFIP"]')?.getAttribute('src'));
await browser.close();

// decodificar el QR servido por la app
const resp = await fetch(`http://localhost:3000${shownSrc}`);
const buf = Buffer.from(await resp.arrayBuffer());
const png = PNG.sync.read(buf);
const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
console.log("QR en la portada decodifica a:", decoded?.data?.slice(0,45)+"...");
console.log("=> ES EL QR REAL DE LA FACTURA:", decoded?.data === REAL_QR_URL);

await prisma.facturaUpload.delete({where:{id:f.id}}); await fs.rm(full,{force:true}); await fs.rm(qrFull,{force:true});
await prisma.$disconnect();
