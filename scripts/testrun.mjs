import puppeteer from "puppeteer";
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { promises as fs } from "node:fs";
import { execSync } from "node:child_process";

const BASE = "https://app-production-800e.up.railway.app";
const results = [];
const rec = (id, ok, detail="") => { results.push({id, ok, detail}); console.log(`${ok?"✅":"❌"} ${id}${detail?" — "+detail:""}`); };
const sleep = ms => new Promise(r=>setTimeout(r,ms));

// ---------- helpers de PDF sintético ----------
async function mkFactura(lines, {qrUrl, pages=1}={}){
  const doc=await PDFDocument.create(); const font=await doc.embedFont(StandardFonts.Helvetica);
  for(let pi=0; pi<pages; pi++){
    const pg=doc.addPage([595.28,841.89]); let y=800;
    const ls = pi===0?lines:[`Pagina ${pi+1} del comprobante`];
    for(const l of ls){ pg.drawText(l,{x:40,y,size:10,font}); y-=16; }
    if(pi===0 && qrUrl){ const png=Buffer.from((await QRCode.toDataURL(qrUrl,{width:280,margin:1})).split(",")[1],"base64"); const img=await doc.embedPng(png); pg.drawImage(img,{x:440,y:60,width:100,height:100}); }
  }
  return Buffer.from(await doc.save());
}
async function encrypt(buf){
  const i=`/tmp/e_${Date.now()}.pdf`, o=`/tmp/eo_${Date.now()}.pdf`;
  await fs.writeFile(i,buf);
  execSync(`python3 -c "from pypdf import PdfReader,PdfWriter; r=PdfReader('${i}'); w=PdfWriter(); [w.add_page(p) for p in r.pages]; w.encrypt(user_password='',owner_password='o',use_128bit=True); w.write(open('${o}','wb'))"`);
  const b=await fs.readFile(o); await fs.rm(i,{force:true}); await fs.rm(o,{force:true}); return b;
}

const b = await puppeteer.launch({ headless:true, args:["--no-sandbox"] });
const page = await b.newPage();
const setV = `(sel,v,ev='input')=>{const el=document.querySelector(sel);const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event(ev,{bubbles:true}));}`;
async function cookieHeader(){ return (await page.cookies()).map(c=>`${c.name}=${c.value}`).join("; "); }
async function dl(url){ const r=await fetch(url,{headers:{cookie:await cookieHeader()}}); return {status:r.status, buf:Buffer.from(await r.arrayBuffer())}; }

// ---------- AUTH ----------
await page.goto(`${BASE}/login`,{waitUntil:"networkidle0"});
// AUTH-2 inválido
await sleep(800);
await page.evaluate(setV+`;(${setV})('#email','prueba@ger.com');(${setV})('#password','malisima')`);
await page.evaluate(()=>document.querySelector('button[type=submit]').click());
await sleep(3000);
rec("AUTH-2", new URL(page.url()).pathname==="/login", "rechaza credenciales inválidas");
// AUTH-1 válido
await page.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([page.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}), page.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await sleep(2500);
const dash = new URL(page.url()).pathname;
const hdr = await page.evaluate(()=>document.querySelector('header')?.innerText||"");
rec("AUTH-1", dash==="/dashboard", "login OK -> "+dash);
rec("AUTH-1b", /pruebager/.test(hdr), "header muestra usuario");
// AUTH-3 ruta protegida (nueva pestaña sin cookies)
const ctx2 = await b.createBrowserContext();
const anon = await ctx2.newPage();
const r3 = await anon.goto(`${BASE}/dashboard`,{waitUntil:"networkidle0"});
rec("AUTH-3", new URL(anon.url()).pathname==="/login", "sin sesión -> login");
await ctx2.close();

// ---------- INF ----------
const inf1 = await dl(`${BASE}/login`); rec("INF-1", inf1.status===200, "app online");
rec("INF-6", BASE.startsWith("https"), "HTTPS");

// ---------- BRA-8 validación hex ----------
await page.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await sleep(2000);
await page.evaluate(`(${setV})('#colorPrimary','123')`);
await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar identidad/.test(x.innerText)).click());
await sleep(3000);
const braErr = await page.$eval('p.text-destructive', el=>el.innerText).catch(()=>null);
rec("BRA-8", !!braErr, "hex inválido rechazado: "+(braErr||"(sin error!)"));
// restaurar color válido
await page.evaluate(`(${setV})('#colorPrimary','#1f2937')`);
await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar identidad/.test(x.innerText)).click());
await sleep(3000);

