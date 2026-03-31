# CRM UI Optimization Plan

Objetivo: refatorar navegação e responsividade do CRM para eliminar layout shift, overflow horizontal e quebra de densidade operacional em desktop, mantendo a identidade dark premium do produto.

## Problemas que este plano cobre

- Sidebar com altura acoplada ao conteúdo principal.
- Sidebar sem scroll independente em telas 1024x768 e 1366x768.
- Tabela de leads extrapolando a largura do container.
- Kanban de deals quebrando em várias linhas em larguras menores.
- Sidebar com expansão em hover que hoje precisa acontecer sem empurrar o conteúdo.
- Ícone de Team / Goals visualmente desalinhado com o restante do set.

## Arquivos mais prováveis de alteração

- `src/app/(dashboard)/layout.tsx`
- `src/components/sidebar-principal.tsx`
- `src/components/shared/module-page-shell.tsx`
- `src/modules/leads/page.tsx`
- `src/modules/kanban/components/kanban-board.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/card.tsx`
- possivelmente `src/components/mobile-bottom-dock.tsx` se a navegação global for alinhada depois

## Leitura recomendada

1. `01-layout-e-sidebar.md`
2. `02-leads-table-responsive.md`
3. `03-kanban-horizontal-scroll.md`
4. `04-hover-sidebar-absoluta.md`
5. `05-iconografia-e-refino-visual.md`
6. `06-ordem-de-implementacao.md`

