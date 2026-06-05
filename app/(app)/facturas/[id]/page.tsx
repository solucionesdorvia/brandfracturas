import Link from "next/link";
import { notFound } from "next/navigation";
import { getFacturaForRender } from "@/lib/factura-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegenerateFactura } from "@/components/regenerate-factura";
import { formatARS, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function FacturaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getFacturaForRender(params.id);
  if (!data) notFound();

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
        </div>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">
            Vista previa (portada + factura original)
          </CardTitle>
          <RegenerateFactura id={data.id} />
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
