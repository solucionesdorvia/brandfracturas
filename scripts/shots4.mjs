import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
const prisma = new PrismaClient();
const t = await prisma.brandProfile.findFirst();
let p = await prisma.presupuesto.findFirst({ where:{ numero:"P-DEMO-4" } });
if(!p){
  p = await prisma.presupuesto.create({ data:{
    tenantId:t.id, numero:"P-DEMO-4", clienteNombre:"Constructora Andina S.A.",
    clienteDatos:{ cuit:"30-12345678-9", direccion:"Parque Industrial Norte, Lote 14", email:"compras@andina.com" },
    subtotal:250000, ivaInformativo:52500, total:302500,
    condiciones:"Anticipo 40% a la aceptación. Saldo a 30 días. Precios sujetos a variación de costos.",
    notas:"No incluye traslados fuera de CABA ni permisos municipales.",
    templateId:"classic",
    items:{ create:[
      { descripcion:"Relevamiento y anteproyecto de instalación eléctrica", cantidad:1, precioUnit:180000, subtotal:180000 },
      { descripcion:"Provisión y montaje de tablero seccional", cantidad:2, precioUnit:35000, subtotal:70000 },
    ]}
  }});
}
const browser = await puppeteer.launch({ headless:true, args:["--no-sandbox"] });
for(const tpl of ["classic","modern","minimal","lateral"]){
  const pg = await browser.newPage(); await pg.setViewport({ width:820, height:1160 });
  await pg.goto(`http://localhost:3000/render/presupuesto/${p.id}?template=${tpl}`,{ waitUntil:"networkidle0" });
  await pg.evaluateHandle("document.fonts.ready");
  await pg.screenshot({ path:`/tmp/tpl-${tpl}.png` });
  await pg.close();
}
await browser.close(); await prisma.$disconnect();
console.log("ok", p.id);
