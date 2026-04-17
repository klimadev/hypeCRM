import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  buscarMensagensPorContatoMock,
  resolverDestinoConversaWhatsappMock,
  whatsappInstanciaFindFirstMock,
  whatsappMensagemUpsertMock,
  whatsappMensagemCountMock,
  whatsappMensagemFindManyMock,
} = vi.hoisted(() => ({
  buscarMensagensPorContatoMock: vi.fn(),
  resolverDestinoConversaWhatsappMock: vi.fn(),
  whatsappInstanciaFindFirstMock: vi.fn(),
  whatsappMensagemUpsertMock: vi.fn(),
  whatsappMensagemCountMock: vi.fn(),
  whatsappMensagemFindManyMock: vi.fn(),
}));

vi.mock("@/lib/evolution-api.chat", () => ({
  buscarMensagensPorContato: buscarMensagensPorContatoMock,
}));

vi.mock("@/lib/chat-remote-jid", () => ({
  extrairTelefoneDeRemoteJid: (remoteJid: string) => remoteJid.replace(/@.*/, "").replace(/\D/g, ""),
  resolverDestinoConversaWhatsapp: resolverDestinoConversaWhatsappMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    whatsappInstancia: {
      findFirst: whatsappInstanciaFindFirstMock,
    },
    whatsappMensagem: {
      upsert: whatsappMensagemUpsertMock,
      count: whatsappMensagemCountMock,
      findMany: whatsappMensagemFindManyMock,
    },
  },
}));

import { obterSnapshotMensagensPersistente } from "./chat-messages-persistence";

describe("chat-messages-persistence", () => {
  const mensagensPersistidas: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    mensagensPersistidas.length = 0;
    vi.clearAllMocks();

    resolverDestinoConversaWhatsappMock.mockResolvedValue({
      lookupRemoteJid: "5511999999999@s.whatsapp.net",
      telefone: "5511999999999",
    });

    whatsappInstanciaFindFirstMock.mockResolvedValue({ id: "inst-1" });

    whatsappMensagemUpsertMock.mockImplementation(async ({ create }: { create: Record<string, unknown> }) => {
      mensagensPersistidas.push({
        id: create.id,
        remote_jid: create.remote_jid,
        remote_jid_alt: create.remote_jid_alt,
        from_me: create.from_me,
        conteudo: create.conteudo,
        tipo: create.tipo,
        timestamp: create.timestamp,
        push_name: create.push_name,
        status: create.status,
      });
    });

    whatsappMensagemCountMock.mockImplementation(async () => mensagensPersistidas.length);
    whatsappMensagemFindManyMock.mockImplementation(async () => mensagensPersistidas);

    buscarMensagensPorContatoMock.mockResolvedValue({
      hasMore: false,
      messages: [
        {
          id: "m-1",
          remoteJid: "1203630@lid",
          remoteJidAlt: "5511999999999@s.whatsapp.net",
          fromMe: false,
          text: "oi",
          kind: "conversation",
          timestamp: 1710000000,
          pushName: "Contato",
          status: "DELIVERED",
          hasMedia: false,
          mediaUrl: null,
        },
      ],
    });
  });

  it("preserva mensagens cujo identificador útil está em remoteJidAlt", async () => {
    const snapshot = await obterSnapshotMensagensPersistente({
      idEmpresa: "empresa-1",
      instanceName: "hype_lima_pessoal",
      remoteJid: "5551999999999@s.whatsapp.net",
      page: 1,
      limite: 50,
    });

    expect(buscarMensagensPorContatoMock).toHaveBeenCalledWith(
      "hype_lima_pessoal",
      "5511999999999@s.whatsapp.net",
      1,
      50,
    );
    expect(whatsappMensagemUpsertMock).toHaveBeenCalledTimes(1);
    expect(snapshot.messages).toHaveLength(1);
    expect(snapshot.messages[0]).toMatchObject({
      remoteJid: "1203630@lid",
      text: "oi",
      kind: "conversation",
    });
  });
});
