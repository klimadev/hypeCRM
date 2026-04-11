import { z } from "zod";

const GATILHOS_VALIDOS = ["lead_criado"] as const;

export const esquemaAutomacaoWorkspace = z.object({
  rascunho_grafo_json: z.string().min(1),
});

export const esquemaConfigurarNode = z.object({
  nodeId: z.string().min(1),
  config: z.object({
    messageTemplate: z.string().min(1),
    whatsappInstanceId: z.string().min(1),
    sendToLeadPhone: z.boolean().optional(),
    manualPhones: z.array(z.string().min(1)).optional(),
  }),
});

export const esquemaDispararAutomacao = z.object({
  tipo: z.enum(GATILHOS_VALIDOS),
  negocioId: z.string().optional(),
  leadId: z.string().optional(),
  telefone: z.string().optional(),
});

export type TipoGatilho = (typeof GATILHOS_VALIDOS)[number];

export function mensagemErroValidacao(error: z.ZodError): string {
  const problemas = error.issues.map((issue) => issue.message);
  return problemas.join("; ");
}
