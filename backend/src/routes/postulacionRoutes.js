import { Router } from 'express'
import {
  cancelarPostulacion,
  confirmarAsistencia,
  misPostulaciones,
  misTurnos,
  postular,
} from '../controllers/postulacionController.js'
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/', requireAuth, requireRole('empleado'), postular)
router.get('/mias', requireAuth, requireRole('empleado'), misPostulaciones)
router.delete('/:id', requireAuth, requireRole('empleado'), cancelarPostulacion)
router.get('/mis-turnos', requireAuth, requireRole('empleado'), misTurnos)
router.post('/asignaciones/:id/confirmar', requireAuth, requireRole('empleado'), confirmarAsistencia)

export default router
