import { Router } from 'express'
import {
  googleAuthUrl,
  googleCallback,
  googleStatus,
  unlinkGoogle,
} from '../controllers/googleController.js'
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/auth-url', requireAuth, requireRole('empleado'), googleAuthUrl)
router.get('/status', requireAuth, requireRole('empleado'), googleStatus)
router.get('/callback', googleCallback)
router.delete('/unlink', requireAuth, requireRole('empleado'), unlinkGoogle)

export default router
