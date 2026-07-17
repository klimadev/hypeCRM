# Plano: Navbar hypeCRM — Refinamento com JP no Centro

> **Inspiração:** Refatorações anteriores com a mesma filosofia de simplificação.
> **Persona-guia:** João Pedro (JP), 67 anos, corretor de imóveis, NUNCA usou CRM. O sistema precisa ser OBVIO.
> **Métrica de sucesso:** JP termina o dia sentindo que MANDA no sistema, não o contrário.

---

## 🧠 Princípios de Design (Baseados em Pesquisa)

| Princípio | Fonte | Aplicação |
|-----------|-------|-----------|
| **Controle percebido** | BJ Fogg — Behavior Model | JP decide quando expandir/recolher a sidebar. NUNCA auto-expand |
| **Familiaridade** | Robin Dreeke — FBI Rapport | Tab bar mobile = mesma UX de WhatsApp/Instagram/bank apps |
| **Evitar julgamento** | Dreeke, Emil | Sistema nunca surpreende. Cada ação é previsível e reversível |
| **Reconhecimento > Lembrança** | Nielsen Norman | Ícones + labels SEMPRE visíveis ou 1 clique away |
| **Fitts's Law** | HCI | Touch targets ≥ 48px. Ícones 36×36. Sobra de alvo |
| **Hick's Law** | HCI | Máximo 7±2 itens por grupo visual. Seções agrupam em chunks |
| **Persuasão por competência** | Emil — "Como Vender Qualquer Coisa" | JP compra a sensação de CAPACIDADE. Não compra navbar |
| **Progressive disclosure** | Nielsen Norman | Começa simples (ícones), revela complexidade quando JP pede |

---

## 📐 Direção Visual

| Eixo | Decisão | Por que |
|------|---------|---------|
| **Cor** | **Mais violeta** — intensificar brand `#8b5cf6` | Cor serve à COGNIÇÃO: item ativo é reconhecível INSTANTANEAMENTE pela cor |
| **Desktop** | **Toggle-gaveta** (NUNCA hover-gaveta) | Hover imprevisível → JP evita a esquerda da tela |
| **Mobile** | **Tab bar nativa** estilo iOS/Android | Familiaridade → JP já sabe usar |
| **Tom** | **Menos peso, mais cor, mais rápido** | Informação essencial primeiro, o resto é ruído |

---

## 🚫 O que NÃO vai existir (anti-padrões removidos)

| Anti-padrão | Onde está hoje | Efeito em JP | Ação |
|-------------|---------------|--------------|------|
| **Hover-expand** | `sidebar-principal.tsx` onMouseEnter/Leave | Sidestep involuntário, pânico | **Remover.** Só toggle por clique |
| **Blur+dim no viewport** | `globals.css` :has() seletor | "O sistema quebrou!" | **Remover.** CSS deletado |
| **Auto-close no mouse leave** | `onMouseLeave` | Sidebar fecha sozinha | **Remover.** Estado persiste |
| **Side sheet (direita) no mobile** | `SheetContent side="right"` | "Essa porta abriu pro lado errado" | **Trocar** por bottom sheet |
| **Descrição nos items expandidos** | `sidebar-nav-item.tsx` sub-label | Peso visual desnecessário | **Remover.** Só icon + label |
| **Descrição longa nos items** | `getItemDescricao()` no config | Informação que JP não pediu | **Remover** do sidebar, manter tooltip |
| **Transição de 400ms** | Inline style no sidebar | LENTO. JP espera | **Trocar** pra 220ms |
| **Multi-prop transition** | `transition-[width,transform,shadow,bg,border]` | Jank visual | **Simplificar** pra só width |

---

## 🗂️ Arquivos a Modificar (com linhas específicas)

