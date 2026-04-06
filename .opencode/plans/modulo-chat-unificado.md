# Modulo Chat Unificado - Plano de Implementacao

## Objetivo

Implementar o modulo `/chat` no layout do WhatsApp Web que agrega e exibe conversas de **todas as instancias Evolution conectadas** pertencentes a empresa do usuario, com **mapeamento automatico por telefone** contra leads do CRM, aplicando **RBAC rigoroso** e oferecendo **acoes rapidas para contatos nao cadastrados** (orphan chats).

Atualizacoes em tempo real via **SSE (Server-Sent Events)** com canal compartilhado por empresa, eliminando polling redundante mesmo com multiplos usuarios conectados simultaneamente.

---

## 1. Conceitos Fundamentais

### 1.1 Definicoes

| Termo | Definicao |
|-------|-----------|
| **Chat Unificado** | Conversa da Evolution enriquecida com dados do CRM quando ha match por telefone |
| **Chat Orphan** | Conversa da Evolution sem correspondencia com nenhum lead do CRM |
| **Instancia Valida** | Instancia Evolution que possui registro em `WhatsappInstancia` para a empresa do usuario |
| **Match** | Correspondencia entre telefone do chat (remoteJid) e telefone de um lead |
| **Enriquecimento** | Processo de adicionar dados do CRM (nome, estagio, PDV, responsavel) ao chat |

### 1.2 Perfis de Acesso

| Funcionalidade | EMPRESA | GERENTE | COLABORADOR |
|----------------|---------|---------|-------------|
| Ver chats da empresa | ✅ | ❌ | ❌ |
| Ver chats do proprio PDV | ✅ | ✅ | ❌ |
| Ver chats proprios | ✅ | ✅ | ✅ |
| Ver chats orphan (sem match) | ✅ | ✅ | ✅ |
| Registrar orphan como lead | ✅ (qualquer PDV/funcionario) | ✅ (apenas PDV proprio) | ✅ (apenas para si mesmo) |
| Criar negocio a partir de orphan | ✅ (qualquer PDV/funcionario) | ✅ (apenas PDV proprio) | ✅ (apenas para si mesmo) |

**Regra de ouro para orfãos**: Todos os perfis veem orfãos, mas o escopo de atribuicao ao registrar/criar negocio segue o perfil:
- **COLABORADOR**: lead/negocio criado automaticamente vinculado ao proprio usuario (sem escolha de responsavel)
- **GERENTE**: pode escolher qualquer colaborador do seu PDV como responsavel
- **EMPRESA**: pode escolher qualquer funcionario e qualquer PDV da empresa

### 1.3 Escopo de Instancias (Multi-Tenant)

**Problema critico**: A Evolution API e compartilhada entre tenants. `listarInstancias()` retorna TODAS as instancias do servidor, nao apenas as da empresa.

**Solucao**: Cruzamento obrigatorio com banco de dados:

```
Instancias Visiveis = {
  instancia Evolution E |
  E.status ∈ {open, connecting} AND
  existe WhatsappInstancia W no DB onde
    W.instance_name == E.instanceName AND
    W.id_empresa == sessao.id_empresa
}
```

### 1.4 Escopo de Leads (RBAC)

```typescript
// EMPRESA: todos os leads da empresa
where = { id_empresa: sessao.id_empresa }

// GERENTE: leads do PDV do gerente
where = {
  id_empresa: sessao.id_empresa,
  id_funcionario: { in: idsFuncionariosDoPdv }
}

// COLABORADOR: apenas leads proprios
where = {
  id_empresa: sessao.id_empresa,
  id_funcionario: sessao.id_usuario
}
```

### 1.5 Fluxo Simplificado

