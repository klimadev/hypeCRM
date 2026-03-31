# Auditoria do Estado Atual

## Resumo do acoplamento encontrado

Hoje o projeto trata `Lead` como a entidade central de contato e de pipeline ao mesmo tempo.

Isso aparece em tres camadas:

1. `prisma/schema.prisma`
2. rotas `src/app/api/leads/*`
3. modulo `src/modules/kanban/*`

## Acoplamento no banco atual

### `Lead` concentra dados de contato e dados comerciais

Arquivo: `prisma/schema.prisma`

Campos comerciais hoje gravados no `Lead`:

- `id_estagio`
- `valor_oportunidade`
- `probabilidade`
- `motivo_perda`
- `id_funcionario` usado ao mesmo tempo como owner do contato e responsavel comercial

Relacoes comerciais hoje ligadas ao `Lead`:

- `Lead.estagio`
- `Lead.produtos`
- `Lead.parcelas`
- `Lead.estagio_logs`
- `AutomacaoAgendamento.id_lead`

### `EstagioFunil` ainda nao pertence a um funil explicito

Hoje existe apenas `EstagioFunil` com:

- `id_empresa`
- `nome`
- `ordem`
- `tipo`

Nao existe entidade `Funil`. Logo:

- nao ha suporte real a multi-pipeline
- o Kanban assume um conjunto unico de estagios por empresa

## Acoplamento nas APIs atuais

### Rotas de lead misturam CRUD de contato e operacao comercial

Arquivos principais:

- `src/app/api/leads/route.ts`
- `src/app/api/leads/[id]/route.ts`
- `src/app/api/leads/[id]/mover/route.ts`
- `src/app/api/leads/redistribuir-em-atendimento/route.ts`

Problemas atuais:

- `POST /api/leads` cria contato + estagio + valor + responsavel comercial
- `PATCH /api/leads/[id]` salva telefone, observacao, valor e responsavel no mesmo endpoint
- `PATCH /api/leads/[id]/mover` altera estagio do lead, grava log e dispara automacao
- redistribuicao por "Em Atendimento" opera em `Lead`, nao em oportunidade

### `GET /api/leads` hoje eh um payload de board, nao um CRUD de contatos

Arquivo: `src/app/api/leads/route.ts`

Hoje ele retorna:

- `estagios`
- `leads`
- `funcionarios`
- `pdvs`

Ou seja, a rota de `Lead` ja esta servindo um DTO de Kanban acoplado ao pipeline.

## Acoplamento no frontend atual

### O modulo de Kanban inteiro esta tipado em torno de `Lead`

Arquivos principais:

- `src/modules/kanban/types.ts`
- `src/lib/api/kanban.ts`
- `src/modules/kanban/hooks/use-kanban-*`
- `src/modules/kanban/components/*`

Pontos criticos:

- `Lead` do frontend contem `id_estagio`, `valor_oportunidade`, `motivo_perda`
- o agrupamento do board usa `lead.id_estagio`
- o drag and drop move `Lead`
- o drawer atual mistura detalhe de contato, detalhe comercial e chat

### Drawer atual esta conceitualmente incorreto para o novo modelo

Arquivo: `src/modules/kanban/components/lead-details-drawer.tsx`

Hoje o drawer:

- edita telefone do contato
- edita valor da oportunidade
- edita responsavel comercial
- mostra chat de WhatsApp
- mostra parcelas

No modelo novo isso deve ser separado:

- contato -> contexto do `Lead`
- comercial -> contexto do `Negocio`
- chat -> contexto do `Lead`
- parcelas/produtos -> contexto do `Negocio`

## Acoplamento em automacoes e jobs

Arquivos principais:

- `src/lib/whatsapp-automations.ts`
- `src/lib/automacoes/agendamentos.ts`
- `src/lib/automacoes/dispatch-whatsapp.ts`
- `src/app/api/automacoes/route.ts`
- `src/app/api/automacoes/[id]/route.ts`

Problemas atuais:

- mudanca de estagio parte de `Lead`
- `LeadEstagioLog` eh a origem de idempotencia do evento
- jobs usam `AutomacaoAgendamento.id_lead`
- cancelamento de jobs incompatveis tambem usa `Lead`

Conclusao:

- automacao de estagio precisa migrar para `Negocio`
- automacao de contato/WhatsApp pode continuar usando `Lead`

## Acoplamento em WhatsApp

Arquivos principais:

- `src/lib/leads-sync-whatsapp.ts`
- `src/lib/whatsapp-chat.ts`
- `src/app/api/leads/sync-whatsapp/route.ts`
- `src/app/api/whatsapp/chat/*`

Achados:

- o chat atual e corretamente contato-centrico
- a sincronizacao de WhatsApp cria `Lead` diretamente em um estagio (`Indefinido`) com `valor_oportunidade = 0`
- a escolha da instancia WhatsApp depende do owner/PDV do lead

