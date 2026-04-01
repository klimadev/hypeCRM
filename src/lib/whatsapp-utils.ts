/**
 * Utilitários para Evolution API 2.3+
 * Contém normalizadores de dados, extratores e funções auxiliares.
 */

export type {
  DadosAd,
  EvolutionFindMessagesWhere,
  EvolutionMensagemCrua,
  EvolutionMensagensResponse,
  ResultadoExtracaoNome,
  TextoExtraido,
} from "./whatsapp-utils.types";

export {
  formatarDataBr,
  formatarDataMensagemWhatsapp,
  formatarHoraBr,
  formatarLabelSeparadorData,
  normalizarTimestampParaDate,
  normalizarTimestampParaIso,
} from "./whatsapp-utils.dates";

export {
  extrairNomeDoLead,
  extrairTextoMensagem,
  formatarPreviewMensagem,
  MAPEAMENTO_TIPOS_MENSAGEM,
  mapearStatusMensagemCru,
  traduzirTipoMensagem,
} from "./whatsapp-utils.message";

export { extrairDadosAd, mensagemTemOrigemAd } from "./whatsapp-utils.ads";

export {
  ehGrupo,
  ehStatusBroadcast,
  extrairTelefoneDeRemoteJid,
  normalizarRemoteJid,
} from "./whatsapp-utils.jid";
