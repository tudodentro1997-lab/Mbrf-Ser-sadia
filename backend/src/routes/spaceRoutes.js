import express from 'express';
import { getAllSpaces, getSpaceById, createSpace, updateSpace, deleteSpace } from '../controllers/spaceController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/rbac.js';

const router = express.Router();

router.get('/', getAllSpaces);
router.get('/:id', getSpaceById);

// Apenas administradores podem cadastrar, atualizar e excluir locais
router.post('/', authenticateToken, authorizeRoles('ADMIN'), createSpace);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), updateSpace);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteSpace);

export default router;
