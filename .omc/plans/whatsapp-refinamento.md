# Plano: Refinamento do Módulo WhatsApp

## A Tese Central

**Uma interface não informa — ela persuade.**

O JP não abre o WhatsApp pra "apreciar o design". Ele abre pra **agir**: conectar uma instância, ler uma mensagem, reenviar um job que falhou. Toda vez que a interface desvia a atenção dele do objetivo — com um brilho decorativo, um badge de formato diferente, um spinner que não mostra o que vem — **ela está persuadindo ele a confiar menos**.

O refinamento do WhatsApp não é estético. É uma **engenharia de persuasão** onde cada linha removida torna mais fácil pro JP confiar, agir e seguir.

---

## As 4 Camadas de Persuasão

```
┌──────────────────────────────────────────────┐
│  1. CONSISTÊNCIA (Cialdini)                   │
│  Badges, borders, radius iguais aos outros    │
│  módulos → JP confia porque reconhece         │
├──────────────────────────────────────────────┤
│  2. FLUÊNCIA COGNITIVA (Kahneman/Oppenheimer) │
│  Menos ruído visual → informação mais crível  │
│  sem esforço extra do cérebro                 │
├──────────────────────────────────────────────┤
│  3. RESPEITO AO CONTEXTO (Voss/FBI)           │
│  Interface que escuta → JP se sente entendido │
│  Wizard escondido, QR collapsível             │
├──────────────────────────────────────────────┤
│  4. ANTECIPAÇÃO (Doherty Threshold)           │
│  Skeleton em vez de spinner → menos ansiedade │
│  O cérebro prevê, não espera                  │
└──────────────────────────────────────────────┘
```

Cada mudança neste plano opera em pelo menos uma dessas camadas. Algumas em todas.

---

## Referências-Chave (funcionais)

### Livros

| Livro | Autor | Princípio | Link |
|-------|-------|-----------|------|
| **Influence: The Psychology of Persuasion** | Robert Cialdini | Reciprocidade, Compromisso/Consistência, Prova Social, Autoridade, Afinidade, Escassez | https://www.influenceatwork.com/principles-of-persuasion/ |
| **Thinking, Fast and Slow** | Daniel Kahneman | Sistema 1 vs Sistema 2, Fluência Cognitiva, Viés de Disponibilidade | https://www.nobelprize.org/prizes/economic-sciences/2002/kahneman/biographical/ |
| **Never Split the Difference** | Chris Voss (FBI) | Escuta Ativa, Rotulagem, Respeito ao Contexto, "Não" como Proteção | https://www.blackswanltd.com/the-black-swan-group |
| **Don't Make Me Think** | Steve Krug | Usabilidade como redução de atrito, "Remove metade das palavras, depois remove metade do que sobrou" | https://sensible.com/dont-make-me-think/ |
| **The Design of Everyday Things** | Don Norman | Affordances, Signifiers, Mapping, Feedback, Descoberta vs Compreensão | https://www.nngroup.com/books/design-everyday-things/ |
| **Tiny Habits** | BJ Fogg | Behaviour Model (B=MAP): Motivação, Habilidade, Gatilho. A interface é o gatilho. | https://www.behaviormodel.org/ |
| **Predictably Irrational** | Dan Ariely | Contexto e Ancoragem, o poder do grátis, o custo da escolha | https://www.predictablyirrational.com/ |

### Leis de UX e Referências Online

