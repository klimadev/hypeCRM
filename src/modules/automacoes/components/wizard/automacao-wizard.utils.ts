import {
  instanciaWhatsappEstaConectada,
  normalizarStatusInstanciaWhatsapp,
} from "@/lib/whatsapp-instancia-status";
import type { AutomacaoForm, FormularioAutomacaoWizard, PassoAutomacaoWizard } from "../../types";

export const VALOR_ESTAGIO_QUALQUER = "__qualquer_estagio__";

type AvisoRascunhoWizardParams = {
  temProtecaoDeRascunho: boolean;
  rascunhoRecuperado: boolean;
  ultimoRascunhoSalvoEm: string | null;
};

export function formatarHorarioRascunhoWizard(valor: string | null) {
  if (!valor) {
    return null;
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

export function formatarStatusInstanciaWizard(instancia: { status: string | null; phone?: string | null }) {
  const statusNormalizado = normalizarStatusInstanciaWhatsapp(instancia.status);

  if (instanciaWhatsappEstaConectada(instancia)) {
    return "Conectada";
  }

  if (statusNormalizado === "pending" || statusNormalizado === "qrcode" || statusNormalizado === "qr_code") {
    return "Aguardando QR Code";
  }

  if (statusNormalizado === "loading" || statusNormalizado === "creating") {
    return "Inicializando";
  }

  if (statusNormalizado === "disconnected" || statusNormalizado === "close") {
    return "Desconectada";
  }

  return instancia.status || "Indisponivel";
}

export function formulariosAutomacaoSaoIguais(
  atual: FormularioAutomacaoWizard,
  inicial: FormularioAutomacaoWizard,
) {
  return (
    atual.nome === inicial.nome &&
    atual.idEstagioDestino === inicial.idEstagioDestino &&
    atual.idInstanciaWhatsapp === inicial.idInstanciaWhatsapp &&
    atual.telefoneDestino === inicial.telefoneDestino &&
    atual.mensagem === inicial.mensagem &&
    atual.delayMinutos === inicial.delayMinutos
  );
}

export function montarPayloadAutomacaoWizard(
  form: FormularioAutomacaoWizard,
  dataReferencia = new Date().toLocaleDateString(),
): AutomacaoForm {
  return {
    nome: form.nome || `Automação ${dataReferencia}`,
    fonte: "WHATSAPP",
    gatilho: "STAGE_CHANGE",
    ativo: true,
    acoes: [
      {
        tipo: "WHATSAPP_MSG",
        ordem: 0,
        delay_minutos: form.delayMinutos,
        id_instancia_whatsapp: form.idInstanciaWhatsapp || undefined,
        telefone_destino: form.telefoneDestino || undefined,
        mensagem: form.mensagem || "Olá {{lead_nome}}!",
      },
    ],
    id_estagio_destino: form.idEstagioDestino || undefined,
  };
}

export function podeAvancarPassoAutomacaoWizard(
  passo: PassoAutomacaoWizard,
  form: FormularioAutomacaoWizard,
  instanciaSelecionadaDisponivel: boolean,
) {
  if (passo !== 2) {
    return true;
  }

  return Boolean(form.mensagem.trim() && instanciaSelecionadaDisponivel);
}

export function criarAvisoRascunhoWizard({
  temProtecaoDeRascunho,
  rascunhoRecuperado,
  ultimoRascunhoSalvoEm,
}: AvisoRascunhoWizardParams) {
  const horario = formatarHorarioRascunhoWizard(ultimoRascunhoSalvoEm);

  if (!temProtecaoDeRascunho && !ultimoRascunhoSalvoEm) {
    return null;
  }

  return {
    titulo: rascunhoRecuperado ? "Rascunho recuperado" : "Protecao contra recarga ativa",
    descricao: rascunhoRecuperado
      ? "Retomamos sua criacao automaticamente. A pagina pode recarregar sem derrubar seu progresso."
      : "Seu progresso fica salvo automaticamente nesta aba enquanto voce monta a automacao.",
    horario,
  };
}
