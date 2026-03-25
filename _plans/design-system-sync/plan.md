# Design System Sync

## Objetivo
Sincronizar o aplicativo principal `./` com a identidade visual inferida de `./site`, criando um design system unificado para um CRM SaaS dark premium: mais denso, mais operacional e visualmente consistente com a narrativa de marca.

## Diagnóstico de Partida

### O que o `site/` comunica
- **Base visual:** fundo `#09090b`, superfícies grafite (`#0c0c0e`, `zinc-900/75`), bordas sutis, blur controlado, glow localizado e contraste alto.
- **Marca:** violeta/indigo para identidade e destaque de produto; emerald para compra, sucesso e status saudável; rose/amber/blue-cyan para semânticas específicas.
- **Tipografia:** `Inter`, headings com `tracking-tight/tighter`, labels compactos em uppercase e tracking expandido.
- **Geometria:** radius alto, cards macios, shells grandes arredondados, pills constantes e layout editorial em `max-w-7xl`.
- **Motion:** transições curtas, hover com leve lift, spring discreto em seleção/cartões, animações contínuas reservadas ao marketing.

### O que o app principal comunica hoje
- `src/app/globals.css` ainda define uma base clara com `slate`, `blue` e superfícies brancas.
- `src/components/ui/*` repete `bg-white`, `border-slate-*`, `text-slate-*` e foco azul como baseline.
- `src/components/sidebar-principal.tsx` e componentes compartilhados ainda seguem linguagem clara, com pouca relação com o shell premium do `site/`.
- Resultado: a marca vende um produto premium escuro, mas o CRM ainda parece um admin light convencional.

## Tradução de Marketing para Produto

### Regras de adaptação para CRM premium
- **Contraste para uso prolongado:** shell escuro, superfícies calmas, texto primário muito legível e redução de brilho decorativo nas áreas de trabalho.
- **Tipografia mais densa:** títulos menores que no marketing, corpo em `text-sm` ou `13px`, headers curtos e tabelas com altura compacta.
- **Foco em operação:** cards, tabelas, filtros, sidebars e modais precisam ser utilitários antes de serem expressivos.
- **Marca com disciplina:** violeta como sinal de produto, foco, seleção e navegação ativa; emerald como confirmação/sucesso/save; demais cores apenas para estados reais.
- **Motion enxuto:** nada que atrase workflow; hover, select, modal e loading devem ser rápidos, previsíveis e discretos.

### Tokens-alvo do produto
- **Canvas:** `#09090b`
- **Surface:** `#0c0c0e`
- **Surface elevated:** `#111113`
- **Surface glass:** `rgba(24,24,27,0.72)`
- **Border subtle:** `rgba(255,255,255,0.08)`
- **Border strong:** `#3f3f46`
- **Text primary:** `#fafafa`
- **Text secondary:** `#a1a1aa`
- **Text tertiary:** `#71717a`
- **Brand:** `#8b5cf6`
- **Brand strong:** `#7c3aed`
- **Success:** `#10b981`
- **Danger:** `#f43f5e`
- **Warning:** `#f59e0b`
- **Info:** `#38bdf8`
- **Info alt:** `#22d3ee`

## Blueprint de Execução

### 1. Setup dos Design Tokens

#### 1.1 Inventário e mapeamento
- Auditar `src/app/globals.css`, `src/app/layout.tsx` e os componentes base para localizar tokens claros e decisões duplicadas.
- Catalogar todas as ocorrências de `bg-white`, `text-slate-*`, `border-slate-*`, `ring-blue-*`, `text-sky-*` e `shadow-*` soltos.
- Definir uma tabela de migração `token antigo -> token novo` antes de editar componentes.

#### 1.2 Fundação do tema
- Reescrever os tokens de `src/app/globals.css` para o shell dark premium usando `@theme inline` do Tailwind v4.
- Criar nomes semânticos suficientes para: canvas, surface, elevated, glass, border-subtle, border-strong, text-primary, text-secondary, text-tertiary, brand, success, danger, warning e info.
- Definir tokens de radius, sombra, blur, focus ring e estados disabled/loading.
- Preparar utilitários para `surface-glass`, `focus-brand`, `focus-success`, `text-muted`, `shadow-soft`, `shadow-overlay` e shimmer escuro.

