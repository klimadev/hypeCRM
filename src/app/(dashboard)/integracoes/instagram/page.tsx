import { redirect } from "next/navigation";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloInstagram } from "@/modules/instagram";
import { podeAcessarIntegracoes } from "@/modules/integracoes";

export default async function PaginaIntegracaoInstagram() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (!podeAcessarIntegracoes(sessao.perfil)) {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar a integracao Instagram"
        description="A configuracao do Instagram fica disponivel apenas para perfis de gestao da empresa."
      />
    );
  }

  return <ModuloInstagram perfil={sessao.perfil} />;
}
