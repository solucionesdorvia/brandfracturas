import puppeteer from "puppeteer";
const BASE="http://localhost:3000";
const setV=`(sel,v)=>{const el=document.querySelector(sel);if(!el)return false;const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));return true;}`;
const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const p=await b.newPage(); await p.setViewport({width:1100,height:900});
// login
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,800));
await p.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2500));
console.log("tras login, path:", new URL(p.url()).pathname);
// dashboard debe redirigir a /identidad
await p.goto(`${BASE}/dashboard`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
console.log("dashboard sin marca -> path:", new URL(p.url()).pathname);
const h1 = await p.evaluate(()=>document.querySelector('h1')?.innerText);
console.log("título:", h1);
// nuevo presupuesto también redirige
await p.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1200));
console.log("nuevo presupuesto sin marca -> path:", new URL(p.url()).pathname);
// crear la marca
await p.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await p.waitForSelector('#razonSocial'); await new Promise(r=>setTimeout(r,1000));
await p.evaluate(`(${setV})('#nombre','Constructora Ejemplo');(${setV})('#razonSocial','Constructora Ejemplo S.R.L.');(${setV})('#cuit','30-99999999-5');(${setV})('#domicilio','Calle Falsa 123, Córdoba');(${setV})('#condicionIVA','Responsable Inscripto')`);
const btn = await p.evaluate(()=>{const b=Array.from(document.querySelectorAll('button')).find(x=>/Crear marca/.test(x.innerText));return b?b.innerText:null;});
console.log("botón onboarding:", btn);
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Crear marca/.test(x.innerText)).click());
await new Promise(r=>setTimeout(r,4000));
console.log("tras crear marca -> path:", new URL(p.url()).pathname);
// dashboard ahora funciona
await p.goto(`${BASE}/dashboard`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1200));
const dashTxt = await p.evaluate(()=>document.body.innerText);
console.log("dashboard con marca -> path:", new URL(p.url()).pathname, "| marca activa:", /Constructora Ejemplo/.test(dashTxt));
await b.close();
