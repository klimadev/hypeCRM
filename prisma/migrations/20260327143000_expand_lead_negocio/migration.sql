PRAGMA foreign_keys=OFF;

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
  CONSTRAINT "Funil_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Funil_id_empresa_slug_key" ON "Funil"("id_empresa", "slug");
CREATE INDEX "Funil_id_empresa_idx" ON "Funil"("id_empresa");
CREATE INDEX "Funil_id_empresa_padrao_idx" ON "Funil"("id_empresa", "padrao");

INSERT INTO "Funil" ("id", "id_empresa", "nome", "slug", "descricao", "ativo", "padrao", "ordem", "criado_em", "atualizado_em")
SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))), 2) || '-' || substr('89ab', abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))), 2) || '-' || lower(hex(randomblob(6))),
       "id",
       'Funil principal',
       'funil-principal',
       'Funil padrao migrado automaticamente',
       1,
       1,
       0,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM "Empresa";

CREATE TABLE "new_EstagioFunil" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "id_empresa" TEXT NOT NULL,
  "id_funil" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "ordem" BIGINT NOT NULL,
  "tipo" TEXT NOT NULL,
  "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EstagioFunil_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "EstagioFunil_id_funil_fkey" FOREIGN KEY ("id_funil") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_EstagioFunil" ("id", "id_empresa", "id_funil", "nome", "ordem", "tipo", "criado_em", "atualizado_em")
SELECT e."id", e."id_empresa", f."id", e."nome", e."ordem", e."tipo", e."criado_em", e."atualizado_em"
FROM "EstagioFunil" e
JOIN "Funil" f ON f."id_empresa" = e."id_empresa" AND f."padrao" = 1;

DROP TABLE "EstagioFunil";
ALTER TABLE "new_EstagioFunil" RENAME TO "EstagioFunil";

CREATE UNIQUE INDEX "EstagioFunil_id_funil_ordem_key" ON "EstagioFunil"("id_funil", "ordem");
CREATE INDEX "EstagioFunil_id_empresa_idx" ON "EstagioFunil"("id_empresa");
CREATE INDEX "EstagioFunil_id_funil_idx" ON "EstagioFunil"("id_funil");

ALTER TABLE "Lead" ADD COLUMN "id_pdv" TEXT;

UPDATE "Lead"
SET "id_pdv" = (
  SELECT f."id_pdv"
  FROM "Funcionario" f
  WHERE f."id" = "Lead"."id_funcionario"
)
WHERE "id_pdv" IS NULL;

CREATE INDEX "Lead_id_pdv_idx" ON "Lead"("id_pdv");

CREATE TABLE "Negocio" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "id_empresa" TEXT NOT NULL,
  "id_lead" TEXT NOT NULL,
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
  CONSTRAINT "Negocio_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_funil_fkey" FOREIGN KEY ("id_funil") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_estagio_fkey" FOREIGN KEY ("id_estagio") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_produto_principal_fkey" FOREIGN KEY ("id_produto_principal") REFERENCES "Produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Negocio_chave_migracao_key" ON "Negocio"("chave_migracao");
CREATE INDEX "Negocio_id_empresa_id_lead_idx" ON "Negocio"("id_empresa", "id_lead");
CREATE INDEX "Negocio_id_empresa_id_funcionario_idx" ON "Negocio"("id_empresa", "id_funcionario");
CREATE INDEX "Negocio_id_empresa_id_funil_id_estagio_idx" ON "Negocio"("id_empresa", "id_funil", "id_estagio");
CREATE INDEX "Negocio_id_empresa_status_idx" ON "Negocio"("id_empresa", "status");
CREATE INDEX "Negocio_id_lead_criado_em_idx" ON "Negocio"("id_lead", "criado_em");

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
  CONSTRAINT "NegocioEstagioLog_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NegocioEstagioLog_id_funil_anterior_fkey" FOREIGN KEY ("id_funil_anterior") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NegocioEstagioLog_id_funil_novo_fkey" FOREIGN KEY ("id_funil_novo") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NegocioEstagioLog_id_estagio_anterior_fkey" FOREIGN KEY ("id_estagio_anterior") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NegocioEstagioLog_id_estagio_novo_fkey" FOREIGN KEY ("id_estagio_novo") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "NegocioEstagioLog_empresa_id_criado_em_idx" ON "NegocioEstagioLog"("empresa_id", "criado_em");
CREATE INDEX "NegocioEstagioLog_criado_em_idx" ON "NegocioEstagioLog"("criado_em");
CREATE INDEX "NegocioEstagioLog_id_negocio_idx" ON "NegocioEstagioLog"("id_negocio");

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
  CONSTRAINT "NegocioProduto_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "NegocioProduto_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "Negocio" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NegocioProduto_id_produto_fkey" FOREIGN KEY ("id_produto") REFERENCES "Produto" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "NegocioProduto_id_empresa_idx" ON "NegocioProduto"("id_empresa");
CREATE INDEX "NegocioProduto_id_negocio_idx" ON "NegocioProduto"("id_negocio");
CREATE INDEX "NegocioProduto_id_produto_idx" ON "NegocioProduto"("id_produto");

ALTER TABLE "Parcela" ADD COLUMN "id_negocio" TEXT;
CREATE INDEX "Parcela_id_negocio_idx" ON "Parcela"("id_negocio");

ALTER TABLE "AutomacaoAgendamento" ADD COLUMN "id_negocio" TEXT;
CREATE INDEX "AutomacaoAgendamento_id_negocio_idx" ON "AutomacaoAgendamento"("id_negocio");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
