import { z } from "zod";

export const esquemaAcaoAutomacao = z.object({
  tipo: z.enum(["WHATSAPP_MSG"], { message: "Tipo de acao invalido." }),
  ordem: z.coerce.number().int().min(0),
  delay_minutos: z.coerce.number().int().min(0).max(43200).default(0),
  id_instancia_whatsapp: z.string().trim().optional(),
  telefone_destino: z.string().trim().optional(),
  id_lead_destino: z.string().trim().optional(),
  mensagem: z.string().trim().min(1, "Mensagem obrigatoria.").max(4096),
});

export const esquemaConfigStageChange = z.object({
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaCriarAutomacao = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").max(100),
  fonte: z.enum(["WHATSAPP"], { message: "Fonte invalida." }),
  gatilho: z.enum(["STAGE_CHANGE"], { message: "Gatilho invalido." }),
  ativo: z.boolean().default(true),
  acoes: z.array(esquemaAcaoAutomacao).min(1, "Ao menos uma acao e obrigatoria."),
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaAtualizarAutomacao = z.object({
  nome: z.string().trim().min(2).max(100).optional(),
  ativo: z.boolean().optional(),
  acoes: z.array(esquemaAcaoAutomacao).min(1).optional(),
  id_estagio_destino: z.string().trim().optional(),
});

export const esquemaDispatchQuery = z.object({
  only: z.enum(["whatsapp"]).optional(),
  automacao_id: z.string().trim().optional(),
  teste: z.enum(["true"]).optional(),
  lead_id: z.string().trim().optional(),
});

export type AcaoAutomacaoInput = z.infer<typeof esquemaAcaoAutomacao>;
export type CriarAutomacaoInput = z.infer<typeof esquemaCriarAutomacao>;
export type AtualizarAutomacaoInput = z.infer<typeof esquemaAtualizarAutomacao>;
