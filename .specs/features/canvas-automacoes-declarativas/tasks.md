# Canvas de Automações Declarativas Tasks

**Design**: `.specs/features/canvas-automacoes-declarativas/design.md`
**Status**: Draft refinado para execução paralela

> Nota 1: o repositório ainda não possui `.specs/codebase/TESTING.md`. Os tipos de teste e gates abaixo foram inferidos de `package.json`, `AGENTS.md` e padrões já existentes com Vitest. Antes da execução, confirmar a matriz final de testes.
>
> Nota 2: os marcadores `[P]` abaixo representam paralelismo arquitetural e de dependência. Eles continuam condicionados à confirmação da matriz de testes e a evitar colisão desnecessária no mesmo arquivo durante a implementação.
>
> Nota 3: diferente dos arquivos de código, este artefato de planejamento pode crescer acima de 400 linhas se isso melhorar clareza, batches e rastreabilidade.

---

## Execution Plan

### Batch 1 — Base paralela

`{ T1 [P], T2 [P] }`

- T1 prepara persistência incremental.
- T2 define o contrato do grafo e não depende do schema novo.

### Batch 2 — Contratos centrais em paralelo

`T1 -> T4 [P]`

`T2 -> T3 [P]`

- T3 cria o registry único sobre o contrato do grafo.
- T4 encapsula repositórios de draft/versão/execução sobre o novo schema.

### Batch 3 — Expandir catálogo e validação em paralelo

`T3 -> { T5 [P], T6 [P] }`

`{ T2, T3 } -> T7 [P]`

- T5 registra trigger + condition.
- T6 registra actions do domínio.
- T7 valida a estrutura do DAG de forma genérica.

### Batch 4 — Serviços e runtime que já podem subir juntos

`{ T4, T5, T6, T7 } -> T8 [P]`

`{ T4, T5, T6 } -> T9 [P]`

`T6 -> T10 [P]`

`{ T5, T6 } -> T11 [P]`

- T8 fecha publish + service transacional.
- T9 prepara matcher e carregamento da versão publicada.
- T10 implementa handlers declarativos.
- T11 constrói primitives visuais do editor sem depender do backend final.

### Batch 5 — Costura de API e estado

`{ T8, T9 } -> T12 [P]`

`T8 -> T13 [P]`

- T12 expõe rotas editor/publicar/execuções.
- T13 cria o hook do editor/autosave em cima do contrato já estabilizado.

### Batch 6 — Tela integrada do editor

`{ T11, T12, T13 } -> T14`

- T14 integra páginas full-page, canvas, inspector e autosave real.

### Batch 7 — Integração final e rollout

`{ T10, T12, T14 } -> T15`

- T15 conecta listagem atual, logs/execuções e fallback beta do legado.

---

## Parallel Execution Map

```text
Batch 1:   T1    T2
             \  /
Batch 2:      T4    T3
                \  /|\
Batch 3:         T7 T5 T6
                  \ | / \
Batch 4:           T8 T9 T10 T11
                    \ /     \
Batch 5:             T12     T13
                       \     /
Batch 6:                 T14
                          |
Batch 7:                 T15
```

## Parallelism Rules For This Plan

- `[P]` só vale quando as tarefas não compartilham dependência direta e podem ser entregues com contrato claro.
- Se duas tarefas paralelas começarem a disputar o mesmo arquivo, dividir mais ou serializar.
- Tarefas de UI visual podem subir antes da integração real, desde que dependam apenas de contratos estáveis do design/registry.
- Tarefas de runtime e publish podem evoluir em paralelo porque se encontram apenas nos contratos do registry, validator e repositórios.
- A confirmação de `.specs/codebase/TESTING.md` pode remover ou manter alguns `[P]` se houver testes não paralelizáveis.

---

## Task Breakdown

### T1: Modelar persistência incremental do canvas [P]

**What**: adicionar campos/tabelas para draft, versão publicada e execuções sem remover o legado.
**Where**: `prisma/schema.prisma`, migration nova, tipos Prisma impactados.
**Depends on**: None
**Reuses**: tabela `Automacao`, padrão atual de `AutomacaoAgendamento`.
**Requirement**: AUTO-CANVAS-04, AUTO-CANVAS-05, AUTO-CANVAS-08, AUTO-CANVAS-09
**Tools**: Skill `typescript-expert`
**Done when**: schema suporta `editor_modelo`, `rascunho_grafo_json`, `versao_publicada_id`, `AutomacaoVersao` e `AutomacaoExecucao`; migration aplica sem quebrar leitura legada.
**Tests**: inferred integration
**Gate**: quick (`pnpm typecheck` + migration review)

