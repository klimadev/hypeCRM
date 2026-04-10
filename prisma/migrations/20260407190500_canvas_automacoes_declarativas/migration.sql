-- AlterTable
ALTER TABLE "Automacao" ADD COLUMN "editor_modelo" TEXT NOT NULL DEFAULT 'LEGACY';
ALTER TABLE "Automacao" ADD COLUMN "rascunho_grafo_json" TEXT;
ALTER TABLE "Automacao" ADD COLUMN "versao_publicada_id" TEXT;

-- CreateTable
CREATE TABLE "AutomacaoVersao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_automacao" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "grafo_json" TEXT NOT NULL,
    "trigger_principal" TEXT NOT NULL,
    "publicado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomacaoVersao_id_automacao_fkey" FOREIGN KEY ("id_automacao") REFERENCES "Automacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomacaoExecucao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_automacao" TEXT NOT NULL,
    "id_versao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "trigger_tipo" TEXT NOT NULL,
    "contexto_ref_tipo" TEXT,
    "contexto_ref_id" TEXT,
    "log_resumido_json" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomacaoExecucao_id_automacao_fkey" FOREIGN KEY ("id_automacao") REFERENCES "Automacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutomacaoExecucao_id_versao_fkey" FOREIGN KEY ("id_versao") REFERENCES "AutomacaoVersao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Automacao_versao_publicada_id_idx" ON "Automacao"("versao_publicada_id");

-- CreateIndex
CREATE UNIQUE INDEX "AutomacaoVersao_id_automacao_numero_key" ON "AutomacaoVersao"("id_automacao", "numero");

-- CreateIndex
CREATE INDEX "AutomacaoVersao_id_automacao_publicado_em_idx" ON "AutomacaoVersao"("id_automacao", "publicado_em");

-- CreateIndex
CREATE INDEX "AutomacaoExecucao_id_automacao_criado_em_idx" ON "AutomacaoExecucao"("id_automacao", "criado_em");

-- CreateIndex
CREATE INDEX "AutomacaoExecucao_id_versao_idx" ON "AutomacaoExecucao"("id_versao");

-- CreateIndex
CREATE INDEX "AutomacaoExecucao_status_criado_em_idx" ON "AutomacaoExecucao"("status", "criado_em");
