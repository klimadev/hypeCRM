import { redirect } from "next/navigation";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloAutomacoes } from "@/modules/automacoes";

export default async function PaginaAutomacoes() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (sessao.perfil !== "EMPRESA" && sessao.perfil !== "GERENTE") {
    redirect("/kanban");
  }

  return <ModuloAutomacoes />;
}
