import { getTenant } from "@/lib/tenant";
import { BrandingForm } from "@/components/branding-form";
import { FONT_OPTIONS } from "@/lib/validations/branding";

export const dynamic = "force-dynamic";

export default async function IdentidadPage() {
  const t = await getTenant();
  const isNew = !t;

  const brand = {
    nombre: t?.nombre ?? "",
    razonSocial: t?.razonSocial ?? "",
    cuit: t?.cuit ?? "",
    domicilio: t?.domicilio ?? "",
    condicionIVA: t?.condicionIVA ?? "Responsable Inscripto",
    iibb: t?.iibb ?? null,
    contactoEmail: t?.contactoEmail ?? null,
    contactoTel: t?.contactoTel ?? null,
    contactoWeb: t?.contactoWeb ?? null,
    colorPrimary: t?.colorPrimary ?? "#1f2937",
    colorSecondary: t?.colorSecondary ?? "#ffffff",
    colorAccent: t?.colorAccent ?? "#2563eb",
    fontFamily: t?.fontFamily ?? FONT_OPTIONS[0].value,
    logoUrl: t?.logoUrl ?? null,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">
          {isNew ? "Creá tu marca" : "Identidad"}
        </h1>
        <p className="text-muted-foreground">
          {isNew
            ? "Cargá tu logo, colores y datos. Es lo primero para empezar a generar presupuestos y facturas con tu marca."
            : "Logo, paleta de colores, tipografía y datos del emisor. Todo esto se aplica automáticamente a los presupuestos y portadas de factura."}
        </p>
      </div>
      <BrandingForm brand={brand} isNew={isNew} />
    </div>
  );
}
