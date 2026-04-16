# Spec: meta-capi-feature

Scope: feature

Feature: Integração automática da Meta Conversions API no CRM.

Objetivo:
Disparar automaticamente um evento de conversão quando um lead mudar para o estágio 'fechado', usando o telefone do lead como identificador hash, sem depender do lead_id original.

Requisitos funcionais:
- A integração deve ser configurável em /integracoes.
- O disparo deve ocorrer automaticamente quando o lead entrar em 'fechado'.
- O payload deve usar phone number hash no user_data.
- O sistema deve enviar event_time, event_name e os campos exigidos pela documentação oficial da Meta.
- O envio deve ser idempotente para evitar conversões duplicadas no mesmo fechamento.
- O sistema deve registrar sucesso, falha e tentativas de reenvio.

Restrições:
- Não há disponibilidade do lead_id original.
- Não pode haver perda de dados em caso de alterações de banco.
- Se novos campos forem necessários, a migração deve ser aditiva e segura.
- O fluxo deve preservar comportamento existente do CRM.

Critérios de aceitação:
- Ao mover um lead para 'fechado', um evento válido é enviado automaticamente.
- O evento falha de forma observável quando não houver telefone válido.
- Reenvios não geram duplicidade para o mesmo fechamento.
- A configuração pode ser ativada/desativada sem afetar outros módulos.
- O armazenamento adicional, se existir, não remove nem sobrescreve dados existentes.