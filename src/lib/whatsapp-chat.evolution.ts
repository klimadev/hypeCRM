import { extrairDadosAd } from "@/lib/whatsapp-utils";
import type { ChatConnectionStatus } from "@/modules/whatsapp/types";
import type { MapaMensagensContato } from "./whatsapp-chat.types";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL ?? "http://localhost:8080";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? "";
const EVOLUTION_FETCH_TIMEOUT_MS = 5000;

function payloadHeaders() {
  return {
    "Content-Type": "application/json",
    apikey: EVOLUTION_API_KEY,
  };
}

export async function buscarConnectionStatus(instanceName: string): Promise<ChatConnectionStatus> {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: payloadHeaders(),
    });

    if (!response.ok) return "offline";

    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const instance = (json.instance ?? json) as Record<string, unknown>;
    const state = String(instance.state ?? instance.status ?? "").toLowerCase();
    if (!state) return "unknown";
    return state === "open" || state === "connecting" ? "online" : "offline";
  } catch {
    return "offline";
  }
}

export async function buscarMensagensEvolution(instanceName: string, remoteJid: string) {
  const telefoneBusca = remoteJid.replace(/\D/g, "");
  const telefoneFormatado = telefoneBusca ? `${telefoneBusca}@s.whatsapp.net` : remoteJid;

  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, EVOLUTION_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
      method: "POST",
      headers: payloadHeaders(),
      body: JSON.stringify({
        where: {
          key: {
            remoteJid: telefoneFormatado,
            remoteJidAlt: telefoneFormatado,
          },
        },
        page: 1,
        offset: 80,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error("Erro ao buscar mensagens na Evolution API.");
  }

  return response.json().catch(() => ([]));
}

export async function buscarTodasMensagensDaInstancia(
  instanceName: string,
  limitePorPagina: number = 500,
): Promise<MapaMensagensContato> {
  const mapaContatos: MapaMensagensContato = new Map();
  let pagina = 1;
  let temMaisPaginas = true;

  while (temMaisPaginas) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, EVOLUTION_FETCH_TIMEOUT_MS * 2);

    let response: Response;
    try {
      response = await fetch(`${EVOLUTION_API_URL}/chat/findMessages/${instanceName}`, {
        method: "POST",
        headers: payloadHeaders(),
        body: JSON.stringify({
          page: pagina,
          offset: limitePorPagina,
        }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`Erro ao buscar mensagens na Evolution API (página ${pagina}).`);
    }

    const json = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const mensagens = json.messages as Record<string, unknown> | undefined;
    const registros = (mensagens?.records ?? json.records ?? []) as Array<Record<string, unknown>>;

    if (registros.length === 0) {
      temMaisPaginas = false;
      break;
    }

    for (const msg of registros) {
      const key = (msg.key ?? {}) as Record<string, unknown>;
      const remoteJidAlt = typeof key.remoteJidAlt === "string" ? key.remoteJidAlt : null;
      if (!remoteJidAlt) continue;

      const fromMe = Boolean(key.fromMe);
      const pushName = fromMe ? null : (msg.pushName as string | null);
      const timestamp = Number(msg.messageTimestamp ?? 0);
      const dadosAd = extrairDadosAd(msg);
      const existente = mapaContatos.get(remoteJidAlt);

      if (!existente || !fromMe) {
        if (!fromMe) {
          mapaContatos.set(remoteJidAlt, {
            pushName,
            dadosAd,
            timestamp,
            remoteJidAlt,
          });
        } else if (!existente) {
          mapaContatos.set(remoteJidAlt, {
            pushName: null,
            dadosAd: null,
            timestamp: 0,
            remoteJidAlt,
          });
        }
      }
    }

    const totalPaginas = Number((mensagens?.pages ?? json.pages ?? 1) as number);
    if (pagina >= totalPaginas) {
      temMaisPaginas = false;
    } else {
      pagina += 1;
    }
  }

  return mapaContatos;
}

export async function enviarMensagemEvolution(instanceName: string, number: string, text: string) {
  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
    method: "POST",
    headers: payloadHeaders(),
    body: JSON.stringify({ number: `+${number}`, text }),
  });

  if (!response.ok) {
    const erro = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const erroTexto =
      typeof erro.message === "string"
        ? erro.message
        : typeof erro.error === "string"
          ? erro.error
          : "Erro ao enviar mensagem.";
    throw new Error(erroTexto);
  }

  return response.json().catch(() => ({}));
}

export async function marcarMensagensComoLidasEvolution(instanceName: string, mensagens: Array<{ remoteJid: string; id: string }>) {
  if (!mensagens.length) return;

  const response = await fetch(`${EVOLUTION_API_URL}/chat/markMessageAsRead/${instanceName}`, {
    method: "POST",
    headers: payloadHeaders(),
    body: JSON.stringify({
      readMessages: mensagens.map((mensagem) => ({
        remoteJid: mensagem.remoteJid,
        id: mensagem.id,
        fromMe: false,
      })),
    }),
  });

  if (!response.ok) {
    const erro = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    const mensagem =
      typeof erro.message === "string"
        ? erro.message
        : typeof erro.error === "string"
          ? erro.error
          : "Erro ao marcar mensagens como lidas.";
    throw new Error(mensagem);
  }
}

export async function buscarMediaBase64(instanceName: string, messageId: string): Promise<{
  base64: string;
  mediaType: string;
  mimetype: string;
  fileName: string;
  seconds: number | null;
} | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, EVOLUTION_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/${instanceName}`, {
      method: "POST",
      headers: payloadHeaders(),
      body: JSON.stringify({
        message: {
          key: { id: messageId },
        },
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    console.error("[buscarMediaBase64] Erro ao buscar mídia:", response.status);
    return null;
  }

  const json = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json || !json.base64) {
    return null;
  }

  return {
    base64: String(json.base64),
    mediaType: typeof json.mediaType === "string" ? json.mediaType : "unknown",
    mimetype: typeof json.mimetype === "string" ? json.mimetype : "application/octet-stream",
    fileName: typeof json.fileName === "string" ? json.fileName : "arquivo",
    seconds: typeof json.seconds === "number" ? json.seconds : null,
  };
}
