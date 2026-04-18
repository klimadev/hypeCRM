# Spec: ChatUnreadOrderFeature

Scope: feature

# ChatUnreadOrderFeature

## Objetivo
Corrigir a inbox unificada para que a origem da verdade de `unreadCount`, recencia, ordenacao e refresh dos chats do WhatsApp seja sempre o estado remoto retornado pela Evolution API, preservando o papel do banco local apenas para enriquecimento CRM, cache e rastreamento de leitura no CRM.

## Contexto validado
A investigacao confirmou que o problema atual nao esta no frontend de renderizacao do badge, mas no pipeline de agregacao da inbox:

- `src/lib/chat-unificado.ts` inicializa chats WhatsApp com `unreadCount: 0`.
- Depois disso, o unread e recalculado apenas por `id_lead` usando Prisma, o que zera chats sem lead vinculado.
- A ordenacao depende de `conv.messageTimestamp ?? 0`, mas chats reais recentes podem chegar com `messageTimestamp = null`.
- A Evolution expõe no resumo de chats campos relevantes como `unreadCount`, `updatedAt`, `lastMessage` e JIDs alternativos, mas parte desses campos esta sendo descartada na normalizacao.
- O produto exige que `leadMatch` seja apenas enriquecimento CRM; ele nunca pode bloquear comportamento base da inbox.
- O usuario definiu arquitetura remota-first: a WhatsApp remota e a fonte de verdade para unread e ordem; o banco local nao deve dirigir a inbox.
- Se o mesmo telefone aparecer em multiplas instancias e a UI o agregar em uma linha so, o unread exibido deve ser a soma remota das instancias, enquanto a ordenacao da linha deve seguir a instancia com atividade remota mais recente.

## Regras de produto
1. `leadMatch` so desbloqueia recursos de CRM, como dados do lead, negocios vinculados e enriquecimentos relacionados.
2. Chats sem lead devem continuar com comportamento completo de inbox:
   - aparecer na lista
   - abrir normalmente
   - carregar mensagens
   - exibir badge de nao lidas
   - subir para o topo quando houver atividade recente
   - responder a refresh manual e automatico
   - permitir marcar como lido no CRM e, quando explicitamente acionado, no WhatsApp
3. O estado remoto do WhatsApp e a verdade para inbox. O banco local e complementar.
4. Enviar estado de leitura para o WhatsApp so pode ocorrer pela acao explicita do usuario; refresh, ordenacao e exibicao de unread nao podem disparar isso implicitamente.

## Requisitos funcionais

### 1. Origem remota de unread
- A normalizacao de conversas deve preservar o `unreadCount` retornado pelo `findChats`.
- A inbox unificada deve usar esse `unreadCount` remoto como valor base.
- O unread nao pode depender de `id_lead` para existir.
- A ausencia de `leadMatch` nao pode forcar `unreadCount = 0`.

### 2. Origem remota de recencia e ordenacao
- A normalizacao de conversas deve preservar metadados remotos de atividade, incluindo `updatedAt` quando presente.
- Deve existir um `activityTimestamp` resolvido para cada conversa, derivado por prioridade de campos remotos confiaveis.
- A regra de resolucao deve suportar payloads onde `messageTimestamp` esta nulo no nivel do chat, mas `lastMessage` ou `updatedAt` ainda identificam a atividade mais recente.
- A ordenacao da inbox deve usar esse timestamp resolvido, nao apenas `conv.messageTimestamp ?? 0`.
- Refresh manual e auto-refresh devem produzir a mesma ordenacao com base nessa fonte remota.

### 3. Agregacao de chats duplicados entre instancias
Quando um mesmo telefone for representado por mais de uma conversa em instancias diferentes e a UI os consolidar em uma unica linha:

- o `unreadCount` final deve ser a soma dos `unreadCount` remotos das conversas agregadas
- a `ultimaMensagem` exibida deve ser herdada da conversa com maior `activityTimestamp`
- a posicao da linha na inbox deve seguir o maior `activityTimestamp` entre as conversas agregadas
- os metadados CRM da linha consolidada devem continuar vindo da mesma estrategia ja usada hoje para enriquecimento por telefone/lead, sem afetar o comportamento base da inbox

### 4. Preservacao de preview e coerencia visual
- O preview exibido na inbox deve corresponder a `lastMessage` da conversa lider escolhida pela atividade remota mais recente.
- A lista nao pode manter preview antigo quando outra instancia agregada tiver atividade mais recente.
- A UI deve continuar recebendo dados suficientes para ordenar sem recalcular regras conflitantes no cliente.

