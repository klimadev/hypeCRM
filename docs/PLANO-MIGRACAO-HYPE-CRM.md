# Plano de Migração: HYPE CRM

## Visão Geral

| Categoria | Qtd | Complexidade |
|-----------|-----|--------------|
| **Remover** (campos específicos) | 2 | Baixa |
| **Renomear** (naming) | ~10 | Baixa |
| **Adaptar** (lógica de negócio) | 4 | Média-Alta |
| **Manter** ( já é genérico) | ~15 | - |

---

## 🚀 Fase 1: Mudanças de Baixa Complexidade (Sem Risco)

### 1.1 Renomear Branding "Consórcio" → "HYPE CRM"

**Arquivos:**

| Arquivo | Mudança |
|---------|---------|
| `package.json` (name) | `crm_consorcio_final` → `hype-crm` |
| `src/lib/autenticacao.ts:15` | `crm_consorcio_sessao` → `hype_sessao` |
| `src/app/api/whatsapp/instances/route.ts:28` | `crmconsorc_io_${empresaSlug}_${nomeSlug}` → `hype_${empresaSlug}_${nomeSlug}` |

**Impacto:** Baixíssimo. Apenas strings.

---

### 1.2 Remover/Descontinuar Rota de Aprovação

**Arquivo:** `src/app/api/leads/[id]/aprovar/route.ts`

**O que fazer:**
- ❌ **Opção A (Radical):** Deletar rota e UI relacionada
- ⚠️ **Opção B (Preservar):** Marcar como `@deprecated`, mas manter funcional

**Dependências a remover:**
- `src/app/api/leads/[id]/aprovar/route.test.ts` - deletar
- `src/modules/kanban/utils/mensagens.ts:10` - chave `aprovarLead`
- Referências no frontend (botões de aprovação)

**Impacto:** Baixo. Apenas 2 arquivos de API + testes.

---

## 🚀 Fase 2: Mudanças de Média Complexidade

### 2.1 Substituir `valor_consórcio` por `valor_oportunidade`

**Schema (Prisma):**

```prisma
// ANTES (schema.prisma:121)
valor_consorcio Float

// DEPOIS
valor_oportunidade Float @default(0)
```

**Validações (src/lib/validacoes.ts:80):**

```typescript
// ANTES
valor_consorcio: z.number().positive("Valor do consorcio deve ser maior que zero.")

// DEPOIS  
valor_oportunidade: z.number().min(0, "Valor da oportunidade não pode ser negativo")
```

**APIs a atualizar:**

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/app/api/leads/route.ts` | 66,73,82,123 | Renomear |
| `src/app/api/leads/[id]/route.ts` | 88 | Renomear |
| `src/app/api/parcelas/route.ts` | 75 | Remover select |
| `src/app/api/pendencias/route.ts` | 25 | Remover select |
| `src/app/api/recebimentos/route.ts` | 130,172 | Remover |

**Frontend (Kanban):**

| Arquivo | Linha | Ação |
|---------|-------|------|
| `src/modules/kanban/types.ts` | 24 | Renomear |
| `src/modules/kanban/hooks/use-kanban-derivacoes.ts` | 139,141 | Renomear sort |
| `src/modules/kanban/hooks/use-kanban-detalhes-lead.ts` | 100,154 | Renomear |
| `src/modules/kanban/hooks/use-kanban-operacoes.ts` | 100,116 | Renomear |

**Impacto:** Médio (44 referências). Estratégia: **Batch rename**.

---

### 2.2 Remover Sistema de Aprovação de Gains

**Campos a remover do Schema:**

```prisma
// Remover do model Lead (schema.prisma:126-129)
documento_aprovacao_url String?
aprovado_em             DateTime?
aprovado_por           String?
```

**Validações (src/lib/validacoes.ts):**

- Remover validação `documento_aprovacao_url` (linha 223-232)
- Remover do schema de atualização (linha 242-244)

**Lógica de movimento (src/app/api/leads/[id]/mover/route.ts:84-94):**

```typescript
// ANTES
const hasDocumento = Boolean(lead.documento_aprovacao_url);
// Se não tiver documento, bloqear → FECHADO
if (estagioNovo.tipo === "GANHO" && !hasDocumento) {
  return badRequest("O lead precisa ter um documento de aprovação anexado antes de ser movido para Fechado.");
}

