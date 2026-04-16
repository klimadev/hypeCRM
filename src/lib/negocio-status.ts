export type TipoStatusNegocio = "ABERTO" | "GANHO" | "PERDIDO";

export function normalizarTipoEstagioParaStatus(tipo: unknown): TipoStatusNegocio {
  if (typeof tipo !== "string") {
    return "ABERTO";
  }

  const tipoNormalizado = tipo.trim().toUpperCase();

  if (tipoNormalizado === "GANHO" || tipoNormalizado === "SUCCESS") {
    return "GANHO";
  }

  if (tipoNormalizado === "PERDIDO" || tipoNormalizado === "FALHA") {
    return "PERDIDO";
  }

  return "ABERTO";
}