```
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Usuario      │───▶│ API valida      │───▶│ Motor de         │───▶│ Chats Unificados │
│ acessa /chat │    │ sessao + RBAC   │    │ Unificacao       │    │ + Orphan Actions │
└──────────────┘    └─────────────────┘    └──────────────────┘    └──────────────────┘
        │                                            │
        │         "Nos Bastidores"                   │
        ▼                                            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  • Filtrar instancias por empresa (DB + Evolution)                          │
│  • Buscar conversas de cada instancia (POST /chat/findChats)                │
│  • Criar mapa de leads por telefone normalizado                             │
│  • Para cada chat: extrair telefone do remoteJid, lookup no mapa de leads   │
│  • Se match → enriquecer com nome, estagio, PDV, responsavel                │
│  • Se sem match → marcar como orphan (acoes: registrar lead, criar negocio) │
│  • Ordenar por ultima mensagem (mais recente primeiro)                      │
│  • SSE: polling compartilhado, hash diff, push para todos subscribers       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Experiencia do Usuario

### 2.1 Layout Principal - WhatsApp Web Style

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Chat                                                        [⚙️]            │
├──────────────────────────┬───────────────────────────────────────────────────┤
│  SIDEBAR (340px)         │  PAINEL DIREITO                                   │
│                          │                                                   │
│  [🔍 Buscar chats...]    │  ┌─────────────────────────────────────────────┐  │
│                          │  │  HEADER DO CHAT SELECIONADO                 │  │
│  ──────────────────────  │  │                                             │  │
│  João Silva              │  │  João Silva                    [🟢 Online]  │  │
│  Oi, tudo bem?           │  │  📞 +55 11 99999-9999                       │  │
│  14:32  🟢               │  │  📋 Qualificação                            │  │
│                          │  │  👤 Maria Santos · Vendas SP                │  │
│  Maria Santos            │  │  📱 Instância: Vendas 1                     │  │
│  Preciso de info...      │  ├─────────────────────────────────────────────┤  │
│  13:15  🔵               │  │                                             │  │
│                          │  │  [Mensagens aparecerão aqui]               │  │
│  Pedro Costa             │  │  [Placeholder - visualização apenas]        │  │
│  Vamos agendar?          │  │                                             │  │
│  12:00  ⚪               │  │                                             │  │
│                          │  │                                             │  │
│  ──── ⚪ Sem match ────  │  │                                             │  │
│                          │  │                                             │  │
│  +55 21 8888-8888        │  │                                             │  │
│  "Quero saber sobre..."  │  ├─────────────────────────────────────────────┤  │
│  11:00  ⚪               │  │  [Input desabilitado 🔒 - Em breve]        │  │
│                          │  │  [📎]  [Digite uma mensagem...]      [📤]   │  │
│  +55 11 7777-7777        │  └─────────────────────────────────────────────┘  │
│  "Preço do seguro..."    │                                                   │
│  10:30  ⚪               │                                                   │
└──────────────────────────┴───────────────────────────────────────────────────┘

Legenda de status:
  🟢 emerald — Lead matched + instância online
  🔵 blue    — Lead matched + instância offline
  ⚪ zinc    — Sem match no CRM (orphan)
```

### 2.2 Painel Especial para Orphan

Quando um chat orphan e selecionado, o painel direito exibe:

