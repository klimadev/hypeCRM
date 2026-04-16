import { createHash, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { NegocioResumo } from "@/lib/negocios.types";

const META_CAPI_EVENT_NAME = "lead_closed";

function normalizarTelefoneParaHash(telefone: string) {
  return telefone.replace(/\D/g, "");
}

function hashTelefone(telefone: string) {
  const normalizado = normalizarTelefoneParaHash(telefone);
  if (!normalizado) return null;

  return createHash("sha256").update(normalizado).digest("hex");
}

async function criarTabelaSeNecessario() {
  await prisma.$executeRaw(Prisma.sql`
    CREATE TABLE IF NOT EXISTS MetaCapiEvento (
      id TEXT PRIMARY KEY NOT NULL,
      id_empresa TEXT NOT NULL,
      id_negocio TEXT NOT NULL,
      evento_nome TEXT NOT NULL,
      evento_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      telefone_hash TEXT,
      payload_json TEXT NOT NULL,
      resposta_json TEXT,
      erro TEXT,
      tentativas INTEGER NOT NULL DEFAULT 0,
      criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      enviado_em DATETIME,
      ciclo_fechamento INTEGER NOT NULL DEFAULT 1
    )
  `);
}

async function contarEventosFechamento(params: { idEmpresa: string; idNegocio: string }) {
  const rows = await prisma.$queryRaw<Array<{ total: number }>>(Prisma.sql`
    SELECT COUNT(*) AS total
    FROM MetaCapiEvento
    WHERE id_empresa = ${params.idEmpresa}
      AND id_negocio = ${params.idNegocio}
  `);

  return Number(rows[0]?.total ?? 0) + 1;
}

export async function registrarMetaCapiFechamento(params: { idEmpresa: string; negocio: NegocioResumo }) {
  await criarTabelaSeNecessario();

  const telefone = params.negocio.lead_principal?.telefone ?? params.negocio.leads?.[0]?.telefone ?? "";
  const telefoneHash = hashTelefone(telefone);

  if (!telefoneHash) {
    return { ok: false as const, erro: "Telefone do lead ausente ou invalido para Meta CAPI." };
  }

  const eventTime = Math.floor(new Date(params.negocio.data_fechamento ?? new Date()).getTime() / 1000);
  const cicloFechamento = await contarEventosFechamento({ idEmpresa: params.idEmpresa, idNegocio: params.negocio.id });
  const idempotencyKey = `meta-capi:${params.idEmpresa}:${params.negocio.id}:closed:${cicloFechamento}`;
  const payload = {
    event_name: META_CAPI_EVENT_NAME,
    event_time: eventTime,
    user_data: { ph: telefoneHash },
    action_source: "system_generated",
    custom_data: {
      event_source: "crm",
      lead_event_source: "hypecrm",
      negocio_id: params.negocio.id,
      etapa: params.negocio.estagio?.nome ?? "fechado",
    },
  };

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO MetaCapiEvento (
      id,
      id_empresa,
      id_negocio,
      evento_nome,
      evento_status,
      idempotency_key,
      telefone_hash,
      payload_json,
      tentativas,
      criado_em,
      atualizado_em,
      ciclo_fechamento
    ) VALUES (
      ${randomUUID()},
      ${params.idEmpresa},
      ${params.negocio.id},
      ${META_CAPI_EVENT_NAME},
      ${"PENDENTE"},
      ${idempotencyKey},
      ${telefoneHash},
      ${JSON.stringify(payload)},
      ${0},
      ${new Date()},
      ${new Date()},
      ${cicloFechamento}
    )
    ON CONFLICT(idempotency_key) DO NOTHING
  `);

  return { ok: true as const, payload, idempotencyKey, telefoneHash };
}
