# Instagram Messaging — Diagnóstico Completo de Envio

## Resumo Executivo

O envio de mensagens via Instagram Graph API falha com **HTTP 403** e erro `error_subcode: 2534022` ("fora do período permitido"). Após investigação, identificamos **dois problemas distintos**:

1. **Restrição de plataforma (24h window)** — o usuário alvo não enviou mensagem nas últimas 24h
2. **App em Development Mode** — sem App Review aprovado, o app só funciona com até 25 usuários de teste

---

## 1. Resposta Bruta do Instagram API

### Envio de mensagem (`POST /me/messages`)

```
HTTP 403 Forbidden
```

```json
{
  "error": {
    "message": "Essa mensagem foi enviada fora do período permitido.",
    "type": "IGApiException",
    "code": 10,
    "error_subcode": 2534022,
    "fbtrace_id": "AH8pjdbGEQUjnztFwv_WH7_"
  }
}
```

**Headers relevantes:**
- `www-authenticate`: `OAuth "Facebook Platform" "invalid_request" "Essa mensagem foi enviada fora do período permitido."`
- `instagram-api-version`: `v25.0`
- `x-app-usage`: `{"call_volume":0,"cpu_time":0}`

### Tentativa com `thread_id` no body

```
HTTP 400 Bad Request
```

```json
{
  "error": {
    "message": "Não foi possível encontrar o usuário solicitado.",
    "type": "IGApiException",
    "code": 100,
    "error_subcode": 2534014
  }
}
```

### Consulta de conversa (`GET /{conversation_id}`)

```
HTTP 400 Bad Request
```

```json
{
  "error": {
    "message": "Tried accessing nonexisting field (unread_count)",
    "type": "IGApiException",
    "code": 100
  }
}
```

### Listagem de conversas (`GET /{ig_user_id}/conversations`)

```
HTTP 200 OK
```

```json
{
  "data": [
    {
      "id": "aWdfZAG06MzQwMjgyMzY2ODQxNzEwMzAxMjQ0MjU5OTA5MzU5NDg4MzY5Mjg0",
      "updated_time": "2026-04-05T05:27:08+0000",
      "participants": {
        "data": [
          { "username": "lima_tests", "id": "17841470348340237" },
          { "username": "000_kaua000", "id": "1602510301006188" }
        ]
      }
    }
  ]
}
```

---

## 2. Regra da Janela de Mensagens (24h / 7 dias)

O Meta impõe duas janelas de tempo para envio de mensagens via API:

| Período | O que pode enviar | Tag necessária |
|---------|-------------------|----------------|
| **0–24h** após última msg do usuário | Qualquer mensagem (manual ou automática) | Nenhuma |
| **24h–7 dias** | Apenas mensagens **manuais** | `human_agent` |
| **Após 7 dias** | **Bloqueado total** — só o usuário pode reabrir | N/A |

### Como a janela funciona

- A contagem começa a partir da **última mensagem do usuário** (não da empresa)
- Se o usuário enviar uma nova mensagem, a janela **reseta**
- Após 7 dias sem interação do usuário, **nenhuma mensagem pode ser enviada** via API
- Mensagens enviadas diretamente pelo app Instagram ou Meta Business Suite **não estão sujeitas** a essa restrição

### Por que o erro ocorre

O `error_subcode: 2534022` com `code: 10` significa que a última mensagem do usuário `@000_kaua000` foi enviada há mais de 24h (ou 7 dias). A conversa existe, mas a plataforma bloqueia o envio.

### Como resolver

1. **Pedir ao usuário para enviar uma nova mensagem** — isso reabre a janela de 24h
2. **Usar a tag `human_agent`** para estender até 7 dias (se ainda dentro do período)
3. **Enviar diretamente pelo app Instagram** — não passa pela API, sem restrição de janela

---

## 3. App Review — Obrigatório para Produção

### Regra oficial do Meta

| Modo | App Review necessário? | Limitação |
|------|------------------------|-----------|
| **Development** | ❌ Não | Até **25 usuários de teste** |
| **Production (Live)** | ✅ **Obrigatório** | Acesso ilimitado |

### Permissões necessárias

