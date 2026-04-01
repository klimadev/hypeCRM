import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/lib/api/http";
import { mensagemErroValidacao, esquemaMetaSignedRequest, esquemaInstagramOAuthCallbackQuery } from "@/lib/validacoes";

type PayloadSignedRequestMeta = {
  algorithm?: string;
  user_id?: string;
  issued_at?: number;
  [key: string]: unknown;
};

function decodificarBase64Url(valor: string) {
  const valorNormalizado = valor.replace(/-/g, "+").replace(/_/g, "/");
  const padding = valorNormalizado.length % 4 === 0 ? "" : "=".repeat(4 - (valorNormalizado.length % 4));
  return Buffer.from(`${valorNormalizado}${padding}`, "base64");
}

function obterMetaAppSecret() {
  return process.env.META_APP_SECRET?.trim() || process.env.INSTAGRAM_APP_SECRET?.trim() || null;
}

export function validarQueryOAuthInstagram(searchParams: URLSearchParams) {
  const validacao = esquemaInstagramOAuthCallbackQuery.safeParse({
    code: searchParams.get("code") ?? undefined,
    state: searchParams.get("state") ?? undefined,
    error: searchParams.get("error") ?? undefined,
    error_reason: searchParams.get("error_reason") ?? undefined,
    error_description: searchParams.get("error_description") ?? undefined,
  });

  if (!validacao.success) {
    return {
      ok: false as const,
      response: badRequest(mensagemErroValidacao(validacao.error)),
    };
  }

  return {
    ok: true as const,
    data: validacao.data,
  };
}

export function registrarCallbackOAuthInstagram(request: Request, query: Record<string, string | undefined>) {
  const url = new URL(request.url);

  console.info("[Instagram OAuth Callback]", {
    metodo: request.method,
    pathname: url.pathname,
    query,
    headers: {
      userAgent: request.headers.get("user-agent") ?? null,
      forwardedFor: request.headers.get("x-forwarded-for") ?? null,
      forwardedProto: request.headers.get("x-forwarded-proto") ?? null,
      host: request.headers.get("host") ?? null,
      referer: request.headers.get("referer") ?? null,
    },
    recebidoEm: new Date().toISOString(),
  });
}

export async function validarSignedRequestMeta(request: Request) {
  const segredo = obterMetaAppSecret();

  if (!segredo) {
    return {
      ok: false as const,
      response: serverError("META_APP_SECRET nao configurado."),
    };
  }

  const formData = await request.formData();
  const validacao = esquemaMetaSignedRequest.safeParse({
    signed_request: formData.get("signed_request"),
  });

  if (!validacao.success) {
    return {
      ok: false as const,
      response: badRequest(mensagemErroValidacao(validacao.error)),
    };
  }

  const signedRequest = validacao.data.signed_request;
  const [assinaturaCodificada, payloadCodificado, extra] = signedRequest.split(".");

  if (!assinaturaCodificada || !payloadCodificado || extra) {
    return {
      ok: false as const,
      response: badRequest("signed_request invalido."),
    };
  }

  const assinaturaRecebida = decodificarBase64Url(assinaturaCodificada);
  const assinaturaEsperada = createHmac("sha256", segredo)
    .update(payloadCodificado)
    .digest();

  if (assinaturaRecebida.length !== assinaturaEsperada.length || !timingSafeEqual(assinaturaRecebida, assinaturaEsperada)) {
    return {
      ok: false as const,
      response: badRequest("signed_request invalido."),
    };
  }

  let payload: PayloadSignedRequestMeta;

  try {
    payload = JSON.parse(decodificarBase64Url(payloadCodificado).toString("utf8")) as PayloadSignedRequestMeta;
  } catch {
    return {
      ok: false as const,
      response: badRequest("signed_request invalido."),
    };
  }

  if ((payload.algorithm ?? "").toUpperCase() !== "HMAC-SHA256") {
    return {
      ok: false as const,
      response: badRequest("signed_request invalido."),
    };
  }

  return {
    ok: true as const,
    data: payload,
  };
}

export function responderHtmlInstagram(input: {
  titulo: string;
  descricao: string;
  detalhes?: Array<{ label: string; valor: string }>;
  acao?: { href: string; label: string };
}) {
  const detalhesHtml = (input.detalhes ?? [])
    .map(({ label, valor }) => `<li><strong>${label}:</strong> ${valor}</li>`)
    .join("");
  const acaoHtml = input.acao
    ? `<a href="${input.acao.href}" style="display:inline-flex;margin-top:20px;align-items:center;justify-content:center;border-radius:999px;padding:11px 16px;border:1px solid rgba(139,92,246,0.24);background:rgba(139,92,246,0.14);color:#fafafa;text-decoration:none;font-weight:600;">${input.acao.label}</a>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.titulo}</title>
    <style>
      :root { color-scheme: dark; }
      body { margin: 0; font-family: Inter, Arial, sans-serif; background: #09090b; color: #fafafa; }
      main { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
      section { border: 1px solid rgba(255,255,255,0.08); background: linear-gradient(180deg, rgba(17,17,19,0.98), rgba(12,12,14,0.94)); border-radius: 24px; padding: 24px; }
      h1 { margin: 0 0 12px; font-size: 24px; letter-spacing: -0.02em; }
      p { margin: 0; color: #a1a1aa; line-height: 1.6; }
      ul { margin: 20px 0 0; padding-left: 18px; color: #d4d4d8; }
      li + li { margin-top: 8px; }
      strong { color: #fafafa; }
    </style>
  </head>
  <body>
    <main>
      <section>
        <h1>${input.titulo}</h1>
        <p>${input.descricao}</p>
        ${detalhesHtml ? `<ul>${detalhesHtml}</ul>` : ""}
        ${acaoHtml}
      </section>
    </main>
  </body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function gerarConfirmationCode() {
  return randomUUID().replace(/-/g, "");
}
