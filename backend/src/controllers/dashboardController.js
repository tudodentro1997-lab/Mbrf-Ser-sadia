import prisma from '../lib/prisma.js';

export async function getDashboardStats(req, res) {
  try {
    // 1. Total de Reservas (todas)
    const totalBookings = await prisma.booking.count();

    // 2. Total arrecadado (Reservas com status CONFIRMADA)
    const revenueAggregation = await prisma.booking.aggregate({
      where: { status: 'CONFIRMADA' },
      _sum: { totalAmount: true }
    });
    const totalRevenue = revenueAggregation._sum.totalAmount || 0;

    // 3. Reservas do mês atual
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = String(today.getMonth() + 1).padStart(2, '0'); // YYYY-MM
    const currentMonthPrefix = `${currentYear}-${currentMonth}`;

    const monthBookings = await prisma.booking.count({
      where: {
        date: {
          startsWith: currentMonthPrefix
        }
      }
    });

    // 4. Sócios ativos e Não sócios cadastrados
    const activeSocios = await prisma.user.count({
      where: {
        role: 'SOCIO',
        status: 'ACTIVE'
      }
    });

    const registeredNaoSocios = await prisma.user.count({
      where: {
        role: 'NAO_SOCIO'
      }
    });

    // 5. Locais mais reservados
    // Agrupar por spaceId
    const bookingsBySpace = await prisma.booking.groupBy({
      by: ['spaceId'],
      _count: {
        id: true
      },
      where: {
        status: 'CONFIRMADA'
      }
    });

    // Buscar nomes dos locais
    const spaceIds = bookingsBySpace.map(item => item.spaceId);
    const spaces = await prisma.space.findMany({
      where: {
        id: { in: spaceIds }
      },
      select: { id: true, name: true }
    });

    const spaceUsage = bookingsBySpace.map(item => {
      const spaceInfo = spaces.find(s => s.id === item.spaceId);
      return {
        spaceId: item.spaceId,
        spaceName: spaceInfo ? spaceInfo.name : 'Espaço Desconhecido',
        bookingCount: item._count.id
      };
    }).sort((a, b) => b.bookingCount - a.bookingCount);

    return res.json({
      totalBookings,
      totalRevenue,
      monthBookings,
      activeSocios,
      registeredNaoSocios,
      spaceUsage
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    return res.status(500).json({ error: 'Erro interno ao obter dados estatísticos.' });
  }
}
