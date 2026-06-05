import type { Browser } from "puppeteer";

// getBrowser aísla el lanzamiento de Chromium para poder cambiar de estrategia
// sin tocar el resto del código:
//
//  - LOCAL / dev:   puppeteer "full" (trae su propio Chromium).
//  - Railway / prod si la memoria molesta: switchear a puppeteer-core +
//    @sparticuz/chromium. Para eso, setear PUPPETEER_USE_SPARTICUZ=1 e
//    instalar esas deps; la rama de abajo queda lista para activarla.
export async function getBrowser(): Promise<Browser> {
  if (process.env.PUPPETEER_USE_SPARTICUZ === "1") {
    // Activar en Railway si hace falta:
    //   npm i puppeteer-core @sparticuz/chromium
    // y descomentar. Se deja documentado para no agregar deps todavía.
    throw new Error(
      "PUPPETEER_USE_SPARTICUZ=1 pero la rama @sparticuz/chromium no está habilitada. " +
        "Instalá puppeteer-core + @sparticuz/chromium y habilitá esta rama en lib/pdf/browser.ts.",
    );
    // const chromium = (await import("@sparticuz/chromium")).default;
    // const puppeteerCore = await import("puppeteer-core");
    // return puppeteerCore.launch({
    //   args: chromium.args,
    //   executablePath: await chromium.executablePath(),
    //   headless: true,
    // });
  }

  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
}
