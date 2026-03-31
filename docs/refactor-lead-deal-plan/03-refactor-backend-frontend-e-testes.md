# Refactor de Backend, Frontend e Testes

## 1. Servicos de dominio que devem existir antes das rotas novas

Criar uma camada de servicos compartilhados. Nao duplicar regra de negocio dentro das rotas.

Arquivos recomendados:

- `src/lib/domains/leads.ts`
- `src/lib/domains/negocios.ts`
- `src/lib/domains/funis.ts`

Funcoes minimas:

- `criarLeadContato()`
- `atualizarLeadContato()`
- `criarNegocio()`
- `criarLeadComNegocioInicial()`
- `moverNegocioDeEstagio()`
- `reatribuirNegocio()`
- `montarDtoKanbanNegocios()`

## 2. Separacao final das APIs

## `Lead API`

Responsabilidade: contato, owner do contato, dados persistentes, chat e historico de negocios.

Rotas finais recomendadas:

- `GET /api/leads`
- `POST /api/leads`
- `GET /api/leads/[id]`
- `PATCH /api/leads/[id]`
- `GET /api/leads/[id]/negocios`
- `POST /api/leads/[id]/negocios`

Payload de `Lead` nao deve aceitar:

- `id_estagio`
- `valor_oportunidade`
- `probabilidade`
- `motivo_perda`

## `Negocio API`

Responsabilidade: oportunidade comercial.

Rotas finais recomendadas:

- `GET /api/negocios`
- `POST /api/negocios`
- `GET /api/negocios/[id]`
- `PATCH /api/negocios/[id]`
- `PATCH /api/negocios/[id]/mover`
- `GET /api/negocios/kanban?funilId=...`
- `GET /api/negocios/sync?funilId=...`
- `GET /api/negocios/[id]/parcelas`
- `POST /api/negocios/[id]/parcelas`
- `GET /api/negocios/[id]/produtos`
- `POST /api/negocios/[id]/produtos`

## `Funil API`

Rotas recomendadas:

- `GET /api/funis`
- `POST /api/funis`
- `PATCH /api/funis/[id]`
- `GET /api/funis/[id]/estagios`

## Compatibilidade temporaria

Durante a transicao:

- `/api/leads/[id]/mover` deve ser marcado como legado e removido do frontend
- `/api/leads` nao deve mais ser usado como endpoint de board

## 3. Regras de permissao novas

Adicionar helper dedicado:

- `whereNegociosPorPerfil(sessao)`

Regras:

- `COLABORADOR`: ve negocios em que `Negocio.id_funcionario = sessao.id_usuario`
- `GERENTE`: ve negocios do proprio PDV
- `EMPRESA`: ve tudo da empresa

Para `Lead`, recomendacao:

- `COLABORADOR` pode ver o lead se for owner do contato **ou** responsavel por ao menos um negocio ligado a esse lead
- `GERENTE` pode ver leads do proprio PDV

## 4. Refactor do Kanban

O modulo pode continuar em `src/modules/kanban`, mas as tipagens internas devem ser trocadas para negocio.

### Tipos novos no frontend

Substituir o tipo atual `Lead` do board por algo como:

- `NegocioKanbanCard`
- `LeadResumo`
- `FunilResumo`
- `EstagioResumo`

O card do Kanban deve exibir:

- `negocio.titulo`
- `lead.nome`
- `lead.telefone`
- `produto principal` se houver
- `valor estimado ou fechado`
- `responsavel`
- `estagio atual`

### Hooks do Kanban impactados

Arquivos atuais que precisam ser refatorados:

- `src/modules/kanban/hooks/use-kanban-dados.ts`
- `src/modules/kanban/hooks/use-kanban-derivacoes.ts`
- `src/modules/kanban/hooks/use-kanban-movimentacao.ts`
- `src/modules/kanban/hooks/use-kanban-detalhes-lead.ts`
- `src/modules/kanban/hooks/use-kanban-operacoes.ts`
- `src/modules/kanban/hooks/use-kanban-realtime.ts`

Direcao da mudanca:

- board carrega negocios, nao leads
- agrupamento por estagio usa `negocio.id_estagio`
- filtros e ordenacao operam em negocio
- realtime usa `Negocio.atualizado_em`
- criacao rapida do board cria `Lead + Negocio inicial`

### Header do Kanban

Arquivo atual:

- `src/modules/kanban/components/kanban-header.tsx`

Mudancas obrigatorias:

- adicionar seletor de `Funil`
- formulario "Novo lead" vira formulario "Novo contato + negocio"
- opcao secundaria para criar so contato

## 5. Drawer/modal de Negocio

Criar um componente dedicado, por exemplo:

- `src/modules/kanban/components/negocio-details-drawer.tsx`

Esse drawer deve conter apenas contexto comercial:

- titulo do negocio
- lead vinculado
- funil
- estagio
- status
- responsavel
- valor estimado
- valor fechado
- motivo de perda
- observacoes comerciais
- abas de `Parcelas` e `Produtos`

O chat nao deve mais ser a aba principal deste drawer, porque chat e contexto de contato.

## 6. Pagina de detalhes do Lead

Criar rota/modulo seguindo MVVM:

- `src/app/(dashboard)/leads/[id]/page.tsx`
- `src/modules/leads-detalhes/page.tsx`
- `src/modules/leads-detalhes/hooks/use-lead-detalhes.ts`
- `src/modules/leads-detalhes/components/*`

