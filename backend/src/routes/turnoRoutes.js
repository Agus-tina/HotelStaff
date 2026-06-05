import { Router } from 'express'
import {
  asignarEmpleados,
  createTurno,
  deleteTurno,
  getPostulados,
  listDisponibles,
  listTurnos,
  updateTurno,
} from '../controllers/turnoController.js'
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', requireAuth, requireRole('admin'), listTurnos)
router.get('/disponibles', requireAuth, requireRole('empleado'), listDisponibles)
router.post('/', requireAuth, requireRole('admin'), createTurno)
router.put('/:id', requireAuth, requireRole('admin'), updateTurno)
router.delete('/:id', requireAuth, requireRole('admin'), deleteTurno)
router.get('/:id/postulados', requireAuth, requireRole('admin'), getPostulados)
router.post('/:id/asignar', requireAuth, requireRole('admin'), asignarEmpleados)

export default router
