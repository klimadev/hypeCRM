import { type ApiErro, type ResultadoApi, lerJsonSeguro } from "./http";

export async function verificarBootstrapConfigs(): Promise<ResultadoApi<null>> {
  const resposta = await fetch("/api/estagios");
  const json = await lerJsonSeguro<ApiErro>(resposta);

  if (!resposta.ok) {
    return { ok: false, erro: json.erro ?? "Erro ao carregar configuracoes." };
  }

  return { ok: true, dados: null };
}
