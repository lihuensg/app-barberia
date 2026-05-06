-- CreateTable
CREATE TABLE "turno_cancelaciones" (
    "id" SERIAL NOT NULL,
    "turno_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "nombre_cliente" TEXT,
    "email_cliente" TEXT,
    "telefono_cliente" TEXT,
    "fecha_hora_turno" TIMESTAMP(3) NOT NULL,
    "cancelado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelado_por" TEXT NOT NULL,
    "motivo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turno_cancelaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "turno_cancelaciones_turno_id_idx" ON "turno_cancelaciones"("turno_id");

-- CreateIndex
CREATE INDEX "turno_cancelaciones_usuario_id_idx" ON "turno_cancelaciones"("usuario_id");

-- CreateIndex
CREATE INDEX "turno_cancelaciones_cancelado_en_idx" ON "turno_cancelaciones"("cancelado_en");

-- CreateIndex
CREATE INDEX "turno_cancelaciones_fecha_hora_turno_idx" ON "turno_cancelaciones"("fecha_hora_turno");
