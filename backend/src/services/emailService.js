import { query } from '../config/db.js'

const brevoApiUrl = 'https://api.brevo.com/v3/smtp/email'

function getBrevoSender() {
  return {
    email: process.env.BREVO_SENDER_EMAIL,
    name: process.env.BREVO_SENDER_NAME || 'Turnos Hotel Casino',
  }
}

async function registrarEmail({ to, subject, tipo, estado, error = null }) {
  await query(
    `INSERT INTO notificaciones_email (destinatario, asunto, tipo, estado, error)
     VALUES (?, ?, ?, ?, ?)`,
    [to, subject, tipo, estado, error]
  )
}

export async function enviarEmail({ to, subject, html, tipo }) {
  const destinatarios = Array.isArray(to) ? to : [to]
  const destinatariosLog = destinatarios.join(', ')

  if (!process.env.BREVO_API_KEY) {
    await registrarEmail({
      to: destinatariosLog,
      subject,
      tipo,
      estado: 'error',
      error: 'BREVO_API_KEY no configurada',
    })
    return
  }

  if (!process.env.BREVO_SENDER_EMAIL) {
    await registrarEmail({
      to: destinatariosLog,
      subject,
      tipo,
      estado: 'error',
      error: 'BREVO_SENDER_EMAIL no configurada',
    })
    return
  }

  try {
    const response = await fetch(brevoApiUrl, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: getBrevoSender(),
        to: destinatarios.map((email) => ({ email })),
        subject,
        htmlContent: html,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Brevo respondio ${response.status}: ${errorText}`)
    }

    await registrarEmail({ to: destinatariosLog, subject, tipo, estado: 'enviado' })
  } catch (error) {
    await registrarEmail({
      to: destinatariosLog,
      subject,
      tipo,
      estado: 'error',
      error: error.message,
    })
  }
}

export function cuentaCreadaHtml(usuario) {
  return `
    <h2>Cuenta creada correctamente</h2>
    <p>Hola ${usuario.nombre}, tu cuenta ya esta activa.</p>
    <p>Ya podes iniciar sesion y postularte a los turnos disponibles.</p>
  `
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
