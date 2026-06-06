import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
const prisma = new PrismaClient();
const tenant = await prisma.brandProfile.findFirst();

// asegurar un presupuesto con condiciones/notas para ver todo
let p = await prisma.presupuesto.findFirst({ orderBy:{ createdAt:'desc' }, include:{ items:true } });
if (!p) {
  p = await prisma.presupuesto.create({ data:{
    tenantId: tenant.id, numero:'P-2026-0001', clienteNombre:'Acme S.R.L.',
    clienteDatos:{ cuit:'30-12345678-9', direccion:'Parque Industrial Norte, Lote 14', email:'compras@acme.com' },
    subtotal:250000, ivaInformativo:52500, total:302500,
    condiciones:'Anticipo del 40% a la aceptación. Saldo a 30 días de finalizada la obra. Precios sujetos a revisión por variación de costos.',
    notas:'No incluye gastos de traslado fuera de CABA ni permisos municipales.',
    templateId:'classic',
    items:{ create:[
      { descripcion:'Relevamiento y anteproyecto de instalación eléctrica', cantidad:1, precioUnit:180000, subtotal:180000 },
      { descripcion:'Provisión y montaje de tablero seccional', cantidad:2, precioUnit:35000, subtotal:70000 },
    ]}
  }, include:{ items:true }});
}
let f = await prisma.facturaUpload.findFirst({ orderBy:{ createdAt:'desc' }});
if (!f) {
  f = await prisma.facturaUpload.create({ data:{
    tenantId: tenant.id, archivoOriginalUrl:'/api/files/x.pdf', nroComprobante:'0001-00000123',
    fechaComprobante:new Date('2026-06-03'), total:302500, clienteNombre:'Acme S.R.L.', estado:'uploaded'
  }});
}

const browser = await puppeteer.launch({ headless:true, args:['--no-sandbox'] });
async function shot(url, path){ const pg=await browser.newPage(); await pg.setViewport({width:820,height:1160}); await pg.goto(url,{waitUntil:'networkidle0'}); await pg.evaluateHandle('document.fonts.ready'); await pg.screenshot({path}); await pg.close(); }
await shot(`http://localhost:3000/render/presupuesto/${p.id}?template=classic`, '/tmp/t-classic.png');
await shot(`http://localhost:3000/render/presupuesto/${p.id}?template=modern`, '/tmp/t-modern.png');
await shot(`http://localhost:3000/render/factura-portada/${f.id}`, '/tmp/t-portada.png');
await browser.close();
console.log('presupuesto', p.id, '| factura', f.id);
await prisma.$disconnect();
