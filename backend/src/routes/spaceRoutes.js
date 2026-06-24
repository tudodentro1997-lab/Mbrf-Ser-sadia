import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { getAllSpaces, getSpaceById, createSpace, updateSpace, deleteSpace } from '../controllers/spaceController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/rbac.js';

// Garantir que a pasta uploads existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
}

// Configurar armazenamento local das fotos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });
const router = express.Router();

router.get('/', getAllSpaces);
router.get('/:id', getSpaceById);

// Apenas administradores podem cadastrar, atualizar e excluir locais
router.post('/', authenticateToken, authorizeRoles('ADMIN'), upload.array('images', 5), createSpace);
router.put('/:id', authenticateToken, authorizeRoles('ADMIN'), upload.array('images', 5), updateSpace);
router.delete('/:id', authenticateToken, authorizeRoles('ADMIN'), deleteSpace);

export default router;
