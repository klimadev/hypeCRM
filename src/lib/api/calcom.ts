export interface CalComBooking {
  id: number;
  uid: string;
  title: string;
  description: string | null;
  startTime?: string;
  endTime?: string;
  start?: string;
  end?: string;
  status: string;
  attendees: Array<{
    name: string;
    email: string;
    timeZone: string;
  }>;
  references: Array<{
    type: string;
    meetingUrl: string;
  }>;
  metadata?: {
    start?: string;
    end?: string;
    videoCallUrl?: string;
    [key: string]: unknown;
  };
}

export interface CalComSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface CalComEventType {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  length: number;
  schedulingUrl: string;
}

export async function listarBookingsCalCom(
  apiKey: string,
  params: { status?: string; limit?: number; afterStart?: string } = {}
): Promise<CalComBooking[]> {
  const url = new URL("https://api.cal.com/v2/bookings");
  if (params.status) url.searchParams.set("status", params.status);
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  if (params.afterStart) url.searchParams.set("afterStart", params.afterStart);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-08-13",
    },
  });

  if (!res.ok) {
    throw new Error(`Cal.com API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  return json.data || [];
}

export async function listarSlotsCalCom(
  apiKey: string,
  params: {
    eventTypeSlug: string;
    startTime: string;
    endTime: string;
    timeZone?: string;
  }
): Promise<CalComSlot[]> {
  const url = new URL(
    `https://api.cal.com/v2/slots?eventSlug=${params.eventTypeSlug}&startTime=${params.startTime}&endTime=${params.endTime}`
  );
  if (params.timeZone) url.searchParams.set("timeZone", params.timeZone);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": "2024-06-14",
    },
  });

  if (!res.ok) {
    throw new Error(`Cal.com API error: ${res.status}`);
  }

  const json = await res.json();
  return json.slots || [];
}

export async function listarEventTypesCalCom(apiKey: string): Promise<CalComEventType[]> {
  const res = await fetch("https://api.cal.com/v2/event-types?take=100", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "cal-api-version": "2025-01-01",
    },
  });

  if (!res.ok) {
    const texto = await res.text();
    throw new Error(`Cal.com API error: ${res.status} - ${texto}`);
  }

  const json = await res.json();
  
  let eventTypesData: unknown[] = [];
  if (Array.isArray(json.data)) {
    eventTypesData = json.data;
  } else if (json.data?.data && Array.isArray(json.data.data)) {
    eventTypesData = json.data.data;
  } else if (json.eventTypes && Array.isArray(json.eventTypes)) {
    eventTypesData = json.eventTypes;
  }
  
  const eventTypes: CalComEventType[] = eventTypesData.map((et: unknown) => {
    const e = et as Record<string, unknown>;
    return {
      id: e.id as number,
      slug: e.slug as string,
      title: e.title as string,
      description: (e.description as string) || null,
      length: (e.lengthInMinutes || e.duration || 30) as number,
      schedulingUrl: `/booking/${e.slug}`,
    };
  });
  
  return eventTypes;
}

export async function testarConexaoCalCom(apiKey: string): Promise<{
  sucesso: boolean;
  profile?: { name: string; email: string };
  erro?: string;
}> {
  try {
    const res = await fetch("https://api.cal.com/v2/users/me", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "cal-api-version": "2024-08-13",
      },
    });

    if (!res.ok) {
      return { sucesso: false, erro: `Erro ${res.status}: ${res.statusText}` };
    }

    const json = await res.json();
    return {
      sucesso: true,
      profile: {
        name: json.data?.name || "",
        email: json.data?.email || "",
      },
    };
  } catch (err) {
    return {
      sucesso: false,
      erro: err instanceof Error ? err.message : "Erro desconhecido",
    };
  }
}

export async function listarBookingsCalComByApiKey(
  apiKey: string,
  _params: { startTime?: string; endTime?: string } = {} // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise<CalComBooking[]> {
  return listarBookingsCalCom(apiKey, {
    status: "active",
    limit: 50,
  });
}
