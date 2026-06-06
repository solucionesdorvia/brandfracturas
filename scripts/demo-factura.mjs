import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();
// limpiar facturas previas
await prisma.facturaUpload.deleteMany({});

// AFIP-like con QR real
const REAL = "https://www.afip.gob.ar/fe/qr/?p=" + Buffer.from(JSON.stringify({ver:1,fecha:"2026-06-12",cuit:30710000007,ptoVta:3,tipoCmp:6,nroCmp:4567,importe:1815000,moneda:"PES",ctz:1,tipoDocRec:80,nroDocRec:30555544443,tipoCodAut:"E",codAut:71234567890123})).toString("base64");
const qrPng = Buffer.from((await QRCode.toDataURL(REAL,{width:300,margin:1})).split(",")[1],"base64");
const doc = await PDFDocument.create(); const font = await doc.embedFont(StandardFonts.Helvetica);
const pg = doc.addPage([595.28,841.89]);
for (const [i,l] of ["ORIGINAL","FACTURA","Cod. 006","Razon Social: Dorvia Soluciones S.A.S.","CUIT: 30-71000000-7","Punto de Venta: 0003   Comp. Nro: 00004567","Fecha de Emision: 12/06/2026","CUIT: 30-55554444-3","Apellido y Nombre / Razon Social: Ingenieria del Sur S.A.","Importe Total: $ 1.815.000,00","CAE N°: 71234567890123","Fecha de Vto. de CAE: 22/06/2026"].entries()) pg.drawText(l,{x:40,y:800-i*18,size:10,font});
const qimg=await doc.embedPng(qrPng); pg.drawImage(qimg,{x:430,y:60,width:110,height:110});
doc.addPage([595.28,841.89]).drawText("Detalle del comprobante - pagina 2",{x:40,y:790,size:11,font});
const originalBytes = Buffer.from(await doc.save());

// guardar original + qr
const okey=`facturas/originals/${randomUUID()}.pdf`; await save(okey, originalBytes);
const qrCrop = qrPng; // ya es el qr; en prod se extrae, acá lo guardamos directo
const qkey=`facturas/qr/${randomUUID()}.png`; await save(qkey, qrCrop);

const t = await prisma.brandProfile.findFirst();
const f = await prisma.facturaUpload.create({ data:{
  tenantId:t.id, archivoOriginalUrl:`/api/files/${okey}`,
  nroComprobante:"0003-00004567", fechaComprobante:new Date(Date.UTC(2026,5,12)), total:1815000,
  clienteNombre:"Ingenieria del Sur S.A.", clienteCuit:"30-55554444-3", letra:"B", codComprobante:"006",
  cae:"71234567890123", caeVto:new Date(Date.UTC(2026,5,22)), qrUrl:`/api/files/${qkey}`, qrText:REAL, estado:"uploaded",
}});

// render portada + merge -> branded
const browser=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const page=await browser.newPage();
await page.goto(`http://localhost:3000/render/factura-portada/${f.id}`,{waitUntil:"networkidle0"});
await page.evaluateHandle("document.fonts.ready");
const portada=Buffer.from(await page.pdf({format:"A4",printBackground:true,margin:{top:"0",right:"0",bottom:"0",left:"0"}}));
await page.setViewport({width:820,height:1160}); await page.screenshot({path:"/tmp/portada-final.png"});
await browser.close();
const out=await PDFDocument.create();
for(const part of [portada, originalBytes]){ const s=await PDFDocument.load(part); (await out.copyPages(s,s.getPageIndices())).forEach(p=>out.addPage(p)); }
const branded=Buffer.from(await out.save());
const bkey=`facturas/${f.id}-branded.pdf`; await save(bkey, branded);
await prisma.facturaUpload.update({where:{id:f.id},data:{archivoBrandedUrl:`/api/files/${bkey}`,estado:"processed"}});
console.log("factura demo lista:", f.id, "| branded paginas:", (await PDFDocument.load(branded)).getPageCount());

async function save(key,buf){ const full=path.resolve(process.cwd(),"storage",key); await fs.mkdir(path.dirname(full),{recursive:true}); await fs.writeFile(full,buf); }
await prisma.$disconnect();
