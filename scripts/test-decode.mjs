import { PDFDocument } from "pdf-lib";
import QRCode from "qrcode";
import { PDFParse } from "pdf-parse";
import { PNG } from "pngjs";
import jsQR from "jsqr";

const realUrl = "https://www.afip.gob.ar/fe/qr/?p=eyJ2ZXIiOjEsImN1aXQiOjMwNzEwMDAwMDA3fQ==";
const qrDataUrl = await QRCode.toDataURL(realUrl, { width: 300, margin: 1 });
const qrPng = Buffer.from(qrDataUrl.split(",")[1], "base64");
const doc = await PDFDocument.create();
const page = doc.addPage([595.28, 841.89]);
// logo cuadrado falso (para ver que NO lo confunde)
const img = await doc.embedPng(qrPng);
page.drawImage(img, { x: 60, y: 80, width: 120, height: 120 });
const pdf = Buffer.from(await doc.save());

const parser = new PDFParse({ data: pdf });
const res = await parser.getImage({ imageDataUrl: true });
for (const p of res.pages) {
  for (const im of p.images) {
    const png = PNG.sync.read(Buffer.from(im.dataUrl.split(",")[1], "base64"));
    const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
    console.log(`img ${im.width}x${im.height} -> QR:`, code ? code.data.slice(0,55)+"..." : "no decodifica");
  }
}
