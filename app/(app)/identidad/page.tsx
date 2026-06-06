import { getDefaultTenant } from "@/lib/tenant";
import { BrandingForm } from "@/components/branding-form";

export const dynamic = "force-dynamic";

export default async function IdentidadPage() {
  const t = await getDefaultTenant();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Identidad</h1>
        <p className="text-muted-foreground">
          Logo, paleta de colores, tipografía y datos del emisor. Todo esto se
          aplica automáticamente a los presupuestos y portadas de factura.
        </p>
      </div>
      <BrandingForm
        brand={{
          nombre: t.nombre,
          razonSocial: t.razonSocial,
          cuit: t.cuit,
          domicilio: t.domicilio,
          condicionIVA: t.condicionIVA,
          iibb: t.iibb,
          contactoEmail: t.contactoEmail,
          contactoTel: t.contactoTel,
          contactoWeb: t.contactoWeb,
          colorPrimary: t.colorPrimary,
          colorSecondary: t.colorSecondary,
          colorAccent: t.colorAccent,
          fontFamily: t.fontFamily,
          logoUrl: t.logoUrl,
        }}
      />
    </div>
  );
}
