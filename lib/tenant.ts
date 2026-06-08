import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

// MVP: una sola marca (BrandProfile) por cuenta. Si todavía no existe, el
// usuario debe crearla (onboarding). Preparado para multi-marca: todo cuelga
// de tenantId.

// Devuelve la marca activa o null si la cuenta todavía no creó ninguna.
export async function getTenant() {
  const envId = process.env.DEFAULT_TENANT_ID;
  if (envId) {
    const byId = await prisma.brandProfile.findUnique({ where: { id: envId } });
    if (byId) return byId;
  }
  return prisma.brandProfile.findFirst({ orderBy: { createdAt: "asc" } });
}

// Para páginas que requieren marca: si no hay, manda a crearla.
export async function requireTenant() {
  const t = await getTenant();
  if (!t) redirect("/identidad");
  return t;
}

// Para acciones internas que solo corren cuando ya existe marca.
export async function getDefaultTenant() {
  const t = await getTenant();
  if (!t) throw new Error("No hay marca creada todavía.");
  return t;
}

export async function getDefaultTenantId(): Promise<string> {
  return (await getDefaultTenant()).id;
}
