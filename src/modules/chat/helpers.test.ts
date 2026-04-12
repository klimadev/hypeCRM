import { describe, expect, it } from "vitest";
import { formatarTelefoneChat } from "@/modules/chat/helpers";

describe("formatarTelefoneChat", () => {
  it("formata numero BR completo com DDI", () => {
    expect(formatarTelefoneChat("5511998765432")).toBe("+55 (11) 99876-5432");
  });

  it("retorna fallback para telefone vazio", () => {
    expect(formatarTelefoneChat("")).toBe("-");
    expect(formatarTelefoneChat(null)).toBe("-");
    expect(formatarTelefoneChat(undefined)).toBe("-");
  });

  it("nao quebra com string sem digitos", () => {
    expect(formatarTelefoneChat("sem-telefone")).toBe("sem-telefone");
  });
});
