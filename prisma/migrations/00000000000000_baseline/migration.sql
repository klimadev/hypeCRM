-- CreateTable
CREATE TABLE "AuditoriaEquipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_funcionario_alvo" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "campo" TEXT,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "observacao" TEXT,
    "autor_tipo" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Automacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_criador" TEXT,
    "nome" TEXT NOT NULL,
    "fonte" TEXT NOT NULL,
    "gatilho" TEXT NOT NULL,
    "config_json" TEXT NOT NULL DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_sync_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomacaoAcao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_automacao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "delay_minutos" INTEGER NOT NULL DEFAULT 0,
    "id_instancia_whatsapp" TEXT,
    "telefone_destino" TEXT,
    "id_lead_destino" TEXT,
    "mensagem" TEXT NOT NULL,
    FOREIGN KEY ("id_instancia_whatsapp") REFERENCES "WhatsappInstancia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_automacao") REFERENCES "Automacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomacaoAgendamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_automacao" TEXT NOT NULL,
    "id_lead" TEXT,
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
    "id_negocio" TEXT,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("id_automacao") REFERENCES "Automacao" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalComInstancia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_criador" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "profile_name" TEXT,
    "profile_email" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_assinatura" TEXT NOT NULL DEFAULT 'TRIAL',
    "trial_inicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trial_fim" DATETIME,
    "assinatura_inicio" DATETIME,
    "assinatura_fim" DATETIME,
    "plano" TEXT NOT NULL DEFAULT 'trial'
);

-- CreateTable
CREATE TABLE "EstagioFunil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_funil" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "ordem" BIGINT NOT NULL,
    "tipo" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_funil") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Funcionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_pdv" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inativado_em" DATETIME,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_pdv") REFERENCES "Pdv" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Funil" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_funcionario" TEXT NOT NULL,
    "id_estagio" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "valor_oportunidade" REAL NOT NULL DEFAULT 0,
    "probabilidade" REAL NOT NULL DEFAULT 0.5,
    "fonte" TEXT,
    "empresa_origem" TEXT,
    "observacoes" TEXT,
    "motivo_perda" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origem" TEXT NOT NULL DEFAULT 'MANUAL',
    "dados_extras" TEXT,
    "anuncio_descricao" TEXT,
    "anuncio_titulo" TEXT,
    "anuncio_url" TEXT,
    "email" TEXT,
    "id_pdv" TEXT,
    "id_negocio" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_estagio") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadEstagioLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_lead" TEXT NOT NULL,
    "id_estagio_anterior" TEXT,
    "id_estagio_novo" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LeadProduto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "id_produto" TEXT NOT NULL,
    "nome_snapshot" TEXT NOT NULL,
    "schema_snapshot" TEXT NOT NULL,
    "valores_layout" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_produto") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tipo_meta" TEXT NOT NULL,
    "alvo" REAL NOT NULL,
    "periodo" TEXT NOT NULL,
    "data_inicio" DATETIME NOT NULL,
    "data_fim" DATETIME NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_pdv" TEXT,
    "id_funcionario" TEXT,
    FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_pdv") REFERENCES "Pdv" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetaProgresso" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_meta" TEXT NOT NULL,
    "id_empresa" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "realizado" REAL NOT NULL,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_meta") REFERENCES "Meta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Negocio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT,
    "id_funil" TEXT NOT NULL,
    "id_estagio" TEXT NOT NULL,
    "id_funcionario" TEXT NOT NULL,
    "id_produto_principal" TEXT,
    "titulo" TEXT NOT NULL,
    "valor_estimado" REAL NOT NULL DEFAULT 0,
    "valor_fechado" REAL,
    "probabilidade" REAL,
    "status" TEXT NOT NULL DEFAULT 'ABERTO',
    "data_abertura" DATETIME NOT NULL,
    "data_fechamento" DATETIME,
    "motivo_perda" TEXT,
    "observacoes_comerciais" TEXT,
    "chave_migracao" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_produto_principal") REFERENCES "Produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_estagio") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_funil") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NegocioEstagioLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_negocio" TEXT NOT NULL,
    "id_funil_anterior" TEXT,
    "id_funil_novo" TEXT NOT NULL,
    "id_estagio_anterior" TEXT,
    "id_estagio_novo" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "origem" TEXT NOT NULL DEFAULT 'KANBAN',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_estagio_novo") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_estagio_anterior") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_funil_novo") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_funil_anterior") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NegocioProduto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_negocio" TEXT NOT NULL,
    "id_produto" TEXT NOT NULL,
    "nome_snapshot" TEXT NOT NULL,
    "schema_snapshot" TEXT NOT NULL,
    "valores_layout" TEXT NOT NULL,
    "observacoes" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_produto") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "numero_parcela" INTEGER NOT NULL,
    "quantidade_total" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "data_vencimento" DATETIME NOT NULL,
    "data_pagamento" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_negocio" TEXT,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pdv" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_whatsapp_instancia" TEXT,
    "nome" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_whatsapp_instancia") REFERENCES "WhatsappInstancia" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pendencia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "documento_url" TEXT,
    "resolvida" BOOLEAN NOT NULL DEFAULT false,
    "resolvida_em" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descricao" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "schema_layout" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReatribuicaoFuncionario" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_funcionario_origem" TEXT NOT NULL,
    "id_funcionario_destino" TEXT NOT NULL,
    "quantidade_leads" INTEGER NOT NULL,
    "observacao" TEXT,
    "criado_por_tipo" TEXT NOT NULL,
    "criado_por_id" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RegistroIP" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ip_address" TEXT NOT NULL,
    "email_hash" TEXT NOT NULL,
    "id_empresa" TEXT NOT NULL,
    "user_agent" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WhatsappInstancia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_criador" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "instance_name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "phone" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "profile_name" TEXT,
    "profile_pic" TEXT
);

