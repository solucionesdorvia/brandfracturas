import puppeteer from "puppeteer";
const BASE = "https://app-production-800e.up.railway.app";
const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await new Promise(r=>setTimeout(r,1200));
await p.evaluate(()=>{ const setV=(el,v)=>{const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}; setV(document.querySelector('#email'),'prueba@ger.com'); setV(document.querySelector('#password'),'prueba123'); });
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}), p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));
console.log("login ->", new URL(p.url()).pathname);
await p.goto(`${BASE}/presupuestos/nuevo`, { waitUntil: "networkidle0" });
await p.waitForSelector("#cliente");
await new Promise(r=>setTimeout(r,2500));
const setup = await p.evaluate(()=>{
  const setV=(el,v,ev='input')=>{const s=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;s.call(el,v);el.dispatchEvent(new Event(ev,{bubbles:true}));};
  setV(document.querySelector('#cliente'),'Cliente Produccion SA');
  const descs=document.querySelectorAll('input[placeholder="Descripción"]');
  const nums=Array.from(document.querySelectorAll('input[step="any"]'));
  setV(descs[0],'Servicio de prueba en produccion'); setV(nums[0],'1'); setV(nums[1],'123456');
  const total=(document.body.innerText.match(/\$\s?[\d.,]+/g)||[]).slice(-1)[0];
  return { cliente: document.querySelector('#cliente').value, total };
});
console.log("form seteado:", JSON.stringify(setup));
await p.evaluate(()=>{ Array.from(document.querySelectorAll('button')).find(x=>/Guardar y generar/.test(x.innerText)).click(); });
await new Promise(r=>setTimeout(r,1500));
const btnState=await p.evaluate(()=>{const b=Array.from(document.querySelectorAll('button')).find(x=>/Guardar|Generando/.test(x.innerText));return b?b.innerText:null;});
console.log("botón tras submit:", btnState);
for (let i=0;i<24;i++){
  await new Promise(r=>setTimeout(r,5000));
  const path=new URL(p.url()).pathname;
  const err=await p.$eval('p.text-destructive', el=>el.innerText).catch(()=>null);
  if (path.length>20 && path.startsWith('/presupuestos/')){ console.log(`[${(i+1)*5}s] REDIRECT -> ${path}`); break; }
  if (err){ console.log(`[${(i+1)*5}s] ERROR: ${err}`); break; }
}
const iframe=await p.$eval('iframe',el=>el.src).catch(()=>null);
console.log("iframe PDF:", iframe);
if (iframe){ const resp=await fetch(iframe); const buf=Buffer.from(await resp.arrayBuffer()); console.log("PDF prod -> HTTP",resp.status,"bytes",buf.length,"header",buf.subarray(0,5).toString()); }
await b.close();
