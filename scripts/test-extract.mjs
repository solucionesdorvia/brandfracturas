import { PDFDocument, StandardFonts } from "pdf-lib";
import { PDFParse } from "pdf-parse";

// Construir una factura AFIP-like con texto embebido
const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
const page = doc.addPage([595.28, 841.89]);
const lines = [
  "ORIGINAL",
  "FACTURA",
  "Cod. 006   B",
  "Razon Social: Dorvia Soluciones S.A.S.",
  "CUIT: 30-71000000-7",
  "Punto de Venta: 0001   Comp. Nro: 00000123",
  "Fecha de Emision: 03/06/2026",
  "CUIT: 30-12345678-9",
  "Apellido y Nombre / Razon Social: Acme S.R.L.",
  "Condicion frente al IVA: Responsable Inscripto",
  "Importe Total: $ 302.500,00",
  "CAE N°: 71234567890123",
];
let y = 800;
for (const l of lines) { page.drawText(l, { x: 40, y, size: 11, font }); y -= 20; }
const bytes = Buffer.from(await doc.save());

const parser = new PDFParse({ data: bytes });
const res = await parser.getText();
console.log("=== TEXTO EXTRAÍDO ===");
console.log(res.text);