| Arquivo | O que muda | Linhas-chave |
|---------|-----------|--------------|
| `src/components/sidebar-principal.tsx` | **Reescrever** lógica de expand: remover hover, adicionar toggle button | L25-L50 (state & eventos), L33-L118 (JSX) |
| `src/components/mobile-bottom-dock.tsx` | **Reescrever** → mobile-tab-bar.tsx: 5 tabs fixas + sheet | Arquivo inteiro |
| `src/components/navigation/sidebar-nav-item.tsx` | **Refatorar**: remover descricao expanded, mais violeta em hover/active, glow no active | L20-L33 (JSX do link) |
| `src/components/navigation/sidebar-nav-section.tsx` | **Refatorar**: indicador violeta nas seções | L16-L18 (título) |
| `src/app/globals.css` | **Remover** blur+dim, **adicionar** variáveis de tab bar, reduzir transições | L264-L284 (viewports), L239-L246 (variáveis) |
| `src/app/(dashboard)/layout.tsx` | **Ajustar** padding do main (mínimo, se necessário) | L37 (padding) |
| `src/components/navigation/navigation-config.ts` | **Ajuste mínimo** — remover getItemDescricao da sidebar (manter pra tooltips) | L9-L26 |

---

## 🔬 Fase 1: Desktop Toggle-Gaveta

### 1.1 Remover hover-expand (CRÍTICO)

```tsx
// ANTES (sidebar-principal.tsx)
const [expandida, setExpandida] = useState(false);
// ...
onMouseEnter={() => setExpandida(true)}
onMouseLeave={() => setExpandida(false)}
onFocusCapture={() => setExpandida(true)}
onBlurCapture={(event) => { ... }}

// DEPOIS
const [expandida, setExpandida] = useState(false);
const toggleExpandida = () => setExpandida(prev => !prev);
// SEM onMouseEnter/Leave. SEM onFocus/Blur.
```

### 1.2 Botão de toggle sempre visível

No fim da sidebar, um botão circular com ícone:

```
Collapsed:                  Expanded:
┌────┐                      ┌────────────────────┐
│    │                      │                    │
│    │                      │   (itens)          │
│    │                      │                    │
│    │                      │                    │
│    │   ← ícone +          │   ← same           │
│    │     tooltip          │     + labels        │
│    │                      │                    │
│    │                      │                    │
│  « │   ← SEMPRE VISÍVEL   │  » │   ← BOTÃO INVERTIDO
│    │                      │    │
└────┘                      └────────────────────┘
```

O botão:
- `h-9 w-9 rounded-[13px] border border-[var(--border-subtle)] bg-[var(--surface)]`
- Ícone: `ChevronRight` quando colapsado, `ChevronLeft` quando expandido
- Tooltip: "Expandir menu" / "Recolher menu"
- `active:scale-[0.94]`
- SEMPRE na mesma posição (fim da sidebar)

### 1.3 Remover blur+dim do viewport

Em `globals.css`, deletar ou comentar:

```css
/* 🗑️ REMOVER BLOCO INTEIRO */
@supports selector(:has(*)) {
  .dashboard-shell:has(.dashboard-sidebar-dock[data-expanded="true"]) .dashboard-shell__content::before {
    opacity: 1;
  }
  .dashboard-shell:has(.dashboard-sidebar-dock[data-expanded="true"]) .dashboard-shell__viewport {
    filter: blur(2px) saturate(0.9);
    opacity: 0.72;
    transform: translate3d(10px, 0, 0) scale(0.995);
  }
}
```

### 1.4 Simplificar transition da gaveta

```css
/* ANTES */
transition-[width,transform,box-shadow,background-color,border-color] 
duration-[400ms] 
ease-[cubic-bezier(0.175,0.885,0.32,1.1)]

/* DEPOIS */
transition: width 220ms cubic-bezier(0.2, 0.8, 0.2, 1);
/* Só width. Nada mais. GPU-friendly. */
```

### 1.5 Items com mais violeta estratética

A cor não é decorativa — é FUNCIONAL. Ela responde a perguntas de JP:

| Pergunta de JP | Sinal visual |
|----------------|-------------|
| **"Onde eu tô?"** | Item ativo: bg violeta 20%, border violeta 40%, glow shadow |
| **"Isso é clicável?"** | Hover: border violeta 15%, bg violeta 4% |
| **"O que é cada seção?"** | Título da seção: mini barra vertical violeta |
| **"Esse item tá diferente?"** | Item `limpo` (leads, kanban...): bg brand 4% sutil |

Especificações de cor (todas OKLCH-compatíveis):

