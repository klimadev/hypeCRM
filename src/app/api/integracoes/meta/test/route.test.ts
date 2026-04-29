import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { criarPayloadTesteMeta } from "./route";

describe("criarPayloadTesteMeta", () => {
  it("monta payload padrao de Purchase com valor e moeda", () => {
    const request = new NextRequest("http://localhost:3434/api/integracoes/meta/test", {
      headers: {
        "x-forwarded-for": "203.0.113.9",
        "user-agent": "vitest-agent",
      },
    });

    const payload = criarPayloadTesteMeta(request, "empresa-1");
    const evento = payload.data[0] as Record<string, unknown>;
    const userData = evento.user_data as Record<string, unknown>;
    const customData = evento.custom_data as Record<string, unknown>;

    expect(evento.event_name).toBe("Purchase");
    expect(evento.action_source).toBe("system_generated");
    expect(evento.event_id).toBeTypeOf("string");
    expect(userData.em).toBeTypeOf("string");
    expect(userData.ph).toBeTypeOf("string");
    expect(userData.client_ip_address).toBe("203.0.113.9");
    expect(userData.client_user_agent).toBe("vitest-agent");
    expect(customData.lead_event_source).toBe("Hype CRM");
    expect(customData.event_source).toBe("crm");
    expect(customData.value).toBe(1);
    expect(customData.currency).toBe("BRL");
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

    const payload = criarPayloadTesteMeta(request, "empresa-1", payloadCustomizado);

    expect(payload).toEqual(payloadCustomizado);
  });
});
