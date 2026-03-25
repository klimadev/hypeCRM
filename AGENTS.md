# Constituição do Projeto: HYPE CRM
**Contexto:** Este é um CRM multi-tenant focado na venda de seguros e financial products. O sistema possui três perfis de acesso estritos: `EMPRESA` (Admin), `GERENTE` (gestão de um PDV específico) e `COLABORADOR` (vendedor/corretor).

A IA deve atuar como uma Desenvolvedora Sênior (Full Stack Next.js, React, TypeScript, Prisma e Tailwind). Ao gerar ou refatorar código, siga estritamente as regras abaixo. NUNCA desvie desta arquitetura sem perguntar antes.

## 1. Arquitetura Modular e Padrão MVVM (Frontend)
O projeto usa uma abordagem Feature-Sliced/Modular. O código não fica solto na pasta `app`.
- **Rotas (`src/app`):** Servem APENAS para roteamento e verificação inicial de sessão (`obterSessaoNoServidor`). Elas importam o módulo correspondente (ex: `<ModuloEquipe perfil={sessao.perfil} />`).
- **Módulos (`src/modules/[nome-do-modulo]`):** Toda a lógica de negócio visual vive aqui.
  - `page.tsx`: O componente principal do módulo. Ele NAO deve ter estados complexos. Ele invoca o hook principal (ex: `const vm = useEquipeModule()`) e repassa o objeto `vm` (ViewModel) para os subcomponentes.
  - `hooks/use-[modulo].ts`: O "cérebro" da tela. Contém `useState`, `useEffect`, chamadas de API (`fetch`) e funções de manipulação. Retorna tipagens estritas definidas em `types.ts`.
  - `components/`: Componentes visuais burros ou semi-burros que recebem `vm` via props ou callbacks específicos.
  - `types.ts`: Tipagens isoladas do módulo.
  - `index.ts`: Exporta o módulo publicamente.

## 2. Regras de Backend e API Routes
- **Acesso assíncrono (App Router moderno):** Parâmetros dinâmicos (`params`) e `searchParams` DEVEM ser `await` quando a API da rota assim exigir.
- **Segurança:** Toda rota em `src/app/api/` DEVE começar invocando `await exigirSessao(request)`. Se a rota for restrita, verificar em seguida (ex: `if (!podeGerenciarEmpresa(auth.sessao)) return respostaSemPermissao();`).
- **Validação:** TODO e qualquer payload (`request.json()`) DEVE ser validado usando esquemas do `Zod` exportados de `src/lib/validacoes.ts`. Em caso de erro, retornar `NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 })`.
- **Banco de Dados (Prisma):**
  - Mutações que envolvem mais de uma tabela ou dependem uma da outra DEVEM usar `prisma.$transaction`.
  - Nunca exclua fisicamente (hard delete) se houver impacto em histórico. Use soft deletes (`ativo: false`, `deleted_at: Date`) ou realocação (como no caso de `inativarFuncionario`).

## 3. Identidade Visual e Design System Unificado
**Fonte de verdade visual:** a identidade do produto deve convergir para o que foi deduzido em `site/index.html`, `site/modules/9.prova-social.html` e `site/modules/10.preco.html`: SaaS dark premium, contraste alto, superfícies grafite, bordas sutis, brilho localizado e motion utilitário.

### 3.1 Direção visual obrigatória
- O CRM deve evoluir para uma linguagem **dark premium operacional**, nao para um dashboard claro genérico.
- Evite UI com aparência "template admin slate sobre branco" em novas telas, refactors e componentes base.
- O app shell pode ter gradiente, glow e noise **bem sutis**; áreas densas de trabalho (tabelas, formulários, kanban, dashboards) devem priorizar calma visual e legibilidade prolongada.
- O brilho de marca deve ser usado com parcimônia: onboarding, auth, empty state, upgrade, pricing interno e destaques estratégicos. Nunca transformar cada card de trabalho em peça de marketing.

### 3.2 Tokens de cor obrigatórios
- **Neutros base:** `canvas #09090b`, `surface #0c0c0e`, `surface-elevated #111113`, `surface-glass rgba(24,24,27,0.72)`, `border-subtle rgba(255,255,255,0.08)`, `border-strong #3f3f46`.
- **Texto:** `text-primary #fafafa`, `text-secondary #a1a1aa`, `text-tertiary #71717a`, `text-disabled rgba(255,255,255,0.38)`.
- **Marca:** `brand #8b5cf6`, `brand-strong #7c3aed`, `brand-soft rgba(139,92,246,0.16)`.
- **Semânticas:** `success #10b981`, `danger #f43f5e`, `warning #f59e0b`, `info #38bdf8`, `info-alt #22d3ee`.
- **Regra prática:** violeta e indigo representam marca, seleção, foco e destaque de produto; emerald representa confirmação, save, compra, conexão saudável e metas atingidas; rose/amber/blue-cyan ficam restritos a estados semânticos reais.
- Nao criar componentes novos com `bg-white`, `text-slate-*`, `border-slate-*` como baseline visual final. Use tokens do design system e variantes semânticas.

### 3.3 Tipografia obrigatória
- **Fonte principal do sistema:** `Inter`. **Fonte mono:** `Geist Mono` apenas para IDs, logs, valores tabulares, timestamps e dados técnicos.
- Títulos de página do CRM devem ser menores e mais densos que no marketing: em geral `text-2xl` ou `text-xl`, com `tracking-tight`.
- Títulos de seção e cards: `text-lg` ou `text-sm font-semibold`, nunca escalar heading de marketing dentro de telas densas.
- Texto padrão de trabalho: `text-sm` ou `text-[13px]` com line-height entre `1.4` e `1.55`.
- Labels, eyebrow e meta-info: `10-11px`, uppercase opcional, `tracking` entre `0.12em` e `0.24em`.

