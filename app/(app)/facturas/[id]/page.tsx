import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacturaForRender } from "@/lib/factura-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateFactura } from "@/components/regenerate-factura";
import { EditFacturaData } from "@/components/edit-factura-data";
import { ConfirmDelete } from "@/components/confirm-delete";
import { deleteFactura } from "@/app/(app)/facturas/actions";
import { formatARS, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default async function FacturaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getFacturaForRender(params.id);
  if (!data) notFound();

  const faltantes = [
    !data.clienteNombre && "cliente",
    !data.nroComprobante && "nº de comprobante",
    !data.fechaComprobante && "fecha",
    data.total == null && "total",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            Factura {data.nroComprobante ?? data.id.slice(0, 8)}
          </h1>
          <p className="text-muted-foreground">
            {data.clienteNombre ?? "—"}
            {data.fechaComprobante ? ` · ${formatDate(data.fechaComprobante)}` : ""}
            {data.total != null ? ` · ${formatARS(data.total)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard">Volver</Link>
          </Button>
          <Button asChild variant="outline">
            <a href={data.archivoOriginalUrl} target="_blank" rel="noreferrer">
              Ver original
            </a>
          </Button>
          {data.archivoBrandedUrl && (
            <Button asChild>
              <a
                href={data.archivoBrandedUrl}
                download={`factura-branded-${data.nroComprobante ?? data.id}.pdf`}
              >
                Descargar branded
              </a>
            </Button>
          )}
          <ConfirmDelete action={deleteFactura.bind(null, data.id)} />
        </div>
      </div>

      {faltantes.length > 0 && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          No se pudieron leer automáticamente: {faltantes.join(", ")}. Usá
          “Corregir datos” para completarlos y regenerar la portada.
        </div>
      )}

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Datos del comprobante (lectura automática)
            </CardTitle>
            <div className="flex items-center gap-2">
              <EditFacturaData
                id={data.id}
                initial={{
                  nroComprobante: data.nroComprobante ?? "",
                  fechaComprobante: toDateInput(data.fechaComprobante),
                  total: data.total != null ? String(data.total) : "",
                  clienteNombre: data.clienteNombre ?? "",
                  clienteCuit: data.clienteCuit ?? "",
                  letra: data.letra ?? "",
                  codComprobante: data.codComprobante ?? "",
                  cae: data.cae ?? "",
                  caeVto: toDateInput(data.caeVto),
                }}
              />
              <RegenerateFactura id={data.id} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.archivoBrandedUrl ? (
            <iframe
              src={data.archivoBrandedUrl}
              className="h-[80vh] w-full rounded-md border"
              title={`Factura ${data.nroComprobante ?? data.id}`}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Todavía no se generó el PDF branded. Probá regenerar la portada.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            La hoja 1 es la portada de marca. El comprobante legal original se
            conserva sin modificaciones en las hojas siguientes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
