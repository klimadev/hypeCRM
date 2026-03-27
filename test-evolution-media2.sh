#!/bin/bash
# Script para ver a estrutura COMPLETA de mensagens com mídia (imagem, áudio, vídeo)

# Configurações
INSTANCE="hype_lima_teste"
API_URL="http://177.153.38.26:8080"
API_KEY="429683C4C977415CAAFCCE10F7D57E11"

echo "=== Verificando estrutura de mensagens com mídia ==="

# Buscar mensagens e ver estrutura completa de cada tipo de mídia
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1}' | jq '.messages.records[] | select(.messageType == "imageMessage") | .message.imageMessage' 2>/dev/null | head -80

echo ""
echo "=== Verificando estrutura de vídeo ==="
curl -s -X POST "${API_URL}/chat/findMessages/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"limit": 20, "page": 1}' | jq '.messages.records[] | select(.messageType == "videoMessage") | .message.videoMessage' 2>/dev/null | head -50

echo ""
echo "=== Verificando se tem endpoint para download de mídia (na Evolution API) ==="
# Testar endpoint de mídia
curl -s -X GET "${API_URL}/message/fetchPTT/${INSTANCE}?count=5" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null | head -30

echo ""
echo "=== Verificando endpoint de chat/fetch ==="
curl -s -X POST "${API_URL}/chat/fetch/${INSTANCE}" \
  -H "apikey: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"chatId": "555199309404@s.whatsapp.net"}' 2>/dev/null | jq '.' 2>/dev/null | head -50

echo ""
echo "=== Verificando endpoint de message/fetchPTT ==="
curl -s -X GET "${API_URL}/message/fetchPTT/${INSTANCE}/1" \
  -H "apikey: ${API_KEY}" 2>/dev/null | jq '.' 2>/dev/null