import { query } from '../config/db.js'
import { createCalendarEventIfLinked } from '../services/calendarService.js'
import { enviarEmail, turnoHtml } from '../services/emailService.js'

const estadosTurno = ['abierto', 'cubierto', 'modificado', 'cancelado', 'finalizado']

function positiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function validateTurnoData(data) {
  const titulo = String(data.titulo || '').trim()
  const fecha = String(data.fecha || '').trim()
  const horaInicio = String(data.horaInicio || '').trim()
  const horaFin = String(data.horaFin || '').trim()
  const lugar = String(data.lugar || '').trim()
  const direccion = String(data.direccion || '').trim()
  const area = String(data.area || '').trim()
  const puesto = String(data.puesto || '').trim()
  const descripcion = String(data.descripcion || '').trim()
  const cantidadEmpleados = positiveInteger(data.cantidadEmpleados)
  const errors = []

  if (!titulo || !fecha || !horaInicio || !horaFin || !lugar || !direccion || !puesto) {
    errors.push('Faltan datos obligatorios del turno')
  }

  if (!cantidadEmpleados) {
    errors.push('La cantidad de empleados debe ser un numero mayor a cero')
  }

  return {
    errors,
    values: {
      titulo,
      fecha,
      horaInicio,
      horaFin,
      lugar,
      direccion,
      area: area || null,
      puesto,
      descripcion: descripcion || null,
      cantidadEmpleados,
    },
  }
}

export async function listTurnos(req, res) {
  const rows = await query(
    `SELECT t.*,
      COUNT(a.id) AS empleados_asignados
     FROM turnos t
     LEFT JOIN asignaciones_turnos a ON a.turno_id = t.id
     WHERE t.administrador_id = ?
     GROUP BY t.id
     ORDER BY t.fecha ASC, t.hora_inicio ASC`,
    [req.user.id]
  )

  res.json({ data: rows })
}

export async function listDisponibles(req, res) {
  const rows = await query(
    `SELECT t.*,
      EXISTS(
        SELECT 1 FROM postulaciones p
        WHERE p.turno_id = t.id AND p.usuario_id = ?
      ) AS postulado
     FROM turnos t
     WHERE t.estado IN ('abierto', 'modificado')
     ORDER BY t.fecha ASC, t.hora_inicio ASC`,
    [req.user.id]
  )

  res.json({ data: rows })
}

export async function createTurno(req, res) {
  const validation = validateTurnoData(req.body)

  if (validation.errors.length) {
    return res.status(400).json({
      message: 'Revisa los datos del turno',
      errors: validation.errors,
    })
  }

  const {
    titulo,
    fecha,
    horaInicio,
    horaFin,
    lugar,
    direccion,
    area,
    puesto,
    descripcion,
    cantidadEmpleados,
  } = validation.values

  const result = await query(
    `INSERT INTO turnos
     (administrador_id, titulo, fecha, hora_inicio, hora_fin, lugar, direccion, area, puesto, descripcion, cantidad_empleados, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'abierto')`,
    [
      req.user.id,
      titulo,
      fecha,
      horaInicio,
      horaFin,
      lugar,
      direccion,
      area,
      puesto,
      descripcion,
      cantidadEmpleados,
    ]
  )

  req.app.get('io')?.emit('turnos:changed')
  res.status(201).json({ message: 'Turno creado', id: result.insertId })
}

export async function updateTurno(req, res) {
  const turnoId = positiveInteger(req.params.id)
  const validation = validateTurnoData(req.body)
  const estado = req.body.estado || 'modificado'

  if (!turnoId) {
    return res.status(400).json({ message: 'Id de turno invalido' })
  }

  if (!estadosTurno.includes(estado)) {
    validation.errors.push('Estado de turno invalido')
  }

  if (validation.errors.length) {
    return res.status(400).json({
      message: 'Revisa los datos del turno',
      errors: validation.errors,
    })
  }

  const {
    titulo,
    fecha,
    horaInicio,
    horaFin,
    lugar,
    direccion,
    area,
    puesto,
    descripcion,
    cantidadEmpleados,
  } = validation.values

  await query(
    `UPDATE turnos
     SET titulo = ?, fecha = ?, hora_inicio = ?, hora_fin = ?, lugar = ?,
         direccion = ?, area = ?, puesto = ?, descripcion = ?, cantidad_empleados = ?,
         estado = ?
     WHERE id = ? AND administrador_id = ?`,
    [
      titulo,
      fecha,
      horaInicio,
      horaFin,
      lugar,
      direccion,
      area,
      puesto,
      descripcion,
      cantidadEmpleados,
      estado,
      turnoId,
      req.user.id,
    ]
  )

  const asignados = await query(
    `SELECT u.email, u.nombre, t.*
     FROM asignaciones_turnos a
     JOIN usuarios u ON u.id = a.usuario_id
     JOIN turnos t ON t.id = a.turno_id
     WHERE a.turno_id = ? AND t.administrador_id = ?`,
    [turnoId, req.user.id]
  )

  await Promise.all(
    asignados.map((row) =>
      enviarEmail({
        to: row.email,
        subject: `Turno modificado: ${row.titulo}`,
        tipo: 'turno_modificado',
        html: turnoHtml(row, `<p>Hola ${row.nombre}, el turno fue modificado.</p>`),
      })
    )
  )

  req.app.get('io')?.emit('turnos:changed')
  res.json({ message: 'Turno actualizado' })
}

