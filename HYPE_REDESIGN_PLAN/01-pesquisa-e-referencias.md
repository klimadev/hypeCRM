# Pesquisa e Referências

## Padrões observados em CRMs móveis modernos

### HubSpot mobile

- O app móvel usa navegação inferior enxuta e um item `Menu` para concentrações secundárias.
- Dashboards podem ser acessados no fluxo móvel sem exigir estrutura desktop completa.
- A lógica é de acesso rápido ao núcleo operacional, não de exposição simultânea de tudo.

### Pipedrive mobile

- Leads ficam organizados em uma visão móvel própria, com busca no topo e filtros explicitamente separados.
- A criação de lead aparece como ação primária persistente.
- O acesso a partes secundárias fica dentro de um menu compacto ou em ações contextuais.

## Padrões derivados para o HYPE CRM

- Mobile não deve herdar a mesma densidade do desktop.
- A navegação deve ser agrupada por intenção de trabalho.
- A busca precisa ficar disponível sem disputar espaço com ações secundárias.
- O Kanban precisa reduzir simultaneidade visual.
- O dashboard deve tratar gráficos como conteúdo de container responsivo, não como bloco com altura fixa implícita.

## Arquivos do projeto já alinhados com essa análise

- `src/components/mobile-bottom-dock.tsx`
- `src/components/sidebar-principal.tsx`
- `src/modules/kanban/components/kanban-board.tsx`
- `src/modules/kanban/components/kanban-header.tsx`
- `src/components/grafico-vendas.tsx`
- `src/modules/recebimentos/components/recebimentos-chart-card.tsx`

## Tradução prática da pesquisa

- O novo dock não deve listar 7+ destinos.
- O `More` deve substituir o hamburger mobile/tablet.
- O Kanban mobile deve mostrar um estágio por vez.
- O Kanban tablet deve mostrar no máximo 2 a 3 colunas visíveis, com opção de colapsar.
- O dashboard deve usar `ResponsiveContainer` com altura definida pelo wrapper e ajustes por breakpoint.
