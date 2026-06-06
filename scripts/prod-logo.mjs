import puppeteer from "puppeteer";
const BASE = "https://app-production-800e.up.railway.app";
const b = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const p = await b.newPage();
await p.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
await new Promise(r=>setTimeout(r,1000));
await p.evaluate(()=>{ const s=(el,v)=>{const f=Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el),'value').set;f.call(el,v);el.dispatchEvent(new Event('input',{bubbles:true}));}; s(document.querySelector('#email'),'prueba@ger.com'); s(document.querySelector('#password'),'prueba123'); });
await Promise.all([p.waitForNavigation({waitUntil:"networkidle0"}).catch(()=>{}), p.evaluate(()=>document.querySelector('button[type=submit]').click())]);
await new Promise(r=>setTimeout(r,2000));
await p.goto(`${BASE}/identidad`, { waitUntil: "networkidle0" });
await p.waitForSelector('#logo');
await new Promise(r=>setTimeout(r,1500));
const input = await p.$('#logo');
await input.uploadFile('/Users/valentindoroszuk/Downloads/dorvia.png');
await new Promise(r=>setTimeout(r,800));
await p.evaluate(()=>{ Array.from(document.querySelectorAll('button')).find(x=>/Guardar identidad/.test(x.innerText)).click(); });
for (let i=0;i<10;i++){ await new Promise(r=>setTimeout(r,2000)); const msg=await p.$eval('p.text-emerald-600',el=>el.innerText).catch(()=>null); if(msg){ console.log("guardado:", msg); break; } }
await b.close();
