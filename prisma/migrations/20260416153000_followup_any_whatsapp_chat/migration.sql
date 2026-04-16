-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_FollowUpConversa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_template" TEXT NOT NULL,
    "id_lead" TEXT,
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

INSERT INTO "new_FollowUpConversa" ("atualizado_em", "ciclo_atual", "criado_em", "criado_por", "id", "id_empresa", "id_lead", "id_template", "instance_name", "motivo_encerramento", "motivo_pausa", "proximo_disparo_em", "remote_jid", "status", "etapa_atual", "ultima_resposta_em", "ultima_saida_em")
SELECT "atualizado_em", "ciclo_atual", "criado_em", "criado_por", "id", "id_empresa", "id_lead", "id_template", "instance_name", "motivo_encerramento", "motivo_pausa", "proximo_disparo_em", "remote_jid", "status", "etapa_atual", "ultima_resposta_em", "ultima_saida_em" FROM "FollowUpConversa";

DROP TABLE "FollowUpConversa";
ALTER TABLE "new_FollowUpConversa" RENAME TO "FollowUpConversa";
CREATE INDEX "FollowUpConversa_id_empresa_status_proximo_disparo_em_idx" ON "FollowUpConversa"("id_empresa", "status", "proximo_disparo_em");
CREATE INDEX "FollowUpConversa_id_empresa_instance_name_remote_jid_status_idx" ON "FollowUpConversa"("id_empresa", "instance_name", "remote_jid", "status");
CREATE INDEX "FollowUpConversa_id_template_idx" ON "FollowUpConversa"("id_template");

CREATE TABLE "new_WhatsappMensagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT,
    "id_whatsapp_instancia" TEXT NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "remote_jid_alt" TEXT,
    "from_me" BOOLEAN NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "conteudo" TEXT,
    "push_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" INTEGER NOT NULL,
    "lida_no_crm_em" DATETIME,
    "erro" TEXT,
    "payload_json" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WhatsappMensagem_id_whatsapp_instancia_fkey" FOREIGN KEY ("id_whatsapp_instancia") REFERENCES "WhatsappInstancia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WhatsappMensagem_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_WhatsappMensagem" ("atualizado_em", "conteudo", "criado_em", "erro", "from_me", "id", "id_empresa", "id_lead", "id_whatsapp_instancia", "lida_no_crm_em", "mensagem_id", "payload_json", "push_name", "remote_jid", "remote_jid_alt", "status", "timestamp", "tipo")
SELECT "atualizado_em", "conteudo", "criado_em", "erro", "from_me", "id", "id_empresa", CASE WHEN "id_lead" = 'sem-lead' THEN NULL ELSE "id_lead" END, "id_whatsapp_instancia", "lida_no_crm_em", "mensagem_id", "payload_json", "push_name", "remote_jid", "remote_jid_alt", "status", "timestamp", "tipo" FROM "WhatsappMensagem";

DROP TABLE "WhatsappMensagem";
ALTER TABLE "new_WhatsappMensagem" RENAME TO "WhatsappMensagem";
CREATE UNIQUE INDEX "WhatsappMensagem_id_whatsapp_instancia_mensagem_id_key" ON "WhatsappMensagem"("id_whatsapp_instancia", "mensagem_id");
CREATE INDEX "WhatsappMensagem_id_empresa_remote_jid_idx" ON "WhatsappMensagem"("id_empresa", "remote_jid");
CREATE INDEX "WhatsappMensagem_id_empresa_id_lead_lida_no_crm_em_idx" ON "WhatsappMensagem"("id_empresa", "id_lead", "lida_no_crm_em");
CREATE INDEX "WhatsappMensagem_id_empresa_id_lead_timestamp_idx" ON "WhatsappMensagem"("id_empresa", "id_lead", "timestamp");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
