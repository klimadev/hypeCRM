# Schema Alvo e Plano de Migracao

## Modelo alvo final

## 1. `Funil`

Nova entidade para permitir multi-pipeline.

Campos recomendados:

- `id`
- `id_empresa`
- `nome`
- `slug`
- `descricao?`
- `ativo`
- `padrao`
- `ordem`
- `criado_em`
- `atualizado_em`

Relacoes:

- `empresa`
- `estagios`
- `negocios`

## 2. `EstagioFunil`

Manter o nome do model para reduzir churn, mas adicionar:

- `id_funil`

Remover relacao direta com `Lead` no estado final.

Relacoes finais:

- `funil`
- `negocios`
- `logs_negocio_anterior`
- `logs_negocio_novo`

Constraints finais:

- `@@unique([id_funil, ordem])`
- `@@index([id_empresa])`
- `@@index([id_funil])`

## 3. `Lead`

Estado final do `Lead`: contato persistente.

Campos finais recomendados:

- `id`
- `id_empresa`
- `id_pdv`
- `id_funcionario` como owner do contato
- `nome`
- `telefone`
- `email?`
- `fonte?`
- `empresa_origem?`
- `observacoes?`
- `origem`
- `anuncio_titulo?`
- `anuncio_descricao?`
- `anuncio_url?`
- `dados_extras?`
- `criado_em`
- `atualizado_em`

Campos a remover do `Lead` no cleanup:

- `id_estagio`
- `valor_oportunidade`
- `probabilidade`
- `motivo_perda`

## 4. `Negocio`

Nova entidade comercial principal.

Campos recomendados:

- `id`
- `id_empresa`
- `id_lead`
- `id_funil`
- `id_estagio`
- `id_funcionario`
- `id_produto_principal?`
- `titulo`
- `valor_estimado`
- `valor_fechado?`
- `probabilidade?`
- `status` (`ABERTO`, `GANHO`, `PERDIDO`)
- `data_abertura`
- `data_fechamento?`
- `motivo_perda?`
- `observacoes_comerciais?`
- `chave_migracao?` com `@unique`
- `criado_em`
- `atualizado_em`

Relacoes:

- `lead`
- `funil`
- `estagio`
- `funcionario`
- `produto_principal?`
- `parcelas`
- `produtos`
- `estagio_logs`
- `automacao_agendamentos`

Indices minimos:

- `@@index([id_empresa, id_lead])`
- `@@index([id_empresa, id_funcionario])`
- `@@index([id_empresa, id_funil, id_estagio])`
- `@@index([id_empresa, status])`
- `@@index([id_lead, criado_em])`

## 5. `NegocioEstagioLog`

Substitui `LeadEstagioLog`.

Campos recomendados:

- `id`
- `id_negocio`
- `id_funil_anterior?`
- `id_funil_novo`
- `id_estagio_anterior?`
- `id_estagio_novo`
- `empresa_id`
- `origem` (`MIGRACAO`, `KANBAN`, `API`, `AUTOMACAO`)
- `criado_em`

## 6. `NegocioProduto`

Substitui `LeadProduto`.

Estrutura equivalente:

- `id`
- `id_empresa`
- `id_negocio`
- `id_produto`
- `nome_snapshot`
- `schema_snapshot`
- `valores_layout`
- `observacoes?`
- `criado_em`
- `atualizado_em`

## 7. `Parcela`

Expandir para suportar transicao segura.

### Fase 1

Adicionar:

- `id_negocio?`

Manter temporariamente:

- `id_lead`

### Estado final

- `id_negocio` obrigatorio
- `id_lead` removido
- `@@unique([id_negocio, numero_parcela])`

## 8. `AutomacaoAgendamento`

Expandir para suportar eventos de contato e de negocio.

### Fase 1

Adicionar:

- `id_negocio?`

Manter:

- `id_lead?`

Regra final:

- jobs de estagio/status comercial usam `id_negocio`
- jobs de contato/WhatsApp podem continuar usando `id_lead`

## 9. Mapeamento campo legado -> destino novo

| Origem no Lead | Destino no Negocio | Regra |
| --- | --- | --- |
| `id_estagio` | `id_estagio` | copia direta |
| `valor_oportunidade` | `valor_estimado` | copia direta |
| `probabilidade` | `probabilidade` | copia direta |
| `motivo_perda` | `motivo_perda` | copia direta |
| `id_funcionario` | `id_funcionario` | copia direta para responsavel comercial |
| `criado_em` | `data_abertura` | copia direta |
| `atualizado_em` | `data_fechamento` | somente se estagio final |
| `observacoes` | `observacoes_comerciais` | copia sem remover do lead |

## Fase 1. Expand (obrigatoria antes de qualquer backfill)

### Migracao Prisma/SQLite

Usar:

1. `npx prisma migrate dev --create-only --name expand_lead_negocio`
2. editar manualmente o SQL gerado
3. so depois aplicar a migracao

### O SQL de expansao deve fazer

