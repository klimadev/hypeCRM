import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { handleRouteError } from "@/lib/api/route-errors";
import { validateBody } from "@/lib/api/route-validation";
import { z } from "zod";

const esquemaEnviarMensagemInstagram = z.object({
  recipientId: z.string().trim().min(1, "Recipient ID obrigatorio."),
  texto: z.string().trim().min(1, "Texto obrigatorio."),
});

export async function POST(request: NextRequest) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  if (auth.sessao.perfil !== "EMPRESA" && auth.sessao.perfil !== "GERENTE") {
    return respostaSemPermissao();
  }

  const payload = await request.json().catch(() => null);
  const validacao = validateBody(esquemaEnviarMensagemInstagram, payload);
  if (!validacao.ok) {
    return validacao.response;
  }

  try {
    const resultado = await enviarMensagemInstagram(
      auth.sessao.id_empresa,
      validacao.data.recipientId,
      validacao.data.texto,
    );

    return NextResponse.json(resultado);
  } catch (erro) {
    return handleRouteError(erro, "Erro ao enviar mensagem.", "Erro ao enviar mensagem:");
  }
}
