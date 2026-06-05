import { google } from 'googleapis'
import dotenv from 'dotenv'

dotenv.config()

export function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export const googleCalendarScopes = [
  'https://www.googleapis.com/auth/calendar.events',
]
