#!/bin/bash
# Testar endpoint de base64 de mídia

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste: Buscar mensagem com áudio (audioMessage) ==="
# Primeiro buscar uma mensagem de áudio
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1}' | jq '[.messages.records[] | select(.messageType == "audioMessage")] | length' 2>/dev/null

echo ""
echo "=== Verificando se tem audioMessage na base ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1}' | jq '.messages.records[] | select(.messageType == "audioMessage") | {id: .key.id, messageType}' 2>/dev/null | head -20

echo ""
echo "=== Teste: getBase64FromMediaMessage ==="
# Pegar uma mensagem de imagem primeiro para testar
IMG_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "page": 1}' | jq -r '.messages.records[] | select(.messageType == "imageMessage") | .key.id' 2>/dev/null | head -1)

echo "Testando com imagem ID: $IMG_MSG"

if [ -n "$IMG_MSG" ]; then
  echo "Chamando endpoint de base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$IMG_MSG\"}}}" | jq '.' 2>/dev/null | head -50
fi

echo ""
echo "=== Teste 2: Buscar mensagens de um chat específico ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq '.messages.records[] | {messageType, hasMessage: (.message != null)}' 2>/dev/null | head -20