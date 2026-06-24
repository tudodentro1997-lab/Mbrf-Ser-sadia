import express from 'express';
import multer from 'multer';
import { getAllUsers, updateUser, createSocio, importSociosCSV } from '../controllers/userController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/rbac.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Todos os endpoints deste arquivo são de controle exclusivo do Administrador
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

router.get('/', getAllUsers);
router.put('/:id', updateUser);
router.post('/socio', createSocio);
router.post('/import', upload.single('file'), importSociosCSV);

export default router;
