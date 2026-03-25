# Kanban Tablet Compacto

## Objetivo

Aproveitar melhor a tela de tablet sem voltar ao excesso de colunas do desktop.

## Direção

- Tablet deve mostrar 2 ou 3 colunas, dependendo da largura.
- Colunas podem ser recolhíveis para reduzir ruído.
- O usuário precisa conseguir alternar foco entre colunas sem perder densidade operacional.

## Estrutura proposta

### Breakpoints

- `md`: 2 colunas.
- `lg`: 3 colunas.
- `xl`: 4 colunas, apenas se a largura útil realmente suportar.

### Colunas

- Header compacto com nome do estágio e contagem.
- Toggle de collapse.
- Scroll interno quando a coluna exceder a altura útil.

### Cards

- Card ligeiramente mais denso que mobile.
- Linha de metadados reduzida.
- Ações secundárias condensadas.

## Estado recomendado

- `collapsedColumns: Record<stageId, boolean>`.
- Persistência opcional em `localStorage`.
- Reset lógico quando a lista de estágios mudar.

## Comportamento esperado

- Colunas recolhidas não devem remover o acesso ao estágio.
- O usuário deve poder expandir uma coluna rapidamente.
- A área principal não deve “saltar” ao colapsar e expandir.

## CSS/Flexbox/Grid recomendado

- Grid principal com `grid gap-3`.
- Ajuste de colunas via `grid-template-columns`.
- Colunas com `min-h-0` e `overflow-hidden`.
- Lista interna com `overflow-y-auto`.

## Arquivos envolvidos

- `src/modules/kanban/components/kanban-board.tsx`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts`
- `src/modules/kanban/types.ts`

## Critérios de aceite

- Tablet não parece uma versão “espremida” do desktop.
- Há leitura confortável sem exigir zoom.
- O usuário consegue operar várias colunas com pouca rolagem lateral.
