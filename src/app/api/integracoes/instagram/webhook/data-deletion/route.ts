import { ok } from "@/lib/api/http";
import { gerarConfirmationCode, validarSignedRequestMeta } from "@/lib/integracoes/instagram-callbacks";

export async function POST(request: Request) {
  const validacao = await validarSignedRequestMeta(request);

  if (!validacao.ok) {
    return validacao.response;
  }

  const confirmationCode = gerarConfirmationCode();
  const url = new URL(request.url);
  const statusUrl = new URL(`/api/integracoes/instagram/webhook/data-deletion/status/${confirmationCode}`, url.origin);

  return ok({
    url: statusUrl.toString(),
    confirmation_code: confirmationCode,
  });
}
