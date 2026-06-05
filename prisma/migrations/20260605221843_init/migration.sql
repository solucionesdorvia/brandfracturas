-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logoUrl" TEXT,
    "colorPrimary" TEXT NOT NULL DEFAULT '#000000',
    "colorSecondary" TEXT NOT NULL DEFAULT '#ffffff',
    "colorAccent" TEXT NOT NULL DEFAULT '#c9a84c',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "domicilio" TEXT NOT NULL,
    "condicionIVA" TEXT NOT NULL,
    "iibb" TEXT,
    "contactoEmail" TEXT,
    "contactoTel" TEXT,
    "contactoWeb" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Presupuesto" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validezDias" INTEGER NOT NULL DEFAULT 15,
    "clienteNombre" TEXT NOT NULL,
    "clienteDatos" JSONB,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "ivaInformativo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "condiciones" TEXT,
    "notas" TEXT,
    "templateId" TEXT NOT NULL DEFAULT 'classic',
    "estado" TEXT NOT NULL DEFAULT 'draft',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Presupuesto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresupuestoItem" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "precioUnit" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PresupuestoItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacturaUpload" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "archivoOriginalUrl" TEXT NOT NULL,
    "nroComprobante" TEXT,
    "fechaComprobante" TIMESTAMP(3),
    "total" DECIMAL(12,2),
    "clienteNombre" TEXT,
    "archivoBrandedUrl" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'uploaded',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacturaUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Presupuesto" ADD CONSTRAINT "Presupuesto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PresupuestoItem" ADD CONSTRAINT "PresupuestoItem_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "Presupuesto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacturaUpload" ADD CONSTRAINT "FacturaUpload_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
