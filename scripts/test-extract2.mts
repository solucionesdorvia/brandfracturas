import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractFacturaData } from "../lib/factura-extract.ts";

async function mkPdf(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  let y = 800;
  for (const l of lines) { page.drawText(l, { x: 40, y, size: 10, font }); y -= 18; }
  return Buffer.from(await doc.save());
}

const casos = {
  "Factura B estándar": [
    "ORIGINAL", "FACTURA", "Cod. 006   B",
    "Razon Social: Dorvia Soluciones S.A.S.",
    "CUIT: 30-71000000-7",
    "Punto de Venta: 0001   Comp. Nro: 00000123",
    "Fecha de Emision: 03/06/2026",
    "Periodo Facturado Desde: 01/06/2026 Hasta: 30/06/2026",
    "CUIT: 30-12345678-9",
    "Apellido y Nombre / Razon Social: Acme S.R.L.",
    "Condicion frente al IVA: Responsable Inscripto",
    "Importe Total: $ 302.500,00",
    "CAE N°: 71234567890123",
  ],
  "Factura A variante": [
    "FACTURA A", "Codigo 001",
    "Razón Social: Estudio XYZ SRL",
    "C.U.I.T.: 30-99999999-5",
    "Punto de Venta: 00005   Comprobante Nro: 00012345",
    "Fecha de Emisión: 15/05/2026",
    "Señor/es: Constructora del Plata S.A.",
    "Razón Social: Constructora del Plata S.A.",
    "CUIT: 33-55667788-9",
    "IVA Responsable Inscripto",
    "Subtotal: $ 1.000.000,00",
    "Importe Otros Tributos: $ 0,00",
    "Importe Total: $ 1.210.000,00",
  ],
};

for (const [nombre, lines] of Object.entries(casos)) {
  const buf = await mkPdf(lines);
  const r = await extractFacturaData(buf);
  console.log(`\n=== ${nombre} ===`);
  console.log("  nroComprobante:", r.nroComprobante);
  console.log("  fecha:         ", r.fechaComprobante?.toISOString().slice(0,10));
  console.log("  total:         ", r.total);
  console.log("  cliente:       ", r.clienteNombre);
  console.log("  clienteCuit:   ", r.clienteCuit);
}
