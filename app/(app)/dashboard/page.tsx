import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDefaultTenant } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatARS, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function EstadoBadge({ estado }: { estado: string }) {
  const generated = estado === "generated" || estado === "processed";
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
        (generated
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700")
      }
    >
      {estado}
    </span>
  );
}

export default async function DashboardPage() {
  const tenant = await getDefaultTenant();
  const [presupuestos, facturas] = await Promise.all([
    prisma.presupuesto.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.facturaUpload.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground">
            Marca activa: <span className="font-medium">{tenant.nombre}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/presupuestos/nuevo">Nuevo presupuesto</Link>
          </Button>
          <Button asChild>
            <Link href="/facturas/nueva">Nueva factura</Link>
          </Button>
        </div>
      </div>

      {/* Presupuestos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Presupuestos</CardTitle>
          <CardDescription>{presupuestos.length} en total</CardDescription>
        </CardHeader>
        <CardContent>
          {presupuestos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no generaste presupuestos.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Plantilla</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuestos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.numero}</TableCell>
                    <TableCell>{p.clienteNombre}</TableCell>
                    <TableCell>{formatDate(p.fecha)}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatARS(Number(p.total))}
                    </TableCell>
                    <TableCell className="capitalize">{p.templateId}</TableCell>
                    <TableCell>
                      <EstadoBadge estado={p.estado} />
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Link
                        href={`/presupuestos/${p.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ver
                      </Link>
                      {p.pdfUrl && (
                        <a
                          href={p.pdfUrl}
                          download={`presupuesto-${p.numero}.pdf`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Facturas</CardTitle>
          <CardDescription>{facturas.length} en total</CardDescription>
        </CardHeader>
        <CardContent>
          {facturas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavía no subiste facturas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Comprobante</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facturas.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">
                      {f.nroComprobante ?? f.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>{f.clienteNombre ?? "—"}</TableCell>
                    <TableCell>
                      {f.fechaComprobante ? formatDate(f.fechaComprobante) : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {f.total != null ? formatARS(Number(f.total)) : "—"}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={f.estado} />
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Link
                        href={`/facturas/${f.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Ver
                      </Link>
                      {f.archivoBrandedUrl && (
                        <a
                          href={f.archivoBrandedUrl}
                          download={`factura-branded-${f.nroComprobante ?? f.id}.pdf`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          Branded
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
