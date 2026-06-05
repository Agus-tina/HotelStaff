import { google } from 'googleapis'
import { createOAuthClient } from '../config/google.js'
import { query } from '../config/db.js'

async function getTokenForUser(usuarioId) {
  const rows = await query(
    'SELECT * FROM google_calendar_tokens WHERE usuario_id = ? LIMIT 1',
    [usuarioId]
  )
  return rows[0]
}

function buildEvent(turno) {
  const start = `${turno.fecha}T${turno.hora_inicio}`
  const end = `${turno.fecha}T${turno.hora_fin}`

  return {
    summary: `Turno - ${turno.puesto}`,
    location: `${turno.lugar}, ${turno.direccion}`,
    description: turno.descripcion || 'Turno asignado',
    start: { dateTime: start, timeZone: 'America/Argentina/Buenos_Aires' },
    end: { dateTime: end, timeZone: 'America/Argentina/Buenos_Aires' },
  }
}

export async function createCalendarEventIfLinked({ usuarioId, turno, asignacionId }) {
  const token = await getTokenForUser(usuarioId)
  if (!token) return { skipped: true }

  try {
    const auth = createOAuthClient()
    auth.setCredentials({
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expiry_date: token.expiry_date,
    })

    const calendar = google.calendar({ version: 'v3', auth })
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: buildEvent(turno),
    })

    await query(
      `INSERT INTO google_calendar_eventos (usuario_id, turno_id, asignacion_id, event_id, estado)
       VALUES (?, ?, ?, ?, 'creado')`,
      [usuarioId, turno.id, asignacionId, response.data.id]
    )

    return { created: true, eventId: response.data.id }
  } catch (error) {
    await query(
      `INSERT INTO google_calendar_eventos (usuario_id, turno_id, asignacion_id, estado, error)
       VALUES (?, ?, ?, 'error', ?)`,
      [usuarioId, turno.id, asignacionId, error.message]
    )
    return { error: error.message }
  }
}
