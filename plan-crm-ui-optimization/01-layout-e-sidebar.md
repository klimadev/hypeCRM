# Layout e Sidebar

## Objetivo

Garantir que a sidebar tenha altura independente do conteúdo central, ocupe a altura do viewport e faça scroll interno quando necessário.

## Diagnóstico atual

No layout do dashboard, a sidebar e o conteúdo principal estão dentro de um wrapper `lg:flex` com `min-h-screen`:

- `src/app/(dashboard)/layout.tsx`
- `src/components/sidebar-principal.tsx`

Hoje a sidebar cresce ou encolhe em função do conteúdo e do comportamento do flex container. Isso gera:

- sidebar menor que a viewport quando o conteúdo principal é curto;
- corte visual quando o conteúdo principal é longo;
- ausência de rolagem própria para o menu.

## Decisão de layout

### Estrutura correta

- O shell do dashboard deve ser um container raiz com `min-h-screen`.
- O layout desktop deve usar `lg:flex lg:items-stretch`.
- A sidebar deve ser um bloco com `h-screen` ou `lg:sticky lg:top-0 lg:h-screen`.
- O conteúdo principal deve ocupar o restante da largura com `min-w-0`.
- A sidebar deve ter `overflow-y-auto` e `overflow-x-hidden`.

### Regra principal

A sidebar não deve depender do conteúdo principal para calcular sua altura.

## CSS / Tailwind recomendado

### No wrapper do dashboard

- `min-h-screen`
- `lg:flex`
- `lg:items-stretch`
- `bg-[var(--canvas)]`

### Na sidebar

- `h-screen`
- `overflow-y-auto`
- `overflow-x-hidden`
- `shrink-0`
- `relative`
- `z-30` se ela ficar fixa/sticky
- `lg:sticky lg:top-0`

### No main

- `min-w-0`
- `flex-1`
- `overflow-x-hidden`
- `pb-[calc(5.5rem+env(safe-area-inset-bottom))]` se o dock mobile continuar existindo

## Flexbox e posicionamento

- Use flexbox para dividir a tela em dois blocos no desktop.
- Use `align-stretch` para manter a altura do sidebar igual à do viewport, não do conteúdo.
- Use `position: sticky` se a sidebar for parte do fluxo e precisar permanecer visível.
- Use `position: fixed` apenas se a estratégia de hover-expand exigir sobreposição total no desktop.

## Critérios de aceite

- Em 1024x768 e 1366x768, a sidebar ocupa a altura útil total.
- O menu lateral rola independentemente do main.
- O conteúdo central não altera a altura da sidebar.
- Nenhum item importante do menu fica cortado em telas intermediárias.

