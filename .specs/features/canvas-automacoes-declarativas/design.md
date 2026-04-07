# Canvas de Automações Declarativas Design

**Spec**: `.specs/features/canvas-automacoes-declarativas/spec.md`
**Status**: Approved

---

## Architecture Overview

Evoluir o módulo atual em vez de substituí-lo por uma engine totalmente nova. O editor visual passa a salvar um grafo declarativo compartilhado com validator e runtime, enquanto o backend reaproveita a base existente de eventos, agendamentos e dispatch de WhatsApp sempre que possível.

```mermaid
graph TD
    A[Usuario no editor] --> B[React Flow + inspector]
    B --> C[/api/automacoes/[id]/editor]
    C --> D[Automacao + rascunho_grafo_json]
    B --> E[/api/automacoes/[id]/publicar]
    E --> F[AutomacaoVersao]
    G[Evento lead.stage.changed] --> H[Trigger matcher]
    H --> I[Automation runner]
    I --> J[Handlers por kind]
    J --> K[Agendamentos / dispatch WhatsApp]
    I --> L[AutomacaoExecucao]
```

### Guardrails de implementação

- UI em `src/modules/automacoes/**`, domínio/server em `src/lib/automacoes/**`, endpoints em `src/app/api/automacoes/**`.
- Arquivos de código com alvo de 120-250 linhas; acima de ~300, dividir por responsabilidade. Artefatos de planejamento podem ser maiores quando isso melhorar clareza.
- Canvas client-rendered com `@xyflow/react`; evitar SSR do editor na V1.
- Nós leves e memoizados; edição detalhada fica no inspector lateral, não inline no node.
- Zustand fica adiado até aparecer necessidade real; começar com hook local controlado.

---

## Pesquisa aplicada

- Biblioteca recomendada: `@xyflow/react` com import de `@xyflow/react/dist/style.css`.
- Modelo inicial: `nodes` + `edges` controlados via `useNodesState`/`useEdgesState` e callbacks explícitos.
- `nodeTypes`, `<Handle />` e `useReactFlow()` cobrem custom nodes, handles e viewport sem inventar canvas do zero.
- Performance depende de nós leves, memoização e assinaturas estreitas de estado.
- Next.js App Router funciona melhor aqui com canvas client-side; SSR do React Flow exige dimensões/handles explícitos e não agrega valor à V1.

---

## Code Reuse Analysis

### Reaproveitar diretamente

| Componente existente | Local | Reuso proposto |
| --- | --- | --- |
| Orquestração atual de evento | `src/lib/whatsapp-automations.ts` | Generalizar matcher/runner sem perder o fluxo de disparo já validado |
| Agendamentos e idempotência | `src/lib/automacoes/agendamentos.ts` | Reaproveitar para delay/retry e para adaptação de ações já existentes |
| Processamento de jobs | `src/lib/automacoes/dispatch-whatsapp.ts` | Reusar como adapter do handler `action.whatsapp.send` |
| Dispatcher atual | `src/lib/automacoes/dispatcher.ts` | Manter fila/job loop enquanto delay continuar simples |
| Validação relacional | `src/lib/automacoes/validacao.ts` | Reusar para checagens de recursos do domínio em publish/runtime |
| Módulo de listagem | `src/modules/automacoes/automacoes-module.tsx` | Evoluir a listagem e conectar entrada para editor visual |
| Hook de CRUD atual | `src/modules/automacoes/hooks/use-automacoes.ts` | Reaproveitar fetch/list/toggle/delete e expandir para editor |

### Áreas a isolar do legado

| Área | Estratégia |
| --- | --- |
| Wizard linear | Manter como fallback beta, sem expandir regras novas nele |
| `AutomacaoAcao` linear | Preservar para legado; fluxo canvas passa a usar grafo versionado |
| Config `config_json` limitada ao estágio | Manter para compatibilidade; novo editor usa `grafo_json` |

---

## Components

### 1. Graph Model

- **Purpose**: Definir o contrato declarativo único do fluxo.
- **Location**: `src/lib/automacoes/graph/automation-graph-types.ts`
- **Interfaces**:
  - `type AutomationGraphV1 = { version: 1; nodes: AutomationNode[]; edges: AutomationEdge[]; meta?: AutomationGraphMeta }`
  - `type AutomationNode = { id: string; kind: AutomationNodeKind; position: XYPosition; data: { config: Record<string, unknown> } }`
- **Dependencies**: `zod`, tipos do registry.
- **Reuses**: padrão atual de config serializada em string.

### 2. Registry

- **Purpose**: Centralizar `kind`, schema, resumo visual, limites de conexão e handler runtime.
- **Location**: `src/lib/automacoes/registry/automation-registry.ts`
- **Interfaces**:
  - `getNodeDefinition(kind: AutomationNodeKind): AutomationNodeDefinition`
  - `listNodeDefinitions(): AutomationNodeDefinition[]`
- **Dependencies**: schemas Zod, handlers do runtime.
- **Reuses**: constantes e validações existentes do domínio HYPE.

### 3. Publish Validator

