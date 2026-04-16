-- CreateTable
CREATE TABLE "MetaCapiEvento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_negocio" TEXT,
    "evento_nome" TEXT NOT NULL,
    "evento_status" TEXT NOT NULL,
    "idempotency_key" TEXT NOT NULL,
    "telefone_hash" TEXT,
    "payload_json" TEXT NOT NULL,
    "resposta_json" TEXT,
    "erro" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enviado_em" DATETIME,
    "ciclo_fechamento" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE INDEX "MetaCapiEvento_id_empresa_idx" ON "MetaCapiEvento"("id_empresa");

-- CreateIndex
CREATE INDEX "MetaCapiEvento_criado_em_idx" ON "MetaCapiEvento"("criado_em");