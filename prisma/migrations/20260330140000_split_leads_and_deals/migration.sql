PRAGMA foreign_keys=OFF;

ALTER TABLE "Lead" ADD COLUMN "id_negocio" TEXT;
ALTER TABLE "Lead" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT 1;

CREATE INDEX "Lead_id_negocio_idx" ON "Lead"("id_negocio");
CREATE INDEX "Lead_id_empresa_ativo_idx" ON "Lead"("id_empresa", "ativo");

CREATE TABLE "new_Negocio" (
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
  "chave_migracao" TEXT UNIQUE,
  "criado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Negocio_id_empresa_fkey" FOREIGN KEY ("id_empresa") REFERENCES "Empresa" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_lead_fkey" FOREIGN KEY ("id_lead") REFERENCES "Lead" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_funil_fkey" FOREIGN KEY ("id_funil") REFERENCES "Funil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_estagio_fkey" FOREIGN KEY ("id_estagio") REFERENCES "EstagioFunil" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "Funcionario" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Negocio_id_produto_principal_fkey" FOREIGN KEY ("id_produto_principal") REFERENCES "Produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Negocio" (
  "id",
  "id_empresa",
  "id_lead",
  "id_funil",
  "id_estagio",
  "id_funcionario",
  "id_produto_principal",
  "titulo",
  "valor_estimado",
  "valor_fechado",
  "probabilidade",
  "status",
  "data_abertura",
  "data_fechamento",
  "motivo_perda",
  "observacoes_comerciais",
  "chave_migracao",
  "criado_em",
  "atualizado_em"
)
SELECT
  "id",
  "id_empresa",
  "id_lead",
  "id_funil",
  "id_estagio",
  "id_funcionario",
  "id_produto_principal",
  "titulo",
  "valor_estimado",
  "valor_fechado",
  "probabilidade",
  "status",
  "data_abertura",
  "data_fechamento",
  "motivo_perda",
  "observacoes_comerciais",
  "chave_migracao",
  "criado_em",
  "atualizado_em"
FROM "Negocio";

DROP TABLE "Negocio";
ALTER TABLE "new_Negocio" RENAME TO "Negocio";

CREATE UNIQUE INDEX "Negocio_chave_migracao_key" ON "Negocio"("chave_migracao");
CREATE INDEX "Negocio_id_empresa_id_lead_idx" ON "Negocio"("id_empresa", "id_lead");
CREATE INDEX "Negocio_id_empresa_id_funcionario_idx" ON "Negocio"("id_empresa", "id_funcionario");
CREATE INDEX "Negocio_id_empresa_id_funil_id_estagio_idx" ON "Negocio"("id_empresa", "id_funil", "id_estagio");
CREATE INDEX "Negocio_id_empresa_status_idx" ON "Negocio"("id_empresa", "status");
CREATE INDEX "Negocio_id_lead_criado_em_idx" ON "Negocio"("id_lead", "criado_em");

UPDATE "Lead"
SET "id_negocio" = (
  SELECT "id"
  FROM "Negocio"
  WHERE "Negocio"."id_lead" = "Lead"."id"
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1
  FROM "Negocio"
  WHERE "Negocio"."id_lead" = "Lead"."id"
);

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
