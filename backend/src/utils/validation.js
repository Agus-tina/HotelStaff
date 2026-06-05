const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const usernameRegex = /^[a-zA-Z0-9._-]+$/

export function validateRegisterData(data) {
  const errors = []
  const nombre = String(data.nombre || '').trim()
  const apellido = String(data.apellido || '').trim()
  const email = String(data.email || '').trim().toLowerCase()
  const usuario = String(data.usuario || '').trim()
  const password = String(data.password || '')
  const telefono = String(data.telefono || '').trim()

  if (!nombre) errors.push('El nombre es obligatorio')
  if (!apellido) errors.push('El apellido es obligatorio')

  if (!email) {
    errors.push('El email es obligatorio')
  } else if (!emailRegex.test(email)) {
    errors.push('El email no tiene un formato valido')
  }

  if (!usuario) {
    errors.push('El usuario es obligatorio')
  } else if (usuario.length < 4 || usuario.length > 30) {
    errors.push('El usuario debe tener entre 4 y 30 caracteres')
  } else if (!usernameRegex.test(usuario)) {
    errors.push('El usuario solo puede usar letras, numeros, punto, guion y guion bajo')
  }

  if (!password) {
    errors.push('La contraseña es obligatoria')
  }

  if (telefono && telefono.length > 30) {
    errors.push('El telefono no puede superar los 30 caracteres')
  }

  return {
    errors,
    values: { nombre, apellido, email, usuario, password, telefono },
  }
}

export function validateLoginData(data) {
  const identifier = String(data.identifier || '').trim()
  const password = String(data.password || '')
  const errors = []

  if (!identifier) errors.push('Email o usuario es obligatorio')
  if (!password) errors.push('La contraseña es obligatoria')

  return { errors, values: { identifier, password } }
}
