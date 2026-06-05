import { createOAuthClient, googleCalendarScopes } from '../config/google.js'
import { query } from '../config/db.js'

export function googleAuthUrl(req, res) {
  const oauth2Client = createOAuthClient()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: googleCalendarScopes,
    prompt: 'consent',
    state: String(req.user.id),
  })

  res.json({ url })
}

export async function googleCallback(req, res) {
  try {
    const { code, state, error } = req.query

    if (error) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/empleado/perfil?google=error`
      )
    }

    if (!code || !state) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/empleado/perfil?google=missing`
      )
    }

    const usuarioId = Number(state)
    const oauth2Client = createOAuthClient()
    const { tokens } = await oauth2Client.getToken(code)

    await query(
      `INSERT INTO google_calendar_tokens
       (usuario_id, access_token, refresh_token, scope, token_type, expiry_date)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = COALESCE(VALUES(refresh_token), refresh_token),
         scope = VALUES(scope),
         token_type = VALUES(token_type),
         expiry_date = VALUES(expiry_date)`,
      [
        usuarioId,
        tokens.access_token,
        tokens.refresh_token || null,
        tokens.scope || null,
        tokens.token_type || null,
        tokens.expiry_date || null,
      ]
    )

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/empleado/perfil?google=ok`)
  } catch (error) {
    console.error('Error vinculando Google Calendar:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/empleado/perfil?google=error`)
  }
}

export async function unlinkGoogle(req, res) {
  await query('DELETE FROM google_calendar_tokens WHERE usuario_id = ?', [req.user.id])
  res.json({ message: 'Cuenta de Google desvinculada' })
}

export async function googleStatus(req, res) {
  const rows = await query(
    'SELECT id FROM google_calendar_tokens WHERE usuario_id = ? LIMIT 1',
    [req.user.id]
  )

  res.json({ linked: rows.length > 0 })
}
