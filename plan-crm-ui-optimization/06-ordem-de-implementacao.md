# Ordem de Implementação

## Fase 1: Stabilização do shell

1. Corrigir o layout raiz para separar sidebar e conteúdo com altura independente.
2. Garantir `min-w-0` no main e nos wrappers de módulo.
3. Remover qualquer comportamento que permita overflow horizontal global.

## Fase 2: Sidebar

1. Transformar a sidebar em bloco de `100vh` com `overflow-y-auto`.
2. Implementar a expansão absoluta no hover.
3. Ajustar `z-index`, `position` e transições.
4. Trocar ou reduzir o ícone de Team / Goals.

## Fase 3: Leads

1. Envolver a tabela em wrapper com scroll interno.
2. Definir largura mínima da tabela.
3. Truncar textos e impedir que células empurrem a página.

## Fase 4: Deals Kanban

1. Substituir grid quebrável por linha única `flex-nowrap`.
2. Impedir wrap das stages.
3. Garantir scroll horizontal interno.
4. Validar altura e scroll interno por coluna.

## Fase 5: Validação final

1. Testar em 1024x768.
2. Testar em 1366x768.
3. Testar em laptop estreito.
4. Testar em tablet landscape.
5. Testar em mobile para garantir que o dock e o shell não foram regressados.