```
┌─────────────────────────────────────────────────────────────┐
│  📞 +55 21 8888-8888                                        │
│  👤 Nome detectado: Carlos Oliveira (pushName)             │
│  📱 Instância: Suporte 2                                    │
│  🕐 Última mensagem: 11:00                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  💬 "Olá, gostaria de saber mais sobre seguros de vida"    │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ⚠️ Este contato não está cadastrado no CRM               │
│                                                             │
│  O que deseja fazer?                                        │
│                                                             │
│  [➕ Registrar como Lead]    [📋 Criar Negócio]             │
│                                                             │
│  • Registrar como Lead: abre drawer/form com telefone e     │
│    nome pré-preenchidos.                                    │
│    - COLABORADOR: responsavel = si mesmo (sem escolha)     │
│    - GERENTE: pode escolher colaborador do seu PDV         │
│    - EMPRESA: pode escolher qualquer funcionario/PDV       │
│                                                             │
│  • Criar Negócio: abre drawer de novo negócio com lead      │
│    criado automaticamente + vinculo ao estagio inicial      │
│    - Mesmo escopo de atribuicao acima                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Estados Visuais

| Estado | Visual |
|--------|--------|
| Carregando inicial | Skeleton na sidebar + painel vazio |
| Sem instancias conectadas | Empty state: "Nenhuma instancia WhatsApp conectada" |
| Sem chats | Empty state: "Nenhum chat encontrado nas instancias ativas" |
| Nenhum chat selecionado | Empty state: "Selecione um chat para visualizar" |
| SSE desconectado | Badge sutil "Reconectando..." no header |
| Orphan selecionado | Painel especial com acoes de conversao |

---

## 3. Arquitetura Tecnica

### 3.1 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js App Router)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────────┐   │
│  │ ModuloChat        │  │ ChatSidebar       │  │ ChatPanel             │   │
│  │ (page.tsx)        │  │ (lista de chats)  │  │ (mensagens/orphan)    │   │
│  │                   │  │                   │  │                       │   │
│  │ useChatModule()   │──│ useChatData()     │  │ ChatItem              │   │
│  │                   │  │  ├─ fetch inicial │  │ ChatEmptyState        │   │
│  │                   │  │  └─ SSE sub       │  │ ChatOrphanPanel       │   │
│  └───────────────────┘  └───────────────────┘  └───────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         API LAYER (Next.js Route Handlers)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌───────────────────────────────────────────┐    │
│  │ GET /api/chat/all   │  │ GET /api/chat/stream                      │    │
│  │                     │  │                                           │    │
│  │ • exigirSessao()    │  │ • exigirSessao()                          │    │
│  │ • unificarChats()   │  │ • criarRespostaSse()                      │    │
│  │ • retorna chats[]   │  │ • channel: chat:empresa:{id_empresa}      │    │
│  │                     │  │ • polling 10s → unificarChats()           │    │
│  │                     │  │ • hash diff → publicar snapshot           │    │
│  └─────────────────────┘  └───────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE DOMINIO (src/lib)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  chat-unificado.ts                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │  unificarChatsComLeads(sessao)                                  │  │  │
│  │  │                                                                 │  │  │
│  │  │  1. whereLeadsPorPerfil(sessao) → leads visiveis                │  │  │
│  │  │  2. prisma.lead.findMany({ where }) → dados dos leads           │  │  │
│  │  │  3. prisma.whatsappInstancia.findMany({ id_empresa })           │  │  │
│  │  │  4. listarInstancias() → todas as instancias Evolution          │  │  │
│  │  │  5. Intersection: instancias da empresa + conectadas            │  │  │
│  │  │  6. Para cada instancia: buscarConversas(instanceName)          │  │  │
│  │  │  7. Mapa leads por telefone normalizado                         │  │  │
│  │  │  8. Para cada conversa:                                         │  │  │
│  │  │     a. extrairTelefoneDeRemoteJid(remoteJid)                    │  │  │
│  │  │     b. lookup no mapa de leads                                  │  │  │
│  │  │     c. Se match → enriquecer                                    │  │  │
│  │  │     d. Se sem match → marcar orphan                             │  │  │
│  │  │  9. Ordenar por ultimaMensagem.timestamp DESC                   │  │  │
│  │  │  10. Retornar ChatUnificado[]                                   │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE DADOS (Prisma + Evolution API)            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌────────────────────┐  ┌────────────────────────────┐   │
│  │ Lead        │  │ WhatsappInstancia  │  │ Evolution API              │   │
│  │ (existente) │  │ (existente)        │  │                            │   │
│  │             │  │                    │  │ • fetchInstances           │   │
│  │ • telefone  │  │ • instance_name    │  │ • findChats/{instanceName} │   │
│  │ • nome      │  │ • id_empresa       │  │                            │   │
│  │ • id_estagio│  │ • status           │  │                            │   │
│  │ • id_pdv    │  │                    │  │                            │   │
│  │ • id_func   │  │                    │  │                            │   │
│  └─────────────┘  └────────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Dados SSE

```
Cliente A                         Servidor                       Evolution API
  │                                  │                                │
  ├── GET /api/chat/all ────────────▶│                                │
  │  (fetch inicial)                 ├── whereLeadsPorPerfil() ───────▶│ (Prisma DB)
  │                                  ├── listarInstancias() ──────────▶│
  │                                  ├── buscarConversas() x N ──────▶│
  │◀─ { chats: ChatUnificado[] } ────┤                                │
  │                                  │                                │
  ├── SSE /api/chat/stream ─────────▶│                                │
  │  (EventSource)                   ├── criarRespostaSse()           │
  │                                  │   channel = "chat:empresa:123" │
  │                                  │                                │
  │                                  │  ┌──────────────────────────┐  │
  │                                  │  │ Polling Loop (10s)       │  │
  │                                  │  │ 1. unificarChatsComLeads │  │
  │                                  │  │ 2. hash = JSON.stringify │  │
  │                                  │  │ 3. if hash != ultimoHash │  │
  │                                  │  │    → publicar snapshot   │  │
  │                                  │  └──────────────────────────┘  │
  │                                  │                                │
  │◀─ event: snapshot ───────────────┤                                │
  │  { chats: ChatUnificado[] }      │                                │
  │                                  │                                │
  │◀─ event: heartbeat ──────────────┤ (a cada 15s)                  │
  │                                  │                                │
  │                                  │                                │
Cliente B (mesma empresa)           │                                │
  │                                  │                                │
  ├── SSE /api/chat/stream ─────────▶│                                │
  │                                  ├── subscriber adicionado ao     │
  │                                  │    mesmo canal existente       │
  │                                  │    (sem polling duplicado!)    │
  │◀─ event: snapshot ───────────────┤ (compartilhado com Cliente A) │