- **Purpose**: Validar estrutura, conexões e config antes de publicar.
- **Location**: `src/lib/automacoes/graph/automation-graph-validator.ts`
- **Interfaces**:
  - `validateDraftGraph(input): AutomationValidationResult`
  - `assertPublishableGraph(input): void`
- **Dependencies**: registry, helpers de travessia, validação relacional.
- **Reuses**: `src/lib/automacoes/validacao.ts` para recursos do domínio.

### 4. Runtime

- **Purpose**: Receber evento interno, localizar automações compatíveis e percorrer o DAG publicado.
- **Location**: `src/lib/automacoes/runtime/automation-runner.ts`
- **Interfaces**:
  - `executarAutomacoesPorEvento(evento): Promise<ExecutionSummary>`
  - `executarGrafoPublicado(params): Promise<AutomationRunResult>`
- **Dependencies**: matcher, registry, handlers, repositórios.
- **Reuses**: `whatsapp-automations.ts`, `agendamentos.ts`, `dispatch-whatsapp.ts`.

### 5. Editor State Hook

- **Purpose**: Orquestrar `nodes`, `edges`, seleção, inspector, dirty state e autosave.
- **Location**: `src/modules/automacoes/hooks/use-automacao-editor.ts`
- **Interfaces**:
  - `useAutomacaoEditor(params): UseAutomacaoEditorReturn`
- **Dependencies**: React Flow state helpers, endpoints do editor.
- **Reuses**: padrão atual de debounced autosave do projeto.

### 6. Editor UI Shell

- **Purpose**: Renderizar toolbar, canvas, empty state, nodes e inspector.
- **Location**: `src/modules/automacoes/components/editor/automacao-editor.tsx`
- **Dependencies**: shadcn/ui existentes, `cn()`, hook do editor.
- **Reuses**: `ModulePageShell`, `ModulePageHeader`, tokens visuais do projeto.

---

## Data Models

### Runtime graph

```ts
type AutomationNodeKind =
  | "trigger.lead.stage-changed"
  | "action.whatsapp.send"
  | "action.task.create"
  | "action.lead.update-field"
  | "condition.field.equals";
```

```ts
type AutomationGraphV1 = {
  version: 1;
  nodes: AutomationNode[];
  edges: AutomationEdge[];
  meta?: { viewport?: { x: number; y: number; zoom: number } };
};
```

### Persistência incremental

```ts
type AutomacaoDraftRecord = {
  id: string;
  nome: string;
  ativo: boolean;
  editor_modelo: "LEGACY" | "CANVAS";
  rascunho_grafo_json: string | null;
  versao_publicada_id: string | null;
};
```

```ts
type AutomacaoVersaoRecord = {
  id: string;
  id_automacao: string;
  numero: number;
  grafo_json: string;
  trigger_principal: string;
  publicado_em: Date;
};
```

```ts
type AutomacaoExecucaoRecord = {
  id: string;
  id_automacao: string;
  id_versao: string;
  status: "PENDING" | "RUNNING" | "WAITING" | "FAILED" | "SUCCESS";
  trigger_tipo: string;
  contexto_ref_tipo: string | null;
  contexto_ref_id: string | null;
  log_resumido_json: string | null;
};
```

---

## API Surface

| Endpoint | Responsabilidade |
| --- | --- |
| `GET /api/automacoes` | Listagem e cards do módulo |
| `POST /api/automacoes` | Criar cabeçalho da automação |
| `GET /api/automacoes/[id]/editor` | Carregar metadados + rascunho do canvas |
| `PUT /api/automacoes/[id]/editor` | Autosave do rascunho |
| `POST /api/automacoes/[id]/publicar` | Validar, versionar e publicar |
| `GET /api/automacoes/[id]/execucoes` | Histórico resumido de execuções |
| `POST /api/automacoes/[id]/toggle` | Ativar/desativar sem mexer no grafo |

---

## Error Handling Strategy

| Cenário | Tratamento | Impacto na UX |
| --- | --- | --- |
| JSON do grafo inválido | rejeitar leitura/publish e oferecer estado seguro vazio + erro | usuário vê mensagem clara e não perde automação ativa |
| Nó sem config válida | erro por nó no validator | publish bloqueado com foco no problema |
| Falha de autosave | manter dirty state local e permitir retry | edição não some silenciosamente |
| Handler falhou em execução | registrar `AutomacaoExecucao` com erro curto e contexto | debug possível sem quebrar editor |

---

## Tech Decisions

| Decisão | Escolha | Racional |
| --- | --- | --- |
| Biblioteca do canvas | `@xyflow/react` | Resolve interação base e libera tempo para produto |
| Store inicial | hook local controlado | Menor custo agora; Zustand só se o estado crescer demais |
| Edição do nó | inspector lateral | Melhor leitura, performance e mobile fallback |
| Persistência do grafo | string JSON serializada | Mais simples em SQLite/Prisma e facilita versionamento |
| Modelo de execução | DAG sem ciclos | Mais fácil de validar, executar, debugar e explicar |
| Rollout | coexistência com legado | Reduz risco e evita big bang migration |
