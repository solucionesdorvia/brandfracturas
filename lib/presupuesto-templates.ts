// Registry de plantillas de presupuesto. Metadata compartida (sin React) para
// el selector, la validación y el render. Todas usan la marca (BrandProfile):
// logo, colores y tipografía.
export const PRESUPUESTO_TEMPLATES = [
  {
    id: "classic",
    label: "Corporativo",
    description: "Sobrio y formal, monocromático. Ideal para estudios e ingeniería.",
  },
  {
    id: "modern",
    label: "Membrete",
    description: "Banda superior con el color de tu marca. Presencia visual.",
  },
  {
    id: "minimal",
    label: "Minimalista",
    description: "Mucho aire, líneas finas y acento sutil. Look premium.",
  },
  {
    id: "lateral",
    label: "Lateral",
    description: "Barra lateral con tus datos y el detalle a la derecha.",
  },
] as const;

export type PresupuestoTemplateId =
  (typeof PRESUPUESTO_TEMPLATES)[number]["id"];

export const PRESUPUESTO_TEMPLATE_IDS = PRESUPUESTO_TEMPLATES.map(
  (t) => t.id,
) as [PresupuestoTemplateId, ...PresupuestoTemplateId[]];

export function templateLabel(id: string): string {
  return PRESUPUESTO_TEMPLATES.find((t) => t.id === id)?.label ?? id;
}
