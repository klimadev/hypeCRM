# Spec: FeedbackHubSpec

Scope: feature

# Feature Spec: Feedback Hub

## Objetivo
Implementar um canal global e nativo dentro da shell do dashboard para que usuários autenticados reportem bugs e enviem sugestões de melhoria, com envio simples, contexto técnico automático e consolidação integral em um único painel operacional para super admins.

## Escopo da V1
- Disponibilizar uma ação global para `Reportar bug` e `Enviar sugestão` dentro da shell do dashboard.
- Permitir envio apenas em texto na V1.
- Capturar contexto técnico automático no momento do envio.
- Persistir os registros de feedback com tipagem e status operacionais.
- Disponibilizar um painel `Super Admin > Feedbacks` para triagem e gestão.
- Registrar histórico de eventos relevantes do ciclo de vida do feedback.

## Fora de escopo da V1
- Upload de screenshots ou outros anexos.
- Acompanhamento de status pelo usuário final.
- Comentários/respostas visíveis ao usuário final.
- Notificações em tempo real, badges ou push para super admins.
- Automação de deduplicação ou classificação por IA.

## Usuários e permissões
### Usuário autenticado
- Pode criar feedback do tipo `BUG` ou `SUGESTAO`.
- Não pode visualizar a fila global nem editar o item após envio.
- Recebe apenas confirmação local de envio.

### Super Admin
- Visualiza a área `Super Admin > Feedbacks`.
- Pode listar, filtrar, abrir detalhes, atualizar status, atualizar prioridade e registrar notas internas.
- Acesso deve ser protegido tanto na UI quanto no servidor.

## Arquitetura funcional
### Entrada global na shell
- A ação deve existir na shell principal do dashboard, sem criar página paralela fora do fluxo atual.
- Desktop e mobile devem manter a mesma linguagem visual do produto.
- A entrada deve priorizar affordance imediata e submissão curta.

### Fluxo do usuário final
1. Usuário aciona `Reportar bug` ou `Enviar sugestão`.
2. Sistema abre sheet ou dialog curto com formulário.
3. Usuário informa tipo, título, descrição e impacto percebido.
4. Cliente anexa contexto técnico automático invisível ao usuário.
5. API valida sessão e payload.
6. Registro é persistido com status inicial `NOVO`.
7. Sistema cria evento inicial de histórico.
8. Usuário recebe toast de sucesso ou erro.

### Fluxo do Super Admin
1. Super admin acessa `Super Admin > Feedbacks`.
2. Painel lista itens com filtros operacionais.
3. Admin abre detalhe lateral ou tela de detalhe.
4. Admin atualiza status, prioridade e nota interna.
5. Cada mudança relevante gera evento de histórico.

## Modelo de dados recomendado
### Entidade principal
`FeedbackItem`
- `id`
- `id_empresa`
- `id_usuario`
- `perfil_usuario`
- `tipo` (`BUG` | `SUGESTAO`)
- `titulo`
- `descricao`
- `impacto`
- `status` (`NOVO` | `EM_TRIAGEM` | `PLANEJADO` | `RESOLVIDO` | `DESCARTADO`)
- `prioridade` (`BAIXA` | `MEDIA` | `ALTA` | `CRITICA`)
- `rota_origem`
- `modulo_origem`
- `url_origem`
- `viewport`
- `user_agent`
- `build_ref`
- `criado_em`
- `atualizado_em`

### Entidade de histórico
`FeedbackEvento`
- `id`
- `id_feedback`
- `acao`
- `autor_id`
- `autor_tipo`
- `de_status`
- `para_status`
- `meta_json`
- `criado_em`

## Contratos de API
### POST `/api/feedback`
Cria um novo feedback para usuário autenticado.

#### Payload mínimo
```json
{
  "tipo": "BUG",
  "titulo": "Erro ao salvar automação",
  "descricao": "Ao clicar em publicar, a tela volta sem feedback.",
  "impacto": "bloqueia_operacao"
}
```

#### Contexto anexado automaticamente
- empresa
- usuário
- perfil
- rota/url atual
- módulo de origem
- viewport
- user agent
- timestamp
- referência de build se disponível

#### Resposta esperada
```json
{
  "ok": true,
  "id": "feedback-id"
}
```

### GET `/api/super-admin/feedbacks`
Lista feedbacks com paginação e filtros.

#### Filtros suportados
- `tipo`
- `status`
- `prioridade`
- `empresa`
- `modulo`
- `pagina`
- `limite`

### GET `/api/super-admin/feedbacks/[id]`
Retorna detalhe do feedback e timeline de eventos.

### PATCH `/api/super-admin/feedbacks/[id]`
Atualiza status, prioridade e nota interna.

## UI/UX
### Entrada global
- Usar componente curto e nativo da shell.
- Linguagem visual alinhada ao dashboard.
- CTA claro com ícone + label curto.
- Feedback visual imediato no envio.

### Painel super admin
- Nova entrada de navegação em `Super Admin` para `Feedbacks`.
- Header de módulo com resumo operacional.
- Filtros compactos e legíveis.
- Lista principal com tipo, título, origem, empresa, status, prioridade e data.
- Detalhe operacional com descrição completa, contexto técnico e histórico.
- Estado vazio, erro e carregamento tratados visualmente.

## Segurança e integridade
- Toda criação exige sessão válida.
- Toda gestão administrativa exige `isSuperAdmin === true` revalidado no servidor.
- O sistema deve sanitizar entradas textuais para evitar persistência de conteúdo malicioso.
- O contexto técnico capturado não deve incluir segredos, tokens ou payloads sensíveis.
- A trilha de histórico deve registrar autor e transição de status.

## Herança sistêmica obrigatória
- Shell global do dashboard
- Navegação super admin desktop
- Menu móvel secundário
- Guards de autenticação e autorização
- Banco Prisma
- APIs server-side
- Componentes compartilhados de feedback visual
- Histórico/auditoria operacional

## Critérios de aceite
- Usuário autenticado consegue enviar bug ou sugestão a partir da shell.
- Envio persiste item com contexto técnico automático e status inicial `NOVO`.
- Super admin visualiza a nova área `Feedbacks` dentro de `Super Admin`.
- Super admin consegue filtrar, abrir e atualizar feedbacks.
- Mudanças administrativas geram histórico de eventos.
- UI permanece consistente com a shell do dashboard em desktop e mobile.
- A V1 não introduz anexos, acompanhamento do usuário ou realtime.
- Entrega validada com `npm run pm2:prod` quando entrar em implementação.