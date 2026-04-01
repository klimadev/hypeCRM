import type { EvolutionContato, EvolutionConversa, EvolutionMensagem } from "./evolution-api.types";
import {
  agruparConversasPorBuscaEvolution,
  deduplicarMensagensPorContatoEvolution,
  mapearContatoEvolution,
  mapearConversaEvolution,
} from "./evolution-api.utils";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";

const headers = {
  "Content-Type": "application/json",
  apikey: EVOLUTION_API_KEY,
};

async function lerJsonErro(resposta: Response) {
  return await resposta.json().catch(() => ({}));
}

export async function buscarContatos(instanceName: string): Promise<EvolutionContato[]> {
  const resposta = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as Array<{
    remoteJid?: string;
    remoteJidAlt?: string | null;
    pushName?: string | null;
    isGroup?: boolean;
    lastMessage?: { key?: { remoteJidAlt?: string }; pushName?: string };
  }>;

  return json.map(mapearContatoEvolution).filter((item): item is EvolutionContato => item !== null);
}

export async function buscarConversas(instanceName: string): Promise<EvolutionConversa[]> {
  const resposta = await fetch(`${EVOLUTION_API_URL}/chat/findChats/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as Array<{
    remoteJid?: string;
    remoteJidAlt?: string;
    pushName?: string | null;
    isGroup?: boolean;
    lastMessage?: { key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean }; pushName?: string };
  }>;

  return json.map(mapearConversaEvolution).filter((item): item is EvolutionConversa => item !== null);
}

export async function buscarConversasEvolution(
  instanceName: string,
  termo: string,
  page: number = 1,
  offset: number = 30,
): Promise<EvolutionConversa[]> {
  const resposta = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      where: {
        key: {
          remoteJid: termo,
          remoteJidAlt: termo,
          senderPn: termo,
        },
        pushName: termo,
      },
      page,
      offset,
    }),
  });

  if (!resposta.ok) {
    const erro = await lerJsonErro(resposta);
    throw new Error(erro.message ?? "Erro ao buscar conversas na Evolution");
  }

  const json = (await resposta.json().catch(() => ({}))) as {
    messages?: {
      records?: Array<{
        key?: { remoteJid?: string; remoteJidAlt?: string; fromMe?: boolean };
        pushName?: string | null;
        messageTimestamp?: number;
      }>;
    };
  };

  return agruparConversasPorBuscaEvolution(json.messages?.records ?? []);
}

export async function buscarMensagens(
  instanceName: string,
  limitePorPagina: number = 1000,
): Promise<EvolutionMensagem[]> {
  const todasMensagens: EvolutionMensagem[] = [];
  let pagina = 1;
  let temMaisPaginas = true;

  while (temMaisPaginas) {
    const resposta = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
      method: "POST",
      headers,
      body: JSON.stringify({ limit: limitePorPagina, page: pagina }),
    });

    if (!resposta.ok) {
      const erro = await lerJsonErro(resposta);
      throw new Error(erro.message ?? "Erro ao buscar mensagens na Evolution");
    }

    const json = (await resposta.json().catch(() => ({}))) as {
      messages?: {
        records?: Array<{
          key?: { remoteJid?: string; remoteJidAlt?: string };
          lastMessage?: { key?: { remoteJidAlt?: string } };
          pushName?: string | null;
          messageTimestamp?: number;
        }>;
        pages?: number;
      };
    };

    const registros = json.messages?.records ?? [];
    if (registros.length === 0) {
      temMaisPaginas = false;
      break;
    }

    for (const msg of registros) {
      const remoteJid = msg.key?.remoteJid ?? "";
      if (!remoteJid || remoteJid.includes("@g.us") || remoteJid === "status@broadcast") {
        continue;
      }

      todasMensagens.push({
        remoteJid,
        remoteJidAlt: msg.key?.remoteJidAlt ?? null,
        remoteJidAltLastMessage: msg.lastMessage?.key?.remoteJidAlt ?? null,
        pushName: msg.pushName ?? null,
        messageTimestamp: msg.messageTimestamp ?? 0,
      });
    }

    const totalPaginas = json.messages?.pages ?? 1;
    if (pagina >= totalPaginas) {
      temMaisPaginas = false;
    } else {
      pagina += 1;
    }
  }

  return deduplicarMensagensPorContatoEvolution(todasMensagens);
}