1. criar `Funil`
2. criar um funil padrao por empresa existente
3. recriar `EstagioFunil` com `id_funil`
4. backfill de `EstagioFunil.id_funil` para o funil padrao da empresa
5. criar `Negocio`
6. criar `NegocioEstagioLog`
7. criar `NegocioProduto`
8. adicionar `Lead.id_pdv`
9. backfill de `Lead.id_pdv` a partir de `Lead -> Funcionario -> Pdv`
10. adicionar `Parcela.id_negocio`
11. adicionar `AutomacaoAgendamento.id_negocio`
12. manter todos os campos comerciais legados do `Lead`

## Fase 2. Backfill (critica)

## Especificacao do script

Arquivo recomendado:

- `prisma/scripts/backfill-leads-para-negocios.ts`

Dependencia recomendada:

- adicionar `tsx` em `devDependencies`

Script npm recomendado:

- `"migrate:lead-negocio:backfill": "tsx prisma/scripts/backfill-leads-para-negocios.ts"`

Flags recomendadas:

- `--dry-run`
- `--empresa-id=<id>`
- `--lead-id=<id>`
- `--batch-size=100`
- `--resume-after=<leadId>`

## Regras do backfill

### Regra 1. Idempotencia obrigatoria

Cada lead legado deve gerar exatamente um negocio inicial.

Para garantir isso:

- `Negocio.chave_migracao` deve receber `lead:{lead.id}`
- antes de criar, o script deve checar se ja existe `Negocio` com essa chave

### Regra 2. Titulo do negocio inicial

Ordem de prioridade recomendada:

1. nome do primeiro `LeadProduto.nome_snapshot`, se existir
2. `"Negocio inicial"`
3. opcionalmente `"Negocio inicial - {lead.nome}"`

### Regra 3. Status do negocio

Derivar do `EstagioFunil.tipo` atual:

- `GANHO` -> `status = GANHO`
- `PERDIDO` -> `status = PERDIDO`
- qualquer outro -> `status = ABERTO`

### Regra 4. Datas

- `data_abertura = lead.criado_em`
- `data_fechamento = lead.atualizado_em` apenas se status for `GANHO` ou `PERDIDO`

### Regra 5. Parcelas e produtos

Para o negocio inicial criado do lead:

- todas as `Parcela` do lead devem receber `id_negocio`
- todos os `LeadProduto` do lead devem ser copiados para `NegocioProduto`

### Regra 6. Logs de estagio

Se existirem `LeadEstagioLog`:

- copiar todos para `NegocioEstagioLog`, apontando para o negocio inicial
- preencher `id_funil_novo` e `id_funil_anterior` via lookup do estagio

Se nao existirem logs:

- criar um log sintetico de origem `MIGRACAO` representando o estado atual

### Regra 7. Jobs e automacoes

Todos os `AutomacaoAgendamento` vinculados a lead legado e relacionados a estagio:

- devem receber `id_negocio` do negocio inicial
- `id_lead` pode ser mantido temporariamente na Fase 2

## Algoritmo recomendado do backfill

Para cada `Lead`:

1. carregar lead com `estagio`, `funcionario`, `produtos`, `parcelas`, `estagio_logs`
2. determinar `id_funil` a partir do estagio atual
3. abrir `prisma.$transaction`
4. criar ou localizar o `Negocio` inicial por `chave_migracao`
5. atualizar `Parcela.id_negocio`
6. copiar `LeadProduto` -> `NegocioProduto` evitando duplicacao
7. copiar `LeadEstagioLog` -> `NegocioEstagioLog` evitando duplicacao
8. atualizar `AutomacaoAgendamento.id_negocio`
9. commitar

Nao usar uma transacao unica para toda a base em SQLite.

Use transacao por lead ou por lote curto.

## Verificacoes obrigatorias apos o backfill

### Verificacao 1. Total de negocios iniciais

- total de leads legados ativos == total de negocios com `chave_migracao` preenchida

### Verificacao 2. Orfaos proibidos

- nenhuma `Parcela` de lead legado pode ficar sem `id_negocio`
- nenhum `LeadEstagioLog` pode ficar sem equivalente em `NegocioEstagioLog`

### Verificacao 3. Consistencia do status

Para cada negocio backfill:

- `status` precisa ser coerente com `estagio.tipo`

### Verificacao 4. Dry-run x execucao real

O script deve imprimir um resumo final com:

- `leads_lidos`
- `negocios_criados`
- `negocios_ja_existentes`
- `parcelas_atualizadas`
- `produtos_copiados`
- `logs_copiados`
- `jobs_atualizados`
- `erros`

## Fase 3. Refactor de codigo

Nesta fase o codigo passa a ler/gravar negocio.

Os campos legados do `Lead` ainda existem, mas nao devem mais ser a fonte da verdade.

## Fase 4. Cleanup

Somente depois de:

- migracao aplicada
- backfill validado
- frontend e backend operando no novo modelo
- testes verdes

Entao:

1. gerar migracao de cleanup
2. recriar `Lead` sem colunas comerciais
3. remover `LeadEstagioLog`
4. remover `LeadProduto`
5. recriar `Parcela` sem `id_lead`
6. ajustar indices finais

## Observacao operacional obrigatoria

Por ser SQLite:

- toda migracao que remove coluna vai recriar tabela
- o backup fisico do banco deve ser feito antes da Fase 1 e antes da Fase 4
- a Fase 4 nunca deve ser executada no mesmo deploy da Fase 1