Conteudo minimo da pagina:

- bloco superior com dados estaticos do contato
- bloco de ownership/PDV do contato
- historico em tabela de todos os negocios do lead
- CTA "Criar novo negocio"
- CTA "Abrir chat"

Tabela de historico recomendada:

- `titulo`
- `funil`
- `estagio`
- `status`
- `produto`
- `responsavel`
- `valor`
- `aberto em`
- `fechado em`

## 7. Parcelas e produtos

### Parcelas

Arquivos impactados:

- `src/app/api/parcelas/route.ts`
- `src/app/api/parcelas/[id]/pagar/route.ts`
- `src/lib/api/parcelas.ts`
- `src/modules/kanban/hooks/use-lead-parcelas.ts`

Direcao:

- trocar payloads de `id_lead` para `id_negocio`
- manter o `Lead` apenas como detalhe relacionado para exibicao

### Produtos

Arquivos impactados:

- `src/app/api/leads/[id]/produtos/*`
- `src/lib/api/produtos.ts`
- `src/modules/kanban/components/lead-produtos-tab.tsx`
- `src/app/api/produtos/[id]/route.ts`

Direcao:

- criar rotas `/api/negocios/[id]/produtos/*`
- usar `NegocioProduto`
- atualizar contadores/ultimos usos do produto para negocio, nao lead

## 8. Automacoes, pendencias e WhatsApp

### Automacoes

Mudancas obrigatorias:

- `executarAutomacoesLeadStageChanged` deve virar semantica de negocio
- `LeadEstagioLog` sai de cena e entra `NegocioEstagioLog`
- jobs de evento comercial usam `id_negocio`

Implementacao pragmatica:

- manter o nome tecnico do gatilho `STAGE_CHANGE` se isso reduzir churn
- mudar apenas a entidade observada de `Lead` para `Negocio`

### Pendencias

Arquivos:

- `src/lib/calculo-pendencias.ts`
- `src/lib/pendencias-dinamicas.ts`
- `src/app/api/pendencias/*`

Direcao:

- pendencia de "estagio parado" deve ser calculada em `Negocio`
- payload pode continuar trazendo resumo do lead para contexto visual

### WhatsApp

Arquivos:

- `src/lib/leads-sync-whatsapp.ts`
- `src/lib/whatsapp-chat.ts`
- `src/app/api/whatsapp/chat/*`

Direcao:

- chat permanece lead-centrico
- sync de WhatsApp deve chamar servico compartilhado
- comportamento recomendado para manter paridade:
  - opcao padrao: criar `Lead + Negocio inicial`
  - opcao futura: criar apenas `Lead` e deixar automacao decidir qualificacao

## 9. Resumo, metas e recebimentos

### Resumo

Arquivo:

- `src/app/(dashboard)/resumo/page.tsx`

Trocar:

- `lead.estagio.tipo` -> `negocio.status` ou `negocio.estagio.tipo`
- `lead.valor_oportunidade` -> `negocio.valor_estimado/valor_fechado`
- historico por `negocio.data_fechamento` para ganhos

### Metas

Arquivo:

- `src/lib/metas.ts`

Trocar:

- `distinct: ["id_lead"]` -> `distinct: ["id_negocio"]`

### Recebimentos

Arquivos:

- `src/app/api/recebimentos/route.ts`
- `src/lib/api/recebimentos.ts`

Trocar:

- `parcela.lead.*` por `parcela.negocio.*` e `parcela.negocio.lead.*`

## 10. Refactors secundarios obrigatorios

### Inativacao de funcionario

Arquivo:

- `src/app/api/funcionarios/[id]/inativar/route.ts`

Precisa reatribuir:

- owner dos leads
- negocios abertos do colaborador

### Redistribuicao automatica

Arquivo:

- `src/app/api/leads/redistribuir-em-atendimento/route.ts`

Deve virar:

- redistribuicao de negocios em `Em Atendimento`

## 11. Testes obrigatorios

### Banco e backfill

- teste do mapper `Lead legado -> Negocio inicial`
- teste de idempotencia por `chave_migracao`
- teste de copia de parcelas/produtos/logs

### Rotas

- `POST /api/leads`
- `POST /api/negocios`
- `PATCH /api/negocios/[id]/mover`
- `GET /api/negocios/kanban`
- `GET /api/leads/[id]`

### Automacoes

- job criado por mudanca de estagio do negocio
- cancelamento de jobs incompatveis quando negocio muda de estagio
- idempotencia do mesmo evento

### Frontend

- validacoes do formulario de criacao `Lead + Negocio`
- movimentacao do card de negocio
- renderizacao do historico de negocios do lead

## 12. Checklist de cutover

Antes de remover campos legados do `Lead`, validar:

- Kanban abre sem ler `/api/leads`
- nenhum save comercial chama `PATCH /api/leads/[id]`
- metrics e financeiro passam sem `Lead.valor_oportunidade`
- script de backfill rodou e foi verificado
- amostra manual de leads historicos bate com o negocio inicial criado

## Resultado esperado do refactor

Quando esta fase terminar, o sistema deve permitir:

- cadastrar um contato sem pipeline
- abrir varios negocios para o mesmo contato
- ter um historico comercial por contato
- mover negocios entre estagios sem tocar no contato
- anexar produtos e parcelas ao negocio correto
- escalar para varios funis sem reintroduzir acoplamento em `Lead`