Decisao deste plano:

- chat continua ligado ao `Lead`
- sync de WhatsApp deve parar de escrever estagio/valor diretamente no `Lead`
- se for necessario manter paridade operacional com o board, a sync pode criar `Lead + Negocio inicial` via servico compartilhado

## Acoplamento em parcelas, produtos, resumo e metas

### Parcelas

Arquivos:

- `src/app/api/parcelas/route.ts`
- `src/app/api/parcelas/[id]/pagar/route.ts`
- `src/lib/api/parcelas.ts`
- `src/modules/kanban/hooks/use-lead-parcelas.ts`

Hoje:

- `Parcela.id_lead`
- financeiro busca `parcela.lead.valor_oportunidade`

No modelo novo:

- `Parcela` precisa referenciar `Negocio`

### Produtos

Arquivos:

- `src/app/api/leads/[id]/produtos/*`
- `src/lib/api/produtos.ts`
- `src/modules/kanban/components/lead-produtos-tab.tsx`
- `src/app/api/produtos/[id]/route.ts`

Hoje:

- produtos anexados ao lead via `LeadProduto`

No modelo novo:

- snapshot precisa virar `NegocioProduto`

### Resumo

Arquivo: `src/app/(dashboard)/resumo/page.tsx`

Hoje:

- usa `lead.estagio.tipo`
- soma `lead.valor_oportunidade`
- usa `lead.criado_em` como base historica do grafico

Problema:

- com `1 Lead -> N Negocios`, isso passa a subcontar, misturar contato com receita e distorcer historico

### Metas

Arquivo: `src/lib/metas.ts`

Hoje:

- progresso por volume usa `distinct: ["id_lead"]`

Problema:

- quando um lead tiver varios negocios pagos, o volume ficara subcontado

### Recebimentos

Arquivos:

- `src/app/api/recebimentos/route.ts`
- `src/lib/api/recebimentos.ts`

Hoje:

- payload de recebimentos le `parcela.lead.valor_oportunidade`
- tambem exibe `parcela.lead.estagio.nome`

No modelo novo:

- isso deve vir de `parcela.negocio`

## Riscos de dados ja detectados

### 1. Nao existe `data_fechamento` legada

O schema atual nao guarda data de fechamento explicita.

Backfill recomendado:

- `Negocio.data_abertura = Lead.criado_em`
- `Negocio.data_fechamento = Lead.atualizado_em` apenas quando o estagio atual for `GANHO` ou `PERDIDO`

Observacao:

- isso eh inferencia, nao verdade historica absoluta

### 2. `Lead.observacoes` hoje mistura contato e comercial

Como nao ha separacao atual, o backfill deve:

- manter `Lead.observacoes` como esta
- copiar o mesmo conteudo para `Negocio.observacoes_comerciais`

Duplicacao aqui e aceitavel. Perda de dado nao e.

### 3. `Lead.probabilidade` tambem e dado comercial

Mesmo sem aparecer em todas as telas, este campo tambem deve sair do `Lead`.

## Inventario minimo de arquivos impactados

### Schema e infraestrutura

- `prisma/schema.prisma`
- `prisma/seed.js`
- `src/lib/estagios-fixos.ts`
- `src/lib/permissoes.ts`
- `src/lib/validacoes.ts`

### APIs

- `src/app/api/leads/*`
- `src/app/api/estagios/route.ts`
- `src/app/api/parcelas/*`
- `src/app/api/produtos/*`
- `src/app/api/automacoes/*`
- `src/app/api/pendencias/*`
- `src/app/api/recebimentos/route.ts`
- `src/app/api/funcionarios/[id]/inativar/route.ts`

### Frontend

- `src/lib/api/kanban.ts`
- `src/modules/kanban/*`
- novo modulo/pagina de detalhes de lead
- novo drawer/modal de negocio

### Servicos e automacoes

- `src/lib/leads-sync-whatsapp.ts`
- `src/lib/whatsapp-chat.ts`
- `src/lib/whatsapp-automations.ts`
- `src/lib/automacoes/*`
- `src/lib/calculo-pendencias.ts`
- `src/lib/pendencias-dinamicas.ts`
- `src/lib/metas.ts`

### Testes

- `src/app/api/leads/[id]/mover/route.test.ts`
- `src/lib/whatsapp-automations.test.ts`
- `src/modules/kanban/utils/validacoes.test.ts`
- novos testes de rotas `/api/negocios/*`

## Conclusao da auditoria

O problema nao esta restrito ao Prisma.

O acoplamento atual atravessa:

- persistencia
- DTOs de API
- ViewModel do Kanban
- automacoes
- financeiro
- metricas
- permissao
- sincronizacao de WhatsApp

Por isso a refatoracao precisa seguir as quatro fases oficiais e nao pode ser feita como simples rename de campos.