| Lei / Conceito | Fonte | Link |
|----------------|-------|------|
| **Hick's Law** | Tempo de decisão aumenta com nº de escolhas | https://lawsofux.com/hicks-law/ |
| **Jakob's Law** | Usuários passam 90% do tempo em outros sites. Esperam que o seu funcione igual. | https://www.nngroup.com/articles/jakobs-law-internet-ux/ |
| **Aesthetic-Usability Effect** | Design mais agradável é percebido como mais fácil de usar | https://www.nngroup.com/articles/aesthetic-usability-effect/ |
| **Processing Fluency** | Informação fácil de processar é julgada como mais verdadeira (Oppenheimer, 2006) | https://journals.sagepub.com/doi/10.1111/j.1467-9280.2006.01772.x |
| **Doherty Threshold** | Produtividade sobe quando resposta < 400ms | https://www.interaction-design.org/literature/article/doherty-threshold |
| **Cognitive Load Theory** | Carga cognitiva intrínseca, estranha e relevante (Sweller) | https://en.wikipedia.org/wiki/Cognitive_load |
| **Fitts's Law** | Tempo para atingir um alvo depende do tamanho e distância | https://lawsofux.com/fittss-law/ |
| **Tesler's Law** | Toda aplicação tem complexidade inerente que não pode ser removida, só movida | https://lawsofux.com/teslers-law/ |
| **Occam's Razor** | A solução mais simples é geralmente a correta | https://lawsofux.com/occams-razor/ |
| **Mere Exposure Effect** | Repetição aumenta afinidade (Zajonc, 1968) | https://en.wikipedia.org/wiki/Mere-exposure_effect |
| **Peak-End Rule** | Experiências são julgadas pelo pico e pelo fim | https://en.wikipedia.org/wiki/Peak%E2%80%93end_rule |
| **Gestalt Principles** | Proximidade, Similaridade, Fechamento, Figura-Fundo | https://en.wikipedia.org/wiki/Gestalt_psychology |
| **Von Restorff Effect** | O que é único chama mais atenção | https://en.wikipedia.org/wiki/Von_Restorff_effect |

---

## O Que Eu Passei Batido (Nuances Perdidas)

Na primeira versão do plano, essas coisas não estavam lá.

### 1. O loading.tsx está MENTINDO pro JP 🌟

`src/app/(dashboard)/whatsapp/loading.tsx` mostra um **layout de chat** (sidebar + área de mensagens), mas a página real `/whatsapp` mostra **instâncias** (lista de conexões). O loading foi copiado do módulo de chat e nunca atualizado.

Isso é pior que um spinner: o cérebro do JP começa a construir um modelo mental do "chat que está chegando", e quando a página real carrega com uma lista de instâncias, **o modelo mental quebra**. Ele precisa descartar a previsão e reconstruir.

**Persuasão:** Violação da **Expectativa vs Realidade** (Peak-End Rule de Kahneman). Cada loading errado = pequena traição. Acumula.

**Conserto:** loading.tsx precisa mostrar skeletons de **3 KPIs + wizard + grid de cards de instância**, não um layout de chat.

### 2. O chat tem DOIS componentes de bolha DIFERENTES 🫧

- `src/modules/whatsapp/components/chat/whatsapp-message-bubble.tsx` (WhatsappMessageBubble) — usado pelo painel de chat do whatsapp
- `src/modules/chat/components/chat-message-list.tsx` (MessageBubble) — usado pelo chat unificado

**Eles são implementados em paralelo**, com estilos diferentes. O primeiro usa `borderRadius` inline com `style={{ borderRadius: '18px 18px 4px 18px' }}`. O segundo usa `rounded-[20px]` com gradient linear roxo. Um marginalmente diferente do outro.

JP nota? Não conscientemente. Mas o cérebro dele registra "hmm, o chat do lead X é diferente do chat do lead Y" e gasta 0.1s extra processando.

**Persuasão:** Violação da **Lei de Jakob** — inconsistência interna dentro do mesmo sistema. O cérebro de JP não consegue formar um schema único pra "chat".

### 3. O chat tem CAMADAS DE DECORAÇÃO EMPILHADAS 🎨

`whatsapp-chat-panel.tsx` (l.62-69):
```tsx
// PRIMEIRA camada: radial gradient brand
bg-[radial-gradient(circle_at_top,var(--brand-soft),transparent_38%)]
// SEGUNDA camada: dot pattern + linear gradient
style={{
  backgroundImage: `
    radial-gradient(circle ..., transparent 1px, transparent 1px),
    linear-gradient(to bottom, var(--surface-soft), transparent)
  `
}}
```

Duas camadas de background gradient + um dot pattern = **três decorações simultâneas** no fundo onde JP lê mensagens. É o equivalente visual de três pessoas sussurrando enquanto ele tenta conversar.

**Persuasão:** Violação da **Figura-Fundo (Gestalt)** — o fundo compete com o conteúdo. O cérebro gasta energia filtrando ruído visual.

### 4. `tracking-[0.14em]` e `tracking-[0.16em]` estão ESPALHADOS SEM SISTEMA

Cada label usa um tracking diferente:
- KPI: `tracking-[0.16em]` 
- JobsStatus: `tracking-[0.16em]`
- Conexão Badge: `tracking-[0.14em] uppercase`
- JobsTableHeader subtitle: `tracking-[0.16em] uppercase`
- MessageList date separator: `tracking-[0.18em]`

