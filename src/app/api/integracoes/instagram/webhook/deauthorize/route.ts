import { NextResponse } from "next/server";
import { validarSignedRequestMeta } from "@/lib/integracoes/instagram-callbacks";

export async function POST(request: Request) {
  const validacao = await validarSignedRequestMeta(request);

  if (!validacao.ok) {
    return validacao.response;
  }

  return new NextResponse(null, { status: 204 });
}
