# Plano de correção - sincronização de colaboradores

## Objetivo
Garantir que um novo colaborador:
1. apareça imediatamente na lista principal de colaboradores;
2. seja detectado no fluxo de WhatsApp Sync;
3. continue aparecendo no Cards Preview do PDV sem divergência de fonte de dados.

## Causa raiz observada
Depois da análise dos módulos de equipe, PDVs e WhatsApp, a inconsistência vem de uma combinação de fatores:

1. **Fonte de dados diferente entre telas**
   - O Cards Preview do PDV usa `GET /api/pdvs`, que já devolve `pdv.funcionarios` com colaboradores ativos do PDV.
   - A lista principal usa `GET /api/funcionarios`, que faz paginação e depende do estado local do hook `useEquipeLista`.
   - O WhatsApp Sync usa consultas diretas ao banco em `src/lib/leads-sync-whatsapp.ts`, filtrando colaboradores ativos por `id_pdv`.

2. **A lista principal pode ficar defasada ou incompleta**
   - `src/lib/api/equipe.ts:listarEquipe()` chama `/api/funcionarios` sem `cache: "no-store"`.
   - O hook `useEquipeLista` guarda apenas a página atual em `funcionarios`.
   - Após criar um colaborador, o refresh atual chama `carregarFuncionarios()` com os mesmos `searchParams`, então a tela continua restrita à página e aos filtros atuais.

3. **O WhatsApp Sync depende de um recorte mais estrito que a lista visual**
   - Em `src/lib/leads-sync-whatsapp.ts`, a sincronização só considera colaboradores ativos com `cargo === "COLABORADOR"` e `id_pdv` dentro de `idsPdvsElegiveis`.
   - Se o colaborador não entrar na coleção carregada pela tela ou se a tela estiver usando uma página/filtro diferente, o usuário interpreta como “não detectado”.

## Evidências do código
- `src/lib/api/equipe.ts:28-30` chama `/api/funcionarios` sem `cache: "no-store"`.
- `src/app/api/funcionarios/route.ts:21-120` pagina e filtra a resposta por `pagina`, `por_pagina`, `status`, `cargo`, `id_pdv` e ordenação.
- `src/modules/equipe/hooks/use-equipe-lista.ts:63-85` sobrescreve `funcionarios` com apenas a página atual.
- `src/modules/equipe/components/pdv-management-panel.tsx:263-355` mostra o Cards Preview a partir de `vm.pdvs[].funcionarios`.
- `src/lib/leads-sync-whatsapp.ts:114-127` faz o filtro real de colaboradores ativos por PDV para a sincronização.

## Hipótese técnica principal
O bug não é um problema único de banco. Ele é a soma de:

1. **cache/refresh fraco** na listagem de funcionários;
2. **estado local paginado** usado como se fosse a lista global da empresa;
3. **duas fontes de verdade diferentes** para colaboradores:
   - `pdv.funcionarios` para preview;
   - `funcionarios` da tela para lista e para seleção/integrações;
4. **sincronização de WhatsApp lendo diretamente o banco**, então qualquer descompasso entre o estado da UI e o dado persistido gera a impressão de que o colaborador “não existe”.

## Estratégia de correção

### Fase 1: unificar a leitura da equipe
Criar uma fonte de verdade explícita para colaboradores da empresa, separada da paginação da tabela.

#### Ação 1.1
Atualizar `src/lib/api/equipe.ts` para buscar equipe com `cache: "no-store"` em `/api/funcionarios`.

#### Ação 1.2
Separar, dentro do hook `useEquipeLista`, dois conceitos:
- `funcionariosDaPagina`: itens da página atual;
- `funcionariosGlobaisOuCacheados`: coleção completa usada por seletores, sincronização e preview de contexto.

Se a arquitetura atual não permitir uma coleção global no mesmo hook, a correção mínima é:
- refazer a listagem com `cache: "no-store"`;
- invalidar/atualizar explicitamente a lista após criação;
- garantir que o componente de sincronização nunca use apenas a página corrente como universo completo.

#### Ação 1.3
Ao criar colaborador, fazer o pós-sucesso recarregar:
- `/api/funcionarios` com os mesmos filtros;
- `/api/pdvs`;
- qualquer dado derivado que dependa do relacionamento colaborador x PDV.

### Fase 2: tornar a resposta da API mais previsível
#### Ação 2.1
Revisar `POST /api/funcionarios` para garantir que a resposta contenha o colaborador criado com:
- `id`;
- `id_pdv`;
- `ativo`;
- `cargo`;
- dados de `pdv` quando necessário.

#### Ação 2.2
Garantir que o cliente não dependa de inferência implícita para atualizar estado após criação.
O retorno da rota deve ser usado para inserir o colaborador no estado local imediatamente, antes mesmo do refresh.

#### Ação 2.3
Adicionar proteção contra discrepância entre payload criado e item exibido:
- após o `POST`, chamar `carregarFuncionarios()` e procurar o novo id retornado;
- se o item não estiver na página atual, registrar isso como paginação normal e não como erro de sincronização.

### Fase 3: alinhar o WhatsApp Sync ao mesmo recorte de dados
#### Ação 3.1
Confirmar se o WhatsApp Sync deve usar:
- a lista global de colaboradores ativos da empresa;
- ou apenas colaboradores do PDV elegível da instância.

