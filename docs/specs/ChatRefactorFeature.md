# Spec: ChatRefactorFeature

Scope: feature

# ChatRefactor Feature Spec

## Purpose
Refatorar o módulo `/chat` de ponta a ponta para que a experiência principal de atendimento seja simples, previsível e eficiente, com WhatsApp/Evolution como fonte primária de verdade e o CRM atuando apenas como enriquecimento contextual. A solução deve reduzir carga cognitiva, remover ambiguidade operacional e consolidar fluxos técnicos hoje fragmentados entre múltiplos caminhos de identidade, normalização, leitura e composição de UI.

## Product Intent
O objetivo do operador no `/chat` é executar um fluxo central e recorrente:
1. Encontrar uma conversa.
2. Entender rapidamente quem é o contato e o estado atual.
3. Ler o histórico sem ruído.
4. Responder com segurança e rapidez.
5. Acessar contexto e ações secundárias apenas quando necessário.

A interface deve servir esse fluxo principal primeiro. Qualquer ação secundária que não seja essencial para ler/responder não deve competir visualmente com a tarefa principal.

## UX Principles
Esta feature deve seguir princípios consolidados de UX/UI, principalmente:

### Don Norman
- Tornar a ação principal óbvia.
- Oferecer feedback claro e imediato após ações críticas.
- Reduzir a distância entre intenção do operador e efeito percebido na tela.
- Projetar para erro tolerante: stream pode cair, payload pode variar, conexão pode oscilar.

### Jakob Nielsen
- Visibilidade do estado do sistema: conexão, carregamento, erro, envio pendente, leitura.
- Compatibilidade com o mundo real: conversa deve parecer conversa, não painel administrativo excessivo.
- Consistência e padrões: mesmos significados para badges, timestamps, status e ações.
- Prevenção de erro: evitar marcar lido automaticamente, evitar abrir conversa errada por identidade fraca.
- Reconhecimento em vez de memorização: contexto importante visível sem exigir lembrança do operador.
- Estética e design minimalista: remover densidade informacional não essencial.

### Steve Krug
- O operador não deve precisar “pensar sobre a interface” para localizar conversa, entender contexto e responder.
- Escaneabilidade alta na inbox.
- Menos elementos simultâneos por área.

### Luke Wroblewski
- Progressive disclosure, especialmente no mobile.
- O caminho principal deve ser fluido com o mínimo de interrupções.

### Ben Shneiderman
- Feedback informativo em todas as ações principais.
- Respostas rápidas e previsíveis.
- Ações explícitas e reversíveis quando aplicável.

## Canonical Source Of Truth
O documento `chat-module-study-case.md` é a principal fonte funcional desta refatoração. Os specs existentes devem ser tratados como complementares, sem contradizer o estudo de caso.

Regras canônicas:
- WhatsApp/Evolution é a fonte de verdade para inbox, ordem, unread, histórico e read state.
- CRM nunca redefine unread, ordering ou leitura do canal.
- O sistema deve tolerar múltiplos formatos de payload remoto.
- A identidade de conversa deve considerar `remoteJid` e `remoteJidAlt`, com preferência para o identificador alternativo quando ele representar melhor a conversa real.
- A normalização deve consolidar texto, status, timestamps, mídia e CTWA de forma robusta e reutilizável.
- Marcação de leitura é explícita e best-effort.
- Abertura da conversa não deve marcar automaticamente como lida.

## In Scope
- Redesenho estrutural do `/chat` desktop e mobile.
- Reorganização de responsabilidades entre sidebar, painel de conversa, painel contextual e composer.
- Refatoração da base remote-first para inbox e mensagens WhatsApp.
- Unificação da identidade de conversa.
- Unificação da normalização de mensagens.
- Revisão do fluxo de unread/order/read.
- Exposição clara do estado de conexão da instância.
- Simplificação do composer com ações avançadas sob demanda.
- Ajuste de paginação de histórico e feedback visual de status.
- Exposição contextual de CTWA quando relevante.

## Out Of Scope
- Redefinir o CRM como produto independente.
- Reescrever funcionalidades de Instagram além do necessário para manter compatibilidade estrutural.
- Introduzir automações novas não previstas no estudo de caso.
- Adicionar novas integrações externas.
- Migrar arquitetura global do app fora do domínio `/chat` sem necessidade direta.

## Functional Requirements

### 1. Inbox / Conversation List
A inbox deve:
- Exibir lista de conversas ordenada pelo evento mais recente confiável vindo da fonte remota.
- Permitir busca rápida.
- Permitir filtro de não lidas sem conflitar com outros filtros redundantes.
- Exibir nome, preview, timestamp, unread e um conjunto mínimo de sinais secundários.
- Manter CRM apenas como enriquecimento sutil.
- Preservar consistência ao agregar conversas duplicadas entre instâncias.

