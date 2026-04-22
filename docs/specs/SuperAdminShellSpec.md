# Spec: SuperAdminShellSpec

Scope: feature

# Super Admin na Shell do Dashboard

## Objetivo
Reconstruir integralmente a experiência de super-admin dentro da shell principal do dashboard, removendo a rota isolada atual e transformando a feature em uma categoria nativa da navegação. A nova experiência deve herdar o design system e a linguagem operacional do dashboard, elevar a qualidade visual e manter todas as regras globais existentes sem bypass.

## Diretrizes de produto
- O nome funcional permanece `super-admin`.
- O acesso deixa de ser uma experiência isolada fora da shell e passa a acontecer pela navegação do dashboard.
- O super-admin não contorna trial, regras globais, proteções ou comportamentos já válidos para a shell.
- A feature deve parecer parte nativa do dashboard, e não um painel paralelo enxertado.
- A primeira entrega do remake foca exclusivamente na área de usuários globais.

## Arquitetura de navegação
### Desktop
- A sidebar principal passa a exibir uma categoria `Super Admin` somente quando `sessao.isSuperAdmin === true`.
- Essa categoria deve agrupar links internos da feature.
- Na primeira entrega, a categoria contém apenas o item `Usuários`.

### Mobile
- O acesso ao super-admin deve existir dentro da navegação móvel integrada ao dashboard.
- O item não deve poluir os atalhos principais de operação quando isso piorar a hierarquia visual.
- A recomendação padrão é expor o acesso dentro do menu secundário móvel da shell.

## Estrutura de rotas
- Remover a rota isolada atual de super-admin fora da shell.
- Recriar o entrypoint dentro do grupo `(dashboard)`.
- A rota funcional base permanece `\/super-admin`.
- A página inicial da feature pode redirecionar ou apresentar landing interna da categoria, mas a primeira entrega deve disponibilizar claramente a área `\/super-admin\/usuarios`.

## Escopo da primeira entrega
### Área: Usuários
Implementar uma experiência completa, funcional e visualmente refinada para gestão global de usuários.

### Capacidades obrigatórias
- Listar empresas e funcionários.
- Filtrar por tipo de usuário.
- Paginar resultados.
- Editar nome e email.
- Redefinir senha.
- Excluir usuário com confirmação robusta.
- Exibir claramente o estado de `Super Admin` quando aplicável.
- Exibir contexto adicional quando o usuário for funcionário, incluindo empresa associada.

## UX/UI
### Princípios obrigatórios
- Preservar a herança visual positiva do dashboard existente.
- Aplicar dark premium operacional, bordas sutis, superfícies grafite e hierarquia por tamanho.
- Priorizar affordance imediata, feedback instantâneo e leitura clara em densidade alta.
- Evitar aparência genérica de tabela administrativa comum.
- Manter consistência com componentes compartilhados da shell sempre que fizer sentido.

### Estrutura visual recomendada
- Header de módulo com título, descrição curta e ações principais.
- Bloco de contexto da categoria `Super Admin` integrado ao restante da shell.
- Área principal com listagem refinada, filtros e ações contextuais.
- Estados de carregamento, vazio, erro e sucesso tratados visualmente.
- Diálogos de editar, redefinir senha e excluir alinhados ao design system já usado no dashboard.

## Segurança e regras
- A navegação visual só aparece para `isSuperAdmin` verdadeiro.
- As páginas server-side devem revalidar acesso de super-admin.
- As APIs devem revalidar acesso de super-admin no servidor.
- Nenhuma regra global deve ser contornada por estar dentro da área de super-admin.
- Autoexclusão de super-admin deve continuar bloqueada.
- Validações de email único e senha mínima devem ser preservadas ou endurecidas, nunca relaxadas.

## Modularização e clean code
- A feature deve ser quebrada em arquivos semânticos pequenos.
- Evitar módulo monolítico concentrando página, tabela, filtros, estados e diálogos no mesmo arquivo.
- Manter cada unidade funcional dentro do limite de modularização acordado.
- Reaproveitar componentes compartilhados da shell sempre que isso reduzir duplicação sem comprometer clareza.

## Critérios de aceite
- Não existe mais rota isolada de super-admin fora da shell.
- Existe categoria `Super Admin` na navegação da shell para usuários autorizados.
- A primeira entrega contém a área `Usuários` funcional dentro dessa categoria.
- CRUD de usuários funciona para empresas e funcionários.
- A UI final está visualmente integrada ao dashboard e superior ao painel atual.
- Usuários sem privilégio de super-admin não visualizam a categoria nem acessam as páginas ou APIs da feature.
- A migração é validada com o comando obrigatório do projeto: `npm run pm2:prod`.