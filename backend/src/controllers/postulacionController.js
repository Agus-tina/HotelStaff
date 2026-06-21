import { query } from '../config/db.js'
import { enviarEmail, turnoHtml } from '../services/emailService.js'

function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

export async function postular(req, res) {
  const turnoId = positiveInteger(req.body.turnoId)

  if (!turnoId) {
    return res.status(400).json({ message: 'Id de turno invalido' })
  }

  const turnos = await query(
    `SELECT id FROM turnos
     WHERE id = ? AND estado IN ('abierto', 'modificado')
     LIMIT 1`,
    [turnoId]
  )

  if (!turnos.length) {
    return res.status(404).json({ message: 'Turno no disponible' })
  }

  const exists = await query(
    'SELECT id FROM postulaciones WHERE turno_id = ? AND usuario_id = ? LIMIT 1',
    [turnoId, req.user.id]
  )

  if (exists.length) {
    return res.status(409).json({ message: 'Ya te postulaste a este turno' })
  }

  await query(
    `INSERT INTO postulaciones (turno_id, usuario_id, estado)
     VALUES (?, ?, 'pendiente')`,
    [turnoId, req.user.id]
  )

  req.app.get('io')?.emit('postulaciones:changed')
  res.status(201).json({ message: 'Postulacion creada' })
}

export async function misPostulaciones(req, res) {
  const rows = await query(
    `SELECT p.id AS postulacion_id, p.estado AS estado_postulacion,
            a.id AS asignacion_id, a.estado AS estado_asignacion,
            t.*
     FROM postulaciones p
     JOIN turnos t ON t.id = p.turno_id
     LEFT JOIN asignaciones_turnos a ON a.turno_id = p.turno_id AND a.usuario_id = p.usuario_id
     WHERE p.usuario_id = ?
     ORDER BY t.fecha ASC`,
    [req.user.id]
  )

  res.json({ data: rows })
}

export async function cancelarPostulacion(req, res) {
  const postulacionId = positiveInteger(req.params.id)

  if (!postulacionId) {
    return res.status(400).json({ message: 'Id de postulacion invalido' })
  }

  const connection = await (await import('../config/db.js')).pool.getConnection()

  try {
    await connection.beginTransaction()

    const [rows] = await connection.execute(
      `SELECT p.id, p.estado AS estado_postulacion, p.turno_id,
              a.id AS asignacion_id, a.estado AS estado_asignacion,
              t.estado AS estado_turno
       FROM postulaciones p
       JOIN turnos t ON t.id = p.turno_id
       LEFT JOIN asignaciones_turnos a ON a.turno_id = p.turno_id AND a.usuario_id = p.usuario_id
       WHERE p.id = ? AND p.usuario_id = ?
       LIMIT 1`,
      [postulacionId, req.user.id]
    )

    const postulacion = rows[0]

    if (!postulacion) {
      await connection.rollback()
      return res.status(404).json({ message: 'Postulacion no encontrada' })
    }

    if (postulacion.estado_postulacion === 'cancelado') {
      await connection.rollback()
      return res.status(409).json({ message: 'La postulacion ya esta cancelada' })
    }

    if (postulacion.estado_postulacion === 'rechazado') {
      await connection.rollback()
      return res.status(409).json({ message: 'No se puede cancelar una postulacion rechazada' })
    }

    if (
      postulacion.estado_postulacion === 'seleccionado'
      && postulacion.estado_asignacion !== 'asignado'
    ) {
      await connection.rollback()
      return res.status(409).json({ message: 'No se puede cancelar una asignacion ya confirmada' })
    }

    if (postulacion.asignacion_id) {
      await connection.execute(
        `UPDATE asignaciones_turnos
         SET estado = 'cancelado'
         WHERE id = ?`,
        [postulacion.asignacion_id]
      )
    }

    await connection.execute(
      `UPDATE postulaciones
       SET estado = 'cancelado'
       WHERE id = ?`,
      [postulacion.id]
    )

    if (postulacion.estado_turno === 'cubierto') {
      await connection.execute(
        `UPDATE turnos
         SET estado = 'modificado'
         WHERE id = ?`,
        [postulacion.turno_id]
      )

      await connection.execute(
        `UPDATE postulaciones
         SET estado = 'pendiente'
         WHERE turno_id = ? AND estado = 'rechazado'`,
        [postulacion.turno_id]
      )
    }

    await connection.commit()

    req.app.get('io')?.emit('turnos:changed')
    req.app.get('io')?.emit('postulaciones:changed')
    res.json({ message: 'Postulacion cancelada' })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ message: 'No se pudo cancelar la postulacion' })
  } finally {
    connection.release()
  }
}

export async function misTurnos(req, res) {
  const rows = await query(
    `SELECT a.id AS asignacion_id, a.estado AS estado_asignacion, t.*
     FROM asignaciones_turnos a
     JOIN turnos t ON t.id = a.turno_id
     WHERE a.usuario_id = ?
     ORDER BY t.fecha ASC`,
    [req.user.id]
  )

  res.json({ data: rows })
}

export async function confirmarAsistencia(req, res) {
  const asignacionId = positiveInteger(req.params.id)

  if (!asignacionId) {
    return res.status(400).json({ message: 'Id de asignacion invalido' })
  }

  const rows = await query(
    `SELECT a.id, t.*, u.nombre, u.apellido, admin.email AS admin_email
     FROM asignaciones_turnos a
     JOIN turnos t ON t.id = a.turno_id
     JOIN usuarios u ON u.id = a.usuario_id
     JOIN usuarios admin ON admin.id = t.administrador_id
     WHERE a.id = ? AND a.usuario_id = ?`,
    [asignacionId, req.user.id]
  )

  const data = rows[0]
  if (!data) {
    return res.status(404).json({ message: 'Asignacion no encontrada' })
  }

  await query(
    `UPDATE asignaciones_turnos
     SET estado = 'confirmado_asistencia', confirmado_en = CURRENT_TIMESTAMP
     WHERE id = ? AND usuario_id = ?`,
    [asignacionId, req.user.id]
  )

  if (data.admin_email) {
    await enviarEmail({
      to: data.admin_email,
      subject: `Asistencia confirmada: ${data.nombre} ${data.apellido}`,
      tipo: 'asistencia_confirmada_admin',
      html: turnoHtml(
        data,
        `<p>${data.nombre} ${data.apellido} confirmo asistencia al turno.</p>`
      ),
    })
  }

  req.app.get('io')?.emit('turnos:changed')
  res.json({ message: 'Asistencia confirmada' })
}