```css
/* Estado ATIVO — mais forte que hoje */
--nav-item-active-bg: color-mix(in srgb, var(--brand) 20%, transparent);   /* hoje: 16% */
--nav-item-active-border: color-mix(in srgb, var(--brand) 40%, transparent); /* hoje: 24% */
--nav-item-active-glow: 0 0 20px -8px var(--brand);
--nav-item-active-icon: var(--brand);

/* Estado HOVER — violeta sutil, não branco genérico */
--nav-item-hover-bg: color-mix(in srgb, var(--brand) 6%, transparent);
--nav-item-hover-border: color-mix(in srgb, var(--brand) 15%, transparent);
--nav-item-hover-icon: color-mix(in srgb, var(--brand) 70%, var(--text-primary));

/* Seção */
--nav-section-indicator: var(--brand);
```

### 1.6 Ações do rodapé (Feedback, Tema, Sair)

**Collapsed mode:** um único botão de "..." (já existe como Popover) que mostra as 3 ações.

**Expanded mode:** grid de 3 colunas com os botões (já existe).

Ambos permanecem iguais. Só garantir que no collapsed mode, o botão "...":
- Fica sempre visível no fim da sidebar (ANTES do toggle button)
- Tooltip: "Ações rápidas"
- Abertura é popover, não sheet

### 1.7 Transição de conteúdo

Com a sidebar em `position: fixed` e `left: 1rem`:
- O padding do `<main>` hoje: `pl-[calc(1rem + 4.75rem + 1rem)]` = 6.75rem
- Quando expande, sidebar vai de 76px → 280px (sobrepõe)
- O conteúdo NÃO precisa se mexer. A sidebar cresce pra DIREITA, cobrindo o que tá atrás
- O shadow-xl da sidebar já separa visualmente as camadas

---

## 📱 Fase 2: Mobile Tab Bar Nativa

### 2.1 Novo arquivo: `src/components/mobile-tab-bar.tsx`

Substitui `src/components/mobile-bottom-dock.tsx`. Importação em `layout.tsx` muda.

### 2.2 Estrutura da tab bar

```tsx
// src/components/mobile-tab-bar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, Users, LayoutGrid, WalletCards, 
  Target, MoreHorizontal, Blocks, MessageCircle, 
  Settings2, Shield, MessageSquare, LogOut 
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ThemeToggleRow } from "@/components/theme-toggle";
import { FeedbackTrigger } from "@/components/feedback-trigger";
import { cn } from "@/lib/utils";
import { usePendenciasGlobais } from "@/modules/kanban/hooks/use-pendencias-globais";
import type { SessaoToken } from "@/lib/tipos";

type TabConfig = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  match: string[];  // paths that count as "active" for this tab
};

// ... etc
```

### 2.3 Regras de matching de tab ativo

```ts
function getActiveTabIndex(pathname: string, perfil: SessaoToken["perfil"]): number {
  if (pathname.startsWith("/resumo")) return 0;
  if (pathname.startsWith("/leads")) return 1;
  if (pathname.startsWith("/kanban")) return 2;
  if (pathname.startsWith("/recebimentos") || 
      pathname.startsWith("/equipe") || 
      pathname.startsWith("/minhas-metas") ||
      pathname.startsWith("/qr-code")) return 3;
  return 4; // "Mais" tab for everything else
}
```

### 2.4 Tab icon + label + dot indicator

```
Desktop tab (hover):   |  Mobile tab (normal):
┌──────────┐           |  ┌──────────┐
│  📋      │           |  │  📋      │
│ Negócios │           |  │ Negócios │
│    ●     │ ← dot     |  │    ●     │
└──────────┘           |  └──────────┘
                       |
Active dot:            |
  w-1 h-1 rounded-full |
  bg-[var(--brand)]    |
  mx-auto mt-0.5       |
```

### 2.5 Tab press animation

```tsx
<Tab 
  active={isActive} 
  className="transition-transform duration-100 active:scale-[0.92]"
/>
```

Usar `active:` (pseudo-classe), não JS state — mais performático e não causa re-render.

### 2.6 Bottom sheet (substitui side sheet)

```tsx
<Sheet>
  <SheetTrigger asChild>
    {/* "Mais" tab */}
  </SheetTrigger>
  <SheetContent 
    side="bottom" 
    className="rounded-t-[24px] border-t border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-[20px]"
  >
    {/* Drag indicator */}
    <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--text-tertiary)]" />
    
    {/* Theme toggle */}
    <div className="px-2">
      <ThemeToggleRow />
    </div>
    
    {/* Section: Integrações & Config */}
    <div className="mt-4 space-y-1 px-2">
      {/* items... cada um com icon + label + chevron */}
    </div>
    
    {/* Section: Super Admin (se aplicável) */}
    {isSuperAdmin && (
      <>
        <div className="my-2 h-px bg-[var(--border-subtle)]" />
        <div className="space-y-1 px-2">
          {/* super admin items... */}
        </div>
      </>
    )}
  </SheetContent>
</Sheet>
```

