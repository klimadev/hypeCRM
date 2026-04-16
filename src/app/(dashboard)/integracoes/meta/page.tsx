import { redirect } from "next/navigation";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloMeta } from "@/modules/meta/page";
import { podeAcessarIntegracoes } from "@/modules/integracoes";

export default async function PaginaIntegracaoMeta() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (!podeAcessarIntegracoes(sessao.perfil)) {
    return (
      <AccessDeniedCard
        title="Sem permissão para acessar a integração Meta CAPI"
        description="A configuração da Conversions API fica disponível apenas para perfis de gestão da empresa."
      />
    );
  }

  return <ModuloMeta perfil={sessao.perfil} />;
}
