import puppeteer from "puppeteer";
import { PDFDocument } from "pdf-lib";
const BASE="https://app-production-800e.up.railway.app";
const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const p=await b.newPage();
const cookieH=async()=>(await p.cookies()).map(c=>`${c.name}=${c.value}`).join("; ");
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,800));
await p.evaluate(()=>{const s=(el,v)=>{const f=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;f.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};s(document.querySelector('#email'),'prueba@ger.com');s(document.querySelector('#password'),'prueba123');});
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));
await p.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await p.waitForSelector('#cliente'); await new Promise(r=>setTimeout(r,2000));
// elegir template "Lateral" y cargar datos
const picked = await p.evaluate(()=>{
  const card=Array.from(document.querySelectorAll('button')).find(x=>/Lateral/.test(x.innerText)); card?.click();
  const s=(el,v)=>{const f=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;f.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};
  s(document.querySelector('#cliente'),'Cliente Template Lateral');
  const d=document.querySelectorAll('input[placeholder="Descripción"]')[0]; const n=document.querySelectorAll('input[step="any"]')[1];
  s(d,'Servicio de ingeniería'); s(n,'200000');
  return !!card;
});
console.log("card Lateral encontrada:", picked);
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
let id=null; for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,3000));const pth=new URL(p.url()).pathname;if(pth.startsWith('/presupuestos/')&&pth.length>20){id=pth.split('/').pop();break;}}
console.log("creado:", id);
if(id){
  const resp=await fetch(`${BASE}/api/files/presupuestos/${id}.pdf`,{headers:{cookie:await cookieH()}});
  const buf=Buffer.from(await resp.arrayBuffer());
  let pg=0; try{pg=(await PDFDocument.load(buf)).getPageCount();}catch{}
  console.log("PDF Lateral:", resp.status, buf.length+"b", pg+"pg", buf.subarray(0,5).toString());
  // cambiar a Minimalista vía regenerar
  await p.goto(`${BASE}/presupuestos/${id}`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
  await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Minimalista')?.click());
  await new Promise(r=>setTimeout(r,9000));
  const resp2=await fetch(`${BASE}/api/files/presupuestos/${id}.pdf`,{headers:{cookie:await cookieH()}});
  console.log("PDF tras cambiar a Minimalista:", resp2.status, (await resp2.arrayBuffer()).byteLength+"b");
  // limpiar: eliminar
  await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Eliminar').click()); await new Promise(r=>setTimeout(r,700));
  await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Sí, eliminar/.test(x.innerText)).click()); await new Promise(r=>setTimeout(r,3000));
  console.log("eliminado, path:", new URL(p.url()).pathname);
}
await b.close();
