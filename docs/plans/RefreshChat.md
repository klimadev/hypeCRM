---
plan name: RefreshChat
plan description: Manual inbox refresh
plan status: done
---

## Idea
Adicionar um refresh manual para a inbox do chat, preservando o layout executivo atual e reutilizando o fluxo já existente de `recarregar()` em `useChatData`. O objetivo é dar controle explícito de atualização da lista de conversas sem criar uma experiência paralela ao SSE, com feedback visual discreto no header/sidebar e sem poluir a interface.

## Implementation
- Mapear o fluxo atual de atualização da inbox entre `use-chat-data.ts`, `use-chat-module.ts` e `chat-sidebar.tsx`, confirmando onde o estado de carregamento e `ultimoSyncEm` já existem e onde falta apenas propagação de props.
- Definir a interação do refresh no header da sidebar, mantendo o padrão visual do `ChatFilterDock`: ícone discreto, tooltip, estado de loading e convivência clara com o status de sincronização existente.
- Planejar a passagem de `recarregar` e de um estado de feedback apropriado do hook para a sidebar, evitando duplicação de fetch e sem alterar o comportamento automático via SSE.
- Validar estados de UX e bordas de comportamento: clique durante carregamento, erros de atualização, atualização da data/hora de último sync e responsividade desktop/mobile.
- Executar a implementação mínima necessária conectando hook, page/shell e sidebar, depois validar com `npm run pm2:prod` para confirmar build e funcionamento geral sem regressão visual.

## Required Specs
<!-- SPECS_START -->
- RefreshChatSpec
<!-- SPECS_END -->