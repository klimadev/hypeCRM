export type CalComInstancia = {
  id: string;
  nome: string;
  status: string;
  profile_name: string | null;
  profile_email: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type CalComBooking = {
  uid: string;
  title: string;
  start: string;
  end?: string;
  status: string;
  meetingUrl: string | null;
  attendees: Array<{ name: string; email: string; timeZone?: string }>;
  instanciaNome: string;
};

export type CalComEventType = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  length: number;
  schedulingUrl: string;
  instanciaNome: string;
};

export type UseCalComModuleReturn = {
  instancias: CalComInstancia[];
  bookings: CalComBooking[];
  eventTypes: CalComEventType[];
  carregando: boolean;
  erro: string | null;
  criarInstancia: (nome: string, apiKey: string) => Promise<{ sucesso: boolean; erro?: string }>;
  excluirInstancia: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  testarConexao: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  recarregar: () => Promise<void>;
};
