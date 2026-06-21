import cors from 'cors'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import turnoRoutes from './routes/turnoRoutes.js'
import empleadoRoutes from './routes/empleadoRoutes.js'
import postulacionRoutes from './routes/postulacionRoutes.js'
import googleRoutes from './routes/googleRoutes.js'
import { getAllowedOrigins } from './config/origins.js'

const app = express()

app.use(cors({ origin: getAllowedOrigins() }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'API funcionando' })
})

app.use('/api/auth', authRoutes)
app.use('/api/turnos', turnoRoutes)
app.use('/api/empleados', empleadoRoutes)
app.use('/api/postulaciones', postulacionRoutes)
app.use('/api/google', googleRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: 'Error interno del servidor' })
})

export default app
