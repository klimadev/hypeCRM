-- CreateTable
CREATE TABLE "MensagemAtalho" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tags_json" TEXT NOT NULL DEFAULT '[]',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" TEXT NOT NULL,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "MensagemAtalho_id_empresa_slug_key" ON "MensagemAtalho"("id_empresa", "slug");

-- CreateIndex
CREATE INDEX "MensagemAtalho_id_empresa_ativo_idx" ON "MensagemAtalho"("id_empresa", "ativo");

-- CreateIndex
CREATE INDEX "MensagemAtalho_id_empresa_criado_em_idx" ON "MensagemAtalho"("id_empresa", "criado_em");
