import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { PDFParse } from "pdf-parse";

// 1) Generar un QR PNG (como el de AFIP) y embeberlo en un PDF
const qrDataUrl = await QRCode.toDataURL("https://www.afip.gob.ar/fe/qr/?p=TESTDATA", { width: 300, margin: 1 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const doc = await PDFDocument.create();
const page = doc.addPage([595.28, 841.89]);
const img = await doc.embedPng(qrPng);
page.drawImage(img, { x: 60, y: 80, width: 120, height: 120 });
page.drawText("FACTURA B - CAE 71234567890123", { x: 60, y: 760, size: 12 });
const pdf = Buffer.from(await doc.save());

// 2) Extraer imágenes
const parser = new PDFParse({ data: pdf });
const res = await parser.getImage({ imageDataUrl: true });
console.log("páginas con imágenes:", res.pages.length);
for (const p of res.pages) {
  for (const im of p.images) {
    console.log(`  img name=${im.name} ${im.width}x${im.height} ratio=${(im.width/im.height).toFixed(2)} dataUrl=${im.dataUrl ? im.dataUrl.slice(0,30)+'...' : 'no'}`);
  }
}
