import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  listarBookingsCalCom,
  listarEventTypesCalCom,
  listarSlotsCalCom,
} from "@/lib/api/calcom";
import type { CalComBooking, CalComEventType } from "@/lib/api/calcom";

const MAX_EVENT_TYPES_PER_INSTANCIA = 12;

type CalComInstanciaComChave = Prisma.CalComInstanciaGetPayload<{
  select: {
    id: true;
    nome: true;
    api_key: true;
    status: true;
    profile_name: true;
    profile_email: true;
    criado_em: true;
    atualizado_em: true;
  };
}>;

export type CalComInstanciaSanitizada = {
  id: string;
  nome: string;
  status: string;
  profile_name: string | null;
  profile_email: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type CalComBookingResumido = {
  uid: string;
  title: string;
  start: string;
  end?: string;
  status: string;
  meetingUrl: string | null;
  attendees: Array<{ name: string; email: string; timeZone?: string }>;
  instanciaNome: string;
};

export type CalComEventTypeResumido = {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  length: number;
  schedulingUrl: string;
  instanciaNome: string;
};

export type CalComSlotResumido = {
  startTime: string;
  endTime: string;
  available: boolean;
  instanciaNome: string;
};

export type CalComDashboardPayload = {
  instancias: CalComInstanciaSanitizada[];
  bookings: CalComBookingResumido[];
  totalBookings: number;
  eventTypes: CalComEventTypeResumido[];
};

function sanitizarInstancia(instancia: CalComInstanciaComChave): CalComInstanciaSanitizada {
  return {
    id: instancia.id,
    nome: instancia.nome,
    status: instancia.status,
    profile_name: instancia.profile_name,
    profile_email: instancia.profile_email,
    criado_em: instancia.criado_em.toISOString(),
    atualizado_em: instancia.atualizado_em.toISOString(),
  };
}

function normalizarBooking(booking: CalComBooking, instanciaNome: string): CalComBookingResumido | null {
  const start =
    booking.startTime || booking.start || (typeof booking.metadata?.start === "string" ? booking.metadata.start : undefined);
  if (!start) return null;

  const dataInicio = new Date(start);
  if (Number.isNaN(dataInicio.getTime())) return null;

  const end = booking.endTime || booking.end || (typeof booking.metadata?.end === "string" ? booking.metadata.end : undefined);
  const meetingUrl =
    typeof booking.metadata?.videoCallUrl === "string"
      ? booking.metadata.videoCallUrl
      : booking.references
          ?.find((referencia: CalComBooking["references"][number]) => referencia.type.includes("video"))
          ?.meetingUrl || null;

  return {
    uid: booking.uid,
    title: booking.title,
    start,
    end,
    status: booking.status,
    meetingUrl,
    attendees: booking.attendees || [],
    instanciaNome,
  };
}

function normalizarEventType(eventType: CalComEventType, instanciaNome: string): CalComEventTypeResumido {
  return {
    id: eventType.id,
    slug: eventType.slug,
    title: eventType.title,
    description: eventType.description,
    length: eventType.length,
    schedulingUrl: eventType.schedulingUrl,
    instanciaNome,
  };
}

async function buscarInstanciasComChave(idEmpresa: string) {
  return prisma.calComInstancia.findMany({
    where: { id_empresa: idEmpresa, status: "active" },
    orderBy: { criado_em: "desc" },
    select: {
      id: true,
      nome: true,
      api_key: true,
      status: true,
      profile_name: true,
      profile_email: true,
      criado_em: true,
      atualizado_em: true,
    },
  });
}

export async function listarInstanciasAtivas(idEmpresa: string) {
  const instancias = await prisma.calComInstancia.findMany({
    where: { id_empresa: idEmpresa, status: "active" },
    orderBy: { criado_em: "desc" },
    select: {
      id: true,
      nome: true,
      status: true,
      profile_name: true,
      profile_email: true,
      criado_em: true,
      atualizado_em: true,
    },
  });
  return instancias.map((instancia) => ({
    ...instancia,
    criado_em: instancia.criado_em.toISOString(),
    atualizado_em: instancia.atualizado_em.toISOString(),
  }));
}

export async function listarBookingsPorEmpresa(idEmpresa: string, params: { status: string; afterStart: string; limit: number }) {
  const instancias = await buscarInstanciasComChave(idEmpresa);
  if (instancias.length === 0) {
    return { bookings: [] as CalComBookingResumido[], total: 0 };
  }

  const resultados = await Promise.all(
    instancias.map(async (instancia) => {
      try {
        const dados = await listarBookingsCalCom(instancia.api_key, {
          status: params.status,
          afterStart: params.afterStart,
          limit: params.limit,
        });
        return dados
          .map((booking) => normalizarBooking(booking, instancia.nome))
          .filter((item): item is CalComBookingResumido => Boolean(item));
      } catch (erro) {
        console.error("Erro ao buscar bookings Cal.com", erro);
        return [] as CalComBookingResumido[];
      }
    }),
  );

  const allBookings = resultados
    .flat()
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return { bookings: allBookings.slice(0, params.limit), total: allBookings.length };
}

export async function listarEventTypesPorEmpresa(idEmpresa: string) {
  const instancias = await buscarInstanciasComChave(idEmpresa);
  if (instancias.length === 0) {
    return [] as CalComEventTypeResumido[];
  }

  const resultados = await Promise.all(
    instancias.map(async (instancia) => {
      try {
        const eventTypes = await listarEventTypesCalCom(instancia.api_key);
        return eventTypes
          .slice(0, MAX_EVENT_TYPES_PER_INSTANCIA)
          .map((eventType) => normalizarEventType(eventType, instancia.nome));
      } catch (erro) {
        console.error("Erro ao buscar event types Cal.com", erro);
        return [] as CalComEventTypeResumido[];
      }
    }),
  );

  return resultados.flat();
}

export async function listarSlotsPorEmpresa(
  idEmpresa: string,
  params: { eventTypeSlug: string; startTime: string; endTime: string; timeZone: string },
): Promise<CalComSlotResumido[]> {
  const instancias = await buscarInstanciasComChave(idEmpresa);
  if (instancias.length === 0) {
    return [];
  }

  const resultados = await Promise.all(
    instancias.map(async (instancia) => {
      try {
        const slots = await listarSlotsCalCom(instancia.api_key, params);
        return slots.map((slot) => ({ ...slot, instanciaNome: instancia.nome }));
      } catch (erro) {
        console.error("Erro ao buscar slots Cal.com", erro);
        return [] as CalComSlotResumido[];
      }
    }),
  );

  return resultados.flat();
}

export async function construirDashboardCalCom(
  idEmpresa: string,
  options: { status: string; afterStart: string; limit: number },
): Promise<CalComDashboardPayload> {
  const instanciasComChave = await buscarInstanciasComChave(idEmpresa);
  const instancias = instanciasComChave.map(sanitizarInstancia);

  if (instanciasComChave.length === 0) {
    return { instancias, bookings: [], totalBookings: 0, eventTypes: [] };
  }

  const [bookingsResult, eventTypes] = await Promise.all([
    listarBookingsPorEmpresa(idEmpresa, options),
    listarEventTypesPorEmpresa(idEmpresa),
  ]);

  return {
    instancias,
    bookings: bookingsResult.bookings,
    totalBookings: bookingsResult.total,
    eventTypes,
  };
}
