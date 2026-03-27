#!/bin/bash
# Script para encontrar mensagens com áudio

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste 1: Verificar todos os endpoints com search ==="
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" 2>/dev/null | jq -r 'to_entries | .[].key' 2>/dev/null | head -100

echo ""
echo "=== Teste 2: Verificar documentação na Evolution API ==="
# Testar diferentes caminhos de documentação
curl -s -X GET "${API_URL}/api-docs" -H "apikey: ${API_KEY}" 2>/dev/null | head -20
curl -s -X GET "${API_URL}/swagger" -H "apikey: ${API_KEY}" 2>/dev/null | head -20
curl -s -X GET "${API_URL}/swagger.json" -H "apikey: ${API_KEY}" 2>/dev/null | head -20

echo ""
echo "=== Teste 3: Verificar endpoints de message ==="
curl -s -X GET "${API_URL}/" -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' | head -30

echo ""
echo "=== Teste 4: Verificar documentação na rota /docs ==="
curl -s -X GET "${API_URL}/docs/" -H "apikey: ${API_KEY}" 2>/dev/null | head -30

echo ""
echo "=== Teste 5: Verificar se tem método para buscar mensagem por ID ==="
curl -s -X GET "${API_URL}/instance/fetchInstance/hype_lima_teste" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null | head -30

echo ""
echo "=== Teste 6: Tentar buscar mensagens por chat (com paginação) ==="
# Buscar primeiro chat
CHAT_ID=$(curl -s -X GET "${API_URL}/chat/list/${INSTANCE}?limit=1" \
  -H "apikey: ${API_KEY}" | jq -r '.contacts[0].id // .chats[0].id' 2>/dev/null)

echo "Chat ID: $CHAT_ID"

if [ -n "$CHAT_ID" ]; then
  echo "Buscando mensagens para: $CHAT_ID"
  curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
    -H "apikey: ${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"limit\": 20, \"page\": 1, \"chatId\": \"$CHAT_ID\"}" | jq '.messages.records[] | {messageType, hasMessage: (.message != null)}' 2>/dev/null
fi