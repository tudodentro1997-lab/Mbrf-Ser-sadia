import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando semeadura do banco de dados (seed)...');

  // 1. Limpar banco de dados existente (opcional, para re-run do seed limpo)
  await prisma.booking.deleteMany({});
  await prisma.space.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Criar Usuário Administrador
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador MBRF',
      cpf: '00000000000',
      email: 'admin@mbrfsadia.com.br',
      password: adminPasswordHash,
      phone: '(49) 99999-9999',
      role: 'ADMIN',
      status: 'ACTIVE',
      financialStatus: 'EM_DIA',
    },
  });
  console.log(`Administrador padrão criado: ${admin.email}`);

  // 3. Criar Usuário Sócio de teste (Ativo e em dia)
  const socioPasswordHash = await bcrypt.hash('socio123', 10);
  const socio = await prisma.user.create({
    data: {
      name: 'João Silva (Sócio)',
      cpf: '11111111111',
      email: 'joao.socio@mbrfsadia.com.br',
      password: socioPasswordHash,
      phone: '(49) 98888-8888',
      role: 'SOCIO',
      matricula: 'MBRF-0452',
      status: 'ACTIVE',
      financialStatus: 'EM_DIA',
    },
  });
  console.log(`Sócio de teste criado: ${socio.email}`);

  // 4. Criar Usuário Sócio com atraso financeiro (deve pagar preço cheio)
  const socioAtraso = await prisma.user.create({
    data: {
      name: 'Pedro Santos (Sócio Inadimplente)',
      cpf: '22222222222',
      email: 'pedro.socio@mbrfsadia.com.br',
      password: socioPasswordHash,
      phone: '(49) 97777-7777',
      role: 'SOCIO',
      matricula: 'MBRF-0891',
      status: 'ACTIVE',
      financialStatus: 'EM_ATRASO',
    },
  });
  console.log(`Sócio inadimplente de teste criado: ${socioAtraso.email}`);

  // 5. Criar Usuário Não Sócio de teste
  const naoSocioPasswordHash = await bcrypt.hash('user123', 10);
  const naoSocio = await prisma.user.create({
    data: {
      name: 'Maria Souza (Não Sócio)',
      cpf: '33333333333',
      email: 'maria.user@gmail.com',
      password: naoSocioPasswordHash,
      phone: '(49) 96666-6666',
      role: 'NAO_SOCIO',
      status: 'ACTIVE',
      financialStatus: 'EM_DIA',
    },
  });
  console.log(`Usuário não-sócio de teste criado: ${naoSocio.email}`);

  // 6. Criar os Espaços Padrão
  const spaces = [
    {
      name: 'Galpão de Eventos',
      description: 'Amplo espaço coberto, ideal para casamentos, formaturas e festas de grande porte. Conta com cozinha industrial completa (freezers, fogão industrial, churrasqueira interna) e mesas/cadeiras para até 150 convidados.',
      capacity: 150,
      rules: 'O som deve ser desligado impreterivelmente às 02:00. O lixo deve ser ensacado e colocado na lixeira externa. Limpeza básica inclusa na taxa.',
      priceSocio: 200.0,
      priceNaoSocio: 500.0,
      imageUrls: JSON.stringify(['/images/galpao1.jpg']),
      isActive: true,
    },
    {
      name: 'Campo de Futebol',
      description: 'Campo de futebol society oficial com gramado sintético de alta qualidade, cercado por redes. Conta com refletores de LED profissionais para jogos noturnos e vestiários integrados.',
      capacity: 22,
      rules: 'Uso obrigatório de chuteira society ou tênis apropriado (proibido chuteiras de campo com travas de alumínio). Reservas por períodos de 2 horas.',
      priceSocio: 50.0,
      priceNaoSocio: 120.0,
      imageUrls: JSON.stringify(['/images/campo1.jpg']),
      isActive: true,
    },
    {
      name: 'Churrasqueira da Área de Lazer',
      description: 'Quiosque gourmet equipado com churrasqueira grande, pia com bancada de granito, fogão convencional de 4 bocas, geladeira duplex e mesas de madeira para até 30 pessoas.',
      capacity: 30,
      rules: 'A churrasqueira deve ser entregue limpa (grelhas lavadas e carvão apagado). Permitido som ambiente até às 22:00.',
      priceSocio: 30.0,
      priceNaoSocio: 80.0,
      imageUrls: JSON.stringify(['/images/churrasqueira1.jpg']),
      isActive: true,
    },
    {
      name: 'Salão de Festas',
      description: 'Salão climatizado com ar-condicionado central, banheiros modernos, mesas de buffet, sistema de som ambiente embutido e louças básicas inclusas. Ideal para aniversários e reuniões familiares.',
      capacity: 80,
      rules: 'É expressamente proibido fixar decorações nas paredes com fita adesiva comum ou pregos (utilizar o suporte de painel do salão). Som permitido até às 00:00.',
      priceSocio: 120.0,
      priceNaoSocio: 300.0,
      imageUrls: JSON.stringify(['/images/salao1.jpg']),
      isActive: true,
    },
    {
      name: 'Área de Lazer Infantil e Quiosques',
      description: 'Parquinho infantil ao ar livre cercado por área verde, bancos para descanso e quiosques menores sem churrasqueira para piqueniques e recreação familiar.',
      capacity: 50,
      rules: 'Crianças devem estar sob supervisão constante de um adulto. Proibido lixo na grama.',
      priceSocio: 0.0,
      priceNaoSocio: 50.0,
      imageUrls: JSON.stringify(['/images/lazer1.jpg']),
      isActive: true,
    },
  ];

  for (const space of spaces) {
    const createdSpace = await prisma.space.create({
      data: space,
    });
    console.log(`Espaço criado: ${createdSpace.name}`);
  }

  console.log('Semeadura finalizada com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
