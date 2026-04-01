import type { EstagioFunilOption, WhatsappJobItem } from "@/modules/whatsapp/types";
import { type ApiErro, type ResultadoApi, lerJsonSeguro } from "./whatsapp.shared";
import { normalizarListaJobsWhatsapp, normalizarResumoJobsWhatsapp } from "./whatsapp.utils";

export async function listarJobsWhatsapp(): Promise<
  ResultadoApi<{
    resumo: { pendentes: number; processando: number; falhas: number; enviadosHoje: number; atualizadoEm: string };
    agendamentos: WhatsappJobItem[];
  }>
> {
  const resposta = await fetch("/api/whatsapp/agendamentos?lista=true&limite=50");
  const json = await lerJsonSeguro<
    {
      resumo?: {
        pendentes?: number;
        processando?: number;
        falhas?: number;
        enviadosHoje?: number;
        atualizadoEm?: string;
      };
      agendamentos?: WhatsappJobItem[];
    } & ApiErro
  >(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar jobs do WhatsApp." };
  }

  return {
    ok: true,
    dados: {
      resumo: normalizarResumoJobsWhatsapp(json.resumo),
      agendamentos: normalizarListaJobsWhatsapp(json.agendamentos),
    },
  };
}

export async function listarEstagiosFunil(): Promise<ResultadoApi<{ estagios: EstagioFunilOption[] }>> {
  const resposta = await fetch("/api/estagios");
  const json = await lerJsonSeguro<{ estagios?: EstagioFunilOption[] } & ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar estagios." };
  }

  return { ok: true, dados: { estagios: Array.isArray(json.estagios) ? json.estagios : [] } };
}
