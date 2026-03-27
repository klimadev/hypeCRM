#!/bin/bash
# Script para testar endpoints da Evolution API e descobrir como buscar mensagens com conteúdo/base64

# Configurações
INSTANCE="hype_lima_teste"
CHAT="555199309404@s.whatsapp.net"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste 1: Verificar se a instância existe ==="
curl -s -X GET "${API_URL}/instance/connectionState/${INSTANCE}" \
  -H "apikey: ${API_KEY}" | jq .

echo ""
echo "=== Teste 2: Buscar mensagens (o método atual - só metadados) ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 5, "page": 1}' | jq .

echo ""
echo "=== Teste 3: Verificar documentação/swagger da API ==="
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" | jq '.paths | keys' 2>/dev/null | head -30

echo ""
echo "=== Teste 4: Buscar mensagens de um chat específico (alternativo) ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"limit\": 10, \"page\": 1, \"chatId\": \"${CHAT}\"}" | jq .

echo ""
echo "=== Teste 5: Listar conversas da instância ==="
curl -s -X GET "${API_URL}/chat/list/${INSTANCE}?limit=10" \
  -H "apikey: ${API_KEY}" | jq .

echo ""
echo "=== Teste 6: Verificar endpoint de mensagem por ID ==="
# Primeiro vamos buscar uma mensagem para pegar um messageID
MSG_RESPONSE=$(curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 1, "page": 1}')

echo "$MSG_RESPONSE" | jq '.messages.records[0].key.id'