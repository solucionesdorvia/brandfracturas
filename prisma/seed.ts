import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

// Replica de hashPassword (lib/password.ts) en versión síncrona para el seed,
// así el seed no depende del alias "@/..." de Next.
function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

async function main() {
  // --- BrandProfile de ejemplo (tenant inicial) ---
  const nombre = "Estudio Dorvia";
  let tenant = await prisma.brandProfile.findFirst({ where: { nombre } });
  if (!tenant) {
    tenant = await prisma.brandProfile.create({
      data: {
        nombre,
        logoUrl: null,
        colorPrimary: "#1f2937",
        colorSecondary: "#ffffff",
        colorAccent: "#c9a84c",
        fontFamily: "Inter",
        razonSocial: "Dorvia Soluciones S.A.S.",
        cuit: "30-71000000-7",
        domicilio: "Av. Corrientes 1234, CABA, Argentina",
        condicionIVA: "Responsable Inscripto",
        iibb: "901-123456-7",
        contactoEmail: "solucionesdorvia@gmail.com",
        contactoTel: "+54 11 5555-5555",
        contactoWeb: "www.dorvia.com.ar",
      },
    });
    console.log(`✓ BrandProfile creado: ${tenant.id} (${tenant.nombre})`);
  } else {
    console.log(`• BrandProfile ya existe: ${tenant.id} (${tenant.nombre})`);
  }

  // --- Usuario único ---
  const email = process.env.SEED_USER_EMAIL ?? "prueba@ger.com";
  const password = process.env.SEED_USER_PASSWORD ?? "prueba123";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, password: hashPassword(password), name: "pruebager" },
    });
    console.log(`✓ Usuario creado: ${email} / ${password}`);
  } else {
    console.log(`• Usuario ya existe: ${email}`);
  }

  console.log("\nDEFAULT_TENANT_ID sugerido para .env:");
  console.log(tenant.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
