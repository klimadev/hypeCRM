# Plano Mestre: Desacoplamento Lead -> Negocio

## Objetivo

Transformar o HYPE CRM do modelo atual "Lead = contato + oportunidade comercial" para um modelo relacional escalavel:

- `Lead`: contato persistente
- `Negocio`: oportunidade comercial
- `Funil` + `EstagioFunil`: estrutura comercial aplicada ao `Negocio`, nao ao `Lead`

Resultado esperado:

- `1 Lead -> N Negocios`
- Kanban 100% baseado em negocios
- historico comercial preservado
- suporte futuro a multiplos funis, multiplos produtos e financeiro por negocio

## Decisoes canonicas deste plano

### 1. Nomenclatura de dominio

- Manter `Lead` como entidade de contato
- Adotar `Negocio` como nome canonico no codigo para "Deal"
- Criar `Funil` como nova entidade
- Manter `EstagioFunil` como nome do model Prisma para reduzir churn, mas ele passara a pertencer a `Funil`

### 2. Escopo de responsabilidade por entidade

- `Lead` nao pode mais carregar `id_estagio`, `valor_oportunidade`, `probabilidade`, `motivo_perda` nem qualquer status comercial
- `Negocio` passa a carregar estagio, funil, responsavel comercial, valores, fechamento, motivo de perda e notas comerciais
- `WhatsappMensagem` continua ligado ao `Lead`
- `Parcela` e `Produto` passam a se relacionar com `Negocio`

### 3. Decisao operacional importante sobre ownership do Lead

Para nao quebrar permissao, roteamento por PDV e chat do WhatsApp em leads sem negocios, este plano assume:

- `Lead.id_funcionario` permanece, mas passa a significar **owner do contato**
- `Lead` ganha `id_pdv`
- `Negocio.id_funcionario` passa a significar **responsavel comercial**

Isso preserva o modelo de acesso atual e evita que um contato "sem negocio" fique sem contexto de PDV/roteamento.

### 4. Kanban passa a ser funil-especifico

O board nao deve misturar estagios de multiplos funis em uma unica grade.

- o header do Kanban deve ter seletor de `Funil`
- o drag and drop move `Negocio` entre estagios do funil selecionado
- troca de funil deve ser acao explicita no drawer/modal do negocio

## Ordem obrigatoria de execucao

Leia e implemente esta pasta nesta ordem:

1. `01-auditoria-do-estado-atual.md`
2. `02-schema-alvo-e-migracao.md`
3. `03-refactor-backend-frontend-e-testes.md`

## Fases oficiais

### Fase 0. Preparacao

- criar branch exclusiva para a refatoracao
- fazer backup fisico do arquivo SQLite antes de cada migracao
- adicionar um script TypeScript de backfill com `dry-run`
- criar uma camada de servicos de dominio para nao espalhar regras em rotas

### Fase 1. Expand

- criar `Funil`
- expandir `EstagioFunil`
- criar `Negocio`
- criar `NegocioEstagioLog`
- criar `NegocioProduto`
- adicionar `id_negocio` onde necessario
- manter campos comerciais legados em `Lead`

### Fase 2. Backfill

- para cada `Lead`, criar exatamente um `Negocio` inicial
- copiar dados comerciais legados
- migrar logs de estagio
- apontar parcelas/produtos/jobs para o `Negocio`
- validar contagem e consistencia

### Fase 3. Refactor de codigo

- rotas separadas de `Lead` e `Negocio`
- Kanban refeito para `Negocio`
- pagina de detalhes do lead com historico de negocios
- drawer/modal de negocio
- automacoes, pendencias, metas, recebimentos e resumo lidos do novo modelo

### Fase 4. Cleanup

- remover campos comerciais de `Lead`
- remover `LeadEstagioLog`
- remover dependencias de rotas e tipos legados
- recriar tabelas SQLite que precisarem de drop de coluna

## Definicao de pronto

O trabalho so pode ser considerado concluido quando todas as condicoes abaixo forem verdadeiras:

- cada `Lead` existente possui pelo menos um `Negocio`
- nenhum dado comercial novo eh salvo diretamente em `Lead`
- Kanban lista e move apenas `Negocio`
- detalhes do lead mostram historico de negocios
- produtos e parcelas estao ligados a `Negocio`
- automacoes de mudanca de estagio operam sobre `Negocio`
- `Resumo`, `Recebimentos` e `Metas` nao usam mais `Lead.valor_oportunidade` nem `Lead.id_estagio`
- os campos comerciais legados so sao removidos depois de validacao do backfill

## Entregaveis minimos da implementacao

- migracao Prisma de expansao
- script TypeScript de backfill idempotente
- migracao Prisma de cleanup
- servicos de dominio para criacao/movimentacao de negocio
- novas rotas `/api/negocios/*`
- refactor do modulo `kanban`
- pagina de detalhes do lead
- cobertura minima de testes de backfill, rotas de negocio e automacoes
