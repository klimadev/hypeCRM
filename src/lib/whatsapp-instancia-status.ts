type InstanciaWhatsappStatusBase = {
  status?: string | null;
  phone?: string | null;
};

const STATUSS_INSTANCIA_WHATSAPP_CONECTADA = new Set([
  "connected",
  "open",
  "online",
]);

const STATUSS_INSTANCIA_WHATSAPP_NAO_CONECTADA = new Set([
  "close",
  "closed",
  "connecting",
  "creating",
  "disconnected",
  "error",
  "loading",
  "offline",
  "pending",
  "qrcode",
  "qr_code",
]);

export function normalizarStatusInstanciaWhatsapp(status?: string | null): string {
  if (typeof status !== "string") {
    return "unknown";
  }

  const statusNormalizado = status.trim().toLowerCase();
  return statusNormalizado.length > 0 ? statusNormalizado : "unknown";
}

export function instanciaWhatsappEstaConectada(instancia: InstanciaWhatsappStatusBase): boolean {
  const statusNormalizado = normalizarStatusInstanciaWhatsapp(instancia.status);

  if (STATUSS_INSTANCIA_WHATSAPP_CONECTADA.has(statusNormalizado)) {
    return true;
  }

  if (STATUSS_INSTANCIA_WHATSAPP_NAO_CONECTADA.has(statusNormalizado)) {
    return false;
  }

  return statusNormalizado === "unknown" && typeof instancia.phone === "string" && instancia.phone.trim().length > 0;
}
