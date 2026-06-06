import { PDFDocument, rgb } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import { PNG } from "pngjs";
import jsQR from "jsqr";

// PDF simple para probar que getScreenshot rasteriza en Node
const doc = await PDFDocument.create();
const page = doc.addPage([595.28, 841.89]);
page.drawText("FACTURA B", { x: 60, y: 760, size: 20 });
page.drawRectangle({ x: 60, y: 80, width: 100, height: 100, color: rgb(0,0,0) });
const pdf = Buffer.from(await doc.save());

const parser = new PDFParse({ data: pdf });
try {
  const res = await parser.getScreenshot({ imageDataUrl: true, screenshotWidth: 1000 });
  const pg = res.pages?.[0];
  console.log("getScreenshot OK. páginas:", res.pages?.length, "dataUrl:", pg?.dataUrl ? pg.dataUrl.slice(0,30)+"..." : "no");
  if (pg?.dataUrl) {
    const png = PNG.sync.read(Buffer.from(pg.dataUrl.split(",")[1], "base64"));
    console.log("raster:", png.width+"x"+png.height);
  }
} catch (e) {
  console.log("getScreenshot FALLA en node:", e.message.slice(0,120));
}
