import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDefaultTenant } from "@/lib/tenant";

export default async function DashboardPage() {
  const tenant = await getDefaultTenant();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Marca activa: <span className="font-medium">{tenant.nombre}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Presupuestos</CardTitle>
            <CardDescription>
              Generá un presupuesto branded desde plantilla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/presupuestos/nuevo">Nuevo presupuesto</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Facturas</CardTitle>
            <CardDescription>
              Subí una factura legal y agregale una portada de marca.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/facturas/nueva">Nueva factura</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        El listado e historial se completa en la fase 6.
      </p>
    </div>
  );
}
