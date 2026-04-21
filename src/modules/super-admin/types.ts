export type UsuarioTipo = "empresa" | "funcionario";

export type Usuario = {
  id: string;
  tipo: UsuarioTipo;
  nome: string;
  email: string;
  isSuperAdmin: boolean;
  status: string;
  criado_em: string;
  empresaNome?: string;
};

export type UsuariosResponse = {
  usuarios: Usuario[];
  total: number;
  pagina: number;
  totalPaginas: number;
};

export type UsuarioEditarPayload = {
  nome?: string;
  email?: string;
  tipo: UsuarioTipo;
};

export type UsuarioSenhaPayload = {
  novaSenha: string;
  tipo: UsuarioTipo;
};