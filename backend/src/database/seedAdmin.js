import dotenv from 'dotenv'
import { query } from '../config/db.js'
import { hashPassword } from '../utils/auth.js'

dotenv.config()

const email = process.env.ADMIN_EMAIL || 'admin@example.com'
const password = process.env.ADMIN_PASSWORD || 'Admin123'

async function seed() {
  const exists = await query('SELECT id FROM usuarios WHERE email = ? LIMIT 1', [email])

  if (exists.length) {
    console.log('El administrador inicial ya existe')
    process.exit(0)
  }

  await query(
    `INSERT INTO usuarios
     (nombre, apellido, email, usuario, password, telefono, rol, estado)
     VALUES ('Admin', 'Sistema', ?, 'admin', ?, NULL, 'admin', 'activo')`,
    [email, await hashPassword(password)]
  )

  console.log(`Administrador creado: ${email} / ${password}`)
  process.exit(0)
}

seed().catch((error) => {
  console.error(error)
  process.exit(1)
})