```

### 3.3 Estrutura de Dados

```typescript
type ChatUnificado = {
  // Dados da Evolution API
  instanceName: string;
  remoteJid: string;
  telefone: string;               // Extraído e normalizado do remoteJid
  pushName: string | null;        // Nome detectado pelo WhatsApp
  isGroup: boolean;
  ultimaMensagem: {
    conteudo: string;
    fromMe: boolean;
    timestamp: number;            // Unix timestamp
  } | null;

  // Dados enriquecidos do CRM (se houver match)
  leadMatch: {
    id: string;
    nome: string;
    telefone: string;
    nome_funcionario: string | null;   // Responsável pelo lead
    nome_pdv: string | null;           // PDV do lead
    nome_estagio: string | null;       // Estágio no funil
  } | null;

  // Metadados
  semMatch: boolean;              // true se não encontrou lead correspondente
};
```

---

## 4. Especificacao Tecnica Detalhada

### 4.1 Arquivos a Criar

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── chat/
│   │       ├── page.tsx                    # Rota: sessao → <ModuloChat />
│   │       └── loading.tsx                 # Skeleton loading
│   └── api/
│       └── chat/
│           ├── all/
│           │   └── route.ts                # GET: chats unificados (initial fetch)
│           ├── stream/
│           │   └── route.ts                # GET: SSE stream (realtime)
│           └── orphan/
│               ├── registrar-lead/
│               │   └── route.ts            # POST: registra orphan como lead (RBAC)
│               └── criar-negocio/
│                   └── route.ts            # POST: cria lead+negocio a partir de orphan (RBAC)
│
├── lib/
│   └── chat-unificado.ts                   # Lógica pura de unificação + mapeamento
│
└── modules/
    └── chat/
        ├── page.tsx                        # ModuloChat (View principal)
        ├── hooks/
        │   ├── use-chat-module.ts          # Hook principal: estado, seleção, busca
        │   └── use-chat-data.ts            # Fetch inicial + SSE subscription
        ├── components/
        │   ├── chat-sidebar.tsx            # Sidebar com lista unificada + busca
        │   ├── chat-panel.tsx              # Painel direito de mensagens
        │   ├── chat-item.tsx               # Item individual na lista
        │   ├── chat-empty-state.tsx        # Empty state genérico
        │   └── chat-orphan-panel.tsx       # Painel especial para orphan com ações
        ├── types.ts                        # Tipagens do módulo
        └── index.ts                        # Barrel export
```

### 4.2 Modificacoes em Arquivos Existentes

| Arquivo | Modificacao |
|---------|-------------|
| `src/components/sidebar-principal.tsx` | Adicionar item "Chat" na navegacao (secao OPERACAO) |

### 4.3 Lib: `src/lib/chat-unificado.ts`

**Funcao principal: `unificarChatsComLeads(sessao: SessaoToken): Promise<ChatUnificado[]>`**

```typescript
async function unificarChatsComLeads(sessao: SessaoToken): Promise<ChatUnificado[]> {
  // 1. Obter leads visiveis por RBAC
  const where = await whereLeadsPorPerfil(sessao);
  const leads = await prisma.lead.findMany({
    where,
    select: {
      id: true,
      nome: true,
      telefone: true,
      id_funcionario: true,
      id_pdv: true,
      id_estagio: true,
    },
  });

  // 2. Enriquecer com dados relacionados (funcionarios, estagios, PDVs)
  const [funcionarios, estagios, pdvs] = await Promise.all([
    prisma.funcionario.findMany({
      where: { id: { in: leads.map(l => l.id_funcionario) } },
      select: { id: true, nome: true },
    }),
    prisma.estagioFunil.findMany({
      where: { id: { in: leads.map(l => l.id_estagio) } },
      select: { id: true, nome: true },
    }),
    prisma.pdv.findMany({
      where: { id: { in: leads.filter(l => l.id_pdv).map(l => l.id_pdv!) } },
      select: { id: true, nome: true },
    }),
  ]);

  // 3. Criar mapa de leads por telefone normalizado (O(1) lookup)
  const mapaLeads = new Map<string, LeadInfo>();
  for (const lead of leads) {
    const telNorm = normalizarTelefoneParaWhatsapp(lead.telefone);
    if (telNorm.waNumber) {
      mapaLeads.set(telNorm.waNumber, {
        id: lead.id,
        nome: lead.nome,
        telefone: lead.telefone,
        nome_funcionario: funcionarios.find(f => f.id === lead.id_funcionario)?.nome ?? null,
        nome_pdv: pdvs.find(p => p.id === lead.id_pdv)?.nome ?? null,
        nome_estagio: estagios.find(e => e.id === lead.id_estagio)?.nome ?? null,
      });
    }
  }

  // 4. Obter instancias da empresa no DB
  const instanciasEmpresa = await prisma.whatsappInstancia.findMany({
    where: { id_empresa: sessao.id_empresa },
    select: { instance_name: true },
  });
  const instanceNamesEmpresa = new Set(instanciasEmpresa.map(i => i.instance_name));

  // 5. Obter todas as instancias da Evolution e filtrar
  const todasInstancias = await listarInstancias();
  const instanciasValidas = todasInstancias.filter(inst =>
    instanceNamesEmpresa.has(inst.instanceName) &&
    ['open', 'connecting'].includes(inst.status?.toLowerCase())
  );

  // 6. Para cada instancia valida, buscar conversas
  const todasConversas: ChatUnificado[] = [];
  for (const inst of instanciasValidas) {
    try {
      const conversas = await buscarConversas(inst.instanceName);
      for (const conv of conversas) {
        // Pular grupos
        if (conv.isGroup) continue;

        const telefone = extrairTelefoneDeRemoteJid(conv.remoteJid);
        const leadMatch = mapaLeads.get(telefone) ?? null;

        todasConversas.push({
          instanceName: inst.instanceName,
          remoteJid: conv.remoteJid,
          telefone,
          pushName: conv.pushName,
          isGroup: false,
          ultimaMensagem: conv.lastMessage ? {
            conteudo: extrairConteudoMensagem(conv.lastMessage),
            fromMe: conv.lastMessage.key.fromMe,
            timestamp: extrairTimestamp(conv.lastMessage),
          } : null,
          leadMatch,
          semMatch: !leadMatch,
        });
      }
    } catch (error) {
      console.error(`Erro ao buscar conversas da instancia ${inst.instanceName}:`, error);
      // Continuar com outras instancias
    }
  }

  // 7. Ordenar por ultima mensagem (mais recente primeiro)
  return todasConversas.sort((a, b) => {
    const tsA = a.ultimaMensagem?.timestamp ?? 0;
    const tsB = b.ultimaMensagem?.timestamp ?? 0;
    return tsB - tsA;
  });
}
```

