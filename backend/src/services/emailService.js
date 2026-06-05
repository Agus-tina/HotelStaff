import { Resend } from 'resend'
import { query } from '../config/db.js'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

async function registrarEmail({ to, subject, tipo, estado, error = null }) {
  await query(
    `INSERT INTO notificaciones_email (destinatario, asunto, tipo, estado, error)
     VALUES (?, ?, ?, ?, ?)`,
    [to, subject, tipo, estado, error]
  )
}

export async function enviarEmail({ to, subject, html, tipo }) {
  if (!resend) {
    await registrarEmail({
      to,
      subject,
      tipo,
      estado: 'error',
      error: 'RESEND_API_KEY no configurada',
    })
    return
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM || 'Turnos <onboarding@resend.dev>',
      to,
      subject,
      html,
    })

    await registrarEmail({ to, subject, tipo, estado: 'enviado' })
  } catch (error) {
    await registrarEmail({
      to,
      subject,
      tipo,
      estado: 'error',
      error: error.message,
    })
  }
}

export function turnoHtml(turno, extra = '') {
  return `
    <h2>${turno.titulo}</h2>
    <p><strong>Fecha:</strong> ${turno.fecha}</p>
    <p><strong>Horario:</strong> ${turno.hora_inicio} - ${turno.hora_fin}</p>
    <p><strong>Lugar:</strong> ${turno.lugar}</p>
    <p><strong>Direccion:</strong> ${turno.direccion}</p>
    <p><strong>Puesto:</strong> ${turno.puesto}</p>
    ${extra}
  `
}
