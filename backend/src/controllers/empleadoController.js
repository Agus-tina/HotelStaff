import { query } from '../config/db.js'
import { hashPassword } from '../utils/auth.js'

export async function getPerfil(req, res) {
  const rows = await query(
    `SELECT id, nombre, apellido, email, usuario, telefono, rol, estado
     FROM usuarios WHERE id = ?`,
    [req.user.id]
  )

  const tipos = await query(
    `SELECT te.id, te.nombre
     FROM usuario_tipos_empleado ute
     JOIN tipos_empleado te ON te.id = ute.tipo_empleado_id
     WHERE ute.usuario_id = ?`,
    [req.user.id]
  )

  res.json({ data: { ...rows[0], tiposEmpleado: tipos } })
}

export async function updatePerfil(req, res) {
  const connection = await (await import('../config/db.js')).pool.getConnection()

  try {
    const {
      nombre,
      apellido,
      email,
      usuario,
      telefono,
      estado,
      tiposEmpleado = [],
    } = req.body

    await connection.beginTransaction()

    await connection.execute(
      `UPDATE usuarios
       SET nombre = ?, apellido = ?, email = ?, usuario = ?, telefono = ?, estado = ?
       WHERE id = ?`,
      [nombre, apellido, email, usuario, telefono || null, estado, req.user.id]
    )

    await connection.execute('DELETE FROM usuario_tipos_empleado WHERE usuario_id = ?', [
      req.user.id,
    ])

    for (const tipoId of tiposEmpleado) {
      await connection.execute(
        'INSERT INTO usuario_tipos_empleado (usuario_id, tipo_empleado_id) VALUES (?, ?)',
        [req.user.id, tipoId]
      )
    }

    await connection.commit()
    res.json({ message: 'Perfil actualizado' })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ message: 'No se pudo actualizar el perfil' })
  } finally {
    connection.release()
  }
}

export async function changePassword(req, res) {
  const { passwordActual, passwordNueva } = req.body

  if (!passwordNueva || passwordNueva.length < 6) {
    return res.status(400).json({ message: 'La nueva password debe tener 6 caracteres' })
  }

  const rows = await query('SELECT password FROM usuarios WHERE id = ?', [req.user.id])
  const bcrypt = await import('bcryptjs')
  const ok = await bcrypt.default.compare(passwordActual, rows[0].password)

  if (!ok) {
    return res.status(401).json({ message: 'La password actual no es correcta' })
  }

  await query('UPDATE usuarios SET password = ? WHERE id = ?', [
    await hashPassword(passwordNueva),
    req.user.id,
  ])

  res.json({ message: 'Password actualizada' })
}
