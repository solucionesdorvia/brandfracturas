// Extrae una paleta (primario / secundario / acento) desde una imagen de logo,
// en el navegador (canvas), sin dependencias.
//
// - accent  = color más vibrante y frecuente del logo.
// - primary = color oscuro del logo (apto para banda con texto blanco); si no
//   hay uno suficientemente oscuro, se oscurece el dominante.
// - secondary = blanco (fondo de los documentos).

export type Palette = { primary: string; secondary: string; accent: string };

export async function extractPaletteFromImage(
  file: File,
): Promise<Palette | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();

    const W = 96;
    const H = Math.max(1, Math.round((img.height / img.width) * W)) || W;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    URL.revokeObjectURL(url);
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, W, H);
    const { data } = ctx.getImageData(0, 0, W, H);

    const buckets = new Map<string, { r: number; g: number; b: number; n: number }>();
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 125) continue; // ignorar transparente
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (r > 244 && g > 244 && b > 244) continue; // ignorar casi blanco (fondo)
      const key = `${r >> 4},${g >> 4},${b >> 4}`;
      const e = buckets.get(key) ?? { r: 0, g: 0, b: 0, n: 0 };
      e.r += r; e.g += g; e.b += b; e.n++;
      buckets.set(key, e);
    }
    if (buckets.size === 0) return null;

    const colors = Array.from(buckets.values()).map((e) => {
      const r = Math.round(e.r / e.n), g = Math.round(e.g / e.n), b = Math.round(e.b / e.n);
      const { s, l } = rgbToHsl(r, g, b);
      return { r, g, b, n: e.n, s, l };
    });
    const maxN = Math.max(...colors.map((c) => c.n));

    // accent: vibrante + frecuente
    const accent = [...colors].sort(
      (a, b) => b.s * Math.log(b.n + 1) - a.s * Math.log(a.n + 1),
    )[0];

    // primary: el más oscuro con frecuencia relevante; fallback al accent
    const primary =
      [...colors]
        .filter((c) => c.n >= maxN * 0.05)
        .sort((a, b) => a.l - b.l)[0] ?? accent;
    let pr = { r: primary.r, g: primary.g, b: primary.b };
    // garantizar contraste para texto blanco
    let guard = 0;
    while (relLuminance(pr.r, pr.g, pr.b) > 0.42 && guard++ < 12) {
      pr = { r: Math.round(pr.r * 0.82), g: Math.round(pr.g * 0.82), b: Math.round(pr.b * 0.82) };
    }

    return {
      primary: toHex(pr.r, pr.g, pr.b),
      secondary: "#ffffff",
      accent: toHex(accent.r, accent.g, accent.b),
    };
  } catch {
    return null;
  }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  }
  return { s, l };
}

function relLuminance(r: number, g: number, b: number) {
  const f = (c: number) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function toHex(r: number, g: number, b: number) {
  const h = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
