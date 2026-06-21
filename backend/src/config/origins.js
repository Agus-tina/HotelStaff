export function getAllowedOrigins() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

export function getFrontendUrl() {
  return getAllowedOrigins()[0] || 'http://localhost:5173'
}
