import type { SessaoToken } from "@/lib/tipos";

export type InstagramConta = {
  id: string;
  nome: string;
  instagram_user_id: string;
  username: string;
  account_type: string | null;
  profile_picture_url: string | null;
  status: string;
  criado_em: string;
  atualizado_em: string;
  expires_at: string | null;
};

export type UseInstagramModuleReturn = {
  contas: InstagramConta[];
  carregando: boolean;
  erro: string | null;
  excluirConta: (id: string) => Promise<{ sucesso: boolean; erro?: string }>;
  recarregar: () => Promise<void>;
};

export type ModuloInstagramProps = {
  perfil: SessaoToken["perfil"];
};
