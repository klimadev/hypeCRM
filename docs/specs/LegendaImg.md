# Spec: LegendaImg

Scope: feature

# Exibir legendas em imagens no chat unificado

## Objetivo
Melhorar a compreensão visual das mensagens de imagem no chat unificado exibindo a legenda textual associada à mídia quando ela existir.

## Escopo
- Aplicar somente ao chat unificado em `src/modules/chat/...`.
- Exibir a legenda abaixo da imagem dentro do mesmo bubble da mensagem.
- Preservar o layout atual, incluindo carregamento de mídia, estados de erro e metadados de horário/status.

## Regras funcionais
- Quando uma mensagem `imageMessage` tiver legenda real em `text`, a legenda deve ser renderizada abaixo da imagem.
- A legenda deve respeitar quebra de linha e wrapping existentes para texto do chat.
- Mensagens de imagem sem legenda real não devem exibir placeholders redundantes como `📷 Imagem` apenas para preencher espaço.
- O comportamento de outros tipos de mensagem não deve regredir.

## Critérios de aceitação
- Imagem com legenda: imagem visível e legenda renderizada no bubble.
- Imagem sem legenda: imagem visível sem bloco de texto redundante.
- Texto puro, áudio, documento e demais mensagens continuam com o comportamento atual.
- Build/validação final do projeto executa com sucesso via `npm run pm2:prod`.

## Fora de escopo
- Alterações no painel WhatsApp dedicado em `src/modules/whatsapp/...`.
- Mudanças no pipeline de persistência, schema ou contrato público da API, exceto se estritamente necessárias para diferenciar legenda real de placeholder.