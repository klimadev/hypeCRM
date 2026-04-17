import { redirect } from "next/navigation";
import { ModuloProdutos } from "@/modules/produtos";
import { obterSessaoNoServidor } from "@/lib/autenticacao";
import type { Produto } from "@/lib/api/produtos";
import { prisma } from "@/lib/prisma";
import { podeVerEquipe } from "@/lib/permissoes";

function serializarProduto(produto: {
  id: string;
  id_empresa: string;
  nome: string;
  slug: string;
  descricao: string | null;
  ativo: boolean;
  criado_em: Date;
  atualizado_em: Date;
}): Produto {
  return {
    ...produto,
    criado_em: produto.criado_em.toISOString(),
    atualizado_em: produto.atualizado_em.toISOString(),
  };
}

export default async function PaginaProdutos() {
  const sessao = await obterSessaoNoServidor();
  if (!sessao) return null;
  if (!podeVerEquipe(sessao)) redirect("/kanban");

  const resultado = await prisma.produto.findMany({
    where: { id_empresa: sessao.id_empresa },
    select: {
      id: true,
      id_empresa: true,
      nome: true,
      slug: true,
      descricao: true,
      ativo: true,
      criado_em: true,
      atualizado_em: true,
    },
    orderBy: [{ ativo: "desc" }, { nome: "asc" }],
  }).then((items) => ({ produtos: items.map(serializarProduto), erro: null as string | null })).catch(() => ({ produtos: [] as Produto[], erro: "Nao foi possivel carregar o catalogo." }));

  return <ModuloProdutos produtosIniciais={resultado.produtos} erroInicial={resultado.erro} />;
}
