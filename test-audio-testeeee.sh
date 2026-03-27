#!/bin/bash
# Testar base64 de ÁUDIO - instância hype_lima_testeeee

# Configurações
INSTANCE="hype_lima_testeeee"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Verificar mensagens mais recentes ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "page": 1}' | jq '[.messages.records[] | {messageType, id: .key.id, fromMe: .key.fromMe, timestamp: .messageTimestamp}]' 2>/dev/null

echo ""
echo "=== Verificar TODOS os tipos ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "page": 1}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Buscar ÁUDIO ==="
AUDIO_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "page": 1}' | jq -r '.messages.records[] | select(.messageType == "audioMessage") | .key.id' 2>/dev/null | head -1)

echo "ID do Áudio: $AUDIO_MSG"

if [ -n "$AUDIO_MSG" ]; then
  echo "Pegando base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$AUDIO_MSG\"}}}" | jq '{mediaType, mimetype, fileName, seconds, base64Length: (.base64 | length)}' 2>/dev/null
fi