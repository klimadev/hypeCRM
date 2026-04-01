export type {
  InstanciaResolvida,
  LeadComAcesso,
  LeadResolvidoPorTelefone,
  MapaContatoMensagem,
  MapaMensagensContato,
  MensagemNormalizada,
} from "./whatsapp-chat.types";

export {
  escolherStatusMaisForte,
  extrairDadosAdDoMapa,
  extrairNomeDoLeadDoMapa,
  mapearMensagemDbParaCanonica,
  mapearStatusMensagem,
  normalizarMensagensEvolution,
} from "./whatsapp-chat.normalization";

export {
  buscarLeadComAcesso,
  buscarLeadPorTelefoneComAcesso,
  buscarPdvDoLead,
  normalizarRemoteJidParaLead,
  resolverInstanciaDoLead,
  resolverInstanciaPorTelefone,
} from "./whatsapp-chat.resolvers";

export {
  buscarConnectionStatus,
  buscarMediaBase64,
  buscarMensagensEvolution,
  buscarTodasMensagensDaInstancia,
  enviarMensagemEvolution,
  marcarMensagensComoLidasEvolution,
} from "./whatsapp-chat.evolution";

export { upsertMensagensNoBanco } from "./whatsapp-chat.persistence";