// DEPOIS - Remover check
if (estagioNovo.tipo === "GANHO") {
  // Permitir livremente
}
```

**Pendências (src/lib/pendencias-dinamicas.ts):**

- Remover check `documento_aprovacao_url` (linha 35, 61)

**Frontend:**

- `src/modules/kanban/hooks/use-kanban-detalhes-lead.ts` - remover upload de documento
- `src/modules/kanban/types.ts` - remover `documento_aprovacao_url`

**Impacto:** Médio-alto (~20 arquivos). MUITO impacto visual.

---

### 2.3 Adaptar Descrição de Metas

**Arquivo:** `src/modules/equipe/components/metas/utils.ts:19-20`

```typescript
// ANTES
export function descreverIndicadorMeta(meta) {
  return meta.tipo_meta === "VALOR" 
    ? "Valor recebido"        // ← Consórcio
    : "Contratos com pagamento";
}

// DEPOIS - Genérico
export function descreverIndicadorMeta(meta) {
  return meta.tipo_meta === "VALOR" 
    ? "Valor total"            // ← Genérico
    : "Quantidade";
}
```

**Impacto:** Baixo. Apenas 1 arquivo.

---

## 🚀 Fase 3: Mudanças de Alta Complexidade

### 3.1 Adaptar/Gerenciar Sistema de Parcelas

**Contexto:** O modelo `Parcela` é usado para:

- Renderizar "quitação" no Kanban
- Calcular metas de recebimento
- Histórico de pagamentos

**Opções:**

| Opção | Descrição | Complexidade |
|-------|-----------|--------------|
| **A** Manter | Manter como "Parcelas/Recibo" genérico | Baixa |
| **B** Renomear | Mover para "Pagamentos" ou "Faturas" | Média |
| **C** Substituir | Novo modelo `TransacaoFinanceira` | Alta |

**Recomendação:** **Opção B** - Renomear semanticamente.

```typescript
// Campos a renomear na API
// numero_parcela → numero_pagamento
// quantidade_total → total_parcelas (ou remover)
// valor → valor_pagamento
```

**CRÍTICO:** Se remover o sistema de parcelas, quebra:

- ✅ `src/app/api/recebimentos/route.ts` (POST parcelas)
- ✅ `src/app/api/parcelas/route.ts` (CRUD)
- ✅ `src/lib/api/recebimentos.ts` (tipos)
- ✅ Cálculo de metas

---

### 3.2 Adaptar Estágios do Funil (Seed)

**Arquivo:** `prisma/seed.js:7-15`

```javascript
// ANTES
const ESTAGIOS_PADRAO = [
  { nome: "Indefinido", tipo: "ABERTO", ordem: 1 },
  { nome: "Em Atendimento", tipo: "ABERTO", ordem: 2 },
  { nome: "Proposta", tipo: "ABERTO", ordem: 3 },
  { nome: "Pré Aprovação", tipo: "ABERTO", ordem: 4 },  // ← Remover
  { nome: "Fechado", tipo: "GANHO", ordem: 5 },
  { nome: "Pós Vendas", tipo: "GANHO", ordem: 6 },
  { nome: "Perdido", tipo: "PERDIDO", ordem: 7 },
];

