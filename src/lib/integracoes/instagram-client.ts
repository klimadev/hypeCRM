type FalhaInstagramInput = {
  status?: number;
  code?: number;
  subcode?: number;
  message?: string;
  type?: string;
};

const INSTAGRAM_FETCH_TIMEOUT_MS = 20_000;

export type CategoriaFalhaInstagram =
  | "token_invalido"
  | "sem_permissao"
  | "endpoint_invalido"
  | "resposta_invalida"
  | "api"
  | "janela_expirada"
  | "erro_rede"
  | "limite_excedido";

export type FalhaInstagramClassificada = {
  categoria: CategoriaFalhaInstagram;
  deveDesativarToken: boolean;
  mensagem: string;
  status: number | null;
  code: number | null;
  subcode: number | null;
};

export class ErroInstagramApi extends Error {
  status: number | null;
  code: number | null;
  subcode: number | null;
  categoria: CategoriaFalhaInstagram;
  deveDesativarToken: boolean;

  constructor(input: FalhaInstagramClassificada) {
    super(input.mensagem);
    this.name = "ErroInstagramApi";
    this.status = input.status;
    this.code = input.code;
    this.subcode = input.subcode;
    this.categoria = input.categoria;
    this.deveDesativarToken = input.deveDesativarToken;
  }
}

export function classificarFalhaInstagram(input: FalhaInstagramInput): FalhaInstagramClassificada {
  const status = typeof input.status === "number" ? input.status : null;
  const code = typeof input.code === "number" ? input.code : null;
  const subcode = typeof input.subcode === "number" ? input.subcode : null;
  const message = String(input.message ?? "Erro no Instagram Graph API.");
  const messageLower = message.toLowerCase();

  if (status === 401 || code === 190 || messageLower.includes("invalid oauth") || messageLower.includes("access token")) {
    return {
      categoria: "token_invalido",
      deveDesativarToken: true,
      mensagem: `Token invalido ou expirado do Instagram. ${message}`,
      status,
      code,
      subcode,
    };
  }

  if (
    messageLower.includes("24") ||
    messageLower.includes("messaging_window") ||
    messageLower.includes("cannot message") ||
    messageLower.includes("user cannot be messaged") ||
    messageLower.includes("fora do período permitido") ||
    messageLower.includes("fora do periodo permitido") ||
    subcode === 2018034 ||
    subcode === 2534022
  ) {
    return {
      categoria: "janela_expirada",
      deveDesativarToken: false,
      mensagem: `Nao foi possivel enviar a mensagem porque a conversa esta fora da janela de 24 horas permitida pela plataforma.`,
      status,
      code,
      subcode,
    };
  }

  // Verificar "does not exist" / recurso inexistente ANTES de permissao
  // pois a mensagem da API pode conter "permission" mesmo sendo recurso inexistente
  if (code === 100 || messageLower.includes("unsupported get request") || messageLower.includes("does not exist")) {
    return {
      categoria: "endpoint_invalido",
      deveDesativarToken: false,
      mensagem: `Endpoint ou recurso invalido na API do Instagram. ${message}`,
      status,
      code,
      subcode,
    };
  }

  // Rate limit / limite de requisicoes da API (code 4, subcode 1349210)
  // Deve vir ANTES da checagem de permissao pois status 403 + "permission" pode casar errado
  if (
    code === 4 ||
    subcode === 1349210 ||
    subcode === 1349211 ||
    subcode === 1349212 ||
    messageLower.includes("request limit") ||
    messageLower.includes("rate limit") ||
    messageLower.includes("throttled") ||
    messageLower.includes("too many")
  ) {
    return {
      categoria: "limite_excedido",
      deveDesativarToken: false,
      mensagem: `Limite de requisicoes da API do Instagram atingido. Aguarde alguns instantes e tente novamente.`,
      status,
      code,
      subcode,
    };
  }

  if (status === 403 || code === 10 || code === 200 || messageLower.includes("permission") || messageLower.includes("permiss")) {
    return {
      categoria: "sem_permissao",
      deveDesativarToken: false,
      mensagem: `Permissao insuficiente na API do Instagram. ${message}`,
      status,
      code,
      subcode,
    };
  }

  return {
    categoria: status === null ? "resposta_invalida" : "api",
    deveDesativarToken: false,
    mensagem: message,
    status,
    code,
    subcode,
  };
}

export function logInstagram(evento: string, detalhes?: Record<string, unknown>) {
  if (detalhes && Object.keys(detalhes).length > 0) {
    console.info(`[Instagram] ${evento}`, detalhes);
    return;
  }

  console.info(`[Instagram] ${evento}`);
}

export async function chamarGraphInstagram<T>(input: {
  url: URL;
  init?: RequestInit;
  operacao: string;
}): Promise<T> {
  let resposta: Response;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), INSTAGRAM_FETCH_TIMEOUT_MS);

  try {
    resposta = await fetch(input.url.toString(), {
      cache: "no-store",
      ...input.init,
      signal: controller.signal,
    });
  } catch (erroRede) {
    logInstagram("Erro de rede ao chamar API do Instagram", {
      operacao: input.operacao,
      erro: erroRede instanceof Error ? erroRede.message : String(erroRede),
      codigo: erroRede instanceof Error && "code" in erroRede ? String((erroRede as NodeJS.ErrnoException).code) : undefined,
    });

    throw new ErroInstagramApi({
      categoria: "erro_rede",
      deveDesativarToken: false,
      mensagem: `Falha de conexao ao ${input.operacao}. Verifique sua conexao com a internet e tente novamente.`,
      status: null,
      code: null,
      subcode: null,
    });
  } finally {
    clearTimeout(timeout);
  }

  const json = await resposta.json().catch(() => null);

  if (!json) {
    throw new ErroInstagramApi(classificarFalhaInstagram({
      status: resposta.status,
      message: `Resposta invalida ao ${input.operacao}.`,
    }));
  }

  if (!resposta.ok || (typeof json === "object" && json !== null && "error" in json)) {
    const erro = typeof json === "object" && json !== null && "error" in json
      ? (json as { error?: { message?: string; code?: number; error_subcode?: number; type?: string } }).error
      : undefined;

    throw new ErroInstagramApi(classificarFalhaInstagram({
      status: resposta.status,
      code: erro?.code,
      subcode: erro?.error_subcode,
      type: erro?.type,
      message: erro?.message ?? `Falha ao ${input.operacao}.`,
    }));
  }

  return json as T;
}
