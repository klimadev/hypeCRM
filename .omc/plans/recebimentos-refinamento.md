# Plano: Refinamento do Módulo Recebimentos

## Visão Geral

Aplicar o mesmo tratamento João Pedro que foi feito no módulo Leads:
token cleanup completo + redesign da página para foco total na tabela
com KPIs compactos e filtros tipo toolbar.

---

## Escopo: Maximalista

Token cleanup + badge pattern + rgba→vars + loading + redesign da página.

---

## Mudanças por Arquivo

### 1. `src/modules/recebimentos/components/recebimentos-kpis.tsx`
**O quê:** Simplificação visual dos cartões de KPI
- Remover blur orb decorativo (l.42: `absolute -right-8 -top-8... blur-2xl`)
- Remover hover animation (l.41: `hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]`)
- `rounded-[16px]` → `rounded-xl` (l.30, 41)
- `rounded-[14px]` → `rounded-xl` (l.50)

### 2. `src/modules/recebimentos/components/recebimentos-filters.tsx`
**O quê:** Redesign de filtro pesado → toolbar compacta
- Remover wrapper com ícone + título + subtítulo ("Filtros operacionais...")
- Remover `rounded-[16px]` border box — vira flex row sem container
- Remover seção "Ordenar por" + "Direção" (l.83-108)
- Remover info bar "X registros encontrados nesta visão" (l.111-113)
- Manter: busca, data_inicial, data_final, PDV, responsável em grid 1×5
- "Limpar filtros" vira botão inline compacto (só ícone X + tooltip)
- `rounded-[12px]` → `rounded-xl` (l.16, 26)
- Token: `border-[color:rgba(56,189,248,0.18)] bg-[color:rgba(56,189,248,0.1)]` (l.111) → `border-[color-mix(in_srgb,var(--info)_18%,transparent)] bg-[color-mix(in_srgb,var(--info)_10%,transparent)]` — se mantido, mas removido no redesign

### 3. `src/modules/recebimentos/components/recebimentos-table.tsx`
**O quê:** Token cleanup + badge pattern + hover cleanup
- `rounded-[16px]` → `rounded-xl` (l.30)
- **StatusBadge**: `rounded-full border px-2.5 py-1 text-xs font-semibold` → `rounded-md px-1.5 py-0.5 text-[10px] font-medium`
  - `border-[color:rgba(16,185,129,0.18)] bg-[color:rgba(16,185,129,0.12)] text-[var(--success)]` → `border-[color-mix(in_srgb,var(--success)_18%,transparent)] bg-[color-mix(in_srgb,var(--success)_12%,transparent)] text-[var(--success)]`
  - Mesmo pattern para PENDENTE (info) e ATRASADO (danger)
- TableHeader `bg-[color:rgba(255,255,255,0.02)]` → `bg-[var(--surface-soft)]` ou remover
- TableRow `hover:bg-[color:rgba(255,255,255,0.03)]` → remover (deixa hover padrão)
- Botão ação: remover `hover:bg-[color:rgba(56,189,248,0.08)] hover:text-[var(--info-alt)]` — `variant="ghost"` já cobre

### 4. `src/modules/recebimentos/components/recebimentos-mobile-list.tsx`
**O quê:** Mesmo badge + token cleanup
- `rounded-[16px]` → `rounded-xl` (l.23)
- **badgeStatus**: mesmas substituições rgba→color-mix + rounded-md + text-[10px]
- Botão ação: remover rgba hover customizado (l.58)
- Label tracking: `tracking-[0.12em]` → `tracking-[0.16em]` (padrão leads) — opcional

### 5. `src/modules/recebimentos/components/recebimentos-status-donut.tsx`
**O quê:** Substituir SVG donut por 3 cards de status
- Remover todo o SVG (`<circle>`, `strokeDasharray`, cálculo manual)
- Remover `<Card>` wrapper — usar divs com border
- Novo: 3 cards horizontais em grid:
  - **Recebido** (tom success): `ArrowDownCircle` icon, quantidade, valor total
  - **A vencer** (tom brand/violeta): `Clock` icon, quantidade, valor total
  - **Atrasado** (tom danger): `AlertTriangle` icon, quantidade, valor total
- Cada card: `rounded-xl border p-4` com bg tint sutil via color-mix
- Props de entrada: `dados: ItemStatus[]` (já existe, não muda)

