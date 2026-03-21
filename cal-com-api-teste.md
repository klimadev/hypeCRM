# Cal.com API - Testes Realizados

## Autenticação
- **Header**: `Authorization: Bearer <api-key>`
- **Prefixo da key**: `cal_live_` (modo produção)
- **Header de versão**: `cal-api-version` (varia por endpoint)

## Endpoints Testados com Sucesso

### 1. Listar Event Types
```bash
curl -X GET "https://api.cal.com/v2/event-types" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2024-06-14"
```
**Response**: Retorna array de event types com id, title, slug, duration, etc.

---

### 2. Ver Slots Disponíveis
```bash
curl -X GET "https://api.cal.com/v2/slots?eventTypeId=4934015&start=2026-03-21&end=2026-03-25" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2024-09-04"
```
**Params obrigatórios**: `eventTypeId` (ou username + eventTypeSlug), `start`, `end`
**Response**: Objeto com datas como chaves e array de slots disponíveis.

---

### 3. Criar Agendamento (Booking)
```bash
curl -X POST "https://api.cal.com/v2/bookings" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2024-08-13" \
  -H "Content-Type: application/json" \
  -d '{
    "eventTypeId": 4934015,
    "start": "2026-03-23T12:30:00.000Z",
    "attendee": {
      "name": "Teste API",
      "email": "teste@exemplo.com",
      "timeZone": "America/Sao_Paulo"
    },
    "bookingFieldsResponses": {
      "title": "Teste de agendamento via API"
    }
  }'
```
**Obs**: Campo `title` é obrigatório nos bookingFieldsResponses.
**Response**: Objeto com uid do booking, status, etc.

---

### 4. Cancelar Agendamento
```bash
curl -X POST "https://api.cal.com/v2/bookings/{bookingUid}/cancel" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2026-02-25" \
  -H "Content-Type: application/json" \
  -d '{"cancellationReason": "Motivo do cancelamento"}'
```
**Método**: POST (não DELETE), não é `/v2/bookings/{uid}` e sim `/v2/bookings/{uid}/cancel`
**Response**: Booking atualizado com status "cancelled"

---

## Headers de Versão por Endpoint
| Endpoint | cal-api-version |
|----------|-----------------|
| GET /v2/event-types | 2024-06-14 |
| GET /v2/slots | 2024-09-04 |
| POST /v2/bookings | 2024-08-13 |
| POST /v2/bookings/{uid}/cancel | 2026-02-25 |

### 5. Listar Agendamentos (Bookings)

```bash
# Todos os agendamentos (sem filtro)
curl -X GET "https://api.cal.com/v2/bookings" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2026-02-25"
```

**Filtros disponíveis:**
- `status`: `upcoming`, `past`, `cancelled` (pode usar múltiplos separado por vírgula)
- `afterStart`: Data inicial (ISO 8601)
- `beforeEnd`: Data final (ISO 8601)
- `eventTypeIds`: Filtrar por ID do event type
- `attendeeName`: Nome do participante
- `attendeeEmail`: Email do participante

**Exemplos:**

```bash
# Agendamentos futuros (upcoming)
curl -X GET "https://api.cal.com/v2/bookings?status=upcoming" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2026-02-25"

# Agendamentos passados
curl -X GET "https://api.cal.com/v2/bookings?status=past" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2026-02-25"

# Por período específico
curl -X GET "https://api.cal.com/v2/bookings?afterStart=2026-03-23T00:00:00.000Z&beforeEnd=2026-03-25T23:59:59.000Z" \
  -H "Authorization: Bearer cal_live_7db3cd6bd16ec1f17d0c3dfeacc0c952" \
  -H "cal-api-version: 2026-02-25"
```

**Response**: Array de bookings com id, uid, title, start, end, attendees, status, etc.

**Dados retornados em cada booking:**
- `id`: ID interno
- `uid`: UID único do booking
- `title`: Título do evento
- `start` / `end`: Data/hora de início e fim
- `duration`: Duração em minutos
- `status`: accepted, cancelled, etc.
- `attendees`: Array com nome, email, timezone do participante
- `eventType`: ID e slug do tipo de evento
- `meetingUrl`: Link da reunião (Google Meet)
- `location`: Local da reunião
- `createdAt`: Data de criação
- `bookingFieldsResponses`: Respostas dos campos do formulário

---

## Resultados dos Testes

### Lista de event types (1 evento)
- ID: 4934015
- Title: "APRESENTAÇÃO- CHAMALEAD"
- Slug: 30min
- Duração: 30 min

### Agendamentos upcoming (semana que vem)
1. **23/03 às 12:00** - Marcelo (kevinpeggyfly@gmail.com)
2. **24/03 às 12:30** - Marcelo (kevinpeggyfly@gmail.com)

### Agendamentos past (6 encontrados)
Diversos agendamentos entre 09 e 20 de março.

### Filtro por data (23-25/03)
3 agendamentos encontrados (2 upcoming + 1 cancelado)