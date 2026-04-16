---
plan name: chat-slash-followup
plan description: slash menu follow-up
plan status: active
---

## Idea
Mover a operacao principal de cadencia de follow-up do drawer lateral de detalhes para o composer do chat, usando o gatilho `/` para abrir um menu flutuante de 2 niveis. No primeiro nivel, o usuario escolhe entre `Acoes rapidas` e `Cadencia de follow-ups`. No segundo nivel, `Acoes rapidas` reutiliza a lista atual de atalhos por slash, enquanto `Cadencia de follow-ups` passa a exibir e acionar o estado da conversa diretamente dentro do chat, sem depender da abertura do drawer. A implementacao deve preservar o comportamento atual de atalhos, manter o estado de follow-up centralizado no ChatPanel, desacoplar o carregamento de follow-up do estado do drawer, e remover a duplicidade operacional do card atual no painel lateral.

## Implementation
- Mapear e ajustar o fluxo de estado do follow-up em `src/modules/chat/components/chat-panel.tsx` para que carregamento, polling e handlers deixem de depender de `detalhesAbertos` e possam abastecer a area central do chat.
- Expandir `src/modules/chat/components/chat-messages-panel.tsx` para receber e repassar ao composer todas as props de follow-up necessarias para renderizacao, status e acoes do submenu flutuante.
- Refatorar `src/modules/chat/components/chat-message-composer.tsx` para substituir o menu atual de atalhos por um slash menu hierarquico com estados explicitos de `menu principal`, `atalhos` e `follow-up`, preservando envio de mensagem, agendamento e navegacao por teclado.
- Evoluir `src/modules/chat/shortcuts-composer.ts` e seus testes em `src/modules/chat/shortcuts-composer.test.ts` para suportar a maquina de estados do slash menu em 2 niveis, incluindo abertura com `/`, transicao entre submenu, navegacao, confirmacao e fechamento.
- Criar componentes visuais dedicados para o slash menu no modulo de chat, como um menu raiz com as opcoes `Acoes rapidas` e `Cadencia de follow-ups`, e um painel compacto de follow-up para ativar, pausar, retomar, encerrar ou reativar a cadencia da conversa.
- Remover `src/modules/chat/components/chat-follow-up-card.tsx` do papel de ponto principal de operacao no drawer e decidir entre eliminar seu uso ou reduzi-lo a um resumo read-only para evitar duplicidade de comando.
- Validar a mudanca com foco em navegacao por teclado, disponibilidade apenas para conversas WhatsApp com lead vinculado, consistencia dos estados de loading e toasts, e executar `pnpm lint`, `pnpm typecheck` e `pnpm build` ao final da implementacao.

## Required Specs
<!-- SPECS_START -->
- chat-followup-slash
<!-- SPECS_END -->