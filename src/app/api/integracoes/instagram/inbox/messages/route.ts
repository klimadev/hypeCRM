import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaSemPermissao } from "@/lib/permissoes";
import { enviarMensagemInstagram } from "@/lib/integracoes/instagram-inbox";
import { mensagemErroValidacao } from "@/lib/validacoes";
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
  const validacao = esquemaEnviarMensagemInstagram.safeParse(payload);

  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }

  try {
    const resultado = await enviarMensagemInstagram(
      auth.sessao.id_empresa,
      validacao.data.recipientId,
      validacao.data.texto,
    );

    return NextResponse.json(resultado);
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro ao enviar mensagem.";
    return NextResponse.json({ erro: mensagem }, { status: 500 });
  }
}
