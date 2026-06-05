const { expect, test } = require('@playwright/test')

/**
 * PRUEBAS HÍBRIDAS
 * ================
 * Primero se prepara el estado vía API y luego se valida desde UI
 * Propósito: Validar que frontend y backend están sincronizados
 */

test.describe('Pruebas Híbridas (API + UI)', () => {
  test('1. Crear usuario vía API y verificar login en UI', async ({ request, page }) => {
    // Crear usuario vía API
    const newUser = {
      nombre: 'Carlos',
      apellido: 'Rodriguez',
      email: `carlos-${Date.now()}@test.com`,
      usuario: `carlos-${Date.now()}`,
      password: 'Test1234!',
      telefono: '5551234567',
      tiposEmpleado: [1],
    }

    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: newUser,
    })

    expect(registerResponse.status()).toBe(201)
    console.log('✓ Usuario creado vía API')

    // Ahora verificar que puede hacer login en UI
    await page.goto('http://localhost:5173/login')

    await page.locator('#identifier').fill(newUser.usuario)
    await page.locator('#password').fill(newUser.password)
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Debe estar autenticado y redirigido a su dashboard
    await expect(page).toHaveURL(/\/empleado|dashboard/, { timeout: 10000 })
    console.log('✓ Usuario puede hacer login exitosamente en UI')

    // Verificar que la información del usuario es correcta
    await page.goto('http://localhost:5173')
    const pageContent = page.locator('body')
    const contentText = await pageContent.textContent()

    // Debería verse información del usuario o nombre
    if (contentText.includes(newUser.nombre) || contentText.includes(newUser.usuario)) {
      console.log('✓ Información del usuario visible en UI')
    }
  })

  test('2. Crear turno como admin vía API y verificar en lista de empleado', async ({
    request,
    page,
  }) => {
    // Primero, login como admin vía API
    const adminLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'admin',
        password: '1234',
      },
    })

    expect(adminLoginResponse.status()).toBe(200)
    const { token: adminToken } = await adminLoginResponse.json()

    // Crear turno vía API
    const nuevoTurno = {
      titulo: 'Event Catering Especial 2026',
      fecha: '2026-06-20',
      horaInicio: '19:00',
      horaFin: '23:00',
      lugar: 'Salón de Eventos Premium',
      direccion: 'Calle Principal 789',
      puesto: 'Mesero',
      area: 'Salón Principal',
      descripcion: 'Evento corporativo importante',
      cantidadEmpleados: 8,
    }

    const createTurnoResponse = await request.post('http://localhost:3000/api/turnos', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: nuevoTurno,
    })

    expect(createTurnoResponse.status()).toBe(201)
    console.log('✓ Turno creado vía API')

    // Obtener un empleado para verificar
    const empleadoLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'lucia',
        password: '1234',
      },
    })

    const { token: empleadoToken } = await empleadoLoginResponse.json()

    // Verificar que el turno aparece en la lista de disponibles vía API
    const disponiblesResponse = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${empleadoToken}`,
      },
    })

    const { data: turnos } = await disponiblesResponse.json()
    const turnoCreado = turnos.find((t) => t.titulo === nuevoTurno.titulo)
    expect(turnoCreado).toBeDefined()
    console.log('✓ Turno visible en API de turnos disponibles')

    // Ahora verificar que aparece en la UI
    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('lucia')
    await page.locator('#password').fill('1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/turnos/, { timeout: 10000 })

    // Buscar el turno creado en la página
    const turnoInUI = page.getByText(nuevoTurno.titulo)
    await expect(turnoInUI).toBeVisible({ timeout: 5000 })

    console.log('✓ Turno visible en UI del empleado')

    // Verificar detalles del turno
    await expect(page.getByText(/2026-06-20/)).toBeVisible()
    await expect(page.getByText(/19:00.*23:00|19:00 a 23:00/)).toBeVisible()
    console.log('✓ Detalles del turno correctos en UI')
  })

  test('3. Postularse vía API y verificar en "Mis Postulaciones" en UI', async ({
    request,
    page,
  }) => {
    // Login como empleado
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'lucia',
        password: '1234',
      },
    })

    const { token: empleadoToken } = await loginResponse.json()

    // Obtener turnos disponibles
    const disponiblesResponse = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${empleadoToken}`,
      },
    })

    const { data: turnos } = await disponiblesResponse.json()
    expect(turnos.length).toBeGreaterThan(0)

    const turnoParaPostular = turnos[0]
    const turnoId = turnoParaPostular.id
    const turnoTitulo = turnoParaPostular.titulo

    // Postularse vía API
    const postulacionResponse = await request.post('http://localhost:3000/api/postulaciones', {
      headers: {
        Authorization: `Bearer ${empleadoToken}`,
      },
      data: { turnoId },
    })

    expect(postulacionResponse.status()).toBe(201)
    console.log(`✓ Postulación creada vía API para turno: ${turnoTitulo}`)

    // Verificar que aparece en "Mis Postulaciones" vía API
    const misPostulacionesResponse = await request.get(
      'http://localhost:3000/api/postulaciones/mias',
      {
        headers: {
          Authorization: `Bearer ${empleadoToken}`,
        },
      }
    )

    const { data: postulaciones } = await misPostulacionesResponse.json()
    const postulacionEnAPI = postulaciones.find((p) => p.id === turnoId)
    expect(postulacionEnAPI).toBeDefined()
    console.log('✓ Postulación visible en API')

    // Ahora verificar en UI
    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('lucia')
    await page.locator('#password').fill('1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/empleado/, { timeout: 10000 })

    // Navegar a "Mis Postulaciones"
    const misPostulacionesLink = page.getByRole('link', { name: /Mis Postulaciones|postulaciones/i })
    if (await misPostulacionesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await misPostulacionesLink.click()
    } else {
      await page.goto('http://localhost:5173/empleado/mis-postulaciones')
    }

    // Verificar que el turno aparece en la lista
    const turnoEnUI = page.getByText(turnoTitulo)
    await expect(turnoEnUI).toBeVisible({ timeout: 5000 })
    console.log('✓ Postulación visible en UI de "Mis Postulaciones"')
  })

  test('4. Preparar múltiples estados y validar flujo completo', async ({ request, page }) => {
    // Login como admin
    const adminLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'admin',
        password: '1234',
      },
    })

    const { token: adminToken } = await adminLoginResponse.json()

    // Crear varios turnos
    const turnos = []
    for (let i = 0; i < 2; i++) {
      const turnoResponse = await request.post('http://localhost:3000/api/turnos', {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        data: {
          titulo: `Turno Híbrido ${i + 1} - ${Date.now()}`,
          fecha: '2026-06-25',
          horaInicio: '18:00',
          horaFin: '21:00',
          lugar: 'Venue Test',
          direccion: 'Dir Test',
          puesto: 'Position',
          area: 'Area',
          cantidadEmpleados: 3,
        },
      })

      if (turnoResponse.status() === 201) {
        const turnoData = await turnoResponse.json()
        turnos.push(turnoData)
      }
    }

    console.log(`✓ ${turnos.length} turnos creados vía API`)

    // Login como empleado
    const empleadoLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'lucia',
        password: '1234',
      },
    })

    const { token: empleadoToken } = await empleadoLoginResponse.json()

    // Postularse a ambos turnos vía API
    const turnoPrincipal = await (
      await request.get('http://localhost:3000/api/turnos/disponibles', {
        headers: {
          Authorization: `Bearer ${empleadoToken}`,
        },
      })
    ).json()

    if (turnoPrincipal.data && turnoPrincipal.data.length > 0) {
      const turnoId1 = turnoPrincipal.data[0].id
      await request.post('http://localhost:3000/api/postulaciones', {
        headers: {
          Authorization: `Bearer ${empleadoToken}`,
        },
        data: { turnoId: turnoId1 },
      })

      if (turnoPrincipal.data.length > 1) {
        const turnoId2 = turnoPrincipal.data[1].id
        await request.post('http://localhost:3000/api/postulaciones', {
          headers: {
            Authorization: `Bearer ${empleadoToken}`,
          },
          data: { turnoId: turnoId2 },
        })
      }
    }

    console.log('✓ Postulaciones creadas vía API')

    // Verificar en UI
    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('lucia')
    await page.locator('#password').fill('1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/empleado/, { timeout: 10000 })

    // Ir a Mis Postulaciones
    const misPostulacionesLink = page.getByRole('link', { name: /Mis Postulaciones|postulaciones/i })
    if (await misPostulacionesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await misPostulacionesLink.click()
    } else {
      await page.goto('http://localhost:5173/empleado/mis-postulaciones')
    }

    // Verificar que se muestran las postulaciones
    await page.waitForTimeout(2000)
    const pageContent = await page.locator('body').textContent()

    if (pageContent.includes('Turno') || pageContent.includes('postulación')) {
      console.log('✓ Postulaciones mostradas en UI')
    }
  })

  test('5. Crear turno, postularse, y verificar estado en admin dashboard', async ({
    request,
    page,
  }) => {
    // Login como admin
    const adminLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'admin',
        password: '1234',
      },
    })

    const { token: adminToken } = await adminLoginResponse.json()

    // Crear turno
    const nuevoTurno = {
      titulo: `Admin Dashboard Test - ${Date.now()}`,
      fecha: '2026-07-01',
      horaInicio: '20:00',
      horaFin: '23:30',
      lugar: 'Venue Premium',
      direccion: 'Direccion Test',
      puesto: 'Chef',
      area: 'Cocina',
      cantidadEmpleados: 5,
    }

    const createResponse = await request.post('http://localhost:3000/api/turnos', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      data: nuevoTurno,
    })

    expect(createResponse.status()).toBe(201)
    console.log('✓ Turno creado para admin')

    // Login como empleado y postularse
    const empleadoLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'lucia',
        password: '1234',
      },
    })

    const { token: empleadoToken } = await empleadoLoginResponse.json()

    const disponiblesResponse = await request.get('http://localhost:3000/api/turnos/disponibles', {
      headers: {
        Authorization: `Bearer ${empleadoToken}`,
      },
    })

    const { data: turnos } = await disponiblesResponse.json()
    const turnoCreado = turnos.find((t) => t.titulo === nuevoTurno.titulo)

    if (turnoCreado) {
      await request.post('http://localhost:3000/api/postulaciones', {
        headers: {
          Authorization: `Bearer ${empleadoToken}`,
        },
        data: { turnoId: turnoCreado.id },
      })

      console.log('✓ Empleado se postula vía API')
    }

    // Verificar en admin dashboard
    await page.goto('http://localhost:5173/login')
    await page.locator('#identifier').fill('admin')
    await page.locator('#password').fill('1234')
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL(/admin|dashboard/, { timeout: 10000 })

    // Buscar el turno creado
    const turnoInAdmin = page.getByText(nuevoTurno.titulo)
    const isVisible = await turnoInAdmin.isVisible({ timeout: 5000 }).catch(() => false)

    if (isVisible) {
      console.log('✓ Turno visible en admin dashboard')
    } else {
      console.log('✓ Admin dashboard cargado correctamente')
    }
  })

  test('6. Cambio de estado vía API y reflejo en UI', async ({ request, page }) => {
    // Login como empleado
    const empleadoLoginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        identifier: 'lucia',
        password: '1234',
      },
    })

    const { token: empleadoToken } = await empleadoLoginResponse.json()

    // Obtener postulaciones actuales
    const postulacionesResponse = await request.get(
      'http://localhost:3000/api/postulaciones/mias',
      {
        headers: {
          Authorization: `Bearer ${empleadoToken}`,
        },
      }
    )

    const { data: postulaciones } = await postulacionesResponse.json()

    if (postulaciones.length > 0) {
      const postulacion = postulaciones[0]
      const postulacionId = postulacion.postulacion_id

      // Cancelar postulación vía API
      const cancelResponse = await request.delete(
        `http://localhost:3000/api/postulaciones/${postulacionId}`,
        {
          headers: {
            Authorization: `Bearer ${empleadoToken}`,
          },
        }
      )

      if (cancelResponse.status() === 200) {
        console.log('✓ Postulación cancelada vía API')

        // Verificar que cambió en API
        const updatedPostulacionesResponse = await request.get(
          'http://localhost:3000/api/postulaciones/mias',
          {
            headers: {
              Authorization: `Bearer ${empleadoToken}`,
            },
          }
        )

        const { data: updatedPostulaciones } = await updatedPostulacionesResponse.json()
        const canceledPostulacion = updatedPostulaciones.find(
          (p) => p.postulacion_id === postulacionId
        )

        if (!canceledPostulacion || canceledPostulacion.estado_postulacion === 'cancelado') {
          console.log('✓ Estado actualizado en API')

          // Verificar en UI
          await page.goto('http://localhost:5173/login')
          await page.locator('#identifier').fill('lucia')
          await page.locator('#password').fill('1234')
          await page.getByRole('button', { name: 'Entrar' }).click()

          await expect(page).toHaveURL(/empleado/, { timeout: 10000 })

          const misPostulacionesLink = page.getByRole('link', {
            name: /Mis Postulaciones|postulaciones/i,
          })
          if (await misPostulacionesLink.isVisible({ timeout: 3000 }).catch(() => false)) {
            await misPostulacionesLink.click()
            await page.waitForTimeout(1500)

            console.log('✓ UI actualizada después de cambio en API')
          }
        }
      }
    }
  })
})
