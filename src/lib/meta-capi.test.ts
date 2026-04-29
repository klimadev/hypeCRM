import { describe, expect, it } from "vitest";
import type { NegocioResumo } from "@/lib/negocios.types";
import { criarPayloadMetaCapiFechamento } from "./meta-capi";

describe("criarPayloadMetaCapiFechamento", () => {
  it("monta Purchase com value e currency usando o valor fechado", () => {
    const payload = criarPayloadMetaCapiFechamento({
      idEmpresa: "empresa-1",
      negocio: {
        id: "negocio-1",
        valor_estimado: 1500,
        valor_fechado: 1250.5,
        data_fechamento: new Date("2026-04-22T10:00:00.000Z"),
        estagio: { nome: "Fechado ganho" },
      } as NegocioResumo,
      telefoneHash: "telefone-hash",
      emailHash: "email-hash",
    });

    expect(payload.event_name).toBe("Purchase");
    expect(payload.action_source).toBe("system_generated");
    expect(payload.user_data).toEqual({
      ph: "telefone-hash",
      em: "email-hash",
    });
    expect(payload.custom_data).toMatchObject({
      event_source: "crm",
      lead_event_source: "Hype CRM",
      value: 1250.5,
      currency: "BRL",
      negocio_id: "negocio-1",
      etapa: "Fechado ganho",
    });
  });
});
