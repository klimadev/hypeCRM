# Spec: ChatPipelineSpec

Scope: feature

# Escolha de pipeline e etapa no chat

## Objetivo
Permitir que a criação de negócio a partir do chat escolha explicitamente o pipeline e a etapa inicial antes de confirmar a ação. O fluxo deve continuar enxuto para operação diária, mas deixar de depender apenas do pipeline principal ou da herança implícita do estágio atual do lead.

## Escopo funcional
- Evoluir o diálogo de `Criar negócio` no chat para incluir seleção de pipeline e etapa.
- Carregar pipelines ativos disponíveis para a empresa atual.
- Após selecionar um pipeline, carregar ou resolver as etapas correspondentes.
- Enviar a etapa escolhida no submit final da criação de negócio.
- Garantir coerência entre pipeline selecionado e etapa enviada.

## Comportamento esperado
- Ao acionar `Criar negócio` no chat, o usuário abre um diálogo com os campos atuais e mais os seletores de pipeline e etapa.
- O usuário escolhe primeiro o pipeline.
- Em seguida, escolhe a etapa inicial dentro daquele pipeline.
- O submit só deve prosseguir quando a combinação obrigatória estiver válida.
- A criação do negócio continua acontecendo a partir do fluxo já existente da API do chat.

## Regras de negócio
- Pipeline e etapa devem ser escolhas explícitas neste fluxo.
- A etapa selecionada deve pertencer ao pipeline selecionado.
- O backend continua podendo derivar `id_funil` pela etapa, mas a implementação deve tornar essa relação explícita e validável.
- Se existir um valor padrão útil para pipeline ou etapa, ele pode ser pré-selecionado apenas se não gerar ambiguidade operacional.
- A ausência de etapa válida deve bloquear a confirmação.

## Regras de UX/UI
- O diálogo deve permanecer enxuto e operacional.
- Reaproveitar os padrões de `Select` já usados em outros diálogos do módulo.
- O carregamento de pipeline/etapa precisa ser claro, sem transformar o modal em tela de CRM completa.
- O usuário deve entender facilmente a sequência: pipeline primeiro, etapa depois.
- Estados de loading, vazio e erro precisam ser tratados com clareza suficiente, sem excesso de texto.

## Restrições técnicas
- Reaproveitar APIs e contratos já existentes sempre que possível.
- Evitar criar backend novo se a combinação pipeline + etapa puder ser suportada com os endpoints já disponíveis.
- Se for necessário ajustar a API `/api/chat/orphan/criar-negocio`, a mudança deve ser mínima e focada em validação/coerência do payload.
- Não duplicar lógica complexa do kanban dentro do chat; o chat deve consumir uma versão reduzida do fluxo.

## Fontes de dados prováveis
- `GET /api/pipelines`
- Estrutura de etapas já disponível por pipeline ou por contratos correlatos do CRM/kanban
- `POST /api/chat/orphan/criar-negocio`

## Arquivos provavelmente envolvidos
- `src/modules/chat/components/chat-panel.tsx`
- `src/modules/chat/components/chat-orphan-dialog.tsx`
- `src/modules/chat/hooks/use-chat-module.ts`
- `src/app/api/chat/orphan/criar-negocio/route.ts`
- Eventualmente algum client helper/API de apoio para pipelines/etapas

## Critérios de aceite
- O modal de criação de negócio permite escolher pipeline e etapa.
- A etapa apresentada depende do pipeline selecionado.
- O submit envia uma combinação válida e consistente.
- O fluxo continua simples para uso operacional no chat.
- Não há regressão no fluxo atual de criação de negócio.
- O projeto valida com `npm run pm2:prod`.

## Fora de escopo
- Recriar a experiência completa do kanban dentro do chat.
- Editar pipeline/etapa do negócio depois de criado neste mesmo fluxo.
- Criar novos pipelines ou etapas a partir do chat.