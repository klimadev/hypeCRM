#!/bin/bash
# Script para descobrir todos os tipos de mensagem e endpoints de mídia

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste 1: Listar TODOS os tipos de mensagem na base ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 100, "page": 1}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Teste 2: Ver OpenAPI completo (paths) ==="
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" | jq '.paths | keys' 2>/dev/null

echo ""
echo "=== Teste 3: Testar endpoint /message/fetch ==="
curl -s -X POST "${API_URL}/message/fetch/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20}' | jq '.messages[0:3]' 2>/dev/null | head -50

echo ""
echo "=== Teste 4: Ver todos os endpoints disponíveis ==="
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" 2>/dev/null | jq -r '.paths | to_entries[] | .key' | head -50

echo ""
echo "=== Teste 5: Ver documentação do endpoint de mensagens ==="
curl -s -X GET "${API_URL}/docs" -H "apikey: ${API_KEY}" 2>/dev/null | head -20

echo ""
echo "=== Teste 6: Verificar se tem endpoint de mídia/chat ==="
curl -s -X GET "${API_URL}/chat/verifyWebhook" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq .

echo ""
echo "=== Teste 7: Verificar endpoint de chat por ID ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1, "page": 1, "chatId": "555199309404@s.whatsapp.net"}' | jq '.' 2>/dev/null | head -50