import { FacturaForm } from "@/components/factura-form";

export const dynamic = "force-dynamic";

export default function NuevaFacturaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nueva factura</h1>
        <p className="text-muted-foreground">
          Subí la factura legal ya emitida. La app lee los datos del comprobante
          y genera la portada de marca automáticamente.
        </p>
      </div>
      <FacturaForm />
    </div>
  );
}
