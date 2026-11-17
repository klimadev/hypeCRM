-- Additive schema parity for models that were present in schema.prisma but absent from migration history.

CREATE TABLE IF NOT EXISTS "MetaCapiConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "pixel_id" TEXT,
    "access_token" TEXT,
    "event_name" TEXT NOT NULL DEFAULT 'lead_closed',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaCapiConfig_id_empresa_key" ON "MetaCapiConfig"("id_empresa");

CREATE TABLE IF NOT EXISTS "MetaLeadAdsConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "page_tokens" TEXT NOT NULL DEFAULT '[]',
    "campo_mapping" TEXT DEFAULT '{}',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "intervalo_min" INTEGER NOT NULL DEFAULT 5,
    "ultima_sync" DATETIME,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaLeadAdsConfig_id_empresa_key" ON "MetaLeadAdsConfig"("id_empresa");

CREATE TABLE IF NOT EXISTS "MetaLeadAdsLead" (
    "id" TEXT NOT NULL,
    "id_empresa" TEXT NOT NULL,
    "id_lead_crm" TEXT,
    "page_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "ad_id" TEXT,
    "dados_brutos" TEXT NOT NULL,
    "sincronizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "MetaLeadAdsLead_id_empresa_id_key" ON "MetaLeadAdsLead"("id_empresa", "id");
CREATE INDEX IF NOT EXISTS "MetaLeadAdsLead_id_empresa_id_lead_crm_idx" ON "MetaLeadAdsLead"("id_empresa", "id_lead_crm");

CREATE TABLE IF NOT EXISTS "FeedbackItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_usuario" TEXT NOT NULL,
    "perfil_usuario" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "impacto" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NOVO',
    "prioridade" TEXT NOT NULL DEFAULT 'MEDIA',
    "rota_origem" TEXT,
    "modulo_origem" TEXT,
    "url_origem" TEXT,
    "viewport" TEXT,
    "user_agent" TEXT,
    "build_ref" TEXT,
    "nota_interna" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FeedbackItem_id_empresa_status_idx" ON "FeedbackItem"("id_empresa", "status");
CREATE INDEX IF NOT EXISTS "FeedbackItem_id_empresa_tipo_idx" ON "FeedbackItem"("id_empresa", "tipo");
CREATE INDEX IF NOT EXISTS "FeedbackItem_id_empresa_criado_em_idx" ON "FeedbackItem"("id_empresa", "criado_em");
CREATE INDEX IF NOT EXISTS "FeedbackItem_status_idx" ON "FeedbackItem"("status");

CREATE TABLE IF NOT EXISTS "FeedbackEvento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_feedback" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "autor_tipo" TEXT NOT NULL,
    "de_status" TEXT,
    "para_status" TEXT,
    "meta_json" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedbackEvento_id_feedback_fkey" FOREIGN KEY ("id_feedback") REFERENCES "FeedbackItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "FeedbackEvento_id_feedback_criado_em_idx" ON "FeedbackEvento"("id_feedback", "criado_em");

CREATE TABLE IF NOT EXISTS "CampanhaDisparoLead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "mensagem_template" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AGENDADA',
    "inicio_em" DATETIME NOT NULL,
    "delay_min_segundos" INTEGER NOT NULL DEFAULT 120,
    "delay_max_segundos" INTEGER NOT NULL DEFAULT 240,
    "jitter_ms_max" INTEGER NOT NULL DEFAULT 999,
    "selecionados_total" INTEGER NOT NULL DEFAULT 0,
    "elegiveis_total" INTEGER NOT NULL DEFAULT 0,
    "ignorados_total" INTEGER NOT NULL DEFAULT 0,
    "duracao_estimada_segundos" INTEGER NOT NULL DEFAULT 0,
    "filtros_snapshot_json" TEXT NOT NULL DEFAULT '{}',
    "configuracao_pdvs_json" TEXT NOT NULL DEFAULT '{}',
    "resumo_inelegiveis_json" TEXT NOT NULL DEFAULT '[]',
    "ultimo_agendamento_em" DATETIME,
    "finalizada_em" DATETIME,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CampanhaDisparoLead_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CampanhaDisparoLead_id_empresa_criado_em_idx" ON "CampanhaDisparoLead"("id_empresa", "criado_em");
CREATE INDEX IF NOT EXISTS "CampanhaDisparoLead_id_empresa_status_idx" ON "CampanhaDisparoLead"("id_empresa", "status");
