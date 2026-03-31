# Leads Table Responsiva

## Objetivo

Eliminar overflow horizontal da tabela de leads sem sacrificar leitura nem densidade operacional.

## Problema observado

O módulo de leads usa uma tabela que pode ultrapassar a largura do container e empurrar a página inteira para a direita.

Arquivo principal:

- `src/modules/leads/page.tsx`

## Estratégia

### Camada 1: wrapper de overflow interno

Envolver a tabela em um container com:

- `w-full`
- `max-w-full`
- `overflow-x-auto`
- `overflow-y-hidden`
- `rounded-[var(--radius-card)]`
- `border border-[var(--border-subtle)]`

Isso garante que a rolagem horizontal, quando necessária, aconteça dentro da superfície da tabela, não na página.

### Camada 2: tabela com largura mínima controlada

Aplicar:

- `min-w-[900px]` ou valor equivalente ao número de colunas reais
- `w-full`
- `table-auto`

Se a tabela tiver muitas colunas, a largura mínima deve refletir o layout mínimo de leitura, para evitar colapso excessivo.

### Camada 3: células com contenção de texto

As colunas com textos longos devem usar:

- `truncate`
- `max-w-[...]`
- `whitespace-nowrap` em campos curtos
- `min-w-0` em blocos flex internos

### Camada 4: bloco pai sem overflow global

No shell do módulo:

- `overflow-x-hidden`
- `min-w-0`

Isso impede que qualquer tabela ruim contamine a largura inteira da página.

## Tailwind recomendado no módulo de leads

- wrapper externo: `min-w-0 overflow-x-hidden`
- card/shell: `overflow-hidden`
- table wrapper: `overflow-x-auto`
- table: `min-w-[900px] w-full`
- header/células: `whitespace-nowrap`
- campos de texto: `truncate`

## CSS recomendado

- `overflow-x: auto`
- `overscroll-behavior-x: contain`
- `scrollbar-gutter: stable`

O `overscroll-behavior-x` ajuda a evitar que o scroll horizontal “vaze” para a página.

## Critérios de aceite

- A página inteira não ganha scroll horizontal.
- O usuário consegue acessar todas as colunas da tabela por scroll interno.
- A legibilidade continua aceitável em desktop e notebook.
- O módulo continua estável quando existem textos longos em nome, PDV, negócio e responsável.

