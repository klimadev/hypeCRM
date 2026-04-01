export type {
  CriarInstanciaParams,
  EvolutionConnectionState,
  EvolutionContato,
  EvolutionConversa,
  EvolutionInstance,
  EvolutionMensagem,
  EvolutionQrCode,
} from "./evolution-api.types";

export {
  buscarInstancia,
  conectarInstancia,
  criarInstancia,
  deletarInstancia,
  enviarMensagemTexto,
  gerarQrCode,
  listarInstancias,
  obterEstadoConexao,
  reiniciarInstancia,
} from "./evolution-api.instances";

export {
  buscarContatos,
  buscarConversas,
  buscarConversasEvolution,
  buscarMensagens,
} from "./evolution-api.chat";
