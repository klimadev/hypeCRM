import { redirect } from "next/navigation";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { ModuloAutomacoes } from "@/modules/automacoes";

type Params = {
  params: Promise<{ automacaoId: string }>;
};

export default async function PaginaAutomacao({ params }: Params) {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    redirect("/login");
  }

  if (sessao.perfil !== "EMPRESA" && sessao.perfil !== "GERENTE") {
    redirect("/kanban");
  }

  await params;
  return <ModuloAutomacoes />;
}
