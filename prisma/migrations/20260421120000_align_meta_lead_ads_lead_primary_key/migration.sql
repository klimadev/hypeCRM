PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MetaLeadAdsLead" (
    "id" TEXT NOT NULL,
    "id_empresa" TEXT NOT NULL,
    "id_lead_crm" TEXT,
    "page_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "ad_id" TEXT,
    "dados_brutos" TEXT NOT NULL,
    "sincronizado_em" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_MetaLeadAdsLead" ("ad_id", "dados_brutos", "form_id", "id", "id_empresa", "id_lead_crm", "page_id", "sincronizado_em") SELECT "ad_id", "dados_brutos", "form_id", "id", "id_empresa", "id_lead_crm", "page_id", "sincronizado_em" FROM "MetaLeadAdsLead";
DROP TABLE "MetaLeadAdsLead";
ALTER TABLE "new_MetaLeadAdsLead" RENAME TO "MetaLeadAdsLead";
CREATE INDEX "MetaLeadAdsLead_id_empresa_id_lead_crm_idx" ON "MetaLeadAdsLead"("id_empresa", "id_lead_crm");
CREATE UNIQUE INDEX "MetaLeadAdsLead_id_empresa_id_key" ON "MetaLeadAdsLead"("id_empresa", "id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
