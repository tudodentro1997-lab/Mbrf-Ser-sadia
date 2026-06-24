import prisma from '../lib/prisma.js';
import { checkBookingConflict } from '../services/bookingConflictChecker.js';

// Função para gerar código único de reserva: MBRF-XXXXXXXXX
function generateBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'MBRF-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function createBooking(req, res) {
  const { spaceId, date, startTime, endTime, paymentMethod } = req.body;
  const userId = req.user.id;

  try {
    if (!spaceId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Todos os campos (espaço, data, hora de início e fim) são obrigatórios.' });
    }

    // Validar formato de data (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Data em formato inválido. Use YYYY-MM-DD.' });
    }

    // Validar formato de hora (HH:MM)
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      return res.status(400).json({ error: 'Horários em formato inválido. Use HH:MM.' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'O horário de início deve ser menor que o horário de término.' });
    }

    // Buscar local
    const space = await prisma.space.findUnique({
      where: { id: Number(spaceId) }
    });

    if (!space) {
      return res.status(404).json({ error: 'Espaço para eventos não encontrado.' });
    }

    if (!space.isActive) {
      return res.status(400).json({ error: 'Este espaço está inativo no momento.' });
    }

    // Buscar usuário para saber se é Sócio e se está Adimplente
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Verificar conflitos de horários
    const conflict = await checkBookingConflict({
      spaceId,
      date,
      startTime,
      endTime
    });

    if (conflict) {
      return res.status(409).json({ error: 'Este horário já está reservado.' });
    }

    // Determinar preço:
    // Sócio em dia paga preço reduzido. Sócio em atraso ou não-sócio paga preço cheio.
    let totalAmount = space.priceNaoSocio;
    let userType = 'NAO_SOCIO';

    if (user.role === 'SOCIO') {
      userType = 'SOCIO';
      if (user.financialStatus === 'EM_DIA') {
        totalAmount = space.priceSocio;
      }
    } else if (user.role === 'ADMIN') {
      userType = 'ADMIN';
      totalAmount = 0; // Administrador bloqueando ou agendando evento institucional
    }

    // Gerar código único de reserva
    const code = generateBookingCode();

    // Criar a reserva
    // Se o valor for 0 (ex: Área de Lazer para sócio, ou bloqueio admin), confirma na hora
    const initialStatus = (totalAmount === 0 || user.role === 'ADMIN') ? 'CONFIRMADA' : 'AGUARDANDO_PAGAMENTO';

    const booking = await prisma.booking.create({
      data: {
        code,
        userId,
        spaceId: Number(spaceId),
        date,
        startTime,
        endTime,
        totalAmount,
        userType,
        status: initialStatus,
        paymentMethod: paymentMethod || null
      },
      include: {
        space: true,
        user: {
          select: { name: true, cpf: true, email: true }
        }
      }
    });

    // Retorna a reserva criada e dados fictícios para pagamento se necessário
    return res.status(201).json({
      message: initialStatus === 'CONFIRMADA' ? 'Reserva confirmada com sucesso!' : 'Reserva criada. Aguardando pagamento.',
      booking,
      paymentDetails: initialStatus === 'AGUARDANDO_PAGAMENTO' ? {
        qrCodePix: `00020101021226380014br.gov.bcb.pix2522mbrfsadiapixchave1235204000053039865405${totalAmount.toFixed(2)}5802BR5915MBRF_SADIA6009CONCORDIA62070503***6304`,
        pixKey: 'pix@mbrfsadia.com.br',
        amount: totalAmount,
        expiryMinutes: 15
      } : null
    });

  } catch (error) {
    console.error('Erro ao criar reserva:', error);
    return res.status(500).json({ error: 'Erro interno ao criar reserva.' });
  }
}

export async function getMyBookings(req, res) {
  try {
    const bookings = await prisma.booking.findMany({
      where: { userId: req.user.id },
      include: {
        space: true
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ]
    });

    const formattedBookings = bookings.map(b => ({
      ...b,
      space: {
        ...b.space,
        imageUrls: JSON.parse(b.space.imageUrls || '[]')
      }
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Erro ao buscar minhas reservas:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar reservas.' });
  }
}

export async function getAllBookings(req, res) {
  const { date, spaceId, status, userType } = req.query;

  try {
    const where = {};
    if (date) where.date = date;
    if (spaceId) where.spaceId = Number(spaceId);
    if (status) where.status = status;
    if (userType) where.userType = userType;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        space: true,
        user: {
          select: { name: true, cpf: true, email: true, role: true }
        }
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ]
    });

    const formattedBookings = bookings.map(b => ({
      ...b,
      space: {
        ...b.space,
        imageUrls: JSON.parse(b.space.imageUrls || '[]')
      }
    }));

    return res.json(formattedBookings);
  } catch (error) {
    console.error('Erro ao listar todas as reservas:', error);
    return res.status(500).json({ error: 'Erro interno ao listar reservas.' });
  }
}

