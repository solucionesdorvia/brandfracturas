import type { Page } from "puppeteer";
import { getBrowser } from "./browser";

// Puppeteer corre en el mismo contenedor que Next, así que pega contra el
// server interno. En prod tomamos el PORT que asigna la plataforma.
const RENDER_BASE_URL =
  process.env.RENDER_BASE_URL ??
  `http://127.0.0.1:${process.env.PORT ?? 3000}`;
const NAV_TIMEOUT = 45_000;

/**
 * Lanza/usa Puppeteer, navega a una ruta interna de render (Tailwind real) y
 * devuelve el PDF A4. Robusto: timeouts acotados, fallback de espera y un
 * reintento si el browser se cayó a mitad del render.
 */
export async function renderHtmlToPdf(pathname: string): Promise<Buffer> {
  const url = pathname.startsWith("http")
    ? pathname
    : `${RENDER_BASE_URL}${pathname}`;

  try {
    return await renderOnce(url);
  } catch (err) {
    // Reintento único: el browser pudo haberse desconectado.
    console.warn("renderHtmlToPdf: reintentando tras error:", (err as Error)?.message);
    return await renderOnce(url);
  }
}

async function renderOnce(url: string): Promise<Buffer> {
  const browser = await getBrowser();
  let page: Page | null = null;
  try {
    page = await browser.newPage();
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);

    // networkidle0 es lo ideal, pero si una imagen tarda/cuelga, no queremos
    // que reviente: caemos a domcontentloaded + un pequeño asentamiento.
    try {
      await page.goto(url, { waitUntil: "networkidle0", timeout: NAV_TIMEOUT });
    } catch {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT });
      await sleep(800);
    }

    // Esperar fuentes, pero sin colgarse si nunca resuelve.
    await Promise.race([
      page.evaluate(() => (document as Document).fonts?.ready).catch(() => null),
      sleep(2500),
    ]);

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
