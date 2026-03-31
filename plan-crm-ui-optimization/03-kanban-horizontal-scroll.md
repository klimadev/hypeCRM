# Kanban Horizontal

## Objetivo

Garantir que as 8 stages do deals kanban permaneçam em uma única linha horizontal, com scroll lateral interno, sem quebra vertical.

## Problema observado

Hoje as colunas tentam se reorganizar em grid responsivo, o que faz:

- as stages empilharem verticalmente em telas menores;
- o board perder consistência visual;
- o usuário perder a leitura sequencial do funil.

Arquivo principal:

- `src/modules/kanban/components/kanban-board.tsx`

## Solução

### Board desktop e tablet

Trocar a lógica de grid que permite wrapping por um container de linha única:

- `flex`
- `flex-nowrap`
- `gap-4`
- `overflow-x-auto`
- `overflow-y-hidden`

Cada stage vira um item com largura fixa ou semi-fixa:

- `min-w-[280px]`
- `max-w-[320px]`
- `shrink-0`

### Colunas

Cada coluna deve manter:

- `h-full`
- `min-h-0`
- `overflow-hidden`
- `flex flex-col`

Se a lista interna ficar maior que a altura útil, o scroll deve acontecer dentro da coluna:

- `overflow-y-auto`
- `min-h-0`

### Board wrapper

O wrapper do kanban deve ter:

- `w-full`
- `max-w-full`
- `overflow-x-auto`
- `overscroll-x-contain`
- `pb-2`

Isso permite rolagem horizontal sem quebrar o layout geral.

## Flexbox recomendado

- `display: flex` para alinhar as stages em linha.
- `flex-wrap: nowrap` para impedir quebra.
- `flex-shrink: 0` nas colunas para preservar largura.
- `min-width` por coluna para manter cards legíveis.

## Quando usar Grid

Grid não deve ser o layout principal para as 8 stages nesse caso.
Se houver grid, ele só deve existir internamente em subcomponentes que não afetem o fluxo horizontal do board.

## Critérios de aceite

- As 8 colunas nunca empilham verticalmente.
- O board permanece em uma linha.
- Em largura pequena, o usuário rola horizontalmente.
- A altura do board não explode por conta do conteúdo de uma coluna.

