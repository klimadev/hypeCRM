import { z } from "zod";

export const esquemaInstagramInboxQuery = z.object({
  conversationId: z.string().trim().min(1, "Conversation ID obrigatorio.").optional(),
});
