---
plan name: ChatReadUX
plan description: Explicit read UX overhaul
plan status: active
---

## Idea
Redesenhar o comportamento de leitura do inbox unificado para usar a API do canal como fonte de verdade de mensagens não lidas, eliminar qualquer marcação automática ao abrir a conversa, introduzir um estado local de visualização no CRM baseado em localStorage por conversa, exibir a ação explícita de marcar como lido apenas no WhatsApp no v1, e substituir rótulos textuais de status de mensagem por ícones acessíveis. O objetivo é manter a implementação enxuta, sem persistência adicional em banco, cobrindo chats com lead e órfãos, reduzindo ambiguidade entre leitura real do canal e visualização local do operador, e minimizando risco de regressão no feed, inbox, SSE e snapshots.

## Implementation
- Mapear todos os pontos onde a abertura da conversa ainda dispara mark-read automático e definir a remoção completa desse comportamento no inbox unificado e no fluxo legado de WhatsApp.
- Especificar a identidade canônica da conversa para armazenamento local de visualização por canal, incluindo chave, formato, limites e estratégia de atualização no localStorage.
- Definir o fluxo backend do WhatsApp para marcar como lido explicitamente por conversa, coletando apenas mensagens inbound ainda não lidas pela API e enviando os IDs corretos ao endpoint Evolution/Baileys.
- Redesenhar a modelagem de estado do frontend para separar unread oficial do canal de viewed local no CRM, incluindo regras de exibição do botão, badges, resumos e contagens.
- Detalhar as alterações de UI no painel, lista lateral e feed de mensagens, incluindo substituição de textos de status por ícones com tooltip e aria-label.
- Definir a estratégia de atualização otimista, refetch e reconciliação via SSE para evitar inconsistência entre leitura oficial do canal e estado local visualizado.
- Enumerar cenários de validação funcionais e de regressão para WhatsApp com lead, WhatsApp órfão, Instagram, refresh, navegação, multiaba e falhas da API.

## Required Specs
<!-- SPECS_START -->
- ChatReadV1
<!-- SPECS_END -->