Três variações (0.14, 0.16, 0.18) no mesmo módulo. A diferença entre 0.14 e 0.18 é **imperceptível** pra maioria das pessoas, mas o código carrega complexidade por algo que ninguém vê.

**Persuasão:** Violação da **Lei de Tesler** — a complexidade de manter 3 tracking values diferentes não foi eliminada, só escondida no código. O JP não vê, mas todo dev que tocar nesse código vai gastar tempo tentando entender "qual tracking usar aqui?"

### 5. O botão de enviar mensagem tem `shadow-glow` ✨

`whatsapp-message-input.tsx` (l.82): `shadow-[var(--shadow-glow)]`.

O JP digita uma mensagem e o botão brilha. É um feedback legítimo — "pode enviar" — mas o brilho é **decorativo demais** pro contexto. Ele não precisa de glow, precisa de um botão que comunique "clique aqui pra enviar". O glow é o equivalente a um vendedor acenando.

**Persuasão:** Violação da **Afinidade (Cialdini)** — excesso de entusiasmo reduz credibilidade. Um botão que brilha demais parece desesperado.

### 6. O badge de conexão tem glow no status 🟢

`whatsapp-connection-badge.tsx` (l.12): `shadow-[0_0_0_4px_color-mix(in_srgb,var(--success)_20%,transparent)]`

O ponto de status (verde/vermelho) tem um **halo** de 4px. É decoração pura. O ponto **já comunica** o status. O halo diz "olha pra mim, sou importante!" — mas se o status é offline, por que celebrar?

**Persuasão:** Violação da **Lei de Prägnanz** (Gestalt) — a forma mais simples é a que o cérebro prefere. O halo é complexidade desnecessária.

### 7. Animated bounce dots no loading de mensagens 🔴

`whatsapp-message-list.tsx` (l.42-48): 3 dots com `animate-bounce` e delays escalonados.

É charmoso, mas **não serve à tarefa**. JP quer saber "as mensagens estão carregando" — um skeleton simples faz isso. A animação bounce é o **produto.md diz explicitamente**: "Decorative motion that doesn't convey state. Motion conveys state, not decoration."

### 8. FilterPill no JobsTableHeader tem hover animation 🚀

`jobs-table-header.tsx` (l.27): `hover:-translate-y-px hover:shadow-[var(--shadow-md)]`

O filtro "sobe" 1px quando o mouse passa. É uma animação de 2021 — bonitinha na época, hoje é ruído. Cada hover animation que não serve a um propósito funcional é um micro-pedido de atenção.

---

## Mapa de Mudanças com Mecanismo de Persuasão

### Grupo 1: Loading (2 arquivos — maior impacto no dia do JP)

#### 1.1 `src/app/(dashboard)/whatsapp/loading.tsx` (~43 → ~28 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Layout** | Mostra sidebar de chat + área de mensagens (layout ERRADO) | Mostra 3 KPIs skeletons + wizard skeleton + grid de cards |
| **Background** | `bg-[linear-gradient(180deg,rgba(17,17,19,0.96),rgba(12,12,14,0.94))]` + overlay radial roxo+cyan | `bg-[var(--surface)] border` |
| **Radius** | `var(--radius-shell)`, `var(--radius-card)`, `var(--radius-control)` | `rounded-xl` |

**Mecanismo de Persuasão:**
> **Antecipação (Doherty Threshold)** — O skeleton correto prepara o cérebro do JP pro layout real. Ele já começa a escanear a silhueta dos KPIs antes dos dados chegarem. O skeleton errado (chat layout) força o cérebro a descartar a previsão e recomeçar.
>
> **Fluência Cognitiva (Kahneman/Oppenheimer)** — 3 fontes de ruído visual removidas (gradient linear, overlay radial, opacity filter). A informação real (o que está carregando) chega sem competição.

**Código:** ~15 linhas removidas (gradients, overlay, layout incorreto, radius vars)

#### 1.2 `src/modules/whatsapp/page.tsx` (~208 → ~195 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Loading** | `<Loader2>` spinner centrado | `<Skeleton>` grid de KPIs + wizard + lista |
| **KPI 1 (l.129)** | `radial-gradient(circle_at_top_left,...)` decorativo | Removido |
| **KPI icons** | `shadow-[var(--shadow-sm)]` nos 3 | Removido |
| **Wizard** | Sempre visível | Só aparece se step < 3 |
| **Label (l.194)** | `tracking-[0.14em]` | `text-xs font-semibold` |

