# Step 5 - Ordem de Execucao e Checklist

## Ordem de Implementacao

Execute os passos na ordem exata. Cada passo deve ser validado antes de prosseguir.

### Passo 1: Schema Prisma
**Arquivo**: `prisma/schema.prisma`

- [ ] Adicionar campos de trial ao modelo `Empresa` (status_assinatura, trial_inicio, trial_fim, assinatura_inicio, assinatura_fim, plano)
- [ ] Criar modelo `RegistroIP` com indices e unique constraint
- [ ] Adicionar relation `registros_ip` ao modelo `Empresa`
- [ ] Rodar `npx prisma migrate dev --name add_trial_system`
- [ ] Verificar que a migration aplicou sem erros
- [ ] Rodar `npx prisma generate` para regenerar o client

**Validacao**: `npx prisma studio` deve mostrar os novos campos no modelo Empresa.

---

### Passo 2: Tipos e Constantes
**Arquivos**:
- `src/lib/tipos.ts`
- `src/lib/validacoes.ts`
- `src/lib/trial.ts` (NOVO)

- [ ] Adicionar tipos `StatusAssinatura`, `Plano`, `EstadoTrial` em `src/lib/tipos.ts`
- [ ] Adicionar constantes `TRIAL_DURACAO_DIAS`, `MAX_REGISTROS_POR_IP`, `JANELA_BLOQUEIO_IP_DIAS`, `STATUS_ASSINATURA`, `PLANOS` em `src/lib/validacoes.ts`
- [ ] Criar `src/lib/trial.ts` com funcoes `calcularEstadoTrial()` e `podeAcessarSistema()`

**Validacao**: `npm run typecheck` sem erros. As funcoes podem ser testadas com dados mock.

---

### Passo 3: Backend - Cadastro com Anti-Abuse
**Arquivo**: `src/app/api/autenticacao/cadastro-empresa/route.ts`

- [ ] Adicionar import de `createHash` do Node `crypto`
- [ ] Adicionar funcao `extrairIpDoRequest()`
- [ ] Adicionar funcao `hashEmail()`
- [ ] Adicionar funcao `verificarBloqueioIp()`
- [ ] Modificar handler POST: capturar IP, verificar bloqueio IP, verificar email trial duplicado
- [ ] Modificar transaction: criar Empresa com campos de trial + criar RegistroIP
- [ ] Adicionar respostas de erro 429 (IP bloqueado) e 49 (email trial duplicado)

**Validacao**:
- Testar cadastro normal: deve criar empresa com status "TRIAL" e trial_fim = hoje + 30 dias
- Testar cadastro com mesmo email: deve retornar 49
- Testar cadastro apos 3 registros do mesmo IP: deve retornar 429 (em ambiente com IP real)
- Verificar no Prisma Studio que RegistroIP foi criado

---

### Passo 4: Backend - API de Status Trial
**Arquivo**: `src/app/api/trial/status/route.ts` (NOVO)

- [ ] Criar endpoint `GET` que usa `exigirSessao` e retorna `calcularEstadoTrial()`
- [ ] Adicionar `/api/trial/:path*` ao matcher do middleware

**Validacao**:
- `curl -b cookies.txt http://localhost:3434/api/trial/status` deve retornar JSON com estado do trial
- Testar com usuario logado e sem logado

---

### Passo 5: Frontend - Hook e Componente
**Arquivos**:
- `src/modules/trial/types.ts` (NOVO)
- `src/modules/trial/hooks/use-trial-status.ts` (NOVO)
- `src/modules/trial/components/trial-banner.tsx` (NOVO)
- `src/modules/trial/index.ts` (NOVO)

- [ ] Criar `src/modules/trial/types.ts` com tipo `EstadoTrial`
- [ ] Criar `src/modules/trial/hooks/use-trial-status.ts` com hook `useTrialStatus`
- [ ] Criar `src/modules/trial/components/trial-banner.tsx` com componente `TrialBanner`
- [ ] Criar `src/modules/trial/index.ts` exportando o modulo

**Validacao**: Compilar sem erros com `npm run typecheck`.

---

### Passo 6: Frontend - Integracao no Layout
**Arquivo**: `src/app/(dashboard)/layout.tsx`

- [ ] Importar `TrialBanner` de `@/modules/trial`
- [ ] Adicionar `<TrialBanner />` no topo do `<main>`, antes de `{children}`

**Validacao**:
- Navegar para `/resumo` logado como trial: banner deve aparecer com countdown
- Verificar que o banner nao aparece para contas com assinatura ativa
- Verificar que o banner mostra "expirado" se trial_fim < hoje

---

### Passo 7: Frontend - Pagina de Cadastro
**Arquivo**: `src/app/(auth)/cadastro/page.tsx`

- [ ] Atualizar tratamento de erros para incluir status 429 (bloqueio IP)
- [ ] Atualizar mensagem de erro para status 409 (email trial duplicado)

**Validacao**: Tentar cadastrar com email ja existente: mensagem deve ser clara sobre trial.

---

### Passo 8: Testes Finais

- [ ] Rodar `npm run lint`
- [ ] Rodar `npm run typecheck` (se existir script) ou `npx tsc --noEmit`
- [ ] Rodar `npm run test` para garantir que nada quebrou
- [ ] Teste manual completo do fluxo de cadastro -> trial -> banner -> expiracao

---

## Arquivos Criados (novos)

| Arquivo | Tipo |
|---------|------|
| `src/lib/trial.ts` | Logica de trial |
| `src/app/api/trial/status/route.ts` | API endpoint |
| `src/modules/trial/types.ts` | Tipagens do modulo |
| `src/modules/trial/hooks/use-trial-status.ts` | Hook React |
| `src/modules/trial/components/trial-banner.tsx` | Componente UI |
| `src/modules/trial/index.ts` | Export do modulo |

## Arquivos Modificados (existentes)

| Arquivo | Mudanca |
|---------|---------|
| `prisma/schema.prisma` | Campos trial + modelo RegistroIP |
| `src/lib/tipos.ts` | Novos tipos |
| `src/lib/validacoes.ts` | Novas constantes |
| `src/app/api/autenticacao/cadastro-empresa/route.ts` | Anti-abuse + trial |
| `src/app/(dashboard)/layout.tsx` | Integrar TrialBanner |
| `src/app/(auth)/cadastro/page.tsx` | Tratamento de erros |
| `middleware.ts` | Adicionar matcher de trial |

## Consideracoes Futuras (fora do escopo atual)

- **Sistema de pagamento**: Integrar Stripe/Pagar.me para upgrade real
- **Pagina de planos**: Criar tela de selecao de planos com precos
- **Webhook de pagamento**: Endpoint para receber confirmacao de pagamento e atualizar status
- **Notificacao por email**: Enviar emails de aviso de trial expirando (7, 3, 1 dia antes)
- **Bloqueio de funcionalidades**: Restringir features apos expiracao do trial (leads max, funcionarios max)
- **Rate limiting por IP mais sofisticado**: Usar Redis ou similar para rate limiting em producao
- **Fingerprinting avancado**: Browser fingerprint como camada adicional de anti-abuse
