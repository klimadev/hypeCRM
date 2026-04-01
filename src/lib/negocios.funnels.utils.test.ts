import { describe, expect, it } from "vitest";
import { criarResultadoFunilVazio } from "@/lib/negocios.funnels.utils";

describe("criarResultadoFunilVazio", () => {
  it("retorna estrutura vazia consistente", () => {
    expect(criarResultadoFunilVazio()).toEqual({
      funil: null,
      estagios: [],
    });
  });
});
