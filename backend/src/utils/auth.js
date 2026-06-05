import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function createToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  )
}
