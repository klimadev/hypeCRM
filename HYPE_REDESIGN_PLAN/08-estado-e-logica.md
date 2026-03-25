# Estado e Lógica

## Princípio central

Reduzir estados duplicados e fazer o máximo possível por derivação.

## Estados recomendados por área

### Navegação global

- `activeRoute` derivado de `pathname`.
- `groupOpen` para agrupamentos do dock.

### Kanban mobile

- `stageIdActive`.
- `stageIndexActive`.
- `searchTerm`.
- `filterState`.

### Kanban tablet

- `collapsedColumns`.
- `activeStageFocus` opcional para facilitar foco.

### Dashboard

- `chartReady` apenas se houver necessidade de lazy load/measure.

## Regras de sincronização

- Trocar de rota fecha menus abertos.
- Mudar o estágio ativo não deve resetar filtros sem necessidade.
- Se o conjunto de estágios mudar, o estágio ativo deve cair para um valor válido.
- O estado visual não deve brigar com o estado da URL.

## Estratégia de implementação

- Calcular itens de navegação com base em perfil e permissão.
- Derivar `active` a partir de `pathname`.
- Manter o mínimo de estado local necessário para interação.
- Evitar state machine complexa onde uma derivação simples resolve.

## Pontos de integração

- `src/components/sidebar-principal.tsx`
- `src/components/mobile-bottom-dock.tsx`
- `src/modules/kanban/hooks/use-kanban-module.ts`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts`

## Critérios de validação

- Não há divergência entre URL e componente ativo.
- Menus fecham de forma previsível.
- Tabs e dock não ficam “travados” em estados antigos.
