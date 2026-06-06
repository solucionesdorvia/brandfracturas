"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getDefaultTenantId } from "@/lib/tenant";
import { storage } from "@/lib/storage";
import { brandingSchema } from "@/lib/validations/branding";

export type BrandingResult =
  | { ok: true }
  | { ok: false; error: string };

const LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export async function updateBranding(
  formData: FormData,
): Promise<BrandingResult> {
  const parsed = brandingSchema.safeParse({
    nombre: formData.get("nombre"),
    razonSocial: formData.get("razonSocial"),
    cuit: formData.get("cuit"),
    domicilio: formData.get("domicilio"),
    condicionIVA: formData.get("condicionIVA"),
    iibb: formData.get("iibb"),
    contactoEmail: formData.get("contactoEmail"),
    contactoTel: formData.get("contactoTel"),
    contactoWeb: formData.get("contactoWeb"),
    colorPrimary: formData.get("colorPrimary"),
    colorSecondary: formData.get("colorSecondary"),
    colorAccent: formData.get("colorAccent"),
    fontFamily: formData.get("fontFamily"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const tenantId = await getDefaultTenantId();
  const data = parsed.data;

  // Logo opcional: si subieron un archivo de imagen, lo guardamos.
  let logoUrl: string | undefined;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const ext = LOGO_TYPES[file.type];
    if (!ext) {
      return { ok: false, error: "El logo debe ser PNG, JPG, SVG o WebP." };
    }
    if (file.size > 3 * 1024 * 1024) {
      return { ok: false, error: "El logo no puede superar 3 MB." };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `branding/logo-${randomUUID()}.${ext}`;
    logoUrl = await storage.put(key, buffer, file.type);
  }

  // Si pidieron quitar el logo.
  const removeLogo = formData.get("removeLogo") === "1";

  try {
    await prisma.brandProfile.update({
      where: { id: tenantId },
      data: {
        nombre: data.nombre,
        razonSocial: data.razonSocial,
        cuit: data.cuit,
        domicilio: data.domicilio,
        condicionIVA: data.condicionIVA,
        iibb: data.iibb || null,
        contactoEmail: data.contactoEmail || null,
        contactoTel: data.contactoTel || null,
        contactoWeb: data.contactoWeb || null,
        colorPrimary: data.colorPrimary,
        colorSecondary: data.colorSecondary,
        colorAccent: data.colorAccent,
        fontFamily: data.fontFamily,
        ...(logoUrl ? { logoUrl } : removeLogo ? { logoUrl: null } : {}),
      },
    });
  } catch (e) {
    console.error(e);
    return { ok: false, error: "No se pudo guardar la identidad." };
  }

  revalidatePath("/identidad");
  revalidatePath("/dashboard");
  return { ok: true };
}
