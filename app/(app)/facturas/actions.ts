"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultTenantId } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { generateFacturaBrandedPdf } from "@/lib/pdf";
import { extractFacturaData } from "@/lib/factura-extract";

export type FacturaActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Subida automática: solo el PDF. La app extrae cliente/nº/fecha/total de las
// etiquetas AFIP, crea el registro y genera la portada branded sin formulario.
export async function createFactura(
  formData: FormData,
): Promise<FacturaActionResult> {
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Subí el PDF de la factura." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    return { ok: false, error: "El archivo no es un PDF válido." };
  }

  const tenantId = await getDefaultTenantId();

  // Guardar el PDF ORIGINAL tal cual (nunca se modifica).
  const originalKey = `facturas/originals/${randomUUID()}.pdf`;
  const originalUrl = await storage.put(originalKey, buffer, "application/pdf");

  // Extraer datos (best-effort; lo que no se detecta queda null y se corrige).
  let extraida;
  try {
    extraida = await extractFacturaData(buffer);
  } catch (e) {
    console.error("Error extrayendo datos:", e);
    extraida = undefined;
  }

  let facturaId: string;
  try {
    const created = await prisma.facturaUpload.create({
      data: {
        tenantId,
        archivoOriginalUrl: originalUrl,
        nroComprobante: extraida?.nroComprobante ?? null,
        fechaComprobante: extraida?.fechaComprobante ?? null,
        total: extraida?.total ?? null,
        clienteNombre: extraida?.clienteNombre ?? null,
        estado: "uploaded",
      },
    });
    facturaId = created.id;
  } catch (e) {
    console.error(e);
    return { ok: false, error: "No se pudo guardar la factura." };
  }

  // Generar portada + merge [portada, original]. Original intacto en 2+.
  try {
    await generateFacturaBrandedPdf(facturaId);
  } catch (e) {
    console.error("Error generando branded:", e);
    return { ok: false, error: "Se guardó la factura pero falló la portada. Reintentá." };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: facturaId };
}

// Corrección manual de los datos extraídos + regeneración de la portada.
export async function updateFacturaData(
  id: string,
  data: {
    nroComprobante?: string;
    fechaComprobante?: string;
    total?: number | string;
    clienteNombre?: string;
  },
): Promise<void> {
  const fecha = data.fechaComprobante ? new Date(data.fechaComprobante) : null;
  const total =
    data.total === "" || data.total == null ? null : Number(data.total);

  await prisma.facturaUpload.update({
    where: { id },
    data: {
      nroComprobante: data.nroComprobante || null,
      fechaComprobante: fecha && !isNaN(fecha.getTime()) ? fecha : null,
      total: total != null && !isNaN(total) ? total : null,
      clienteNombre: data.clienteNombre || null,
    },
  });
  await generateFacturaBrandedPdf(id);
  revalidatePath(`/facturas/${id}`);
  redirect(`/facturas/${id}`);
}

export async function regenerateFactura(id: string): Promise<void> {
  await generateFacturaBrandedPdf(id);
  revalidatePath(`/facturas/${id}`);
  redirect(`/facturas/${id}`);
}