Pelo comportamento atual do backend, a regra correta parece ser a segunda opção, mas isso precisa ser mantido de forma explícita no código e na UI.

#### Ação 3.2
Extrair a query de sincronização para uma função reutilizável, por exemplo:
- `listarColaboradoresAtivosPorPdv(idEmpresa, idsPdvsElegiveis)`.

Isso evita duplicação entre:
- preview do PDV;
- lista da equipe;
- sync do WhatsApp.

#### Ação 3.3
Quando o colaborador for criado:
- garantir que ele já entra com `ativo: true`;
- garantir `id_pdv` válido;
- garantir que a UI do WhatsApp Sync recarregue o recorte necessário sem depender de stale state.

### Fase 4: corrigir o comportamento do Cards Preview para ser consistente com a lista
#### Ação 4.1
Não alterar o preview para depender da tabela paginada.
O preview deve continuar vindo de `pdv.funcionarios`, mas seu payload precisa ser enriquecido com os mesmos campos usados nos outros módulos, se necessário.

#### Ação 4.2
Se a lista principal usar um estado local paginado, o preview não deve tentar “adivinhar” dados ausentes por `vm.funcionarios.find(...)` sem fallback claro.
Hoje ele faz merge local para `email` e `ativo`; isso deve ser mantido apenas se o dado estiver garantidamente sincronizado.

## Mudanças concretas por arquivo

### `src/lib/api/equipe.ts`
- adicionar `cache: "no-store"` em `listarEquipe()`;
- opcionalmente adicionar `cache: "no-store"` nas mutações relevantes para reduzir efeito de respostas antigas;
- manter o contrato do JSON explícito.

### `src/app/api/funcionarios/route.ts`
- avaliar incluir `cache-control` ou resposta explicitamente não-cacheável se o ambiente estiver servindo cache intermediário;
- revisar se a listagem deve retornar metadados suficientes para a UI atualizar com precisão;
- manter a paginação como fonte da tabela, mas não como única fonte de colaboradores da empresa.

### `src/modules/equipe/hooks/use-equipe-lista.ts`
- após `carregarFuncionarios()`, sincronizar o estado com o novo colaborador retornado;
- evitar que `funcionarios` seja interpretado como lista global quando a rota é paginada;
- adicionar um estado derivado para “seleção atual” e outro para “universo usado por integrações”, se necessário.

### `src/modules/equipe/hooks/use-equipe-module.ts`
- no fluxo de criação, usar o retorno da API para atualizar o estado imediatamente;
- após criação, recarregar lista de funcionários e PDVs;
- se o colaborador recém-criado cair fora da página atual, não tratar isso como falha.

### `src/modules/equipe/components/pdv-management-panel.tsx`
- manter o Cards Preview usando `pdv.funcionarios`;
- se o drawer mostrar o colaborador recém-criado, garantir que o merge com `vm.funcionarios` não apague dados recentes;
- opcionalmente desabilitar a dependência em `vm.funcionarios.find(...)` para campos sensíveis se a lista estiver paginada.

### `src/lib/leads-sync-whatsapp.ts`
- preservar a regra de negócio de apenas colaboradores ativos por PDV;
- extrair a query para função compartilhada;
- garantir que a seleção de colaboradores seja determinística e independente de cache da UI;
- se houver necessidade de exibir “por que o colaborador não entrou no sync”, retornar motivo explícito.

## Sequência de implementação sugerida
1. Corrigir `listarEquipe()` para não usar cache implícito.
2. Ajustar `useEquipeModule` para atualizar estado após criação com o retorno da API.
3. Revalidar a listagem de funcionários depois da criação e confirmar se o novo colaborador aparece na página correta.
4. Extrair a query de colaboradores ativos por PDV para uso compartilhado.
5. Garantir que o WhatsApp Sync use a mesma regra de elegibilidade do backend.
6. Adicionar testes de integração/rota cobrindo:
   - criação de colaborador;
   - listagem imediata após criação;
   - inclusão no preview do PDV;
   - inclusão no conjunto elegível do sync WhatsApp.

## Testes que devem existir

### API
- `POST /api/funcionarios` retorna o colaborador criado com `id_pdv` válido.
- `GET /api/funcionarios` não retorna dados antigos após criação.
- `GET /api/pdvs` devolve o colaborador novo dentro de `pdv.funcionarios` quando ele estiver ativo.

### UI / hook
- criar colaborador e ver o item entrar no estado imediatamente;
- recarregar a lista e manter o filtro/paginação corretos;
- abrir o Cards Preview e ver o novo colaborador no bloco do PDV;
- disparar sync e confirmar que o colaborador é considerado elegível quando o PDV e o cargo baterem.

### Sincronização WhatsApp
- se o colaborador estiver ativo e com PDV elegível, ele entra no recorte;
- se estiver inativo ou fora do PDV elegível, ele não entra e o motivo fica explícito.

## Critério de aceite
O bug só pode ser considerado resolvido quando:
1. o colaborador criado aparece na lista principal sem depender de hard refresh;
2. o Cards Preview continua correto;
3. o WhatsApp Sync encontra o colaborador no mesmo ciclo de dados;
4. não existe divergência entre o que a UI mostra e o que a sincronização usa como base.

## Observação final
A implementação deve respeitar a arquitetura modular do projeto:
- lógica de negócio no hook/módulo;
- rotas só com validação e acesso;
- sem mover a regra de sincronização para componente visual.