**Funcoes auxiliares:**

```typescript
function extrairTelefoneDeRemoteJid(remoteJid: string): string {
  // "5511999999999@s.whatsapp.net" → "5511999999999"
  return remoteJid.replace(/@.*/, '').replace(/\D/g, '');
}

function extrairConteudoMensagem(lastMessage: EvolutionConversa['lastMessage']): string {
  if (!lastMessage) return '';
  // Extrair conteudo baseado no tipo de mensagem
  // Por enquanto, placeholder - Evolution retorna estrutura limitada em findChats
  return lastMessage.pushName ? '📷 Mídia' : 'Mensagem';
}

function extrairTimestamp(lastMessage: EvolutionConversa['lastMessage']): number {
  if (!lastMessage) return 0;
  // Evolution findChats nao retorna timestamp diretamente
  // Usar 0 como fallback - ordenacao sera afetada minimamente
  return 0;
}
```

### 4.4 API Route: `GET /api/chat/all`

```typescript
// src/app/api/chat/all/route.ts

import { NextResponse } from 'next/server';
import { exigirSessao } from '@/lib/permissoes';
import { unificarChatsComLeads } from '@/lib/chat-unificado';

export async function GET(request: Request) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  try {
    const chats = await unificarChatsComLeads(auth.sessao);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Erro ao unificar chats:', error);
    return NextResponse.json(
      { erro: 'Erro ao carregar chats.' },
      { status: 500 }
    );
  }
}
```

### 4.4.1 API Route: `POST /api/chat/orphan/registrar-lead`

```typescript
// src/app/api/chat/orphan/registrar-lead/route.ts

import { NextResponse } from 'next/server';
import { exigirSessao, podeGerenciarEmpresa } from '@/lib/permissoes';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schemaRegistrarLead = z.object({
  telefone: z.string().min(10),
  nome: z.string().min(2).optional(),
  id_pdv: z.string().optional(),       // obrigatorio para GERENTE e EMPRESA
  id_funcionario: z.string().optional(), // COLABORADOR = si mesmo
});

export async function POST(request: Request) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const body = await request.json();
  const validacao = schemaRegistrarLead.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: 'Dados invalidos' }, { status: 400 });
  }

  const { telefone, nome, id_pdv, id_funcionario } = validacao.data;

  // RBAC: validar escopo de atribuicao
  let idFuncFinal: string;
  let idPdvFinal: string | undefined;

  if (auth.sessao.perfil === 'COLABORADOR') {
    // COLABORADOR: sempre para si mesmo, ignora params de PDV/funcionario
    idFuncFinal = auth.sessao.id_usuario;
    idPdvFinal = undefined; // herdado do funcionario
  } else if (auth.sessao.perfil === 'GERENTE') {
    // GERENTE: pode atribuir a qualquer um do seu PDV
    idPdvFinal = id_pdv ?? auth.sessao.id_pdv; // fallback ao PDV do gerente
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
    // Validar que funcionario pertence ao PDV do gerente
    const func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_pdv: idPdvFinal },
    });
    if (!func) {
      return NextResponse.json(
        { erro: 'Funcionario nao pertence ao seu PDV' },
        { status: 403 }
      );
    }
  } else {
    // EMPRESA: pode escolher qualquer PDV e funcionario
    idPdvFinal = id_pdv;
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
  }

  const lead = await prisma.lead.create({
    data: {
      nome: nome ?? telefone,
      telefone,
      id_empresa: auth.sessao.id_empresa,
      id_funcionario: idFuncFinal,
      id_pdv: idPdvFinal,
      id_estagio: null, // sera atribuido no kanban
    },
  });

  return NextResponse.json({ lead }, { status: 201 });
}
```

