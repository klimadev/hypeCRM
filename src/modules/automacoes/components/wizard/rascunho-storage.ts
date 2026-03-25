import type {
  Automacao,
  FormularioAutomacaoWizard,
  RascunhoAutomacaoWizard,
  ResumoRascunhoAutomacaoWizard,
} from "../../types";

const CHAVE_RASCUNHO_AUTOMACAO = "hypecrm:automacoes:wizard-rascunho";

export function criarFormularioAutomacaoVazio(): FormularioAutomacaoWizard {
  return {
    nome: "",
    idEstagioDestino: "",
    idInstanciaWhatsapp: "",
    telefoneDestino: "",
    mensagem: "",
    delayMinutos: 0,
  };
}

export function mapearAutomacaoParaFormulario(
  automacao: Automacao,
): FormularioAutomacaoWizard {
  let config: { id_estagio_destino?: string } = {};

  try {
    config = JSON.parse(automacao.config_json || "{}");
  } catch {
    config = {};
  }

  const formulario = criarFormularioAutomacaoVazio();

  formulario.nome = automacao.nome;
  formulario.idEstagioDestino = config.id_estagio_destino || "";

  if (automacao.acoes.length > 0) {
    const acao = automacao.acoes[0];
    formulario.idInstanciaWhatsapp = acao.id_instancia_whatsapp || "";
    formulario.telefoneDestino = acao.telefone_destino || "";
    formulario.mensagem = acao.mensagem || "";
    formulario.delayMinutos = acao.delay_minutos || 0;
  }

  return formulario;
}

function possuiStorageDisponivel() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function normalizarFormulario(
  valor: unknown,
): FormularioAutomacaoWizard | null {
  if (!valor || typeof valor !== "object") {
    return null;
  }

  const candidato = valor as Partial<FormularioAutomacaoWizard>;

  return {
    nome: typeof candidato.nome === "string" ? candidato.nome : "",
    idEstagioDestino:
      typeof candidato.idEstagioDestino === "string"
        ? candidato.idEstagioDestino
        : "",
    idInstanciaWhatsapp:
      typeof candidato.idInstanciaWhatsapp === "string"
        ? candidato.idInstanciaWhatsapp
        : "",
    telefoneDestino:
      typeof candidato.telefoneDestino === "string"
        ? candidato.telefoneDestino
        : "",
    mensagem: typeof candidato.mensagem === "string" ? candidato.mensagem : "",
    delayMinutos:
      typeof candidato.delayMinutos === "number" && Number.isFinite(candidato.delayMinutos)
        ? candidato.delayMinutos
        : 0,
  };
}

export function lerRascunhoAutomacaoWizard(): RascunhoAutomacaoWizard | null {
  if (!possuiStorageDisponivel()) {
    return null;
  }

  try {
    const bruto = window.sessionStorage.getItem(CHAVE_RASCUNHO_AUTOMACAO);
    if (!bruto) {
      return null;
    }

    const parsed = JSON.parse(bruto) as Partial<RascunhoAutomacaoWizard>;
    const form = normalizarFormulario(parsed.form);

    if (
      parsed.versao !== 1 ||
      !form ||
      (parsed.passo !== 1 && parsed.passo !== 2 && parsed.passo !== 3) ||
      (parsed.modo !== "criacao" && parsed.modo !== "edicao") ||
      typeof parsed.aberto !== "boolean"
    ) {
      window.sessionStorage.removeItem(CHAVE_RASCUNHO_AUTOMACAO);
      return null;
    }

    return {
      versao: 1,
      aberto: parsed.aberto,
      passo: parsed.passo,
      modo: parsed.modo,
      automacaoId:
        typeof parsed.automacaoId === "string" ? parsed.automacaoId : null,
      form,
      salvoEm:
        typeof parsed.salvoEm === "string"
          ? parsed.salvoEm
          : new Date().toISOString(),
      };
  } catch {
    window.sessionStorage.removeItem(CHAVE_RASCUNHO_AUTOMACAO);
    return null;
  }
}

export function salvarRascunhoAutomacaoWizard(
  rascunho: RascunhoAutomacaoWizard,
) {
  if (!possuiStorageDisponivel()) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      CHAVE_RASCUNHO_AUTOMACAO,
      JSON.stringify(rascunho),
    );
  } catch {
    return;
  }
}

export function removerRascunhoAutomacaoWizard() {
  if (!possuiStorageDisponivel()) {
    return;
  }

  try {
    window.sessionStorage.removeItem(CHAVE_RASCUNHO_AUTOMACAO);
  } catch {
    return;
  }
}

export function obterResumoRascunhoAutomacaoWizard(): ResumoRascunhoAutomacaoWizard | null {
  const rascunho = lerRascunhoAutomacaoWizard();

  if (!rascunho) {
    return null;
  }

  const nome = rascunho.form.nome.trim();

  return {
    existe: true,
    aberto: rascunho.aberto,
    modo: rascunho.modo,
    automacaoId: rascunho.automacaoId,
    nome:
      nome ||
      (rascunho.modo === "edicao"
        ? "Edicao de automacao em andamento"
        : "Nova automacao em andamento"),
    salvoEm: rascunho.salvoEm,
  };
}
