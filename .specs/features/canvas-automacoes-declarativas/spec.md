# Canvas de Automações Declarativas Specification

## Problem Statement

O módulo atual de automações resolve um caso importante do domínio HYPE CRM, mas está centrado em um wizard linear e em regras especializadas de WhatsApp + mudança de estágio. O próximo passo precisa entregar um editor visual de fluxos sem criar uma engine pesada demais, sem duplicar regras entre UI e backend e sem forçar big refactor agora.

## Goals

- [ ] Permitir criação e edição de automações em canvas visual, com UX simples para equipe não técnica.
- [ ] Compartilhar o mesmo contrato declarativo entre editor, validação e runtime.
- [ ] Preservar o padrão do projeto: `src/modules/*` para UI, `src/lib/*` para domínio/server e `src/app/api/**/route.ts` para endpoints.
- [ ] Publicar apenas versões válidas e executar sempre a versão publicada, nunca o rascunho em edição.
- [ ] Evoluir a base atual de eventos/agendamentos sem reescrever toda a automação existente.

## Out of Scope

Explicitar o que fica fora da V1 evita escopo inflado e dívida técnica disfarçada de ambição.

| Item fora de escopo | Motivo |
| --- | --- |
| Múltiplos gatilhos por fluxo | Multiplica validação e UX cedo demais |
| Loops e ciclos | Aumentam complexidade de runtime, debug e publish |
| Subflows e templates marketplace | Melhor deixar para fase posterior |
| Webhooks genéricos e integrações arbitrárias | Escopo de plataforma, não de feature V1 |
| IA dentro do fluxo | Alto custo de produto e observabilidade |
| Worker dedicado com Redis/BullMQ | Não é necessário no estágio atual do produto |
| Editor mobile completo | V1 deve ser desktop-first no canvas |

---

## User Stories

### P1: Criar e publicar uma automação visual simples ⭐ MVP

**User Story**: Como gerente ou empresa, quero montar uma automação em canvas com 1 gatilho e poucas ações para automatizar rotinas de CRM sem depender de código.

**Why P1**: É o menor recorte que entrega valor real, valida a UX do canvas e cria a base declarativa para evoluções futuras.

**Acceptance Criteria**:

1. WHEN o usuário abrir uma automação nova THEN o sistema SHALL exibir um canvas vazio com CTA claro para adicionar o gatilho inicial.
2. WHEN o usuário adicionar nós suportados e preencher suas configurações THEN o sistema SHALL salvar um rascunho sem publicar automaticamente.
3. WHEN o usuário tentar publicar um fluxo inválido THEN o sistema SHALL bloquear a publicação e destacar os erros estruturais e de configuração.
4. WHEN o usuário publicar um fluxo válido THEN o sistema SHALL criar uma versão imutável e marcá-la como ativa para execução.

**Independent Test**: Criar um fluxo `lead.stage.changed -> send_whatsapp`, publicar e confirmar que a versão publicada fica disponível para execução sem depender do wizard legado.

---

### P1: Editar rascunho sem quebrar a automação ativa ⭐ MVP

**User Story**: Como operador, quero continuar editando o rascunho de uma automação já publicada sem afetar as execuções da versão ativa.

**Why P1**: Sem separação entre draft e published, o editor gera execuções imprevisíveis e alto risco operacional.

**Acceptance Criteria**:

1. WHEN o usuário abrir uma automação publicada para edição THEN o sistema SHALL carregar o rascunho editável separadamente da versão ativa.
2. WHEN o usuário salvar alterações no rascunho THEN o sistema SHALL preservar a versão publicada anterior até uma nova publicação.
3. WHEN uma automação estiver executando enquanto o rascunho é alterado THEN o sistema SHALL manter a execução presa à versão publicada usada no disparo.

**Independent Test**: Publicar uma versão, alterar o rascunho e confirmar que novas execuções continuam usando a versão antiga até nova publicação.

---

### P1: Executar o fluxo publicado via evento interno ⭐ MVP

**User Story**: Como sistema, quero reagir a eventos internos do CRM e percorrer o grafo publicado para executar ações do domínio de forma previsível.

**Why P1**: Sem runtime conectado ao domínio atual, o canvas vira apenas UI bonita sem automação real.

**Acceptance Criteria**:

1. WHEN um evento `lead.stage.changed` ocorrer THEN o sistema SHALL localizar automações ativas compatíveis da empresa.
2. WHEN o trigger publicado combinar com o evento THEN o sistema SHALL percorrer o grafo a partir do gatilho e executar cada nó suportado.
3. WHEN o fluxo incluir uma condição THEN o sistema SHALL escolher apenas a saída compatível (`true` ou `false`).
4. WHEN uma ação falhar THEN o sistema SHALL registrar a falha na execução com mensagem resumida e contexto suficiente para diagnóstico.