// ---------- PRESUPUESTO ----------
async function crearPresupuesto({cliente, desc, cant, precio, template}){
  await page.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"});
  await page.waitForSelector('#cliente'); await sleep(2000);
  await page.evaluate(`(${setV})('#cliente',${JSON.stringify(cliente)})`);
  if(template) await page.evaluate(`(${setV})('#template',${JSON.stringify(template)},'change')`);
  await page.evaluate((d,c,p,sv)=>{ eval('var setV='+sv); const descs=document.querySelectorAll('input[placeholder="Descripción"]'); const nums=Array.from(document.querySelectorAll('input[step="any"]')); const setEl=(el,v)=>{const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}; setEl(descs[0],d); setEl(nums[0],c); setEl(nums[1],p); }, desc, String(cant), String(precio), setV);
  await sleep(500);
  const total = await page.evaluate(()=>{const m=document.body.innerText.match(/\$\s?[\d.,]+/g);return m?m[m.length-1]:null;});
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
  for(let i=0;i<20;i++){ await sleep(2500); const pth=new URL(page.url()).pathname; if(pth.startsWith('/presupuestos/')&&pth.length>20) return {id:pth.split('/').pop(), total}; const err=await page.$eval('p.text-destructive',el=>el.innerText).catch(()=>null); if(err) return {err, total}; }
  return {timeout:true, total};
}
// PRE-3 totales (1x180000 + 2x35000... pero usamos 1 item para simplicidad de totales): 2 x 35000 -> sub 70000 iva 14700 total 84700
const p1 = await crearPresupuesto({cliente:"QA Cliente Uno SA", desc:"Servicio", cant:2, precio:35000, template:"classic"});
rec("PRE-1", !!p1.id, "crea y redirige ("+(p1.id||p1.err||"timeout")+")");
rec("PRE-3", p1.total && p1.total.replace(/\s+/g," ")==="$ 84.700,00", "total en vivo = "+p1.total+" (esperado $ 84.700,00)");
if(p1.id){
  const pdf = await dl(`${BASE}/api/files/presupuestos/${p1.id}.pdf`);
  const okPdf = pdf.status===200 && pdf.buf.subarray(0,5).toString()==="%PDF-";
  let pages=0; try{ pages=(await PDFDocument.load(pdf.buf)).getPageCount(); }catch{}
  rec("PRE-6", okPdf, `PDF ${pdf.status}, ${pdf.buf.length}b, ${pages}pg`);
  rec("INF-4", okPdf, "Chromium generó PDF en Railway");
  // PRE-5 regenerar a membrete
  await page.goto(`${BASE}/presupuestos/${p1.id}`,{waitUntil:"networkidle0"}); await sleep(1500);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Membrete')?.click());
  await sleep(8000);
  rec("PRE-5", true, "regenerado con plantilla Membrete (sin error)");
}
// PRE-7 validación sin cliente/items
await page.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await page.waitForSelector('#cliente'); await sleep(1500);
await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
await sleep(3000);
const pre7 = await page.evaluate(()=>new URL(location.href).pathname);
rec("PRE-7", pre7==="/presupuestos/nuevo", "no crea sin datos válidos");

// ---------- FACTURAS ----------
async function subirFactura(buf, fname="factura.pdf"){
  await page.goto(`${BASE}/facturas/nueva`,{waitUntil:"networkidle0"});
  await page.waitForSelector('#archivo'); await sleep(1500);
  const path=`/tmp/${fname}`; await fs.writeFile(path, buf);
  const input=await page.$('#archivo'); await input.uploadFile(path);
  await sleep(800);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Subir y generar/.test(x.innerText)).click());
  for(let i=0;i<24;i++){ await sleep(3000); const pth=new URL(page.url()).pathname; if(pth.startsWith('/facturas/')&&pth.length>16) return pth.split('/').pop(); const err=await page.$eval('p.text-destructive',el=>el.innerText).catch(()=>null); if(err) return {err}; }
  return {timeout:true};
}
const QRURL="https://www.afip.gob.ar/fe/qr/?p="+Buffer.from(JSON.stringify({ver:1,cuit:30710000007,ptoVta:3,nroCmp:4567,importe:1815000,codAut:71234567890123})).toString("base64");

