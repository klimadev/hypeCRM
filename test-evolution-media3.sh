#!/bin/bash
# Testar endpoints de download de mídia

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste: Verificar endpoints de chat ==="
# Ver todos os endpoints disponíveis
curl -s -X GET "${API_URL}/" -H "apikey: ${API_KEY}" | jq '.paths | keys' 2>/dev/null || echo "No paths in root"

echo ""
echo "=== Teste: chat/fetchMessages (sem o 'find') ==="
curl -s -X POST "${API_URL}/chat/fetchMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}' 2>/dev/null | jq '.' 2>/dev/null | head -20

echo ""
echo "=== Teste: Verificar se tem endpoint getmedia ==="
curl -s -X GET "${API_URL}/message/getMedia/${INSTANCE}?fileId=test" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null

echo ""
echo "=== Teste: Buscar uma mensagem específica por ID ==="
# Pegar o ID de uma mensagem com mídia
MSG_ID=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 10, "page": 1}' | jq -r '.messages.records[] | select(.messageType == "imageMessage") | .id' 2>/dev/null | head -1)

echo "Message ID: $MSG_ID"

if [ -n "$MSG_ID" ]; then
  echo "Buscando mensagem por ID..."
  curl -s -X GET "${API_URL}/message/fetch/${INSTANCE}/${MSG_ID}" \
    -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null | head -30
fi

echo ""
echo "=== Teste: Verificar endpoints de chat list ==="
curl -s -X GET "${API_URL}/chat/list/${INSTANCE}" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null | head -30

echo ""
echo "=== Teste: Verificar manager endpoints ==="
curl -s -X GET "${API_URL}/manager/listInstances" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null | head -20