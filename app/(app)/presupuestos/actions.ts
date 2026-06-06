"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultTenantId } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { generatePresupuestoPdf } from "@/lib/pdf";
import {
  presupuestoSchema,
  computeTotals,
  type PresupuestoInput,
} from "@/lib/validations/presupuesto";

export type ActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function createPresupuesto(
  raw: PresupuestoInput,
): Promise<ActionResult> {
  const parsed = presupuestoSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = parsed.data;
  const tenantId = await getDefaultTenantId();
  const { lineItems, subtotal, ivaInformativo, total } = computeTotals(
    data.items,
    data.ivaPct,
  );

  const clienteDatos = {
    email: data.clienteEmail || undefined,
    tel: data.clienteTel || undefined,
    direccion: data.clienteDireccion || undefined,
    cuit: data.clienteCuit || undefined,
  };

  let presupuestoId: string;
  try {
    const created = await prisma.presupuesto.create({
      data: {
        tenantId,
        numero: data.numero,
        fecha: data.fecha ?? new Date(),
        validezDias: data.validezDias,
        clienteNombre: data.clienteNombre,
        clienteDatos,
        subtotal,
        ivaInformativo,
        total,
        condiciones: data.condiciones || null,
        notas: data.notas || null,
        templateId: data.templateId,
        estado: "draft",
        items: {
          create: lineItems.map((it) => ({
            descripcion: it.descripcion,
            cantidad: it.cantidad,
            precioUnit: it.precioUnit,
            subtotal: it.subtotal,
          })),
        },
      },
    });
    presupuestoId = created.id;
  } catch (e) {
    console.error(e);
    return { ok: false, error: "No se pudo guardar el presupuesto." };
  }

  // Genera el PDF branded (Puppeteer → storage → pdfUrl). Si falla, el
  // presupuesto queda en draft y se puede regenerar desde el detalle.
  try {
    await generatePresupuestoPdf(presupuestoId);
  } catch (e) {
    console.error("Error generando PDF:", e);
  }

  revalidatePath("/dashboard");
  return { ok: true, id: presupuestoId };
}

export async function regeneratePresupuesto(
  id: string,
  templateId: "classic" | "modern",
): Promise<void> {
  await prisma.presupuesto.update({ where: { id }, data: { templateId } });
  try {
    await generatePresupuestoPdf(id);
  } catch (e) {
    console.error("regeneratePresupuesto/generate:", e);
  }
  revalidatePath(`/presupuestos/${id}`);
  redirect(`/presupuestos/${id}`);
}

export async function deletePresupuesto(id: string): Promise<void> {
  const p = await prisma.presupuesto.findUnique({ where: { id } });
  if (p) {
    const key = p.pdfUrl?.replace(/^\/api\/files\//, "");
    if (key) await storage.delete(key).catch(() => {});
    // items se borran por onDelete: Cascade
    await prisma.presupuesto.delete({ where: { id } });
  }
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
