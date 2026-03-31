import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloLeads } from "@/modules/leads";

export default async function PaginaLeads() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    return null;
  }

  return <ModuloLeads />;
}
