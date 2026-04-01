import type {
  ChatConnectionStatus,
  WhatsappChatMessage,
  WhatsappInstancia,
} from "@/modules/whatsapp/types";

export type ApiErro = { erro?: string };

export type ChatApiErro = ApiErro & {
  codigo?: string;
  pdv?: { id: string; nome: string } | null;
  rotaConfiguracao?: string | null;
};

export type ResultadoApi<T> =
  | { ok: true; dados: T }
  | { ok: false; erro: string };

export type WhatsappConexaoPayload = {
  qrCode?: string | null;
  pairingCode?: string | null;
  status?: string;
  conectado?: boolean;
  origem?: "status" | "restart" | "connect";
  phone?: string | null;
};

export type ChatApiResponse = {
  messages?: WhatsappChatMessage[];
  connectionStatus?: ChatConnectionStatus;
  unreadCount?: number;
};

export type ChatMessagesStreamSnapshot = {
  messages: WhatsappChatMessage[];
  connectionStatus: ChatConnectionStatus;
  unreadCount: number;
};

export type SseCallbacks<T> = {
  onSnapshot: (snapshot: T) => void;
  onError?: () => void;
};

export type MediaContent = {
  base64: string;
  mediaType: string;
  mimetype: string;
  fileName: string;
  seconds: number | null;
};

export type WhatsappStats = {
  total: number;
  ativas: number;
  instancias: Array<{
    id: string;
    instance_name: string;
    status: string;
  }>;
};

export async function lerJsonSeguro<T>(resposta: Response): Promise<T> {
  return (await resposta.json().catch(() => ({}))) as T;
}

export function criarAssinaturaSse<T>(url: string, callbacks: SseCallbacks<T>) {
  if (typeof EventSource === "undefined") {
    callbacks.onError?.();
    return () => undefined;
  }

  const source = new EventSource(url);
  const handleSnapshot = (event: Event) => {
    const snapshot = JSON.parse((event as MessageEvent<string>).data) as T;
    callbacks.onSnapshot(snapshot);
  };
  const handleError = () => {
    callbacks.onError?.();
  };

  source.addEventListener("snapshot", handleSnapshot as EventListener);
  source.addEventListener("error", handleError);

  return () => {
    source.removeEventListener("snapshot", handleSnapshot as EventListener);
    source.removeEventListener("error", handleError);
    source.close();
  };
}

export type InstanciaPayload = { instancia?: WhatsappInstancia | null };
export type InstanciasPayload = { instancias?: WhatsappInstancia[] };
