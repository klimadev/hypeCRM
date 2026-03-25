# Step 1 - Database Schema Updates

## Contexto
O modelo `Empresa` atual nao possui campos de assinatura ou trial. Precisamos adicionar campos para controlar o status do trial e criar uma tabela para rastrear IPs de registro.

## Mudancas no `prisma/schema.prisma`

### 1.1 Adicionar campos de trial ao modelo `Empresa`

Adicionar os seguintes campos ao modelo `Empresa`, logo apos o campo `atualizado_em`:

```prisma
model Empresa {
  // ... campos existentes ...
  
  // === TRIAL SYSTEM ===
  status_assinatura String   @default("TRIAL")   // TRIAL | ATIVA | EXPIRADA | CANCELADA
  trial_inicio      DateTime @default(now())     // Quando o trial comecou
  trial_fim         DateTime?                     // Quando o trial expira (inicio + 30 dias)
  assinatura_inicio DateTime?                     // Data de inicio da assinatura paga
  assinatura_fim    DateTime?                     // Data de fim da assinatura paga (renovacao)
  plano             String   @default("trial")   // trial | basico | profissional | enterprise
  
  // ... relations existentes ...
  registros_ip RegistroIP[]                       // Novo relation
}
```

### 1.2 Criar modelo `RegistroIP`

Este modelo rastreia registros por IP para prevenir abuso:

```prisma
model RegistroIP {
  id            String   @id @default(uuid())
  ip_address    String                        // IP hash ou IP completo
  email_hash    String                        // Hash do email para busca
  id_empresa    String                        // Referencia a empresa registrada
  user_agent    String?                        // Para fingerprinting adicional
  criado_em     DateTime @default(now())
  
  empresa       Empresa  @relation(fields: [id_empresa], references: [id])
  
  @@unique([ip_address, email_hash])           // Um registro por IP+email
  @@index([ip_address])                         // Busca rapida por IP
  @@index([email_hash])                         // Busca rapida por email hash
  @@index([criado_em])                          // Para limpeza de registros antigos
}
```

### 1.3 Constantes de Trial (para usar no schema e no codigo)

```
TRIAL_DURATION_DAYS = 30
STATUS_ASSINATURA = "TRIAL" | "ATIVA" | "EXPIRADA" | "CANCELADA"
PLANOS = "trial" | "basico" | "profissional" | "enterprise"
```

## Migration

Apos editar o schema, rodar:

```bash
npx prisma migrate dev --name add_trial_system
```

Isso vai:
1. Gerar a migration SQL
2. Aplicar no banco SQLite
3. Regenerar o Prisma Client

## Notas Importantes

- O campo `trial_fim` e `DateTime?` (nullable) porque empresas que ja existem nao terao trial. O sistema deve tratar empresas sem `trial_fim` como "sem trial" (assumir que sao contas antigas/pagas).
- O campo `status_assinatura` default e `TRIAL` para novos registros. Empresas existentes precisarao de um seed/update para definir como `ATIVA` ou `EXPIRADA` conforme a regra de negocio.
- O `email_hash` no `RegistroIP` usa SHA-256 para que o email em texto plano nunca fique no banco. O hash e calculado no backend no momento do registro.
- O `@@unique([ip_address, email_hash])` impede o mesmo IP+email de registrar novamente. Para bloqueio por IP puro (multiplas contas do mesmo IP), a query deve ser feita no codigo (contar registros do IP nos ultimos N dias).
