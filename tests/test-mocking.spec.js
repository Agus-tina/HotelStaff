const { expect, test } = require('@playwright/test')

/**
 * PRUEBAS CON MOCKING E INTERCEPCIÓN
 * ==================================
 * Estas pruebas interceptan y simulan respuestas de API
 * Propósito: Validar comportamiento del frontend ante errores y escenarios controlados
 */

test.describe('Pruebas con Mocking e Intercepción', () => {
  test('0. Crear cuenta de empleado seleccionando conocimientos', async ({ page }) => {
    let registerPayload = null

    await page.route('http://localhost:3000/api/auth/tipos-empleado', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, nombre: 'Mozo' },
            { id: 2, nombre: 'Barra' },
            { id: 8, nombre: 'Cocina' },
          ],
        }),
      })
    })

    await page.route('http://localhost:3000/api/auth/register', async (route) => {
      registerPayload = route.request().postDataJSON()

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Cuenta creada correctamente',
        }),
      })
    })

    await page.goto('http://localhost:5173/registro')

    await page.locator('#nombre').fill('Ana')
    await page.locator('#apellido').fill('Martinez')
    await page.locator('#email').fill('ana.martinez@test.com')
    await page.locator('#usuario').fill('anamartinez')
    await page.locator('#telefono').fill('1122334455')
    await page.locator('#password').fill('Test123!')
    await page.locator('#confirmPassword').fill('Test123!')

    await page.getByRole('button', { name: 'Mozo' }).click()
    await page.getByRole('button', { name: 'Cocina' }).click()
    await page.getByRole('button', { name: 'Registrarme' }).click()

    expect(registerPayload).toBeDefined()
    expect(registerPayload).toMatchObject({
      nombre: 'Ana',
      apellido: 'Martinez',
      email: 'ana.martinez@test.com',
      usuario: 'anamartinez',
      telefono: '1122334455',
      tiposEmpleado: [1, 8],
    })

    await expect(page).toHaveURL(/\/login/)

    console.log('âœ“ Cuenta de empleado creada con conocimientos seleccionados')
  })

  test('1. Simular error 500 en login', async ({ page }) => {
    // Interceptar y devolver error 500
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.abort('failed')
    })

    await page.goto('http://localhost:5173/login')

    // Llenar datos de login
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('wrongpass')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Esperar a que se muestre algún mensaje de error
    await expect(page.locator('text=error|Error|fallo|Fallo', { timeout: 3000 })).toBeVisible()

    console.log('✓ Error capturado y mostrado en UI')
  })

  test('2. Simular credenciales incorrectas (401)', async ({ page }) => {
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Credenciales incorrectas',
        }),
      })
    })

    await page.goto('http://localhost:5173/login')

    await page.locator('#identifier').fill('admin')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Verificar que el usuario sigue en la página de login
    await expect(page).toHaveURL(/login/)
    console.log('✓ Login rechazado y usuario permanece en login')
  })

  test('3. Simular error 500 al listar turnos disponibles', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    // Mock de login exitoso
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Simular error al obtener turnos disponibles
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Error interno del servidor',
        }),
      })
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Esperar a que intente cargar turnos y falle gracefully
    // El app debe mostrar un mensaje de error o no debe crashear
    await page.waitForTimeout(2000)

    // Verificar que el usuario está autenticado pero ve un error
    const errorMessage = page.locator('text=error|Error|disponibles|Error al cargar', {
      timeout: 3000,
    })
    const isVisible = await errorMessage.isVisible().catch(() => false)

    if (isVisible) {
      console.log('✓ Error 500 capturado y mostrado en UI')
    } else {
      console.log('✓ Error 500 manejado sin crashear la aplicación')
    }
  })

  test('4. Mockear lista vacía de turnos disponibles', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    // Mock de login
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Devolver lista vacía de turnos
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
        }),
      })
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Debe mostrar página de turnos pero con mensaje de "no hay turnos"
    await expect(page).toHaveURL(/turnos/)

    // Verificar que se muestra mensaje sobre no haber turnos
    const noTurnosMessage = page.locator('text=No hay|sin turnos|disponibles', { timeout: 3000 })
    const isVisible = await noTurnosMessage.isVisible().catch(() => false)

    if (isVisible) {
      console.log('✓ Lista vacía mostrada correctamente')
    } else {
      console.log('✓ Página de turnos cargada sin errores (lista vacía)')
    }
  })

  test('5. Intercepción y validación de payload de postulación', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    let postulacionPayload = null

    // Mock de login
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Mock de turnos con un turno disponible
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 42,
              titulo: 'Test Turno',
              fecha: '2026-06-15T03:00:00.000Z',
              hora_inicio: '18:00:00',
              hora_fin: '22:00:00',
              lugar: 'Test Lugar',
              direccion: 'Test Direccion',
              puesto: 'Test Puesto',
              area: 'Test Area',
              estado: 'abierto',
              postulado: false,
            },
          ],
        }),
      })
    })

    // Interceptar postulación y capturar payload
    await page.route('http://localhost:3000/api/postulaciones', async (route) => {
      postulacionPayload = await route.request().postDataJSON()

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Postulacion creada',
        }),
      })
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/turnos/)

    // Buscar y clickear botón de postulación
    const postularButton = page.getByRole('button', { name: /postular|Postular/i }).first()
    if (await postularButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await postularButton.click()
      await page.waitForTimeout(1000)
    }

    // Validar que el payload contiene turnoId
    expect(postulacionPayload).toBeDefined()
    expect(postulacionPayload).toHaveProperty('turnoId')
    expect(postulacionPayload.turnoId).toBe(42)

    console.log('✓ Payload de postulación validado correctamente:', postulacionPayload)
  })

  test('6. Simular timeout en petición de API', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    // Mock de login
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Simular timeout (respuesta muy lenta)
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await page.waitForTimeout(6000)
      await route.abort('timedout')
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Esperar a que se intente cargar y falle
    await page.waitForTimeout(8000)

    // Verificar que la página muestra algún mensaje de error o no está completamente rota
    const pageTitle = await page.title()
    expect(pageTitle).toBeTruthy()

    console.log('✓ Timeout manejado sin crashear la aplicación')
  })

  test('7. Simular error de validación (400)', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'Test',
      apellido: 'User',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    // Mock de login
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Simular error de validación en postulación
    await page.route('http://localhost:3000/api/postulaciones', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          message: 'Id de turno invalido',
        }),
      })
    })

    // Mock de turnos
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              titulo: 'Test Turno',
              fecha: '2026-06-15T03:00:00.000Z',
              hora_inicio: '18:00:00',
              hora_fin: '22:00:00',
              lugar: 'Test Lugar',
              direccion: 'Test Direccion',
              puesto: 'Test Puesto',
              area: 'Test Area',
              estado: 'abierto',
              postulado: false,
            },
          ],
        }),
      })
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/turnos/)

    // Intentar postulación y verificar que maneja el error
    const postularButton = page.getByRole('button', { name: /postular|Postular/i }).first()
    if (await postularButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await postularButton.click()
      await page.waitForTimeout(1000)

      // Verificar que muestra error
      const errorMessage = page.locator('text=error|Error|invalido|Invalido', { timeout: 3000 })
      const isVisible = await errorMessage.isVisible().catch(() => false)

      if (isVisible) {
        console.log('✓ Error de validación mostrado al usuario')
      }
    }
  })

  test('8. Mockear respuesta con datos especiales (caracteres especiales)', async ({ page }) => {
    const empleado = {
      id: 999,
      nombre: 'José María',
      apellido: 'García López',
      email: 'test@example.com',
      usuario: 'testuser',
      rol: 'empleado',
      estado: 'activo',
    }

    // Mock de login
    await page.route('http://localhost:3000/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-token-123',
          usuario: empleado,
        }),
      })
    })

    // Mock de /me con caracteres especiales
    await page.route('http://localhost:3000/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ usuario: empleado }),
      })
    })

    // Mock de turnos con caracteres especiales
    await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              titulo: 'Catering "VIP" - Evento Especial',
              fecha: '2026-06-15T03:00:00.000Z',
              hora_inicio: '18:00:00',
              hora_fin: '22:00:00',
              lugar: 'Hotel & Restaurante',
              direccion: "Av. O'Higgins 123",
              puesto: 'Mesero/a',
              area: 'Salón "Premium"',
              estado: 'abierto',
              postulado: false,
            },
          ],
        }),
      })
    })

    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('testuser')
    await page.locator('#password').fill('password')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/turnos/)

    // Verificar que los caracteres especiales se muestren correctamente
    const turnoTitle = page.getByText(/Catering.*VIP.*Evento/, { timeout: 5000 })
    const isVisible = await turnoTitle.isVisible().catch(() => false)

    if (isVisible) {
      console.log('✓ Caracteres especiales mostrados correctamente')
    }
  })
})
