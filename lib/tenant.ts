import { prisma } from "@/lib/db";

// MVP: un solo tenant. Toda la lógica cuelga de tenantId para escalar después.
// Por ahora resolvemos el tenant por env (DEFAULT_TENANT_ID) o el primer
// BrandProfile que exista en la base.
export async function getDefaultTenant() {
  const envId = process.env.DEFAULT_TENANT_ID;
  if (envId) {
    const byId = await prisma.brandProfile.findUnique({ where: { id: envId } });
    if (byId) return byId;
  }
  const first = await prisma.brandProfile.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (!first) {
    throw new Error(
      "No hay BrandProfile. Corré `npm run db:seed` para crear el tenant inicial.",
    );
  }
  return first;
}

export async function getDefaultTenantId(): Promise<string> {
  const tenant = await getDefaultTenant();
  return tenant.id;
}
