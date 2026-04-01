import { redirect } from "next/navigation";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloCalCom } from "@/modules/calcom";
import { podeAcessarIntegracoes } from "@/modules/integracoes";

export default async function PaginaIntegracaoCalCom() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (!podeAcessarIntegracoes(sessao.perfil)) {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar a integracao Cal.com"
        description="A configuracao do calendario fica disponivel apenas para perfis de gestao da empresa."
      />
    );
  }

  return <ModuloCalCom perfil={sessao.perfil} />;
}
