export function criarResultadoFunilVazio() {
  return {
    funil: null,
    estagios: [] as Array<{
      id: string;
      id_empresa: string;
      id_funil: string;
      nome: string;
      ordem: bigint;
      tipo: string;
      criado_em: Date;
      atualizado_em: Date;
    }>,
  };
}
