---
name: hypeCRM
description: Design tokens and component patterns for the Kanban module and CRM-wide visual system
colors:
  primary: "#8b5cf6"
  neutral-bg: "#09090b"
  surface: "#0c0c0e"
  surface-elevated: "#111113"
  text-primary: "#fafafa"
  text-secondary: "#a1a1aa"
  text-tertiary: "#71717a"
  success: "#10b981"
  danger: "#f43f5e"
  warning: "#f59e0b"
  info: "#38bdf8"
  brand-soft: "rgba(139,92,246,0.16)"
  border-subtle: "rgba(255,255,255,0.08)"
  border-strong: "#3f3f46"
  border-focus: "rgba(139,92,246,0.56)"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  data:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "normal"
rounded:
  control: "12px"
  card: "16px"
  shell: "28px"
  badge: "6px"
components:
  button-primary:
    borderRadius: "12px"
    backgroundColor: "#8b5cf6"
    color: "#fafafa"
    padding: "0.5rem 1rem"
    fontSize: "0.875rem"
    fontWeight: 500
    hoverBackgroundColor: "#7c3aed"
    disabledOpacity: 0.5
  button-destructive:
    borderRadius: "12px"
    backgroundColor: "#f43f5e"
    color: "#fafafa"
    padding: "0.5rem 1rem"
    fontSize: "0.875rem"
    fontWeight: 500
    hoverBackgroundColor: "#e11d48"
  input:
    borderRadius: "12px"
    backgroundColor: "#0c0c0e"
    borderColor: "rgba(255,255,255,0.08)"
    color: "#fafafa"
    height: "2.75rem"
    padding: "0 0.875rem"
    fontSize: "0.875rem"
    focusBorderColor: "rgba(139,92,246,0.56)"
  card-kanban:
    borderRadius: "8px"
    backgroundColor: "#111113"
    borderColor: "rgba(255,255,255,0.08)"
    padding: "0.75rem"
    hoverShadow: "0 12px 30px -18px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05)"
    hoverScale: 1.02
---
```

# Overview

hypeCRM usa **dark-first design** com um único tema escuro profundo. Não há modo claro. A paleta é construída em torno de um brand violeta (`#8b5cf6`) sobre uma base preta-carbono (`#09090b`). O sistema prioriza **clareza sobre decoração** — cada elemento visual serve à tarefa, não ao estilo.

Este documento captura especificamente o padrão visual extraído do **Kanban UX Overhaul** (Julho 2026), que estabeleceu o template de redesign para os demais módulos. Os padrões aqui documentados devem ser replicados em futuros redesigns, features, módulos, componentes e páginas.

## Terminologia

| Termo | Significado |
|-------|-------------|
| Funil | Pipeline de vendas (nunca "pipeline" em UI visível) |
| Negócio | Deal/oportunidade dentro do funil |
| Estágio | Coluna do Kanban |
| Perder negócio | Movimentar para Lost (nunca "fechar como perdido") |
| Lead | Contato bruto antes de virar negócio |

# Colors

**Estratégia de cor:** *Restrained* (neutros tintados + um accent ≤ 10% da superfície). O fundo preto-carbono é a superfície dominante; o brand violeta aparece apenas em ações primárias, indicadores de seleção e badges de pipeline.

## Surface Stack

| Token | Value | Role |
|-------|-------|------|
| `--canvas` | `#09090b` | Page background. A tela mais escura do sistema. |
| `--surface` | `#0c0c0e` | Card, panel, e superfície de container padrão. Quase indistinguível do canvas — a hierarquia vem das bordas, não do contraste de fundo. |
| `--surface-elevated` | `#111113` | Popovers, dropdowns, modais, e cards em hover. Um fio mais claro que surface; suficiente para indicar elevação sem sombra pesada. |
| `--surface-soft` | `rgba(255,255,255,0.04)` | Badge, tag, e micro-interações. Invisível até precisar. |
| `--surface-glass` | `rgba(24,24,27,0.72)` | Fundo de overlays translúcidos. Usar com backdrop-filter. |
| `--surface-overlay` | `rgba(9,9,11,0.78)` | Modal/drawer backdrop. |

