# Plano: Substituir Hover Sidebar por Top Tab Bar (Desktop)

## Problema
A hover sidebar (expandir ao passar o mouse) ainda é confusa para João Pedro (67, não técnico). Exige que o usuário *descubra* que precisa passar o mouse para ver os nomes — 1 passo escondido que quebra a intuição. O design falhou para a persona.

## Solução
Top tab bar horizontal no desktop: **ícone + label sempre visíveis**, zero passos escondidos. Modelo que JP já reconhece de navegadores, WhatsApp Web, bancos — aprendizado zero.

## Acceptance Criteria
- [ ] Top bar fixa no topo do viewport em desktop (≥lg)
- [ ] Todas as abas exibem **ícone + label** simultaneamente, sem hover para revelar
- [ ] Primeiras 4 abas principais sempre visíveis: Resumo, Leads, Negócios, Chat
- [ ] Abas excedentes agrupadas em menu "Mais" (dropdown/popover)
- [ ] Badge de pendências na aba "Negócios" (via `usePendenciasGlobais`)
- [ ] Avatar + nome do usuário no canto direito
- [ ] Ações (FeedbackTrigger, ThemeToggle, BotaoSair) acessíveis via dropdown do avatar
- [ ] Conteúdo principal ocupa largura total (sem `pl-[var(--sidebar-dock-*)]`)
- [ ] Sidebar antiga removida (arquivos e CSS)
- [ ] Navegação mobile (`MobileTabBar`) intacta — sem nenhuma alteração
- [ ] Itens por perfil preservados (EMPRESA, GERENTE, COLABORADOR)
- [ ] `npx tsc --noEmit --pretty` → 0 erros novos

## Implementation Steps

### 1. Criar `src/components/top-nav-bar.tsx`
Componente client-side, substitui a sidebar no desktop.

**Estrutura visual:**
```
┌──────────────────────────────────────────────────────────────────────┐
│ [HYPE] │ Resumo  Leads  Negócios*  Chat  │ +4 ▾ │  JP [▼] │
└──────────────────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Usa `construirSecoesNavegacao(sessao)` para obter todos os itens
- Achata as 3 seções (Geral, Operação, Sistema) numa lista plana
- Define abas primárias fixas: Resumo, Leads, Negócios, Chat
- Abas restantes vão para menu "Mais" (Popover)
- Aba ativa destacada com cor brand + indicador sutil (barra inferior)
- Badge via `usePendenciasGlobais()` na aba Negócios

**Dropdown do avatar (canto direito):**
- Trigger: avatar circular com iniciais (reaproveitar `gerarIniciais`)
- PopoverContent com: nome + cargo > separador > FeedbackTrigger > ThemeToggleIcon > BotaoSair
- Mobile: mesmo dropdown funciona (opcional, mas consistente)

**CSS:**
- `fixed top-0 left-0 right-0 z-40 hidden lg:flex`
- `h-12 md:h-14 px-3 md:px-4`
- `border-b border-[var(--border-subtle)] bg-[var(--surface-glass)] backdrop-blur-[12px]`
- Tabs individuais: gap-2 com ícone 16px + texto 13px, padding 6px 12px, border-radius 8px

### 2. Modificar `src/app/(dashboard)/layout.tsx`
- Substituir `<SidebarPrincipal>` por `<TopNavBar>`
- Remover `pl-[calc(var(--sidebar-dock-offset)+var(--sidebar-dock-collapsed-width)+...)]` do `<main>`
- Ajustar padding superior: `pt-2.5 lg:pt-[calc(var(--top-bar-height)+theme(spacing.3))]`
- Manter `<MobileTabBar>` exatamente como está

### 3. Remover arquivos (após verificação de referências)
Remover:
- `src/components/sidebar-principal.tsx`
- `src/components/navigation/sidebar-nav-item.tsx`
- `src/components/navigation/sidebar-nav-section.tsx`

Manter:
- `src/components/navigation/navigation-types.ts` (usado por `navigation-config.ts`)
- `src/components/navigation/navigation-config.ts` (reusado pelo TopNavBar)

### 4. Limpar `src/app/globals.css`
Remover:
- `--sidebar-dock-offset`, `--sidebar-dock-collapsed-width`, `--sidebar-dock-expanded-width`, `--sidebar-dock-border`
- `.sidebar-scroll-invisible` e suas variantes
- `.dashboard-sidebar-dock` das regras reduced-motion

Adicionar:
- `--top-bar-height: 3.5rem` (56px)
- `.top-nav-bar` nas regras reduced-motion (se necessário)

Manter:
- `--z-sidebar` (pode ser útil no futuro)
- `--z-tab-bar`, `--z-sheet` (usados pelo mobile)

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Power users sentem falta da sidebar minimalista | Top bar ocupa <56px verticais vs sidebar ocupava largura; conteúdo fica mais largo |
| Muitos itens no "Mais" para perfil EMPRESA | Agrupar visualmente no dropdown com seções |
| Perda de contexto visual (seções "Geral", "Operação", "Sistema") | Manter as seções como labels no grupo de abas ou no dropdown "Mais" |
| Z-index conflito com outros elementos fixed | Usar `--z-top-bar: 35` (entre sidebar 30 e tab-bar 40) |

## Verificação
1. `npx tsc --noEmit --pretty` — 0 erros novos, 0 erros antigos intocados
2. Testar visual em cada perfil (EMPRESA / GERENTE / COLABORADOR)
3. Testar badge do Kanban na aba Negócios
4. Testar dropdown do perfil (feedback, theme, sair)
5. Testar em mobile — nada deve mudar (MobileTabBar intacto)
6. Testar em 1024px, 1280px, 1440px — abas devem ficar legíveis
7. Testar reduced motion — sem animations residuais

## Estrutura de Arquivos (antes → depois)
```
Antes:                                    Depois:
src/components/                           src/components/
  sidebar-principal.tsx  ← REMOVER          top-nav-bar.tsx      ← CRIAR
  navigation/                                navigation/
    sidebar-nav-item.tsx  ← REMOVER           navigation-config.ts  (mantido)
    sidebar-nav-section.tsx  ← REMOVER        navigation-types.ts   (mantido)
    navigation-config.ts
    navigation-types.ts
src/app/(dashboard)/                       src/app/(dashboard)/
  layout.tsx  ← MODIFICAR                    layout.tsx  ← MODIFICADO
src/app/globals.css ← LIMPAR              src/app/globals.css ← LIMPO
```