### 4.4.2 API Route: `POST /api/chat/orphan/criar-negocio`

```typescript
// src/app/api/chat/orphan/criar-negocio/route.ts

import { NextResponse } from 'next/server';
import { exigirSessao } from '@/lib/permissoes';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const schemaCriarNegocio = z.object({
  telefone: z.string().min(10),
  nome: z.string().min(2).optional(),
  id_pdv: z.string().optional(),
  id_funcionario: z.string().optional(),
  id_estagio: z.string().optional(), // estagio inicial do funil
});

export async function POST(request: Request) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const body = await request.json();
  const validacao = schemaCriarNegocio.safeParse(body);
  if (!validacao.success) {
    return NextResponse.json({ erro: 'Dados invalidos' }, { status: 400 });
  }

  const { telefone, nome, id_pdv, id_funcionario, id_estagio } = validacao.data;

  // Mesma logica RBAC de registrar-lead
  let idFuncFinal: string;
  let idPdvFinal: string | undefined;

  if (auth.sessao.perfil === 'COLABORADOR') {
    idFuncFinal = auth.sessao.id_usuario;
    idPdvFinal = undefined;
  } else if (auth.sessao.perfil === 'GERENTE') {
    idPdvFinal = id_pdv ?? auth.sessao.id_pdv;
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
    const func = await prisma.funcionario.findFirst({
      where: { id: idFuncFinal, id_pdv: idPdvFinal },
    });
    if (!func) {
      return NextResponse.json(
        { erro: 'Funcionario nao pertence ao seu PDV' },
        { status: 403 }
      );
    }
  } else {
    idPdvFinal = id_pdv;
    idFuncFinal = id_funcionario ?? auth.sessao.id_usuario;
  }

  // Transaction: criar lead + negocio
  const resultado = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        nome: nome ?? telefone,
        telefone,
        id_empresa: auth.sessao.id_empresa,
        id_funcionario: idFuncFinal,
        id_pdv: idPdvFinal,
        id_estagio: id_estagio ?? null,
      },
    });

    const negocio = await tx.negocio.create({
      data: {
        id_lead: lead.id,
        id_estagio: id_estagio ?? null,
        id_funcionario: idFuncFinal,
        id_pdv: idPdvFinal ?? lead.id_pdv,
        valor_estimado: 0,
      },
    });

    return { lead, negocio };
  });

  return NextResponse.json(resultado, { status: 201 });
}
```

### 4.5 API Route: `GET /api/chat/stream` (SSE)

```typescript
// src/app/api/chat/stream/route.ts

import { exigirSessao } from '@/lib/permissoes';
import { criarRespostaSse } from '@/lib/whatsapp-chat-realtime';
import { unificarChatsComLeads } from '@/lib/chat-unificado';
import type { StreamChannelParams } from '@/lib/whatsapp-chat-realtime.state';

export async function GET(request: Request) {
  const auth = await exigirSessao(request);
  if (auth.erro) return auth.erro;

  const chave = `chat:empresa:${auth.sessao.id_empresa}`;

  const params: StreamChannelParams = {
    tipo: 'conversations',
    chave,
    pollMs: 10000, // 10 segundos
    carregarSnapshot: async () => {
      const chats = await unificarChatsComLeads(auth.sessao);
      return { conversas: chats as any, cursor: null, temMais: false };
    },
  };

  return criarRespostaSse(params, request);
}
```

**Nota**: O tipo `StreamChannelParams` existente espera `ConversasResponse` como snapshot. Precisaremos adaptar ou criar um tipo especifico para chats unificados. Alternativa: estender o payload do evento SSE para incluir `chats` diretamente.

### 4.6 Hook: `use-chat-data.ts`

```typescript
// src/modules/chat/hooks/use-chat-data.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { criarAssinaturaSse } from '@/lib/api/whatsapp.shared';
import type { ChatUnificado } from '../types';

export function useChatData() {
  const [chats, setChats] = useState<ChatUnificado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [sseConectado, setSseConectado] = useState(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch inicial
  const fetchInicial = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await fetch('/api/chat/all');
      if (!res.ok) throw new Error('Erro ao carregar chats');
      const data = await res.json();
      setChats(data.chats);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setCarregando(false);
    }
  }, []);

  // SSE Subscription
  useEffect(() => {
    fetchInicial();

    const unsubscribe = criarAssinaturaSse<{ chats: ChatUnificado[] }>(
      '/api/chat/stream',
      {
        onSnapshot: (snapshot) => {
          setChats(snapshot.chats);
          setSseConectado(true);
          setErro(null);
        },
        onError: () => {
          setSseConectado(false);
        },
      }
    );

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [fetchInicial]);

  return {
    chats,
    carregando,
    erro,
    sseConectado,
    recarregar: fetchInicial,
  };
}
```

