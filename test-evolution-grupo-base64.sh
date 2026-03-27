#!/bin/bash
# Testar endpoint no chat do grupo

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste: Buscar mensagens do GRUPO ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1, "where": {"key": {"remoteJid": "555199309404-1568108888@g.us"}}}' | jq '[.messages.records[] | {messageType, id: .key.id, fromMe: .key.fromMe}]' 2>/dev/null | head -30

echo ""
echo "=== Verificando todos os tipos de mensagem no GRUPO ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1, "where": {"key": {"remoteJid": "555199309404-1568108888@g.us"}}}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Pegar base64 de IMAGEM do GRUPO ==="
IMG_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1, "where": {"key": {"remoteJid": "555199309404-1568108888@g.us"}}}' | jq -r '.messages.records[] | select(.messageType == "imageMessage") | .key.id' 2>/dev/null | head -1)

echo "ID da Imagem: $IMG_MSG"

if [ -n "$IMG_MSG" ]; then
  echo "Pegando base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$IMG_MSG\"}}}" | jq '{mediaType, mimetype, base64Preview: .base64[0:80]}' 2>/dev/null
fi

echo ""
echo "=== Pegar base64 de VÍDEO do GRUPO ==="
VID_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1, "where": {"key": {"remoteJid": "555199309404-1568108888@g.us"}}}' | jq -r '.messages.records[] | select(.messageType == "videoMessage") | .key.id' 2>/dev/null | head -1)

echo "ID do Vídeo: $VID_MSG"

if [ -n "$VID_MSG" ]; then
  echo "Pegando base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$VID_MSG\"}}, \"convertToMp4\": true}" | jq '{mediaType, mimetype, base64Preview: .base64[0:80]}' 2>/dev/null
fi