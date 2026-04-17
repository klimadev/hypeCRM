# AGENTS.md - hypeCRM

## Fluxo de trabalho

1. Fazer TODAS as edições/criações de arquivos em paralelo (uma única resposta)
2. Executar `npm run pm2:prod` para validar e fazer build

**Nunca execute `pm2:prod` no meio de múltiplas edições — só no final.**

## Build/Validation (PROIBIDO lint/typecheck)

**NAO use `lint` ou `typecheck`**. O comando correto para validar e fazer build:

```bash
npm run pm2:prod
```

Este comando executa `build && node scripts/pm2-mode.cjs prod`.

## Servidor de desenvolvimento

```bash
pnpm dev
# Acessar: http://localhost:3434
```

## Testes

```bash
pnpm test              # uma vez
pnpm test:watch        # modo watch
```

## Banco de dados

```bash
pnpm db:generate       # atualiza Prisma Client
pnpm db:migrate:deploy # aplica migracoes
pnpm db:migrate:status # status
pnpm seed              # popula dados iniciais
```

## PM2 (producao/VPS)

```bash
npm run pm2:dev       # sobe web-dev
npm run pm2:prod      # build + web-prod (obrigatorio antes de deploy)
npm run pm2:restart    # reinicia prod
npm run pm2:logs:web:prod
npm run pm2:list
```

## Credenciais de seed

- Empresa: `empresa.demo@hypecrm.com` / `123456`
- Gerente: `gerente.demo@hypecrm.com` / `123456`

## Convencoes

- Portas: dev `3434`, prod configuravel via `PM2_PROD_PORT`
- Banco local: `prisma/dev.db` (SQLite)
- Package manager: `pnpm` (nao use npm Yarn)

## Estrutura principal

```
src/app/           # Next.js App Router
src/components/ui # Componentes base (shadcn/radix)
src/lib/           # Utilitarios
src/modules/       # Dominio (MVVM)
prisma/            # Schema e migrations
```

## Arquivo .env minimo

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-por-um-segredo-forte"
```

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