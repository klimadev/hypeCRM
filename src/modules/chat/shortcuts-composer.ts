import type { ChatShortcut } from "@/lib/api/chat-shortcuts";

export const LIMITE_HISTORICO_ATALHOS = 20;

export type AtalhoKeyboardInput = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

export type AcaoAtalhoTeclado =
  | { tipo: "navegar"; indice: number }
  | { tipo: "aplicar" }
  | { tipo: "fechar" }
  | { tipo: "enviar" }
  | { tipo: "nenhuma" };

export type AcaoSlashMenuRaizTeclado =
  | { tipo: "navegar"; indice: number }
  | { tipo: "selecionar" }
  | { tipo: "fechar" }
  | { tipo: "nenhuma" };

export type EstadoSlashMenu = "fechado" | "raiz" | "atalhos" | "follow-up";

export type OpcaoSlashMenu = "atalhos" | "follow-up";

export function obterQueryAtalho(texto: string): string {
  return texto.startsWith("/") && !texto.includes(" ") ? texto.slice(1).toLowerCase() : "";
}

export function obterEstadoSlashMenu(texto: string): EstadoSlashMenu {
  if (!texto.startsWith("/") || texto.includes(" ")) return "fechado";
  if (texto.length === 1) return "raiz";
  if (texto === "/follow" || texto === "/follow-up") return "follow-up";
  return "atalhos";
}

export function obterOpcoesSlashMenu(estado: EstadoSlashMenu): OpcaoSlashMenu[] {
  if (estado === "raiz") return ["atalhos", "follow-up"];
  if (estado === "follow-up") return ["follow-up"];
  return ["atalhos"];
}

export function resolverAcaoSlashMenuRaizTeclado(params: {
  menuAberto: boolean;
  quantidadeOpcoes: number;
  indiceAtual: number;
  input: AtalhoKeyboardInput;
}): AcaoSlashMenuRaizTeclado {
  const { menuAberto, quantidadeOpcoes, indiceAtual, input } = params;

  if (!menuAberto || quantidadeOpcoes === 0) {
    return { tipo: "nenhuma" };
  }

  const isCtrlOuCmd = Boolean(input.ctrlKey || input.metaKey);
  const keyNormalizada = input.key.toLowerCase();

  if (input.key === "ArrowDown" || (isCtrlOuCmd && keyNormalizada === "j")) {
    return { tipo: "navegar", indice: (indiceAtual + 1) % quantidadeOpcoes };
  }

  if (input.key === "ArrowUp" || (isCtrlOuCmd && keyNormalizada === "k")) {
    return { tipo: "navegar", indice: (indiceAtual - 1 + quantidadeOpcoes) % quantidadeOpcoes };
  }

  if (input.key === "Tab" || (input.key === "Enter" && !input.shiftKey)) {
    return { tipo: "selecionar" };
  }

  if (input.key === "Escape") {
    return { tipo: "fechar" };
  }

  return { tipo: "nenhuma" };
}

export function filtrarOrdenarAtalhos(
  atalhos: ChatShortcut[],
  queryAtalho: string,
  ultimosUsosAtalhos: Record<string, number>,
): ChatShortcut[] {
  const lista = atalhos.filter((atalho) => {
    if (!atalho.ativo) return false;
    if (!queryAtalho) return true;
    const alvo = `${atalho.slug} ${atalho.nome} ${atalho.tags.join(" ")}`.toLowerCase();
    return alvo.includes(queryAtalho);
  });

  return [...lista].sort((a, b) => {
    const usoA = ultimosUsosAtalhos[a.slug] ?? 0;
    const usoB = ultimosUsosAtalhos[b.slug] ?? 0;
    if (usoA !== usoB) return usoB - usoA;

    const aComeca = queryAtalho ? a.slug.toLowerCase().startsWith(queryAtalho) : false;
    const bComeca = queryAtalho ? b.slug.toLowerCase().startsWith(queryAtalho) : false;
    if (aComeca !== bComeca) return aComeca ? -1 : 1;

    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

export function registrarUsoRecenteAtalho(
  ultimosUsosAtalhos: Record<string, number>,
  slug: string,
  timestamp: number,
  limite = LIMITE_HISTORICO_ATALHOS,
): Record<string, number> {
  const atualizado = { ...ultimosUsosAtalhos, [slug]: timestamp };
  return Object.fromEntries(
    Object.entries(atualizado)
      .sort(([, usoA], [, usoB]) => usoB - usoA)
      .slice(0, limite),
  );
}

export function normalizarMapaUsosAtalho(raw: unknown, limite = LIMITE_HISTORICO_ATALHOS): Record<string, number> {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>)
      .filter(([, value]) => typeof value === "number" && Number.isFinite(value))
      .sort(([, usoA], [, usoB]) => (usoB as number) - (usoA as number))
      .slice(0, limite),
  ) as Record<string, number>;
}

export function resolverAcaoAtalhoTeclado(params: {
  atalhosAbertos: boolean;
  quantidadeAtalhos: number;
  indiceAtual: number;
  input: AtalhoKeyboardInput;
}): AcaoAtalhoTeclado {
  const { atalhosAbertos, quantidadeAtalhos, indiceAtual, input } = params;

  if (atalhosAbertos && quantidadeAtalhos > 0) {
    const isCtrlOuCmd = Boolean(input.ctrlKey || input.metaKey);
    const keyNormalizada = input.key.toLowerCase();

    if (input.key === "ArrowDown" || (isCtrlOuCmd && keyNormalizada === "j")) {
      return { tipo: "navegar", indice: (indiceAtual + 1) % quantidadeAtalhos };
    }

    if (input.key === "ArrowUp" || (isCtrlOuCmd && keyNormalizada === "k")) {
      return { tipo: "navegar", indice: (indiceAtual - 1 + quantidadeAtalhos) % quantidadeAtalhos };
    }

    if (input.key === "Tab" || (input.key === "Enter" && !input.shiftKey)) {
      return { tipo: "aplicar" };
    }

    if (input.key === "Escape") {
      return { tipo: "fechar" };
    }
  }

  if (input.key === "Enter" && !input.shiftKey) {
    return { tipo: "enviar" };
  }

  return { tipo: "nenhuma" };
}
