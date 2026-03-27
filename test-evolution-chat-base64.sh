#!/bin/bash
# Testar endpoint de base64 no chat específico

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste: Buscar TODAS as mensagens do chat específico ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq '[.messages.records[] | {messageType, id: .key.id}]' 2>/dev/null | head -50

echo ""
echo "=== Verificando tipos de mensagem no chat ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Buscar imagem e testar base64 ==="
IMG_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq -r '.messages.records[] | select(.messageType == "imageMessage") | .key.id' 2>/dev/null | head -1)

echo "ID da Imagem: $IMG_MSG"

if [ -n "$IMG_MSG" ]; then
  echo "Pegando base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$IMG_MSG\"}}}" | jq '{mediaType, mimetype, base64: .base64[0:100]}' 2>/dev/null
fi