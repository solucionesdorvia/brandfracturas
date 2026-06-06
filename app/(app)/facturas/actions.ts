"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { generateFacturaBrandedPdf } from "@/lib/pdf";
import { extractFacturaData } from "@/lib/factura-extract";
import { extractQrFromPdf } from "@/lib/factura-qr";

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

  const tenant = await getDefaultTenant();
  const tenantId = tenant.id;

  // Guardar el PDF ORIGINAL tal cual (nunca se modifica).
  const originalKey = `facturas/originals/${randomUUID()}.pdf`;
  const originalUrl = await storage.put(originalKey, buffer, "application/pdf");

  // Extraer datos. Se le pasan los datos del emisor (la empresa) para EXCLUIRLOS:
  // así nunca se asigna el CUIT/razón social del vendedor como si fueran del cliente.
  let extraida;
  try {
    extraida = await extractFacturaData(buffer, {
      cuit: tenant.cuit,
      razonSocial: tenant.razonSocial,
      nombre: tenant.nombre,
    });
  } catch (e) {
    console.error("Error extrayendo datos:", e);
    extraida = undefined;
  }

  // Extraer el QR REAL del comprobante subido y guardarlo como imagen.
  let qrUrl: string | null = null;
  let qrText: string | null = null;
  try {
    const qr = await extractQrFromPdf(buffer);
    if (qr.qrPng) {
      const qrKey = `facturas/qr/${randomUUID()}.png`;
      qrUrl = await storage.put(qrKey, qr.qrPng, "image/png");
      qrText = qr.qrText ?? null;
    }
  } catch (e) {
    console.error("Error extrayendo QR:", e);
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
        clienteCuit: extraida?.clienteCuit ?? null,
        letra: extraida?.letra ?? null,
        codComprobante: extraida?.codComprobante ?? null,
        cae: extraida?.cae ?? null,
        caeVto: extraida?.caeVto ?? null,
        qrUrl,
        qrText,
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
    clienteCuit?: string;
    letra?: string;
    codComprobante?: string;
    cae?: string;
    caeVto?: string;
  },
): Promise<void> {
  const fecha = data.fechaComprobante ? new Date(data.fechaComprobante) : null;
  const caeVto = data.caeVto ? new Date(data.caeVto) : null;
  const total =
    data.total === "" || data.total == null ? null : Number(data.total);

  await prisma.facturaUpload.update({
    where: { id },
    data: {
      nroComprobante: data.nroComprobante || null,
      fechaComprobante: fecha && !isNaN(fecha.getTime()) ? fecha : null,
      total: total != null && !isNaN(total) ? total : null,
      clienteNombre: data.clienteNombre || null,
      clienteCuit: data.clienteCuit || null,
      letra: data.letra || null,
      codComprobante: data.codComprobante || null,
      cae: data.cae || null,
      caeVto: caeVto && !isNaN(caeVto.getTime()) ? caeVto : null,
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
