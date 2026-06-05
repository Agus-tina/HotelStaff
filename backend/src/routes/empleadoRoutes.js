import { Router } from 'express'
import {
  changePassword,
  getPerfil,
  updatePerfil,
} from '../controllers/empleadoController.js'
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/perfil', requireAuth, requireRole('empleado'), getPerfil)
router.put('/perfil', requireAuth, requireRole('empleado'), updatePerfil)
router.put('/password', requireAuth, requireRole('empleado'), changePassword)

export default router
