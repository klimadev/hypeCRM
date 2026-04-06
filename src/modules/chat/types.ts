export type ChatUnificado = {
  instanceName: string;
  remoteJid: string;
  telefone: string;
  pushName: string | null;
  isGroup: boolean;
  canal: "whatsapp" | "instagram";
  ultimaMensagem: {
    conteudo: string;
    fromMe: boolean;
    timestamp: number;
    kind?: string | null;
    hasMedia?: boolean | null;
    mediaUrl?: string | null;
  } | null;
  unreadCount: number;
  leadMatch: {
    id: string;
    nome: string;
    telefone: string;
    id_funcionario: string;
    id_pdv: string | null;
    id_estagio: string;
    id_negocio: string | null;
    nome_funcionario: string | null;
    nome_pdv: string | null;
    nome_estagio: string | null;
    origem: string | null;
    fonte: string | null;
    empresa_origem: string | null;
    negocio: {
      id: string;
      titulo: string;
      status: string;
      id_funcionario: string;
      id_estagio: string;
    } | null;
  } | null;
  semMatch: boolean;
};

export type OrphanRegistrarLeadParams = {
  telefone: string;
  nome?: string;
  id_pdv?: string;
  id_funcionario?: string;
};

export type OrphanCriarNegocioParams = {
  telefone: string;
  nome?: string;
  id_pdv?: string;
  id_funcionario?: string;
  id_estagio?: string;
};

export type UseChatModuleReturn = {
  chats: ChatUnificado[];
  chatSelecionado: ChatUnificado | null;
  setChatSelecionado: (chat: ChatUnificado | null) => void;
  busca: string;
  setBusca: (termo: string) => void;
  filtroOrigem: "todos" | "anuncio" | "whatsapp" | "manual";
  setFiltroOrigem: (filtro: "todos" | "anuncio" | "whatsapp" | "manual") => void;
  filtroFila: "todas" | "sem_dono" | "sem_negocio";
  setFiltroFila: (filtro: "todas" | "sem_dono" | "sem_negocio") => void;
  filtroCanal: "todos" | "whatsapp" | "instagram";
  setFiltroCanal: (filtro: "todos" | "whatsapp" | "instagram") => void;
  carregando: boolean;
  erro: string | null;
  sseConectado: boolean;
  ultimoSyncEm: number | null;
  recarregar: () => Promise<void>;
  carregarMais: () => void;
  temMais: boolean;
  total: number;
  totalChats: number;
  totalOrphans: number;
  totalMatched: number;
  totalSemDono: number;
  totalSemNegocio: number;
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  idUsuario: string;
  onRegistrarComoLead: (params: OrphanRegistrarLeadParams) => Promise<void>;
  onCriarNegocio: (params: OrphanCriarNegocioParams) => Promise<void>;
  onTransferirLead: (params: { idLead: string; idFuncionario: string }) => Promise<void>;
};

export type Props = {
  perfil: "EMPRESA" | "GERENTE" | "COLABORADOR";
  idUsuario: string;
};
