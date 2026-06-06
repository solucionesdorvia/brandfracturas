import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";

const prisma = new PrismaClient();
const BASE = "http://localhost:3000";

const tenant = await prisma.brandProfile.findFirst();
const p = await prisma.presupuesto.create({
  data: {
    tenantId: tenant.id,
    numero: "P-TEST-0001",
    clienteNombre: "Cliente de Prueba S.A.",
    clienteDatos: { email: "cliente@test.com", cuit: "30-12345678-9" },
    subtotal: 100000,
    ivaInformativo: 21000,
    total: 121000,
    condiciones: "50% al aceptar, 50% contra entrega.",
    templateId: "modern",
    items: {
      create: [
        { descripcion: "Diseño de marca", cantidad: 1, precioUnit: 80000, subtotal: 80000 },
        { descripcion: "Sesión de fotos", cantidad: 2, precioUnit: 10000, subtotal: 20000 },
      ],
    },
  },
});
console.log("presupuesto id:", p.id);

const url = `${BASE}/render/presupuesto/${p.id}?template=modern`;
const res = await fetch(url);
const html = await res.text();
console.log("render HTTP:", res.status);
console.log("HTML tiene 'Presupuesto':", html.includes("Presupuesto"));
console.log("HTML tiene cliente:", html.includes("Cliente de Prueba"));
console.log("HTML tiene total $:", html.includes("121.000") || html.includes("121000"));

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluateHandle("document.fonts.ready");
const pdf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", right: "0", bottom: "0", left: "0" } });
await browser.close();

console.log("PDF bytes:", pdf.length);
console.log("PDF header ok:", Buffer.from(pdf).slice(0, 5).toString() === "%PDF-");
const doc = await PDFDocument.load(pdf);
console.log("PDF páginas:", doc.getPageCount());

await prisma.$disconnect();
