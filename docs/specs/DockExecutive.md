# Spec: DockExecutive

Scope: feature

# Chat Filter Dock - Variante Executiva

## Direcao visual fechada
A linguagem visual da implementacao deve ser contida, executiva e orientada a produto operacional.

### Principios
- Priorizar leitura, densidade controlada e estabilidade visual.
- Evitar excesso de brilho, glass decorativo, gradientes chamativos ou ornamentacao com cara de conceito gerado por IA.
- Manter o dark premium atual do projeto, mas com profundidade discreta.
- Dar a sensacao de dock operacional lateral, nao de modal ou popover espetaculoso.

### O que evitar
- Bloco expandido empurrando a inbox para baixo.
- Overlay cobrindo a lista de chats.
- Badges excessivos, icones decorativos ou metricas com cara promocional.
- Animacoes largas ou chamativas.

## Arquitetura de implementacao fechada

### Estrutura desktop
No desktop, os filtros nao devem usar overlay por portal sobre a interface principal. O comportamento final deve ser um dock lateral interno ao shell do modulo.

Estrutura esperada de layout em `src/modules/chat/page.tsx`:
- Coluna 1: sidebar da inbox.
- Coluna 2: filter dock colapsavel, com largura reservada apenas quando aberto.
- Coluna 3: painel da conversa.

Quando o dock estiver fechado:
- Sidebar e conversa ocupam o layout atual.
- A coluna do dock fica com largura zero e sem interacao.

Quando o dock estiver aberto:
- A coluna intermediaria expande para aproximadamente 360px.
- O painel da conversa recua para acomodar o dock.
- A lista de chats continua totalmente visivel dentro da sidebar, sem ser coberta.

### Estrutura mobile
No mobile, o comportamento final deve usar `Sheet`, mantendo o mesmo conteudo funcional do dock.

## Responsabilidade por componente

### `src/modules/chat/page.tsx`
- Passa a controlar o estado do dock desktop.
- Renderiza a coluna intermediaria do filter dock.
- Mantem a sidebar como origem do trigger.

### `src/modules/chat/components/chat-sidebar.tsx`
- Deixa de renderizar os filtros inline abaixo da busca.
- Mantem o trigger de `Filtros`.
- No desktop, o trigger abre/fecha o dock controlado pelo parent.
- No mobile, o trigger abre um `Sheet` com o mesmo conteudo.

### Novo conteudo reutilizavel
A implementacao deve extrair o miolo dos filtros para um componente reutilizavel, usado em:
- dock desktop
- sheet mobile

Esse componente deve receber apenas props de estado e handlers ja existentes, sem mover a logica de filtro para dentro dele.

## Conteudo do dock

### Cabecalho
- Titulo curto: `Filtros`
- Subtitulo discreto com resumo de filtros ativos
- Acao primaria secundaria: `Limpar tudo`
- Acao de fechar no desktop

### Resumo executivo
- Tres metricas compactas em estilo operacional: `Novos`, `Sem dono`, `Sem negocio`
- Sem icone ornamental obrigatorio
- Valores com leitura imediata e pouco ruido visual

### Grupos
- `Origem`
- `Fila`
- `Canal`

Os chips devem parecer controles de operacao, nao tags promocionais.

### Estado de sincronizacao
- Bloco final compacto
- Linha de status atual
- Linha de ultimo sync
- Quando houver erro, exibir mensagem com `aria-live` ou apresentacao anunciavel equivalente

## Diretrizes de estilo
- Largura inicial alvo do dock desktop: 360px
- Bordas discretas
- Fundo levemente elevado em relacao ao painel principal
- Titulos pequenos em uppercase apenas quando ajudarem segmentacao
- Maior enfase em alinhamento, espacamento e contraste do que em efeito visual
- Animacao curta e contida, focada em largura/opacidade sem deslocamento exagerado

## Criterio de prontidao para implementacao
Este plano esta fechado sem dependencias de design adicionais. A implementacao deve seguir esta variante como decisao final, sem reabrir tradeoff entre visual premium editorial versus executivo.