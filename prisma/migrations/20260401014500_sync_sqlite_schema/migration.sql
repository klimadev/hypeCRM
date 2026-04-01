-- AlterTable
ALTER TABLE "WhatsappMensagem" ADD COLUMN "push_name" TEXT;
ALTER TABLE "WhatsappMensagem" ADD COLUMN "remote_jid_alt" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "Meta";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE IF EXISTS "MetaProgresso";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "InstagramConta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_criador" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instagram_user_id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "account_type" TEXT,
    "profile_picture_url" TEXT,
    "access_token" TEXT NOT NULL,
    "token_type" TEXT,
    "escopos" TEXT,
    "expires_at" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AutomacaoAgendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_automacao" TEXT NOT NULL,
    "id_lead" TEXT,
    "id_negocio" TEXT,
    "referencia_uid" TEXT NOT NULL,
    "tipo_origem" TEXT NOT NULL,
    "contexto_json" TEXT NOT NULL DEFAULT '{}',
    "agendado_para" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "enviado_em" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomacaoAgendamento_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutomacaoAgendamento_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutomacaoAgendamento_id_automacao_fkey" FOREIGN KEY ("id_automacao") REFERENCES "Automacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AutomacaoAgendamento" ("agendado_para", "atualizado_em", "contexto_json", "criado_em", "enviado_em", "erro", "id", "id_automacao", "id_lead", "id_negocio", "referencia_uid", "status", "tentativas", "tipo_origem") SELECT "agendado_para", "atualizado_em", "contexto_json", "criado_em", "enviado_em", "erro", "id", "id_automacao", "id_lead", "id_negocio", "referencia_uid", "status", "tentativas", "tipo_origem" FROM "AutomacaoAgendamento";
DROP TABLE "AutomacaoAgendamento";
ALTER TABLE "new_AutomacaoAgendamento" RENAME TO "AutomacaoAgendamento";
CREATE UNIQUE INDEX "AutomacaoAgendamento_referencia_uid_key" ON "AutomacaoAgendamento"("referencia_uid");
CREATE INDEX "AutomacaoAgendamento_id_lead_idx" ON "AutomacaoAgendamento"("id_lead");
CREATE INDEX "AutomacaoAgendamento_id_negocio_idx" ON "AutomacaoAgendamento"("id_negocio");
CREATE INDEX "AutomacaoAgendamento_id_automacao_idx" ON "AutomacaoAgendamento"("id_automacao");
CREATE INDEX "AutomacaoAgendamento_status_agendado_para_idx" ON "AutomacaoAgendamento"("status", "agendado_para");
CREATE TABLE "new_Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_funcionario" TEXT NOT NULL,
    "id_pdv" TEXT,
    "id_negocio" TEXT,
    "id_estagio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "valor_oportunidade" REAL NOT NULL DEFAULT 0,
    "probabilidade" REAL NOT NULL DEFAULT 0.5,
    "fonte" TEXT,
    "empresa_origem" TEXT,
    "observacoes" TEXT,
    "motivo_perda" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',
    "anuncio_titulo" TEXT,
    "anuncio_descricao" TEXT,
    "anuncio_url" TEXT,
    "dados_extras" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Lead_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Lead_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_id_estagio_fkey" FOREIGN KEY ("id_estagio") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Lead" ("anuncio_descricao", "anuncio_titulo", "anuncio_url", "ativo", "atualizado_em", "criado_em", "dados_extras", "email", "empresa_origem", "fonte", "id", "id_empresa", "id_estagio", "id_funcionario", "id_negocio", "id_pdv", "motivo_perda", "nome", "observacoes", "origem", "probabilidade", "telefone", "valor_oportunidade") SELECT "anuncio_descricao", "anuncio_titulo", "anuncio_url", "ativo", "atualizado_em", "criado_em", "dados_extras", "email", "empresa_origem", "fonte", "id", "id_empresa", "id_estagio", "id_funcionario", "id_negocio", "id_pdv", "motivo_perda", "nome", "observacoes", "origem", "probabilidade", "telefone", "valor_oportunidade" FROM "Lead";
