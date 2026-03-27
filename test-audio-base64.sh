#!/bin/bash
# Testar base64 de ÁUDIO

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Buscar ÁUDIO do chat 555199309404 ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq '[.messages.records[] | select(.messageType == "audioMessage")]' 2>/dev/null | head -50

echo ""
echo "=== Verificando TODOS os tipos ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Pegar base64 do ÁUDIO ==="
AUDIO_MSG=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1, "where": {"key": {"remoteJid": "555199309404@s.whatsapp.net"}}}' | jq -r '.messages.records[] | select(.messageType == "audioMessage") | .key.id' 2>/dev/null | head -1)

echo "ID do Áudio: $AUDIO_MSG"

if [ -n "$AUDIO_MSG" ]; then
  echo "Pegando base64..."
  curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"message\": {\"key\": {\"id\": \"$AUDIO_MSG\"}}}" | jq '{mediaType, mimetype, fileName, seconds, base64Length: (.base64 | length)}' 2>/dev/null
else
  echo "Não encontrou áudio no chat. Buscando em todos os chats..."
  
  # Buscar em todas as mensagens
  ALL_AUDIO=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"limit": 50, "page": 1}' | jq -r '.messages.records[] | select(.messageType == "audioMessage") | .key.id' 2>/dev/null | head -1)
  
  echo "ID do Áudio (global): $ALL_AUDIO"
  
  if [ -n "$ALL_AUDIO" ]; then
    echo "Pegando base64..."
    curl -s -X POST "${API_URL}/chat/getBase64FromMediaMessage/${INSTANCE}" \
      -H "apikey: ${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"message\": {\"key\": {\"id\": \"$ALL_AUDIO\"}}}" | jq '{mediaType, mimetype, fileName, seconds, base64Length: (.base64 | length)}' 2>/dev/null
  fi
fi