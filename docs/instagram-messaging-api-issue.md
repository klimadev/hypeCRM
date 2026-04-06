# Problema: Instagram Messaging API retorna `data: []` mesmo com mensagem inbound

## Contexto do App
- **Tipo de app:** Instagram API with Instagram Login (não Facebook Login)
- **Modo do app:** Development Mode (não Live)
- **Host correto:** `graph.instagram.com` (não `graph.facebook.com`)
- **Versão da API:** `v25.0`
- **Escopos concedidos:** `instagram_business_basic`, `instagram_business_manage_messages`, `instagram_business_manage_comments`, `instagram_business_content_publish`, `instagram_business_manage_insights`

## Conta Conectada
```
instagram_user_id: 26160319576992690
username: lima_tests
nome: Lima Webvision
account_type: MEDIA_CREATOR
status: active
access_token: IGAAU6Nym2vXtBZAFpYTGJPSmM0RllxbEFKNVpXTmRNVUhwY0tKcXRFQzhOV3RBdW15b3ZA1NGNRbGtlbVdVQm00bXYwUHZAhNXdJNG5wdURfSTh3MF9TM0lxMklDSlNRY3p6ei1rLUwxNTF0cHhYMHpFNmhR
expires_at: 2026-05-31
```

## O que funciona
```
GET https://graph.instagram.com/v25.0/me?fields=id,username,name,account_type&access_token=IGAA...
→ 200 OK
→ {"id":"26160319576992690","username":"lima_tests","name":"Lima Webvision","account_type":"MEDIA_CREATOR"}
```

## O que NÃO funciona (retorna vazio)
```
GET https://graph.instagram.com/v25.0/26160319576992690/conversations?fields=id,updated_time,unread_count,participants,message_count,snippet&limit=25&access_token=IGAA...
→ 200 OK
→ {"data":[]}

GET https://graph.instagram.com/v25.0/me/conversations?fields=id,updated_time,unread_count,participants,message_count,snippet&limit=25&access_token=IGAA...
→ 200 OK
→ {"data":[]}
```

## Cenário de teste
- Uma conta diferente enviou uma DM para `@lima_tests` (inbound)
- A mensagem foi enviada APÓS a correção do host para `graph.instagram.com`
- Mesmo assim, a API retorna `data: []`

## Variações já testadas (todas retornam `data: []` ou erro)
- `/{ig_id}/conversations` — 200, data: []
- `/me/conversations` — 200, data: []
- Com `&folder=PRIMARY`, `&folder=GENERAL`, `&folder=REQUESTS` — 200, data: []
- Com `&platform=instagram` — 200, data: []
- Versões `v20.0`, `v21.0`, `v22.0`, `v25.0` — mesmo resultado
- `graph.facebook.com` — rejeita o token IGAA... como "Invalid OAuth access token"

## Hipóteses investigadas
1. **App em Development Mode:** A conta que enviou a mensagem pode não ter role (Admin/Developer/Tester) no app, então a API não expõe a conversa dela
2. **Mensagem em Requests:** Se a conta que enviou não segue `@lima_tests`, a mensagem pode estar na pasta Requests e não ser retornada pela API
3. **Token sem permissão de messaging:** O token pode ter sido gerado antes da permissão `instagram_business_manage_messages` ser concedida, ou o token pode não estar vinculado corretamente a essa permissão

## Perguntas para o especialista
1. O token `IGAA...` (Instagram User Access Token) do fluxo Instagram Login é suficiente para acessar `/{IG_ID}/conversations`?
2. É necessário algum passo adicional além do OAuth para habilitar o acesso a conversas?
3. O fato de o app estar em Development Mode bloqueia conversas de contas sem role no app?
4. Há alguma configuração específica no Meta Developer Dashboard para habilitar o acesso a mensagens via API?
5. O `account_type: MEDIA_CREATOR` (em vez de BUSINESS) pode afetar o acesso à API de mensagens?
