import prisma from '../lib/prisma.js';

export async function getAllSpaces(req, res) {
  try {
    const { includeInactive } = req.query;

    const where = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }

    const spaces = await prisma.space.findMany({ where });
    
    // Fazer parse das URLs de imagem de string JSON para array
    const formattedSpaces = spaces.map(space => ({
      ...space,
      imageUrls: JSON.parse(space.imageUrls || '[]')
    }));

    return res.json(formattedSpaces);
  } catch (error) {
    console.error('Erro ao listar locais:', error);
    return res.status(500).json({ error: 'Erro interno ao listar locais.' });
  }
}

export async function getSpaceById(req, res) {
  const { id } = req.params;

  try {
    const space = await prisma.space.findUnique({
      where: { id: Number(id) }
    });

    if (!space) {
      return res.status(404).json({ error: 'Local não encontrado.' });
    }

    return res.json({
      ...space,
      imageUrls: JSON.parse(space.imageUrls || '[]')
    });
  } catch (error) {
    console.error('Erro ao buscar local:', error);
    return res.status(500).json({ error: 'Erro interno ao buscar local.' });
  }
}

export async function createSpace(req, res) {
  const { name, description, capacity, rules, priceSocio, priceNaoSocio, imageUrls } = req.body;

  try {
    if (!name || !description || capacity === undefined || priceSocio === undefined || priceNaoSocio === undefined) {
      return res.status(400).json({ error: 'Os campos nome, descrição, capacidade, preço sócio e preço não sócio são obrigatórios.' });
    }

    const space = await prisma.space.create({
      data: {
        name,
        description,
        capacity: Number(capacity),
        rules,
        priceSocio: Number(priceSocio),
        priceNaoSocio: Number(priceNaoSocio),
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : '[]',
        isActive: true
      }
    });

    return res.status(201).json({
      message: 'Local criado com sucesso!',
      space: {
        ...space,
        imageUrls: JSON.parse(space.imageUrls)
      }
    });
  } catch (error) {
    console.error('Erro ao criar local:', error);
    return res.status(500).json({ error: 'Erro interno ao criar local.' });
  }
}

export async function updateSpace(req, res) {
  const { id } = req.params;
  const { name, description, capacity, rules, priceSocio, priceNaoSocio, imageUrls, isActive } = req.body;

  try {
    const space = await prisma.space.findUnique({
      where: { id: Number(id) }
    });

    if (!space) {
      return res.status(404).json({ error: 'Local não encontrado.' });
    }

    const updatedSpace = await prisma.space.update({
      where: { id: Number(id) },
      data: {
        name: name !== undefined ? name : space.name,
        description: description !== undefined ? description : space.description,
        capacity: capacity !== undefined ? Number(capacity) : space.capacity,
        rules: rules !== undefined ? rules : space.rules,
        priceSocio: priceSocio !== undefined ? Number(priceSocio) : space.priceSocio,
        priceNaoSocio: priceNaoSocio !== undefined ? Number(priceNaoSocio) : space.priceNaoSocio,
        imageUrls: imageUrls !== undefined ? JSON.stringify(imageUrls) : space.imageUrls,
        isActive: isActive !== undefined ? Boolean(isActive) : space.isActive
      }
    });

    return res.json({
      message: 'Local atualizado com sucesso!',
      space: {
        ...updatedSpace,
        imageUrls: JSON.parse(updatedSpace.imageUrls)
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar local:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar local.' });
  }
}

export async function deleteSpace(req, res) {
  const { id } = req.params;

  try {
    const space = await prisma.space.findUnique({
      where: { id: Number(id) }
    });

    if (!space) {
      return res.status(404).json({ error: 'Local não encontrado.' });
    }

    // Ao invés de deletar e causar inconsistência nas reservas, mudamos para inativo (Soft Delete)
    await prisma.space.update({
      where: { id: Number(id) },
      data: { isActive: false }
    });

    return res.json({ message: 'Local desativado com sucesso!' });
  } catch (error) {
    console.error('Erro ao excluir local:', error);
    return res.status(500).json({ error: 'Erro interno ao excluir local.' });
  }
}
