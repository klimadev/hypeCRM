import type { FormEvent } from "react";
import type {
  ApiFuncionarioContato,
  ApiLeadContato,
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
  title: string;
  resumoTotal: string;
  leadsFiltrados: ApiLeadContato[];
  linhasTabela: LeadLinhaTabela[];
  funcionarios: ApiFuncionarioContato[];
  negociosParaVinculo: ApiNegocioResumo[];
  dialogVinculoAberto: boolean;
  leadEmVinculo: ApiLeadContato | null;
  negocioSelecionadoId: string;
  buscaNegocio: string;
  vinculando: boolean;
  erroVinculo: string | null;
  dialogNovoLeadAberto: boolean;
  criandoLead: boolean;
  erroNovoLead: string | null;
  formularioNovoLead: FormularioNovoLead;
  leadEmEdicao: ApiLeadContato | null;
  leadParaRemover: ApiLeadContato | null;
  removendoLead: boolean;
  removerNegociosVinculados: boolean;
  erroRemocaoLead: string | null;
  negociosRelacionadosAoLead: ApiNegocioResumo[];
  carregarDados: (silencioso?: boolean) => Promise<void>;
  limparBusca: () => void;
  abrirVinculo: (lead: ApiLeadContato) => void;
  fecharVinculo: () => void;
  setBuscaNegocio: (valor: string) => void;
  setNegocioSelecionadoId: (valor: string) => void;
  confirmarVinculo: () => Promise<void>;
  abrirNovoLead: () => void;
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
};
