import { notFound } from "next/navigation";
import { getFacturaForRender } from "@/lib/factura-data";
import { FacturaPortada } from "@/components/templates/factura-portada";
import { generateAfipQrDataUrl } from "@/lib/afip-qr";

export const dynamic = "force-dynamic";

export default async function RenderFacturaPortadaPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getFacturaForRender(params.id);
  if (!data) notFound();

  const qrDataUrl = await generateAfipQrDataUrl({
    fecha: data.fechaComprobante,
    cuitEmisor: data.tenant.cuit,
    nroComprobante: data.nroComprobante,
    codComprobante: data.codComprobante,
    total: data.total,
    clienteCuit: data.clienteCuit,
    cae: data.cae,
  });

  return <FacturaPortada data={data} qrDataUrl={qrDataUrl} />;
}
