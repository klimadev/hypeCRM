export type {
  FiltroAcessoEmpresaFuncionario,
  LeadResponsavelResumo,
  LeadResumoBasico,
  NegocioKanban,
  NegocioResumo,
} from "@/lib/negocios.types";

export {
  buscarNegociosResumoPorIds,
  obterNegocioPorId,
} from "@/lib/negocios.queries";

export {
  listarEstagiosDoFunil,
  listarFunisDaEmpresa,
  listarNegociosKanban,
  obterFunilPadrao,
} from "@/lib/negocios.funnels";

export {
  atualizarNegocio,
  criarNegocio,
  criarNegocioComLead,
  montarDtoNegocio,
} from "@/lib/negocios.mutations";

export {
  desativarNegocio,
  desvincularLeadsDoNegocio,
  listarNegociosPrincipaisDoLead,
  moverNegocioDeEstagio,
  vincularLeadsAoNegocio,
} from "@/lib/negocios.transitions";
