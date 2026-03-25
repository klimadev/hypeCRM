# HYPE CRM Native Mobile Architecture

## Objetivo

Transformar o CRM em uma experiência **mobile-native premium** para smartphones e tablets, sem quebrar a arquitetura modular existente nem criar layout shift entre desktop e mobile.

Este documento define:

- O padrão visual do shell mobile.
- A substituição da sidebar por um Floating Dock.
- O novo comportamento do Pipeline como sistema de panes por swipe.
- A apresentação dos KPIs como carrossel horizontal ou grid denso.
- A estratégia técnica para Next.js 16 + React 19 com foco em estabilidade, performance e zero layout shift.

---

## Princípios de Produto

### 1. Mobile-first, mas sem amputar o desktop

- Desktop continua com sidebar, navegação lateral, densidade operacional alta e fluxo clássico.
- Mobile e tablet ganham um shell próprio, mais próximo de um app nativo.
- A troca não deve ser visualmente abrupta. O usuário precisa sentir continuidade de marca entre plataformas.

### 2. Edge-to-edge em dispositivos menores

- Em mobile, o conteúdo principal ocupa toda a largura disponível.
- As margens laterais devem ser mínimas ou inexistentes, exceto onde a legibilidade exigir respiro.
- Componentes de operação precisam priorizar altura útil e toques confortáveis.

### 3. Movimento útil, não ornamental

- O sistema pode usar `framer-motion` para microinterações e transições de navegação.
- O movimento deve ser curto, com easing elástico leve apenas em elementos pequenos como dock, tabs e cards.
- Evitar animações contínuas, loops chamativos ou transições lentas.

---

## Decisão Técnica

### Melhor caminho para o Floating Dock

**Recomendação:** usar `Framer Motion` para:

- Entrada e saída do dock.
- Destaque do item ativo.
- Animação do blob/glow sob o ícone selecionado.
- Mudanças de estado em tabs/panes.

**Por que Framer Motion aqui:**

- O dock precisa de microinterações expressivas e fluidas.
- CSS puro resolve o visual base, mas fica limitado para uma sensação “bouncy” e coordenada entre ícone, halo e fundo.
- `framer-motion` já existe no stack atual e é adequado para React 19/Next 16.
- O uso deve ser restrito ao shell mobile; o miolo operacional continua majoritariamente com CSS utilitário e componentes simples.

**Quando usar CSS transitions em vez de Framer Motion:**

- Hover e focus simples.
- Mudanças de cor, borda, sombra e opacidade.
- Estados estáticos de grid e cards.

### Estratégia híbrida recomendada

- **CSS/Tailwind** para layout, superfícies, tipografia e densidade.
- **Framer Motion** para:
  - Dock flutuante.
  - Indicador ativo.
  - Swipe de panes do pipeline.
  - Stagger curto de cards quando a tela muda.

Essa divisão reduz custo de renderização e mantém o app previsível.

---

## Arquitetura de Shell

### Decisão principal

Adotar um **Layout Wrapper responsivo** em vez de renderizar dois aplicativos diferentes.

#### Resultado esperado

- `DesktopShell` com sidebar.
- `MobileShell` com dock flutuante.
- Ambos recebem a mesma sessão e os mesmos módulos.
- A decisão visual acontece no layout, não na rota.

### Regra para evitar layout shift

Para garantir **0% layout shift**:

1. O shell desktop e mobile precisam reservar a mesma área estrutural desde o primeiro paint.
2. O conteúdo principal deve ter padding e safe-area tratados de forma consistente.
3. A troca de shell não pode depender de um "render primeiro, decidir depois" baseado em `useEffect`.
4. A decisão ideal deve ocorrer por **media query no CSS** e, quando necessário, por um hook de viewport com hidratação estável.

### Estratégia recomendada para Next.js 16

#### Opção preferida

- Manter o layout atual do dashboard como wrapper central.
- Criar um `AppShell` que sempre renderiza a estrutura base.
- Dentro dele:
  - `DesktopSidebar` aparece em breakpoints maiores.
  - `MobileDock` aparece em breakpoints menores.
- Usar CSS para esconder/mostrar com base em breakpoint, sem trocar árvore visual de maneira tardia.

#### Motivo

- Evita flicker.
- Evita dependência de cálculo de viewport no client para o primeiro paint.
- Preserva SSR e Streaming do App Router.

### Estrutura conceitual

```txt
RootLayout
└── Providers
    └── DashboardLayout
        └── AppShell
            ├── DesktopSidebar          [lg+]
            ├── MobileFloatingDock      [< lg]
            └── MainContent
                ├── PageHeader
                ├── KPI Surface
                ├── Pipeline Surface
                └── Page Body
```

---

