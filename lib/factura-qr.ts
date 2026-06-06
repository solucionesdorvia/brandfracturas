import { PDFParse } from "pdf-parse";
import { PNG } from "pngjs";
import jsQR from "jsqr";

export type QrExtraido = {
  // PNG del QR real (dataUrl) extraído del comprobante subido.
  qrPng?: Buffer;
  // Contenido decodificado del QR (URL de AFIP).
  qrText?: string;
  // De dónde se obtuvo: imagen embebida o recorte del raster.
  fuente?: "imagen" | "raster";
};

function imageDataFromPng(pngBuf: Buffer) {
  const png = PNG.sync.read(pngBuf);
  return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height, png };
}

function isAfipQr(text: string): boolean {
  return /afip\.gob\.ar\/fe\/qr|\/fe\/qr\/?\?p=/i.test(text);
}

function bufFromDataUrl(dataUrl: string): Buffer {
  return Buffer.from(dataUrl.split(",")[1] ?? "", "base64");
}

// Extrae el QR REAL del PDF subido. Prioriza la imagen embebida del QR; si el
// QR está dibujado como vector, rasteriza la página y lo recorta.
export async function extractQrFromPdf(buffer: Buffer): Promise<QrExtraido> {
  // 1) Imágenes embebidas: decodificar cada una y quedarnos con la que es un QR.
  try {
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getImage({ imageDataUrl: true });
    let fallback: QrExtraido | null = null;
    for (const page of res.pages) {
      for (const im of page.images) {
        if (!im.dataUrl) continue;
        try {
          const png = bufFromDataUrl(im.dataUrl);
          const id = imageDataFromPng(png);
          const code = jsQR(id.data, id.width, id.height);
          if (code?.data) {
            const hit: QrExtraido = { qrPng: png, qrText: code.data, fuente: "imagen" };
            if (isAfipQr(code.data)) return hit;
            fallback = fallback ?? hit;
          }
        } catch {
          // imagen no decodificable como PNG/QR: seguir
        }
      }
    }
    if (fallback) return fallback;
  } catch {
    // sin imágenes embebidas: probar raster
  }

  // 2) Fallback: rasterizar las primeras páginas y localizar/recortar el QR.
  try {
    const parser = new PDFParse({ data: buffer });
    const res = await parser.getScreenshot({ imageDataUrl: true, desiredWidth: 1654, first: 2 });
    for (const pg of res.pages ?? []) {
      if (!pg.dataUrl) continue;
      const png = PNG.sync.read(bufFromDataUrl(pg.dataUrl));
      const code = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
      if (code?.data) {
        const cropped = cropQr(png, code.location);
        return { qrPng: cropped, qrText: code.data, fuente: "raster" };
      }
    }
  } catch {
    // nada
  }

  return {};
}

type Loc = {
  topLeftCorner: { x: number; y: number };
  topRightCorner: { x: number; y: number };
  bottomLeftCorner: { x: number; y: number };
  bottomRightCorner: { x: number; y: number };
};

function cropQr(png: PNG, loc: Loc): Buffer {
  const xs = [
    loc.topLeftCorner.x,
    loc.topRightCorner.x,
    loc.bottomLeftCorner.x,
    loc.bottomRightCorner.x,
  ];
  const ys = [
    loc.topLeftCorner.y,
    loc.topRightCorner.y,
    loc.bottomLeftCorner.y,
    loc.bottomRightCorner.y,
  ];
  const pad = Math.round((Math.max(...xs) - Math.min(...xs)) * 0.08) + 4;
  const x = Math.max(0, Math.floor(Math.min(...xs) - pad));
  const y = Math.max(0, Math.floor(Math.min(...ys) - pad));
  const w = Math.min(png.width - x, Math.ceil(Math.max(...xs) - Math.min(...xs) + pad * 2));
  const h = Math.min(png.height - y, Math.ceil(Math.max(...ys) - Math.min(...ys) + pad * 2));
  const out = new PNG({ width: w, height: h });
  png.bitblt(out, x, y, w, h, 0, 0);
  return PNG.sync.write(out);
}