### 2. Conversation Identity
Toda conversa WhatsApp deve carregar um modelo de identidade explícito, contendo no mínimo:
- `instanceName`
- `remoteJid`
- `remoteJidAlt` quando houver
- `lookupRemoteJid`
- forma canônica/normatizada
- `telefone` normalizado quando derivável

Esse modelo deve ser compartilhado por:
- inbox
- abertura de conversa
- carregamento de mensagens
- stream de mensagens
- envio
- marcação como lida
- deduplicação/agregação

### 3. Message History
A conversa deve:
- Buscar histórico remoto de forma tolerante a payloads variáveis.
- Deduplicar por `key.id`.
- Extrair texto conforme o tipo real da mensagem.
- Preservar mídia e placeholders coerentes.
- Consolidar o status mais forte a partir de updates da mensagem.
- Aceitar timestamps em formatos mistos (segundos, strings, ISO, vazios com fallback robusto).
- Permitir paginação histórica real na interface.

### 4. Send Message
O envio deve:
- Ser otimista, mas seguro.
- Usar a identidade correta da conversa.
- Colapsar mensagem otimista na mensagem real quando o retorno/stream confirmar equivalência.
- Exibir estados claros de pendente, enviada, entregue, lida ou erro.

### 5. Mark As Read
A marcação como lida deve:
- Ser explícita, nunca automática ao abrir conversa.
- Aparecer apenas quando fizer sentido, especialmente em WhatsApp com `unreadCount > 0`.
- Operar com base nas mensagens remotas reais da conversa atual.
- Ser best-effort: falhas devem ser comunicadas sem quebrar a conversa.
- Não depender de banco local como fonte primária das mensagens a serem marcadas.

### 6. Connection Status
A interface deve expor claramente o estado da instância no canal, distinguindo:
- conexão da instância com a Evolution/WhatsApp
- estado do stream/SSE local da tela

Esses estados não podem ser apresentados como se fossem equivalentes.

### 7. CTWA / Origem De Conversa
Quando existir metadado de origem de anúncio ou contexto CTWA:
- o sistema deve preservá-lo na normalização
- a UI deve exibi-lo apenas quando for relevante e útil
- a informação deve estar em área contextual, não poluindo a leitura principal

## Information Architecture
A estrutura alvo da interface deve seguir este modelo:

### Desktop
- Coluna 1: inbox
- Coluna 2: conversa ativa
- Coluna 3: contexto secundário

### Mobile
- Navegação por camadas: inbox -> conversa -> contexto
- Sem tentar manter três áreas simultaneamente visíveis

### Sidebar / Inbox
Deve conter prioritariamente:
- busca
- filtro principal
- lista de conversas
- paginação/carregar mais

Não deve concentrar múltiplas barras, chips e comandos redundantes competindo entre si.

### Conversation Header
Deve priorizar:
- identidade do contato
- estado essencial (conexão, unread quando relevante)
- ações primárias mínimas

Não deve ser um centro de operações cheio de ações CRM, automação e transferência ao mesmo tempo.

### Message Area
Deve priorizar leitura:
- separadores de data claros
- status legíveis
- tratamento consistente de mídia
- estados vazios/erro/reconexão compreensíveis

### Composer
Deve priorizar envio de texto.
Ações avançadas como agendamento, atalhos, templates e follow-up devem ficar disponíveis sob demanda, sem dominar o layout base.

### Context Panel
Deve reunir, quando aplicável:
- lead
- negócio
- origem/CTWA
- transferência
- ações CRM secundárias
- follow-up

## Technical Architecture Requirements

### 1. Remote-First Aggregation
O pipeline de inbox deve ser reorganizado em camadas lógicas:
- fetch remoto
- normalização
- resolução de identidade
- deduplicação/agregação entre instâncias
- enrichment CRM
- montagem final de DTO

Essas camadas não devem ficar misturadas em um fluxo monolítico difícil de verificar.

### 2. Single Normalization Path
Deve existir um caminho principal e reutilizável de normalização para mensagens/conversas WhatsApp.
Não é aceitável manter múltiplos caminhos divergentes para extração de texto, status, timestamps e CTWA sem necessidade forte.

### 3. Timestamp Discipline
A ordenação deve usar o melhor timestamp confiável disponível, com fallback explícito e consistente.
Valores vazios ou `0` não devem bloquear fallbacks mais úteis como `updatedAt`.

