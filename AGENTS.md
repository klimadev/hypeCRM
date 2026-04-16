# AGENTS.md - Directrices para Agentes de Codificación

> **⚠️ IMPORTANTE:** Carregue a skill `napkin` no início de cada sessão usando o comando `/napkin` ou `skill napkin` para ter acesso ao runbook do projeto.

## Visión General

CRM HYPE - app multi-tenant Next.js 16 (App Router) para seguros y productos financieros. Stack: React 19, TypeScript, Prisma, Tailwind CSS 4, Shadcn UI/Radix.

---

## 1. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev              # Dev server en puerto 3434
pnpm build           # Build producción
pnpm start           # Servidor production

# Base de datos
pnpm db:generate     # Generar cliente Prisma
pnpm db:migrate:deploy  # Aplicar migraciones
pnpm db:migrate:status  # Ver estado migraciones
pnpm seed            # Ejecutar seed

# Validación (OBLIGATORIO después de editar)
pnpm lint; pnpm typecheck; pnpm build

# Deploy em produção (PM2)
pnpm build && pm2 restart hypecrm-web-prod
```

### Ejecutar un solo test
```bash
pnpm vitest run src/lib/__tests__/validacoes.test.ts  # Por archivo
pnpm vitest run --grep "nome da função"                # Por nombre
pnpm vitest src/lib/__tests__/validacoes.test.ts       # Modo watch
```

### PM2 + SQLite
Si `db:migrate:deploy` falla con "database is locked":
```bash
pm2 stop hypecrm-web-prod
pnpm db:migrate:deploy
pm2 start hypecrm-web-prod
```
- Para reiniciar o servidor no ambiente local/PM2, use o fluxo completo: `pnpm build && pm2 restart hypecrm-web-prod`.
- **SEMPRE** execute build E restart juntos - o código antigo continua em memória no PM2 mesmo após build bem-sucedido.

### Layout de Altura
- Em módulos full-height dentro do dashboard, `fillHeight` sozinho pode colapsar sob `main` fora de `lg`; use altura explícita em viewport quando o canvas precisar ocupar a tela inteira.
- Para canvases/boards como `automacoes`, siga o padrão de `chat`/`kanban` com `h-[calc(100dvh-...)]` no shell do módulo e `min-h-0` em todos os wrappers intermediários.

### Playwright autenticado
- Para validar fluxos protegidos no Playwright, reutilize uma sessão existente em vez de testar deslogado.
- Conta padrão para reprodução autenticada neste projeto: `limawebvision@gmail.com`.
- Se não houver sessão exportada pronta, gere/injete o cookie `hype_sessao` correspondente a essa empresa antes de abrir a rota protegida.

---

## 2. Estilo de Código

### Imports
```typescript
// ✅ Orden: Externos → @/lib → Locales → Tipos
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useEquipeModule } from '@/modules/equipe/hooks/use-equipe';
import type { TipoPerfil } from '@/modules/equipe/types';
```
- Use `@/` para rutas desde `src/`
- Evite imports barrel (`index.ts`)

### Naming Conventions
| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Componentes React | PascalCase | `LeadCard.tsx` |
| Hooks | camelCase + `use` | `use-equipe.ts` |
| Utilitários | camelCase | `aplica-mascara-telefone.ts` |
| Constantes | UPPER_SNAKE_CASE | `DIAS_ESTAGIO_PARADO` |
| Funciones/Vars | camelCase | `calcularPendencias` |
| Rutas API | kebab-case | `lead/[id]/route.ts` |

### TypeScript
- **Sin `any`** sin justificación
- `type` para tipos simples, `interface` para objetos extensibles
- Evite tipos redundantes: `const name = "test"`

```typescript
interface Lead { id: string; nome: string; etapa: EtapaLead; }
type EtapaLead = 'novo' | 'contato' | 'proposta' | 'fechado';
```

### Manejo de Errores
- Valide payloads con Zod de `src/lib/validacoes.ts`
- Retorne errores structurados:

```typescript
export async function POST(request: Request) {
  const validacao = EsquemaLead.safeParse(await request.json());
  if (!validacao.success) {
    return NextResponse.json({ erro: mensagemErroValidacao(validacao.error) }, { status: 400 });
  }
  // ... lógica
}
```

### MVVM Pattern
- `page.tsx` → componente presentacional
- `hooks/use-*.ts` → ViewModel (estados, efectos, API)
- `components/` → componentes visuales
- `types.ts` → tipajes del módulo

### API Routes
- Siempre verifique sesión: `await exigirSessao(request)`
- Use transacciones (`prisma.$transaction`) para mutaciones multi-tabla
- Soft deletes: `ativo: false` o `deleted_at`

---

## 3. Design System

### Colores (Dark Premium Theme)
```
canvas=#09090b, surface=#0c0c0e, surface-elevated=#111113
border-subtle=rgba(255,255,255,0.08), border-strong=#3f3f46
text-primary=#fafafa, text-secondary=#a1a1aa
brand=#8b5cf6, success=#10b981, danger=#f43f5e
```

### Reglas UI
- Use `cn()` de `@/lib/utils` para clases condicionales
- Evolua componentes de `src/components/ui/` (Shadcn/Radix)
- No cree button/input/select/dialog desde cero
- Focus ring obligatorio
- Motion: hover 120-160ms, modal 180-220ms

---

## 4. Estructura del Proyecto
```
src/
├── app/              # Next.js App Router
├── components/ui/    # Shadcn base components
├── lib/
│   ├── validacoes.ts # Esquemas Zod
│   └── utils.ts      # cn(), helpers
└── modules/[modulo]/
    ├── page.tsx, hooks/, components/, types.ts
