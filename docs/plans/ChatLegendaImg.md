---
plan name: ChatLegendaImg
plan description: Legendas no chat
plan status: done
---

## Idea
Exibir legendas de mensagens de imagem no chat unificado. Hoje a API já entrega o texto da legenda em `UnifiedChatMessage.text` para `imageMessage` e `videoMessage` a partir da Evolution/Instagram, mas a UI em `src/modules/chat/components/chat-message-list.tsx` bloqueia a renderização desse texto quando a mensagem possui mídia. O trabalho deve focar apenas no chat unificado, preservando o layout atual, evitando mostrar placeholders redundantes como `📷 Imagem` quando não houver legenda real, e validando o comportamento final com o comando obrigatório do projeto.

## Implementation
- Revisar o contrato de `UnifiedChatMessage` e confirmar quando `text` representa legenda real versus placeholder para `imageMessage` no chat unificado.
- Ajustar `src/modules/chat/components/chat-message-list.tsx` para renderizar legenda abaixo da imagem quando houver conteúdo útil, mantendo o comportamento atual para outros tipos de mídia.
- Garantir que a UI não exiba texto redundante para imagens sem legenda, usando fallback visual atual apenas para a mídia.
- Verificar se o mesmo critério precisa ser aplicado a vídeos no chat unificado ou se a entrega deve permanecer restrita a imagens conforme o escopo definido.
- Validar manualmente o fluxo carregado e executar `npm run pm2:prod` ao final para confirmar build e execução em modo produção.

## Required Specs
<!-- SPECS_START -->
- LegendaImg
<!-- SPECS_END -->