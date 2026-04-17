import { redirect } from "next/navigation";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import { podeVerEquipe } from "@/lib/permissoes";

export default async function PaginaNovoProduto() {
  const sessao = await obterSessaoNoServidor();

  if (!sessao) {
    return null;
  }

  if (!podeVerEquipe(sessao)) {
    redirect("/kanban");
  }

  redirect("/produtos");
}