### T2: Definir tipos do grafo e serialização segura [P]

**What**: definir contratos TypeScript do grafo V1 e helpers de parse/stringify seguros.
**Where**: `src/lib/automacoes/graph/automation-graph-types.ts`, `automation-graph-serializer.ts`
**Depends on**: None
**Reuses**: `src/lib/automacoes/config.ts`
**Requirement**: AUTO-CANVAS-02, AUTO-CANVAS-04
**Tools**: Skill `typescript-expert`
**Done when**: contratos do grafo ficam centralizados, sem `any`, com parse defensivo e fallback explícito.
**Tests**: inferred unit
**Gate**: quick (`pnpm vitest run` alvo + `pnpm typecheck`)

### T3: Criar contrato do registry único [P]

**What**: definir `AutomationNodeKind`, `AutomationNodeDefinition` e APIs para lookup/listagem.
**Where**: `src/lib/automacoes/registry/automation-node-kinds.ts`, `automation-registry.ts`
**Depends on**: T2
**Reuses**: `src/modules/automacoes/types.ts`, validações do domínio já existentes.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-03, AUTO-CANVAS-06, AUTO-CANVAS-07
**Tools**: Skill `typescript-expert`
**Done when**: UI, validator e runtime passam a depender do mesmo registry, não de ifs espalhados.
**Tests**: inferred unit
**Gate**: quick

### T4: Criar repositórios de draft, versão e execução [P]

**What**: encapsular acesso a `Automacao`, `AutomacaoVersao` e `AutomacaoExecucao` sem misturar query Prisma nas rotas.
**Where**: `src/lib/automacoes/persistence/automacao-repository.ts`, `automacao-versao-repository.ts`, `automacao-execucao-repository.ts`
**Depends on**: T1
**Reuses**: padrão Prisma atual do módulo e rotas auth-first existentes.
**Requirement**: AUTO-CANVAS-04, AUTO-CANVAS-05, AUTO-CANVAS-08, AUTO-CANVAS-09
**Tools**: Skill `typescript-expert`
**Done when**: operações de carregar draft, salvar draft, criar versão publicada e registrar execução ficam encapsuladas e reutilizáveis.
**Tests**: inferred integration
**Gate**: quick

### T5: Registrar trigger + condition definitions [P]

**What**: implementar definições de `trigger.lead.stage-changed` e `condition.field.equals` com schema, limites de conexão e resumo visual.
**Where**: `src/lib/automacoes/registry/definitions/trigger-lead-stage-changed.ts`, `condition-field-equals.ts`
**Depends on**: T3
**Reuses**: `zod`, regras do domínio de lead/estágio já existentes.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-03, AUTO-CANVAS-06, AUTO-CANVAS-07
**Tools**: Skill `typescript-expert`
**Done when**: trigger e condition aparecem no registry com contratos completos e independentes de UI hardcoded.
**Tests**: inferred unit
**Gate**: quick

### T6: Registrar action definitions do domínio [P]

**What**: implementar definições de `action.whatsapp.send`, `action.task.create` e `action.lead.update-field` com schema e resumo visual.
**Where**: `src/lib/automacoes/registry/definitions/action-send-whatsapp.ts`, `action-create-task.ts`, `action-update-lead-field.ts`
**Depends on**: T3
**Reuses**: `zod`, `src/lib/automacoes/validacao.ts`, domínio atual de WhatsApp e leads.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-03, AUTO-CANVAS-07
**Tools**: Skill `typescript-expert`, `context7`/ExternalScout quando houver dúvida de lib nova
**Done when**: actions do domínio ficam descritas no registry e prontas para UI, validação e runtime compartilharem o mesmo contrato.
**Tests**: inferred unit
**Gate**: quick

### T7: Implementar validator estrutural do grafo [P]

**What**: validar DAG, trigger único, ciclos, nós órfãos, cardinalidade de entrada/saída e compatibilidade estrutural das arestas.
**Where**: `src/lib/automacoes/graph/automation-graph-validator.ts`, helpers de travessia e testes dedicados
**Depends on**: T2, T3
**Reuses**: contratos do registry e helpers do grafo.
**Requirement**: AUTO-CANVAS-03, AUTO-CANVAS-04
**Tools**: Skill `typescript-expert`
**Done when**: o validator identifica falhas estruturais sem depender ainda das checagens de publish relacional.
**Tests**: inferred unit
**Gate**: quick

