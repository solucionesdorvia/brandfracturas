import { notFound } from "next/navigation";
import { getFacturaForRender } from "@/lib/factura-data";
import { FacturaPortada } from "@/components/templates/factura-portada";

export const dynamic = "force-dynamic";

export default async function RenderFacturaPortadaPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getFacturaForRender(params.id);
  if (!data) notFound();
  return <FacturaPortada data={data} />;
}