**Mecanismo de Persuasão:**
> **Peak-End Rule (Kahneman)** — O loading skeleton é o **pico** da primeira impressão. Spinner diz "não sei o que vem, espera aí". Skeleton diz "aqui está o que você vai ver, só um instante". JP termina o carregamento com a sensação de que a ferramenta é previsível.
>
> **Afinidade (Cialdini)** — O ornamento decorativo no primeiro KPI diz "este card é especial". Mas os 3 cards são equivalentes. É uma falsa hierarquia. Remover o ornamento comunica "cada card é igualmente importante" — respeito pela inteligência do JP.

**Código:** ~10 linhas removidas (gradient orb, tracking, shadows, spinner), ~15 adicionadas (skeleton). **Net: +5** (investimento em UX pago em cada carregamento futuro)

---

### Grupo 2: Instâncias (4 arquivos — o core do módulo)

#### 2.1 `src/modules/whatsapp/components/instances-list-card.tsx` (~113 → ~88 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Barra decorativa (l.54)** | `absolute left-0 top-0 h-1 w-full` em 3 cores | Removida |
| **Avatar ring** | `ring-2 ring-[var(--success)] ring-offset-2` no conectado | Removido (badge já cobre) |
| **Latência/uptime (l.83-89)** | Card interno `rounded-lg bg-[var(--surface-soft)] p-3` | Texto simples sem ícones |
| **QR code** | Sempre visível | Collapsível (só quando clica) |
| **3 ações** | Reconectar + Atualizar + Excluir | 2 botões (atualizar fundido no reconectar) |
| **Badge** | `rounded-full border px-2.5 py-1 text-xs font-medium` | `rounded-md px-1.5 py-0.5 text-[10px] font-medium` |

**Linhas de código:** ~25 removidas = ~25 a menos

**Mecanismo de Persuasão:**
> **Hick's Law** — 5 seções visuais no card → 2. Decisão mais rápida. O card atual tem **avatar + 3 labels + badge + latência + uptime + QR + timer + 3 botões**. São 11 elementos competindo. Depois: **avatar + 2 labels + badge + 2 botões**. Sete elementos a menos. O cérebro escaneia em metade do tempo.
>
> **Lei da Proximidade (Gestalt)** — elementos relacionados são agrupados, não aninhados em cards dentro de cards. O nested card de latência dentro do card de instância viola a hierarquia visual.
>
> **Processo de Decisão (Voss/FBI)** — Três botões = três perguntas pro JP: "Devo reconectar? Devo atualizar? Devo excluir?" Duas perguntas é mais fácil que três. Reduz a **paralisia de decisão**.

#### 2.2 `src/modules/whatsapp/components/instances-list-qr-code.tsx` (~86 → ~72 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Barra progresso** | `h-2 w-full rounded-full bg-[var(--surface-soft)]` com cor dinâmica | Removida (timer texto cobre) |
| **Wrapper duplicado** | Carregando e exibindo em containers separados | Container único com ternário |
| **Radius** | `var(--radius-card)` (x3) | `rounded-xl` |

**Linhas de código:** ~14 removidas = ~14 a menos

**Mecanismo de Persuasão:**
> **Doherty Threshold** — A barra de progresso de 60 segundos é um dos exemplos mais clássicos de **má implementação de tempo de espera**. A barra não acelera o QR, não informa o JP, só conta 60 → 0. É um cronômetro de ansiedade. O texto "45s restantes" comunica a mesma informação sem a estética de "urgência" da barra colorida (verde → amarelo → vermelho).
>
> **Escassez (Cialdini)** — O QR expirar já é o gatilho de escassez ("conecte agora ou o QR expira"). A barra colorida adiciona um viés emocional desnecessário. O texto é suficiente.

#### 2.3 `src/modules/whatsapp/components/instances-list.tsx` (~49 → ~44 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Empty state radius** | `rounded-[var(--radius-card)]` | `rounded-xl` |
| **Empty state icon** | `border border-[var(--border-subtle)] bg-[var(--surface-elevated)]` | Sem border/bg extras |

**Linhas de código:** ~5 removidas = ~5 a menos

