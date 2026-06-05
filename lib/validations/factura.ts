import { z } from "zod";

export const facturaPortadaSchema = z.object({
  nroComprobante: z.string().trim().min(1, "Nº de comprobante requerido"),
  fechaComprobante: z.coerce.date({ message: "Fecha inválida" }),
  total: z.coerce.number().min(0, "Total inválido"),
  clienteNombre: z.string().trim().min(1, "Cliente requerido"),
});

export type FacturaPortadaInput = z.infer<typeof facturaPortadaSchema>;