## Text Ramp

| Token | Value | Role |
|-------|-------|------|
| `--text-primary` | `#fafafa` | Body e headings — sempre este, nunca um cinza mais claro. |
| `--text-secondary` | `#a1a1aa` | Rótulos, metadados, legendas. |
| `--text-tertiary` | `#71717a` | Placeholders, timestamps, info suplementar. O mais baixo que o texto desce. |

**Proibido:** Usar `--text-secondary` ou `--text-tertiary` como body text principal. Se o usuário precisa ler, use `--text-primary`. O erro mais comum é "text-secondary elegante" que sacrifica legibilidade.

## Brand

| Token | Value | Role |
|-------|-------|------|
| `--brand` | `#8b5cf6` | Primary buttons, links ativos, indicador de pipeline selecionado. |
| `--brand-strong` | `#7c3aed` | Brand hover states. |
| `--brand-soft` | `rgba(139,92,246,0.16)` | Background de itens selecionados, badges de pipeline ativo. |
| `--brand-ring` | `rgba(139,92,246,0.32)` | Focus ring do brand. |

## Semantic

| Token | Value | Role |
|-------|-------|------|
| `--success` | `#10b981` | Valores monetários, confirmações de salvamento, indicadores positivos. |
| `--danger` | `#f43f5e` | Ações destrutivas (perder negócio, deletar), pendências críticas, inline errors. |
| `--warning` | `#f59e0b` | Negócios parados >3 dias, alertas de atenção. |
| `--info` | `#38bdf8` | Badges informativos, dicas. |

**A regra do color-mix:** Badges e tags semânticas NUNCA usam a cor pura como background. Sempre aplica-se:

```css
/* Severity badge — cor pura só no texto, tom 14% no bg */
background: color-mix(in srgb, var(--danger) 14%, transparent);
color: var(--danger);
```

Isso vale para danger, warning, success, info, e brand. O resultado é um badge legível que não compete com o conteúdo.

## Borders

| Token | Value | Role |
|-------|-------|------|
| `--border-subtle` | `rgba(255,255,255,0.08)` | Default de todas as bordas. Quase invisível de propósito — a UI respira. |
| `--border-strong` | `#3f3f46` | Hover em cards, foco em elementos interativos. |
| `--border-focus` | `rgba(139,92,246,0.56)` | Focus ring em inputs e controles. |

**The Ghost Border Rule.** Borda default é 8% branco — presente o suficiente para definir o container, ausente o suficiente para não poluir. Quando o usuário interage (hover, foco), a borda sobe para `--border-strong` ou `--border-focus`. A UI "acorda" sob interação.

## Shadows

```css
--shadow-sm:   0 1px 2px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.04);
--shadow-md:   0 12px 30px -18px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.05);
--shadow-lg:   0 24px 60px -32px rgba(0,0,0,0.92), 0 0 0 1px rgba(255,255,255,0.06);
--shadow-xl:   0 36px 90px -44px rgba(0,0,0,0.95), 0 0 0 1px rgba(255,255,255,0.07);
```

Toda sombra leva um **1px de borda branca em 4-8% opacidade** — é isso que define o elevado do não-elevado em um tema escuro, não o blur. Sem esse 1px, sombras em fundo preto são invisíveis.

# Typography

**The Inter Only Rule.** Uma única família tipográfica (`Inter`) carrega todo o sistema — headings, body, labels, botões, dados. Sem pareamento display/sans. Sem fluid type.

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| Display | `1rem / 16px` | 600 | Título de card, nome do negócio |
| Body | `0.875rem / 14px` | 400 | Parágrafos, descrições |
| Label | `0.8125rem / 13px` | 500 | Rótulos de formulário |
| Data | `0.875rem / 14px` | 600 | Valores monetários, contadores |
| Badge | `0.625rem / 10px` | 500 | Tags, badges, timestamps |
| Mini | `0.6875rem / 11px` | 500 | Info compacta, metadata |

