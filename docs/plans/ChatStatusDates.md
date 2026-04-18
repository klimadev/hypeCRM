---
plan name: ChatStatusDates
plan description: Refatorar status datas chats
plan status: done
---

## Idea
Refatorar a cadeia de normalização de chats e mensagens do WhatsApp para eliminar lookup incorreto em conversas `@lid`, unificar a interpretação de status com base em `MessageUpdate`, preservar timestamps de transporte com `timestampIso`, e alinhar a API de lista de chats e de mensagens para que usem a mesma resolução de identidade e as mesmas regras de data/status validadas contra a instância real `hype_lima_pessoal` e a amostra dos 3 chats mais recentes com 3 mensagens cada.

## Implementation
- Mapear formalmente a origem da identidade de conversa em cada etapa (`findChats`, `findMessages`, normalização, rotas `/api/chat/all`, `/api/chat/messages`, stream) e definir qual JID deve ser tratado como chave canônica versus lookup alternativo.
- Substituir a resolução ingênua de `@lid` por uma estratégia baseada em evidência do payload bruto, priorizando `lastMessage.key.remoteJidAlt` e demais campos confiáveis para recuperar o par `remoteJid`/`remoteJidAlt` sem fabricar JIDs inexistentes.
- Unificar a normalização de mensagens para que a rota principal reutilize a lógica rica já existente em `whatsapp-chat.normalization.ts`, preservando `status`, `timestamp`, `timestampIso`, tipo de mídia e payload bruto consistente.
- Revisar a normalização de chats para corrigir preview, timestamp da última mensagem e seleção de conversa mais recente quando `messageTimestamp` do chat vier nulo mas o `lastMessage` possuir dados mais confiáveis.
- Cobrir os cenários reais identificados com testes/instrumentação de leitura controlada para os 3 chats amostrados (`Chamalead`, `Mell`, `Kevin Peggy |Automação IA`), validando lookup, status `READ/PLAYED/DELIVERY_ACK` e datas em UTC/local.
- Validar o fluxo completo com a rotina oficial do projeto (`npm run pm2:prod`) e revisar riscos residuais em persistência/DB, especialmente onde hoje o caminho legado e o caminho principal divergem.

## Required Specs
<!-- SPECS_START -->
- ChatStatusDatesFeature
<!-- SPECS_END -->