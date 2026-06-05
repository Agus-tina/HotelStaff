export function formatDate(value) {
  if (!value) return ''
  return String(value).split('T')[0]
}

export function formatTime(value) {
  if (!value) return ''
  return String(value).slice(0, 5)
}

export function formatShiftDateTime(turno) {
  return `${formatDate(turno.fecha)} · ${formatTime(turno.hora_inicio)} a ${formatTime(turno.hora_fin)}`
}