#### 1.3 Tipografia e base global
- Migrar a fonte principal para `Inter` no app shell.
- Manter `Geist Mono` para valores tabulares, IDs, logs e timestamps.
- Ajustar `body`, seleções, scrollbar, background noise e line-height global para refletir a linguagem premium do `site/` sem poluir telas densas.

#### Entregáveis
- Novos tokens globais em `src/app/globals.css`.
- Base tipográfica unificada em `src/app/layout.tsx`.
- Convenção oficial de nomes semânticos documentada no próprio arquivo.

#### Critérios de aceite
- Nenhum componente base precisa de cor hardcoded fora dos tokens principais.
- A aplicação passa a ter um shell escuro consistente mesmo antes do refactor completo das views.

### 2. Refatoração da Base de Componentes

#### 2.1 Componentes prioritários
- Refatorar primeiro: `button.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `card.tsx`, `badge.tsx`, `table.tsx`, `tabs.tsx`, `switch.tsx`, `tooltip.tsx` e `toast.tsx`.
- Tratar `src/components/shared/module-page-header.tsx`, `inline-status-alert.tsx`, `access-denied-card.tsx` e afins como camada logo acima da base.

#### 2.2 Regras visuais dos componentes
- **Buttons:** variante `primary` com marca, `secondary/outline/ghost` em neutros escuros, `success` reservado para ações afirmativas reais, `destructive` em rose.
- **Inputs/Selects/Textareas:** fundo escuro elevado, borda sutil, placeholder discreto, focus ring Vercel/Linear e estados disabled sem hover.
- **Cards:** parar de usar `bg-white` com sombra genérica; migrar para superfícies grafite com ring leve e elevação sutil.
- **Dialogs/Sheets/Dropdowns:** overlay escuro com blur, superfície elevada, borda semitransparente e motion curto.
- **Tables:** cabeçalhos compactos, linhas densas, hover suave, destaque de seleção com `brand-soft`, sem parecer planilha clara.

#### 2.3 Densidade e consistência
- Introduzir variantes `compact`, `default` e `comfortable` apenas onde houver necessidade operacional real.
- Garantir que altura padrão de controles fique em `40px`, variante compacta em `36px` e CTA principal em `44px`.
- Centralizar focus rings e estados `loading`, `active`, `hover` e `disabled` na base, evitando repetição nos módulos.

#### Entregáveis
- Sistema base coeso em `src/components/ui/`.
- Redução drástica de classes claras duplicadas nos componentes compartilhados.

#### Critérios de aceite
- Os componentes base parecem pertencer ao mesmo produto.
- Novas telas conseguem ser montadas sem reintroduzir `slate/white` como baseline.

### 3. Atualização de Layouts e Navegação

#### 3.1 Shell do dashboard
- Refatorar `src/app/(dashboard)/layout.tsx` para um shell premium: canvas escuro, ruído/graduation muito sutil e áreas de trabalho com surfaces calmas.
- Definir regras de container, gutters, breakpoints e max-width do dashboard.

#### 3.2 Sidebar, topbar e headers
- Refatorar `src/components/sidebar-principal.tsx` para remover o bloco azul-claro atual e substituí-lo por uma navegação dark com item ativo em `brand-soft` e marcador de seleção elegante.
- Padronizar cabeçalhos de módulo em `src/components/shared/module-page-header.tsx` para títulos menores, meta-info compacta e ações alinhadas.
- Estabelecer padrão para badges de status, breadcrumbs, contadores, filtros e quick actions.

#### 3.3 Auth e superfícies especiais
- Atualizar login/cadastro para usar a versão mais expressiva da marca: gradient/glow/noise sutis, sem perder legibilidade.
- Reservar glass e brilho mais visível para auth, onboarding, paywalls internos, drawers, modais e empty states especiais.

#### Entregáveis
- Dashboard shell consistente.
- Sidebar e page headers compartilhando a mesma linguagem de radius, cor, foco e densidade.

#### Critérios de aceite
- A navegação já transmite a marca do produto antes mesmo das views internas serem concluídas.
- O shell suporta desktop e mobile sem sacrificar contraste ou toque.

### 4. Aplicação nas Views/Páginas Principais do CRM

#### 4.1 Ordem sugerida por impacto
1. `src/app/(auth)/login/page.tsx` e `src/app/(auth)/cadastro/page.tsx`
2. `src/app/(dashboard)/resumo/page.tsx`
3. `src/modules/kanban/*` e `src/app/(dashboard)/kanban/page.tsx`
4. `src/app/(dashboard)/whatsapp/page.tsx`
5. `src/app/(dashboard)/automacoes/page.tsx`
6. `src/app/(dashboard)/equipe/*`, metas e recebimentos
7. `src/app/(dashboard)/configs/page.tsx` e módulos administrativos restantes

#### 4.2 Regras de aplicação
- Substituir wrappers claros e sombras genéricas por cards/tables/filters baseados nos novos tokens.
- Reduzir headings inflados e aproximar todas as telas de um padrão operacional: título curto, subtítulo objetivo, filtros compactos e blocos de dados alinhados.
- Em KPI cards, usar acento principal com moderação e sem glow permanente.
- Em kanban e listas, priorizar legibilidade, agrupamento e densidade; glow e glass apenas nos momentos certos.
- Preservar a arquitetura MVVM do projeto: rotas continuam finas, lógica segue nos hooks/módulos e a refatoração visual nao vira refactor estrutural desnecessário.

#### Entregáveis
- Telas prioritárias refatoradas sobre os componentes base novos.
- Módulos visuais coerentes entre si, sem “ilhas” com linguagem antiga.

#### Critérios de aceite
- `Resumo`, `Kanban`, `WhatsApp`, `Automações` e fluxos de auth já parecem parte do mesmo produto premium.
- O usuário consegue operar com menos ruído visual e sem perda de densidade.

### 5. Auditoria de UX, Contraste e Motion

#### 5.1 Contraste e acessibilidade
- Revisar contraste de texto, bordas, labels, placeholders, badges e linhas de tabela em fundo escuro.
- Garantir `focus-visible` consistente em botões, inputs, selects, links, tabs e itens de menu.
- Validar estados disabled, erro, sucesso, loading e empty states.

#### 5.2 Motion e performance percebida
- Remover animações de marketing que prejudiquem produtividade em áreas densas.
- Padronizar durations e curvas do app nas janelas definidas pelo design system.
- Respeitar `prefers-reduced-motion` em overlays, toast, dropdowns, modais e skeletons.

#### 5.3 QA visual e operacional
- Conferir responsividade desktop/mobile nos principais fluxos.
- Validar densidade de tabelas, grids, kanban, formulários e sidebars após a migração.
- Executar lint e smoke checks após cada fase relevante, evitando regressão estética e estrutural em cascata.

#### Entregáveis
- Checklist final de contraste, foco, motion, responsividade e consistência.
- Registro dos ajustes finos feitos após a auditoria.

#### Critérios de aceite
- O app principal sustenta uso prolongado com contraste alto, foco claro e motion rápido.
- A diferença entre marketing e produto deixa de ser estética; passa a ser apenas de densidade e contexto.

## Estratégia de Execução Recomendada
- Fazer a migração em **camadas**, nunca página por página sem antes estabilizar tokens e base.
- Evitar refactor cosmético fora do escopo; cada fase deve reduzir divergência sistêmica.
- Só aplicar a nova linguagem nas views depois de estabilizar `globals.css` e `src/components/ui/`.
- Tratar `SidebarPrincipal`, `ModulePageHeader` e `Resumo` como smoke test do novo sistema antes de escalar para Kanban e módulos complexos.

## Riscos Conhecidos
- Misturar token novo com classes claras legadas pode gerar telas híbridas e inconsistentes.
- Migrar view antes da base aumenta retrabalho.
- Excesso de glow/blur pode piorar leitura em telas operacionais.
- Manter `Geist` no corpo do app durante a sync enfraquece a coesão com o `site/`.

## Definição de Pronto
- `AGENTS.md` atualizado com as novas regras visuais.
- Tokens globais e base de componentes convergidos para o novo sistema.
- Shell, navegação e páginas prioritárias refletindo a mesma linguagem premium.
- Auditoria final de UX, contraste e motion concluída.