## Wireframe 1: Floating Dock

### Requisitos visuais

- Fixo na base da tela.
- Centralizado horizontalmente.
- `backdrop-filter: blur(15px)`.
- Borda branca sutil com 10% de opacidade.
- Cantos totalmente arredondados.
- Flutuar acima do conteúdo com sombra leve e glow controlado.

### Estrutura do dock

```md
[MobileViewport]

                ┌────────────────────────────────────┐
                │            Main Content            │
                │                                    │
                │                                    │
                │                                    │
                └────────────────────────────────────┘

                       ┌─────────────────────┐
                       │  Home  Leads  WA  ⚙ │
                       └─────────────────────┘

               safe-area-bottom + shadow + blur
```

### Organização interna

```md
┌─────────────────────────────────────────────────────────┐
│ Floating Dock                                            │
│                                                         │
│  [ Home ] [ Leads ] [ WhatsApp ] [ Settings ]          │
│                                                         │
│  - ícone + label discreto                               │
│  - item ativo com halo roxo suave                      │
│  - item não ativo com baixo contraste                  │
└─────────────────────────────────────────────────────────┘
```

### Comportamento

- Dock deve ficar fora do fluxo normal.
- Não deve empurrar o conteúdo verticalmente.
- O conteúdo principal precisa reservar espaço inferior suficiente para não ficar coberto pelo dock.
- O item ativo recebe:
  - halo roxo suave.
  - pequena expansão.
  - “blob” difuso atrás do ícone.

### Interação

- Tap com resposta imediata.
- Press com leve scale-down.
- Transição curta e fluida entre rotas.
- Não usar bounce exagerado em navegação principal.

### Dimensões sugeridas

- Altura: `64px` a `72px`.
- Largura: `min(92vw, 420px)`.
- Radius: `9999px`.
- Padding horizontal: `10px` a `14px`.
- Espaço inferior: respeitar `env(safe-area-inset-bottom)` + `12px`.

---

## Wireframe 2: Mobile Pipeline

### Problema a resolver

No mobile, drag-and-drop de colunas é inviável. O pipeline precisa virar uma navegação por panes.

### Solução

Usar um sistema de **tabs sticky + swipe horizontal**.

### Estrutura

