# Perf Optimization Plan

Objetivo: reduzir a latência percebida ao trocar de módulos no HYPE CRM, especialmente em hardware fraco, mantendo a identidade dark premium do dashboard.

## Base observada no projeto

- Next.js `16.1.6` com React `19.2.3`.
- App Router já está em uso.
- `cacheComponents: true` já está habilitado em `next.config.ts`, o que abre espaço para estratégias de prerendering e streaming.
- O dashboard usa um `layout.tsx` server-side e um `template.tsx` client-side com `framer-motion`.
- Existe um gráfico pesado em `src/components/grafico-vendas.tsx` baseado em `recharts`.
- Não há `loading.tsx` nos segmentos do `src/app` hoje.

Arquivos principais para a refatoração:

- [`src/app/(dashboard)/layout.tsx`](/var/www/hypeCRM/src/app/(dashboard)/layout.tsx)
- [`src/app/(dashboard)/template.tsx`](/var/www/hypeCRM/src/app/(dashboard)/template.tsx)
- [`src/app/(dashboard)/resumo/page.tsx`](/var/www/hypeCRM/src/app/(dashboard)/resumo/page.tsx)
- [`src/components/sidebar-principal.tsx`](/var/www/hypeCRM/src/components/sidebar-principal.tsx)
- [`src/components/grafico-vendas.tsx`](/var/www/hypeCRM/src/components/grafico-vendas.tsx)
- [`next.config.ts`](/var/www/hypeCRM/next.config.ts)

## Meta de performance

1. Fazer a troca de sidebar parecer instantânea no nível visual.
2. Reduzir o trabalho de JavaScript no primeiro paint de cada módulo.
3. Separar dados críticos de dados pesados para permitir streaming progressivo.
4. Evitar que bibliotecas de gráfico bloqueiem a navegação.

## Estratégia técnica

### 1) Streaming por segmento com `loading.tsx`

Criar `loading.tsx` nos segmentos do dashboard para renderizar fallback imediato enquanto o conteúdo real está em streaming.

Prioridade de criação:

1. `src/app/(dashboard)/loading.tsx`
2. `src/app/(dashboard)/resumo/loading.tsx`
3. `src/app/(dashboard)/kanban/loading.tsx`
4. `src/app/(dashboard)/equipe/loading.tsx`
5. `src/app/(dashboard)/recebimentos/loading.tsx`
6. `src/app/(dashboard)/whatsapp/loading.tsx`
7. `src/app/(dashboard)/automacoes/loading.tsx`
8. `src/app/(dashboard)/configs/loading.tsx`

Regras para esses fallbacks:

- Devem ser Server Components leves.
- Devem parecer a tela real, não um skeleton genérico.
- Devem repetir a estrutura do shell: header, chips, grid de KPI, card de gráfico.
- Devem usar os componentes existentes de `Skeleton`, `Card` e tokens escuros do sistema.

### 2) Skeletons de alta fidelidade para o `Resumo`

O `Resumo` precisa de um loading que espelhe a hierarquia visual do dashboard:

1. Cabeçalho com título e pills.
2. Grid com 4 cards de KPI.
3. Card grande de gráfico com área vazia e grid pontilhada.

Implementação sugerida:

- Criar um componente dedicado, por exemplo `ResumoSkeleton`.
- Reutilizar a mesma malha do layout final:
  - `text-2xl` ou `text-xl` para o título.
  - pills compactas com largura aproximada do conteúdo real.
  - quatro cards com altura, espaçamento e borda iguais ao estado final.
  - bloco do gráfico com fundo, legenda e badge simulados.
- Evitar shimmer agressivo. Usar animação curta e discreta.

Resultado esperado:

- O usuário vê a estrutura do dashboard imediatamente.
- Mesmo com dados lentos, o layout não “salta” nem reflowa.

### 3) RSC para dados críticos, client-only para interações

Separar módulos em duas camadas:

1. Server Component para buscar dados e montar o view-model inicial.
2. Client Component apenas para interações locais, filtros, hover states e animações leves.

Aplicação prática no `Resumo`:

- Buscar no servidor os dados mínimos para renderizar KPI cards e estados iniciais.
- Manter no client apenas:
  - seleção de filtros rápidos,
  - refinamento visual de chips,
  - transições e toasts,
  - atualizações otimistas quando existir edição local.

Vantagens:

- Menos JS na hidratação inicial.
- Menos risco de bloqueio ao navegar entre módulos.
- Melhor aproveitamento do streaming do App Router.

### 4) Fetch paralelo no servidor

Onde houver múltiplas consultas independentes, substituir sequências por paralelismo.

Padrão recomendado:

```ts
const [resumo, metas, pendencias, agenda] = await Promise.all([
  buscarResumo(),
  buscarMetas(),
  buscarPendencias(),
  buscarAgenda(),
]);
```

Se os dados forem consumidos em componentes que podem chegar depois, usar estratégia compatível com React 19:

- criar boundaries de `Suspense` por bloco;
- deixar cada bloco resolver seu próprio fetch;
- usar `use()` apenas em cenários onde a arquitetura do componente exigir leitura de promessa dentro do render.

Regras:

- não serializar buscas que não dependem umas das outras;
- manter os dados da sidebar e do shell fora do caminho crítico da página de conteúdo;
- não agrupar consultas pesadas só por conveniência.

### 5) `next/dynamic` para gráfico e widgets pesados

O maior candidato a bloqueio é o gráfico de vendas.

Plano:

