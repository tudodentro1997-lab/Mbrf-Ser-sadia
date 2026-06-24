import prisma from '../lib/prisma.js';
import { validateCPF } from '../services/cpfValidator.js';

export async function getAllUsers(req, res) {
  try {
    const { role, status } = req.query;

    const where = {};
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        role: true,
        matricula: true,
        status: true,
        financialStatus: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });

    return res.json(users);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return res.status(500).json({ error: 'Erro interno ao listar usuários.' });
  }
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, phone, role, matricula, status, financialStatus } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : user.name,
        phone: phone !== undefined ? phone : user.phone,
        role: role !== undefined ? role : user.role,
        matricula: matricula !== undefined ? matricula : user.matricula,
        status: status !== undefined ? status : user.status,
        financialStatus: financialStatus !== undefined ? financialStatus : user.financialStatus
      },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        role: true,
        matricula: true,
        status: true,
        financialStatus: true
      }
    });

    return res.json({
      message: 'Usuário atualizado com sucesso!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar usuário.' });
  }
}

export async function createSocio(req, res) {
  const { name, cpf, email, phone, matricula, financialStatus } = req.body;

  try {
    if (!name || !cpf || !email || !matricula) {
      return res.status(400).json({ error: 'Os campos nome, CPF, e-mail e matrícula são obrigatórios.' });
    }

    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cleanCPF)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Verificar se já existe e-mail ou CPF cadastrado
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { cpf: cleanCPF }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail ou CPF.' });
    }

    const user = await prisma.user.create({
      data: {
        name,
        cpf: cleanCPF,
        email,
        password: '', // Sem senha até que o próprio se registre com o mesmo CPF
        phone,
        role: 'SOCIO',
        matricula,
        status: 'ACTIVE',
        financialStatus: financialStatus || 'EM_DIA'
      }
    });

    return res.status(201).json({
      message: 'Sócio cadastrado com sucesso!',
      user
    });

  } catch (error) {
    console.error('Erro ao cadastrar sócio:', error);
    return res.status(500).json({ error: 'Erro interno ao cadastrar sócio.' });
  }
}

// Lógica de importação em lote via CSV
export async function importSociosCSV(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo CSV enviado.' });
    }

    const fileContent = req.file.buffer.toString('utf-8');
    const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({ error: 'O arquivo CSV está vazio ou contém apenas cabeçalhos.' });
    }

    // Identificar delimitador (vírgula ou ponto e vírgula)
    const headerLine = lines[0];
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const currentline = lines[i].split(delimiter).map(item => item.trim());
      if (currentline.length === headers.length) {
        const obj = {};
        for (let j = 0; j < headers.length; j++) {
          obj[headers[j]] = currentline[j];
        }
        records.push(obj);
      }
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Processar cada registro sequencialmente no banco de dados
    for (let i = 0; i < records.length; i++) {
      const rec = records[i];
      // Mapear campos flexíveis do cabeçalho
      const name = rec.name || rec.nome;
      const cpf = rec.cpf;
      const email = rec.email || rec.mail || rec.correio;
      const phone = rec.phone || rec.telefone || rec.celular || '';
      const matricula = rec.matricula || rec.registration || rec.id_socio;
      const status = (rec.status || 'active').toUpperCase();
      const finStatus = (rec.financialstatus || rec.situacao_financeira || rec.financeiro || 'EM_DIA').toUpperCase();

      if (!name || !cpf || !email || !matricula) {
        failCount++;
        errors.push(`Linha ${i + 2}: Campos essenciais ausentes (nome, cpf, email ou matricula).`);
        continue;
      }

      const cleanCPF = cpf.replace(/[^\d]/g, '');
      if (!validateCPF(cleanCPF)) {
        failCount++;
        errors.push(`Linha ${i + 2}: CPF inválido (${cpf}).`);
        continue;
      }

      try {
        // Verificar se usuário já existe pelo CPF
        const existingUser = await prisma.user.findUnique({
          where: { cpf: cleanCPF }
        });

        const mappedStatus = status.startsWith('IN') || status === 'INATIVO' ? 'INACTIVE' : 'ACTIVE';
        const mappedFinStatus = finStatus.includes('ATRASO') || finStatus.includes('DEVEDOR') ? 'EM_ATRASO' : 'EM_DIA';

        if (existingUser) {
          // Se já existe, atualiza seu status de sócio
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name,
              email,
              phone: phone || existingUser.phone,
              role: 'SOCIO',
              matricula,
              status: mappedStatus,
              financialStatus: mappedFinStatus
            }
          });
        } else {
          // Se não existe, cria um registro vazio (com senha em branco)
          await prisma.user.create({
            data: {
              name,
              cpf: cleanCPF,
              email,
              password: '', // Senha em branco (vai cadastrar depois)
              phone,
              role: 'SOCIO',
              matricula,
              status: mappedStatus,
              financialStatus: mappedFinStatus
            }
          });
        }
        successCount++;
      } catch (err) {
        console.error(`Erro ao importar linha ${i + 2}:`, err);
        failCount++;
        errors.push(`Linha ${i + 2}: Erro no banco de dados (${err.message}).`);
      }
    }

    return res.json({
      message: 'Processamento de CSV concluído!',
      summary: {
        totalProcessed: records.length,
        success: successCount,
        failed: failCount
      },
      errors
    });

  } catch (error) {
    console.error('Erro ao importar CSV:', error);
    return res.status(500).json({ error: 'Erro interno ao importar arquivo de sócios.' });
  }
}