```

---

## 5. Reglas de Negocio
- **WhatsApp:** Use chaves de idempotência
- **Pendências:** Calculadas "on the fly" (`src/lib/pendencias-dinamicas.ts`)
- **Teléfonos:** `aplicaMascaraTelefoneBr` (display), `normalizarTelefoneParaWhatsapp` (API)
- **Moneda:** `aplicaMascaraMoedaBr`

---

## 6. Git Commits
Conventional commits con emoji:
- `feat:` ✨ nueva funcionalidad
- `fix:` 🐛 bugfix
- `refactor:` ♻️ refactorización
- `docs:` 📝 documentación
- `chore:` 🔧 tooling, config
- `test:` ✅ tests

Formato: `<emoji> <tipo>: <descripción>`

---

## 7. Debugging de Bugs

### Metodologia Sistemática
Quando um bug for reportado, **NÃO tente soluções aleatórias**. Em vez disso:

1. **Identifique o fluxo completo**: frontend → API → banco
2. **Injete logs estruturados** com prefixo identificável (ex: `[META-TEST]`)
3. **Monitore os logs no PM2**: `tail -100 ~/.pm2/logs/hypecrm-web-prod-out.log`
4. **Analise o caminho crítico**: auth → validação → query → resposta
5. **Identifique a causa raiz**, não o sintoma

### Exemplo de logs injetados
```typescript
console.log("[META-TEST] === INICIANDO TESTE DE CONEXÃO ===");
console.log("[META-TEST] Auth result:", { erro: auth.erro, perfil: auth.sessao?.perfil });
console.log("[META-TEST] Config encontrada:", JSON.stringify(config, null, 2));
```

### Build e Deploy
Após qualquer alteração em código de produção:
1. Execute `pnpm build` e verifique se passou
2. **NÃO basta apenas fazer build** - o código antigo ainda está em memória no PM2
3. Execute `pm2 restart hypecrm-web-prod` para aplicar as mudanças
4. Verifique nos logs se as alterações foram carregadas

Fluxo completo: `pnpm build && pm2 restart hypecrm-web-prod`

---

## 8. Aprendizados Recentes

### Kanban catálogo
- Não forçar retorno para pipeline padrão apenas por abrir `/kanban` ou clicar em **Voltar ao catálogo**.
- Regra de navegação:
  - `/kanban` sem `pipelineId`/`id_funil` deve renderizar catálogo.
  - Selecionar funil via catálogo passa `pipelineId` na URL.
  - Botão **Voltar ao catálogo** remove `pipelineId` e mantém catálogo ativo.

### Meta CAPI - Teste de conexão
- O botão "Testar conexão" deve funcionar **independentemente** de a integração estar ativa.
- Valide apenas `pixel_id` e `access_token`, não exija `ativo: true`.
- Retorne mensagem clara indicando se o envio automático está ativo ou não.

---

*Última actualización: Abril 2026*
