# HYPE CRM

CRM multi-tenant para vendas, com Next.js + Prisma + SQLite.

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
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="troque-por-um-segredo-forte"
```

3. Gere o client do Prisma e sincronize o banco:

```bash
pnpm prisma generate
pnpm prisma db push
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

## Validacao local recomendada

```bash
pnpm lint
pnpm test
pnpm build
```