#### 2.4 `src/modules/whatsapp/components/instances-list.utils.ts` (~76 → ~72 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Badge className** | `rounded-full border px-2.5 py-1 text-xs font-medium` | `rounded-md px-1.5 py-0.5 text-[10px] font-medium` |

**Linhas de código:** Sem alteração de linha, 5 classNames atualizadas

**Mecanismo de Persuasão (para 2.3 + 2.4 juntos):**
> **Consistência (Cialdini)** — Badges de leads: `rounded-md px-1.5 py-0.5 text-[10px]`. Badges de recebimentos: `rounded-md px-1.5 py-0.5 text-[10px]`. Badges de kanban: `rounded-md px-1.5 py-0.5 text-[10px]`. Badges de whatsapp (agora): `rounded-md px-1.5 py-0.5 text-[10px]`. O cérebro do JP não precisa reaprender. O sistema completo fala a mesma língua.
>
> **Mere Exposure Effect (Zajonc)** — Repetição da mesma forma de badge em 4 módulos diferentes → familiaridade → confiança. O JP não precisa gostar conscientemente dos badges. O cérebro dele passa a preferi-los simplesmente por vê-los repetidos.

---

### Grupo 3: Wizard e Conexão (3 arquivos)

#### 3.1 `src/modules/whatsapp/components/whatsapp-connection-wizard.tsx` (~140 → ~110 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Gradient orb (l.63)** | `radial-gradient(circle_at_0%_0%,...)` | Removido |
| **Kicker "Conexão guiada" (l.65-67)** | `Sparkles` + `Conexão guiada` + tracking | Removido (título já cobre) |
| **Step indicator (l.73-93)** | 3 cards em grid com cores variáveis | `flex gap-2` com números simples |
| **Input (l.103)** | `bg-[var(--surface-elevated)]` custom | Input base |

**Linhas de código:** ~30 removidas = ~30 a menos

**Mecanismo de Persuasão:**
> **Afinidade (Cialdini) + Voss** — O kicker "CONEXÃO GUIADA" com sparkles é a interface **gritando** "OLHA QUE LEGAL!". JP já conectou instâncias antes. Ele não precisa de fanfarra. Precisa de um formulário simples. A fanfarra comunica "eu acho que você é iniciante" — e JP se sente subestimado.
>
> **Curse of Knowledge** (Camerer, 1989) — Quem criou o wizard acha que o sparkle é útil porque sabe que o wizard foi difícil de fazer. JP não se importa com o esforço. Só com o resultado.
>
> **Prova Social (Cialdini)** — Um wizard simples e direto comunica "todo mundo usa isso, é tranquilo, só preencha". Um wizard decorado comunica "isso é uma grande conquista!" — o que faz JP pensar "por que estão celebrando? Isso é difícil?"

#### 3.2 `src/modules/whatsapp/components/whatsapp-connection-scan-step.tsx` (~121 → ~105 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Barra progresso** | Timer + barra colorida verde→amarelo→vermelho | Timer texto apenas |
| **Layout** | `lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]` | `md:grid-cols-[1.2fr_1fr]` |
| **Marcos** | `rounded-xl border px-3 py-2 text-sm` | `rounded-md px-2 py-1.5 text-xs` |

**Linhas de código:** ~16 removidas = ~16 a menos

**Mecanismo de Persuasão:**
> **Peak-End Rule** — A experiência de escanear QR termina com a **conexão bem-sucedida**, não com a expiração do timer. A barra colorida que fica VERMELHA quando expira é o **fim artificial** que domina a memória. Um timer texto é neutro.

#### 3.3 `src/modules/whatsapp/components/whatsapp-connection-success-step.tsx`

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Check** | Ícone de sucesso (já funcional) | Manter, verificar radius vars |

**Linhas de código:** ~2 (radius cleanup)

---

### Grupo 4: Jobs e Automações (4 arquivos)

#### 4.1 `src/modules/whatsapp/components/jobs-table.tsx` (~109 → ~96 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Loading** | `<Loader2>` spinner | `<Skeleton>` rows |
| **Radius** | `var(--radius-card)` (x2) | `rounded-xl` |
| **Empty state** | `TimerReset h-8 w-8` | `TimerReset h-6 w-6` |

**Linhas de código:** ~13 removidas, ~5 adicionadas (skeleton). **Net: -8**

**Mecanismo de Persuasão:**
> **Antecipação** — Mesmo padrão do page.tsx. Skeleton prepara, spinner ansiedade.

