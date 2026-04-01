import { responderHtmlInstagram } from "@/lib/integracoes/instagram-callbacks";

type ContextoRota = {
  params: Promise<{
    confirmationCode: string;
  }>;
};

export async function GET(_request: Request, { params }: ContextoRota) {
  const { confirmationCode } = await params;

  return responderHtmlInstagram({
    titulo: "Instagram - exclusao de dados",
    descricao: "Recebemos a solicitacao de exclusao de dados da Meta. O acompanhamento detalhado desta rotina ainda esta em desenvolvimento no HYPE CRM.",
    detalhes: [
      { label: "Confirmation code", valor: confirmationCode },
      { label: "Status", valor: "Recebido e em preparacao" },
    ],
  });
}
