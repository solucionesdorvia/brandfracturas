import puppeteer from "puppeteer";
const BASE="https://app-production-800e.up.railway.app";
const MARK="+54 11 0000-PERSIST";
const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const p=await b.newPage();
const setV=`(sel,v)=>{const el=document.querySelector(sel);const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}`;
const cookieH=async()=>(await p.cookies()).map(c=>`${c.name}=${c.value}`).join("; ");
// login
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,800));
await p.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));

// 1) cambiar contactoTel en Identidad y guardar
await p.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await p.waitForSelector('#contactoTel'); await new Promise(r=>setTimeout(r,1200));
await p.evaluate(`(${setV})('#contactoTel',${JSON.stringify(MARK)})`);
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar identidad/.test(x.innerText)).click());
await new Promise(r=>setTimeout(r,4000));
// refrescar y verificar
await p.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await p.waitForSelector('#contactoTel'); await new Promise(r=>setTimeout(r,1200));
const telAfterRefresh = await p.evaluate(()=>document.querySelector('#contactoTel').value);
console.log("BRAND refrescado tel:", telAfterRefresh, "==>", telAfterRefresh===MARK ? "PERSISTE ✅" : "NO PERSISTE ❌");

// 2) crear presupuesto
await p.goto(`${BASE}/presupuestos/nuevo`,{waitUntil:"networkidle0"}); await p.waitForSelector('#cliente'); await new Promise(r=>setTimeout(r,2000));
await p.evaluate(`(${setV})('#cliente','Persistencia Test SA')`);
await p.evaluate(()=>{const set=(el,v)=>{const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));};set(document.querySelectorAll('input[placeholder="Descripción"]')[0],'Item persistencia');set(document.querySelectorAll('input[step="any"]')[1],'123000');});
await p.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click());
let id=null; for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,3000));const pth=new URL(p.url()).pathname;if(pth.startsWith('/presupuestos/')&&pth.length>20){id=pth.split('/').pop();break;}}
console.log("PRESUPUESTO id:", id);
// refrescar el detalle
await p.goto(`${BASE}/presupuestos/${id}`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
const afterRefresh = await p.evaluate(()=>({h1:document.querySelector('h1')?.innerText, hasIframe:!!document.querySelector('iframe')}));
console.log("PRESUPUESTO refrescado:", JSON.stringify(afterRefresh));
const pdf=await fetch(`${BASE}/api/files/presupuestos/${id}.pdf`,{headers:{cookie:await cookieH()}});
console.log("PDF antes de redeploy:", pdf.status, (await pdf.arrayBuffer()).byteLength+"b");
console.log("PRESUPUESTO_ID="+id);
await b.close();
