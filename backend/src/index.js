import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import spaceRoutes from './routes/spaceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import prisma from './lib/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuração do CORS
app.use(cors({
  origin: '*', // Em produção, especificar as origens permitidas
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Servir arquivos de imagens estáticos
app.use('/uploads', express.static('uploads'));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota básica de saúde do sistema
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Tratamento de rota não encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Inicializar rotina de expiração automática de reservas pendentes
// Regra: se o pagamento não for feito em até 15 minutos, a reserva expira
const EXPIRATION_TIME_MINUTES = 15;

function startBookingExpirationJob() {
  console.log('Rotina de expiração automática de reservas iniciada (verificação a cada 1 minuto)...');
  
  setInterval(async () => {
    try {
      const expirationThreshold = new Date();
      expirationThreshold.setMinutes(expirationThreshold.getMinutes() - EXPIRATION_TIME_MINUTES);

      // Buscar e atualizar reservas AGUARDANDO_PAGAMENTO que passaram do tempo limite
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'AGUARDANDO_PAGAMENTO',
          createdAt: {
            lt: expirationThreshold
          }
        }
      });

      if (expiredBookings.length > 0) {
        console.log(`Expirando automaticamente ${expiredBookings.length} reserva(s) pendente(s)...`);
        
        await prisma.booking.updateMany({
          where: {
            id: {
              in: expiredBookings.map(b => b.id)
            }
          },
          data: {
            status: 'EXPIRADA'
          }
        });
      }
    } catch (error) {
      console.error('Erro na rotina de expiração de reservas:', error);
    }
  }, 60 * 1000); // Executa a cada 60 segundos
}

app.listen(PORT, () => {
  console.log(`Servidor rodando com sucesso na porta ${PORT}`);
  startBookingExpirationJob();
});