### 6. `src/modules/recebimentos/components/recebimentos-chart-card.tsx`
**O quê:** Token cleanup
- `rounded-[16px]` → `rounded-xl` (l.13)
- Stroke `rgba(255,255,255,0.06)` → remover (default ou via className) pois é Recharts prop

### 7. `src/modules/recebimentos/components/recebimentos-tabs.tsx`
**O quê:** Token cleanup
- `rounded-[16px]` → `rounded-xl` (l.18)
- `rounded-[12px]` → `rounded-xl` (l.20)

### 8. `src/modules/recebimentos/components/recebimentos-empty-state.tsx`
**O quê:** Token cleanup
- `rounded-[16px]` → `rounded-xl` (l.30)

### 9. `src/modules/recebimentos/components/recebimentos-header.tsx`
**O quê:** Simplificar copy
- Subtitle: "Acompanhe o que entrou, o que vence e o que exige acao agora em toda a empresa." → "Acompanhe os recebimentos e pagamentos da empresa."

### 10. `src/modules/recebimentos/page.tsx`
**O quê:** Redesign do layout da página
- **Nova ordem**: Header → KPIs → ToolbarFiltros → [ChartCard + StatusCards] → Tabs → Table/MobileList
- Botão "Atualizar painel": remover como standalone, integrar como ícone pequeno no header ou próximo ao contador de registros
- Loading do dynamic import: `rounded-[16px]` → `rounded-xl`
- Token: `rounded-[12px]` (refresh button) → `rounded-xl`
- Token: `rounded-[16px]` (skeleton fallback) → `rounded-xl`

### 11. `src/app/(dashboard)/recebimentos/loading.tsx`
**O quê:** Token cleanup + KPI count fix
- `rounded-[var(--radius-shell)]` (l.7) → `rounded-xl`
- `rounded-[var(--radius-card)]` (l.21, 29) → `rounded-xl`
- Simplificar gradients complexos do header skeleton (l.7-8)
- Ajustar KPI skeletons de 3 → 4 (l.20)
- Simplificar table skeleton (remover Search skeleton que não existe na tabela real)

---

## Ordem de Execução

1. Token cleanup base (rounded, rgba→color-mix) — afeta quase todos arquivos
2. Badge pattern standardization (table + mobile-list)
3. KPI simplification (remover ornamentos)
4. StatusDonut → 3 StatusCards
5. Filters → Toolbar redesign
6. Page.tsx layout reorganization
7. Loading.tsx cleanup
8. Header copy
9. Verificar TS (`npx tsc --noEmit --pretty`)
10. Verificar build (`pnpm build`)

---

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Recharts PieChart seria mais familiar que SVG puro, mas optamos por 3 cards — gambiarra de donut removida | 3 cards são mais escaneáveis que gráfico circular |
| Filtros tipo toolbar podem quebrar em mobile | Usar `flex-wrap` + grid responsivo, já testado no layout atual |
| Mudança de layout pode desorientar usuários acostumados | É módulo novo (sem usuários reais ainda), risco baixo |
| `color-mix` não funciona em SVGs inline (ex: ChartCard stroke) | Manter rgba apenas onde color-mix não é suportado (SVG props) |

---

## Critérios de Aceitação

- [ ] Zero ocorrências de `rounded-[16px]`, `rounded-[14px]`, `rounded-[12px]` no módulo
- [ ] Zero ocorrências de `rgba(...)` em backgrounds/borders de componentes (exceto SVG props)
- [ ] StatusBadge usa `rounded-md px-1.5 py-0.5 text-[10px] font-medium` com `color-mix`
- [ ] KPIs sem blur orb e sem hover animation
- [ ] Donut SVG substituído por 3 status cards com quantia + valor
- [ ] Filtros sem seção "Filtros operacionais", sem ordenar/direção, sem info bar
- [ ] Botão de refresh não está mais standalone solto na página
- [ ] Loading.tsx usa `rounded-xl`, 4 KPIs, sem gradients complexos
- [ ] Zero TS errors no módulo (já está, confirmar que continua)
- [ ] Build passa sem erros
- [ ] Responsivo: toolbar funciona em mobile com wrap
- [ ] Badges e cards legíveis em ambos os temas (dark/light)
