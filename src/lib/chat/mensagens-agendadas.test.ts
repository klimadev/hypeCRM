import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mensagemAgendadaFindManyMock,
  mensagemAgendadaUpdateManyMock,
  mensagemAgendadaUpdateMock,
  followUpConversaUpdateManyMock,
  enviarMensagemTextoMock,
  enviarMidiaWhatsappMock,
  agendarProximoFollowUpMock,
} = vi.hoisted(() => ({
  mensagemAgendadaFindManyMock: vi.fn(),
  mensagemAgendadaUpdateManyMock: vi.fn(),
  mensagemAgendadaUpdateMock: vi.fn(),
  followUpConversaUpdateManyMock: vi.fn(),
  enviarMensagemTextoMock: vi.fn(),
  enviarMidiaWhatsappMock: vi.fn(),
  agendarProximoFollowUpMock: vi.fn(),
}));

vi.mock("@/lib/evolution-api.instances", () => ({
  enviarMensagemTexto: enviarMensagemTextoMock,
  enviarMidiaWhatsapp: enviarMidiaWhatsappMock,
}));

vi.mock("@/lib/integracoes/instagram-inbox", () => ({
  enviarMensagemInstagram: vi.fn(),
}));

vi.mock("@/lib/chat/follow-up", () => ({
  agendarProximoFollowUp: agendarProximoFollowUpMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mensagemAgendada: {
      findMany: mensagemAgendadaFindManyMock,
      updateMany: mensagemAgendadaUpdateManyMock,
      update: mensagemAgendadaUpdateMock,
    },
    followUpConversa: {
      updateMany: followUpConversaUpdateManyMock,
    },
    empresa: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: {
      mensagemAgendada: { update: typeof mensagemAgendadaUpdateMock };
      followUpConversa: { updateMany: typeof followUpConversaUpdateManyMock };
    }) => Promise<void>) =>
      callback({
        mensagemAgendada: { update: mensagemAgendadaUpdateMock },
        followUpConversa: { updateMany: followUpConversaUpdateManyMock },
      })),
  },
}));

import { processarMensagensAgendadas } from "@/lib/chat/mensagens-agendadas";

describe("processarMensagensAgendadas follow-up", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mensagemAgendadaUpdateManyMock.mockResolvedValue({ count: 1 });
    mensagemAgendadaUpdateMock.mockResolvedValue({});
    enviarMensagemTextoMock.mockResolvedValue(undefined);
    enviarMidiaWhatsappMock.mockResolvedValue(undefined);
  });

  it("agenda a proxima etapa imediatamente apos envio de mensagem de follow-up", async () => {
    mensagemAgendadaFindManyMock.mockResolvedValue([
      {
        id: "msg-1",
        id_empresa: "emp-1",
        id_followup_conversa: "conv-1",
        instance_name: "inst-1",
        remote_jid: "5511999999999@c.us",
        conteudo: "Oi",
        followup_etapa: 1,
        followup_ciclo: 1,
      },
    ]);
    followUpConversaUpdateManyMock.mockResolvedValue({ count: 1 });

    const resultado = await processarMensagensAgendadas(20);

    expect(resultado).toEqual({ processadas: 1, enviadas: 1, falhas: 0, ignoradas: 0 });
    expect(followUpConversaUpdateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "conv-1",
          status: "ATIVO",
          etapa_atual: 1,
          ciclo_atual: 1,
        }),
      }),
    );
    expect(agendarProximoFollowUpMock).toHaveBeenCalledWith("conv-1");
  });

  it("nao tenta avancar follow-up para mensagem comum", async () => {
    mensagemAgendadaFindManyMock.mockResolvedValue([
      {
        id: "msg-2",
        id_empresa: "emp-1",
        id_followup_conversa: null,
        instance_name: "inst-1",
        remote_jid: "5511888888888@c.us",
        conteudo: "Mensagem avulsa",
        followup_etapa: null,
        followup_ciclo: null,
      },
    ]);

    const resultado = await processarMensagensAgendadas(20);

    expect(resultado).toEqual({ processadas: 1, enviadas: 1, falhas: 0, ignoradas: 0 });
    expect(followUpConversaUpdateManyMock).not.toHaveBeenCalled();
    expect(agendarProximoFollowUpMock).not.toHaveBeenCalled();
  });

  it("nao marca envio como falha quando agendamento do proximo follow-up falha", async () => {
    mensagemAgendadaFindManyMock.mockResolvedValue([
      {
        id: "msg-3",
        id_empresa: "emp-1",
        id_followup_conversa: "conv-3",
        instance_name: "inst-1",
        remote_jid: "5511777777777@c.us",
        conteudo: "Oi de novo",
        followup_etapa: 2,
        followup_ciclo: 1,
      },
    ]);
    followUpConversaUpdateManyMock.mockResolvedValue({ count: 1 });
    agendarProximoFollowUpMock.mockRejectedValue(new Error("falha ao agendar"));

    const resultado = await processarMensagensAgendadas(20);

    expect(resultado).toEqual({ processadas: 1, enviadas: 1, falhas: 0, ignoradas: 0 });
    expect(mensagemAgendadaUpdateMock).toHaveBeenCalledTimes(1);
    expect(mensagemAgendadaUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "msg-3" },
        data: expect.objectContaining({
          status: "ENVIADO",
          erro: null,
        }),
      }),
    );
  });

  it("envia midia quando a mensagem agendada guarda um anexo", async () => {
    mensagemAgendadaFindManyMock.mockResolvedValue([
      {
        id: "msg-4",
        id_empresa: "emp-1",
        id_followup_conversa: null,
        instance_name: "inst-1",
        remote_jid: "5511666666666@c.us",
        conteudo: "Legenda",
        tipo: "image",
        midia_base64: "aGVsbG8=",
        midia_mimetype: "image/png",
        midia_nome_arquivo: "foto.png",
        followup_etapa: null,
        followup_ciclo: null,
      },
    ]);

    const resultado = await processarMensagensAgendadas(20);

    expect(resultado).toEqual({ processadas: 1, enviadas: 1, falhas: 0, ignoradas: 0 });
    expect(enviarMensagemTextoMock).not.toHaveBeenCalled();
    expect(enviarMidiaWhatsappMock).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceName: "inst-1",
        telefone: "5511666666666",
        media: "aGVsbG8=",
        mimetype: "image/png",
        fileName: "foto.png",
        mediaType: "image",
        caption: "Legenda",
      }),
    );
  });
});
