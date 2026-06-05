import { prisma } from "@/lib/db";

// Carga un presupuesto con items + tenant y normaliza los Decimal a number,
// para pasarlo como props serializables a las plantillas de render.
export async function getPresupuestoForRender(id: string) {
  const p = await prisma.presupuesto.findUnique({
    where: { id },
    include: { items: true, tenant: true },
  });
  if (!p) return null;

  const cliente = (p.clienteDatos ?? {}) as {
    email?: string;
    tel?: string;
    direccion?: string;
    cuit?: string;
  };

  return {
    id: p.id,
    numero: p.numero,
    fecha: p.fecha,
    validezDias: p.validezDias,
    clienteNombre: p.clienteNombre,
    cliente,
    subtotal: Number(p.subtotal),
    ivaInformativo: Number(p.ivaInformativo),
    total: Number(p.total),
    condiciones: p.condiciones,
    notas: p.notas,
    templateId: p.templateId,
    items: p.items.map((it) => ({
      id: it.id,
      descripcion: it.descripcion,
      cantidad: Number(it.cantidad),
      precioUnit: Number(it.precioUnit),
      subtotal: Number(it.subtotal),
    })),
    tenant: p.tenant,
  };
}

export type PresupuestoRenderData = NonNullable<
  Awaited<ReturnType<typeof getPresupuestoForRender>>
>;
