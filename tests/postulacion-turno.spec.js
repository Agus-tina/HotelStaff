const { expect, test } = require('@playwright/test')

const empleado = {
  id: 10,
  nombre: 'Lucia',
  apellido: 'Perez',
  email: 'lucia@test.com',
  usuario: 'lucia',
  rol: 'empleado',
  estado: 'activo',
}

test('empleado inicia sesion y se postula a un turno disponible', async ({ page }) => {
  let postulado = false

  await page.route('http://localhost:3000/api/auth/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'token-de-prueba',
        usuario: empleado,
      }),
    })
  })

  await page.route('http://localhost:3000/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ usuario: empleado }),
    })
  })

  await page.route('http://localhost:3000/api/turnos/disponibles', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: 25,
            titulo: 'Servicio cena casino',
            fecha: '2026-05-28T03:00:00.000Z',
            hora_inicio: '21:00:00',
            hora_fin: '23:00:00',
            lugar: 'Casino Central',
            direccion: 'Av. Siempre Viva 123',
            puesto: 'Mozo',
            area: 'Salon principal',
            estado: 'abierto',
            postulado,
          },
        ],
      }),
    })
  })

  await page.route('http://localhost:3000/api/postulaciones', async (route) => {
    expect(route.request().method()).toBe('POST')
    const body = route.request().postDataJSON()
    expect(body.turnoId).toBe(25)
    postulado = true

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Postulacion creada' }),
    })
  })

  await page.goto('/login')
  await page.locator('#identifier').fill('lucia')
  await page.locator('#password').fill('1234')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await expect(page).toHaveURL(/\/empleado\/turnos/)
  await expect(page.getByRole('heading', { name: 'Oportunidades disponibles' })).toBeVisible()
  await expect(page.getByText('Servicio cena casino')).toBeVisible()
  await expect(page.getByText(/2026-05-28.*21:00 a 23:00/)).toBeVisible()

  await page.getByRole('button', { name: 'Postularme' }).click()

  await expect(page.getByRole('button', { name: 'Postulado' })).toBeDisabled()
})