### 4. Identity Discipline
Nenhum fluxo crítico deve “inventar” lookup JID de forma simplista quando a conversa possuir `remoteJidAlt` ou outra identidade mais precisa.

### 5. Frontend State Boundaries
A camada de estado do frontend deve ser separada por responsabilidade:
- estado da inbox
- estado da seleção/navegação
- estado da conversa/mensagens
- estado contextual de CRM
- estado de ações secundárias

Hooks e componentes muito amplos devem ser quebrados quando misturarem múltiplos domínios de responsabilidade.

### 6. Progressive Disclosure
A simplificação da UI não significa remoção cega de funcionalidade. Significa:
- manter o fluxo principal limpo
- deslocar ações menos frequentes para menus, painéis ou contextos secundários
- reduzir densidade sem reduzir capacidade operacional

## Implementation Strategy
A implementação deve seguir esta ordem de risco/controlabilidade:

1. Consolidar contrato e modelo de identidade.
2. Corrigir fundação remote-first de inbox e mensagens.
3. Ajustar `mark as read`, ordering, unread e timestamps.
4. Reestruturar hooks e composição de estado no frontend.
5. Reorganizar layout e hierarquia visual.
6. Reintroduzir ações avançadas sob disclosure progressivo.
7. Validar cenários críticos e regressões.

## Acceptance Criteria
A feature só pode ser considerada pronta quando:

### UX / UI
- A sidebar estiver visualmente mais simples e cognitivamente mais leve.
- O item de conversa exibir menos ruído sem perder sinais essenciais.
- O header da conversa estiver focado em contexto principal.
- O composer estiver claramente centrado em escrever/enviar.
- CRM/follow-up/transferência estiverem acessíveis, porém fora do caminho principal.
- O mobile funcionar por progressão natural de telas/camadas.

### Functional
- Inbox usar verdade remota para unread e ordenação.
- Conversas com `@lid` abrirem corretamente e carregarem histórico real.
- `remoteJidAlt` ser respeitado quando necessário.
- Histórico tolerar payloads variáveis sem perder mensagens.
- Envio otimista reconciliar corretamente com stream/resposta real.
- `mark as read` operar sem depender de DB local como fonte principal.
- Estado de conexão da instância ser exibido separadamente do estado do SSE.
- CTWA aparecer quando relevante.
- Paginação histórica estar conectada de ponta a ponta.
- Status de mensagem distinguirem pelo menos pendente, enviada, entregue, lida e erro de maneira acessível.

### Engineering
- Responsabilidades principais ficarem mais separadas no código.
- Não existir duplicação relevante de normalização crítica.
- O fluxo de identidade ser reutilizável e verificável.
- O código ficar mais fácil de inspecionar, testar e evoluir.

## Risks
- Deduplicação multi-instância pode produzir regressão se identidade e agregação não forem migradas de ponta a ponta.
- Simplificação da UI pode esconder demais ações críticas se o disclosure progressivo for mal calibrado.
- Ajustes de read/unread podem revelar inconsistências históricas no stream e no snapshot inicial.
- Remover caminhos paralelos de normalização exige cuidado para não perder tratamento de payloads edge-case já cobertos localmente.

## Guardrails
- Não reintroduzir o CRM como fonte de verdade do chat.
- Não confundir estado de canal com estado de transporte local da tela.
- Não adicionar novos painéis ou comandos simultâneos sem justificativa clara.
- Não aceitar fallback de identidade fraco quando houver identidade remota melhor.
- Não usar simplificação visual para mascarar ausência de feedback operacional.

## Validation Scenarios
No mínimo, validar:
- inbox inicial com ordenação correta
- filtro de não lidas
- busca
- abertura de conversa remota normal
- abertura de conversa com `@lid`
- paginação para mensagens antigas
- envio bem-sucedido
- envio com falha
- stream reconectando
- marcação explícita como lida
- agregação entre instâncias duplicadas
- visualização de CTWA quando presente
- distinção entre conexão da instância e SSE local
- navegação mobile entre inbox, conversa e contexto

## Non-Goals
- Não perseguir perfeccionismo visual desnecessário antes da fundação de dados estar correta.
- Não expandir escopo para features novas que não contribuam diretamente para clareza, confiabilidade e eficiência do fluxo atual.
- Não resolver dívidas técnicas genéricas fora da área do chat sem relação direta com o refactor.

## Definition Of Done
O refactor estará concluído quando a base técnica remote-first estiver coerente, a UI refletir a hierarquia correta da tarefa principal, os fluxos críticos estiverem validados e o módulo `/chat` estiver visivelmente mais simples de operar e mais confiável de manter.