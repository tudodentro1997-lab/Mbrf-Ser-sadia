import express from 'express';
import {
  createBooking,
  getMyBookings,
  getAllBookings,
  updateBookingStatus,
  checkAvailability,
  blockDateManual
} from '../controllers/bookingController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { authorizeRoles } from '../middlewares/rbac.js';

const router = express.Router();

// Verificar disponibilidade é público
router.get('/availability', checkAvailability);

// Reservas próprias exigem apenas estar logado
router.post('/', authenticateToken, createBooking);
router.get('/my', authenticateToken, getMyBookings);
router.put('/:id/status', authenticateToken, updateBookingStatus);

// Bloqueios e gerenciamento geral são restritos ao Admin
router.get('/all', authenticateToken, authorizeRoles('ADMIN'), getAllBookings);
router.post('/block', authenticateToken, authorizeRoles('ADMIN'), blockDateManual);

export default router;