**Independent Test**: Disparar mudança de estágio em lead de teste e verificar execução registrada com trilha resumida dos nós percorridos.

---

### P2: Consultar execuções e trilha resumida

**User Story**: Como gestor, quero acompanhar execuções recentes da automação para entender sucesso, falhas e contexto de disparo.

**Why P2**: Observabilidade reduz suporte manual e acelera debug funcional do módulo.

**Acceptance Criteria**:

1. WHEN o usuário abrir a área de execuções de uma automação THEN o sistema SHALL listar execuções recentes com status, gatilho e horário.
2. WHEN o usuário abrir uma execução THEN o sistema SHALL mostrar trilha resumida dos nós processados e erro curto quando houver falha.

**Independent Test**: Executar uma automação com sucesso e outra com falha controlada e comparar os dois logs na UI.

---

### P2: Conviver com o legado durante a transição

**User Story**: Como time de produto, quero introduzir o editor visual sem quebrar o módulo atual nem forçar migração instantânea das automações legadas.

**Why P2**: O projeto não quer big refactor agora; coexistência reduz risco de rollout.

**Acceptance Criteria**:

1. WHEN a feature for habilitada em beta THEN o sistema SHALL manter o wizard legado disponível como fallback enquanto o canvas estabiliza.
2. WHEN uma automação ainda for legada THEN o sistema SHALL continuar executando pelo fluxo atual sem regressão funcional.

**Independent Test**: Manter pelo menos uma automação legada funcionando enquanto uma nova automação em canvas é criada e publicada.

---

### P3: Gestão mobile leve

**User Story**: Como usuário mobile, quero visualizar status, ativar/desativar e fazer ajustes simples sem depender de um editor full mobile.

**Why P3**: Faz sentido como extensão de produto, mas não deve direcionar a V1 do canvas.

**Acceptance Criteria**:

1. WHEN o usuário acessar a listagem em mobile THEN o sistema SHALL manter gestão básica de status e navegação.
2. WHEN o usuário abrir o editor em mobile THEN o sistema SHALL privilegiar visualização e pequenos ajustes, não criação pesada.

---

## Edge Cases

- WHEN o fluxo tiver zero triggers ou mais de um trigger THEN o publish SHALL falhar.
- WHEN existir nó órfão ou caminho desconectado THEN o validator SHALL bloquear a publicação.
- WHEN um `kind` não existir no registry THEN o sistema SHALL tratar a automação como inválida e impedir publish/execução.
- WHEN o autosave falhar THEN a UI SHALL manter estado local, informar erro e permitir retry sem perder edição.
- WHEN um nó que não é `condition` tentar ter múltiplas saídas THEN o validator SHALL rejeitar o grafo.
- WHEN um ciclo for criado THEN o validator SHALL bloquear o fluxo na V1.

---

## Requirement Traceability

| Requirement ID | Story | Status |
| --- | --- | --- |
| AUTO-CANVAS-01 | P1 criar fluxo visual vazio com CTA de gatilho | Approved |
| AUTO-CANVAS-02 | P1 salvar rascunho do canvas | Approved |
| AUTO-CANVAS-03 | P1 validar fluxo antes de publicar | Approved |
| AUTO-CANVAS-04 | P1 versionar publicação de forma imutável | Approved |
| AUTO-CANVAS-05 | P1 separar rascunho da versão ativa | Approved |
| AUTO-CANVAS-06 | P1 executar evento `lead.stage.changed` contra versão publicada | Approved |
| AUTO-CANVAS-07 | P1 suportar ações iniciais do domínio HYPE | Approved |
| AUTO-CANVAS-08 | P2 exibir execuções e trilha resumida | Approved |
| AUTO-CANVAS-09 | P2 coexistir com wizard/execução legados | Approved |
| AUTO-CANVAS-10 | P3 manter gestão mobile leve | Approved |

**Coverage**: 10 requisitos totais, 10 previstos no design/tarefas, 0 sem mapeamento.

---

## Success Criteria

- [ ] O usuário cria e publica um fluxo V1 sem sair do canvas.
- [ ] O runtime executa a versão publicada sem depender do rascunho editável.
- [ ] O módulo continua alinhado ao padrão do projeto e sem arquivos monolíticos.
- [ ] O legado segue funcional durante o rollout beta.
- [ ] Cada execução relevante fica observável por status, gatilho e trilha resumida.
