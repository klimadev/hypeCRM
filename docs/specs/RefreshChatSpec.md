# Spec: RefreshChatSpec

Scope: feature

# Refresh manual da inbox do chat

## Objetivo
Adicionar uma ação explícita de refresh da lista de conversas no módulo de chat, sem substituir a atualização automática existente via SSE. A intenção é dar controle operacional para atualizar a inbox sob demanda, com feedback visual claro e discreto, preservando o padrão executivo atual do chat.

## Escopo funcional
- Inserir uma ação manual de refresh na área superior da sidebar/inbox.
- Reaproveitar o fluxo já existente de `recarregar()` vindo de `useChatData`.
- Exibir estado de carregamento do refresh sem criar experiência paralela ao carregamento da inbox.
- Manter `ultimoSyncEm` como principal referência de atualização mais recente.
- Preservar busca, paginação e sincronização automática já existentes.

## Comportamento esperado
- O usuário pode acionar o refresh manual da inbox a qualquer momento a partir do header da sidebar.
- Ao clicar, a ação dispara a recarga da primeira página respeitando a busca atual.
- Enquanto a atualização estiver em andamento, o controle visual entra em estado de loading/desabilitado.
- Após sucesso, a lista refletirá os dados mais recentes e `ultimoSyncEm` seguirá como indicador de atualização.
- Em caso de erro, o estado de erro já existente da inbox continua sendo a fonte principal de feedback.

## Regras de UX/UI
- O controle deve ser discreto e alinhado ao estilo atual do chat: operacional, dark, executivo, sem visual chamativo.
- O affordance principal deve ser um ícone com tooltip curta.
- O loading deve ser visível sem poluir a interface.
- O botão não deve competir visualmente com `Nova conversa`, busca ou filtros.
- Em mobile e desktop, a posição deve continuar lógica e acessível.

## Restrições técnicas
- Não duplicar lógica de fetch.
- Não introduzir polling adicional.
- Não quebrar o fluxo de SSE já existente.
- Preferir propagar estado existente ao invés de criar um segundo estado artificial de refresh, salvo se estritamente necessário para feedback fino.

## Arquivos provavelmente envolvidos
- `src/modules/chat/hooks/use-chat-data.ts`
- `src/modules/chat/hooks/use-chat-module.ts`
- `src/modules/chat/page.tsx`
- `src/modules/chat/components/chat-sidebar.tsx`

## Critérios de aceite
- Existe um controle manual de refresh visível na inbox.
- O refresh atualiza a lista de conversas sem reset indevido da busca atual.
- O usuário recebe feedback visual de loading durante a ação.
- O comportamento não conflita com SSE, filtros ou paginação.
- O layout permanece consistente com o padrão atual do módulo.
- O projeto valida com `npm run pm2:prod`.

## Fora de escopo
- Refresh manual da thread de mensagens individual.
- Mudanças de arquitetura de sincronização.
- Novo sistema de status além do já exibido no header.