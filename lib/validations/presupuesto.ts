import { z } from "zod";

export const presupuestoItemSchema = z.object({
  descripcion: z.string().trim().min(1, "Descripción requerida"),
  cantidad: z.coerce.number().positive("Cantidad debe ser > 0"),
  precioUnit: z.coerce.number().min(0, "Precio inválido"),
});

export const presupuestoSchema = z.object({
  numero: z.string().trim().min(1, "Número requerido"),
  fecha: z.coerce.date().optional(),
  validezDias: z.coerce.number().int().min(1).default(15),
  clienteNombre: z.string().trim().min(1, "Cliente requerido"),
  clienteEmail: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  clienteTel: z.string().trim().optional(),
  clienteDireccion: z.string().trim().optional(),
  clienteCuit: z.string().trim().optional(),
  items: z.array(presupuestoItemSchema).min(1, "Agregá al menos un ítem"),
  ivaPct: z.coerce.number().min(0).max(100).default(21),
  condiciones: z.string().trim().optional(),
  notas: z.string().trim().optional(),
  templateId: z.enum(["classic", "modern"]).default("classic"),
});

export type PresupuestoInput = z.infer<typeof presupuestoSchema>;
export type PresupuestoItemInput = z.infer<typeof presupuestoItemSchema>;

/** Calcula subtotales por ítem, subtotal general, IVA informativo y total. */
export function computeTotals<T extends { cantidad: number; precioUnit: number }>(
  items: T[],
  ivaPct: number,
) {
  const lineItems = items.map((it) => ({
    ...it,
    subtotal: round2(it.cantidad * it.precioUnit),
  }));
  const subtotal = round2(lineItems.reduce((acc, it) => acc + it.subtotal, 0));
  const ivaInformativo = round2((subtotal * ivaPct) / 100);
  const total = round2(subtotal + ivaInformativo);
  return { lineItems, subtotal, ivaInformativo, total };
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
