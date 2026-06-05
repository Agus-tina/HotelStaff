import { Router } from 'express'
import { login, me, register, tiposEmpleado } from '../controllers/authController.js'
import { requireAuth } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.get('/tipos-empleado', tiposEmpleado)

export default router
