# AGENTS.md - hypeCRM

## Design Principles (OBRIGATÓRIO)

Siga estas práticas de design automaticamente — não спрашивайте:

### Propagação Integral

- Qualquer melhoria em funcionalidade base deve propagar automaticamente para módulos dependentes.
- Exemplo: se o sistema de envio de mensagens ganha suporte a mídia, o sistema de agendamento deve automaticamente herdar esse suporte sem duplicar código.

### Fundamentos (Norman, Apple, Dieter Rams)

- **Affordance**: Elementos devem mostrar como usá-los. Botões parecem clicáveis, campos parecem editáveis.
- ** affordances perceptivas imediatas**: Cor, forma, posição, movimento. Se precisa explicar, falhou.
- **Feedback instantâneo**: Toda ação tem resposta visual <100ms.
- **Less is more**: Remove o que não é essencial. Espaço negativo é recurso.
- **Icon first**: Preferir ícone + label curto. Ícone alone só se universal (✓, +, −, ←).
- **Convenção sobre configuração**: Padrões visuais consistentesevitam customização desnecessária.

### UI/UX Principles

- Dark premium operacional
- Bordas sutis (1px), superfícies grafite (#1a1a1a), brilho localizado
- Densidade alta com respiro suficiente para toque (min 44px touch targets)
- Tipografia menor e mais densa que marketing (14px base, não 16px)
- Dock inferior não corta em safe area mobile
- Kanban legível em telas pequenas (scroll horizontal se necessário)
- Prioridade visual por tamanho, não cor apenas

### Vanguarda Tecnológica (2024/2025)

#### Filosofia de Design

- Mantenha Don Norman e Nielsen como base, mas trate a interface como um sistema vivo.
- Adote `Digital Native Motion`: micro-interações devem comunicar estado, intenção e continuidade.
- A UI não deve apenas funcionar; deve parecer rápida, precisa e animada com elegância.
- Evite movimentos genéricos ou decorativos. Toda animação precisa existir para orientar percepção.

#### Padrão de Transições

- `View Transitions API` é o padrão mandatório para mudanças de tema e navegação de rotas.
- Proibido usar overlays, máscaras artificiais, clones do DOM ou truques legados para transições de estado.
- **Spatial UI**: Floating docks, sidebars e drawers que flutuam sobre o conteúdo são permitidos se usarem APIs nativas (`backdrop-filter`, `transform`, `opacity`) sem библиотеки externas. O conteúdo não deve ser reflowed; use `overlay` com `:has()` para foco visual.
- Não introduzir camadas de suporte visuais quando a transição puder ser resolvida nativamente.
- Em React/Next.js, use `flushSync` quando necessário para sincronizar a captura visual com a atualização do estado.

#### Desempenho Perceptivo e Refinamento

- Animações devem parecer físicas, não robóticas.
- Use curvas contemporâneas e naturais, como `cubic-bezier(0.4, 0, 0.2, 1)` ou equivalentes mais refinadas quando justificadas.
- Duração padrão de motion: entre `300ms` e `600ms`.
- Animações pesadas, como `clip-path`, devem ser otimizadas para manter `60fps` e aproveitar camadas de renderização do navegador.
- Se uma transição comprometer fluidez, simplifique a composição antes de adicionar complexidade visual.

#### Modern Web Stack

- Priorize APIs nativas e CSS moderno antes de bibliotecas de terceiros.
- Prefira `Container Queries`, `:has()` e CSS Nesting quando melhorarem clareza ou adaptabilidade.
- Mantenha o código lean, direto e focado em performance percebida.
- Evite dependências extras para efeitos que o navegador já entrega com qualidade superior.

#### Glassmorphism e Floating Dock

- **Floating Glass Dock**: Sidebars e docks flutuantes devem:
  - Usar `backdrop-filter: blur(12px)` (ou valor similar) para efeito glass
  - Bordas sutis (`1px solid rgba(255,255,255,0.1)` no tema escuro)
  - Border-radius generoso (24px+) para visual premium
  - Margem da borda da tela (`left/top/bottom: 16px` ou similar)
  - `transform-gpu` e `will-change` para aceleração de hardware
- **Zero-Reflow**: Componentes que expandem no hover (sidebars, menus) devem usar `position: absolute/fixed` para sobrepor conteúdo sem redimensionar a área principal
- **Foco visual com `:has()`**: Use a pseudo-classe `:has()` para aplicar estados de foco (blur, escurecimento) no conteúdo principal quando componentes flutuantes estiverem ativos

#### Sincronização com Framework

- Em Next.js e React, a integridade visual tem prioridade sobre abstrações convenientes.
- Use `flushSync` para garantir que a View Transitions API capture o DOM no estado correto.
- Componentes de tema, navegação e estados visuais críticos devem ser escritos pensando em captura, commit e animação como uma única operação.

### Clean Code Principles

- Sem comentários (a menos que spec exija)
- Nomes descritivos: `funilTotals` não `data`, `carregarMensagens` não `fetch`
- Extrair funções > 30 linhas
- Props interfaces nomeadas: `ChatListProps` não `Props`
- Arquivos < 200 linhas
- Uma responsabilidade por componente

---

## Fluxo de trabalho

1. Fazer TODAS as edições/criações de arquivos em paralelo (uma única resposta)
2. Executar `npm run pm2:prod` para validar e fazer build

**Nunca execute `pm2:prod` no meio de múltiplas edições — só no final.**

---

## Build/Validation (PROIBIDO lint/typecheck)

**NAO use `lint` ou `typecheck`**. O comando correto para validar e fazer build:

```bash
npm run pm2:prod
```

Este comando executa `build && node scripts/pm2-mode.cjs prod`.

---

## Servidor de desenvolvimento

```bash
pnpm dev
# Acessar: http://localhost:3434
```

---

## Testes

```bash
pnpm test              # uma vez
pnpm test:watch        # modo watch
```

---

## Banco de dados

**ANTES DE QUALQUER MIGRATION: pare TODOS os processos PM2 primeiro!**

```bash
pm2 delete hypecrm-web-prod  # APENAS o processo do hypeCRM
pnpm db:generate             # atualiza Prisma Client
pnpm prisma migrate deploy   # aplica migracoes (NAO usar db:migrate)
pnpm db:migrate:status       # status
pnpm seed                    # popula dados iniciais
```

### Migrações - Regra de Ouro

- **NUNCA usar `pnpm prisma migrate dev`** - é interativo e pode causar perda de dados
- **Sempre usar `pnpm prisma migrate deploy`** - aplica migrações existentes sem interação
- **Se erro "database schema is not empty"**: usar `prisma migrate resolve --applied <nome_migration>`
- **ANTES de qualquer migration**: fazer backup do banco: `cp prisma/dev.db prisma/dev.db.backup`

---

## PM2 (producao/VPS)

```bash
npm run pm2:dev       # sobe web-dev
npm run pm2:prod      # build + web-prod (obrigatorio antes de deploy)
npm run pm2:restart    # reinicia prod
npm run pm2:logs:web:prod
npm run pm2:list
```

---

## Credenciais de seed

- Empresa: `empresa.demo@hypecrm.com` / `123456`
- Gerente: `gerente.demo@hypecrm.com` / `123456`

---

## Convenções

- Portas: dev `3434`, prod configuravel via `PM2_PROD_PORT`
- Banco local: `prisma/dev.db` (SQLite)
- Package manager: `pnpm` (nao use npm Yarn)

---

## Estrutura principal

```
src/app/           # Next.js App Router
src/components/ui # Componentes base (shadcn/radix)
src/lib/           # Utilitarios
src/modules/       # Dominio (MVVM)
prisma/            # Schema e migrations
```

---

## Arquivo .env mínimo

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-por-um-segredo-forte"
```

---

## Debugging: Log Instrumentation (Caixa Preta Forense)

Quando problemas de runtime não aparecem no stacktrace:

1. **Adicionar logging estruturado nos pontos de fronteira**
   - Entry/Exit de funções críticas (APIs, sync, persistence)
   - Request e response RAW (sem truncar)
   - Contexto completo (instanceName, remoteJid, telefone, empresa)
   - Duração de cada etapa

2. **Executar e capturar novos logs**
   ```bash
   pm2 logs hypecrm-web-prod --nostream --lines 2000
   # ou
   pm2 logs hypecrm-web-prod
   ```

3. **Rastrear o ponto de falha pelo log**
   - Onde a etapa PARA de logar (primeiro ponto sem continuidade)
   - O log antes do ponto de falha mostra o estado que originou o erro

4. **Confirmar com query direta no banco quando necessário**
   - Ex: verificar status de instância (`open` vs `ATIVO`)

### Exemplo real: chat sem mensagens

- Sintoma: chat abre mas não carrega mensagens
- Caminho de execução: stream → sync → snapshot → Evolution API → DB
- Log mostrou: `CHAT_PERSIST_SYNC_INSTANCIA_ERRO` (instância não encontrada)
- Query banco revelou: instância com status `open`, não `ATIVO`
- Filtro no código exigia `status: "ATIVO"` mas Evolution retorna `open`
- Correção: `status: { in: ["ATIVO", "open", "connecting"] }`

### Logger estruturado usado neste projeto

Arquivo: `src/lib/chat-logger.ts`
```typescript
chatLogger.log("ACAO", contexto, {
  raw: { /* payload resumido */ },
  rawCompleto: { /* payload completo sem truncar */ },
  normalizado: { /* resposta normalizada resumida */ },
  normalizadoCompleto: { /* resposta completa */ },
  duracaoMs: 123,
  meta: { /* metadados extras */ }
});
```

Uso:
- `CHAT_PERSIST_SYNC_REQ/OK/ERRO` - sincronização de mensagens com Evolution
- `EVOLUTION_FIND_MESSAGES_REQ/RAW_RESPONSE/OK` - busca de mensagens na API
- `CHAT_PERSIST_SNAPSHOT_OK/ERRO` - consulta no banco local

Sempre usar os logs forenses antes de propor hipóteses. O log é a verdade.