export async function deleteTurno(req, res) {
  const turnoId = positiveInteger(req.params.id)

  if (!turnoId) {
    return res.status(400).json({ message: 'Id de turno invalido' })
  }

  await query(
    "UPDATE turnos SET estado = 'cancelado' WHERE id = ? AND administrador_id = ?",
    [turnoId, req.user.id]
  )
  req.app.get('io')?.emit('turnos:changed')
  res.json({ message: 'Turno cancelado' })
}

export async function getPostulados(req, res) {
  const turnoId = positiveInteger(req.params.id)

  if (!turnoId) {
    return res.status(400).json({ message: 'Id de turno invalido' })
  }

  const rows = await query(
    `SELECT p.id AS postulacion_id, p.estado AS estado_postulacion,
            u.id, u.nombre, u.apellido, u.email, u.telefono, u.estado
     FROM postulaciones p
     JOIN usuarios u ON u.id = p.usuario_id
     WHERE p.turno_id = ?
       AND EXISTS (
         SELECT 1 FROM turnos t
         WHERE t.id = p.turno_id AND t.administrador_id = ?
       )
     ORDER BY p.creado_en ASC`,
    [turnoId, req.user.id]
  )

  res.json({ data: rows })
}

export async function asignarEmpleados(req, res) {
  const { postulacionesIds = [] } = req.body
  const turnoId = positiveInteger(req.params.id)
  const postulacionesValidas = Array.isArray(postulacionesIds)
    ? postulacionesIds.map(positiveInteger)
    : []

  if (!turnoId) {
    return res.status(400).json({ message: 'Id de turno invalido' })
  }

  if (!Array.isArray(postulacionesIds) || postulacionesValidas.some((id) => !id)) {
    return res.status(400).json({ message: 'Las postulaciones seleccionadas son invalidas' })
  }

  if (new Set(postulacionesValidas).size !== postulacionesValidas.length) {
    return res.status(400).json({ message: 'Hay postulaciones seleccionadas repetidas' })
  }

  const connection = await (await import('../config/db.js')).pool.getConnection()

  try {
    await connection.beginTransaction()

    const [turnoRows] = await connection.execute(
      'SELECT * FROM turnos WHERE id = ? AND administrador_id = ?',
      [turnoId, req.user.id]
    )
    const turno = turnoRows[0]

    if (!turno) {
      await connection.rollback()
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const [asignadosRows] = await connection.execute(
      'SELECT COUNT(*) AS total FROM asignaciones_turnos WHERE turno_id = ?',
      [turno.id]
    )
    const cuposRestantes = turno.cantidad_empleados - asignadosRows[0].total

    if (postulacionesValidas.length > cuposRestantes) {
      await connection.rollback()
      return res.status(409).json({ message: 'Supera la cantidad de empleados necesaria' })
    }

    const asignaciones = []

    for (const postulacionId of postulacionesValidas) {
      const [postulacionRows] = await connection.execute(
        `SELECT p.*, u.email, u.nombre
         FROM postulaciones p
         JOIN usuarios u ON u.id = p.usuario_id
         WHERE p.id = ? AND p.turno_id = ?`,
        [postulacionId, turno.id]
      )
      const postulacion = postulacionRows[0]
      if (!postulacion) continue

      const [result] = await connection.execute(
        `INSERT INTO asignaciones_turnos (turno_id, usuario_id, estado)
         VALUES (?, ?, 'asignado')`,
        [turno.id, postulacion.usuario_id]
      )

      await connection.execute(
        `UPDATE postulaciones SET estado = 'seleccionado' WHERE id = ?`,
        [postulacion.id]
      )

      asignaciones.push({ ...postulacion, asignacionId: result.insertId })
    }

    const [totalRows] = await connection.execute(
      'SELECT COUNT(*) AS total FROM asignaciones_turnos WHERE turno_id = ?',
      [turno.id]
    )

    if (totalRows[0].total >= turno.cantidad_empleados) {
      await connection.execute(
        `UPDATE turnos SET estado = 'cubierto' WHERE id = ?`,
        [turno.id]
      )
      await connection.execute(
        `UPDATE postulaciones
         SET estado = 'rechazado'
         WHERE turno_id = ? AND estado = 'pendiente'`,
        [turno.id]
      )
    }

    await connection.commit()

    for (const asignacion of asignaciones) {
      await enviarEmail({
        to: asignacion.email,
        subject: `Fuiste seleccionado para el turno: ${turno.titulo}`,
        tipo: 'turno_asignado',
        html: turnoHtml(turno, `<p>Hola ${asignacion.nombre}, fuiste seleccionado.</p>`),
      })

      await createCalendarEventIfLinked({
        usuarioId: asignacion.usuario_id,
        turno,
        asignacionId: asignacion.asignacionId,
      })
    }

    req.app.get('io')?.emit('turnos:changed')
    res.json({ message: 'Empleados asignados', data: asignaciones })
  } catch (error) {
    await connection.rollback()
    console.error(error)
    res.status(500).json({ message: 'No se pudo asignar empleados' })
  } finally {
    connection.release()
  }
}