- **Line length** para prosa: 65-75ch. Dados em tabela podem ser mais densos.
- **Tabular nums** em valores: `className="tabular-nums"` para moedas e números.
- **Text balance** em headings: `text-wrap: balance`.
- **Line height** body: 1.5. Display/data: 1.25.
- **Tracking** nunca negativo em UI. Badges usam `tracking-[0.1em]` a `tracking-[0.18em]` em uppercase.

# Components

## Kanban Card

**The 3-Field Rule.** Todo card de Kanban mostra no máximo 3 pedaços de informação + tags. Se não couber em 3, não é importante o suficiente para estar no card.

```tsx
// Estrutura do card Kanban (src/modules/kanban/components/kanban-negocio-card-content.tsx)
<div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-3
            hover:shadow-md hover:scale-[1.02] active:scale-[0.99] transition-all duration-150">
  {/* Linha 1: alça drag + nome */}
  {/* Linha 2: valor monetário */}
  {/* Linha 3: tags (origem, tempo parado, pendências, responsável) */}
  {/* Timestamp: opcional, texto terciário */}
</div>
```

| State | Visual |
|-------|--------|
| Default | Borda sutil, fundo elevado, sem sombra |
| Hover | `shadow-md` + `scale-[1.02]` + borda `--border-strong` — o card "se levanta" |
| Active (drag) | `shadow-lg` + `opacity-80` |
| Active (click) | `scale-[0.99]` |

**A alça de drag:** `GripVertical` com opacidade 30%, sobe para 70% no hover do card pai (`group-hover:opacity-70`). A alça só aparece quando o usuário passa o mouse — mas o card já comunicou que é arrastável pelo hover scale.

## Kanban Column

```
rounded-xl border border-subtle bg-surface
w-[280px] shrink-0 → scroll horizontal
Header: nome do estágio + contagem + config
```

**Scroll affordance:** Quando as colunas excedem o viewport, um **fade gradient** na borda direita (`bg-gradient-to-l from-[var(--surface)] to-transparent`) + um **ChevronRight pulsando** indicam que há mais conteúdo à direita. O board usa `overflow-x-auto scroll-smooth`.

## Pipeline Catalog (List View)

**The Vertical List Rule.** Pipelines são listas verticais, nunca grid. Cada linha tem:

```
rounded-xl border border-subtle bg-surface → hover: border-strong
[Badge de status] Nome do funil  [Abrir] [Config]
```

- Linha única, sem quebra de linha
- Badge de pipeline: `rounded-full border brand-45% bg brand-20% text-[10px] uppercase tracking-[0.1em]`
- Active item: borda brand 50%, bg brand 10%
- Empty state: `FolderOpen` icon + "Crie seu primeiro funil em 10 segundos" + CTA button
- "Novo funil" button inline no header, não em modal separado

## Modals

**The 1-Campo Rule.** Todo modal de criação começa com UM campo obrigatório. Campos opcionais ficam em toggle expansível.

```tsx
// Pipeline Modal — apenas "nome do funil" é obrigatório
// Descrição: toggle "Adicionar descrição (opcional)" com ChevronDown

// Validação: inline, no próprio campo
{erro && <p className="text-sm text-[var(--danger)]">{erro}</p>}

// Feedback: toast ao salvar, auto-fecha
addToast({ type: "success", title: "Pipeline criado!" });
onOpenChange(false);
```

| Elemento | Padrão |
|----------|--------|
| Título | `DialogTitle` com nome da ação |
| Input obrigatório | `h-12 rounded-xl border bg-surface text-base` + autoFocus |
| Input opcional | `h-11 rounded-xl border border-subtle bg-surface text-sm` |
| Botão primário | `rounded-xl bg-[var(--brand)]` com ícone `Plus` |
| Botão cancelar | `rounded-xl border-[var(--border-subtle)] variant="outline"` |
| Erro inline | Texto `var(--danger)` abaixo do input, borda do input muda para `var(--danger)` |
| Loading | `Loader2 animate-spin` + "Salvando..." |

## Destructive Actions (Loss Dialog)

**The Red Confirmation Rule.** Toda ação destrutiva usa:

