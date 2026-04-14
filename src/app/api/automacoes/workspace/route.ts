import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/permissoes";
import { badRequest } from "@/lib/api/http";
import { handleRouteError } from "@/lib/api/route-errors";
import { parseJson } from "@/lib/api/route-validation";
import { esquemaAutomacaoWorkspace, mensagemErroValidacao } from "@/lib/validacoes.automacoes";
import {
  obterOuCriarWorkspace,
  salvarRascunho,
  publicarWorkspace,
  despublicarWorkspace,
  excluirWorkspace,
  obterVersaoPublicada,
} from "@/lib/automacoes";

export async function GET(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  try {
    const workspace = await obterOuCriarWorkspace(auth.sessao.id_empresa);

    if (!workspace) {
      return badRequest("Nao foi possible carregar o workspace de automacoes.");
    }

    const published = workspace.versao_publicada_id
      ? await obterVersaoPublicada(workspace.versao_publicada_id)
      : null;

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        id_empresa: workspace.id_empresa,
        rascunho_grafo_json: workspace.rascunho_grafo_json,
        versao_publicada_id: workspace.versao_publicada_id,
        ativo: workspace.ativo,
        atualizado_em: workspace.atualizado_em,
      },
      published: published
        ? {
            id: published.id,
            numero: published.numero,
            grafo_json: published.grafo_json,
            trigger_principal: published.trigger_principal,
            publicado_em: published.publicado_em,
          }
        : null,
    });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao carregar workspace.", "Erro ao carregar workspace:");
  }
}

export async function PUT(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const body = await parseJson<Record<string, unknown>>(request);
  if (!body.ok) {
    return body.response;
  }

  const validacao = esquemaAutomacaoWorkspace.safeParse({
    rascunho_grafo_json:
      typeof body.data.rascunho_grafo_json === "string"
        ? body.data.rascunho_grafo_json
        : undefined,
  });

  if (!validacao.success) {
    return badRequest(mensagemErroValidacao(validacao.error));
  }

  try {
    const workspace = await salvarRascunho(
      auth.sessao.id_empresa,
      validacao.data.rascunho_grafo_json
    );

    if (!workspace) {
      return badRequest("Nao foi possivel salvar o rascunho.");
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        rascunho_grafo_json: workspace.rascunho_grafo_json,
        atualizado_em: workspace.atualizado_em,
      },
    });
  } catch (erro) {
    return handleRouteError(erro, "Erro ao salvar rascunho.", "Erro ao salvar rascunho:");
  }
}

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  try {
    const workspace = await publicarWorkspace(auth.sessao.id_empresa);

    if (!workspace) {
      return badRequest("Nao foi possivel publicar o workspace.");
    }

    const published = await obterVersaoPublicada(workspace.versao_publicada_id!);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        versao_publicada_id: workspace.versao_publicada_id,
        atualizado_em: workspace.atualizado_em,
      },
      published: published
        ? {
            id: published.id,
            numero: published.numero,
            grafo_json: published.grafo_json,
            trigger_principal: published.trigger_principal,
            publicado_em: published.publicado_em,
          }
        : null,
    });
  } catch (erro) {
    if (erro instanceof Error) {
      const msg = erro.message;
      if (msg.includes("publish")) {
        return badRequest(msg);
      }
    }
    return handleRouteError(erro, "Erro ao publicar workspace.", "Erro ao publicar workspace:");
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) {
    return auth.erro;
  }

  const { searchParams } = new URL(request.url);
  const acao = searchParams.get("acao");

  try {
    if (acao === "excluir") {
      await excluirWorkspace(auth.sessao.id_empresa);
      return NextResponse.json({ sucesso: true, mensagem: "Automacao excluida com sucesso." });
    }

    const workspace = await despublicarWorkspace(auth.sessao.id_empresa);

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        versao_publicada_id: workspace.versao_publicada_id,
        atualizado_em: workspace.atualizado_em,
      },
      published: null,
    });
  } catch (erro) {
    if (acao === "excluir") {
      return handleRouteError(erro, "Erro ao excluir workspace.", "Erro ao excluir workspace:");
    }
    return handleRouteError(erro, "Erro ao despublicar workspace.", "Erro ao despublicar workspace:");
  }
}
