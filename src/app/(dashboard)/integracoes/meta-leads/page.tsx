import { redirect } from "next/navigation";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloMetaLeads } from "@/modules/meta-leads/page";
import { podeAcessarIntegracoes } from "@/modules/integracoes";

export default async function PaginaIntegracaoMetaLeads() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (!podeAcessarIntegracoes(sessao.perfil)) {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar a integracao Meta Lead Ads"
        description="A configuracao da Central de Leads fica disponivel apenas para perfis de gestao da empresa."
      />
    );
  }

  return <ModuloMetaLeads perfil={sessao.perfil} />;
}
