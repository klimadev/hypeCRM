# Plano de Implementação por Arquivo

## 1. Navegação global

### `src/components/mobile-bottom-dock.tsx`

- Reduzir itens para 5 categorias principais.
- Implementar agrupamento em `More`.
- Ajustar safe area.
- Garantir que labels curtas não quebrem o layout.

### `src/components/sidebar-principal.tsx`

- Desabilitar hamburger em mobile/tablet.
- Manter sidebar para desktop.
- Refletir a mesma taxonomia do dock para consistência.

## 2. Kanban

### `src/modules/kanban/components/kanban-header.tsx`

- Reduzir densidade visual em mobile.
- Priorizar busca + `Novo`.
- Ajustar ordenação e filtros para caberem em uma faixa superior compacta.

### `src/modules/kanban/components/kanban-board.tsx`

- Separar comportamento mobile, tablet e desktop.
- Mobile: tabs por estágio.
- Tablet: colunas compactas com collapse.
- Desktop: manter grid tradicional, mas sem quebrar o padrão visual.

### `src/modules/kanban/hooks/use-kanban-derivacoes.ts`

- Garantir derivação robusta de estágio ativo.
- Recalcular contagens e filtros sem duplicar estado.

### `src/modules/kanban/hooks/use-kanban-module.ts`

- Incluir estados auxiliares apenas se forem realmente necessários.
- Expor a ViewModel para suportar novo layout sem acoplamento.

## 3. Dashboard e gráficos

### `src/components/grafico-vendas.tsx`

- Tornar o wrapper responsivo de verdade.
- Não depender de altura fixa sem contexto.

### `src/modules/recebimentos/components/recebimentos-chart-card.tsx`

- Ajustar responsividade do chart card.
- Validar quebra de eixo e legenda em mobile.

## 4. Shell e compartilhados

### `src/components/shared/module-page-shell.tsx`

- Revisar padding e espaço inferior para telas pequenas.
- Garantir compatibilidade com dock fixo.

## Ordem recomendada de execução

1. Dock e navegação global.
2. Kanban mobile tabbed.
3. Kanban tablet compact.
4. Dashboard e gráficos.
5. Refinos de shell e spacing.

## Dependências entre tarefas

- O dock precisa ser resolvido antes de ajustar o offset final do conteúdo.
- O Kanban mobile precisa da estrutura de header compacta antes da experiência tabbed ficar consistente.
- O dashboard precisa do padrão de container responsivo antes de qualquer ajuste fino de chart.
