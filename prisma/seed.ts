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
  // Solo crea el usuario. La cuenta arranca SIN marca: el usuario crea su
  // primera marca al iniciar sesión (onboarding).
  const email = process.env.SEED_USER_EMAIL ?? "prueba@ger.com";
  const password = process.env.SEED_USER_PASSWORD ?? "prueba123";
  const name = process.env.SEED_USER_NAME ?? "Usuario";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    await prisma.user.create({
      data: { email, password: hashPassword(password), name },
    });
    console.log(`✓ Usuario creado: ${email} / ${password}`);
  } else {
    console.log(`• Usuario ya existe: ${email}`);
  }
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