```md
[Sticky Header]
┌──────────────────────────────────────────────────────────┐
│ Em aberto | Negociação | Fechados | Perdidos | ...      │
└──────────────────────────────────────────────────────────┘

[Pane Area - swipe horizontal]
┌──────────────────────────────────────────────────────────┐
│ Pane 1: cards da etapa atual                             │
│                                                          │
│  ┌───────────────┐   ┌───────────────┐                   │
│  │ Lead Card     │   │ Lead Card     │                   │
│  │ toque grande  │   │ toque grande  │                   │
│  └───────────────┘   └───────────────┘                   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Regras de navegação

- O header das etapas fica sticky no topo.
- Cada etapa corresponde a um pane.
- O usuário pode:
  - tocar na etapa.
  - arrastar horizontalmente entre panes.
  - usar debounce leve para evitar troca acidental.

### Experiência do pane

- O pane ativo ocupa a viewport principal.
- O pane adjacente pode existir em preview parcial durante swipe.
- Cards dentro de cada pane precisam parecer objetos físicos:
  - sombra suave.
  - border sutil.
  - radius confortável.
  - leve elevação no press.

### Estrutura visual dos cards

```md
┌───────────────────────────┐
│ Nome do lead              │
│ Produto / origem          │
│ Valor / status            │
│ Ações rápidas             │
└───────────────────────────┘
```

### Regra de densidade

- Um card por linha em smartphone.
- Dois cards por linha em tablet compacto, se a etapa permitir.
- Evitar microtexto demais.
- Ações secundárias devem ir para menu contextual ou sheet.

### Sugestão técnica para swipe

- `Framer Motion` com `drag="x"` para o container de panes.
- Snap para o índice mais próximo no `onDragEnd`.
- Limite de arrasto com `dragConstraints`.
- `AnimatePresence` apenas se a troca de pane exigir desmontagem visual.

---

## Wireframe 3: KPI Carousel

### Objetivo

Trocar o bloco de KPIs por uma experiência mais nativa e tocável.

### Opção recomendada

**Horizontal Swipeable Carousel** para smartphones.

**Por quê:**

- Preserva a hierarquia dos números.
- Funciona bem em telas estreitas.
- Permite cards maiores e mais legíveis.
- Fica mais “app” do que um grid comprimido.

### Alternativa

**Masonry Grid** apenas em tablets mais largos ou telas onde o espaço vertical seja abundante.

### Estrutura do carrossel

```md
[KPI Carousel]
┌──────────────────────────────────────────────────────────┐
│  Card 1      Card 2      Card 3      Card 4             │
│  84          R$ 12k      19           93%               │
│  leads       receita     em follow-up conversão         │
└──────────────────────────────────────────────────────────┘
```

### Comportamento

- Cards com largura fixa ou quase fixa.
- Snap por card.
- Indicador de posição discreto.
- Swipe com inércia leve.
- Não esconder informações críticas demais em microcards.

### Tipografia para KPIs

- Valor principal: maior, forte, condensado.
- Label: pequena e com tracking leve.
- Delta/variação: semântica clara, com cor real do estado.

---

## Layout Hierarchy

### Mobile

```md
1. Top header mínimo
2. KPI carousel
3. Pipeline tabs sticky
4. Pane de cards
5. Floating Dock
```

### Tablet

```md
1. Top header compacto
2. KPI carousel ou grid 2 colunas
3. Pipeline tabs sticky
4. Pane de cards em largura maior
5. Dock opcional ou sidebar híbrida conforme breakpoint
```

### Desktop

```md
1. Sidebar fixa
2. Top content area
3. KPI cards em grade
4. Pipeline por coluna
5. Menos dependência de swipe
```

---

## Plano de Refatoração Técnica

### 1. Criar um shell responsivo central

Novo nível de abstração:

- `AppShell`
- `DesktopSidebar`
- `MobileFloatingDock`
- `ResponsiveContentFrame`

Esse shell deve viver fora dos módulos para ser reutilizado por todas as rotas do dashboard.

### 2. Detectar viewport sem quebrar SSR

**Regra:** não depender de `window` no primeiro render.

Estratégia:

- Basear a renderização principal em CSS breakpoints.
- Se um componente precisar saber o viewport para lógica de swipe ou densidade:
  - usar um hook client-only com valor inicial estável.
  - nunca trocar a estrutura principal depois do mount.

### 3. Manter o layout estável

Para manter 0 layout shift:

- reservar `padding-bottom` suficiente para o dock em mobile.
- manter alturas previsíveis para header e KPIs.
- usar `min-height` nos blocos principais.
- evitar conteúdo “saltando” quando a sessão, permissões ou dados carregarem.

### 4. Adaptar os módulos existentes

Os módulos devem continuar sendo a fonte de verdade.

Mudanças esperadas:

- `resumo`: vira a principal vitrine do carrossel de KPIs.
- `kanban`: ganha modo mobile por panes.
- `whatsapp`: pode usar CTA de dock ou botão flutuante secundário.
- `configs`: navegação simplificada e cabeçalhos compactos.

### 5. Não quebrar a arquitetura MVVM

O shell novo não deve concentrar regra de negócio.

- `layout.tsx` continua só verificando sessão e importando o shell.
- `page.tsx` dos módulos continua fino.
- os hooks continuam sendo o cérebro das telas.

---

## Direção Visual do Mobile Native

### Tipografia

- Títulos: maiores que no desktop, mas ainda densos.
- Números KPI: destaque forte.
- Labels: compactos e funcionais.

### Componentes

- Cards com radius generoso, sombra curta e borda sutil.
- Botões com área de toque ampla.
- Menus secundários em bottom sheet.
- Foco visual com anel roxo interno + halo externo discreto.

### Motion

- Entrada de dock: `180ms` a `220ms`.
- Troca de tabs: `160ms` a `200ms`.
- Press de card: `80ms` a `120ms`.
- Evitar delays perceptíveis.

### Acento visual

- Roxo é reservado para marca, navegação ativa e foco.
- Cores semânticas só entram quando a informação justificar.
- O shell pode ter brilho sutil, mas a área de trabalho deve permanecer calma.

---

## Recomendação Final de Implementação

### Eu faria assim

1. Criaria um `AppShell` único no dashboard.
2. Renderizaria `SidebarPrincipal` apenas em desktop.
3. Introduziria `MobileFloatingDock` como substituto em mobile/tablet.
4. Refatoraria o pipeline para um modelo de tabs + panes com swipe.
5. Transformaria os KPIs em carrossel horizontal no mobile.
6. Usaria `framer-motion` só onde a sensação de produto realmente depende disso.

### Por que essa abordagem

- Mantém compatibilidade com a base atual.
- Evita um segundo sistema de rotas.
- Preserva SSR, App Router e permissões já existentes.
- Faz o CRM parecer um produto nativo sem virar um app separado.

---

## Entregáveis sugeridos para a próxima etapa

- `native-mobile-specs/ui-architecture.md` como documento-base.
- Protótipo de `AppShell`.
- Prova de conceito do `MobileFloatingDock`.
- Prova de conceito do `PipelineTabsPanes`.
- Prova de conceito do `KpiCarousel`.

