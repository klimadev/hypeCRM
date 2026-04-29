import type { WhatsappInstancia } from "@/modules/whatsapp/types";
import {
  type ApiErro,
  type InstanciaPayload,
  type InstanciasPayload,
  type ResultadoApi,
  type WhatsappConexaoPayload,
  type WhatsappStats,
  lerJsonSeguro,
} from "./whatsapp.shared";

export async function listarInstanciasWhatsapp(): Promise<ResultadoApi<{ instancias: WhatsappInstancia[] }>> {
  const resposta = await fetch("/api/whatsapp/instances");
  const json = await lerJsonSeguro<InstanciasPayload & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar instâncias." };
  }

  return { ok: true, dados: { instancias: json.instancias ?? [] } };
}

export async function obterWhatsappStats(): Promise<ResultadoApi<WhatsappStats>> {
  const resposta = await fetch("/api/whatsapp/stats");
  const json = await lerJsonSeguro<WhatsappStats & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar estatísticas do WhatsApp." };
  }

  return { ok: true, dados: json };
}

export async function obterQrCodeWhatsapp(id: string): Promise<
  ResultadoApi<{
    qrCode: string | null;
    pairingCode: string | null;
    status: string;
    conectado: boolean;
    phone: string | null;
    origem: "status" | "restart" | "connect" | null;
  }>
> {
  const resposta = await fetch(`/api/whatsapp/instances/${id}/qrcode`, { method: "GET" });
  const json = await lerJsonSeguro<WhatsappConexaoPayload & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao buscar QR Code." };
  }

  return {
    ok: true,
    dados: {
      qrCode: json.qrCode ?? null,
      pairingCode: json.pairingCode ?? null,
      status: json.status ?? "unknown",
      conectado: json.conectado === true,
      phone: json.phone ?? null,
      origem: json.origem ?? null,
    },
  };
}

export async function reconectarInstanciaWhatsapp(id: string): Promise<
  ResultadoApi<{
    instancia: WhatsappInstancia | null;
    qrCode: string | null;
    pairingCode: string | null;
    status: string;
    conectado: boolean;
    origem: "status" | "restart" | "connect" | null;
  }>
> {
  const resposta = await fetch(`/api/whatsapp/instances/${id}/reconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  const json = await lerJsonSeguro<WhatsappConexaoPayload & { instancia?: WhatsappInstancia | null } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao reconectar instância." };
  }

  return {
    ok: true,
    dados: {
      instancia: json.instancia ?? null,
      qrCode: json.qrCode ?? null,
      pairingCode: json.pairingCode ?? null,
      status: json.status ?? "unknown",
      conectado: json.conectado === true,
      origem: json.origem ?? null,
    },
  };
}

export async function criarInstanciaWhatsapp(
  nome: string,
): Promise<ResultadoApi<{ instancia: WhatsappInstancia | null; qrCode: string | null }>> {
  const resposta = await fetch("/api/whatsapp/instances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome }),
  });
  const json = await lerJsonSeguro<{ instancia?: WhatsappInstancia; qrCode?: string } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao criar instância." };
  }

  return {
    ok: true,
    dados: {
      instancia: json.instancia ?? null,
      qrCode: json.qrCode ?? null,
    },
  };
}

export async function excluirInstanciaWhatsapp(id: string): Promise<ResultadoApi<null>> {
  const resposta = await fetch(`/api/whatsapp/instances/${id}`, { method: "DELETE" });
  const json = await lerJsonSeguro<ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao excluir instância." };
  }

  return { ok: true, dados: null };
}

export async function atualizarStatusInstanciaWhatsapp(
  id: string,
): Promise<ResultadoApi<{ instancia: WhatsappInstancia | null }>> {
  const resposta = await fetch(`/api/whatsapp/instances/${id}`, { method: "PATCH" });
  const json = await lerJsonSeguro<InstanciaPayload & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao atualizar status da instância." };
  }

  return { ok: true, dados: { instancia: json.instancia ?? null } };
}