1. **Motivos predefinidos** — chips selecionáveis com bg `--surface-soft` / selecionado `--danger` bg white text
2. **Botão de confirmar** — `bg-[var(--danger)] text-white`
3. **Subtítulo explicativo** — "Tem certeza? Informe o motivo para registrar o aprendizado."
4. **Subtle fade** — `backdrop-filter: blur` no overlay

```
Dialog max-w-sm
  Título: "Perder negócio"
  Subtítulo: "Tem certeza? Informe o motivo..."
  Motivos: [Preço muito alto] [Cliente escolheu concorrente] [Sem orçamento no momento] [Outro]
  Botões: [Cancelar outline] [Confirmar perda danger]
```

## Buttons

| Type | Style |
|------|-------|
| Primary | `rounded-xl bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]` |
| Destructive | `rounded-xl bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]` |
| Outline | `rounded-xl border border-[var(--border-subtle)] variant="outline"` |
| Ghost (header) | `rounded-xl text-text-secondary hover:bg-surface-soft` |
| Icon | `h-10 w-10 rounded-xl border border-subtle` com ícone central |

## Inputs / Controls

```
h-11 rounded-xl border bg-[var(--surface)] text-sm
  → Default: border-[var(--border-subtle)]
  → Focus: border-[var(--border-focus)] + focus:ring
  → Error: border-[var(--danger)]
  → Disabled: opacidade reduzida
```

Selects seguem o mesmo padrão, com `SelectTrigger` tendo as mesmas dimensões e bordas.

## Badges & Tags

| Type | Style | Use |
|------|-------|-----|
| Origem | `rounded-md bg-surface-soft px-1.5 py-0.5 text-[10px]` | Origem do lead (Manual, WhatsApp, Anúncio) |
| Tempo parado | `rounded-md bg-warning-14% text-warning text-[10px]` | Alertas de >3 dias sem atualização |
| Pendência crítica | `rounded-md bg-danger-14% text-danger text-[10px]` | Pendências críticas não resolvidas |
| Pendência alerta | `rounded-md bg-warning-14% text-warning text-[10px]` | Pendências de alerta |
| Pendência info | `rounded-md bg-info-14% text-info text-[10px]` | Pendências informativas |
| Pipeline default | `rounded-full border brand-45% bg brand-20% text-[10px] uppercase tracking-[0.1em]` | Badge do pipeline atual |

**The 14% Opacity Rule:** Badges semânticos usam `color-mix(in srgb, var(--<color>) 14%, transparent)` como background. Isso dá contexto visual sem competir com o conteúdo.

## Filter Popover

```
rounded-2xl border border-subtle bg-surface p-3
  → Selects internos: h-9 rounded-lg text-sm
  → "Limpar filtros": ghost variant, full width
  → "Fechar": outline variant, full width
```

Filtros moram em popover, nunca no layout permanente. Apenas um ícone de filtro com indicador de "tem filtro ativo" (bolinha brand) fica visível.

## Empty States

```
flex flex-col items-center gap-3 py-16
  → Ícone grande (lucide-react)
  → Título descritivo
  → Subtítulo
  → CTA button (primary)
```

# Layout

## Header Pattern (Desktop)

```
1 linha horizontal:
  [Pipeline Select] [Search input] [Filter icon] ["Novo negócio" button] ["Métricas" toggle]
```

Métricas são **colapsáveis** (ChevronDown/ChevronUp). Nunca visíveis por padrão — o usuário as expande quando precisa.

## Header Pattern (Mobile)

```
Linha 1: [Pipeline Select (flex-1)] [Filter icon] [New button]
Linha 2: [Search input (full width)]
```

Filtros abrem inline abaixo, não em popover. Selects são nativos (shadcn Select).

## Kanban Board Layout

```
Desktop:
  overflow-x-auto horizontal
  Colunas: w-[280px] shrink-0
  Gradiente fade na borda direita para indicar scroll

Mobile:
  Accordion vertical
  Estágio → toggle → lista de cards
  Scroll suave entre estágios
```

**The Scroll Fade.** `pointer-events-none absolute right-0 w-16 bg-gradient-to-l from-surface to-transparent z-10` — o fade só aparece quando o conteúdo excede o viewport (detectado via `onResize` + `onScroll`).

