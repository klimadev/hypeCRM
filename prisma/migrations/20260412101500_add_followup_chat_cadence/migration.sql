-- CreateTable
CREATE TABLE "FollowUpTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "canal" TEXT NOT NULL DEFAULT 'whatsapp',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "permite_repeticao" BOOLEAN NOT NULL DEFAULT false,
    "max_ciclos" INTEGER NOT NULL DEFAULT 1,
    "pausar_se_responder" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FollowUpTemplateEtapa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_template" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "delay_minutos" INTEGER NOT NULL,
    "conteudo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUpTemplateEtapa_id_template_fkey" FOREIGN KEY ("id_template") REFERENCES "FollowUpTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FollowUpConversa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_template" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "instance_name" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "etapa_atual" INTEGER NOT NULL DEFAULT 0,
    "ciclo_atual" INTEGER NOT NULL DEFAULT 1,
    "ultima_saida_em" DATETIME,
    "ultima_resposta_em" DATETIME,
    "proximo_disparo_em" DATETIME,
    "motivo_pausa" TEXT,
    "motivo_encerramento" TEXT,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FollowUpConversa_id_template_fkey" FOREIGN KEY ("id_template") REFERENCES "FollowUpTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MensagemAgendada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT,
    "id_campanha_disparo" TEXT,
    "id_followup_conversa" TEXT,
    "instance_name" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "followup_etapa" INTEGER,
    "followup_ciclo" INTEGER,
    "agendado_para" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "enviado_em" DATETIME,
    "mensagem_id" TEXT,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensagemAgendada_id_campanha_disparo_fkey" FOREIGN KEY ("id_campanha_disparo") REFERENCES "CampanhaDisparoLead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MensagemAgendada_id_followup_conversa_fkey" FOREIGN KEY ("id_followup_conversa") REFERENCES "FollowUpConversa" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_MensagemAgendada" ("agendado_para", "atualizado_em", "conteudo", "criado_em", "criado_por", "enviado_em", "erro", "id", "id_campanha_disparo", "id_empresa", "id_lead", "instance_name", "mensagem_id", "remote_jid", "status", "tentativas", "tipo") SELECT "agendado_para", "atualizado_em", "conteudo", "criado_em", "criado_por", "enviado_em", "erro", "id", "id_campanha_disparo", "id_empresa", "id_lead", "instance_name", "mensagem_id", "remote_jid", "status", "tentativas", "tipo" FROM "MensagemAgendada";
DROP TABLE "MensagemAgendada";
ALTER TABLE "new_MensagemAgendada" RENAME TO "MensagemAgendada";
CREATE INDEX "MensagemAgendada_id_empresa_status_agendado_para_idx" ON "MensagemAgendada"("id_empresa", "status", "agendado_para");
CREATE INDEX "MensagemAgendada_instance_name_remote_jid_idx" ON "MensagemAgendada"("instance_name", "remote_jid");
CREATE INDEX "MensagemAgendada_status_agendado_para_idx" ON "MensagemAgendada"("status", "agendado_para");
CREATE INDEX "MensagemAgendada_id_campanha_disparo_status_idx" ON "MensagemAgendada"("id_campanha_disparo", "status");
CREATE INDEX "MensagemAgendada_id_followup_conversa_status_idx" ON "MensagemAgendada"("id_followup_conversa", "status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FollowUpTemplate_id_empresa_ativo_idx" ON "FollowUpTemplate"("id_empresa", "ativo");

-- CreateIndex
CREATE INDEX "FollowUpTemplate_id_empresa_criado_em_idx" ON "FollowUpTemplate"("id_empresa", "criado_em");

-- CreateIndex
CREATE INDEX "FollowUpTemplateEtapa_id_template_ativo_idx" ON "FollowUpTemplateEtapa"("id_template", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpTemplateEtapa_id_template_ordem_key" ON "FollowUpTemplateEtapa"("id_template", "ordem");

-- CreateIndex
CREATE INDEX "FollowUpConversa_id_empresa_status_proximo_disparo_em_idx" ON "FollowUpConversa"("id_empresa", "status", "proximo_disparo_em");

-- CreateIndex
CREATE INDEX "FollowUpConversa_id_empresa_instance_name_remote_jid_status_idx" ON "FollowUpConversa"("id_empresa", "instance_name", "remote_jid", "status");

-- CreateIndex
CREATE INDEX "FollowUpConversa_id_template_idx" ON "FollowUpConversa"("id_template");
