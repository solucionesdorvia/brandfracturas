-- AlterTable
ALTER TABLE "FacturaUpload" ADD COLUMN     "cae" TEXT,
ADD COLUMN     "caeVto" TIMESTAMP(3),
ADD COLUMN     "clienteCuit" TEXT,
ADD COLUMN     "codComprobante" TEXT,
ADD COLUMN     "letra" TEXT;