### T8: Implementar validator de publish + service transacional [P]

**What**: combinar validação estrutural, validação por `kind`, validação relacional do domínio e publicação versionada em uma operação transacional.
**Where**: `src/lib/automacoes/server/automation-service.ts`, `publish-validation.ts` ou equivalente
**Depends on**: T4, T5, T6, T7
**Reuses**: `src/lib/automacoes/validacao.ts`, Prisma compartilhado, padrões de service/route existentes.
**Requirement**: AUTO-CANVAS-02, AUTO-CANVAS-04, AUTO-CANVAS-05
**Tools**: Skill `typescript-expert`
**Done when**: draft e publish ficam transacionais, publish cria versão imutável e erros retornam em formato consumível pela UI.
**Tests**: inferred integration
**Gate**: quick

### T9: Generalizar matcher e loader de versão publicada [P]

**What**: localizar automações canvas compatíveis por evento, carregar a versão publicada correta e preparar contexto inicial da execução.
**Where**: `src/lib/automacoes/runtime/automation-trigger-matcher.ts`, `automation-runner.ts` (parte de carga/boot)
**Depends on**: T4, T5, T6
**Reuses**: `src/lib/whatsapp-automations.ts`, `src/lib/automacoes/dispatcher.ts`
**Requirement**: AUTO-CANVAS-06, AUTO-CANVAS-07, AUTO-CANVAS-09
**Tools**: Skill `typescript-expert`
**Done when**: o evento `lead.stage.changed` encontra automações canvas compatíveis e carrega a versão publicada sem ainda depender dos handlers finais.
**Tests**: inferred integration
**Gate**: quick

### T10: Implementar handlers iniciais do domínio [P]

**What**: implementar handlers declarativos para WhatsApp, criação de tarefa, atualização de lead e condição.
**Where**: `src/lib/automacoes/runtime/handlers/*`
**Depends on**: T6
**Reuses**: `dispatch-whatsapp.ts`, serviços atuais de lead/tarefa quando existirem.
**Requirement**: AUTO-CANVAS-06, AUTO-CANVAS-07
**Tools**: Skill `typescript-expert`
**Done when**: handlers executam por `kind`, sem hardcode no editor, e registram resultado resumido por nó.
**Tests**: inferred integration
**Gate**: quick

### T11: Construir primitives visuais do editor [P]

**What**: entregar toolbar, empty state, add-node menu, node renderers e shell do inspector com props estáveis.
**Where**: `src/modules/automacoes/components/editor/*`, `node-renderers/*`
**Depends on**: T5, T6
**Reuses**: `ModulePageShell`, `ModulePageHeader`, shadcn/ui, tokens do projeto.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-02, AUTO-CANVAS-03, AUTO-CANVAS-10
**Tools**: Skills `react-patterns`, `nextjs-best-practices`
**Done when**: a camada visual do editor existe de forma isolável, sem depender ainda do autosave real ou das rotas finais.
**Tests**: inferred none
**Gate**: quick (`pnpm lint && pnpm typecheck` + smoke manual)

### T12: Expor rotas do editor/publicação/execuções [P]

**What**: criar endpoints para carregar draft, salvar draft, publicar fluxo e consultar execuções resumidas.
**Where**: `src/app/api/automacoes/[id]/editor/route.ts`, `[id]/publicar/route.ts`, `[id]/execucoes/route.ts`
**Depends on**: T8, T9
**Reuses**: `withPerfis`, `parseJson`, `validateBody`, `ok`, `badRequest` e padrões auth-first do projeto.
**Requirement**: AUTO-CANVAS-02, AUTO-CANVAS-04, AUTO-CANVAS-08
**Tools**: Skills `nextjs-best-practices`, `typescript-expert`
**Done when**: as rotas expõem contrato estável para editor e logs, com tenant scope e validação no padrão do repo.
**Tests**: inferred integration
**Gate**: quick

### T13: Criar hook do editor com autosave e selection state [P]

