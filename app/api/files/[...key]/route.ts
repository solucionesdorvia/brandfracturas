import { NextResponse } from "next/server";
import { storage } from "@/lib/storage";

// Sirve archivos guardados por el Storage local. Las keys son cuids
// (no adivinables). Render pages (consumidas por Puppeteer) pueden referenciar
// assets desde acá sin sesión.
const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: { key: string[] } },
) {
  const key = params.key.join("/");
  const ext = key.slice(key.lastIndexOf(".")).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

  try {
    const buffer = await storage.get(key);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
