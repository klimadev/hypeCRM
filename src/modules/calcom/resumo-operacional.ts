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
      ? "Nenhuma conexao ativa"
      : instanciasAtivas === 1
          ? "1 conexao ativa"
          : `${instanciasAtivas} conexoes ativas`;

  const mensagemOperacional =
    totalInstancias === 0
      ? "Cadastre uma API key valida para liberar agenda, bookings e tipos de evento."
      : temConexaoAtiva
          ? "As conexoes ativas ja liberam leitura de agenda, tipos de evento e reunioes futuras."
          : "As conexoes cadastradas precisam ser testadas novamente para voltar a sincronizar a agenda.";

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
