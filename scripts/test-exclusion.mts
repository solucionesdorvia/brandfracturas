import { PDFDocument, StandardFonts } from "pdf-lib";
import { extractFacturaData } from "../lib/factura-extract.ts";

const EMISOR = { cuit: "30-71000000-7", razonSocial: "Dorvia Soluciones S.A.S.", nombre: "Estudio Dorvia" };

async function mk(lines: string[]): Promise<Buffer> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  let y = 800; for (const l of lines){ page.drawText(l,{x:40,y,size:10,font}); y-=18; }
  return Buffer.from(await doc.save());
}

const casos: Record<string,string[]> = {
  "ARCA B (emisor arriba, receptor abajo)": [
    "FACTURA","Cod. 006","Razon Social: Dorvia Soluciones S.A.S.","CUIT: 30-71000000-7",
    "Punto de Venta: 0003   Comp. Nro: 00004567","Fecha de Emision: 12/06/2026",
    "CUIT: 30-55554444-3","Apellido y Nombre / Razon Social: Ingenieria del Sur S.A.",
    "Importe Total: $ 1.815.000,00","CAE N°: 71234567890123",
  ],
  "Solo aparece el CUIT del emisor (no debe copiarlo al cliente)": [
    "FACTURA C","Cod. 011","Razon Social: Estudio Dorvia","CUIT: 30-71000000-7",
    "Comprobante Nro: 0001-00000099","Fecha: 01/06/2026",
    "Señor/es: Juan Perez","Total: $ 50.000,00",
  ],
  "No-ARCA / formato libre": [
    "PRESUPUESTO / FACTURA","Emisor: Dorvia","Cliente: Construcciones del Norte SRL",
    "CUIT Cliente: 33-99887766-5","Comprobante N° 12345678","Fecha 20/05/2026",
    "TOTAL A PAGAR: $ 2.500.000,00",
  ],
  "Emisor con acentos y sufijo distinto": [
    "Razón Social: DORVIA SOLUCIONES SAS","C.U.I.T.: 30-71000000-7",
    "Pto Vta: 5  Comp. Nro: 1234","Fecha de Emisión: 03/06/2026",
    "Señores: Metalúrgica Río Cuarto S.A.  CUIT: 30-22223333-4",
    "Importe Total $ 999.999,00",
  ],
};

for (const [nombre, lines] of Object.entries(casos)) {
  const buf = await mk(lines);
  const r = await extractFacturaData(buf, EMISOR);
  const okCliente = r.clienteNombre && !/dorvia/i.test(r.clienteNombre);
  const okCuit = r.clienteCuit !== "30-71000000-7";
  console.log(`\n=== ${nombre} ===`);
  console.log(`  nro=${r.nroComprobante} fecha=${r.fechaComprobante?.toISOString().slice(0,10)} total=${r.total}`);
  console.log(`  cliente=${r.clienteNombre}  cuit=${r.clienteCuit}`);
  console.log(`  ✓ cliente != emisor: ${okCliente}   ✓ cuit != emisor: ${okCuit}`);
}