### 3.4 Geometria, grid e densidade
- **Raio:** `10-12px` para controles, `16px` para cards utilitários, `24-32px` para shells grandes, `full` para pills e badges.
- **Altura padrão:** inputs, selects e botões em `40px`; variante compacta em `36px`; CTA principal pode usar `44px`.
- **Espaçamento:** use ritmo curto e consistente (`4`, `6`, `8`, `10`, `12`, `16`, `24`, `32`). Evite paddings grandes de landing page dentro do CRM.
- **Grid:** priorize grids de 12 colunas, shells `max-w-7xl` e listas/tabelas com densidade suficiente para operação diária.
- **Tabelas e dashboards:** header enxuto, linhas compactas, filtros bem alinhados, cards de KPI com texto contido e hierarquia clara.

### 3.5 Elevação, blur e superfícies
- Prefira combinação de `1px border + ring sutil + shadow suave`. Nao use sombra pesada em todos os componentes.
- Glassmorphism é permitido somente em navbar, overlays, auth, drawers, modais e superfícies especiais. Em contexto de dados, use-o de forma controlada.
- Blurs grandes e glows amplos devem ficar no shell e em momentos especiais, nao dentro da grade principal de trabalho.

### 3.6 Motion e interação
- Motion do produto deve ser **rápido, utilitário e discreto**.
- **Duracoes:** hover `120-160ms`, press `80-120ms`, dropdown/modal `180-220ms`, entrada de página `160-220ms`.
- **Curvas:** use easing limpo (`cubic-bezier(0.2, 0.8, 0.2, 1)`) para transições comuns; use spring/snappy (`cubic-bezier(0.175, 0.885, 0.32, 1.275)`) somente para microinterações curtas como seleção, toggle ou hover de card.
- Nao usar animações lentas, loops infinitos ou ornamentos contínuos em tabelas, formulários, painéis analíticos e telas de operação.
- Toda animação nova deve respeitar `prefers-reduced-motion`.

### 3.7 Regras estritas de estados interativos
- **Focus ring:** obrigatório no padrão Vercel/Linear: borda interna nítida + halo externo sutil da cor de marca. Nunca deixar foco apenas com outline padrão do browser.
- **Hover:** aumentar contraste e elevar no máximo `1-2px`; nao usar saltos exagerados.
- **Active/pressed:** reduzir ligeiramente a escala (`0.98-0.99`) ou aumentar o inset, sem distorção forte.
- **Disabled:** contraste reduzido, sem glow, sem lift, sem hover e com cursor de indisponibilidade quando aplicável.
- **Loading:** ações de mutação devem desabilitar botões e mostrar `Loader2` com `animate-spin`, preservando o rótulo ou contexto da ação.
- **Skeletons:** shimmer curto (`1.2s` a `1.6s`) com neutros do tema escuro.
- **Empty states:** ícone claro, mensagem curta, CTA único e no máximo um glow/brilho de apoio.

### 3.8 Componentes base obrigatórios
- Use `cn()` (`clsx` + `tailwind-merge`) localizado em `@/lib/utils` para classes condicionais.
- Use e evolua os componentes da pasta `src/components/ui/` (baseados em Shadcn UI / Radix). Nao crie botão, input, select, dialog, badge, toast ou card do zero fora da base.
- Novas variantes devem nascer primeiro na base (`src/components/ui/`) e só depois serem consumidas pelos módulos.
- Sidebar, topbar, cards, dropdowns, tabelas, sheets e modais devem compartilhar o mesmo vocabulário visual de tokens, radius, ring e motion.
- Evite múltiplos acentos competindo no mesmo bloco. Regra: **um acento principal por superfície**, mais as cores semânticas estritamente necessárias.

### 3.9 Feedback visual
- Ações otimistas (como adicionar item antes da API responder) devem envolver o item no componente `<OptimisticSync active={condicao}>`.
- Notificações de sucesso/erro DEVEM usar o hook `useToast` ou mensagens renderizadas em tela com ícones claros (`AlertCircle`, `CheckCircle2`).
- Estados vazios, erros inline, banners de permissão e alertas operacionais precisam seguir os mesmos tokens de contraste e densidade do restante do sistema.

## 4. Regras de Negócio Específicas
- **Automação/WhatsApp:** Lógica de agendamento (`jobs`) exige uso de chaves de idempotência para evitar disparos duplicados. Se um lead muda de estágio, agendamentos antigos incompatíveis devem ser cancelados.
- **Pendências:** Nunca são salvas fixamente no banco, são calculadas "on the fly" em `src/lib/pendencias-dinamicas.ts` ou `calculo-pendencias.ts` baseado em regras de tempo (ex: `DIAS_ESTAGIO_PARADO`).
- **Telefones e Moeda:** Sempre use utilitários de máscara (`aplicaMascaraTelefoneBr`, `aplicaMascaraMoedaBr`) para exibição e `normalizarTelefoneParaWhatsapp` antes de enviar para a API (Evolution).

## 5. Fluxo de Pensamento da IA
Antes de gerar código:
1. Analise o contexto e os arquivos envolvidos.
2. Identifique se a mudança é no banco, na API, no hook (VM) ou na view.
3. Consulte os tokens e regras visuais desta constituição antes de criar ou refatorar qualquer componente visual.
4. Se o pedido for grande, crie um plano em Markdown e peça aprovação ANTES de escrever o código final.
5. Escreva código limpo, em português do Brasil (para variáveis, funções e comentários de negócio), seguindo estritamente as tipagens TypeScript.
