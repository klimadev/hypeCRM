import { beforeEach, describe, expect, it, vi } from "vitest";
import { marcarMensagensComoLidasEvolution } from "./whatsapp-chat.evolution";

describe("marcarMensagensComoLidasEvolution", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("propaga erro quando a Evolution rejeita a marcacao de leitura", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn().mockResolvedValue({ message: "falha remota" }),
    }));

    await expect(
      marcarMensagensComoLidasEvolution("instancia-1", [
        { remoteJid: "5511999999999@s.whatsapp.net", id: "msg-1" },
      ]),
    ).rejects.toThrow("falha remota");
  });
});