**What**: orquestrar `nodes`, `edges`, seleção, dirty state, status de save e integração com API do editor.
**Where**: `src/modules/automacoes/hooks/use-automacao-editor.ts`
**Depends on**: T8
**Reuses**: padrão de autosave debounce citado em `technical-domain.md` e hooks do módulo atual.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-02, AUTO-CANVAS-05
**Tools**: Skill `react-patterns`
**Done when**: o hook controla o editor com debounce, rollback visual mínimo e sem store global prematura.
**Tests**: inferred unit
**Gate**: quick

### T14: Integrar tela full-page do editor

**What**: conectar as primitives visuais ao hook/rotas reais e entregar as páginas `/automacoes/nova` e `/automacoes/[id]`.
**Where**: `src/modules/automacoes/components/editor/automacao-editor.tsx`, `src/app/(dashboard)/automacoes/nova/page.tsx`, `src/app/(dashboard)/automacoes/[id]/page.tsx`
**Depends on**: T11, T12, T13
**Reuses**: páginas atuais do dashboard e convenções App Router do projeto.
**Requirement**: AUTO-CANVAS-01, AUTO-CANVAS-02, AUTO-CANVAS-03, AUTO-CANVAS-10
**Tools**: Skills `react-patterns`, `nextjs-best-practices`
**Done when**: o editor full-page funciona ponta a ponta com autosave, CTA inicial, canvas e inspector contextual.
**Tests**: inferred integration/smoke
**Gate**: quick (`pnpm lint && pnpm typecheck` + smoke manual)

### T15: Integrar listagem, logs e rollout beta/fallback legado

**What**: conectar a listagem atual ao canvas, expor entrada para execuções/logs e manter fallback legado durante o beta.
**Where**: `src/modules/automacoes/automacoes-module.tsx`, componentes de listagem/logs e pontos finais já criados
**Depends on**: T10, T12, T14
**Reuses**: `use-automacoes.ts`, cards/lista atuais, rotas auth-first já existentes.
**Requirement**: AUTO-CANVAS-04, AUTO-CANVAS-08, AUTO-CANVAS-09, AUTO-CANVAS-10
**Tools**: Skills `nextjs-best-practices`, `react-patterns`, `typescript-expert`
**Done when**: usuário entra pelo módulo atual, navega para o canvas, consulta execuções resumidas e o wizard legado continua disponível como fallback controlado.
**Tests**: inferred integration
**Gate**: full (`pnpm lint && pnpm typecheck && pnpm build`)

---

## Batch-by-Batch Recommended Execution

### Batch 1

- T1 [P]
- T2 [P]

### Batch 2

- T3 [P] (depois de T2)
- T4 [P] (depois de T1)

### Batch 3

- T5 [P] (depois de T3)
- T6 [P] (depois de T3)
- T7 [P] (depois de T2 + T3)

### Batch 4

- T8 [P] (depois de T4 + T5 + T6 + T7)
- T9 [P] (depois de T4 + T5 + T6)
- T10 [P] (depois de T6)
- T11 [P] (depois de T5 + T6)

### Batch 5

- T12 [P] (depois de T8 + T9)
- T13 [P] (depois de T8)

### Batch 6

- T14 (depois de T11 + T12 + T13)

### Batch 7

- T15 (depois de T10 + T12 + T14)

---

## Pre-Approval Validation

### Granularity Check

| Task | Deliverable atômico | Status |
| --- | --- | --- |
| T1 | Persistência incremental | ✅ |
| T2 | Contrato do grafo | ✅ |
| T3 | Registry base | ✅ |
| T4 | Repositórios persistentes | ✅ |
| T5 | Definitions de trigger + condition | ✅ |
| T6 | Definitions de actions | ✅ |
| T7 | Validator estrutural | ✅ |
| T8 | Publish validator + service | ✅ |
| T9 | Matcher + loader | ✅ |
| T10 | Handlers do domínio | ✅ |
| T11 | Primitives visuais do editor | ✅ |
| T12 | Rotas do editor/publicação/logs | ✅ |
| T13 | Hook do editor/autosave | ✅ |
| T14 | Tela integrada do editor | ✅ |
| T15 | Integração final + rollout | ✅ |

### Dependency Cross-Check