export async function updateBookingStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body; // PENDENTE, AGUARDANDO_PAGAMENTO, CONFIRMADA, CANCELADA, EXPIRADA

  try {
    const allowedStatuses = ['PENDENTE', 'AGUARDANDO_PAGAMENTO', 'CONFIRMADA', 'CANCELADA', 'EXPIRADA'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido fornecido.' });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: Number(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Reserva não encontrada.' });
    }

    // Regra: Não-administradores só podem cancelar suas próprias reservas que estejam aguardando pagamento ou pendentes
    if (req.user.role !== 'ADMIN') {
      if (booking.userId !== req.user.id) {
        return res.status(403).json({ error: 'Você não tem permissão para alterar esta reserva.' });
      }
      if (status !== 'CANCELADA') {
        return res.status(400).json({ error: 'Usuários só podem alterar o status para CANCELADA.' });
      }
      if (booking.status === 'CONFIRMADA') {
        return res.status(400).json({ error: 'Reservas já confirmadas não podem ser canceladas diretamente pelo portal. Entre em contato com o suporte.' });
      }
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: Number(id) },
      data: { status },
      include: {
        space: true,
        user: { select: { name: true, email: true } }
      }
    });

    return res.json({
      message: `Status da reserva alterado para ${status}!`,
      booking: {
        ...updatedBooking,
        space: {
          ...updatedBooking.space,
          imageUrls: JSON.parse(updatedBooking.space.imageUrls || '[]')
        }
      }
    });

  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar reserva.' });
  }
}

export async function checkAvailability(req, res) {
  const { spaceId, date } = req.query;

  try {
    if (!spaceId || !date) {
      return res.status(400).json({ error: 'Os parâmetros spaceId e date (YYYY-MM-DD) são obrigatórios.' });
    }

    // Buscar reservas do dia para o espaço específico que estejam ativas
    const bookings = await prisma.booking.findMany({
      where: {
        spaceId: Number(spaceId),
        date: date,
        status: {
          in: ['CONFIRMADA', 'PENDENTE', 'AGUARDANDO_PAGAMENTO']
        }
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
        userType: true
      }
    });

    return res.json(bookings);
  } catch (error) {
    console.error('Erro ao verificar disponibilidade:', error);
    return res.status(500).json({ error: 'Erro interno ao verificar disponibilidade.' });
  }
}

export async function blockDateManual(req, res) {
  const { spaceId, date, startTime, endTime, reason } = req.body;

  try {
    if (!spaceId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'Os campos espaço, data, hora início e fim são obrigatórios.' });
    }

    // Verificar conflito
    const conflict = await checkBookingConflict({
      spaceId,
      date,
      startTime,
      endTime
    });

    if (conflict) {
      return res.status(409).json({
        error: 'Este horário não pode ser bloqueado pois já possui uma reserva ativa.',
        conflictingBooking: conflict
      });
    }

    // Criar reserva de bloqueio administrativo
    const code = `BLOQ-${Date.now().toString().slice(-6)}`;
    const booking = await prisma.booking.create({
      data: {
        code,
        userId: req.user.id, // O Admin logado
        spaceId: Number(spaceId),
        date,
        startTime,
        endTime,
        totalAmount: 0.0,
        userType: 'ADMIN',
        status: 'CONFIRMADA',
        paymentMethod: 'PIX' // Fictício
      },
      include: {
        space: true
      }
    });

    return res.status(201).json({
      message: `Bloqueio de data realizado com sucesso para o espaço ${booking.space.name}. Motivo: ${reason || 'Bloqueio administrativo'}`,
      booking
    });

  } catch (error) {
    console.error('Erro ao efetuar bloqueio manual:', error);
    return res.status(500).json({ error: 'Erro interno ao efetuar bloqueio.' });
  }
}