1. Extrair o gráfico para um componente isolado.
2. Importá-lo com `next/dynamic`.
3. Usar `ssr: false` se a biblioteca ou o canvas SVG/DOM não trouxer valor no server.
4. Exibir um skeleton específico enquanto o chunk é baixado.

Exemplo de diretriz:

- o card do gráfico deve aparecer imediatamente;
- o conteúdo interno do gráfico pode entrar depois;
- o fallback precisa ter a mesma altura do gráfico real.

Aplicações secundárias:

- widgets analíticos abaixo da dobra;
- painéis de detalhe da sidebar;
- componentes de tour/onboarding que não são necessários no primeiro paint.

### 6) Navegação sem bloqueio com `useTransition`

Se a navegação da sidebar depender de estado local ou de filtros no client, usar `useTransition` para não travar o thread principal.

Aplicar quando:

- a troca de módulo envolve estado local antes do `router.push`;
- filtros ou abas atualizam o conteúdo da tela;
- existe pré-carregamento de dados antes de mostrar o próximo estado.

Padrão desejado:

1. clicar no item da sidebar;
2. iniciar transição não bloqueante;
3. manter o shell responsivo;
4. mostrar fallback de loading do segmento;
5. substituir o conteúdo quando o server streaming finalizar.

### 7) Pré-carregamento e intenção de navegação

A sidebar deve antecipar a intenção do usuário.

Medidas:

- garantir que os links do `next/link` estejam com prefetch ativo quando fizer sentido;
- pré-carregar módulos mais acessados;
- manter a sidebar fora de re-renderizações desnecessárias;
- evitar que estados globais da navegação dependam de dados pesados do conteúdo principal.

### 8) PPR e `cacheComponents`

Como `cacheComponents: true` já está presente, o plano deve aproveitar a divisão entre partes estáticas e dinâmicas.

Direção:

- deixar o shell do dashboard e partes estáveis como prerenderizáveis;
- isolar trechos que precisam de dados frequentes em boundaries dinâmicos;
- permitir que o conteúdo estático apareça antes dos blocos que dependem de dados mais lentos.

Uso prático:

- sidebar, header e estrutura do shell podem ser altamente cacheáveis;
- cards que dependem de métricas ao vivo ficam em stream;
- se algum bloco puder ser derivado de dados já conhecidos no build/request, mantê-lo estático.

### 9) Evitar custo de navegação no layout comum

O `layout.tsx` do dashboard hoje carrega itens que podem ser caros se forem puxados em toda navegação.

Plano de ajuste:

- manter autenticação e verificação de sessão no layout, pois isso é crítico;
- mover consultas não críticas para o módulo/segmento específico;
- manter `SidebarPrincipal` com o mínimo de dependências pesadas;
- revisar hooks globais que podem disparar fetches toda vez que a sidebar monta.

### 10) Melhorias no shell visual de loading

Os estados de carregamento devem obedecer à identidade visual do CRM:

- fundo grafite escuro;
- bordas sutis;
- brilho de marca muito contido;
- densidade semelhante à tela real;
- nenhuma estética genérica de dashboard branco.

Isso é importante porque loading mal desenhado reduz a sensação de velocidade mesmo quando a técnica está correta.

## Ordem de implementação sugerida

### Fase 1: medição e isolamento

1. Mapear quais rotas mais travam na troca.
2. Identificar quais componentes são os maiores bundles.
3. Separar o que é shell persistente do que é conteúdo de rota.

### Fase 2: loading imediato

1. Criar `loading.tsx` no dashboard e nos segmentos mais usados.
2. Implementar skeletons de alta fidelidade para `Resumo`.
3. Garantir que o usuário nunca veja uma tela vazia.

### Fase 3: redução de bundle

1. Extrair `GraficoVendas` para `next/dynamic`.
2. Colocar `ssr: false` se o componente não agregar valor no server.
3. Mover outros widgets pesados para carregamento sob demanda.

### Fase 4: paralelismo de dados

1. Revisar fetches sequenciais.
2. Trocar por `Promise.all` onde houver independência.
3. Isolar boundaries `Suspense` por bloco.

### Fase 5: navegação não bloqueante

1. Aplicar `useTransition` em fluxos baseados em estado local.
2. Revisar `router.push` e filtros que possam bloquear o main thread.
3. Garantir que a sidebar continue responsiva sob carga.

### Fase 6: refinamento PPR

1. Confirmar quais áreas podem ser estáticas.
2. Manter dados dinâmicos apenas onde realmente precisam ser dinâmicos.
3. Validar se o comportamento de streaming realmente encurta o tempo percebido.

## Critérios de sucesso

- Troca entre módulos com sensação de resposta imediata.
- `loading.tsx` aparece instantaneamente e parece a tela final.
- Gráfico não bloqueia o primeiro paint.
- Sidebar continua utilizável durante navegação e fetch.
- Menos JS hidratado no caminho crítico.

## Observações de arquitetura

- Não mover toda a lógica para o client.
- Não transformar `loading.tsx` em mini-dashboard interativo.
- Não carregar `recharts` ou bibliotecas de gráficos antes da necessidade.
- Não quebrar o padrão modular do projeto: rota só roteia, módulo concentra lógica.

## Fontes oficiais consultadas

- Next.js `loading.tsx`: https://nextjs.org/docs/app/api-reference/file-conventions/loading
- Next.js lazy loading / `next/dynamic`: https://nextjs.org/docs/pages/guides/lazy-loading
- React `useTransition`: https://react.dev/reference/react/useTransition

