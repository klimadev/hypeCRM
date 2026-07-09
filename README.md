<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/actions/workflow/status/klimadev/hypeCRM/ci.yml?branch=main&label=CI&logo=github" alt="CI" />
  <img src="https://img.shields.io/github/license/klimadev/hypeCRM" alt="License" />
  <img src="https://img.shields.io/github/last-commit/klimadev/hypeCRM/main" alt="Last Commit" />
  <img src="https://img.shields.io/badge/node-20+-339933?logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm" alt="pnpm" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
</p>

# hypeCRM

**CRM multi-tenant para corretoras e times comerciais** — leads, funil, atendimento via WhatsApp/Instagram e automações.

---

## Sobre

hypeCRM é um CRM focado em operações comerciais, com:

- **📋 Gestão de leads** — captura, qualificação e distribuição
- **🏷️ Kanban de negócios** — pipeline visual com arrastar e soltar
- **💬 Atendimento multicanal** — WhatsApp (Evolution API) e Instagram integrados
- **🤖 Automações** — canvas visual configurável (gatilhos + ações)
- **📊 Dashboard** — métricas de performance do time
- **🔐 Multi-tenancy** — empresas, gerentes e colaboradores com permissões
- **👑 Super Admin** — gestão centralizada de usuários e planos

---

## Stack

| Camada        | Tecnologia                                                                 |
|---------------|----------------------------------------------------------------------------|
| **Runtime**   | Node.js 20+                                                                |
| **Frontend**  | Next.js 16 + React 19 + Tailwind CSS 4                                     |
| **Linguagem** | TypeScript (strict mode)                                                   |
| **ORM**       | Prisma 5                                                                   |
| **Banco**     | SQLite (default) — adaptável via Prisma                                     |
| **Testes**    | Vitest                                                                     |
| **Package**   | pnpm 9                                                                     |

### Dependências principais

`@prisma/client` · `next` · `react` · `framer-motion` · `recharts` · `lucide-react` · `@hello-pangea/dnd` · `@xyflow/react` · `@radix-ui/*` · `jose` · `bcryptjs` · `vaul`

---

## Setup rápido

```bash
# 1. Clone e instale
git clone https://github.com/klimadev/hypeCRM.git
cd hypeCRM
pnpm install

# 2. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais (JWT_SECRET, Evolution API, etc.)

# 3. Prepare o banco
pnpm db:generate
pnpm db:migrate:deploy
pnpm seed

# 4. Inicie
pnpm dev
```

Acesse **http://localhost:3434**

### Credenciais de seed

| Perfil        | Email                          | Senha    |
|---------------|--------------------------------|----------|
| Empresa       | `empresa.demo@hypecrm.com`     | `123456` |
| Gerente       | `gerente.demo@hypecrm.com`    | `123456` |
| Colaborador 1 | `colaborador1.demo@hypecrm.com` | `123456` |
| Colaborador 2 | `colaborador2.demo@hypecrm.com` | `123456` |

---

## Scripts

### Desenvolvimento

| Comando             | Descrição                             |
|---------------------|---------------------------------------|
| `pnpm dev`          | Servidor de desenvolvimento (`:3434`) |
| `pnpm build`        | Build de produção                      |
| `pnpm start`        | Executa build em modo produção         |

### Banco de dados

| Comando                 | Descrição                      |
|------------------------|--------------------------------|
| `pnpm db:generate`     | Atualiza Prisma Client         |
| `pnpm db:migrate:deploy` | Aplica migrações pendentes   |
| `pnpm db:migrate:status` | Status das migrações          |
| `pnpm seed`            | Popula dados iniciais          |

### Qualidade

| Comando           | Descrição                   |
|-------------------|-----------------------------|
| `pnpm lint`       | ESLint                      |
| `pnpm typecheck`  | TypeScript strict check     |
| `pnpm test`       | Testes (Vitest)             |

### PM2 (produção em VPS)

| Comando                | Descrição                             |
|------------------------|---------------------------------------|
| `pnpm pm2:dev`         | Sobe web em modo dev                  |
| `pnpm pm2:prod`        | Build + sobe web em modo produção     |
| `pnpm pm2:logs:web:prod` | Logs do web prod                   |
| `pnpm pm2:logs:scheduler:prod` | Logs do scheduler prod       |

> Variáveis opcionais: `PM2_HOST`, `PM2_DEV_PORT`, `PM2_PROD_PORT`, `PM2_DEV_MEMORY`, `PM2_PROD_MEMORY`, `PM2_PROD_NODE_ARGS`

---

## Estrutura

```text
src/
├── app/              # Rotas e layouts (Next.js App Router)
├── components/
│   └── ui/           # Componentes base (shadcn/ui + Radix)
├── lib/              # Utilitários, APIs externas, autenticação
└── modules/          # Módulos de domínio (MVVM-style)
    ├── kanban/
    ├── leads/
    ├── automacoes/
    ├── integracoes/
    └── whatsapp/
prisma/
├── schema.prisma
├── migrations/
└── scripts/          # Utilitários de migração e backfill
scripts/              # Scripts auxiliares (PM2, setup, screenshots)
```

---

## Pré-requisitos antes de um PR

```bash
pnpm db:migrate:status   # sem migrations pendentes
pnpm lint                # sem erros
pnpm typecheck           # sem erros de tipo
pnpm test                # todos verdes
pnpm build               # compila sem erros
```

---

## Contribuição

Leia [CONTRIBUTING.md](./CONTRIBUTING.md) para detalhes sobre:

- Convenção de commits (Conventional Commits + emoji)
- Fluxo de branches e PRs
- Validações obrigatórias
- Guia de estilo

---

## Suporte

- 📖 [Documentação](./docs/)
- 🐛 [Reportar bug](https://github.com/klimadev/hypeCRM/issues/new?template=bug_report.yml)
- 💡 [Sugerir funcionalidade](https://github.com/klimadev/hypeCRM/issues/new?template=feature_request.yml)
- 🔒 [Vulnerabilidade](https://github.com/klimadev/hypeCRM/security/advisories/new)

---

## Licença

MIT © 2025 [Klimadev](https://github.com/klimadev)