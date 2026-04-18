# Spec: ChatReadV1

Scope: feature

# Feature Spec: Chat Read UX V1

## Objetivo
Redefinir o comportamento de leitura do inbox unificado para que o estado de mensagens nao lidas seja derivado exclusivamente da API do canal, sem persistencia de leitura no banco do CRM, sem marcacao automatica ao abrir a conversa, com suporte a visualizacao local no CRM via localStorage e com acao explicita de marcar como lido apenas no WhatsApp no v1.

## Requisitos Funcionais
1. Abrir uma conversa nao pode disparar marcacao de leitura no canal.
2. A categoria oficial do inbox permanece `Nao lidas`.
3. O estado oficial de `nao lida` deve continuar vindo da API do canal e do snapshot atual usado pelo chat.
4. O CRM deve registrar localmente, por navegador, quais mensagens inbound de uma conversa ja foram visualizadas pelo operador.
5. O registro local deve acontecer ao abrir a conversa e considerar todas as mensagens inbound carregadas na tela no snapshot atual.
6. O estado local de visualizacao nao pode alterar contadores globais, filtros, badges oficiais nem a visibilidade da categoria `Nao lidas`.
7. O botao `Marcar como lido` deve aparecer apenas em conversas WhatsApp cujo estado oficial ainda indique mensagens nao lidas.
8. O botao `Marcar como lido` deve permanecer visivel enquanto a API do canal continuar retornando mensagens nao lidas.
9. Ao clicar em `Marcar como lido` no WhatsApp, o sistema deve enviar o evento de leitura para os IDs das mensagens inbound ainda nao lidas, usando a integracao Evolution/Baileys.
10. Apos a acao explicita de leitura, o frontend deve revalidar o snapshot para refletir o novo unread oficial.
11. No Instagram v1, o botao `Marcar como lido` deve ficar oculto.
12. O feed de mensagens deve substituir textos de status como `recebido`, `visto`, `enviando` e `enviado` por icones visuais equivalentes.
13. Os icones de status devem preservar acessibilidade com `aria-label` e suporte a tooltip ou title.
14. A implementacao deve contemplar chats com lead e chats orfaos.

## Requisitos Nao Funcionais
1. Nao criar migration nem nova persistencia de leitura em banco.
2. Nao usar `lida_no_crm_em` como fonte de verdade da UX do inbox neste fluxo.
3. Nao usar localStorage para logica compartilhada entre operadores.
4. A identidade da conversa deve ser estavel e canonicamente normalizada para evitar duplicidade entre `@lid` e `@s.whatsapp.net`.
5. A solucao deve minimizar regressao em SSE, refresh, paginação e listas agregadas do inbox.

## Modelo de Estado
### Estado oficial
- `unreadCount` continua sendo a representacao oficial de nao lidas no canal.
- Esse campo alimenta contadores, filtros, resumo do chat e visibilidade do botao `Marcar como lido`.

### Estado local do CRM
- `viewedLocalMessageIds` representa apenas mensagens inbound ja visualizadas no CRM naquele navegador.
- Esse estado serve exclusivamente para micro UX local dentro da conversa.
- Esse estado nao pode ser usado para zerar badge, alterar categoria ou simular leitura no canal.

## Chaves de Armazenamento Local
### WhatsApp
`crm:viewed:whatsapp:${instanceName}:${remoteJidCanonico}`

### Instagram
`crm:viewed:instagram:${conversationId}`

## Formato recomendado
```ts
type ChatViewedLocalState = {
  updatedAt: number;
  messageIds: string[];
};
```

## Regras de Armazenamento Local
1. Registrar apenas mensagens inbound.
2. Deduplicar IDs antes de salvar.
3. Limitar o array para evitar crescimento indefinido. Recomendacao: ultimos 200 IDs por conversa.
4. Se o payload estiver invalido, descartar silenciosamente e reconstruir.
5. O salvamento deve ocorrer quando o snapshot da conversa for carregado/renderizado com mensagens disponiveis.

## Backend WhatsApp: Marcacao Explicita de Leitura
### Entrada recomendada
```ts
{
  instanceName: string;
  remoteJid: string;
}
```