### 5. Compatibilidade com o fluxo de leitura
- O contador de nao lidas exibido na inbox representa o estado remoto do WhatsApp.
- O estado `lida_no_crm_em` continua sendo uma concern separada, usada apenas para operacoes e interfaces do CRM.
- Marcar como lido no CRM nao deve apagar nem recalcular indevidamente o unread remoto da inbox.
- O endpoint explicito de marcar como lido no WhatsApp continua sendo a unica acao que pode sincronizar leitura de volta para o provedor.

## Requisitos tecnicos

### 1. Normalizacao de conversas
A camada de tipos e mapeamento da Evolution deve passar a preservar, no minimo:
- `unreadCount`
- `updatedAt`
- `activityTimestamp` resolvido
- campos de identidade ja existentes, incluindo JIDs necessarios para agregacao e abertura correta do chat

A implementacao deve manter compatibilidade com as alteracoes ja abertas da refatoracao `ChatStatusDates`, sem desfazer o diff atual de JID/status/data.

### 2. Refatoracao de `chat-unificado`
`src/lib/chat-unificado.ts` deve:
- parar de inicializar WhatsApp com unread artificialmente zerado como verdade final
- deixar de recalcular unread exclusivamente por `id_lead`
- usar metadados remotos como fonte primaria para `unreadCount` e `ultimaMensagem.timestamp`
- agregar corretamente conversas por telefone usando soma de unread e maximo de atividade
- manter Prisma apenas para enriquecimento CRM e demais dados secundarios

### 3. Alinhamento backend/frontend
- `/api/chat/all` e `/api/chat/stream` devem expor o mesmo comportamento remoto-first.
- O cliente nao deve degradar a ordenacao recebida do backend ao reaplicar uma estrategia fraca de `timestamp ?? 0`.
- Hooks de merge e resort devem consumir o timestamp resolvido retornado pelo backend, preservando a ordenacao apos refresh e SSE.

### 4. Tratamento de tempo
- A implementacao deve deixar explicita a normalizacao entre timestamps em segundos e milissegundos quando necessario.
- O valor usado para ordenacao deve ser consistente em toda a stack.
- Se houver `timestampIso` ou outros campos derivados, eles devem continuar coerentes com o valor numerico usado para ordem.

### 5. Mudanca minima e segura
- Nao ampliar o escopo para sincronizacao massiva de mensagens da instancia inteira.
- Usar `/chat/findChats` como fonte principal da inbox.
- Usar `/chat/findMessages` apenas para abertura do chat ou fallback direcionado quando o resumo remoto vier incompleto.
- Preservar o comportamento existente de recursos CRM onde eles nao conflitam com a nova regra remota-first.

## Casos reais de referencia
A validacao deve considerar explicitamente cenarios como:
- chats sem lead vinculado que possuem unread remoto e hoje aparecem sem badge
- chats recentes com `messageTimestamp` nulo no resumo remoto e que hoje deixam de subir no refresh
- consolidacao do mesmo telefone em mais de uma instancia, onde o unread final deve ser a soma e a ordenacao deve seguir a conversa mais recente
- a instancia `hype_lima_pessoal` como referencia real para testes de comportamento da inbox

## Criterios de aceitacao
1. Um chat WhatsApp sem `leadMatch` pode aparecer com `unreadCount > 0` quando o resumo remoto assim indicar.
2. Chats sem lead continuam abrindo, carregando mensagens e respondendo a refresh manual/automatico normalmente.
3. A inbox reordena corretamente quando o resumo remoto indica atividade mais recente, mesmo se `messageTimestamp` do chat estiver nulo e a recencia vier de outro campo remoto resolvido.
4. Em chats agregados por telefone entre multiplas instancias, o `unreadCount` exibido e a soma remota das conversas agregadas.
5. Em chats agregados por telefone entre multiplas instancias, a linha exibida usa a conversa de maior recencia remota como base para preview e posicao.
6. A ausencia de `id_lead` nao zera mais o unread da inbox.
7. O banco local continua disponivel para enriquecimento CRM e rastreamento de leitura no CRM, sem substituir a verdade remota da inbox.
8. Nenhum refresh de inbox envia automaticamente confirmacao de leitura para o WhatsApp.
9. O comportamento de chats normais nao agregados e com `@s.whatsapp.net` continua funcional.
10. A validacao final do projeto passa com `npm run pm2:prod`.

## Fora de escopo
- Reescrever o fluxo completo de persistencia de mensagens.
- Alterar a regra de negocio de vinculo CRM alem do necessario para remover a dependencia indevida do unread.
- Implementar sincronizacao global de mensagens apenas para sustentar a lista da inbox.
- Mudar a semantica do botao explicito de marcar como lido no WhatsApp.