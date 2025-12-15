-- Agregar customerId a Solicitud
ALTER TABLE "Solicitud" ADD COLUMN "customerId" TEXT;

-- Agregar customerId a Document
ALTER TABLE "Document" ADD COLUMN "customerId" TEXT;

-- Agregar customerId a Appointment
ALTER TABLE "Appointment" ADD COLUMN "customerId" TEXT;

-- Agregar customerId a Note
ALTER TABLE "Note" ADD COLUMN "customerId" TEXT;

-- Crear índices
CREATE INDEX IF NOT EXISTS "Solicitud_customerId_idx" ON "Solicitud"("customerId");
CREATE INDEX IF NOT EXISTS "Document_customerId_idx" ON "Document"("customerId");