#### 4.2 `src/modules/whatsapp/components/jobs-table-row.tsx` (~162 → ~155 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Badge** | `<Badge variant={...}> gap-1.5 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em]` | `rounded-md px-1.5 py-0.5 text-[10px] font-medium` |
| **ErrorTooltip** | `rounded-[var(--radius-control)]` | `rounded-xl` |
| **Retry button** | `rounded-full border` | `rounded-md` |
| **Countdown "Agora!"** | `animate-pulse` | Remover pulse |

**Linhas de código:** ~7 removidas = ~7 a menos

#### 4.3 `src/modules/whatsapp/components/jobs-table-header.tsx` (~73 → ~67 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Radius icon** | `rounded-[var(--radius-control)]` | `rounded-xl` |
| **Subtitle** | `tracking-[0.16em] uppercase` | `text-xs font-semibold` |
| **FilterPill hover** | `hover:-translate-y-px hover:shadow-[var(--shadow-md)]` | Só hover color |

**Linhas de código:** ~6 removidas = ~6 a menos

#### 4.4 `src/modules/whatsapp/components/jobs-status.tsx` (~50 → ~44 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Radius icon** | `rounded-[var(--radius-control)]` | `rounded-xl` |
| **Chips** | `rounded-full border bg-[var(--surface-soft)]` | `rounded-md` |
| **Shadow icon** | `shadow-[var(--shadow-sm)]` | Removido |

**Linhas de código:** ~6 removidas = ~6 a menos

---

### Grupo 5: Chat (5 arquivos — o mais sensível)

#### 5.1 `src/modules/whatsapp/components/chat/whatsapp-chat-panel.tsx` (~113 → ~95 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Container radius** | `rounded-[var(--radius-shell)]` | `rounded-xl` |
| **Shadow** | `shadow-[var(--shadow-md)]` | Removido |
| **Message area bg** | `radial-gradient(circle_at_top,var(--brand-soft),transparent_38%)` | `bg-[var(--surface)]` |
| **Message area dot** | `radial-gradient(circle ... 1px, transparent 1px)` + `linear-gradient` | Removido |
| **Radius errors** | `rounded-[var(--radius-control)]` (x3) + `rounded-[calc(...)]` (x2) | `rounded-xl` |

**Linhas de código:** ~18 removidas = ~18 a menos

**Mecanismo de Persuasão:**
> **Figura-Fundo (Gestalt)** — A área de mensagens do chat é onde JP LÊ. Cada gradiente, dot pattern e overlay é um competidor visual com o texto. A relação figura-fundo ideal é **o texto ser a figura e o fundo desaparecer**. Três camadas de background = três competidores.
>
> **Processamento Fluente (Oppenheimer)** — Informação fácil de processar é percebida como mais verdadeira e confiável. JP confia mais na mensagem que lê num fundo limpo do que na mesma mensagem sobreposta a um padrão de dots. O conteúdo parece mais "verdadeiro".

#### 5.2 `src/modules/whatsapp/components/chat/whatsapp-message-list.tsx` (~51 → ~40 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Empty state** | `rounded-[var(--radius-card)]` | `rounded-xl` |
| **Loading** | 3 dots com `animate-bounce` + delays | Skeleton simples ou spinner único |
| **Date separator** | `tracking-[0.18em]` | `tracking-[0.16em]` (igual resto) |

**Linhas de código:** ~11 removidas = ~11 a menos

#### 5.3 `src/modules/whatsapp/components/chat/whatsapp-message-input.tsx` (~98 → ~95 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Input wrapper** | `rounded-[calc(var(--radius-control)+4px)]` | `rounded-xl` |
| **Send button glow** | `shadow-[var(--shadow-glow)]` | Removido |

**Linhas de código:** ~3 removidas = ~3 a menos

**Mecanismo de Persuasão:**
> **Afinidade (Cialdini)** — Um botão de enviar com glow parece ansioso. "CLIQUE AQUI! CLIQUE AQUI!" como um vendedor de loja que aborda você no momento que entra. O botão sem glow comunica confiança: "quando você quiser enviar, estou aqui."

#### 5.4 `src/modules/whatsapp/components/chat/whatsapp-message-bubble.tsx` (~394 → ~388 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **BorderRadius** | Inline `style={{ borderRadius: '18px 18px 4px 18px' }}` | `rounded-[18px]` + `rounded-br-[4px]` |

