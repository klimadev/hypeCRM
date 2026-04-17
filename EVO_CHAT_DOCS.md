📘 Documentação – Evolution API (Chats, Mensagens e Metadados)

Baseado nos teus testes:

(consulta de chats)
(consulta de mensagens)
1. 📡 Consulta de Chats (/chat/findChats)
🔹 Endpoint
POST /chat/findChats/{instance}
🔹 Payload base
{
  "where": {},
  "take": 10,
  "skip": 0
}
🔹 Estrutura do retorno

Cada chat possui:

{
  "id": "...",
  "remoteJid": "...",
  "pushName": "...",
  "profilePicUrl": "...",
  "updatedAt": "...",
  "lastMessage": {...},
  "unreadCount": ...,
  "isSaved": true
}
🔹 Campos importantes
🧠 remoteJid
Identificador do chat
Tipos:
xxxxx@s.whatsapp.net → conversa privada
xxxxx@g.us → grupo
xxxxx@lid → ID interno (Linked Device)
👤 pushName (DO CHAT)
Pode ser:
Nome do contato
Nome do grupo
null ❗ (muito comum)

👉 Problema real:

O pushName do chat NÃO é confiável para identificar o usuário

✔️ Exemplo:

"pushName": null
🖼️ profilePicUrl
URL da foto (nem sempre presente)
💬 lastMessage

Objeto extremamente importante:

"lastMessage": {
  "pushName": "Sergio Amaral",
  "messageType": "conversation",
  "message": {...},
  "status": "DELIVERY_ACK"
}
2. 📩 Consulta de Mensagens (/chat/findMessages)
🔹 Endpoint
POST /chat/findMessages/{instance}
🔹 Payload (filtro correto)
{
  "where": {
    "key": {
      "remoteJid": "5511992329733@s.whatsapp.net",
      "remoteJidAlt": "5511992329733@s.whatsapp.net"
    }
  },
  "page": 1,
  "offset": 10
}
🔹 Estrutura da mensagem
{
  "id": "...",
  "key": {...},
  "pushName": "...",
  "messageType": "...",
  "message": {...},
  "messageTimestamp": ...,
  "MessageUpdate": [...]
}
3. 🔑 Entendendo o key (CRÍTICO)
"key": {
  "fromMe": true,
  "remoteJid": "...",
  "remoteJidAlt": "...",
  "addressingMode": "pn | lid"
}
🔹 fromMe
true → mensagem enviada pela instância
false → mensagem do cliente

👉 Esse campo define TODA a lógica de interpretação

🔹 addressingMode
Valor	Significado
pn	phone number (número real)
lid	linked device ID
🔹 remoteJid vs remoteJidAlt
Campo	Uso
remoteJid	pode ser LID (instável)
remoteJidAlt	geralmente número real

👉 REGRA PRÁTICA:

const jid = key.remoteJidAlt || key.remoteJid;
4. 👤 Obtenção correta do pushName
❌ Problema comum
pushName do chat → frequentemente null
pushName pode vir como "Você" (quando fromMe=true)
✅ Fonte correta do nome

👉 Sempre usar:

if (!fromMe) {
  name = message.pushName;
}

✔️ Exemplo real:

{
  "fromMe": false,
  "pushName": "Eve"
}

⚠️ Regra de ouro
Caso	Nome correto
Mensagem recebida	message.pushName
Mensagem enviada	IGNORAR ("Você")
Chat list	NÃO confiar
🧠 Estratégia ideal (produção)
function getContactName(msg) {
  if (!msg.key.fromMe && msg.pushName) {
    return msg.pushName;
  }
  return null; // ou fallback banco
}
5. 📊 Status da mensagem
🔹 No chat (lastMessage.status)
"status": "DELIVERY_ACK"
🔹 Nas mensagens (MessageUpdate)
"MessageUpdate": [
  { "status": "DELIVERY_ACK" },
  { "status": "READ" }
]
🔹 Tipos de status
Status	Significado
SERVER_ACK	chegou no servidor
DELIVERY_ACK	entregue
READ	visualizado
PLAYED	áudio ouvido
🧠 Regra prática

👉 O status real = último item do array

const status = message.MessageUpdate?.slice(-1)[0]?.status;
6. 💬 Tipos de mensagem
🔹 Texto
"messageType": "conversation"
"message": {
  "conversation": "texto aqui"
}
🔹 Áudio
"messageType": "audioMessage"

Campos importantes:

url
seconds
mimetype
🔹 Reações
"messageType": "reactionMessage"
7. 🧠 Insights importantes (dos teus testes)
🔥 1. pushName confiável NÃO vem do chat
Só vem correto na mensagem recebida
🔥 2. remoteJid pode ser inútil sozinho
Muitas vezes vem como @lid
Sempre usar remoteJidAlt
🔥 3. Mensagens enviadas poluem dados
pushName = "Você"
ignorar para identificação
🔥 4. Status não é único
é histórico (MessageUpdate[])
precisa pegar o último
🔥 5. Chat ≠ fonte de verdade
Chat é só resumo
Mensagem é a fonte real
8. 🧩 Modelo ideal de normalização
function normalizeMessage(msg) {
  const fromMe = msg.key.fromMe;

  return {
    id: msg.id,
    jid: msg.key.remoteJidAlt || msg.key.remoteJid,
    fromMe,
    name: !fromMe ? msg.pushName : null,
    text: msg.message?.conversation || null,
    type: msg.messageType,
    status: msg.MessageUpdate?.slice(-1)[0]?.status || null,
    timestamp: msg.messageTimestamp
  };
}
9. 🚀 Conclusão
📌 Verdades importantes da Evolution API
Chat é superficial
Mensagem é a verdade
pushName só é confiável quando:
fromMe = false
remoteJidAlt > remoteJid
Status precisa ser calculado
lid é interno → ignore para negócio
