---
plan name: meta-capi
plan description: Integração automática de conversão
plan status: active
---

## Idea
Implementar integração Meta CAPI no CRM para disparar automaticamente um evento de conversão quando um lead mudar para fechado, usando phone number hash como identificador e sem depender do lead_id original. O plano deve contemplar configuração em /integracoes, persistência segura de credenciais e estados de envio, idempotência para evitar eventos duplicados, observabilidade e migração sem perda de dados se novos campos de banco forem necessários.

## Implementation
- Mapear os pontos atuais do CRM onde o estágio do lead muda para 'fechado' e definir o gatilho exato do evento.
- Desenhar a configuração da Meta CAPI em /integracoes, incluindo campos de credenciais, status de ativação e validação de conexão.
- Definir o modelo de dados necessário para rastrear envio do evento, garantindo migração não destrutiva e preservação de dados existentes.
- Especificar a construção do payload oficial da Meta usando phone number em hash, event_time e action_source/system_generated com event_source=crm.
- Projetar a fila ou execução assíncrona do disparo automático ao fechar o lead, com idempotência e tratamento de reenvio/erro.
- Detalhar logging, auditoria e métricas mínimas para acompanhar sucesso, falha e duplicidade de eventos.
- Planejar validação funcional e técnica do fluxo, incluindo casos de lead já fechado, reabertura, reprocessamento e ausência de telefone válido.

## Required Specs
<!-- SPECS_START -->
- meta-capi-feature
<!-- SPECS_END -->