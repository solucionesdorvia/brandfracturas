import { notFound } from "next/navigation";
import { getPresupuestoForRender } from "@/lib/presupuesto-data";
import { PresupuestoClassic } from "@/components/templates/presupuesto-classic";
import { PresupuestoModern } from "@/components/templates/presupuesto-modern";

export const dynamic = "force-dynamic";

export default async function RenderPresupuestoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  const data = await getPresupuestoForRender(params.id);
  if (!data) notFound();

  const template = searchParams.template ?? data.templateId ?? "classic";

  return template === "modern" ? (
    <PresupuestoModern data={data} />
  ) : (
    <PresupuestoClassic data={data} />
  );
}
