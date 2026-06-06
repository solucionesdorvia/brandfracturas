import type { Browser } from "puppeteer";

// Singleton de Chromium reutilizable entre renders (más rápido y estable que
// lanzar un browser por PDF). Sobrevive el hot-reload de dev vía globalThis y
// se relanza solo si el proceso se cae o se desconecta.
const globalForBrowser = globalThis as unknown as {
  __brandedBrowser?: Browser;
  __brandedBrowserLaunching?: Promise<Browser>;
};

async function launch(): Promise<Browser> {
  if (process.env.PUPPETEER_USE_SPARTICUZ === "1") {
    // Railway / serverless: activar @sparticuz/chromium.
    //   npm i puppeteer-core @sparticuz/chromium
    // Import dinámico con webpackIgnore para no bundlear ni romper el build
    // cuando los paquetes no están instalados (local).
    const chromiumPkg = ["@sparticuz", "chromium"].join("/");
    const corePkg = ["puppeteer", "core"].join("-");
    const chromium = (await import(/* webpackIgnore: true */ chromiumPkg)).default;
    const puppeteerCore = await import(/* webpackIgnore: true */ corePkg);
    return puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = (await import("puppeteer")).default;
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // evita crashes por /dev/shm chico (docker/CI)
      "--disable-gpu",
    ],
  });
}

export async function getBrowser(): Promise<Browser> {
  const existing = globalForBrowser.__brandedBrowser;
  if (existing && existing.connected) return existing;

  // Si otra llamada ya está lanzando, esperamos esa misma promesa.
  if (globalForBrowser.__brandedBrowserLaunching) {
    return globalForBrowser.__brandedBrowserLaunching;
  }

  const p = launch()
    .then((browser) => {
      globalForBrowser.__brandedBrowser = browser;
      browser.on("disconnected", () => {
        if (globalForBrowser.__brandedBrowser === browser) {
          globalForBrowser.__brandedBrowser = undefined;
        }
      });
      return browser;
    })
    .finally(() => {
      globalForBrowser.__brandedBrowserLaunching = undefined;
    });

  globalForBrowser.__brandedBrowserLaunching = p;
  return p;
}