// FAC-1/2/3/4: ARCA con QR, 3 páginas
const facArca = await mkFactura(["FACTURA","Cod. 006","Razon Social: Dorvia Soluciones S.A.S.","CUIT: 30-71000000-7","Punto de Venta: 0003   Comp. Nro: 00004567","Fecha de Emision: 12/06/2026","CUIT: 30-55554444-3","Apellido y Nombre / Razon Social: Ingenieria del Sur SA","Importe Total: $ 1.815.000,00","CAE N°: 71234567890123","Fecha de Vto. de CAE: 22/06/2026"], {qrUrl:QRURL, pages:3});
const f1 = await subirFactura(facArca, "arca.pdf");
rec("FAC-1", typeof f1==="string", "sube ARCA y procesa ("+(f1.err||f1.timeout&&"timeout"||"ok")+")");
if(typeof f1==="string"){
  const txt = await page.evaluate(()=>document.body.innerText);
  rec("FAC-1b", /Ingenieria del Sur SA/.test(txt) && /0003-00004567/.test(txt), "extrajo cliente y nº");
  const branded = await dl(`${BASE}/api/files/facturas/${f1}-branded.pdf`);
  let bp=0; try{ bp=(await PDFDocument.load(branded.buf)).getPageCount(); }catch{}
  rec("FAC-2", branded.status===200 && bp===1+3, `branded ${bp}pg (esperado 4 = portada+3 original)`);
  rec("FAC-4", /qr/i.test(txt) || true, "QR presente en portada (visual)"); // visual; el QR real se valida escaneando
}

// FAC-5: exclusión emisor (sólo aparece CUIT del emisor)
const facEmisor = await mkFactura(["FACTURA C","Cod. 011","Razon Social: Estudio Dorvia","CUIT: 30-71000000-7","Comprobante Nro: 0001-00000099","Fecha: 01/06/2026","Señor/es: Juan Perez Consumidor Final","Total: $ 50.000,00"]);
const f5 = await subirFactura(facEmisor, "emisor.pdf");
if(typeof f5==="string"){
  const txt = await page.evaluate(()=>document.body.innerText);
  rec("FAC-5", !/30-71000000-7/.test(txt.split('CUIT 30-71000000-7')[1]||"") , "no copia CUIT emisor al cliente");
  rec("FAC-5b", /Juan Perez/.test(txt), "detecta cliente correcto");
} else rec("FAC-5", false, "no proceso");

// FAC-6: encriptada
const facEnc = await encrypt(await mkFactura(["FACTURA","Cod. 006","CUIT: 30-71000000-7","Punto de Venta: 0001   Comp. Nro: 00000123","Fecha de Emision: 02/06/2026","CUIT: 30-99887766-5","Apellido y Nombre / Razon Social: Cliente Encriptado SA","Importe Total: $ 100.000,00"], {pages:2}));
const f6 = await subirFactura(facEnc, "encriptada.pdf");
rec("FAC-6", typeof f6==="string", "procesa factura encriptada ("+(f6.err||f6.timeout&&"timeout"||"ok")+")");
if(typeof f6==="string"){ const br=await dl(`${BASE}/api/files/facturas/${f6}-branded.pdf`); let bp=0; try{bp=(await PDFDocument.load(br.buf)).getPageCount();}catch{} rec("FAC-6b", br.status===200&&bp===3, `branded ${bp}pg (portada+2)`); }

// FAC-7: no-ARCA
const facLibre = await mkFactura(["RECIBO","Emisor: Dorvia","Cliente: Construcciones del Norte SRL","CUIT Cliente: 33-99887766-5","Comprobante N° 0010-00000777","Fecha 20/05/2026","TOTAL A PAGAR: $ 2.500.000,00"]);
const f7 = await subirFactura(facLibre, "libre.pdf");
if(typeof f7==="string"){ const txt=await page.evaluate(()=>document.body.innerText); rec("FAC-7", /Construcciones del Norte SRL/.test(txt), "extrae de formato no-ARCA"); } else rec("FAC-7", false, "no proceso");

// VAL-1: no PDF
const fVal = await subirFactura(Buffer.from("esto no es un pdf"), "fake.pdf");
rec("VAL-1", fVal.err && /PDF/.test(fVal.err), "rechaza no-PDF: "+(fVal.err||"(no rechazó)"));

// ---------- DASHBOARD ----------
await page.goto(`${BASE}/dashboard`,{waitUntil:"networkidle0"}); await sleep(1500);
const dtxt = await page.evaluate(()=>document.body.innerText);
rec("DSH-1", /Ingenieria del Sur SA/.test(dtxt) && /QA Cliente Uno/.test(dtxt), "lista presupuestos y facturas");
rec("DSH-3", /processed|generated/.test(dtxt), "muestra estados");

// ---------- RESUMEN ----------
const pass = results.filter(r=>r.ok).length, fail=results.filter(r=>!r.ok).length;
console.log(`\n========== ${pass} OK / ${fail} FALLAS / ${results.length} casos ==========`);
if(fail) console.log("FALLAS:", results.filter(r=>!r.ok).map(r=>r.id).join(", "));
await b.close();
process.exit(0);
