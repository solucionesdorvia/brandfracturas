import { notFound } from "next/navigation";
import { getPresupuestoForRender } from "@/lib/presupuesto-data";
import { PresupuestoClassic } from "@/components/templates/presupuesto-classic";
import { PresupuestoModern } from "@/components/templates/presupuesto-modern";
import { PresupuestoMinimal } from "@/components/templates/presupuesto-minimal";
import { PresupuestoLateral } from "@/components/templates/presupuesto-lateral";

export const dynamic = "force-dynamic";

const TEMPLATES = {
  classic: PresupuestoClassic,
  modern: PresupuestoModern,
  minimal: PresupuestoMinimal,
  lateral: PresupuestoLateral,
} as const;

export default async function RenderPresupuestoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { template?: string };
}) {
  const data = await getPresupuestoForRender(params.id);
  if (!data) notFound();

  const id = (searchParams.template ?? data.templateId ?? "classic") as keyof typeof TEMPLATES;
  const Template = TEMPLATES[id] ?? PresupuestoClassic;
  return <Template data={data} />;
}
