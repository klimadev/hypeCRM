# Guia Completo — App Review Meta / Instagram para HYPE CRM

> **App ID:** 1471383481007483
> **App Name:** HypeCRM-IG
> **Redirect URI:** `https://app.hypecrm.com.br/api/integracoes/instagram/oauth/callback`
> **API Version:** v25.0
> **Modo atual:** Development (precisa ir para Live após aprovação)
> **Scopes solicitados:** `instagram_business_basic`, `instagram_business_manage_messages`

---

## Índice

1. [instagram_business_basic](#1-instagram_business_basic)
2. [instagram_business_manage_messages](#2-instagram_business_manage_messages)
3. [Human Agent](#3-human-agent)
4. [Configuração de Usuários de Teste](#4-configuração-de-usuários-de-teste)
5. [Roteiro Geral do Screencast](#5-roteiro-geral-do-screencast)
6. [Checklist Pré-Envio](#6-checklist-pré-envio)

---

## 1. instagram_business_basic

### Análise da Política

Esta permissão permite acesso a informações básicas de contas profissionais do Instagram:
- Perfil da conta (username, nome, foto)
- Tipo de conta (BUSINESS, CREATOR)
- ID da conta
- É a permissão fundamental — todas as outras dependem dela

**Restrições:**
- Apenas contas Instagram Business ou Creator
- O usuário deve autenticar via OAuth
- Dados só podem ser usados para funcionalidades dentro do app

### Como o HYPE CRM usa

**Descrição para submeter:**

> O HYPE CRM é um sistema de gestão de relacionamento com clientes (CRM) voltado para empresas que vendem seguros e produtos financeiros. A permissão `instagram_business_basic` é utilizada para:
>
> 1. **Identificação da conta Instagram:** Quando um usuário conecta sua conta Instagram Business ao HYPE CRM, utilizamos esta permissão para obter o ID da conta, username, nome de exibição e foto de perfil via `GET /v24.0/me?fields=id,username,name,account_type,profile_picture_url`.
>
> 2. **Vinculação ao tenant:** Os dados básicos são armazenados no banco de dados do CRM (modelo `InstagramConta`) vinculados à empresa do usuário, permitindo que a equipe gerencie conversas daquela conta específica.
>
> 3. **Listagem de contas conectadas:** Na página de integrações do Instagram (`/integracoes/instagram`), exibimos as contas conectadas com suas informações básicas para que o usuário possa gerenciar múltiplas contas.
>
> Os dados são usados exclusivamente para funcionalidades internas do CRM e não são compartilhados com terceiros. O usuário pode desconectar sua conta a qualquer momento através da interface.

**Endpoints utilizados:**
- `GET https://graph.instagram.com/v24.0/me?fields=id,username,name,account_type,profile_picture_url`

**Arquivos de implementação:**
- `src/lib/integracoes/instagram-oauth.ts` — função `obterPerfilInstagram()`
- `src/app/api/integracoes/instagram/oauth/callback/route.ts` — callback handler

### Roteiro do Screencast — instagram_business_basic

| Passo | Ação | Duração |
|-------|------|---------|
| 1 | Abra o navegador e acesse `https://app.hypecrm.com.br` | 3s |
| 2 | Faça login com credenciais de teste | 5s |
| 3 | Navegue até "Integrações" → "Instagram" no menu lateral | 5s |
| 4 | Mostre a tela de integrações com o botão "Conectar Instagram" | 3s |
| 5 | Clique em "Conectar Instagram" | 2s |
| 6 | Mostre a tela de autorização do Instagram (onde o usuário concede permissão) | 5s |
| 7 | Após autorização, mostre a tela de sucesso e a conta conectada aparecendo na lista com username, nome e foto de perfil | 5s |
| 8 | Demonstre que os dados básicos (username, nome, foto) foram corretamente exibidos no CRM | 5s |
| 9 | Mostre o botão de desconectar a conta | 3s |
| **Total** | | **~36s** |

---

## 2. instagram_business_manage_messages

### Análise da Política

Permite gerenciar mensagens Diretas (DMs) de contas Instagram Business:
- Ler mensagens recebidas
- Enviar mensagens em resposta
- Acessar conversas e threads
- **Janela de 24h:** Só pode enviar mensagens dentro de 24h após a última mensagem do usuário (ou 7 dias com tag `human_agent`)

**Restrições:**
- Apenas contas Business (não pessoais)
- Não pode enviar mensagens promocionais não solicitadas
- Deve respeitar a janela de 24h
- Deve implementar webhook de mensagens ou polling para receber mensagens

### Como o HYPE CRM usa

**Descrição para submeter:**

> O HYPE CRM utiliza a permissão `instagram_business_manage_messages` para criar uma **caixa de entrada unificada** (Unified Inbox) que centraliza todas as conversas do Instagram Business junto com outros canais de comunicação do CRM.
>
> **Funcionalidades implementadas:**
>
> 1. **Listagem de conversas:** Via `GET /{ig_user_id}/conversations`, o CRM busca todas as conversas ativas e as exibe em um painel de inbox com informações do contato (nome, username, última mensagem, timestamp).
>
> 2. **Leitura de mensagens:** Via `GET /{conversation_id}/messages`, o CRM busca o histórico de mensagens de cada conversa. As mensagens são persistidas localmente no banco de dados (modelo `InstagramMensagem`) para fallback offline e auditoria.
>
> 3. **Envio de respostas:** Via `POST /me/messages`, os usuários do CRM podem responder diretamente às mensagens dos contatos. O sistema respeita a janela de 24h da Meta e classifica erros como `janela_expirada` quando aplicável. Ao enviar respostas, o CRM utiliza o tag `human_agent` para estender a janela de 24h para 7 dias, pois todas as mensagens são enviadas por agentes humanos da equipe.
>
> 4. **Polling em tempo real:** O inbox utiliza polling a cada 10 segundos para verificar novas mensagens, garantindo que a equipe responda rapidamente aos leads e clientes.
>
> 5. **Chat unificado:** As mensagens do Instagram são integradas ao sistema de chat unificado do CRM (`/api/chat/messages`), permitindo que qualquer membro da equipe gerencie conversas do Instagram junto com WhatsApp e outros canais.
>
> **Casos de uso legítimos:**
> - Equipes de vendas respondem a leads que entraram em contato via Instagram
> - Suporte ao cliente resolve dúvidas e problemas recebidos por DM
> - Acompanhamento de conversas para garantir SLA de resposta
>
> **Conformidade:**
> - Não enviamos mensagens promocionais não solicitadas
> - Respeitamos a janela de 24h da Meta (estendida para 7 dias com human_agent para conversas humanas)
> - O usuário pode desconectar a conta a qualquer momento
> - Mensagens são armazenadas localmente apenas para fins de CRM e auditoria

**Endpoints utilizados:**
- `GET /{ig_user_id}/conversations` — listar conversas
- `GET /{conversation_id}/messages` — listar mensagens de uma conversa
- `POST /me/messages` — enviar mensagem

**Arquivos de implementação:**
- `src/lib/integracoes/instagram-inbox.ts` — `listarConversas()`, `listarMensagens()`, `enviarMensagem()`
- `src/lib/integracoes/instagram-persistence.ts` — persistência local
- `src/lib/integracoes/instagram-normalization.ts` — normalização de formatos
- `src/app/api/integracoes/instagram/inbox/route.ts` — API de inbox
- `src/app/api/integracoes/instagram/inbox/messages/route.ts` — API de envio
- `src/app/api/chat/messages/route.ts` — chat unificado
- `src/modules/instagram/hooks/use-instagram-inbox.ts` — hook de polling
- `src/modules/instagram/components/instagram-inbox-panel.tsx` — UI do inbox

### Roteiro do Screencast — instagram_business_manage_messages

| Passo | Ação | Duração |
|-------|------|---------|
| 1 | Acesse `https://app.hypecrm.com.br` e faça login | 5s |
| 2 | Navegue até "Integrações" → "Instagram" | 5s |
| 3 | Verifique que a conta Instagram está conectada e ativa | 3s |
| 4 | Clique no botão "Abrir Inbox" ou navegue até o painel de inbox | 5s |
| 5 | Mostre a lista de conversas com nome do contato, última mensagem e timestamp | 8s |
| 6 | Clique em uma conversa para abrir o histórico de mensagens | 3s |
| 7 | Role o histórico para mostrar mensagens recebidas e enviadas | 5s |
| 8 | Digite uma mensagem de resposta no campo de texto | 5s |
| 9 | Clique em "Enviar" e mostre a mensagem aparecendo no histórico | 8s |
| 10 | (Opcional) Mostre uma notificação de nova mensagem chegando via polling | 10s |
| 11 | Demonstre que o sistema indica quando a janela de 24h expirou (se aplicável) | 5s |
| **Total** | | **~62s** |

---

## 3. Human Agent

### Análise da Política

O tag `human_agent` estende a janela de mensagens de 24h para **7 dias**. Isso permite que agentes humanos continuem conversas com usuários além da janela padrão de 24h.

**Restrições:**
- Deve ser usado APENAS quando um agente humano está gerenciando a conversa
- Não pode ser usado para mensagens automatizadas/bots
- A Meta pode auditar o uso deste tag
- Deve haver um humano real respondendo

### Como o HYPE CRM usa

**Descrição para submeter:**

> O HYPE CRM utiliza a tag `human_agent` para **estender a janela de mensagens de 24h para 7 dias** em conversas que são gerenciadas por agentes humanos da equipe do CRM.
>
> **Contexto de uso:**
>
> O HYPE CRM é um sistema de CRM onde equipes de vendas e suporte gerenciam conversas com leads e clientes através de múltiplos canais, incluindo Instagram Direct Messages. Quando um membro da equipe responde manualmente a uma mensagem do Instagram, o sistema aplica o tag `human_agent` para estender a janela de resposta de 24h para 7 dias, permitindo que o agente humano continue a conversa sem interrupções.
>
> **Fluxo de uso:**
>
> 1. Um lead envia uma mensagem para a conta Instagram Business do CRM
> 2. A mensagem aparece no Inbox Unificado do CRM
> 3. Um agente humano da equipe lê e responde manualmente
> 4. Ao enviar a resposta, o CRM inclui automaticamente o tag `human_agent` no payload da API Graph
> 5. Isso estende a janela de 24h para 7 dias, permitindo follow-up humano contínuo
>
> **Garantias de conformidade:**
> - O tag é aplicado APENAS quando um agente humano envia a mensagem (não para mensagens automatizadas)
> - Todas as mensagens com `human_agent` são iniciadas por ação manual do usuário no CRM
> - O sistema de automações do CRM não utiliza o tag `human_agent`
> - A equipe é treinada para usar o recurso apenas para conversas legítimas com leads e clientes
>
> **Implementação técnica:**
> Ao enviar uma mensagem via `POST /me/messages`, incluímos o tag `human_agent` no campo `tags`:
>
> ```json
> {
>   "recipient": { "id": "{psid}" },
>   "message": { "text": "Resposta do agente humano" },
>   "tags": ["human_agent"]
> }
> ```

**Arquivo de implementação:**
- `src/lib/integracoes/instagram-inbox.ts` — função `enviarMensagem()` (linha ~521, campo `tags: ["human_agent"]`)

### Roteiro do Screencast — Human Agent

| Passo | Ação | Duração |
|-------|------|---------|
| 1 | Acesse `https://app.hypecrm.com.br` e faça login | 5s |
| 2 | Navegue até o Inbox Unificado do Instagram | 5s |
| 3 | Abra uma conversa com um lead/contato | 3s |
| 4 | Mostre que a última mensagem do contato foi há mais de 24h (explique que sem human_agent não seria possível responder) | 5s |
| 5 | Digite e envie uma resposta como agente humano | 8s |
| 6 | Mostre a confirmação de envio bem-sucedido | 3s |
| 7 | Explique que o tag `human_agent` estende a janela para 7 dias | 5s |
| 8 | Mostre no código-fonte (`src/lib/integracoes/instagram-inbox.ts`) que o tag `human_agent` está sendo enviado no payload | 5s |
| **Total** | | **~39s** |

---

## 4. Configuração de Usuários de Teste

A Meta exige que revisores possam testar seu app. Configure:

### Passo a Passo

1. **Acesse** [Meta for Developers](https://developers.facebook.com/) → Seu App → **App Review** → **Roles**

2. **Adicione Test Users:**
   - Vá para **Roles** → **Test Users**
   - Clique em **Add** → crie pelo menos **2 test users**
   - Um deve ter uma **conta Instagram Business** vinculada

3. **Configure Instagram Test Account:**
   - O test user precisa ter uma conta Instagram Business real ou de teste
   - Vincule a conta Instagram Business à Página Facebook do app
   - Garanta que o test user tenha concedido todas as permissões solicitadas

4. **Instruções para o Revisor da Meta:**

> **Instruções de Teste para o Revisor:**
>
> 1. Acesse `https://app.hypecrm.com.br`
> 2. Faça login com as credenciais de teste fornecidas:
>    - **Email:** [seu-email-de-teste]
>    - **Senha:** [sua-senha-de-teste]
> 3. Navegue até "Integrações" → "Instagram" no menu lateral
> 4. A conta Instagram de teste já estará conectada
> 5. Siga os roteiros de screencast acima para cada permissão

5. **Credenciais de Teste para fornecer:**

```
URL: https://app.hypecrm.com.br
Email: testador@hypecrm.com.br (crie esta conta no sistema)
Senha: [defina uma senha forte e compartilhe separadamente]
```

### Checklist de Preparação do Ambiente de Teste

- [ ] Criar conta de teste no HYPE CRM
- [ ] Conectar uma conta Instagram Business de teste
- [ ] Garantir que a conta Instagram tem mensagens recebidas (peça para alguém enviar DMs)
- [ ] Verificar que o token OAuth está válido (não expirado)
- [ ] Testar todo o fluxo você mesmo antes de submeter

---

## 5. Roteiro Geral do Screencast

Este é o roteiro para um **screencast único e completo** que demonstra todas as permissões em sequência. Você pode gravar um vídeo de ~2 minutos cobrindo tudo.

### Estrutura do Vídeo

```
┌─────────────────────────────────────────────────────────┐
│  SCREENCEST — HYPE CRM + Instagram App Review           │
│  Duração estimada: ~2 minutos                           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  0:00 - 0:15  │ Intro: Login e navegação               │
│  0:15 - 0:45  │ instagram_business_basic                │
│  0:45 - 1:40  │ instagram_business_manage_messages      │
│  1:40 - 2:00  │ Human Agent                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Roteiro Detalhado com Narração

#### 0:00 — Intro (15s)
> "Este vídeo demonstra a integração do HYPE CRM com o Instagram Business. O HYPE CRM é um sistema de gestão de relacionamento com clientes para empresas de seguros e produtos financeiros."

**Ação:** Mostre a tela de login, faça login, mostre o dashboard.

#### 0:15 — instagram_business_basic (30s)
> "A permissão básica do Instagram é usada para conectar e identificar a conta Business do usuário no CRM."

**Ação:**
1. Navegue até Integrações → Instagram
2. Mostre a conta conectada com username, nome e foto
3. Explique que esses dados vêm da API Graph do Instagram

#### 0:45 — instagram_business_manage_messages (55s)
> "A permissão de gerenciamento de mensagens permite que nossa equipe gerencie conversas do Instagram diretamente do CRM, em um inbox unificado."

**Ação:**
1. Abra o Inbox do Instagram
2. Mostre a lista de conversas
3. Abra uma conversa e mostre o histórico
4. Envie uma mensagem de teste
5. Mostre a mensagem sendo entregue

#### 1:40 — Human Agent (20s)
> "O tag human_agent é utilizado automaticamente ao enviar mensagens, estendendo a janela de 24h para 7 dias quando um agente humano está gerenciando a conversa."

**Ação:**
1. Mostre uma conversa sendo gerenciada por um agente
2. Explique brevemente o tag human_agent
3. Encerre o vídeo

---

## 6. Checklist Pré-Envio

### Código
- [x] Tag `human_agent` adicionada no envio de mensagens (`src/lib/integracoes/instagram-inbox.ts`)
- [x] Scopes OAuth atualizados (apenas `basic` + `manage_messages`)
- [ ] Rodar `pnpm lint && pnpm typecheck && pnpm build`

### Meta App Config
- [ ] App em modo "Development"
- [ ] Scopes `instagram_business_basic` e `instagram_business_manage_messages` adicionados ao app
- [ ] Redirect URI configurado corretamente
- [ ] Política de privacidade URL configurada
- [ ] Termos de uso URL configurado

### Test Users
- [ ] Criar pelo menos 2 test users no Meta Developer Console
- [ ] Vincular conta Instagram Business a um test user
- [ ] Criar conta de teste no HYPE CRM
- [ ] Conectar Instagram Business de teste no CRM
- [ ] Enviar DMs para a conta de teste (para testar inbox)
- [ ] Testar envio de mensagem do CRM para o Instagram

### Screencasts
- [ ] Gravar screencast do instagram_business_basic
- [ ] Gravar screencast do instagram_business_manage_messages
- [ ] Gravar screencast do Human Agent
- [ ] (Opcional) Gravar screencast único completo (~2 min)

### Documentação para Submissão
- [ ] Preparar descrição de uso para cada permissão (copiar deste documento)
- [ ] Preparar instruções de teste para o revisor
- [ ] Preparar credenciais de teste
- [ ] Verificar conformidade com políticas de cada permissão

### API Test Calls (exigido para manage_messages)
- [ ] `GET /v24.0/me` — testar com token válido
- [ ] `GET /{ig_user_id}/conversations` — testar listagem de conversas
- [ ] `POST /me/messages` — testar envio de mensagem com tag `human_agent`

---

## Apêndice A: Endpoints Graph API Utilizados

| Permissão | Método | Endpoint |
|-----------|--------|----------|
| basic | GET | `/v24.0/me?fields=id,username,name,account_type,profile_picture_url` |
| manage_messages | GET | `/{ig_user_id}/conversations` |
| manage_messages | GET | `/{conversation_id}/messages` |
| manage_messages | POST | `/me/messages` (com `tags: ["human_agent"]`) |

## Apêndice B: Scopes OAuth

```
instagram_business_basic
instagram_business_manage_messages
```

## Apêndice C: Estrutura de Arquivos do Instagram no Projeto

```
src/
├── lib/integracoes/
│   ├── instagram-client.ts          # Cliente Graph API
│   ├── instagram-oauth.ts           # Fluxo OAuth (scopes atualizados)
│   ├── instagram-inbox.ts           # Lógica do inbox (human_agent adicionado)
│   ├── instagram-persistence.ts     # Persistência DB
│   ├── instagram-normalization.ts   # Normalização de dados
│   ├── instagram-callbacks.ts       # Callbacks OAuth
│   └── validacoes.instagram.ts      # Schemas Zod
├── app/api/integracoes/instagram/
│   ├── oauth/start/route.ts         # Início OAuth
│   ├── oauth/callback/route.ts      # Callback OAuth
│   ├── accounts/route.ts            # Listar contas
│   ├── accounts/[id]/route.ts       # Deletar conta
│   ├── inbox/route.ts               # Inbox snapshot
│   ├── inbox/messages/route.ts      # Enviar mensagem
│   └── webhook/                     # Webhooks
├── modules/instagram/
│   ├── page.tsx                     # Página principal
│   ├── types.ts                     # Tipos TypeScript
│   ├── hooks/
│   │   ├── use-instagram-module.ts  # Hook de módulo
│   │   └── use-instagram-inbox.ts   # Hook de inbox
│   └── components/
│       └── instagram-inbox-panel.tsx # UI do inbox
```

---

*Documento gerado em Abril 2026 para HYPE CRM — App ID: 1471383481007483*