### 4.7 Hook Principal: `use-chat-module.ts`

```typescript
// src/modules/chat/hooks/use-chat-module.ts

import { useState, useMemo } from 'react';
import { useChatData } from './use-chat-data';
import type { ChatUnificado, UseChatModuleReturn } from '../types';

export function useChatModule(): UseChatModuleReturn {
  const { chats, carregando, erro, sseConectado, recarregar } = useChatData();
  const [chatSelecionado, setChatSelecionado] = useState<ChatUnificado | null>(null);
  const [busca, setBusca] = useState('');

  // Filtragem por busca
  const chatsFiltrados = useMemo(() => {
    if (!busca.trim()) return chats;
    const termo = busca.toLowerCase();
    return chats.filter(chat => {
      const nome = chat.leadMatch?.nome ?? chat.pushName ?? '';
      const conteudo = chat.ultimaMensagem?.conteudo ?? '';
      return (
        nome.toLowerCase().includes(termo) ||
        chat.telefone.includes(termo) ||
        conteudo.toLowerCase().includes(termo)
      );
    });
  }, [chats, busca]);

  // Contadores
  const totalChats = chats.length;
  const totalOrphans = chats.filter(c => c.semMatch).length;
  const totalMatched = chats.filter(c => !c.semMatch).length;

  // Acoes para orphan (com RBAC)
  const onRegistrarComoLead = async (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
  }) => {
    const res = await fetch('/api/chat/orphan/registrar-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.erro ?? 'Erro ao registrar lead');
      return;
    }
    const data = await res.json();
    toast.success('Lead registrado com sucesso');
    // O snapshot SSE atualizara automaticamente o chat de orphan para matched
  };

  const onCriarNegocio = async (params: {
    telefone: string;
    nome?: string;
    id_pdv?: string;
    id_funcionario?: string;
    id_estagio?: string;
  }) => {
    const res = await fetch('/api/chat/orphan/criar-negocio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.erro ?? 'Erro ao criar negocio');
      return;
    }
    toast.success('Negocio criado com sucesso');
    // O snapshot SSE atualizara automaticamente
  };

  return {
    chats: chatsFiltrados,
    chatSelecionado,
    setChatSelecionado,
    busca,
    setBusca,
    carregando,
    erro,
    sseConectado,
    recarregar,
    totalChats,
    totalOrphans,
    totalMatched,
    onRegistrarComoLead,
    onCriarNegocio,
  };
}
```

### 4.8 Tipos: `types.ts`

```typescript
// src/modules/chat/types.ts

export type ChatUnificado = {
  instanceName: string;
  remoteJid: string;
  telefone: string;
  pushName: string | null;
  isGroup: boolean;
  ultimaMensagem: {
    conteudo: string;
    fromMe: boolean;
    timestamp: number;
  } | null;
  leadMatch: {
    id: string;
    nome: string;
    telefone: string;
    nome_funcionario: string | null;
    nome_pdv: string | null;
    nome_estagio: string | null;
  } | null;
  semMatch: boolean;
};

export type OrphanRegistrarLeadParams = {
  telefone: string;
  nome?: string;
  id_pdv?: string;
  id_funcionario?: string;
};

export type OrphanCriarNegocioParams = {
  telefone: string;
  nome?: string;
  id_pdv?: string;
  id_funcionario?: string;
  id_estagio?: string;
};

export type UseChatModuleReturn = {
  chats: ChatUnificado[];
  chatSelecionado: ChatUnificado | null;
  setChatSelecionado: (chat: ChatUnificado | null) => void;
  busca: string;
  setBusca: (termo: string) => void;
  carregando: boolean;
  erro: string | null;
  sseConectado: boolean;
  recarregar: () => Promise<void>;
  totalChats: number;
  totalOrphans: number;
  totalMatched: number;
  perfil: 'EMPRESA' | 'GERENTE' | 'COLABORADOR';
  idUsuario: string;
  onRegistrarComoLead: (params: OrphanRegistrarLeadParams) => Promise<void>;
  onCriarNegocio: (params: OrphanCriarNegocioParams) => Promise<void>;
};

export type Props = {
  perfil: 'EMPRESA' | 'GERENTE' | 'COLABORADOR';
  idUsuario: string;
};
```

---

## 5. Sequencia de Implementacao

### Fase 1: Fundacao (Tipagens + Lib)
1. Criar `src/modules/chat/types.ts`
2. Criar `src/lib/chat-unificado.ts` com logica de unificacao
3. Validar com `npx tsc --noEmit`

