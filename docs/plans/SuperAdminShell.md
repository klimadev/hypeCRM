---
plan name: SuperAdminShell
plan description: Shell-first global admin
plan status: done
---

## Idea
Refazer completamente a experiência de super-admin dentro da shell do dashboard, removendo a rota isolada atual e reconstruindo a feature como uma categoria nativa da navegação principal. O remake deve preservar a linguagem visual do dashboard, elevar a qualidade de UX/UI conforme AGENTS.md, manter segurança e regras existentes sem bypass, e reorganizar o módulo em partes semânticas pequenas para respeitar o limite de módulos com menos de 600 linhas no total por unidade funcional.

## Implementation
- Mapear a arquitetura atual do super-admin, da shell do dashboard e dos pontos de segurança já existentes para definir o perímetro exato da migração.
- Definir a nova arquitetura de informação do super-admin dentro do dashboard, incluindo categoria de navegação, páginas internas, estados vazios, ações e fluxos principais.
- Projetar a estratégia de roteamento e proteção para remover a rota isolada atual e recriar o acesso do super-admin a partir da shell, sem contornar trial, permissões ou demais regras globais.
- Redesenhar a feature com componentes semânticos e modulares pequenos, alinhados ao visual premium operacional já usado no dashboard e ao limite de modularização estabelecido.
- Refatorar e consolidar a camada de dados e APIs do super-admin para suportar a nova experiência com segurança, feedback claro e baixo acoplamento.
- Integrar navegação desktop e mobile do super-admin na shell do dashboard, mantendo prioridade visual correta e sem poluir os atalhos principais.
- Validar a migração completa e o comportamento final da navegação, proteção de acesso e consistência visual usando o pipeline obrigatório do projeto no encerramento da implementação.

## Required Specs
<!-- SPECS_START -->
- SuperAdminShellSpec
<!-- SPECS_END -->