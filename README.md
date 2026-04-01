# HYPE CRM

CRM multi-tenant para vendas, com Next.js + Prisma + SQLite.

O banco SQLite canonico do projeto fica em `prisma/dev.db`. Nao use arquivos paralelos como `prisma/prisma/dev.db`.

## Requisitos

- Node.js 20+
- pnpm (recomendado)

## Ambiente

1. Instale dependencias:

```bash
pnpm install
```

2. Configure `.env`:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="troque-por-um-segredo-forte"
```

3. Gere o client do Prisma e aplique as migracoes versionadas:

```bash
pnpm db:generate
pnpm db:migrate:deploy
```

4. Popule dados de exemplo:

```bash
pnpm seed
```

Credenciais criadas no seed:

- Empresa: `empresa.demo@hypecrm.com` / `123456`
- Gerente: `gerente.demo@hypecrm.com` / `123456`
- Colaboradores: `colaborador1.demo@hypecrm.com` e `colaborador2.demo@hypecrm.com` / `123456`

## Scripts

- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm seed`
- `pnpm db:generate`
- `pnpm db:migrate:status`
- `pnpm db:migrate:deploy`

## PM2 na VPS

- `npm run pm2:dev`: sobe somente `hypecrm-dev` em `3435`, desliga o processo de producao, recria o processo de desenvolvimento no PM2 e deixa o `next dev` acessivel pela rede.
- `npm run pm2:prod`: roda `build`, sobe somente `hypecrm-prod` em `3434` com `.next/standalone/server.js`, desliga o modo de desenvolvimento e recria o processo de producao no PM2.
- `npm run pm2:restart`: recarrega o modo de producao com `--update-env`.
- `npm run pm2:logs:dev` e `npm run pm2:logs:prod`: acompanham os logs de cada modo.
- Variaveis opcionais para ajuste fino na VPS: `PM2_HOST`, `PM2_DEV_PORT`, `PM2_PROD_PORT`, `PM2_DEV_MEMORY`, `PM2_PROD_MEMORY`, `PM2_PROD_NODE_ARGS`.
- Em VPS low-end, o fluxo recomendado e manter apenas um modo ativo por vez para evitar disputa de CPU e RAM.

## Validacao local recomendada

```bash
pnpm db:migrate:status
pnpm lint
pnpm test
pnpm build
```
