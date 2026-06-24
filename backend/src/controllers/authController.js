import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { validateCPF } from '../services/cpfValidator.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mbrf-sadia-super-secret-key-change-this-in-production';

export async function register(req, res) {
  const { name, cpf, email, password, phone } = req.body;

  try {
    if (!name || !cpf || !email || !password) {
      return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // Validar CPF
    const cleanCPF = cpf.replace(/[^\d]/g, '');
    if (!validateCPF(cleanCPF)) {
      return res.status(400).json({ error: 'CPF inválido.' });
    }

    // Verificar se o e-mail já existe
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({ error: 'Este e-mail já está em uso.' });
    }

    // Verificar se já existe um cadastro para o CPF
    const existingCPFUser = await prisma.user.findUnique({ where: { cpf: cleanCPF } });

    const passwordHash = await bcrypt.hash(password, 10);

    let user;

    if (existingCPFUser) {
      // Caso 1: O CPF já existe no sistema porque foi importado pelo administrador
      // Se ele já tiver senha definida, significa que já está cadastrado
      if (existingCPFUser.password && existingCPFUser.password !== '') {
        return res.status(400).json({ error: 'Um usuário com este CPF já está cadastrado.' });
      }

      // Se foi importado, nós atualizamos o registro com a senha, telefone e email do usuário
      user = await prisma.user.update({
        where: { id: existingCPFUser.id },
        data: {
          name,
          email,
          password: passwordHash,
          phone: phone || existingCPFUser.phone,
          status: 'ACTIVE' // Ativar o usuário
        }
      });
    } else {
      // Caso 2: Novo usuário (não-sócio)
      user = await prisma.user.create({
        data: {
          name,
          cpf: cleanCPF,
          email,
          password: passwordHash,
          phone,
          role: 'NAO_SOCIO',
          status: 'ACTIVE',
          financialStatus: 'EM_DIA'
        }
      });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Retornar usuário sem a senha
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso!',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no registro:', error);
    return res.status(500).json({ error: 'Erro interno ao registrar usuário.' });
  }
}

export async function login(req, res) {
  const { identifier, password } = req.body; // identifier pode ser email ou CPF

  try {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'E-mail/CPF e senha são obrigatórios.' });
    }

    const cleanIdentifier = identifier.replace(/[^\d]/g, '');

    // Buscar por e-mail ou CPF
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { cpf: cleanIdentifier !== '' ? cleanIdentifier : undefined }
        ]
      }
    });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Sua conta está inativa. Entre em contato com a administração.' });
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Credenciais inválidas.' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
}

export async function getMe(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return res.status(500).json({ error: 'Erro interno ao obter perfil.' });
  }
}
