import puppeteer from "puppeteer";
const BASE="https://app-production-800e.up.railway.app";
const PID="cmq2tdp9f0001mg563qvioyx9";
const MARK="+54 11 0000-PERSIST";
const b=await puppeteer.launch({headless:true,args:["--no-sandbox"]});
const p=await b.newPage();
const setV=`(sel,v)=>{const el=document.querySelector(sel);const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}`;
const cookieH=async()=>(await p.cookies()).map(c=>c.name+"="+c.value).join("; ");
await p.goto(`${BASE}/login`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,800));
await p.evaluate(`(${setV})('#email','prueba@ger.com');(${setV})('#password','prueba123')`);
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}),p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));
// 1) PDF en el volumen
const pdf=await fetch(`${BASE}/api/files/presupuestos/${PID}.pdf`,{headers:{cookie:await cookieH()}});
const len=(await pdf.arrayBuffer()).byteLength;
console.log("PDF tras redeploy:", pdf.status, len+"b", "==>", pdf.status===200&&len>0?"SOBREVIVIÓ ✅":"PERDIDO ❌");
// 2) presupuesto en dashboard
await p.goto(`${BASE}/dashboard`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
const inDash=await p.evaluate(()=>/Persistencia Test SA/.test(document.body.innerText));
console.log("Presupuesto en dashboard:", inDash?"SÍ ✅":"NO ❌");
// 3) detalle carga
await p.goto(`${BASE}/presupuestos/${PID}`,{waitUntil:"networkidle0"}); await new Promise(r=>setTimeout(r,1500));
const detail=await p.evaluate(()=>({h1:document.querySelector('h1')?.innerText,iframe:!!document.querySelector('iframe')}));
console.log("Detalle tras redeploy:", JSON.stringify(detail));
// 4) marca persistida
await p.goto(`${BASE}/identidad`,{waitUntil:"networkidle0"}); await p.waitForSelector('#contactoTel'); await new Promise(r=>setTimeout(r,1000));
const tel=await p.evaluate(()=>document.querySelector('#contactoTel').value);
const logo=await p.evaluate(()=>!!document.querySelector('img[alt]'));
console.log("Marca tel tras redeploy:", tel, "==>", tel===MARK?"PERSISTE ✅":"NO ❌", "| logo presente:", logo);
await b.close();
