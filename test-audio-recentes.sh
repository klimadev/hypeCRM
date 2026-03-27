#!/bin/bash
# Teste de áudio - buscar mensagens mais recentes

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Verificar mensagens mais recentes (últimas 20) ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1}' | jq '[.messages.records[] | {messageType, id: .key.id, remoteJid: .key.remoteJid, fromMe: .key.fromMe, timestamp: .messageTimestamp}]' 2>/dev/null

echo ""
echo "=== Verificar TODOS os tipos de mensagem ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1}' | jq '[.messages.records[].messageType] | unique' 2>/dev/null

echo ""
echo "=== Buscar por ÁUDIO ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1}' | jq '.messages.records[] | select(.messageType == "audioMessage")' 2>/dev/null