// DEPOIS - Genérico
const ESTAGIOS_PADRAO = [
  { nome: "Novo Lead", tipo: "ABERTO", ordem: 1 },
  { nome: "Em Contato", tipo: "ABERTO", ordem: 2 },
  { nome: "Qualificação", tipo: "ABERTO", ordem: 3 },
  { nome: "Proposta/Proposta", tipo: "ABERTO", ordem: 4 },
  { nome: "Negócio Fechado", tipo: "GANHO", ordem: 5 },
  { nome: "Em Execução", tipo: "GANHO", ordem: 6 },
  { nome: "Perdido", tipo: "PERDIDO", ordem: 7 },
];
```

**⚠️ ATENÇÃO:** Isso afeta dados existentes! Necessário:

1. Migrar dados: "Fechado" → "Negócio Fechado"
2. "Pós Vendas" → "Em Execução"
3. "Pré Aprovação" → Remover (migrar para "Proposta" ou "Fechado")

**Impacto:** Alto (dados). Requer script de migração.

---

### 3.3 Adicionar Campos Genéricos (Opcional)

Para tornar o CRM verdadeiramente universal, considere adicionar:

```prisma
model Lead {
  // ... campos existentes
  
  // Novos campos genéricos
  valor_oportunidade Float @default(0)
  probabilidade Float @default(0.5)  // 0-100%
  fonte String?  // De onde veio o lead
  empresa_origem String?  // Para B2B
  
  // Campos customizáveis (JSON)
  dados_extras Json?  // Para customização futura
}
```

---

## 📊 Matriz de Esforço

| Fase | Mudança | Arquivos | Esforço | Risco |
|------|---------|----------|---------|-------|
| 1 | Branding | 4 | 1h | Baixo |
| 1 | Rota aprovação | 3 | 2h | Baixo |
| 2 | valor_consorcio | 15 | 4h | Médio |
| 2 | documento_aprovacao | 12 | 4h | Médio |
| 2 | Meta desc | 1 | 30min | Baixo |
| 3 | Parcelas | 6 | 6h | Médio |
| 3 | Estágios seed | 1 | 2h | Alto (dados) |
| 3 | Campos genéricos | 3 | 8h | Médio |

**Total estimado:** ~28h de trabalho

---

## 🎯 Ordem de Execução Recomendada

```
FASE 1 (Dia 1)
├── 1.1 Renomear branding (package.json, cookie, etc)
└── 1.2 Remover rota de aprovação

FASE 2 (Dia 2-3)
├── 2.1 Substituir valor_consorcio → valor_oportunidade
├── 2.2 Remover sistema de aprovação (documento)
└── 2.3 Adaptar descrições de meta

FASE 3 (Dia 4-5)
├── 3.1 Gerenciar/adaptar sistema de parcelas
├── 3.2 Atualizar estágios do funil
└── 3.3 Adicionar campos genéricos (opcional)
```

---

## ⚠️ Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Quebrar API de leads | Média | Alto | Testar cada endpoint após mudança |
| Perda de dados | Baixa | Alto | Backup do banco antes de migrar |
| Incompatibilidade frontend | Alta | Médio | Testar UI completa após mudanças |
| Quebrar automações WA | Baixa | Médio | Verificar dependências |

---

## ✅ Checklist Pré-Migração

- [ ] Backup completo do banco (SQLite = copiar arquivo)
- [ ] Rodar testes existentes (se houver)
- [ ] Documentar estado atual do código (commits)
- [ ] Definir estratégia de branch (develop → feature/hype-migration)

---

## 💡 Sugestão: Abordagem Incremental

Ao invés de migrar tudo de uma vez:

1. **Branching:** `git checkout -b feature/hype-universal`
2. **Iteração 1:** Apenas Fase 1 (branding + remover rota)
3. **Validação:** Deploy em staging, testar
4. **Iteração 2:** Apenas Fase 2 (valor + documento)
5. **Validação:** Deploy em staging, testar
6. **Iteração 3:** Apenas Fase 3 (parcelas + estágios)
7. **Validação final:** Deploy em produção

---

## 📋 Histórico de Execução

| Data | Fase | Status | Observações |
|------|------|--------|-------------|
| 2026-03-13 | Fase 1 | ✅ Concluída | Branding renomeado, rota de aprovação descontinuada |
| 2026-03-14 | Fase 2 | ✅ Concluída | valor_consorcio→valor_oportunidade, documento_aprovacao removido, metas genéricas |
| 2026-03-14 | Fase 3 | ✅ Concluída | Estágios genéricos no seed, campos probabilidade/fonte/empresa_origem/dados_extras |
