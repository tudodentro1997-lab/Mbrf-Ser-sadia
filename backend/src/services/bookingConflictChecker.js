import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Verifica se existe alguma reserva ativa que conflite com o período solicitado.
 * 
 * Regra de choque de horários (interseção):
 * Uma nova reserva [novoInicio, novoFim] conflita com uma existente [existenteInicio, existenteFim] se:
 * novoInicio < existenteFim E novoFim > existenteInicio
 * 
 * @param {Object} params
 * @param {number} params.spaceId - ID do local
 * @param {string} params.date - Data no formato YYYY-MM-DD
 * @param {string} params.startTime - Horário de início HH:MM
 * @param {string} params.endTime - Horário de término HH:MM
 * @param {number} [params.excludeBookingId] - ID de reserva a ser excluída da verificação (utilizado para edição)
 * @returns {Promise<Object|null>} - Retorna o objeto da reserva conflitante se houver choque, ou null caso contrário.
 */
export async function checkBookingConflict({ spaceId, date, startTime, endTime, excludeBookingId }) {
  // Buscar todas as reservas ativas para o espaço e data específicos
  // Status considerados ativos: CONFIRMADA, PENDENTE, AGUARDANDO_PAGAMENTO
  const activeBookings = await prisma.booking.findMany({
    where: {
      spaceId: Number(spaceId),
      date: date,
      status: {
        in: ['CONFIRMADA', 'PENDENTE', 'AGUARDANDO_PAGAMENTO']
      },
      NOT: excludeBookingId ? { id: Number(excludeBookingId) } : undefined
    }
  });

  // Procurar por interseção de horários
  for (const booking of activeBookings) {
    const existingStart = booking.startTime;
    const existingEnd = booking.endTime;

    // Novo início < Fim existente E Novo fim > Início existente
    if (startTime < existingEnd && endTime > existingStart) {
      return booking; // Encontrou um conflito
    }
  }

  return null; // Nenhum conflito encontrado
}