### 2.7 Badge de pendências no mobile

```tsx
// No tab "Negócios"
const badgeCount = resumo?.total ?? 0;

{badgeCount > 0 && (
  <span className="absolute -right-1 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-[var(--brand)] px-1 text-[9px] font-bold text-white leading-none">
    {badgeCount > 9 ? "9+" : badgeCount}
  </span>
)}
```

### 2.8 Safe area

```css
/* Mobile tab bar */
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(64px + env(safe-area-inset-bottom, 0px));
  padding-bottom: env(safe-area-inset-bottom, 0px);
  background: var(--surface-glass);
  backdrop-filter: blur(20px);
  border-top: 0.5px solid var(--border-subtle);
  z-index: var(--z-tab-bar, 40);
}

/* Content padding (já existe no layout.tsx) */
.dashboard-shell__content {
  padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px) + 0.75rem);
}
```

---

## 🎨 Fase 3: CSS e Variáveis

### 3.1 Novas variáveis em `globals.css`

```css
:root {
  /* Navbar refinements */
  --nav-item-active-bg: color-mix(in srgb, var(--brand) 20%, transparent);
  --nav-item-active-border: color-mix(in srgb, var(--brand) 40%, transparent);
  --nav-item-hover-bg: color-mix(in srgb, var(--brand) 6%, transparent);
  --nav-item-hover-border: color-mix(in srgb, var(--brand) 15%, transparent);
  
  /* Tab bar */
  --tab-bar-height: 64px;
  
  /* Z-index scale */
  --z-sidebar: 30;
  --z-tab-bar: 40;
  --z-sheet: 50;
}
```

### 3.2 Remover blur+dim (CRÍTICO — já detalhado acima)

### 3.3 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .dashboard-sidebar-dock,
  .dashboard-sidebar-dock *,
  .tab-bar,
  .tab-bar * {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
  
  .dashboard-sidebar-dock {
    transition: none !important;
  }
}
```

---

## 📋 Acceptance Criteria (TESTÁVEIS)

### Desktop
- [ ] **Toggle-gaveta**: expande/colapsa SOMENTE por clique no botão « ». NUNCA por hover
- [ ] **Sem blur/dim**: viewport NÃO muda quando sidebar expande (verificar no CSS e visualmente)
- [ ] **Sidebar persiste**: expandida → navega → continua expandida. Colapsada → navega → continua colapsada
- [ ] **Botão de toggle**: SEMPRE visível no fim da sidebar, com tooltip
- [ ] **Items**: expanded mode mostra só icon + label (sem descrição). Altura ≈ 44px
- [ ] **Item ativo**: bg violeta 20%, border violeta 40%, glow shadow
- [ ] **Item hover**: bg violeta 6%, border violeta 15%
- [ ] **Seções**: indicador violeta (border-left ou bullet)
- [ ] **Ações (feedback, tema, sair)**: acessíveis collapsed (popover) e expanded (grid)
- [ ] **Transição**: 220ms, ease-productive, só width

### Mobile
- [ ] **5 tabs fixas**: Resumo, Leads, Negócios, Caixa/Equipe/Metas, Mais
- [ ] **Tab matching**: /resumo, /leads ou /leads/123 → tabs corretas, /kanban/123 → Negócios ativo
- [ ] **Tab ativo**: ícone violeta, label branca, mini dot indicator
- [ ] **Press feedback**: scale(0.92) no toque, 100ms
- [ ] **Badge**: no tab Negócios, cor violeta, "9+" pra >9, só se >0
- [ ] **Sheet**: sobe de baixo, 300ms spring, drag indicator, fecha no tap outside ou drag down
- [ ] **Sheet items**: touch targets ≥ 48px, grupos com separadores
- [ ] **Safe area**: `env(safe-area-inset-bottom)` na tab bar e sheet
- [ ] **Reduced motion**: `prefers-reduced-motion: reduce` → transições 0ms

### Geral
- [ ] **TypeScript**: `npx tsc --noEmit --pretty` → 0 erros
- [ ] **Rotas aninhadas**: /kanban/123 → sidebar indica "Negócios", tab mobile indica "Negócios"
- [ ] **Navegação fluida**: clique/tap → transição → página carrega, sem loading intermediário
- [ ] **Performance**: transição sidebar GPU-friendly (só width, sem layout thrashing)

---

## ▶️ Ordem de Execução (RALPH)

```
Fase 1: globals.css
  → 1.1 Remover blur+dim viewport (:has selector) 
  → 1.2 Adicionar variáveis nav-item-*
  → 1.3 Adicionar reduced motion
  → 1.4 Ajustar transition sidebar

