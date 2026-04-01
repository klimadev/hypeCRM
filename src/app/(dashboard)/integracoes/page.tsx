import { redirect } from "next/navigation";
import { AccessDeniedCard } from "@/components/shared/access-denied-card";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloIntegracoes, podeAcessarIntegracoes } from "@/modules/integracoes";

export default async function PaginaIntegracoes() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (!podeAcessarIntegracoes(sessao.perfil)) {
    return (
      <AccessDeniedCard
        title="Sem permissao para acessar integracoes"
        description="A central de integracoes e reservada aos perfis de gestao. Solicite acesso ao administrador da empresa se precisar operar conexoes externas."
      />
    );
  }

  return <ModuloIntegracoes />;
}