### Fase 2: API Routes
4. Criar `src/app/api/chat/all/route.ts` (GET)
5. Criar `src/app/api/chat/stream/route.ts` (SSE)
6. Criar `src/app/api/chat/orphan/registrar-lead/route.ts` (POST, RBAC)
7. Criar `src/app/api/chat/orphan/criar-negocio/route.ts` (POST, RBAC)
8. Testar manualmente com curl/fetch

### Fase 3: Hooks
9. Criar `src/modules/chat/hooks/use-chat-data.ts`
10. Criar `src/modules/chat/hooks/use-chat-module.ts`

### Fase 4: Componentes Visuais
11. Criar `src/modules/chat/components/chat-item.tsx`
12. Criar `src/modules/chat/components/chat-sidebar.tsx`
13. Criar `src/modules/chat/components/chat-panel.tsx`
14. Criar `src/modules/chat/components/chat-empty-state.tsx`
15. Criar `src/modules/chat/components/chat-orphan-panel.tsx` (com seletores de PDV/funcionario baseados em perfil)
16. Criar `src/modules/chat/components/chat-orphan-dialog.tsx` (drawer/modal para registrar lead/criar negocio com campos RBAC-aware)

### Fase 5: Modulo e Rota
14. Criar `src/modules/chat/page.tsx` (ModuloChat)
15. Criar `src/modules/chat/index.ts` (barrel)
16. Criar `src/app/(dashboard)/chat/page.tsx` (rota)
17. Criar `src/app/(dashboard)/chat/loading.tsx`

### Fase 6: Navegacao
18. Adicionar item "Chat" em `src/components/sidebar-principal.tsx`

### Fase 7: Validacao Final
19. `npx tsc --noEmit`
20. `npm run lint`
21. Teste manual completo

---

## 6. Casos de Borda

| Cenario | Problema | Solucao |
|---------|----------|---------|
| Nenhuma instancia conectada | Lista vazia | Empty state com link para /whatsapp |
| Instancia com erro na Evolution | Falha em buscarConversas | Log de erro, continuar com outras instancias |
| Telefone com formato invalido | Nao consegue extrair do remoteJid | Usar string crua como fallback, marcar como potencial orphan |
| Lead com telefone duplicado | Multiplos leads com mesmo numero | Match com lead mais recente (maior atualizado_em) |
| SSE desconecta | Perda de conexao | EventSource tenta reconectar automaticamente; fallback para polling manual se necessario |
| Usuario sem permissao | COLABORADOR tenta acessar | RBAC filtra leads automaticamente; sem chats = lista vazia |
| Chat orphan ja registrado | Lead foi criado enquanto chat estava aberto | Proximo snapshot SSE atualiza automaticamente (match aparece) |
| Múltiplas instancias, mesmo contato | Contato aparece em 2+ instancias | Exibir ambas entradas; futuro: merge por telefone |

---

## 7. Consideracoes de Performance

| Aspecto | Estrategia |
|---------|------------|
| **Polling unico** | SSE channel compartilhado por empresa - 1 polling server-side para N clientes |
| **Hash diff** | Snapshot so e publicado se dados mudaram |
| **Mapa O(1)** | Lookup de leads por telefone usa Map, nao array.find |
| **Parallel queries** | `Promise.all` para funcionarios, estagios, PDVs |
| **Graceful degradation** | Erro em uma instancia nao bloqueia as demais |
| **Cliente-side filter** | Busca filtra array em memoria, sem roundtrip ao server |

---

## 8. Criterios de Aceite

- [ ] Modulo `/chat` acessivel via sidebar (todos os perfis)
- [ ] Chats de todas as instancias conectadas da empresa sao exibidos
- [ ] Chats sao mapeados com leads do CRM por telefone
- [ ] RBAC e respeitado (COLABORADOR ve apenas seus leads, mas ve orfãos)
- [ ] **Todos os perfis veem chats orphan (sem match)**
- [ ] **COLABORADOR pode registrar orphan como lead para si mesmo**
- [ ] **GERENTE pode registrar orphan para qualquer colaborador do seu PDV**
- [ ] **EMPRESA pode registrar orphan para qualquer funcionario/PDV da empresa**
- [ ] **Mesmo escopo RBAC para criar negocio a partir de orphan**
- [ ] Chats ordenados por ultima mensagem (mais recente primeiro)
- [ ] SSE atualiza chats em tempo real sem polling redundante
- [ ] Busca na sidebar filtra por nome, telefone e conteudo
- [ ] Estados vazios tratados (sem instancias, sem chats, sem selecao)
- [ ] Design segue tokens dark premium do sistema
- [ ] TypeScript sem erros (`tsc --noEmit`)
- [ ] Lint passa sem erros

---

## 9. Historico de Versoes

| Versao | Data | Descricao |
|--------|------|-----------|
| 1.0.0 | 2026-04-01 | Versao inicial do documento |

---

*Documento gerado para o projeto HYPE CRM*