**Nota:** Não mexer no AudioMessage (170 linhas, é funcional — playback speed, volume, seek são recursos reais).

**Linhas de código:** ~6 removidas = ~6 a menos

#### 5.5 `src/modules/whatsapp/components/chat/whatsapp-connection-badge.tsx` (~17 → ~12 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **Shape** | `rounded-full` | `rounded-md` |
| **Glow dot** | `shadow-[0_0_0_4px_color-mix(...)]` | Apenas `h-2 w-2 rounded-full` |
| **Tracking** | `tracking-[0.14em] uppercase` | `text-xs font-medium` |

**Linhas de código:** ~5 removidas = ~5 a menos

**Mecanismo de Persuasão:**
> **Lei de Prägnanz (Gestalt)** — O ponto de status verde/vermelho já comunica "online/offline". O halo de 4px ao redor dele é o equivalente visual de "esse ponto é MUITO importante". Se o ponto é vermelho (offline), o halo está celebrando algo quebrado. É disfuncional.

---

### Grupo 6: Chat Unificado bônus (1 arquivo — compartilhado)

#### 6.1 `src/modules/chat/components/chat-message-list.tsx` (~505 → ~490 linhas)

| O quê | Estado Atual | Depois |
|-------|-------------|--------|
| **UnreadSeparator brand (l.286, 290)** | `rgba(139,92,246,0.18)` e `rgba(139,92,246,0.24)` | `color-mix(in_srgb, var(--brand)_18%,transparent)` |
| **Bubble fromMe gradient (l.246)** | `linear-gradient(180deg,rgba(139,92,246,0.26),rgba(139,92,246,0.16))` | `bg-[color-mix(in_srgb,var(--brand)_18%,var(--surface-elevated))]` |
| **Empty state gradient (l.426)** | `linear-gradient(180deg,rgba(139,92,246,0.08),rgba(255,255,255,0.02))` | `bg-[color-mix(in_srgb,var(--brand)_8%,var(--surface))]` |
| **Chat bg dot pattern (l.373)** | `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.02) 1px, transparent 0)` | Removido |
| **Skeleton radius (l.397)** | `rounded-[18px]` | `rounded-xl` |

**Linhas de código:** ~15 removidas = ~15 a menos

**Mecanismo de Persuasão:**
> **Sistema 1 (Kahneman)** — O purple hardcoded `rgba(139,92,246,*)` em 5 lugares diferentes, combinado com o brand roxo do design system em outros, cria 6 tons de roxo diferentes. O cérebro do JP percebe "algo está errado" sem conseguir identificar o quê. É um **viés de disponibilidade reverso**: a informação está disponível (a cor), mas não é consistente, então o cérebro gasta energia monitorando. Convertendo tudo para `color-mix(in_srgb, var(--brand), X%)`, todos os roxos são o mesmo roxo em opacidades diferentes. O cérebro relaxa.

---

## Sumário de Código

### Linhas por Grupo

| Grupo | Removidas | Adicionadas | **Net** |
|-------|-----------|-------------|---------|
| 1. Loading | 25 | 15 | **-10** |
| 2. Instâncias | 44 | 5 | **-39** |
| 3. Wizard/Conexão | 48 | 0 | **-48** |
| 4. Jobs/Automações | 27 | 5 | **-22** |
| 5. Chat WhatsApp | 43 | 0 | **-43** |
| 6. Chat Unificado | 15 | 0 | **-15** |
| **Total** | **202** | **25** | **-177** |

### O Que os Números Não Contam

| Métrica | Impacto |
|---------|---------|
| `rgba(...)` substituídos por `color-mix` | 7 → 0 |
| `var(--radius-*)` substituídos por `rounded-xl` | ~22 → 0 |
| `tracking-[...]` diferentes eliminados | 3 variações → 1 (padrão design system) |
| Decorações que não servem à tarefa removidas | ~12 (orbs, gradients, dots, glows, sparkles, bounces, halos) |
| Cards aninhados removidos | 2 → 0 |
| Spinners substituídos por skeletons | 3 → 0 |
| Inconsistências com leads/recebimentos/kanban eliminadas | ~15 → 0 |

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| `color-mix` não funciona em contextos SVG | Baixa | Só usar em backgrounds/borders CSS, confirmar suporte |
| `rounded-xl` visualmente diferente de `var(--radius-card)` = 12px | Média | Verificar valor real no CSS. Se for 12px, seguro. Se não, o risco é mínimo (diferença imperceptível) |
| ChatMessageList compartilhado com módulo chat | Média | Confirmar que o módulo chat quer o mesmo tratamento (gradiente→sólido). Se não, extrair cores pra variável |
| Mudança pode quebrar tema claro/escuro | Baixa | `color-mix` funciona em ambos. Testar |
| JP pode estranhar mudança visual | Alta (curto prazo) | **Curva de aceitação de 2 dias.** O desconforto inicial é superado pela fluência cognitiva pós-adaptação. Referência: Mere Exposure Effect mostra que exposição repetida a novo estímulo aumenta preferência após ~10 exposições |
| Instâncias list pode ficar "pobre" demais sem o nested card | Média | A informação (latência, uptime) continua lá, só em formato texto. O card fica mais escaneável |

