# HYPE CRM Redesign Plan

Objetivo: refatorar a UI/UX do HYPE CRM para ficar plenamente responsiva em tablet e mobile, com foco em navegação simplificada, Kanban adaptado por breakpoint, dock inferior seguro para mobile e dashboards que preservem legibilidade e proporção.

## Problema atual

- Existe conflito entre `hamburger` no topo e dock flutuante no rodapé.
- O dock atual exibe itens demais para telas estreitas.
- O Kanban tenta mostrar múltiplas colunas em espaço insuficiente.
- O dashboard perde proporção em mobile quando o gráfico não recebe um container responsivo bem definido.
- O dock não respeita `safe-area-inset-bottom` de forma suficientemente robusta para aparelhos com gestos.

## Direção de solução

- Mobile e tablet devem priorizar uma navegação por grupos, não por lista completa de destinos.
- O dock inferior passa a ter 5 categorias principais:
  - Home
  - Sales
  - Chat
  - Team
  - More
- O Kanban mobile deve virar uma experiência tabbed por estágio.
- O Kanban tablet deve virar uma grade compacta com colunas recolhíveis.
- O dashboard precisa usar containers responsivos reais para chart e cards.

## Princípios de implementação

- Manter a arquitetura modular do projeto.
- Centralizar comportamento de tela no módulo correspondente.
- Evitar múltiplos estados redundantes para a mesma informação.
- Priorizar derivação via `pathname`, `breakpoint` e dados do módulo.
- Não adicionar novas superfícies visuais que contrariem a identidade dark premium do sistema.

## Entregáveis desta pasta

- Pesquisa aplicada de padrões de mobile CRM.
- Estratégia de navegação global.
- Estratégia de dock com safe area.
- Estratégia de Kanban por breakpoint.
- Estratégia de dashboard responsivo.
- Plano de estado e coordenação entre componentes.
- Checklist final de validação.
