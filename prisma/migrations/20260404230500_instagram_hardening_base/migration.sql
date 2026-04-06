-- CreateTable
CREATE TABLE "InstagramMensagem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "id_empresa" TEXT NOT NULL,
    "id_instagram_conta" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "mensagem_id" TEXT NOT NULL,
    "participant_id" TEXT,
    "participant_name" TEXT,
    "participant_username" TEXT,
    "from_me" BOOLEAN NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'text',
    "conteudo" TEXT,
    "timestamp" INTEGER NOT NULL,
    "payload_json" TEXT,
    "erro" TEXT,
    "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InstagramMensagem_id_instagram_conta_fkey" FOREIGN KEY ("id_instagram_conta") REFERENCES "InstagramConta" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InstagramMensagem_id_instagram_conta_mensagem_id_key" ON "InstagramMensagem"("id_instagram_conta", "mensagem_id");

-- CreateIndex
CREATE INDEX "InstagramMensagem_id_empresa_conversation_id_timestamp_idx" ON "InstagramMensagem"("id_empresa", "conversation_id", "timestamp");

-- CreateIndex
CREATE INDEX "InstagramMensagem_id_empresa_participant_username_idx" ON "InstagramMensagem"("id_empresa", "participant_username");

-- CreateIndex
CREATE INDEX "InstagramMensagem_id_instagram_conta_conversation_id_idx" ON "InstagramMensagem"("id_instagram_conta", "conversation_id");