| Task | Depends on | Posicionamento no plano | Status |
| --- | --- | --- | --- |
| T1 | None | Batch 1 | ✅ |
| T2 | None | Batch 1 | ✅ |
| T3 | T2 | Batch 2 | ✅ |
| T4 | T1 | Batch 2 | ✅ |
| T5 | T3 | Batch 3 | ✅ |
| T6 | T3 | Batch 3 | ✅ |
| T7 | T2, T3 | Batch 3 | ✅ |
| T8 | T4, T5, T6, T7 | Batch 4 | ✅ |
| T9 | T4, T5, T6 | Batch 4 | ✅ |
| T10 | T6 | Batch 4 | ✅ |
| T11 | T5, T6 | Batch 4 | ✅ |
| T12 | T8, T9 | Batch 5 | ✅ |
| T13 | T8 | Batch 5 | ✅ |
| T14 | T11, T12, T13 | Batch 6 | ✅ |
| T15 | T10, T12, T14 | Batch 7 | ✅ |

### Parallelism Assessment

| Task | `[P]` | Motivo | Risco principal |
| --- | --- | --- | --- |
| T1 | ✅ | independe do contrato do grafo | conflitos de migration/schema |
| T2 | ✅ | independe do schema novo | mudanças posteriores no contrato |
| T3 | ✅ | só depende de T2 | disputa se T2 ainda estiver instável |
| T4 | ✅ | só depende de T1 | colisão com mudanças de Prisma/repositório |
| T5 | ✅ | isolada por arquivos próprios de definition | ajustes no contrato comum do registry |
| T6 | ✅ | isolada por arquivos próprios de definition | ajustes no contrato comum do registry |
| T7 | ✅ | trabalha no validator genérico | mudanças no shape das definitions |
| T8 | ✅ | depende só de contratos já fechados | pode conflitar com T9 se `automation-service.ts` crescer demais |
| T9 | ✅ | foca matcher/loader de runtime | pode conflitar com T8 no runner principal |
| T10 | ✅ | handlers ficam em arquivos próprios | serviços legados não padronizados |
| T11 | ✅ | UI visual pode usar mocks/props estáveis | retrabalho se summaries do registry mudarem |
| T12 | ✅ | rotas dependem de contratos de service/runtime, não da UI | colisão se T8/T9 mudarem payloads |
| T13 | ✅ | hook usa contrato estável do editor | retrabalho se contrato HTTP mudar |
| T14 | ❌ | ponto de convergência final do editor | alta integração |
| T15 | ❌ | rollout final cruza UI, runtime e legado | alta integração |

### Test Co-Location Validation

| Task | Teste inferido | Gate | Fonte | Status |
| --- | --- | --- | --- | --- |
| T1 | integration | quick | Prisma + schema impact | ✅ |
| T2 | unit | quick | helpers/types | ✅ |
| T3 | unit | quick | registry contract | ✅ |
| T4 | integration | quick | repositories + Prisma | ✅ |
| T5 | unit | quick | definitions de trigger/condition | ✅ |
| T6 | unit | quick | definitions de actions | ✅ |
| T7 | unit | quick | validator puro | ✅ |
| T8 | integration | quick | service + publish transaction | ✅ |
| T9 | integration | quick | runtime/event flow | ✅ |
| T10 | integration | quick | handlers com adapters | ✅ |
| T11 | none + smoke | quick | UI visual isolada | ⚠️ confirmar |
| T12 | integration | quick | rotas App Router | ✅ |
| T13 | unit | quick | hook/state | ✅ |
| T14 | integration/smoke | quick | editor ponta a ponta client + API | ⚠️ confirmar |
| T15 | integration | full | integração final + build | ✅ |

---

## Open Inputs Before Execution

1. Confirmar se a V1 deve incluir `action.task.create` já na primeira entrega ou ficar em V1.1.
2. Criar/confirmar `.specs/codebase/TESTING.md`; sem isso, os `[P]` são provisórios do ponto de vista de teste.
3. Confirmar se o rollout beta será por feature flag, permissão ou rota escondida.
4. Confirmar se T11 deve incluir minimap já na V1 ou ficar para iteração posterior.
5. Confirmar quais skills devem ser priorizadas por tarefa durante a execução real.

---

## Recommended First Parallel Slice

Se a execução começar agora, o recorte inicial com melhor custo/benefício é:

1. **Batch 1 paralelo**: T1 + T2
2. **Batch 2 paralelo**: T3 + T4
3. **Batch 3 paralelo**: T5 + T6 + T7

Esse recorte fecha a fundação declarativa do módulo e deixa publish/runtime/editor prontos para subir em paralelo no batch seguinte sem retrabalho estrutural.
