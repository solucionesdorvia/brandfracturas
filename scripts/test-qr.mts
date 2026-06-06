import { buildAfipQrUrl, generateAfipQrDataUrl } from "../lib/afip-qr.ts";
const input = { fecha: new Date(Date.UTC(2026,5,12)), cuitEmisor:"30-71000000-7", nroComprobante:"0003-00004567", codComprobante:"006", total:1815000, clienteCuit:"30-55554444-3", cae:"71234567890123" };
const url = buildAfipQrUrl(input);
console.log("URL:", url ? url.slice(0,80)+"..." : null);
const dataUrl = await generateAfipQrDataUrl(input);
console.log("dataUrl:", dataUrl ? dataUrl.slice(0,40)+"... ("+dataUrl.length+" chars)" : null);
