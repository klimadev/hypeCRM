# Plano: Overhaul de UX — Módulo Kanban/Pipelines

## Diagnóstico

Módulo Kanban atual é funcional mas confuso. Os problemas centrais:

1. **Poluição visual** — cards com info demais, KPI cards no header, múltiplas camadas de filtro
2. **Falta hierarquia clara** — pipeline list → board → card details se misturam
3. **Feedback zero** — drag solta card sem animação, ações sem confirmação visível
4. **Jargão confuso** — "negócio" vs "lead" vs "estágio" vs "pipeline" tudo aparece sem explicação
5. **Desktop-first num mundo mobile** — board horizontal quebra em telas menores
6. **Modais profundos** — clicar num card abre drawer que abre outro modal

---

## Princípios (João Pedro 67 anos)

| Princípio | Como |
|---|---|
| **Auto-explicativo** | Toda ação diz o que faz, toda seção tem título em português claro |
| **Menos é mais** | Um card mostra 3 campos no máximo, o resto expande |
| **Feedback óbvio** | Toda ação tem animação/sonora/visual imediata |
| **Toque amigável** | Alvos grandes, espaçamento generoso, sem hover-dependência |
| **Consistência** | Mesmo padrão visual em todo o módulo |

---

## Escopo — Fases

### Fase 1: Pipeline Catalog (tela inicial de seleção)

**Arquivos:** `kanban-pipeline-catalog.tsx`, `pipeline-modal.tsx`, `kanban/page.tsx`

**Problemas atuais:**
- Grid confuso, cards com info irrelevante (slug, descrição longa)
- Botão "Abrir quadro" é o único CTA mas compete com "Settings" gear
- "Nenhum funil encontrado" parece erro mesmo quando é estado inicial

**O que fazer:**
1. Redesenhar catalog: lista vertical limpa (1 linha por pipeline, nome + badge padrão + botão "Abrir")
2. Criar pipeline vira ação inline (não modal) ou modal simplificado com 1 campo
3. Adicionar ilustração/empty-state amigável quando não tem pipeline ("Crie seu primeiro funil em 10 segundos")
4. Separar gerenciamento (editar/deletar) em tela à parte ou popover, não poluir a listagem
5. Adicionar loading skeleton óbvio

**Critério de aceite:**
- Um João Pedro 67 anos abre a página e em 5s entende que precisa escolher ou criar um funil
- Criar pipeline leva ≤2 cliques e 1 campo obrigatório

---

### Fase 2: Board Kanban (colunas + cards)

**Arquivos:** `kanban-board.tsx`, `kanban-board-column.tsx`, `kanban-board-mobile.tsx`, `kanban-card.tsx`, `pipeline-card.tsx`

**Problemas atuais:**
- Card tem dezenas de props, info demais
- Nenhum affordance visual que o card é arrastável
- Diferença entre "negócio" e "lead" não é explicada em lugar nenhum
- Scroll horizontal em desktop é descoberto por acaso
- Mobile board é versão empobrecida, não adaptada

**O que fazer:**
1. **Simplificar card:** mostrar só nome, valor (se >0), e um indicador visual de pendência (bolinha vermelha). Resto no drawer
2. **Adicionar affordance:** sombra suave ao hover, "pega" visível ao drag, animação de drop (scale bounce)
3. **Explicar termos:** tooltip "O que é um negócio?" no header, link pra ajuda inline
4. **Scroll horizontal com dica visual:** fade nas bordas, seta "→" piscando se tiver colunas fora da viewport
5. **Mobile:** adaptar para accordion vertical (estágio → lista) ao invés de imitar desktop
6. **Diferenciar estados:** cores de borda/background sutis para pendência crítica, lead novo, negócio parado

**Critério de aceite:**
- João Pedro 67 anos arrasta um card na primeira tentativa
- Saber o que é cada coluna sem precisar perguntar
- Mobile mostra conteúdo útil, não "vire o celular"

---

### Fase 3: Header + Filtros

**Arquivos:** `kanban-header.tsx`, `kanban-header-desktop.tsx`, `kanban-header-mobile.tsx`, `kanban-header.utils.ts`

**Problemas atuais:**
- Header tem KPI cards + funnel selector + filtros + busca + botão novo negócio + pendências + origem stats + modo foco — tudo no mesmo espaço
- Filtro rápido vs filtro normal vs modo foco vs ordenação — sobreposição confusa

**O que fazer:**
1. **Reduzir header a 1 linha:** seletor de pipeline à esquerda, botão "Novo negócio" à direita
2. **Mover KPIs para linha separada (ou esconder em "Ver métricas")** — não poluir toolbar principal
3. **Filtros em popover dedicado** — ícone de funil abre painel condensado com: busca texto, origem, funcionário
4. **Modo foco pendências vira toggle simples** — não um estado visual diferente
5. **Badge de pendências no título** — "Pipeline X (3 pendentes)" ao invés de KPI card

**Critério de aceite:**
- Header ocupa ≤80px vertical
- João Pedro acha "Novo negócio" em ≤2s
- Sabe aplicar filtro sem instrução

---

### Fase 4: Drawer de Detalhes do Negócio

**Arquivos:** `lead-details-drawer.tsx`, `perda-dialog.tsx`, `novo-negocio-dialog.tsx`

