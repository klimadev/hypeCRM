#!/bin/bash
# Script para descobrir como extrair BASE64 de áudio da Evolution API

# Configurações
INSTANCE="hype_lima_teste"
CHAT="555199309404@s.whatsapp.net"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Teste 1: Verificar/OpenAPI ==="
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" | jq '.paths | to_entries | .[] | select(.key | contains("message") or contains("media") or contains("audio")) | {path: .key, methods: .value | keys}' 2>/dev/null | head -40

echo ""
echo "=== Teste 2: Buscar mensagens com tipos de mídia (audioMessage) ==="
# Busca mensagens e filtra por audioMessage
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1}' | jq '.messages.records[] | select(.messageType == "audioMessage") | {id: .key.id, messageType: .messageType, hasMessage: .message != null}' 2>/dev/null

echo ""
echo "=== Teste 3: Ver estrutura completa de uma mensagem de áudio ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "page": 1}' | jq '.messages.records[] | select(.messageType == "audioMessage")' 2>/dev/null | head -100

echo ""
echo "=== Teste 4: Verificar se tem endpoint específico para buscar mídia ==="
# Lista todos os endpoints disponíveis
curl -s -X GET "${API_URL}/openapi.json" -H "apikey: ${API_KEY}" | jq '.paths | keys' 2>/dev/null | grep -i -E "media|audio|download|file"

echo ""
echo "=== Teste 5: Testar endpoint chat/findMessages com chatId específico ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"limit\": 10, \"page\": 1, \"chatId\": \"${CHAT}\"}" | jq '.messages.records[] | {id: .key.id, messageType: .messageType, fromMe: .key.fromMe, timestamp: .messageTimestamp}' 2>/dev/null | head -20