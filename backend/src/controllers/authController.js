import { query } from '../config/db.js'
import { comparePassword, createToken, hashPassword } from '../utils/auth.js'
import { validateLoginData, validateRegisterData } from '../utils/validation.js'
import { google } from 'googleapis'
import crypto from 'crypto'

const googleClient = new google.auth.OAuth2()

function publicUser(usuario) {
  const { password, google_id, ...safeUser } = usuario
  return safeUser
}

async function verifyGoogleCredential(credential) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error('GOOGLE_CLIENT_ID no esta configurado')
    error.status = 500
    throw error
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()

  if (!payload?.sub || !payload?.email || !payload?.email_verified) {
    const error = new Error('Google no pudo verificar el email de la cuenta')
    error.status = 401
    throw error
  }

  return payload
}

function normalizeUsername(value) {
  return String(value || 'google')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(0, 24) || 'google'
}

async function createUniqueUsername(connection, email) {
  const base = normalizeUsername(email.split('@')[0])

  for (let i = 0; i < 50; i += 1) {
    const candidate = i === 0 ? base : `${base}${i}`
    const [rows] = await connection.execute(
      'SELECT id FROM usuarios WHERE usuario = ? LIMIT 1',
      [candidate]
    )

    if (!rows.length) return candidate
  }

  return `google${Date.now()}`
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

export async function googleLogin(req, res) {
  const connection = await (await import('../config/db.js')).pool.getConnection()

  try {
    const credential = String(req.body.credential || '')

    if (!credential) {
      return res.status(400).json({ message: 'Token de Google no enviado' })
    }

    const payload = await verifyGoogleCredential(credential)
    const email = payload.email.toLowerCase()

    await connection.beginTransaction()

    const [googleRows] = await connection.execute(
      'SELECT * FROM usuarios WHERE google_id = ? LIMIT 1',
      [payload.sub]
    )

    let usuario = googleRows[0]

    if (!usuario) {
      const [emailRows] = await connection.execute(
        'SELECT * FROM usuarios WHERE email = ? LIMIT 1',
        [email]
      )

      usuario = emailRows[0]

      if (usuario) {
        if (usuario.google_id && usuario.google_id !== payload.sub) {
          await connection.rollback()
          return res.status(409).json({ message: 'Ese email ya esta vinculado a otra cuenta de Google' })
        }

        await connection.execute(
          'UPDATE usuarios SET google_id = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
          [payload.sub, payload.picture || null, usuario.id]
        )
      } else {
        const nombre = payload.given_name || payload.name?.split(' ')[0] || 'Usuario'
        const apellido = payload.family_name || '.'
        const username = await createUniqueUsername(connection, email)
        const passwordHash = await hashPassword(crypto.randomBytes(32).toString('hex'))

        const [result] = await connection.execute(
          `INSERT INTO usuarios
           (nombre, apellido, email, usuario, password, google_id, avatar_url, telefono, rol, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'empleado', 'activo')`,
          [nombre, apellido, email, username, passwordHash, payload.sub, payload.picture || null]
        )

        const [createdRows] = await connection.execute(
          'SELECT * FROM usuarios WHERE id = ? LIMIT 1',
          [result.insertId]
        )
        usuario = createdRows[0]
      }
    }

    if (usuario.estado !== 'activo') {
      await connection.rollback()
      return res.status(403).json({ message: 'La cuenta esta inactiva' })
    }

    if (usuario.google_id !== payload.sub) {
      const [updatedRows] = await connection.execute(
        'SELECT * FROM usuarios WHERE id = ? LIMIT 1',
        [usuario.id]
      )
      usuario = updatedRows[0]
    }

    await connection.commit()

    res.json({
      token: createToken(usuario),
      usuario: publicUser(usuario),
    })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(error.status || 401).json({
      message: error.status === 500 ? error.message : 'No se pudo validar la cuenta de Google',
    })
  } finally {
    connection.release()
  }
}

export async function me(req, res) {
  const rows = await query(
    `SELECT id, nombre, apellido, email, usuario, telefono, rol, estado, avatar_url
     FROM usuarios WHERE id = ?`,
    [req.user.id]
  )

  res.json({ usuario: rows[0] })
}

export async function tiposEmpleado(_req, res) {
  const rows = await query('SELECT * FROM tipos_empleado ORDER BY nombre')
  res.json({ data: rows })
}
