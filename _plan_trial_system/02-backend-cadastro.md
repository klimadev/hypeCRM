# Step 2 - Backend: Cadastro com Anti-Abuse e Trial

## Contexto
O endpoint `POST /api/autenticacao/cadastro-empresa` em `src/app/api/autenticacao/cadastro-empresa/route.ts` precisa ser modificado para:
1. Capturar IP do request
2. Verificar se o email ja foi usado para trial
3. Verificar se o IP ja tem muitos registros
4. Definir campos de trial automaticamente

## Mudancas no arquivo `src/app/api/autenticacao/cadastro-empresa/route.ts`

### 2.1 Imports adicionais

```typescript
import { createHash } from "crypto";
```

### 2.2 Constantes de anti-abuse (definir no topo do arquivo ou em `src/lib/validacoes.ts`)

```typescript
const MAX_REGISTROS_POR_IP = 3;        // Max de contas por IP nos ultimos 30 dias
const JANELA_BLOQUEIO_IP_DIAS = 30;    // Janela de verificacao
const TRIAL_DURACAO_DIAS = 30;         // Duracao do trial
```

### 2.3 Funcao auxiliar para extrair IP

```typescript
function extrairIpDoRequest(request: Request): string {
  // Verificar headers de proxy primeiro (se atras de reverse proxy)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  
  // Fallback - em desenvolvimento pode ser undefined
  return "unknown";
}

function hashEmail(email: string): string {
  return createHash("sha256").update(email.toLowerCase()).digest("hex");
}
```

### 2.4 Funcao de verificacao de bloqueio IP

```typescript
async function verificarBloqueioIp(ipAddress: string): Promise<{ bloqueado: boolean; motivo?: string }> {
  if (ipAddress === "unknown") {
    // Em desenvolvimento, nao bloquear
    return { bloqueado: false };
  }
  
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - JANELA_BLOQUEIO_IP_DIAS);
  
  const registrosRecentes = await prisma.registroIP.count({
    where: {
      ip_address: ipAddress,
      criado_em: { gte: dataLimite },
    },
  });
  
  if (registrosRecentes >= MAX_REGISTROS_POR_IP) {
    return {
      bloqueado: true,
      motivo: `Limite de ${MAX_REGISTROS_POR_IP} registros atingido para este endereco de rede.`,
    };
  }
  
  return { bloqueado: false };
}
```

### 2.5 Funcao de verificacao de email duplicado para trial

```typescript
async function verificarEmailTrialDuplicado(emailHash: string): Promise<boolean> {
  const registro = await prisma.registroIP.findFirst({
    where: { email_hash: emailHash },
  });
  return registro !== null;
}
```

### 2.6 Modificar o handler POST

O fluxo atual do handler POST e:

1. Validar body com Zod
2. Verificar se email ja existe na tabela Empresa
3. Hash da senha
4. Transaction: criar Empresa + criar EstagiosFunil
5. Criar token JWT
6. Retornar cookie

O novo fluxo deve ser:

1. Validar body com Zod (existente)
2. **Capturar IP do request**
3. **Verificar bloqueio por IP** -> retornar 429 se bloqueado
4. **Verificar email duplicado na tabela Empresa** (existente) -> retornar 409
5. **Verificar email duplicado para trial (RegistroIP)** -> retornar 409 com mensagem especifica
6. Hash da senha (existente)
7. **Hash do email**
8. Transaction:
   9. Criar Empresa **com campos de trial** (status_assinatura: "TRIAL", trial_inicio: agora, trial_fim: agora + 30 dias)
   10. Criar EstagiosFunil (existente)
   11. **Criar RegistroIP** (ip_address, email_hash, id_empresa, user_agent)
12. Criar token JWT (existente)
13. Retornar cookie (existente)

### 2.7 Exemplo de implementacao da transaction atualizada

```typescript
const agora = new Date();
const trialFim = new Date(agora);
trialFim.setDate(trialFim.getDate() + TRIAL_DURACAO_DIAS);

const empresa = await prisma.$transaction(async (tx) => {
  const novaEmpresa = await tx.empresa.create({
    data: {
      nome,
      email,
      senha_hash,
      status_assinatura: "TRIAL",
      trial_inicio: agora,
      trial_fim: trialFim,
      plano: "trial",
    },
  });

  await tx.estagioFunil.createMany({
    data: ESTAGIOS_FIXOS_PADRAO.map((estagio) => ({
      id_empresa: novaEmpresa.id,
      nome: estagio.nome,
      tipo: estagio.tipo,
      ordem: estagio.ordem,
    })),
  });

  // Registrar IP para anti-abuse
  await tx.registroIP.create({
    data: {
      ip_address: ipAddress,
      email_hash: emailHash,
      id_empresa: novaEmpresa.id,
      user_agent: request.headers.get("user-agent") ?? null,
    },
  });

  return novaEmpresa;
});
```

### 2.8 Respostas de erro novas

```typescript
// Bloqueio por IP
if (bloqueioIp.bloqueado) {
  return NextResponse.json(
    { erro: bloqueioIp.motivo },
    { status: 429 }  // Too Many Requests
  );
}

// Email duplicado para trial
if (emailTrialDuplicado) {
  return NextResponse.json(
    { erro: "Este e-mail ja possui um trial registrado. Faca login ou use outro e-mail." },
    { status: 409 }
  );
}
```

## Notas de Seguranca

- **Nunca logar o IP ou email em texto plano** nos logs do servidor.
- O `email_hash` usa SHA-256, que e uma funcao de hash unidirecional. O email original nao pode ser recuperado a partir do hash.
- O campo `user_agent` e opcional e serve apenas para fingerprinting adicional em casos de abuso sofisticado.
- A verificacao de IP e feita ANTES de qualquer escrita no banco para minimizar carga.
- Em ambiente de desenvolvimento (IP = "unknown"), o bloqueio por IP e desabilitado para nao travar testes.
