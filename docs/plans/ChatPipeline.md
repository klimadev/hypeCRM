---
plan name: ChatPipeline
plan description: Choose pipeline stage
plan status: done
---

## Idea
Permitir que a criação de negócio pelo chat escolha explicitamente o pipeline e a etapa inicial, em vez de depender apenas do pipeline principal ou do estágio herdado automaticamente. A solução deve evoluir o `ChatOrphanDialog` para carregar pipelines e etapas de forma clara e leve, reaproveitando contratos e padrões já existentes no CRM/kanban, sem criar uma experiência pesada dentro do chat.

## Implementation
- Mapear o fluxo atual de `Criar negócio` entre `chat-panel.tsx`, `chat-orphan-dialog.tsx`, `use-chat-module.ts` e `/api/chat/orphan/criar-negocio/route.ts`, identificando o ponto exato em que hoje apenas `id_estagio` é inferido/enviado.
- Definir a UX do diálogo para escolha explícita de pipeline e etapa, usando os padrões de `Select` já existentes no módulo de chat e mantendo a experiência enxuta para contexto operacional.
- Planejar o carregamento de pipelines ativos e suas etapas de forma progressiva, preferindo reaproveitar APIs já existentes e garantindo que a troca de pipeline recalcule as etapas disponíveis com defaults seguros.
- Ajustar o contrato frontend/backend para enviar a etapa escolhida de forma inequívoca e, se necessário, reforçar a validação para garantir que a etapa pertence ao pipeline selecionado.
- Executar a implementação mínima ponta a ponta no diálogo, ação do chat e rota da API, depois validar com `npm run pm2:prod` para confirmar integração e build sem regressão no fluxo de criação de negócio.

## Required Specs
<!-- SPECS_START -->
- ChatPipelineSpec
<!-- SPECS_END -->