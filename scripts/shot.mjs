import { PrismaClient } from "@prisma/client";
import puppeteer from "puppeteer";
const prisma = new PrismaClient();
const p = await prisma.presupuesto.findFirst({ where: { numero: "P-TEST-0001" } });
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
for (const tpl of ["classic", "modern"]) {
  const page = await browser.newPage();
  await page.setViewport({ width: 820, height: 1160 });
  await page.goto(`http://localhost:3000/render/presupuesto/${p.id}?template=${tpl}`, { waitUntil: "networkidle0" });
  await page.evaluateHandle("document.fonts.ready");
  await page.screenshot({ path: `/tmp/presupuesto-${tpl}.png` });
}
await browser.close();
await prisma.$disconnect();
console.log("done");
