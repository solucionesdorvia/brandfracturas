import { getBrowser } from "./browser";

const RENDER_BASE_URL =
  process.env.RENDER_BASE_URL ?? "http://localhost:3000";

/**
 * Lanza Puppeteer, navega a una ruta interna de render (que usa Tailwind real
 * renderizado por Next) y devuelve el PDF A4 con backgrounds.
 *
 * @param pathname ruta relativa, p.ej. "/render/presupuesto/abc?template=modern"
 */
export async function renderHtmlToPdf(pathname: string): Promise<Buffer> {
  const url = pathname.startsWith("http")
    ? pathname
    : `${RENDER_BASE_URL}${pathname}`;

  const browser = await getBrowser();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30_000 });
    // Asegura que las webfonts terminen de cargar antes de imprimir.
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
