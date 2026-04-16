# Spec: chat-followup-slash

Scope: feature

# Chat slash menu com follow-up

## Objetivo
Mover a operacao principal de cadencia de follow-up do drawer lateral de detalhes para o composer do chat, usando o gatilho `/` para abrir um menu flutuante hierarquico dentro da experiencia central de conversa.

## Experiencia desejada
- Ao digitar `/` no composer, abrir um menu flutuante de primeiro nivel.
- O primeiro nivel deve mostrar exatamente duas opcoes:
  - `Acoes rapidas`
  - `Cadencia de follow-ups`
- Ao entrar em `Acoes rapidas`, exibir a lista atual de atalhos slash reutilizando a logica existente de filtragem, ordenacao por recencia e aplicacao do template ao texto.
- Ao entrar em `Cadencia de follow-ups`, exibir um painel compacto com o estado da conversa e as acoes operacionais da cadencia.
- O fluxo de follow-up deve acontecer sem exigir abertura do drawer lateral.

## Regras funcionais
- O slash menu deve suportar dois niveis de navegacao.
- `Acoes rapidas` continua sendo um submenu de atalhos.
- `Cadencia de follow-ups` continua operando sobre a conversa atual via APIs existentes de follow-up.
- O submenu de follow-up so pode ficar operacional quando:
  - o canal for `whatsapp`
  - existir `leadMatch` associado a conversa
- Quando nao houver follow-up ativo:
  - exibir seletor de template
  - permitir ativacao apenas se houver templates ativos
- Quando houver follow-up ativo ou encerrado:
  - exibir status atual
  - exibir dados operacionais relevantes da conversa
  - permitir as acoes compativeis com o estado atual: pausar, retomar, encerrar, reativar
- O comportamento atual de envio de mensagem deve ser preservado.
- O comportamento atual de agendamento de mensagem deve ser preservado.
- O comportamento atual de atalhos por slash deve ser preservado dentro do submenu `Acoes rapidas`.

## Comportamento de teclado
- `/` abre o menu principal quando estiver no inicio do texto e sem espacos.
- `/texto` deve permitir navegar para o contexto de atalhos filtrados sem quebrar o fluxo atual de busca.
- `ArrowUp` e `ArrowDown` devem navegar entre opcoes do menu atual.
- `Ctrl/Cmd+J` e `Ctrl/Cmd+K` devem continuar funcionando como alternativas de navegacao.
- `Enter` e `Tab` devem confirmar a opcao focada quando o menu estiver aberto.
- `Escape` deve fechar o submenu atual ou retornar um nivel, conforme o contexto.
- `Enter` continua enviando a mensagem quando o menu nao estiver capturando a interacao.
- `Shift+Enter` continua inserindo quebra de linha.

## Estrategia de estado
- O estado de negocio do follow-up deve continuar centralizado em `ChatPanel`.
- `ChatMessagesPanel` deve atuar como ponte de props entre `ChatPanel` e `ChatMessageComposer`.
- O carregamento de follow-up nao pode depender mais de `detalhesAbertos`.
- Ao trocar de conversa, o contexto de follow-up deve ser recarregado quando a conversa for elegivel.
- O polling ou refresh periodico deve permanecer disponivel mesmo sem o drawer, se necessario para manter o status consistente.

## Estrategia de UI
- O menu de slash deve ser exibido como overlay flutuante ancorado ao composer, aproveitando o padrao visual atual.
- O primeiro nivel deve funcionar como hub de ferramentas, nao como lista achatada de opcoes heterogeneas.
- O submenu de follow-up deve ser mais compacto que o card atual do drawer e adequado ao espaco do overlay.
- O drawer de detalhes nao deve continuar como ponto principal de operacao do follow-up.
- O card lateral atual pode ser removido da operacao principal ou reduzido a resumo read-only, evitando duplicidade de acoes.

## Arquivos envolvidos
- `src/modules/chat/components/chat-panel.tsx`
- `src/modules/chat/components/chat-messages-panel.tsx`
- `src/modules/chat/components/chat-message-composer.tsx`
- `src/modules/chat/shortcuts-composer.ts`
- `src/modules/chat/shortcuts-composer.test.ts`
- `src/modules/chat/components/chat-follow-up-card.tsx`
- novos componentes do slash menu no modulo de chat, se necessario
- `src/lib/api/chat-follow-up.ts` apenas se for preciso ajustar tipagem, sem alterar o contrato da API desnecessariamente

## Fora de escopo
- Alterar o backend de follow-up sem necessidade funcional concreta
- Mudar o modelo de dados de templates ou conversas de follow-up
- Alterar o fluxo de agendamento de mensagens fora do necessario para conviver com o novo slash menu
- Mudar a semantica dos atalhos slash existentes

## Validacao
- Validar navegacao por teclado do slash menu nos dois niveis.
- Validar disponibilidade e bloqueios corretos do submenu de follow-up.
- Validar ativacao, pausa, retomada, encerramento e reativacao.
- Validar que o drawer nao e mais necessario para operar follow-up.
- Executar `pnpm lint`, `pnpm typecheck` e `pnpm build` antes de concluir a implementacao.