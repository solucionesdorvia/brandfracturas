import { z } from "zod";

const hex = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/, "Color hex inválido (ej. #1f2937)");

// Tipografías web-safe que renderizan consistente en Chromium (Puppeteer) sin
// depender de cargar fuentes externas.
export const FONT_OPTIONS = [
  { value: "Helvetica Neue, Arial, sans-serif", label: "Helvética / Arial (sans)" },
  { value: "system-ui, Segoe UI, Roboto, sans-serif", label: "Sans moderna (sistema)" },
  { value: "Georgia, Times New Roman, serif", label: "Georgia (serif)" },
  { value: "Times New Roman, serif", label: "Times (serif)" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana (sans)" },
] as const;

export const brandingSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre requerido"),
  razonSocial: z.string().trim().min(1, "Razón social requerida"),
  cuit: z.string().trim().min(1, "CUIT requerido"),
  domicilio: z.string().trim().min(1, "Domicilio requerido"),
  condicionIVA: z.string().trim().min(1, "Condición IVA requerida"),
  iibb: z.string().trim().optional(),
  contactoEmail: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  contactoTel: z.string().trim().optional(),
  contactoWeb: z.string().trim().optional(),
  colorPrimary: hex,
  colorSecondary: hex,
  colorAccent: hex,
  fontFamily: z.string().trim().min(1, "Tipografía requerida"),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
