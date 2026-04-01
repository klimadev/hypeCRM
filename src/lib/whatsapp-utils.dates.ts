export function normalizarTimestampParaIso(timestamp: number | null | undefined): string {
  if (!timestamp || typeof timestamp !== "number") {
    return new Date().toISOString();
  }

  const timestampMs = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(timestampMs).toISOString();
}

export function normalizarTimestampParaDate(timestamp: number | null | undefined): Date {
  if (!timestamp || typeof timestamp !== "number") {
    return new Date();
  }

  const timestampMs = timestamp < 1_000_000_000_000 ? timestamp * 1000 : timestamp;
  return new Date(timestampMs);
}

export function formatarDataBr(timestamp: number | null | undefined): string {
  const data = normalizarTimestampParaDate(timestamp);
  return data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatarHoraBr(timestamp: number | null | undefined): string {
  const data = normalizarTimestampParaDate(timestamp);
  return data.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatarDataMensagemWhatsapp(timestamp: number | null | undefined): string {
  const data = normalizarTimestampParaDate(timestamp);
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dataMsg = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diffDias = Math.floor((hoje.getTime() - dataMsg.getTime()) / (1000 * 60 * 60 * 24));
  const hora = data.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  if (diffDias === 0) return hora;
  if (diffDias === 1) return `Ontem ${hora}`;
  if (diffDias > 1 && diffDias < 7) {
    const diaSemana = data.toLocaleString("pt-BR", { weekday: "long" });
    return `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${hora}`;
  }
  if (data.getFullYear() === agora.getFullYear()) {
    return `${data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit" })} ${hora}`;
  }

  return `${data.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })} ${hora}`;
}

export function formatarLabelSeparadorData(timestamp: number | null | undefined): string {
  const data = normalizarTimestampParaDate(timestamp);
  const agora = new Date();
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  const dataMsg = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  const diffDias = Math.floor((hoje.getTime() - dataMsg.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDias === 0) return "Hoje";
  if (diffDias === 1) return "Ontem";
  if (diffDias > 1 && diffDias < 7) {
    const diaSemana = data.toLocaleString("pt-BR", { weekday: "long" });
    return diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
  }
  if (data.getFullYear() === agora.getFullYear()) {
    return data.toLocaleString("pt-BR", { day: "numeric", month: "long" });
  }

  return data.toLocaleString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
