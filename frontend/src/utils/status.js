export const POSTULACION_STATUS = {
  pendiente: { className: 'warning', label: 'Pendiente' },
  seleccionado: { className: 'success', label: 'Seleccionado' },
  rechazado: { className: 'danger', label: 'Rechazado' },
  cancelado: { className: 'neutral', label: 'Cancelado' },
}

export const ASIGNACION_STATUS = {
  asignado: { className: 'warning', label: 'Asignado' },
  confirmado_asistencia: { className: 'success', label: 'Confirmado' },
  cancelado: { className: 'danger', label: 'Cancelado' },
  ausente: { className: 'danger', label: 'Ausente' },
}

export const TURNO_STATUS = {
  abierto: { className: 'success', label: 'Abierto' },
  cubierto: { className: 'neutral', label: 'Cubierto' },
  modificado: { className: 'warning', label: 'Modificado' },
  cancelado: { className: 'danger', label: 'Cancelado' },
  finalizado: { className: 'neutral', label: 'Finalizado' },
}

export function statusBadgeClass(status, dictionary) {
  const modifier = dictionary[status]?.className || 'neutral'
  return `badge ${modifier}`
}

export function statusLabel(status, dictionary) {
  return dictionary[status]?.label || status
}
