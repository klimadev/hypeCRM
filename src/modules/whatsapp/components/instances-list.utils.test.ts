import { describe, expect, it } from "vitest";
import { calculateUptimeWhatsapp, getInitialsWhatsapp, getStatusBadgeWhatsapp } from "./instances-list.utils";

describe("getStatusBadgeWhatsapp", () => {
  it("retorna status conectado e desconectado", () => {
    expect(getStatusBadgeWhatsapp({ status: "open", phone: "5511" }).labelShort).toBe("Online");
    expect(getStatusBadgeWhatsapp({ status: "close", phone: null }).labelShort).toBe("Offline");
  });
});

describe("getInitialsWhatsapp", () => {
  it("retorna ate duas iniciais", () => {
    expect(getInitialsWhatsapp("Maria Silva")).toBe("MS");
  });
});

describe("calculateUptimeWhatsapp", () => {
  it("retorna placeholder quando nao ha lastSeenAt", () => {
    expect(calculateUptimeWhatsapp(null)).toBe("—");
  });
});
