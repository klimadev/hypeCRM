import { z } from "zod";
import { parseHorarioTexto, MENSAGENS_ERRO } from "@/lib/parse-horario-texto";

export const esquemaHorarioTexto = z
  .string()
  .trim()
  .min(1, MENSAGENS_ERRO.HORARIO_VAZIO)
  .max(20, MENSAGENS_ERRO.HORARIO_MUITO_LONGO)
  .refine(
    (val) => {
      const result = parseHorarioTexto(val);
      return result.ok;
    },
    {
      message: MENSAGENS_ERRO.HORARIO_FORMATO_INVALIDO,
    },
  );

type HorarioTextoRaw = z.infer<typeof esquemaHorarioTexto>;

export type HorarioTexto = string;

export function normalizarHorarioSchema(val: HorarioTextoRaw): string | null {
  const result = parseHorarioTexto(val);
  return result.ok ? result.normalized : null;
}

export function normalizarBuscaFuncionarios(valor?: string) {
  return valor?.trim().toLowerCase() ?? "";
}

export function mensagemErroValidacao(erro: z.ZodError) {
  return erro.issues[0]?.message ?? "Dados invalidos.";
}
