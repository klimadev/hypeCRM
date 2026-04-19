---
plan name: ChatRefactor
plan description: Invisible remote-first redesign
plan status: active
---

## Idea
Refatorar o módulo `/chat` de forma completa, mas com disciplina de escopo e arquitetura. A solução deve tornar a Evolution API a fonte primária de verdade para inbox, mensagens, status de leitura e estado de conexão, enquanto o CRM permanece apenas como camada de enriquecimento contextual. O redesenho de UX deve seguir princípios consagrados de Don Norman, Jakob Nielsen, Steve Krug, Luke Wroblewski e Ben Shneiderman: visibilidade clara do estado do sistema, redução de carga cognitiva, reconhecimento em vez de memorização, progressive disclosure, consistência, prevenção de erro, tolerância a falhas e foco no fluxo principal de uso. O objetivo não é apenas reorganizar componentes, mas simplificar a experiência operacional: encontrar conversa, entender contexto, ler histórico, responder e executar ações secundárias sem poluir a interface principal. O plano deve cobrir backend, contratos de identidade/JID, normalização, unread/read, ordenação, UX desktop/mobile, composição de componentes, estados do frontend e validação end-to-end.

## Implementation
- Consolidar o contrato canônico do chat mapeando `chat-module-study-case.md` e os specs existentes para um conjunto único de regras de produto, identidade, leitura, ordenação, status e tolerância a payloads variáveis.
- Definir a arquitetura de informação e o fluxo operacional alvo de `/chat` para desktop e mobile, priorizando o trabalho principal do operador e movendo CRM, follow-up e automações para disclosure progressivo.
- Redesenhar a fundação de dados remote-first do WhatsApp com identidade explícita de conversa (`remoteJid`, `remoteJidAlt`, lookup, canonical, telefone), fallbacks corretos de timestamp/activity e normalização unificada de mensagens e conversas.
- Refatorar o backend do chat para separar claramente fetch remoto, resolução de identidade, agregação/deduplicação entre instâncias, enrichment de CRM e operações explícitas como `mark as read` e `connection state`.
- Refatorar o estado do frontend quebrando o orquestrador atual em responsabilidades menores para inbox, seleção/navegação, contexto CRM e ações da conversa, reduzindo acoplamento entre dados e apresentação.
- Recompor a interface principal com sidebar enxuta, item de conversa menos denso, painel de conversa centrado em leitura/resposta, painel contextual secundário e composer simplificado com ações avançadas sob demanda.
- Fechar lacunas funcionais e de feedback visual: paginação histórica real, status de mensagem acessíveis, CTWA visível quando relevante, estado de conexão da instância distinto do SSE local e tratamento claro de erros/reconexão.
- Validar o refactor por cenários críticos cobrindo inbox, abertura de conversa com `@lid`, envio, marcação explícita como lida, ordenação/unread entre instâncias duplicadas, reconexão e consistência entre stream e carregamento inicial.

## Required Specs
<!-- SPECS_START -->
- ChatRefactorFeature
<!-- SPECS_END -->