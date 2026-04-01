export type { MediaContent, ResultadoApi, WhatsappStats } from "./whatsapp.shared";

export {
  atualizarStatusInstanciaWhatsapp,
  criarInstanciaWhatsapp,
  excluirInstanciaWhatsapp,
  listarInstanciasWhatsapp,
  obterQrCodeWhatsapp,
  obterWhatsappStats,
  reconectarInstanciaWhatsapp,
} from "./whatsapp.instances";

export {
  assinarConversasWhatsapp,
  assinarMensagensWhatsapp,
  buscarContextoChat,
  buscarMediaWhatsapp,
  enviarMensagemWhatsapp,
  listarConversasWhatsapp,
  listarMensagensWhatsapp,
  marcarMensagensComoLidas,
} from "./whatsapp.chat";

export {
  atualizarAutomacaoWhatsapp,
  criarAutomacaoWhatsapp,
  dispararDispatchFollowUpWhatsapp,
  excluirAutomacaoWhatsapp,
  gerarPreviewAutomacaoWhatsapp,
  listarAutomacoesWhatsapp,
} from "./whatsapp.automations";

export { listarEstagiosFunil, listarJobsWhatsapp } from "./whatsapp.monitoring";
