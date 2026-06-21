import dotenv from 'dotenv'
import http from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { getAllowedOrigins } from './config/origins.js'

dotenv.config()

const PORT = process.env.PORT || 3000
const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: getAllowedOrigins(),
  },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`)
})

server.listen(PORT, () => {
  console.log(`Servidor backend en http://localhost:${PORT}`)
})
