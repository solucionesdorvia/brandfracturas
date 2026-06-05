import { prisma } from "@/lib/db";
import { PresupuestoForm } from "@/components/presupuesto-form";

export const dynamic = "force-dynamic";

export default async function NuevoPresupuestoPage() {
  const count = await prisma.presupuesto.count();
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
      <PresupuestoForm defaultNumero={defaultNumero} />
    </div>
  );
}
