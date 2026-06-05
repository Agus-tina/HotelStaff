import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import app from './app.js'

dotenv.config()

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)
})

server.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`)
})