### Motivo
- O fluxo por `leadId` nao cobre chats orfaos corretamente.
- O inbox unificado ja opera por identidade de conversa.
- A acao precisa funcionar tanto para conversas vinculadas quanto nao vinculadas.

### Comportamento esperado
1. Validar `instanceName` e `remoteJid`.
2. Resolver a identidade canonica da conversa.
3. Identificar as mensagens inbound ainda nao lidas elegiveis para envio de `markMessageAsRead`.
4. Montar a lista `readMessages` no formato esperado pela Evolution.
5. Chamar `marcarMensagensComoLidasEvolution(instanceName, mensagens)`.
6. Retornar sucesso para o frontend.
7. O frontend faz refresh/reconciliacao para obter o unread atualizado da API.

## Frontend: Regras de UX
### Ao abrir conversa
1. Nao disparar acao de leitura automatica.
2. Registrar localmente todos os IDs inbound presentes no snapshot carregado.
3. Manter o unread oficial intacto enquanto a API ainda o reportar.

### Botao `Marcar como lido`
1. Visivel apenas para WhatsApp.
2. Visivel apenas quando `unreadCount > 0`.
3. Deve ficar em area de acao clara no header do painel.
4. Em caso de erro da API, manter o botao visivel e informar falha ao operador.

### Instagram v1
1. Nao mostrar o botao.
2. Continuar registrando visualizacao local via localStorage.
3. Nao simular marcacao de leitura sem suporte real do canal.

## Feed de Mensagens
Os status textuais devem ser substituidos por icones. Mapeamento recomendado:
- enviando: clock
- enviada: check simples
- entregue/recebida: check duplo
- lida/vista: check duplo com destaque visual
- erro: alert-circle

Os icones devem manter semantica acessivel:
- `aria-label`
- tooltip ou `title`
- contraste adequado

## Arquivos Candidatos a Alteracao
- `src/modules/chat/hooks/use-chat-module.ts`
- `src/modules/whatsapp/hooks/use-whatsapp-chat.ts`
- `src/app/api/whatsapp/chat/mark-read/route.ts`
- `src/lib/api/whatsapp.chat.ts`
- `src/lib/whatsapp-chat.evolution.ts`
- `src/lib/chat-remote-jid.ts`
- `src/modules/chat/components/chat-panel.tsx`
- `src/modules/chat/components/chat-item.tsx`
- `src/modules/chat/components/chat-message-list.tsx` ou componente equivalente de status
- novo utilitario sugerido: `src/lib/chat-local-view-state.ts`

## Cenarios de Validacao
1. WhatsApp com lead: abrir sem marcar leitura automaticamente; botao aparece; clique dispara leitura; unread oficial zera apos refresh/snapshot.
2. WhatsApp orfao: mesmo fluxo, sem dependencia de leadId.
3. Instagram: abrir conversa registra visualizacao local; botao nao aparece.
4. Refresh de pagina: visualizacao local persiste; unread oficial continua vindo da API.
5. Troca de navegador/dispositivo: visualizacao local nao persiste entre ambientes; unread oficial segue correto.
6. Falha da Evolution: erro ao marcar como lido nao corrompe estado local nem badge oficial.
7. Conversas com JID `@lid`: chave canonica deve coincidir com a conversa equivalente em `@s.whatsapp.net`.
8. SSE e snapshots subsequentes nao devem reintroduzir marcacao automatica de leitura.

## Fora de Escopo
1. Persistir leitura em banco do CRM.
2. Implementar acao de `Marcar como lido` no Instagram sem suporte confirmado do canal.
3. Resolver duplicidade de conversas por multiplas instancias no inbox neste ciclo.
4. Alterar a semantica do inbox para `Nao respondidas`.

## Criterio de Pronto
1. Nao existe mais leitura automatica ao abrir conversa.
2. O inbox continua consistente para conversas com lead e orfas.
3. O botao de leitura explicita funciona apenas no WhatsApp e apenas quando a API ainda indica unread.
4. O localStorage melhora a UX local sem interferir na verdade oficial do canal.
5. O feed de mensagens mostra icones acessiveis para status.
6. A validacao final do projeto deve ser feita com `npm run pm2:prod`.