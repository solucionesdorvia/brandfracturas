import { prisma } from "@/lib/db";

export async function getFacturaForRender(id: string) {
  const f = await prisma.facturaUpload.findUnique({
    where: { id },
    include: { tenant: true },
  });
  if (!f) return null;
  return {
    id: f.id,
    nroComprobante: f.nroComprobante,
    fechaComprobante: f.fechaComprobante,
    total: f.total ? Number(f.total) : null,
    clienteNombre: f.clienteNombre,
    archivoOriginalUrl: f.archivoOriginalUrl,
    archivoBrandedUrl: f.archivoBrandedUrl,
    estado: f.estado,
    tenant: f.tenant,
  };
}

export type FacturaRenderData = NonNullable<
  Awaited<ReturnType<typeof getFacturaForRender>>
>;