Para enviar mensagens via Instagram Graph API, o app precisa ter a permissão **`instagram_business_manage_messages`** aprovada pelo Meta via App Review.

### Status do app atual

| Campo | Valor |
|-------|-------|
| **App ID** | `1471383481007483` |
| **Nome** | `HypeCRM-IG` |
| **Tipo** | Instagram API with Instagram Login |
| **Modo** | Development (não Live) |
| **Versão API** | `v25.0` |
| **Host** | `graph.instagram.com` |

### Escopos concedidos no token atual

- `instagram_business_basic`
- `instagram_business_manage_messages`
- `instagram_business_manage_comments`
- `instagram_business_content_publish`
- `instagram_business_manage_insights`

### O que isso significa na prática

- **Sem App Review aprovado:** só funciona com contas adicionadas como Admin/Developer/Tester no app
- **Com App Review aprovado:** funciona para qualquer usuário real que conectar o Instagram
- O App Review para `instagram_business_manage_messages` tipicamente leva **2–5 dias úteis**

### Como verificar o status

Acesse: `https://developers.facebook.com/apps/1471383481007483/app-review/`

Lá você vê:
- Quais permissões estão em "Development" vs "Live"
- Status da submissão para `instagram_business_manage_messages`
- Se o app está em modo "Live" (público) ou "Development"

---

## 4. Categorias de Erro Implementadas no CRM

O classificador de erros do Instagram (`chamarGraphInstagram`) agora reconhece:

| Categoria | HTTP Code | Condição | Ação do CRM |
|-----------|-----------|----------|-------------|
| `erro_rede` | 502 | `ETIMEDOUT`, `fetch failed`, `TypeError` | Log + mensagem genérica |
| `limite_excedido` | 429 | `code: 4`, subcode `1349210/1349211/1349212` | Log + retry depois |
| `janela_expirada` | 403 | `subcode: 2534022` ou "fora do período permitido" | Mensagem amigável ao usuário |
| `sem_permissao` | 401/403 | `code: 10` (genérico), "permission" | Marca conta como `permissao_insuficiente` |
| `endpoint_invalido` | 400 | `code: 100`, "Tried accessing nonexisting field" | Log + mensagem técnica |
| `token_expirado` | 401 | "Invalid OAuth access token" | Solicita reconexão |

### Importante: Rate limit NÃO desativa a conta

A função `tratarFalhaContaInstagram` foi corrigida para **não marcar a conta como falha** quando o erro é `limite_excedido` (rate limit). Rate limits são temporários e não indicam problema de permissão.

### Ordem de verificação do classificador

A ordem importa porque mensagens de erro podem conter múltiplas keywords:

1. `erro_rede` (catch de try/catch do fetch)
2. `token_expirado`
3. `limite_excedido` (code === 4)
4. `janela_expirada` (subcode 2534022 ou "fora do período permitido")
5. `endpoint_invalido` (code === 100)
6. `sem_permissao` (code === 10, fallback de "permission")

---

## 5. Conta de Teste

| Campo | Valor |
|-------|-------|
| `instagram_user_id` | `26160319576992690` |
| `username` | `lima_tests` |
| `nome` | `Lima Webvision` |
| `account_type` | `MEDIA_CREATOR` |
| `status` | `active` |
| `expires_at` | `2026-05-31` |

### Nota importante sobre status da conta

Execuções de teste que disparam erros podem corromper o status da conta no banco. Para restaurar:

```sql
UPDATE InstagramConta SET status = 'active' WHERE username = 'lima_tests';
```

---

## 6. Fontes e Referências

- [Meta Error Codes — Instagram Platform](https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/error-codes/)
- [Response timeframes on Facebook and Instagram — keyCRM](https://help.keycrm.app/en/communications-sms-email-instagram-telegram-viber-marketplace-chats-telephony/response-timeframes-on-facebook-and-instagram)
- [Instagram Messaging API 2026 — Zernio](https://getlate.dev/blog/instagram-messaging-api)
- [Apps For Your Own Business — Meta Developers](https://developers.facebook.com/docs/messenger-platform/instagram/app-review/apps-for-your-own-business/)
- [Understanding messaging windows — ManyChat](https://help.manychat.com/hc/en-us/articles/23358636027932-Understanding-messaging-windows)
