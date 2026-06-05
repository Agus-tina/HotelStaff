import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no enviado' })
  }

  try {
    const token = authHeader.split(' ')[1]
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch (_error) {
    res.status(401).json({ message: 'Token invalido o vencido' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
      return res.status(403).json({ message: 'No tenes permisos para esta accion' })
    }

    next()
  }
}
