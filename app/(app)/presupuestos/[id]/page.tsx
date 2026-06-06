import Link from "next/link";
import { notFound } from "next/navigation";
import { getPresupuestoForRender } from "@/lib/presupuesto-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegeneratePresupuesto } from "@/components/regenerate-presupuesto";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deletePresupuesto } from "@/app/(app)/presupuestos/actions";
import { formatARS, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PresupuestoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getPresupuestoForRender(params.id);
  if (!data) notFound();
  const p = await prisma.presupuesto.findUnique({ where: { id: params.id } });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Presupuesto {data.numero}</h1>
          <p className="text-muted-foreground">
            {data.clienteNombre} · {formatDate(data.fecha)} · Total{" "}
            <span className="font-medium">{formatARS(data.total)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Volver</Link>
          </Button>
          {p?.pdfUrl && (
            <Button asChild>
              <a href={p.pdfUrl} download={`presupuesto-${data.numero}.pdf`}>
                Descargar PDF
              </a>
            </Button>
          )}
          <ConfirmDelete action={deletePresupuesto.bind(null, data.id)} />
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Vista previa</CardTitle>
          <RegeneratePresupuesto id={data.id} current={data.templateId} />
        </CardHeader>
        <CardContent>
          {p?.pdfUrl ? (
            <iframe
              src={p.pdfUrl}
              className="h-[80vh] w-full rounded-md border"
              title={`Presupuesto ${data.numero}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              El PDF todavía no se generó. Probá regenerar con una plantilla.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