DROP TABLE "Lead";
ALTER TABLE "new_Lead" RENAME TO "Lead";
CREATE INDEX "Lead_id_empresa_email_idx" ON "Lead"("id_empresa", "email");
CREATE INDEX "Lead_id_estagio_idx" ON "Lead"("id_estagio");
CREATE INDEX "Lead_id_funcionario_idx" ON "Lead"("id_funcionario");
CREATE INDEX "Lead_id_pdv_idx" ON "Lead"("id_pdv");
CREATE INDEX "Lead_id_negocio_idx" ON "Lead"("id_negocio");
CREATE INDEX "Lead_id_empresa_idx" ON "Lead"("id_empresa");
CREATE INDEX "Lead_id_empresa_ativo_idx" ON "Lead"("id_empresa", "ativo");
CREATE TABLE "new_NegocioEstagioLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_negocio" TEXT NOT NULL,
    "id_funil_anterior" TEXT,
    "id_funil_novo" TEXT NOT NULL,
    "id_estagio_anterior" TEXT,
    "id_estagio_novo" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'KANBAN',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NegocioEstagioLog_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "NegocioEstagioLog_id_funil_anterior_fkey" FOREIGN KEY ("id_funil_anterior") REFERENCES "Funil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NegocioEstagioLog_id_funil_novo_fkey" FOREIGN KEY ("id_funil_novo") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "NegocioEstagioLog_id_estagio_anterior_fkey" FOREIGN KEY ("id_estagio_anterior") REFERENCES "EstagioFunil" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NegocioEstagioLog_id_estagio_novo_fkey" FOREIGN KEY ("id_estagio_novo") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_NegocioEstagioLog" ("criado_em", "empresa_id", "id", "id_estagio_anterior", "id_estagio_novo", "id_funil_anterior", "id_funil_novo", "id_negocio", "origem") SELECT "criado_em", "empresa_id", "id", "id_estagio_anterior", "id_estagio_novo", "id_funil_anterior", "id_funil_novo", "id_negocio", "origem" FROM "NegocioEstagioLog";
DROP TABLE "NegocioEstagioLog";
ALTER TABLE "new_NegocioEstagioLog" RENAME TO "NegocioEstagioLog";
CREATE INDEX "NegocioEstagioLog_empresa_id_criado_em_idx" ON "NegocioEstagioLog"("empresa_id", "criado_em");
CREATE INDEX "NegocioEstagioLog_criado_em_idx" ON "NegocioEstagioLog"("criado_em");
CREATE INDEX "NegocioEstagioLog_id_negocio_idx" ON "NegocioEstagioLog"("id_negocio");
CREATE TABLE "new_Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "id_negocio" TEXT,
    "numero_parcela" INTEGER NOT NULL,
    "quantidade_total" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "data_pagamento" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Parcela_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Parcela_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Parcela_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Parcela" ("atualizado_em", "criado_em", "data_pagamento", "data_vencimento", "id", "id_empresa", "id_lead", "id_negocio", "numero_parcela", "quantidade_total", "status", "valor") SELECT "atualizado_em", "criado_em", "data_pagamento", "data_vencimento", "id", "id_empresa", "id_lead", "id_negocio", "numero_parcela", "quantidade_total", "status", "valor" FROM "Parcela";
DROP TABLE "Parcela";
ALTER TABLE "new_Parcela" RENAME TO "Parcela";
CREATE INDEX "Parcela_id_empresa_data_vencimento_idx" ON "Parcela"("id_empresa", "data_vencimento");
CREATE INDEX "Parcela_id_empresa_status_idx" ON "Parcela"("id_empresa", "status");
CREATE INDEX "Parcela_id_lead_idx" ON "Parcela"("id_lead");
CREATE INDEX "Parcela_id_negocio_idx" ON "Parcela"("id_negocio");
CREATE INDEX "Parcela_id_empresa_idx" ON "Parcela"("id_empresa");
CREATE UNIQUE INDEX "Parcela_id_lead_numero_parcela_key" ON "Parcela"("id_lead", "numero_parcela");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "InstagramConta_id_empresa_status_idx" ON "InstagramConta"("id_empresa", "status");

-- CreateIndex
CREATE INDEX "InstagramConta_id_empresa_idx" ON "InstagramConta"("id_empresa");

-- CreateIndex
CREATE UNIQUE INDEX "InstagramConta_id_empresa_instagram_user_id_key" ON "InstagramConta"("id_empresa", "instagram_user_id");
