---
plan name: SuperAdmin
plan description: Super Admin panel implementation
plan status: done
---

## Idea
Implementar sistema de Super Admin com campo booleano isSuperAdmin na tabela Empresa, página separada em /super-admin, listagem de todos os usuários, edição, redefinição de senhas e exclusão. Usuário inicial: limawebvision@gmail.com

## Implementation
- 1. Adicionar campo isSuperAdmin Boolean na tabela Empresa no schema.prisma (DEFAULT false)
- 2. Criar migrations para adicionar o campo ao banco de dados
- 3. Atualizar типоз SESSION_TOKEN para incluir isSuperAdmin
- 4. Modificar login route para verificar isSuperAdmin e incluir no token
- 5. Criar middleware de autenticação para rotas de super admin (/api/super-admin/*)
- 6. Implementar API route GET /api/super-admin/usuarios - listar todos os usuários (empresas e funcionários)
- 7. Implementar API route PUT /api/super-admin/usuarios/[id] - editar informações do usuário
- 8. Implementar API route PUT /api/super-admin/usuarios/[id]/senha - redefinir senha
- 9. Implementar API route DELETE /api/super-admin/usuarios/[id] - excluir conta
- 10. Criar página React /app/super-admin/page.tsx com UI para listar usuários
- 11. Criar componentes de edição inline ou modal para usuário
- 12. Garantir que limawebvision@gmail.com tenha isSuperAdmin=true no seed/migration inicial
- 13. Executar build e validar com npm run pm2:prod

## Required Specs
<!-- SPECS_START -->
- SuperAdminSpec
<!-- SPECS_END -->