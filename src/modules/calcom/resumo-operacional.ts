import type { CalComBooking, CalComEventType, CalComInstancia, CalComResumoOperacional } from "./types";

type CriarResumoOperacionalCalComParams = {
  instancias: CalComInstancia[];
  bookings: CalComBooking[];
  eventTypes: CalComEventType[];
};

export function criarResumoOperacionalCalCom({
  instancias,
  bookings,
  eventTypes,
}: CriarResumoOperacionalCalComParams): CalComResumoOperacional {
  const totalInstancias = instancias.length;
  const instanciasAtivas = instancias.filter((instancia) => instancia.status === "active").length;
  const totalBookings = bookings.length;
  const totalEventTypes = eventTypes.length;
  const temConexaoAtiva = instanciasAtivas > 0;

  const rotuloStatus =
    instanciasAtivas === 0
      ? "Nenhuma conta conectada"
      : instanciasAtivas === 1
          ? "1 conta funcionando"
          : `${instanciasAtivas} contas funcionando`;

  const mensagemOperacional =
    totalInstancias === 0
      ? "Cole uma chave valida do Cal.com para liberar agenda, reunioes e links de agendamento."
      : temConexaoAtiva
          ? "As contas que estao funcionando ja liberam leitura de agenda, reunioes futuras e links de agendamento."
          : "As contas salvas precisam ser verificadas novamente para voltar a sincronizar a agenda.";

  return {
    totalInstancias,
    instanciasAtivas,
    totalBookings,
    totalEventTypes,
    temConexaoAtiva,
    rotuloStatus,
    mensagemOperacional,
  };
}
