---
plan name: ChatUnreadOrder
plan description: Unread badge sort
plan status: done
---

## Idea
Corrigir a inbox unificada para que o indicador de mensagens não lidas reflita o estado real das conversas do WhatsApp, inclusive quando ainda não há lead vinculado ou quando o banco local não foi atualizado pela tela de mensagens, e para que a ordenação da lista use a atividade mais recente confiável da conversa em vez de depender apenas de `messageTimestamp` nulo/incompleto vindo do chat bruto. O plano deve alinhar refresh manual e atualização automática via stream com a mesma regra de ordenação e contagem.

## Implementation
- Mapear o fluxo atual de dados da inbox unificada (`/api/chat/all` e `/api/chat/stream`) até `chat-unificado.ts`, identificando exatamente onde `unreadCount` e `ultimaMensagem.timestamp` são derivados.
- Substituir a lógica de `unreadCount` baseada apenas em `id_lead` por uma estratégia que também cubra conversas sem vínculo e mensagens persistidas por telefone/JID, reaproveitando o critério já existente em `criarWhereLeadMensagensRealtime`.
- Definir uma fonte de verdade para atividade recente da conversa, com fallback quando `conv.messageTimestamp` vier nulo, priorizando dados confiáveis da última mensagem e preservando ordenação consistente entre fetch inicial, refresh manual e stream.
- Garantir que o refresh da inbox produza o mesmo resultado no backend e no estado cliente, incluindo chats que mudam de posição após nova mensagem e evitando manter timestamps zerados que impedem reordenação.
- Cobrir explicitamente os cenários reais já investigados em `hype_lima_pessoal` e acrescentar um caso para badge de não lidas em chat com mensagem recebida não marcada como lida.
- Validar a solução com leitura controlada dos snapshots e, na fase de implementação, executar a validação oficial do projeto com `npm run pm2:prod`.

## Required Specs
<!-- SPECS_START -->
- ChatUnreadOrderFeature
<!-- SPECS_END -->