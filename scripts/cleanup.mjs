import puppeteer from "puppeteer";
const BASE="https://app-production-800e.up.railway.app";
const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const p=await b.newPage();
const setV=`(sel,v)=>{const el=document.querySelector(sel);const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}`;
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,800));
await p.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));
// revertir teléfono
await p.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await p.waitForSelector('#contactoTel'); await new Promise(r=>setTimeout(r,1000));
await p.evaluate(`(${setV})('#contactoTel','+54 11 5555-5555')`);
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar identidad/.test(x.innerText)).click());
await new Promise(r=>setTimeout(r,3500));
console.log("teléfono revertido");
// borrar presupuesto test
await p.goto(`${BASE}/presupuestos/cmq2tdp9f0001mg563qvioyx9`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.innerText.trim()==='Eliminar').click()); await new Promise(r=>setTimeout(r,700));
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Sí, eliminar/.test(x.innerText)).click()); await new Promise(r=>setTimeout(r,3000));
console.log("presupuesto borrado, path:", new URL(p.url()).pathname);
await b.close();
