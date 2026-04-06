-- CreateTable
CREATE TABLE "MensagemAgendada" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT,
    "instance_name" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "agendado_para" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "erro" TEXT,
    "enviado_em" DATETIME,
    "mensagem_id" TEXT,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "MensagemAgendada_id_empresa_status_agendado_para_idx" ON "MensagemAgendada"("id_empresa", "status", "agendado_para");

-- CreateIndex
CREATE INDEX "MensagemAgendada_instance_name_remote_jid_idx" ON "MensagemAgendada"("instance_name", "remote_jid");

-- CreateIndex
CREATE INDEX "MensagemAgendada_status_agendado_para_idx" ON "MensagemAgendada"("status", "agendado_para");
