# HYPE CRM

CRM multi-tenant para corretoras e times comerciais, construído com Next.js, Prisma e SQLite.

## Visao geral

- App web com foco em operacao comercial (leads, funil, atendimentos e automacoes).
- Arquitetura: Next.js App Router + React 19 + TypeScript + Prisma.
- UI: Tailwind CSS 4 + componentes base em `src/components/ui/`.
- Banco de dados padrao local: SQLite em `prisma/dev.db`.

## Stack principal

- Runtime: Node.js 20+
- Gerenciador de pacotes: `pnpm` (recomendado)
- Frontend: Next.js 16 + React 19
- Banco: Prisma + SQLite
- Testes: Vitest

## Setup rapido (local)

1. Instale dependencias:

```bash
pnpm install
```

2. Configure o arquivo `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-por-um-segredo-forte"
```

3. Gere o client do Prisma e aplique migracoes:

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

4. Popule dados iniciais:

```bash
pnpm seed
```

5. Suba o servidor de desenvolvimento:

```bash
pnpm dev
```

Aplicacao local: `http://localhost:3434`

## Credenciais de seed

- Empresa: `empresa.demo@hypecrm.com` / `123456`
- Gerente: `gerente.demo@hypecrm.com` / `123456`
- Colaboradores: `colaborador1.demo@hypecrm.com` e `colaborador2.demo@hypecrm.com` / `123456`

## Scripts principais

### Desenvolvimento

- `pnpm dev`: inicia o app na porta `3434`
- `pnpm build`: gera build de producao
- `pnpm start`: executa build em modo producao

### Banco de dados

- `pnpm db:generate`: atualiza Prisma Client
- `pnpm db:migrate:status`: mostra status de migracoes
- `pnpm db:migrate:deploy`: aplica migracoes pendentes
- `pnpm seed`: popula dados iniciais

### Qualidade

- `pnpm lint`: analise de lint
- `pnpm typecheck`: validacao de tipos TypeScript
- `pnpm test`: executa testes (Vitest)

## Validacao recomendada antes de PR

```bash
pnpm db:migrate:status
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## PM2 (VPS)

- `npm run pm2:dev`: sobe somente `hypecrm-web-dev` (modo desenvolvimento)
- `npm run pm2:prod`: executa build e sobe `hypecrm-web-prod`
- `npm run pm2:restart`: reinicia fluxo de producao com atualizacao de ambiente
- `npm run pm2:list`: lista processos PM2
- `npm run pm2:logs:web:dev`: logs do web dev
- `npm run pm2:logs:web:prod`: logs do web prod

Variaveis opcionais para ambiente PM2:

- `PM2_HOST`
- `PM2_DEV_PORT`
- `PM2_PROD_PORT`
- `PM2_DEV_MEMORY`
- `PM2_PROD_MEMORY`
- `PM2_PROD_NODE_ARGS`

## Solucao de problemas

### SQLite bloqueado durante migracao

Se `pnpm db:migrate:deploy` falhar com `database is locked`:

```bash
pm2 stop hypecrm-web
pnpm db:migrate:deploy
pm2 start hypecrm-web
```

### Banco SQLite canonical

Use apenas `prisma/dev.db` como base local principal.
Nao crie/consuma caminhos paralelos como `prisma/prisma/dev.db`.

## Estrutura do projeto (resumo)

```text
src/
  app/                 # rotas e layouts (App Router)
  components/ui/       # componentes base (shadcn/radix)
  lib/                 # utilitarios e validacoes
  modules/             # modulos de dominio (MVVM)
prisma/
  schema.prisma
  migrations/
  dev.db
```
