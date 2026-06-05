import { query } from '../config/db.js'
import { comparePassword, createToken, hashPassword } from '../utils/auth.js'
import { validateLoginData, validateRegisterData } from '../utils/validation.js'

function publicUser(usuario) {
  const { password, ...safeUser } = usuario
  return safeUser
}

export async function register(req, res) {
  const connection = await (await import('../config/db.js')).pool.getConnection()

  try {
    const { tiposEmpleado = [] } = req.body
    const rol = 'empleado'
    const validation = validateRegisterData(req.body)

    if (validation.errors.length) {
      return res.status(400).json({
        message: 'Revisa los datos del registro',
        errors: validation.errors,
      })
    }

    await connection.beginTransaction()

    const { nombre, apellido, email, usuario, password, telefono } = validation.values

    const [existing] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ? OR usuario = ? LIMIT 1',
      [email, usuario]
    )

    if (existing.length) {
      await connection.rollback()
      return res.status(409).json({ message: 'El email o usuario ya existe' })
    }

    const passwordHash = await hashPassword(password)
    const [result] = await connection.execute(
      `INSERT INTO usuarios
       (nombre, apellido, email, usuario, password, telefono, rol, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'activo')`,
      [nombre, apellido, email, usuario, passwordHash, telefono || null, rol]
    )

    for (const tipoId of rol === 'empleado' ? tiposEmpleado : []) {
      await connection.execute(
        'INSERT INTO usuario_tipos_empleado (usuario_id, tipo_empleado_id) VALUES (?, ?)',
        [result.insertId, tipoId]
      )
    }

    await connection.commit()
    res.status(201).json({ message: 'Cuenta creada correctamente' })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ message: 'No se pudo crear la cuenta' })
  } finally {
    connection.release()
  }
}

export async function login(req, res) {
  const validation = validateLoginData(req.body)

  if (validation.errors.length) {
    return res.status(400).json({
      message: 'Revisa los datos de inicio de sesion',
      errors: validation.errors,
    })
  }

  const { identifier, password } = validation.values

  const rows = await query(
    'SELECT * FROM usuarios WHERE email = ? OR usuario = ? LIMIT 1',
    [identifier, identifier]
  )

  const usuario = rows[0]
  if (!usuario || !(await comparePassword(password, usuario.password))) {
    return res.status(401).json({ message: 'Credenciales incorrectas' })
  }

  if (usuario.estado !== 'activo') {
    return res.status(403).json({ message: 'La cuenta esta inactiva' })
  }

  res.json({
    token: createToken(usuario),
    usuario: publicUser(usuario),
  })
}

export async function me(req, res) {
  const rows = await query(
    `SELECT id, nombre, apellido, email, usuario, telefono, rol, estado
     FROM usuarios WHERE id = ?`,
    [req.user.id]
  )

  res.json({ usuario: rows[0] })
}

export async function tiposEmpleado(_req, res) {
  const rows = await query('SELECT * FROM tipos_empleado ORDER BY nombre')
  res.json({ data: rows })
}
