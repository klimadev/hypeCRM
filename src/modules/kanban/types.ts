import type { TipoPendencia } from "@/lib/pendencias";
import type { PendenciaGravidade, ResumoPendencias } from "./hooks/use-pendencias-globais";

export type { ResumoPendencias, PendenciaGravidade };

// Tipos para origem do contato de origem do negócio (WhatsApp Ads)
export type OrigemContato = "MANUAL" | "SINCRONIZACAO_WHATSAPP" | "ANUNCIO_CTWA";

export type FiltroOrigem = "todos" | "MANUAL" | "SINCRONIZACAO_WHATSAPP" | "ANUNCIO_CTWA";

export type OrigemStats = {
  total: number;
  anuncios: number;
  whatsapp: number;
  manual: number;
};

export type Estagio = {
  id: string;
  nome: string;
  ordem: number;
  tipo: string;
};

export type Pdv = {
  id: string;
  nome: string;
};

export type Lead = {
  id: string;
  id_negocio?: string | null;
  id_estagio: string;
  id_funcionario: string;
  nome: string;
  telefone: string;
  valor_oportunidade: number;
  probabilidade?: number;
  fonte?: string | null;
  empresa_origem?: string | null;
  observacoes: string | null;
  motivo_perda: string | null;
  origem?: OrigemContato;
  atualizado_em: string;
  id_pdv?: string | null;
  dados_extras?: string | null;
  // Campos para anúncios CTWA
  anuncio_titulo?: string | null;
  anuncio_descricao?: string | null;
  anuncio_url?: string | null;
  lead_principal?: {
    id: string;
    nome: string;
    telefone: string;
    email?: string | null;
    origem?: OrigemContato;
    id_negocio?: string | null;
    atualizado_em?: string;
  } | null;
  leads_vinculados?: Array<{
    id: string;
    nome: string;
    telefone: string;
    id_negocio?: string | null;
  }>;
};

export type Funcionario = {
  id: string;
  nome: string;
};

export type PendenciaDinamica = {
  id: string;
  id_lead: string;
  tipo: TipoPendencia;
  descricao: string;
  resolvida: boolean;
};

export type PendenciaNegocioInfo = {
  total: number;
  naoResolvidas: number;
  tipos: TipoPendencia[];
  gravidadeMaxima: PendenciaGravidade;
};

export type FiltroPendencia = "todos" | "com_pendencia" | "sem_pendencia";
export type FiltroGravidade = "todas" | "critica" | "alerta" | "info";
export type FiltroTipo = "todos" | TipoPendencia;

export type KanbanFilters = {
  status: FiltroPendencia;
  gravidade: FiltroGravidade;
  tipo: FiltroTipo;
  pdv: string | null;
  origem: FiltroOrigem;
};

export type OrdenacaoKanban = "valor_maior" | "valor_menor" | "recente" | "antigo" | "nome";

export type Props = {
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  idUsuario: string;
};

export type StatusSalvamentoDetalhesNegocio =
  | "ocioso"
  | "pendente"
  | "salvando_manual"
  | "salvando_automaticamente"
  | "salvo"
  | "erro";

export type UseKanbanModuleReturn = {
  estagios: Estagio[];
  negocios: Lead[];
  funcionarios: Funcionario[];
  pdvs: Pdv[];
  negociosPorEstagio: Record<string, Lead[]>;
  negociosFiltradosPorEstagio: Record<string, Lead[]>;
  pendenciasPorNegocio: Record<string, PendenciaNegocioInfo>;
  resumoPendencias: ResumoPendencias | null;
  negocioSelecionado: Lead | null;
  pendenciasNegocio: PendenciaDinamica[];
  dialogNovoNegocioAberto: boolean;
  setDialogNovoNegocioAberto: (aberto: boolean) => void;
  movimentoPendente: { id_negocio: string; id_estagio: string } | null;
  setMovimentoPendente: (movimento: { id_negocio: string; id_estagio: string } | null) => void;
  motivoPerda: string;
  setMotivoPerda: (motivo: string) => void;
  valorNovoNegocio: string;
  setValorNovoNegocio: (valor: string) => void;
  erroNovoNegocio: string | null;
  setErroNovoNegocio: (erro: string | null) => void;
  criandoNegocio: boolean;
  cargoNovoNegocio: { id_funcionario: string } | null;
  salvando: boolean;
  salvo: boolean;
  salvandoAutomaticamente: boolean;
  salvamentoAutomaticoPendente: boolean;
  ultimaAtualizacaoSalvaEm: Date | null;
  statusSalvamentoDetalhes: StatusSalvamentoDetalhesNegocio;
  erroDetalhesNegocio: string | null;
  setErroDetalhesNegocio: (erro: string | null) => void;
  salvarDetalhesNegocio: (negocio: Lead) => Promise<void>;
  setNegocioSelecionado: (negocio: Lead | null) => void;
  leadsDisponiveis: Array<{
    id: string;
    id_negocio?: string | null;
    id_estagio: string;
    id_funcionario: string;
    nome: string;
    telefone: string;
    valor_oportunidade: number;
    atualizado_em: string;
    origem?: string | null;
    id_pdv?: string | null;
  }>;
  carregandoLeadsDisponiveis: boolean;
  salvandoVinculos: boolean;
  erroVinculos: string | null;
  setErroVinculos: (erro: string | null) => void;
  atualizarVinculosNegocio: (leadIds: string[]) => Promise<void>;
  removendoNegocio: boolean;
  removerNegocio: (opcoes: { removerLeadsVinculados: boolean }) => Promise<boolean>;
  criarNegocio: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  redistribuindoNegociosEmAtendimento: boolean;
  redistribuirNegociosEmAtendimento: () => Promise<
    | { ok: false; erro: string }
    | {
      ok: true;
      avaliados: number;
      elegiveis: number;
      reatribuidos: number;
      ignoradosSemDestino: number;
    }
  >;
  confirmarPerda: (evento: React.FormEvent<HTMLFormElement>) => Promise<void>;
  aoDragEnd: (resultado: import("@hello-pangea/dnd").DropResult) => Promise<void>;
  aoMudarNegocio: (negocioAtualizado: Lead) => void;
  estagioAberto: string;
  setCargoNovoNegocio: (cargo: { id_funcionario: string } | null) => void;
  setEstagioNovoNegocio: (estagio: string) => void;
  estagioNovoNegocio: string;
  filtros: KanbanFilters;
  setFiltros: (filtros: KanbanFilters) => void;
  busca: string;
  setBusca: (busca: string) => void;
  ordenacao: OrdenacaoKanban;
  setOrdenacao: (ordenacao: OrdenacaoKanban) => void;
  modoFocoPendencias: boolean;
  setModoFocoPendencias: (ativo: boolean) => void;
  stageIdAtivo: string;
  setStageIdAtivo: (stageId: string) => void;
  recarregarPendencias: () => void;
  totalNegocios: number;
  pendenciasCriticas: number;
  origemStats: OrigemStats;
  notificacoesAtivadas: boolean;
  alternarNotificacoes: () => Promise<boolean>;
  permissaoNotificacao: () => NotificationPermission | "unknown";
};
