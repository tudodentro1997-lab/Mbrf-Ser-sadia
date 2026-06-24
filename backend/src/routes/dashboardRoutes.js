import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/rbac.js';

const router = express.Router();

router.get('/stats', authenticateToken, authorizeRoles('ADMIN'), getDashboardStats);

export default router;
