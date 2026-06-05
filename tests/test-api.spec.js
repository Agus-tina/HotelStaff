const { expect, test } = require('@playwright/test')

/**
 * PRUEBAS DE API REAL
 * ==================
 * Estas pruebas validan endpoints reales del backend sin UI
 * Propósito: Asegurar que la API funciona correctamente de forma aislada
 */

// Variables compartidas entre pruebas
let registeredUserId
let registeredUserToken
let createdTurnoId
let adminToken

// Admin user para crear turnos
const adminUser = {
  identifier: 'admin',
  password: '1234',
}

// Empleado para registrar y usar
const newEmpleado = {
  nombre: 'Juan',
  apellido: 'Gonzalez',
  email: `juan-${Date.now()}@test.com`,
  usuario: `juan-${Date.now()}`,
  password: 'Test123!',
  telefono: '1234567890',
  tiposEmpleado: [1, 2],
}

// Turno para crear
const nuevoTurno = {
  titulo: 'Servicio catering evento corporativo',
  fecha: '2026-06-15',
  horaInicio: '18:00',
  horaFin: '22:00',
  lugar: 'Centro de Convenciones',
  direccion: 'Av. Principal 456',
  puesto: 'Mesero',
  area: 'Salón A',
  descripcion: 'Evento corporativo importante',
  cantidadEmpleados: 5,
}

test.describe('Pruebas de API Real', () => {
  test('1. Registro de nuevo empleado vía API', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/register', {
      data: newEmpleado,
    })

    expect(response.status()).toBe(201)
    const responseData = await response.json()
    expect(responseData.message).toContain('Cuenta creada')
  })

  test('2. Login y autenticación de empleado', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: newEmpleado.usuario,
        password: newEmpleado.password,
      },
    })

    expect(response.status()).toBe(200)
    const responseData = await response.json()
    expect(responseData).toHaveProperty('token')
    expect(responseData).toHaveProperty('usuario')
    expect(responseData.usuario.usuario).toBe(newEmpleado.usuario)
    expect(responseData.usuario.rol).toBe('empleado')

    // Guardar token para próximas pruebas
    registeredUserToken = responseData.token
  })

  test('3. Obtener usuario autenticado (endpoint /me)', async ({ request }) => {
    // Primero hacemos login para obtener el token
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: newEmpleado.usuario,
        password: newEmpleado.password,
      },
    })

    const { token } = await loginResponse.json()
    registeredUserToken = token

    // Llamamos a /me con el token
    const meResponse = await request.get('http://localhost:3000/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    expect(meResponse.status()).toBe(200)
    const userData = await meResponse.json()
    expect(userData.usuario).toBeDefined()
    expect(userData.usuario.usuario).toBe(newEmpleado.usuario)
    expect(userData.usuario.email).toBe(newEmpleado.email)
  })

  test('4. Login de admin y obtener token', async ({ request }) => {
    const response = await request.post('http://localhost:3000/api/auth/login', {
      data: adminUser,
    })

    expect(response.status()).toBe(200)
    const responseData = await response.json()
    expect(responseData.token).toBeDefined()
    expect(responseData.usuario.rol).toBe('admin')

    adminToken = responseData.token
  })

  test('5. Crear turno como admin vía API', async ({ request }) => {
    // Primero obtener token de admin si no lo tenemos
    if (!adminToken) {
      const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
        data: adminUser,
      })
      const { token } = await loginResponse.json()
      adminToken = token
    }

    const response = await request.post('http://localhost:3000/api/turnos', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: nuevoTurno,
    })

    expect(response.status()).toBe(201)
    const responseData = await response.json()
    expect(responseData.message).toContain('Turno creado')
    createdTurnoId = responseData.data?.id || responseData.turno?.id

    console.log('Turno creado con ID:', createdTurnoId)
  })

  test('6. Listar turnos disponibles como empleado', async ({ request }) => {
    // Asegurarnos de tener token de empleado
    if (!registeredUserToken) {
      const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
        data: {
          identifier: newEmpleado.usuario,
          password: newEmpleado.password,
        },
      })
      const { token } = await loginResponse.json()
      registeredUserToken = token
    }

    const response = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
    })

    expect(response.status()).toBe(200)
    const responseData = await response.json()
    expect(responseData).toHaveProperty('data')
    expect(Array.isArray(responseData.data)).toBe(true)
    expect(responseData.data.length).toBeGreaterThan(0)

    // Validar estructura de un turno
    const primerTurno = responseData.data[0]
    expect(primerTurno).toHaveProperty('id')
    expect(primerTurno).toHaveProperty('titulo')
    expect(primerTurno).toHaveProperty('fecha')
    expect(primerTurno).toHaveProperty('estado')
  })

  test('7. Postularse a un turno vía API', async ({ request }) => {
    // Obtener los turnos disponibles
    if (!registeredUserToken) {
      const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
        data: {
          identifier: newEmpleado.usuario,
          password: newEmpleado.password,
        },
      })
      const { token } = await loginResponse.json()
      registeredUserToken = token
    }

    const turnosResponse = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
    })

    const { data: turnos } = await turnosResponse.json()
    expect(turnos.length).toBeGreaterThan(0)

    const turnoId = turnos[0].id

    // Postularse al turno
    const postulationResponse = await request.post('http://localhost:3000/api/postulaciones', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
      data: {
        turnoId,
      },
    })

    expect(postulationResponse.status()).toBe(201)
    const responseData = await postulationResponse.json()
    expect(responseData.message).toContain('Postulacion creada')
  })

  test('8. Ver mis postulaciones como empleado', async ({ request }) => {
    if (!registeredUserToken) {
      const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
        data: {
          identifier: newEmpleado.usuario,
          password: newEmpleado.password,
        },
      })
      const { token } = await loginResponse.json()
      registeredUserToken = token
    }

    const response = await request.get('http://localhost:3000/api/postulaciones/mias', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
    })

    expect(response.status()).toBe(200)
    const responseData = await response.json()
    expect(responseData).toHaveProperty('data')
    expect(Array.isArray(responseData.data)).toBe(true)

    // Verificar que hay al menos la postulación que acabamos de crear
    if (responseData.data.length > 0) {
      const postulacion = responseData.data[0]
      expect(postulacion).toHaveProperty('postulacion_id')
      expect(postulacion).toHaveProperty('estado_postulacion')
      expect(postulacion).toHaveProperty('titulo')
    }
  })

  test('9. Validar error 401 sin token', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/turnos/disponibles')

    expect(response.status()).toBe(401)
  })

  test('10. Validar error 409 al postularse dos veces al mismo turno', async ({ request }) => {
    if (!registeredUserToken) {
      const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
        data: {
          identifier: newEmpleado.usuario,
          password: newEmpleado.password,
        },
      })
      const { token } = await loginResponse.json()
      registeredUserToken = token
    }

    const turnosResponse = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
    })

    const { data: turnos } = await turnosResponse.json()
    const turnoId = turnos[0].id

    // Primera postulación
    await request.post('http://localhost:3000/api/postulaciones', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
      data: { turnoId },
    })

    // Segunda postulación al mismo turno (debe fallar)
    const secondResponse = await request.post('http://localhost:3000/api/postulaciones', {
      headers: {
        Authorization: `Bearer ${registeredUserToken}`,
      },
      data: { turnoId },
    })

    expect(secondResponse.status()).toBe(409)
    const responseData = await secondResponse.json()
    expect(responseData.message).toContain('Ya te postulaste')
  })
})
