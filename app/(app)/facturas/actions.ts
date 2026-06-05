"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultTenantId } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { generateFacturaBrandedPdf } from "@/lib/pdf";
import { facturaPortadaSchema } from "@/lib/validations/factura";

export type FacturaActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createFactura(
  formData: FormData,
): Promise<FacturaActionResult> {
  // 1) Validar los datos de la portada.
  const parsed = facturaPortadaSchema.safeParse({
    nroComprobante: formData.get("nroComprobante"),
    fechaComprobante: formData.get("fechaComprobante"),
    total: formData.get("total"),
    clienteNombre: formData.get("clienteNombre"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // 2) Validar el archivo subido (debe ser un PDF real).
  const file = formData.get("archivo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Subí el PDF de la factura." };
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.subarray(0, 5).toString() !== "%PDF-") {
    return { ok: false, error: "El archivo no es un PDF válido." };
  }

  const tenantId = await getDefaultTenantId();

  // 3) Guardar el PDF ORIGINAL tal cual (nunca se modifica).
  const originalKey = `facturas/originals/${randomUUID()}.pdf`;
  const originalUrl = await storage.put(originalKey, buffer, "application/pdf");

  // 4) Crear el registro.
  let facturaId: string;
  try {
    const created = await prisma.facturaUpload.create({
      data: {
        tenantId,
        archivoOriginalUrl: originalUrl,
        nroComprobante: parsed.data.nroComprobante,
        fechaComprobante: parsed.data.fechaComprobante,
        total: parsed.data.total,
        clienteNombre: parsed.data.clienteNombre,
        estado: "uploaded",
      },
    });
    facturaId = created.id;
  } catch (e) {
    console.error(e);
    return { ok: false, error: "No se pudo guardar la factura." };
  }

  // 5) Generar portada + merge [portada, original]. Original intacto en 2+.
  try {
    await generateFacturaBrandedPdf(facturaId);
  } catch (e) {
    console.error("Error generando branded:", e);
    return { ok: false, error: "Se guardó la factura pero falló la portada. Reintentá." };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: facturaId };
}

export async function regenerateFactura(id: string): Promise<void> {
  await generateFacturaBrandedPdf(id);
  revalidatePath(`/facturas/${id}`);
  redirect(`/facturas/${id}`);
}
