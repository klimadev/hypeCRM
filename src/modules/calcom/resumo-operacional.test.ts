import { describe, expect, it } from "vitest";
import { criarResumoOperacionalCalCom } from "./resumo-operacional";
import type { CalComBooking, CalComEventType, CalComInstancia } from "./types";

const instanciaBase: CalComInstancia = {
  id: "inst-1",
  nome: "Calendario comercial",
  status: "active",
  profile_name: "Equipe Hype",
  profile_email: "agenda@hypecrm.com",
  criado_em: "2026-03-31T12:00:00.000Z",
  atualizado_em: "2026-03-31T12:00:00.000Z",
};

const bookingBase: CalComBooking = {
  uid: "booking-1",
  title: "Reuniao de fechamento",
  start: "2026-04-01T13:00:00.000Z",
  status: "upcoming",
  meetingUrl: "https://cal.com/meeting/1",
  attendees: [{ name: "Cliente", email: "cliente@exemplo.com" }],
  instanciaNome: "Calendario comercial",
};

const eventTypeBase: CalComEventType = {
  id: 1,
  slug: "reuniao-comercial",
  title: "Reuniao comercial",
  description: "Agenda para oportunidades qualificadas",
  length: 30,
  schedulingUrl: "https://cal.com/hypecrm/reuniao-comercial",
  instanciaNome: "Calendario comercial",
};

describe("criarResumoOperacionalCalCom", () => {
  it("resume conexoes ativas e volume operacional", () => {
    const resumo = criarResumoOperacionalCalCom({
      instancias: [instanciaBase, { ...instanciaBase, id: "inst-2", status: "inactive" }],
      bookings: [bookingBase, { ...bookingBase, uid: "booking-2" }],
      eventTypes: [eventTypeBase, { ...eventTypeBase, id: 2, slug: "demo-executiva" }],
    });

    expect(resumo.totalInstancias).toBe(2);
    expect(resumo.instanciasAtivas).toBe(1);
    expect(resumo.totalBookings).toBe(2);
    expect(resumo.totalEventTypes).toBe(2);
    expect(resumo.temConexaoAtiva).toBe(true);
    expect(resumo.rotuloStatus).toBe("1 conexao ativa");
  });

  it("indica onboarding quando nao ha conexoes criadas", () => {
    const resumo = criarResumoOperacionalCalCom({
      instancias: [],
      bookings: [],
      eventTypes: [],
    });

    expect(resumo.totalInstancias).toBe(0);
    expect(resumo.instanciasAtivas).toBe(0);
    expect(resumo.temConexaoAtiva).toBe(false);
    expect(resumo.rotuloStatus).toBe("Nenhuma conexao ativa");
    expect(resumo.mensagemOperacional).toBe("Cadastre uma API key valida para liberar agenda, bookings e tipos de evento.");
  });
});