**Problemas atuais:**
- Drawer mistura info de lead, negócio, estágio, pendências — difícil de navegar
- "Perda" não tem fluxo claro (motivo é opcional, não tem confirmação)
- Novo negócio pede campos demais (contato, estágio, funcionário, origem, etc)
- DrawerDetailsDrawer tem props infinitas (30+)

**O que fazer:**
1. **Drawer com abas simples:** "Dados" | "Histórico" | "Pendências" — no máximo 3
2. **Dados do negócio em seções colapsáveis** — info contato, info comercial, timestamps
3. **Fluxo de perda:** 1 clique "Perder negócio" → razão em select obrigatório (3 opções) → confirmar
4. **Novo negócio:** wizard de 2 passos (1º contato, 2º detalhes) ou formulário expansível
5. **Ações primárias destacadas:** botão "Mover para..." e "Perder" visíveis SEM scroll

**Critério de aceite:**
- João Pedro encontra telefone do contato em ≤3s
- Perde um negócio em ≤3 cliques
- Sabe exatamente o que cada campo significa

---

### Fase 5: Gestão de Estágios

**Arquivos:** `stage-modal.tsx`, `stage-type-badge.tsx`

**Problemas atuais:**
- Estágio tem "tipo" (novo, qualificado, proposta, fechado, perdido) mas badge é só label
- Não dá pra reordenar estágios no board
- Criar/editar estágio é modal separado que ninguém acha

**O que fazer:**
1. **Estágios editáveis inline no board** — botão "⚙" na coluna abre rename/reorder direto
2. **Badge de tipo vira cor de fundo da coluna** — feedback visual imediato do estágio
3. **Remover modal de estágio** — fundir com pipeline modal ou fazer inline
4. **Reordenação drag** — estágios arrastáveis igual cards

**Critério de aceite:**
- João Pedro renomeia estágio sem entrar em modal
- Entende o progresso visualmente (cores + posição)

---

### Fase 6: Micro-interações e Feedback

**Em todos os componentes:**

| Onde | O que |
|---|---|
| Drag & drop | Sombra + escala + haptic feedback (mobile) |
| Criar pipeline | Toast "Pipeline criado!" com undo |
| Mover card | Animação de voo entre colunas |
| Perder negócio | Confirmação destrutiva (botão vermelho, texto "Tem certeza?") |
| Erro de rede | Toast não-blocking + estado visual no card |
| Loading | Skeleton shimmer em vez de spinner genérico |
| Empty state | Ilustração + texto útil + CTA |

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Over engineering na simplificação | Iterar: ship versão limpa primeiro, refinamentos depois |
| Perder funcionalidade existente | Mapear props/sinais atuais antes de deletar código |
| Mobile quebra | Testar em viewport 375px em cada PR |
| Usuários resistirem a mudança | Manter toggle "visual clássico" por 2 semanas (opcional) |

---

## Prioridade de Implementação

```
Fase 1 → Fase 3 → Fase 2 → Fase 4 → Fase 5 → Fase 6
```

Justificativa: Fase 1 (catalog) é a porta de entrada, mais rápida de fazer, dá vitória cedo. Fase 3 (header) limpa o topo. Fase 2 (board) é o core. Fase 4 (drawer) e 5 (estágios) refinam. Fase 6 (micro-interações) é o polish contínuo.

---

## Arquivos a Modificar

```
src/modules/kanban/
├── page.tsx                          # ModularKanban - simplificar props drilling
├── types.ts                          # Limpar tipos, remover obsoletos
├── components/
│   ├── kanban-pipeline-catalog.tsx   # F1 - redesign completo
│   ├── pipeline-modal.tsx            # F1 - simplificar para 1 campo
│   ├── kanban-header.tsx             # F3 - reduzir drasticamente
│   ├── kanban-header-desktop.tsx     # F3 - simplificar
│   ├── kanban-header-mobile.tsx      # F3 - adaptar
│   ├── kanban-header.utils.ts        # F3 - simplificar filtros
│   ├── kanban-board.tsx              # F2 - + affordance, animação
│   ├── kanban-board-column.tsx       # F2/F5 - cor de fundo por estágio, reorder
│   ├── kanban-board-mobile.tsx       # F2 - redesign vertical
│   ├── pipeline-card.tsx             # F2 - simplificar card
│   ├── lead-details-drawer.tsx       # F4 - abas, simplificar
│   ├── perda-dialog.tsx              # F4 - fluxo claro
│   ├── novo-negocio-dialog.tsx       # F4 - wizard 2 passos
│   ├── stage-modal.tsx               # F5 - inline
│   └── stage-type-badge.tsx          # F5 - virar cor de fundo
├── hooks/
│   ├── use-kanban-module.ts          # Refatorar props, estados
│   ├── use-kanban-dados.ts           # Simplificar queries
│   └── use-kanban-movimentacao.ts    # + feedback animado
```

---

## Verificação

- [ ] Catalog: 1 clique abre pipeline, 2 cliques cria novo
- [ ] Board: card mostra ≤3 campos, arrasta sem instrução
- [ ] Header: ≤80px, "Novo negócio" visível sem scroll
- [ ] Drawer: info de contato em ≤3s
- [ ] Mobile: board funcional sem scroll horizontal
- [ ] Feedback: toda ação tem toast/skeleton/animação
- [ ] Perder negócio: ≤3 cliques com confirmação
- [ ] Pipeline vazio: ilustração + CTA claro