## Pipeline Catalog Layout

```
Vertical list, full width
  Header: Título + "Novo funil" button
  Lista: rounded-xl items com nome, badge, "Abrir" link
  Empty state: ilustração centralizada
```

## Spacing

| Context | Gap |
|---------|-----|
| Card interno | `space-y-1.5` between lines |
| Tags | `gap-1` |
| Header elements | `gap-2` |
| Modal form | `space-y-4` |
| Buttons in modal | `gap-2 pt-2` |
| Section padding | `p-3` (card), `p-5` (panel) |

# Motion

| Context | Duration | Easing | Property |
|---------|----------|--------|----------|
| Hover (card) | 150ms | `--ease-productive` | transform, box-shadow |
| Hover (border) | 150ms | `--ease-productive` | border-color |
| Focus ring | 140ms | `--ease-productive` | box-shadow |
| Modal open | 200ms | `--ease-productive` | opacity, transform |
| Page transition | 200ms | `--ease-productive` | opacity |
| Drag feedback | 150ms | `--ease-snappy` | transform, opacity |
| Shimmer (loading) | 1.4s | linear | background-position |

- `--ease-productive: cubic-bezier(0.2, 0.8, 0.2, 1)` — transições padrão. Produtiva, não ornamental.
- `--ease-snappy: cubic-bezier(0.175, 0.885, 0.32, 1.275)` — micro-interações (drag, click). Leve overshoot.

**The 150ms Rule.** Hover e focus transitions duram 150ms. Rápido o suficiente para sentir responsivo, lento o suficiente para não parecer instantâneo.

Modal/drawer transitions: 200ms. Mais lentos porque implicam mudança de contexto.

**Proibido:** Page-load orchestrated sequences, staggered entrances em dashboard, bounce animations. Usuário quer trabalhar, não assistir coreografia.

# Do's and Don'ts

## Do

- **1 campo obrigatório por modal.** Adicione mais opções com toggle expansível.
- **Feedback em toda ação.** Toast no save, erro inline no validation, animação no drag.
- **Campos opcionais atrás de toggle.** "Adicionar descrição (opcional)" com ChevronDown.
- **Cards com hover scale/shadow.** O card "se levanta" para indicar que é interativo.
- **Popover para filtros.** Filtros moram em popover, não no layout.
- **Métricas colapsáveis.** Mostre só quando o usuário pede.
- **Color-mix para badges.** 14% de opacidade da cor semântica no bg, cor pura no texto.
- **Lista vertical para catálogos.** Grid é para galeria, não para pipelines.
- **Scroll fade em boards horizontais.** Gradiente na borda direita + indicador "→".
- **Red para destruição.** Toda ação destrutiva tem botão vermelho com confirmação.
- **Inter only.** Nunca adicione segunda fonte.
- **Truncate com tooltip.** Texto que não cabe: `truncate`, não `text-sm` forçado.

## Don't

- **Gradient text** (`background-clip: text`). Use cor sólida.
- **Side-stripe borders** como accent em cards. Substitua por bg tint ou ícone.
- **Glassmorphism decorativo.** Vidro só se serve a um propósito funcional.
- **Nested cards.** Card dentro de card está sempre errado.
- **Eyebrow uppercase tracking-wide acima de toda seção.** Uma seção com kicker é voz; toda seção com kicker é template.
- **Numbered section markers (01, 02, 03) como scaffolding.**
- **Grid para listas de pipelines.** Use lista vertical.
- **Campos opcionais visíveis por padrão.** Esconda atrás de toggle.
- **Spinner no lugar de skeleton.** Skeleton para containers grandes, spinner só para botões.
- **Gray text em brand backgrounds.** Use uma variação mais escura do próprio brand.
- **Text overflow sem truncate.** Todo texto em container limitado usa `truncate` ou `line-clamp`.
- **999/9999 no z-index.** Use a escala semântica (`--z-overlay-backdrop: 50`, `--z-overlay-dialog: 51`, `--z-overlay-toast: 100`).
