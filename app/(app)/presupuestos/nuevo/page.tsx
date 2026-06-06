import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/tenant";
import { PresupuestoForm } from "@/components/presupuesto-form";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage() {
  const [count, tenant] = await Promise.all([
    prisma.presupuesto.count(),
    getDefaultTenant(),
  ]);
  const year = new Date().getFullYear();
  const defaultNumero = `P-${year}-${String(count + 1).padStart(4, "0")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Nuevo presupuesto</h1>
        <p className="text-muted-foreground">
          Completá los datos, elegí plantilla y generá el PDF branded.
        </p>
      </div>
      <PresupuestoForm
        defaultNumero={defaultNumero}
        brandPrimary={tenant.colorPrimary}
        brandAccent={tenant.colorAccent}
      />
    </div>
  );
}