Fase 2: sidebar-nav-item.tsx
  → 2.1 Remover descricao do expanded state
  → 2.2 Mais violeta no hover (bg + border)
  → 2.3 Mais violeta no active (bg + glow)

Fase 3: sidebar-nav-section.tsx  
  → 3.1 Adicionar indicador violeta na seção

Fase 4: sidebar-principal.tsx
  → 4.1 Remover onMouseEnter/Leave
  → 4.2 Remover onFocusCapture/BlurCapture
  → 4.3 Adicionar toggleExpandida()
  → 4.4 Adicionar botão «/» no fim (antes do rodapé)
  → 4.5 Simplificar transition inline
  → 4.6 Manter popover de ações no collapsed

Fase 5: mobile-tab-bar.tsx (NOVO)
  → 5.1 Criar componente com 5 tabs
  → 5.2 Implementar matching de rota
  → 5.3 Implementar sheet bottom
  → 5.4 Adicionar badge de pendências
  → 5.5 Adicionar press feedback

Fase 6: layout.tsx
  → 6.1 Trocar import MobileBottomDock → MobileTabBar
  → 6.2 Verificar padding do main

Fase 7: cleanup
  → 7.1 Deletar mobile-bottom-dock.tsx (opcional, manter como fallback)
  → 7.2 npx tsc --noEmit --pretty
```

---

## 📊 Storytelling: O DIA DO JP (Validação)

> *Leia esta simulação em voz alta. Se em algum momento JP hesita, fica confuso ou se sente burro — o design falhou.*

### 8h30 — Escritório, desktop

JP abre hypeCRM. A tela carrega.

Ele vê uma **barra fina na esquerda** com ícones. Ele não precisa fazer nada — a barra tá parada, não explode.

Ele move o mouse **por cima** da barra (sem medo, porque no dia anterior nada explodiu). Uma tooltip aparece: "Leads — Carteira e originação". Legal.

Ele clica no ícone de Leads. Vai direto.

No fim da barra, ele repara num botãozinho: **«**. Passa o mouse: "Expandir menu". Clica.

A barra **cresce suave**. Os nomes aparecem. Nada na tela mudou — só a barra que ficou mais larga.

Ele vê: "Resumo, Leads, Produtos, Negócios, Chat, Recebimentos, Equipe... Ah, então esse ícone de grid é Negócios. Faz sentido."

Ele clica em Equipe. A barra **continua aberta**. Ele navega tranquilo.

**JP sente que MANDA no sistema.** Não o contrário.

### 14h — Rua, celular

JP tá mostrando um imóvel. O telefone vibra. Ele olha: hypeCRM notificação.

Na **parte de baixo da tela**, ele vê 5 botões: 📊 Resumo | 👥 Leads | 📋 Negócios | 💰 Caixa | ⋯ Mais.

O de Leads tem um **círculo roxo com "1"**. IGUAL Instagram. Ele toca.

Vai direto pro lead. Resolve.

Depois, ele toca em "Mais". Uma folha **sobe de baixo**. Ele vê: WhatsApp, Ajustes, Sair. Toca WhatsApp. A folha desce. Pronto.

**JP não pensou duas vezes em nenhum momento. O sistema se comportou como qualquer app que ele já usa.**

### 18h — Escritório, de volta

JP fecha o dia. A sidebar dele tá expandida — ficou o dia todo.

Ele clica no **»** pra recolher. "Bom, amanhã eu abro de novo."

**JP não teve um momento de dúvida o dia inteiro.**

---

> **Status:** `pending approval` — confirma que o plano tá bom pra executar com ralph?
