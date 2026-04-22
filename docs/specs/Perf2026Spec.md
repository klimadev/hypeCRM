# Spec: Perf2026Spec

Scope: feature

# Perf2026 Feature Spec

## Objetivo
Modernizar a performance real e percebida do hypeCRM usando padrões nativos e atuais de React 19+ e Next.js 16+, priorizando a trilha crítica operacional do produto. O foco inicial é o módulo de chat, com propagação obrigatória dos padrões de responsividade, optimistic UI, streaming, cache seguro e feedback perceptivo para módulos dependentes e adjacentes.

## Visão Refinada
O sistema deve parecer instantâneo sem mascarar latência real. A interface precisa reduzir trabalho síncrono no cliente, minimizar custo de reconciliação e renderização, diminuir fetches redundantes, tornar atualizações não urgentes interrompíveis e manter feedback visual imediato e consistente em toda a operação.

## Escopo Inicial
- Otimizar inbox e thread do chat como trilha crítica.
- Corrigir pipeline de busca, filtro e ordenação para usar priorização moderna de updates.
- Melhorar fusão de mensagens e carregamento incremental para reduzir custo computacional em conversas longas.
- Tornar realtime mais inteligente com comportamento sensível à visibilidade da aba.
- Aplicar padrões consistentes de estados de loading, sync, erro, sucesso e otimista.
- Avaliar e aplicar App Router streaming e cache seletivo/privado apenas onde for seguro em ambiente multi-tenant.

## Fora de Escopo
- Reescrita ampla de arquitetura sem ganho direto de performance.
- Introdução de bibliotecas pesadas quando APIs nativas ou stack atual resolverem melhor.
- Cache público para dados multi-tenant ou dados personalizados por empresa/usuário.
- Mudanças de design cosméticas sem impacto funcional ou perceptivo relevante.

## Hotspots Confirmados
- `src/modules/chat/hooks/use-chat-module.ts`: existe `buscaDebounced`, mas não há atualização efetiva dela; a busca remota não entra como deveria e o filtro pesado fica concentrado no cliente.
- `src/modules/chat/hooks/use-chat-messages.ts`: fusão de mensagens usa busca linear dentro do processo de merge, degradando em conversas grandes.
- `src/modules/chat/components/chat-message-list.tsx`: mídia pode disparar fetch por montagem de bolha, ampliando waterfall de requests.
- `src/app/api/chat/stream/route.ts` e `src/app/api/chat/messages/stream/route.ts`: polling SSE fixo com oportunidade de adaptação por visibilidade.
- `next.config.ts`: `cacheComponents` está desabilitado; qualquer adoção de cache deve ser deliberada e segura.

## Diretrizes Técnicas
- Usar `useDeferredValue` para digitação e filtragem de listas quando houver custo perceptível no cliente.
- Usar `startTransition` para updates não urgentes de listas, ordenações, trocas de contexto e refreshes que não devem bloquear interação.
- Usar `useOptimistic` para mutações operacionais onde feedback imediato reduz atrito e rollback seja seguro.
- Usar `useEffectEvent` em handlers de efeitos/listeners quando isso evitar re-subscribe desnecessário e closures obsoletas.
- Preferir streaming com `loading.tsx` e `Suspense` em App Router para shell rápido e carregamento progressivo.
- Aplicar `use cache`, `cacheLife`, `cacheTag` ou cache privado somente em dados compatíveis com isolamento multi-tenant.
- Reduzir trabalho por render e evitar reprocessamentos completos em listas longas.
- Manter animações funcionais, nunca decorativas, e sempre subordinadas à fluidez percebida.

## Mapa de Herança Obrigatória
- Chat inbox
- Thread de mensagens
- Mensagens agendadas
- Upload e preview de mídia
- Infra de SSE/realtime
- Route handlers do chat
- Shells e loading boundaries do App Router
- Kanban e interações otimistas reutilizáveis
- Logs e auditoria de eventos operacionais
- Componentes compartilhados de feedback visual

## Requisitos Funcionais
- Digitação em busca e filtros deve permanecer fluida mesmo com listas maiores.
- A troca de conversa não deve reaproveitar estado visual de forma incorreta entre threads.
- Mensagens otimistas devem confirmar, falhar ou fazer rollback de forma previsível.
- Realtime deve reduzir trabalho quando a aba estiver em background e sincronizar rapidamente ao retomar foco.
- Carregamento de mídia deve priorizar viewport e evitar cascata desnecessária de requests.
- Estados de loading e sync devem comunicar progresso imediato em menos de 100ms perceptivos.

## Requisitos Não Funcionais
- Preservar isolamento multi-tenant.
- Preservar consistência visual dark premium operacional do projeto.
- Evitar regressões em mobile e desktop.
- Evitar dependências adicionais quando o navegador, React ou Next já oferecerem a capacidade necessária.
- Manter diffs pequenos e orientados a hotspots reais.

## Critérios de Aceitação
- Busca e filtragem do chat usam priorização moderna e não bloqueiam a interação principal.
- O custo de merge de mensagens é reduzido e não degrada de forma acentuada em threads maiores.
- Realtime do chat deixa de operar de forma cega em background quando aplicável.
- Carregamento de mídia é mais incremental e menos redundante.
- Os padrões de perceived performance ficam consistentes entre chat, agendamento e módulos operacionais relacionados.
- O sistema valida com `npm run pm2:prod` ao final.

## Riscos
- Cache incorreto em contexto multi-tenant.
- Ganho apenas cosmético sem redução do trabalho real.
- Regressões de sincronização entre estado otimista e SSE.
- Excesso de complexidade para ganhos marginais se a solução fugir do caminho mínimo.

## Estratégia de Validação
- Revisão de hotspots por código após cada mudança relevante.
- Build final obrigatório com `npm run pm2:prod`.
- Verificação manual dos fluxos críticos impactados: inbox, abertura de thread, envio de mensagem, agendamento, refresh/realtime e estados de loading/sync.

## Decisão Arquitetural
Priorizar mudanças pequenas e corretas, centradas em chat e infraestrutura compartilhada, propagando apenas os padrões que comprovadamente melhorem desempenho real e percepção do usuário.