-- CreateTable
CREATE TABLE "WhatsappMensagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_lead" TEXT NOT NULL,
    "id_whatsapp_instancia" TEXT NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "remote_jid" TEXT NOT NULL,
    "from_me" BOOLEAN NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "conteudo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" INTEGER NOT NULL,
    "lida_no_crm_em" DATETIME,
    "erro" TEXT,
    "payload_json" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("id_whatsapp_instancia") REFERENCES "WhatsappInstancia" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AuditoriaEquipe_acao_idx" ON "AuditoriaEquipe"("acao" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaEquipe_id_funcionario_alvo_idx" ON "AuditoriaEquipe"("id_funcionario_alvo" ASC);

-- CreateIndex
CREATE INDEX "AuditoriaEquipe_id_empresa_idx" ON "AuditoriaEquipe"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Automacao_id_empresa_idx" ON "Automacao"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Automacao_fonte_gatilho_idx" ON "Automacao"("fonte" ASC, "gatilho" ASC);

-- CreateIndex
CREATE INDEX "Automacao_id_empresa_ativo_idx" ON "Automacao"("id_empresa" ASC, "ativo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AutomacaoAcao_id_automacao_ordem_key" ON "AutomacaoAcao"("id_automacao" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAcao_id_instancia_whatsapp_idx" ON "AutomacaoAcao"("id_instancia_whatsapp" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAcao_id_automacao_idx" ON "AutomacaoAcao"("id_automacao" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAgendamento_id_negocio_idx" ON "AutomacaoAgendamento"("id_negocio" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAgendamento_id_lead_idx" ON "AutomacaoAgendamento"("id_lead" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAgendamento_id_automacao_idx" ON "AutomacaoAgendamento"("id_automacao" ASC);

-- CreateIndex
CREATE INDEX "AutomacaoAgendamento_status_agendado_para_idx" ON "AutomacaoAgendamento"("status" ASC, "agendado_para" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "AutomacaoAgendamento_referencia_uid_key" ON "AutomacaoAgendamento"("referencia_uid" ASC);

-- CreateIndex
CREATE INDEX "CalComInstancia_id_empresa_status_idx" ON "CalComInstancia"("id_empresa" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "CalComInstancia_id_empresa_idx" ON "CalComInstancia"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Empresa_email_key" ON "Empresa"("email" ASC);

-- CreateIndex
CREATE INDEX "EstagioFunil_id_funil_idx" ON "EstagioFunil"("id_funil" ASC);

-- CreateIndex
CREATE INDEX "EstagioFunil_id_empresa_idx" ON "EstagioFunil"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "EstagioFunil_id_funil_ordem_key" ON "EstagioFunil"("id_funil" ASC, "ordem" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_id_pdv_idx" ON "Funcionario"("id_pdv" ASC);

-- CreateIndex
CREATE INDEX "Funcionario_id_empresa_idx" ON "Funcionario"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Funcionario_email_key" ON "Funcionario"("email" ASC);

-- CreateIndex
CREATE INDEX "Funil_id_empresa_padrao_idx" ON "Funil"("id_empresa" ASC, "padrao" ASC);

-- CreateIndex
CREATE INDEX "Funil_id_empresa_idx" ON "Funil"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Funil_id_empresa_slug_key" ON "Funil"("id_empresa" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_empresa_ativo_idx" ON "Lead"("id_empresa" ASC, "ativo" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_negocio_idx" ON "Lead"("id_negocio" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_pdv_idx" ON "Lead"("id_pdv" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_empresa_email_idx" ON "Lead"("id_empresa" ASC, "email" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_estagio_idx" ON "Lead"("id_estagio" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_funcionario_idx" ON "Lead"("id_funcionario" ASC);

-- CreateIndex
CREATE INDEX "Lead_id_empresa_idx" ON "Lead"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "LeadEstagioLog_id_lead_idx" ON "LeadEstagioLog"("id_lead" ASC);

-- CreateIndex
CREATE INDEX "LeadEstagioLog_criado_em_idx" ON "LeadEstagioLog"("criado_em" ASC);

-- CreateIndex
CREATE INDEX "LeadEstagioLog_empresa_id_criado_em_idx" ON "LeadEstagioLog"("empresa_id" ASC, "criado_em" ASC);

-- CreateIndex
CREATE INDEX "LeadProduto_id_produto_idx" ON "LeadProduto"("id_produto" ASC);

-- CreateIndex
CREATE INDEX "LeadProduto_id_lead_idx" ON "LeadProduto"("id_lead" ASC);

-- CreateIndex
CREATE INDEX "LeadProduto_id_empresa_idx" ON "LeadProduto"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Meta_id_funcionario_idx" ON "Meta"("id_funcionario" ASC);

-- CreateIndex
CREATE INDEX "Meta_id_pdv_idx" ON "Meta"("id_pdv" ASC);

-- CreateIndex
CREATE INDEX "Meta_id_empresa_ativo_data_inicio_data_fim_idx" ON "Meta"("id_empresa" ASC, "ativo" ASC, "data_inicio" ASC, "data_fim" ASC);

-- CreateIndex
CREATE INDEX "Meta_id_empresa_tipo_ativo_idx" ON "Meta"("id_empresa" ASC, "tipo" ASC, "ativo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "MetaProgresso_id_meta_periodo_key" ON "MetaProgresso"("id_meta" ASC, "periodo" ASC);

-- CreateIndex
CREATE INDEX "MetaProgresso_id_empresa_periodo_idx" ON "MetaProgresso"("id_empresa" ASC, "periodo" ASC);

-- CreateIndex
CREATE INDEX "Negocio_id_lead_criado_em_idx" ON "Negocio"("id_lead" ASC, "criado_em" ASC);

-- CreateIndex
CREATE INDEX "Negocio_id_empresa_status_idx" ON "Negocio"("id_empresa" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Negocio_id_empresa_id_funil_id_estagio_idx" ON "Negocio"("id_empresa" ASC, "id_funil" ASC, "id_estagio" ASC);

-- CreateIndex
CREATE INDEX "Negocio_id_empresa_id_funcionario_idx" ON "Negocio"("id_empresa" ASC, "id_funcionario" ASC);

-- CreateIndex
CREATE INDEX "Negocio_id_empresa_id_lead_idx" ON "Negocio"("id_empresa" ASC, "id_lead" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Negocio_chave_migracao_key" ON "Negocio"("chave_migracao" ASC);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_Negocio_2" ON "Negocio"("chave_migracao" ASC);
Pragma writable_schema=0;

-- CreateIndex
CREATE INDEX "NegocioEstagioLog_id_negocio_idx" ON "NegocioEstagioLog"("id_negocio" ASC);

-- CreateIndex
CREATE INDEX "NegocioEstagioLog_criado_em_idx" ON "NegocioEstagioLog"("criado_em" ASC);

-- CreateIndex
CREATE INDEX "NegocioEstagioLog_empresa_id_criado_em_idx" ON "NegocioEstagioLog"("empresa_id" ASC, "criado_em" ASC);

-- CreateIndex
CREATE INDEX "NegocioProduto_id_produto_idx" ON "NegocioProduto"("id_produto" ASC);

-- CreateIndex
CREATE INDEX "NegocioProduto_id_negocio_idx" ON "NegocioProduto"("id_negocio" ASC);

-- CreateIndex
CREATE INDEX "NegocioProduto_id_empresa_idx" ON "NegocioProduto"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Parcela_id_negocio_idx" ON "Parcela"("id_negocio" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_id_lead_numero_parcela_key" ON "Parcela"("id_lead" ASC, "numero_parcela" ASC);

-- CreateIndex
CREATE INDEX "Parcela_id_empresa_data_vencimento_idx" ON "Parcela"("id_empresa" ASC, "data_vencimento" ASC);

-- CreateIndex
CREATE INDEX "Parcela_id_empresa_status_idx" ON "Parcela"("id_empresa" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "Parcela_id_lead_idx" ON "Parcela"("id_lead" ASC);

-- CreateIndex
CREATE INDEX "Parcela_id_empresa_idx" ON "Parcela"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Pdv_id_empresa_id_whatsapp_instancia_idx" ON "Pdv"("id_empresa" ASC, "id_whatsapp_instancia" ASC);

-- CreateIndex
CREATE INDEX "Pdv_id_empresa_idx" ON "Pdv"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "Pendencia_id_lead_idx" ON "Pendencia"("id_lead" ASC);

-- CreateIndex
CREATE INDEX "Pendencia_id_empresa_idx" ON "Pendencia"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Produto_id_empresa_slug_key" ON "Produto"("id_empresa" ASC, "slug" ASC);

-- CreateIndex
CREATE INDEX "Produto_id_empresa_ativo_idx" ON "Produto"("id_empresa" ASC, "ativo" ASC);

-- CreateIndex
CREATE INDEX "Produto_id_empresa_idx" ON "Produto"("id_empresa" ASC);

-- CreateIndex
CREATE INDEX "ReatribuicaoFuncionario_id_funcionario_destino_idx" ON "ReatribuicaoFuncionario"("id_funcionario_destino" ASC);

-- CreateIndex
CREATE INDEX "ReatribuicaoFuncionario_id_funcionario_origem_idx" ON "ReatribuicaoFuncionario"("id_funcionario_origem" ASC);

-- CreateIndex
CREATE INDEX "ReatribuicaoFuncionario_id_empresa_idx" ON "ReatribuicaoFuncionario"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "RegistroIP_ip_address_email_hash_key" ON "RegistroIP"("ip_address" ASC, "email_hash" ASC);

-- CreateIndex
CREATE INDEX "RegistroIP_criado_em_idx" ON "RegistroIP"("criado_em" ASC);

-- CreateIndex
CREATE INDEX "RegistroIP_email_hash_idx" ON "RegistroIP"("email_hash" ASC);

-- CreateIndex
CREATE INDEX "RegistroIP_ip_address_idx" ON "RegistroIP"("ip_address" ASC);

-- CreateIndex
CREATE INDEX "WhatsappInstancia_id_empresa_status_idx" ON "WhatsappInstancia"("id_empresa" ASC, "status" ASC);

-- CreateIndex
CREATE INDEX "WhatsappInstancia_id_empresa_instance_name_idx" ON "WhatsappInstancia"("id_empresa" ASC, "instance_name" ASC);

-- CreateIndex
CREATE INDEX "WhatsappInstancia_id_criador_idx" ON "WhatsappInstancia"("id_criador" ASC);

-- CreateIndex
CREATE INDEX "WhatsappInstancia_id_empresa_idx" ON "WhatsappInstancia"("id_empresa" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappInstancia_instance_name_key" ON "WhatsappInstancia"("instance_name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappMensagem_id_whatsapp_instancia_mensagem_id_key" ON "WhatsappMensagem"("id_whatsapp_instancia" ASC, "mensagem_id" ASC);

-- CreateIndex
CREATE INDEX "WhatsappMensagem_id_empresa_remote_jid_idx" ON "WhatsappMensagem"("id_empresa" ASC, "remote_jid" ASC);

-- CreateIndex
CREATE INDEX "WhatsappMensagem_id_empresa_id_lead_lida_no_crm_em_idx" ON "WhatsappMensagem"("id_empresa" ASC, "id_lead" ASC, "lida_no_crm_em" ASC);

-- CreateIndex
CREATE INDEX "WhatsappMensagem_id_empresa_id_lead_timestamp_idx" ON "WhatsappMensagem"("id_empresa" ASC, "id_lead" ASC, "timestamp" ASC);

