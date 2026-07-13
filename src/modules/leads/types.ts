import type { FormEvent } from "react";
import type {
  CampanhaDetalheApi,
  CampanhaResumoApi,
  ApiFuncionarioContato,
  ApiLeadContato,
  PayloadImportarLeadsCsv,
  PayloadCriarCampanhaDisparo,
} from "@/lib/api/leads";
import type {
  ApiNegocioResumo,
  ListagemNegociosApi,
} from "@/lib/api/negocios";

export type ApiEstagioLead = NonNullable<ListagemNegociosApi["estagios"]>[number];

export type FormularioNovoLead = {
  nome: string;
  telefone: string;
  email: string;
  fonte: string;
  empresaOrigem: string;
  observacoes: string;
  idFuncionario: string;
};

export type LeadNegocioResumo = {
  titulo: string;
  subtitulo: string;
};

export type LeadLinhaTabela = {
  id: string;
  lead: ApiLeadContato;
  nome: string;
  telefone: string;
  etapa: string;
  responsavel: string;
  pdv: string;
  origem: string;
  valor: string;
  atualizadoEm: string;
  idNegocio: string | null;
  negocioResumo: LeadNegocioResumo;
};

export type UseLeadsModuleReturn = {
  busca: string;
  setBusca: (valor: string) => void;
  carregando: boolean;
  recarregando: boolean;
  erro: string | null;
  erroDisparo: string | null;
  title: string;
  resumoTotal: string;
  leadsFiltrados: ApiLeadContato[];
  linhasTabela: LeadLinhaTabela[];
  estagios: ApiEstagioLead[];
  campanhas: CampanhaResumoApi[];
  campanhaDetalhe: CampanhaDetalheApi | null;
  carregandoCampanhas: boolean;
  carregandoDetalheCampanha: boolean;
  campanhaDetalheIdAberta: string | null;
  disparandoCampanha: boolean;
  dialogDisparoAberto: boolean;
  podeDispararLote: boolean;
  idsSelecionados: string[];
  totalSelecionados: number;
  todosFiltradosSelecionados: boolean;
  pdvsPresentesNaSelecao: Array<{ id: string; nome: string }>;
  semPdvSelecionados: number;
  instanciasWhatsapp: Array<{ id: string; nome: string; instance_name: string }>;
  formularioDisparo: PayloadCriarCampanhaDisparo;
  funcionarios: ApiFuncionarioContato[];
  negociosParaVinculo: ApiNegocioResumo[];
  dialogVinculoAberto: boolean;
  leadEmVinculo: ApiLeadContato | null;
  negocioSelecionadoId: string;
  buscaNegocio: string;
  vinculando: boolean;
  erroVinculo: string | null;
  dialogNovoLeadAberto: boolean;
  dialogImportacaoAberto: boolean;
  importandoCsv: boolean;
  erroImportacaoCsv: string | null;
  criandoLead: boolean;
  erroNovoLead: string | null;
  formularioNovoLead: FormularioNovoLead;
  leadEmEdicao: ApiLeadContato | null;
  leadParaRemover: ApiLeadContato | null;
  removendoLead: boolean;
  removerNegociosVinculados: boolean;
  erroRemocaoLead: string | null;
  negociosRelacionadosAoLead: ApiNegocioResumo[];
  // Bulk delete
  dialogRemocaoMassaAberto: boolean;
  removendoLeadsEmMassa: boolean;
  leadsSelecionadosParaRemocao: ApiLeadContato[];
  abrirRemocaoMassa: () => void;
  fecharRemocaoMassa: () => void;
  confirmarRemocaoMassa: () => Promise<void>;
  // Conversão em massa de leads para negócios
  dialogConversaoAberto: boolean;
  convertendoLeads: boolean;
  erroConversao: string | null;
  formularioConversao: {
    idEstagio: string;
    idFuncionario: string;
    usarResponsavelAutomatico: boolean;
  };
  leadsSelecionados: ApiLeadContato[];
  leadsComNegocio: ApiLeadContato[];
  leadsSemNegocio: ApiLeadContato[];
  dialogConflitoAberto: boolean;
  acaoConflito: "substituir" | "ignorar" | "criar_novo" | null;
  carregarDados: (silencioso?: boolean) => Promise<void>;
  carregarCampanhas: () => Promise<void>;
  limparBusca: () => void;
  abrirDialogDisparo: () => void;
  fecharDialogDisparo: () => void;
  atualizarFormularioDisparo: <Campo extends keyof PayloadCriarCampanhaDisparo>(campo: Campo, valor: PayloadCriarCampanhaDisparo[Campo]) => void;
  atualizarInstanciaPdvDisparo: (pdvId: string, instanciaId: string) => void;
  alternarSelecao: (leadId: string) => void;
  alternarSelecaoPagina: () => void;
  selecionarTodosFiltrados: () => void;
  limparSelecao: () => void;
  submitCampanhaDisparo: () => Promise<void>;
  abrirDetalheCampanha: (campanhaId: string) => Promise<void>;
  fecharDetalheCampanha: () => void;
  cancelarCampanha: (campanhaId: string) => Promise<void>;
  abrirVinculo: (lead: ApiLeadContato) => void;
  fecharVinculo: () => void;
  setBuscaNegocio: (valor: string) => void;
  setNegocioSelecionadoId: (valor: string) => void;
  confirmarVinculo: () => Promise<void>;
  abrirNovoLead: () => void;
  abrirImportacaoCsv: () => void;
  fecharImportacaoCsv: () => void;
  importarLeadsCsv: (payload: PayloadImportarLeadsCsv) => Promise<void>;
  abrirEdicaoLead: (lead: ApiLeadContato) => void;
  fecharNovoLead: () => void;
  atualizarFormularioNovoLead: <Campo extends keyof FormularioNovoLead>(
    campo: Campo,
    valor: FormularioNovoLead[Campo],
  ) => void;
  submitNovoLead: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  abrirRemocaoLead: (lead: ApiLeadContato) => void;
  fecharRemocaoLead: () => void;
  setRemoverNegociosVinculados: (valor: boolean) => void;
  confirmarRemocaoLead: () => Promise<void>;
  abrirDialogConversao: () => void;
  fecharDialogConversao: () => void;
  atualizarFormularioConversao: <Campo extends "idEstagio" | "idFuncionario" | "usarResponsavelAutomatico">(campo: Campo, valor: string | boolean) => void;
  setAcaoConflito: (acao: "substituir" | "ignorar" | "criar_novo" | null) => void;
  submitConversaoLeadsEmNegocios: () => Promise<void>;
  confirmarConflito: () => Promise<void>;
};
