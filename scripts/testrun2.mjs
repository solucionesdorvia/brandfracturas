import puppeteer from "puppeteer";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PNG } from "pngjs";
import { promises as fs } from "node:fs";
const BASE = "https://app-production-800e.up.railway.app";
const results=[]; const rec=(id,ok,d="")=>{results.push({id,ok});console.log(`${ok?"✅":"❌"} ${id}${d?" — "+d:""}`);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const setV=`(sel,v,ev='input')=>{const el=document.querySelector(sel);const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event(ev,{bubbles:true}));}`;

// factura ~2MB (imagen de ruido incompresible)
async function facturaPesada(){
  const W=900,H=900; const png=new PNG({width:W,height:H});
  for(let i=0;i<png.data.length;i++) png.data[i]=Math.floor(Math.random()*256);
  const imgBuf=PNG.sync.write(png);
  const doc=await PDFDocument.create(); const font=await doc.embedFont(StandardFonts.Helvetica);
  const pg=doc.addPage([595,841]);
  for(const [i,l] of ["FACTURA","Cod. 006","CUIT: 30-71000000-7","Punto de Venta: 0007  Comp. Nro: 00002222","Fecha de Emision: 06/06/2026","CUIT: 30-44445555-6","Apellido y Nombre / Razon Social: Cliente Pesado SA","Importe Total: $ 500.000,00","CAE N°: 71234567890999"].entries()) pg.drawText(l,{x:40,y:800-i*16,size:10,font});
  const img=await doc.embedPng(imgBuf); pg.drawImage(img,{x:40,y:60,width:200,height:200});
  return Buffer.from(await doc.save());
}

const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const page=await b.newPage();
async function cookieHeader(){return (await page.cookies()).map(c=>`${c.name}=${c.value}`).join("; ");}
// login
await page.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await sleep(1000);
await page.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([page.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),page.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await sleep(2500);
rec("LOGIN", new URL(page.url()).pathname==="/dashboard");

async function subir(buf,fname){
  await page.goto(`${BASE}/facturas/nueva`,{waitUntil:"networkidle0"}); await page.waitForSelector('#archivo'); await sleep(1200);
  await fs.writeFile(`/tmp/${fname}`,buf);
  const input=await page.$('#archivo'); await input.uploadFile(`/tmp/${fname}`); await sleep(800);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Subir y generar/.test(x.innerText)).click());
  for(let i=0;i<26;i++){await sleep(3000);const p=new URL(page.url()).pathname;if(p.startsWith('/facturas/')&&p.length>16)return p.split('/').pop();const e=await page.$eval('p.text-destructive',el=>el.innerText).catch(()=>null);if(e)return{err:e};}
  return {timeout:true};
}

// VAL-2b: factura real-size (~2MB) -> DEBE procesar (valida bodySizeLimit)
const pesada=await facturaPesada();
console.log("tamaño factura pesada:", (pesada.length/1024/1024).toFixed(2)+"MB");
const fp=await subir(pesada,"pesada.pdf");
rec("VAL-2b (factura >1MB procesa)", typeof fp==="string", typeof fp==="string"?("ok "+fp):(fp.err||"timeout"));

// FAC-8: corregir datos + regenerar
if(typeof fp==="string"){
  await page.goto(`${BASE}/facturas/${fp}`,{waitUntil:"networkidle0"}); await sleep(1500);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Corregir datos').click());
  await sleep(1000);
  await page.evaluate(`(${setV})('#e-cliente','Cliente Corregido SRL')`);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y regenerar/.test(x.innerText)).click());
  await sleep(10000);
  const txt=await page.evaluate(()=>document.body.innerText);
  rec("FAC-8 (corregir+regenerar)", /Cliente Corregido SRL/.test(txt), "dato corregido visible");
  // FAC-13 eliminar
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Eliminar').click());
  await sleep(800);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Sí, eliminar/.test(x.innerText)).click());
  await sleep(3500);
  rec("FAC-13 (eliminar)", new URL(page.url()).pathname==="/dashboard");
}

// VAL-2: >25MB -> error amigable
const big=Buffer.concat([Buffer.from("%PDF-1.4\n"),Buffer.alloc(26*1024*1024,0x20)]);
const fb=await subir(big,"big.pdf");
rec("VAL-2 (>25MB rechaza)", fb.err && /25 MB/.test(fb.err), fb.err||"(no rechazó)");

// VAL-3: email inválido en presupuesto
await page.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await page.waitForSelector('#cliente'); await sleep(1500);
await page.evaluate(`(${setV})('#cliente','Test Email');(${setV})('#cemail','no-es-email')`);
await page.evaluate(()=>{const d=document.querySelectorAll('input[placeholder="Descripción"]')[0];const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(d),'value').set;s.call(d,'item');d.dispatchEvent(new Event('input',{bubbles:true}));const n=document.querySelectorAll('input[step="any"]')[1];s.call(n,'1000');n.dispatchEvent(new Event('input',{bubbles:true}));});
await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
await sleep(4000);
const v3err=await page.$eval('p.text-destructive',el=>el.innerText).catch(()=>null);
rec("VAL-3 (email inválido)", new URL(page.url()).pathname==="/presupuestos/nuevo" && !!v3err, v3err||"(sin error)");

// PRE-10: crear y eliminar presupuesto
await page.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await page.waitForSelector('#cliente'); await sleep(1500);
await page.evaluate(`(${setV})('#cliente','Para Borrar SA')`);
await page.evaluate(()=>{const d=document.querySelectorAll('input[placeholder="Descripción"]')[0];const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};set(d,'item');set(document.querySelectorAll('input[step="any"]')[1],'1000');});
await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
let pid=null; for(let i=0;i<16;i++){await sleep(2500);const p=new URL(page.url()).pathname;if(p.startsWith('/presupuestos/')&&p.length>20){pid=p.split('/').pop();break;}}
if(pid){
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Eliminar').click()); await sleep(800);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Sí, eliminar/.test(x.innerText)).click()); await sleep(3000);
  rec("PRE-10 (eliminar)", new URL(page.url()).pathname==="/dashboard");
} else rec("PRE-10 (eliminar)", false, "no se creó");

// NF-404: recurso inexistente -> not-found amigable, no crash
const r404=await fetch(`${BASE}/presupuestos/noexiste123456789`,{headers:{cookie:await cookieHeader()}});
const html404=await r404.text();
rec("NF-404 (recurso inexistente)", /Página no encontrada|no encontrad/i.test(html404), `HTTP ${r404.status}`);

const pass=results.filter(r=>r.ok).length,fail=results.filter(r=>!r.ok).length;
console.log(`\n===== ${pass} OK / ${fail} FALLAS / ${results.length} =====`);
if(fail) console.log("FALLAS:",results.filter(r=>!r.ok).map(r=>r.id).join(", "));
await b.close(); process.exit(0);
