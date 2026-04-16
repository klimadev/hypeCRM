import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { criarPayloadTesteMeta } from "./route";

describe("criarPayloadTesteMeta", () => {
  it("monta payload padrao com user_data suficiente para teste de token/pixel", () => {
    const request = new NextRequest("http://localhost:3434/api/integracoes/meta/test", {
      headers: {
        "x-forwarded-for": "203.0.113.9",
        "user-agent": "vitest-agent",
      },
    });

    const payload = criarPayloadTesteMeta(request, "empresa-1", "lead_closed");
    const evento = payload.data[0] as Record<string, unknown>;
    const userData = evento.user_data as Record<string, unknown>;
    const customData = evento.custom_data as Record<string, unknown>;

    expect(evento.event_name).toBe("lead_closed");
    expect(evento.action_source).toBe("system_generated");
    expect(evento.event_id).toBeTypeOf("string");
    expect(userData.external_id).toBe("empresa:empresa-1");
    expect(userData.client_ip_address).toBe("203.0.113.9");
    expect(userData.client_user_agent).toBe("vitest-agent");
    expect(customData.event_source).toBe("crm");
  });

  it("preserva payload customizado enviado no body", () => {
    const request = new NextRequest("http://localhost:3434/api/integracoes/meta/test");
    const payloadCustomizado = {
      data: [
        {
          event_name: "Purchase",
          event_time: 123,
          action_source: "website",
          user_data: { external_id: "abc" },
        },
      ],
      test_event_code: "TEST123",
    };

    const payload = criarPayloadTesteMeta(request, "empresa-1", "lead_closed", payloadCustomizado);

    expect(payload).toEqual(payloadCustomizado);
  });
});