---

## Critérios de Aceitação

- [ ] Zero `rgba(...)` hardcoded no módulo whatsapp (exceto libs/SVGs)
- [ ] Zero `var(--radius-shell)`, `var(--radius-card)`, `var(--radius-control)`
- [ ] Zero `tracking-[0.14em]`, `tracking-[0.16em]`, `tracking-[0.18em]` sem sentido
- [ ] Zero decorações gradiente sem propósito funcional
- [ ] Badges usam `rounded-md px-1.5 py-0.5 text-[10px] font-medium`
- [ ] Loading states usam skeleton (não spinner)
- [ ] loading.tsx mostra layout de instâncias (não de chat)
- [ ] Chat panel sem dot pattern, sem gradient duplo, sem glow
- [ ] FilterPill sem hover translate/shadow
- [ ] Connection badge sem halo glow
- [ ] Wizard sem gradient orb, sem sparkles, sem kicker
- [ ] Send button sem shadow-glow
- [ ] QR timer sem barra de progresso
- [ ] Zero TS errors
- [ ] Build passa
- [ ] Contraste WCAG AA mantido (body text ≥4.5:1)

---

## ADR — Arquitetura de Decisão

| Decisão | Drivers | Alternativas | Por que esta | Consequências |
|---------|---------|-------------|--------------|---------------|
| Badges rounded-md em vez de rounded-full | Consistência com 3 módulos, fluência cognitiva | Manter rounded-full (fácil, não quebra) | Cialdini: consistência gera confiança. Oppenheimer: processamento fluente = mais crível | JP não precisa reaprender badge por módulo |
| Skeleton em vez de spinner | Antecipação, redução de ansiedade | Manter spinner (menos linhas de código) | Doherty: <400ms de feedback. Kahneman: incerteza = cortisol. Skeleton = previsibilidade | +20 linhas de código investidas em UX |
| color-mix em vez de rgba | Consistência cromática, theming automático | Manter rgba (funciona) | Kahneman: sistema 1 não precisa investigar 6 tons de roxo diferentes | Requer suporte browser (95%+ cobertura) |
| Wizard collapsível | Respeito ao contexto do usuário operacional | Manter sempre visível (simples) | Voss: escutar onde o usuário está. Cialdini: afinidade = entender o contexto | Precisa de estado pra controlar visibilidade |
| QR collapsível nos cards | Redução de carga cognitiva por card | Manter QR sempre visível (JP vê o QR mesmo sem precisar) | Hick's Law: menos elementos por card = decisão mais rápida | Um clique extra pra ver o QR (tradeoff aceitável) |

---

## A Verdadeira Pergunta

177 linhas a menos. 7 rgbs substituídos. 22 radius vars padronizados. 12 decorações exterminadas.

Mas o que realmente muda pro JP?

**Não é o código que muda. É a confiança.**

Cada vez que ele abre o WhatsApp e os badges são iguais aos de leads, o cérebro dele diz "esse sistema é consistente, posso confiar" — **fluência cognitiva**.

Cada vez que ele carrega a página e vê um skeleton em vez de um spinner, ele respira mais fundo — **antecipação**.

Cada vez que ele usa o chat e o fundo não compete com as mensagens, ele lê mais rápido — **figura-fundo limpa**.

Cada vez que ele clica num card e não precisa processar 11 elementos, ele decide mais rápido — **Hick's Law**.

Persuasão não é sobre convencer alguém a fazer o que não quer. É sobre **remover as barreiras** entre a pessoa e o que ela já quer fazer.

O JP já quer gerenciar WhatsApp. A interface só precisa sair do caminho.
