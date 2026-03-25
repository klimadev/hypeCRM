# Kanban Mobile Tabbed

## Objetivo

Substituir a tentativa de mostrar várias colunas ao mesmo tempo em telas pequenas por uma experiência com abas por estágio.

## Problema atual

- Colunas comprimidas.
- Cards pouco legíveis.
- Swipe horizontal ruim quando há muitas informações por card.
- O usuário perde noção de contexto porque tenta enxergar tudo ao mesmo tempo.

## Solução

### Header mobile

- Campo de busca no topo.
- Botão `Novo` ao lado.
- Filtros essenciais e contadores resumidos abaixo ou ao redor do header.

### Barra de tabs

- Uma tab por estágio.
- Overflow horizontal com scroll suave.
- Estado visual do estágio ativo.
- Contagem de leads por estágio na própria tab.

### Conteúdo

- Um estágio visível por vez.
- Lista vertical de cards dentro do estágio ativo.
- Card com hierarquia mais compacta.

## Lógica de estado

- `stageIdActive` define qual etapa está visível.
- `stageIndexActive` auxilia navegação e scroll.
- Ao tocar numa tab, a lista correspondente deve ser exibida.
- Ao fazer swipe/scroll horizontal, o tab ativo deve atualizar.
- Se filtros alterarem os resultados e o estágio ativo ficar vazio, deve haver fallback para o próximo estágio válido.

## CSS/Flexbox/Grid recomendado

- Container geral em `flex flex-col`.
- Barra de tabs com `overflow-x-auto` e `scroll-snap-type`.
- Painéis com `min-w-full` ou render condicional pelo estágio ativo.
- Cards com `w-full` e largura de leitura confortável.
- Uso de `sticky` apenas para header e tabs, sem exagero.

## Interações

- Tocar na tab centraliza o estágio.
- Cards continuam abrindo drawer de detalhes.
- A busca não deve perder foco ao alternar tabs.
- O estado da tab deve sobreviver a pequenas mudanças de filtro enquanto o estágio ainda existir.

## Arquivos envolvidos

- `src/modules/kanban/components/kanban-board.tsx`
- `src/modules/kanban/components/kanban-header.tsx`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts`
- `src/modules/kanban/hooks/use-kanban-module.ts`
- `src/modules/kanban/types.ts`

## Critérios de aceite

- Em mobile, o usuário vê apenas um estágio por vez.
- O Kanban mantém contexto suficiente para operação diária.
- O texto dos cards permanece legível.
- A navegação entre estágios fica mais natural que o scroll de colunas comprimidas.
