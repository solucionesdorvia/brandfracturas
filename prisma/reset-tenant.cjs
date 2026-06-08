// Reset controlado por flag: si RESET_TENANT=1, borra facturas, presupuestos y
// marcas (para dejar la cuenta en 0). Se ejecuta al arranque del contenedor,
// usando la conexión interna a la base. No-op si el flag no está en "1".
const { PrismaClient } = require("@prisma/client");

(async () => {
  if (process.env.RESET_TENANT !== "1") {
    return;
  }
  const prisma = new PrismaClient();
  try {
    const f = await prisma.facturaUpload.deleteMany({});
    const p = await prisma.presupuesto.deleteMany({});
    const m = await prisma.brandProfile.deleteMany({});
    console.log(
      `[reset-tenant] borrados -> facturas:${f.count} presupuestos:${p.count} marcas:${m.count}`,
    );
  } catch (e) {
    console.error("[reset-tenant] error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
