# Documento de Diseño de Pruebas - Pruebas Complejas Playwright

## Propósito

Validar que el sistema funciona correctamente en tres dimensiones:
1. **API Real**: Endpoints reales sin UI
2. **Mocking e Intercepción**: Simular errores y escenarios controlados
3. **Híbridas**: Preparar estado vía API y validar desde UI

---

## Tabla de Diseño de Pruebas

### PRUEBAS DE API REAL (test-api.spec.js)

| ID | Tipo de Prueba | Objetivo | Entradas | Resultado Esperado | Justificación |
|---|---|---|---|---|---|
| API-001 | API Real | Validar registro de nuevo usuario | nombre, apellido, email, usuario, password, telefono | Status 201, mensaje "Cuenta creada correctamente" | Verifica que el backend puede crear usuarios correctamente. API real porque necesitamos un usuario real en BD. |
| API-002 | API Real | Validar autenticación (login) | usuario/email, password | Status 200, token JWT, datos del usuario | Prueba de API real porque el token será usado en otras pruebas. |
| API-003 | API Real | Validar endpoint /me (usuario autenticado) | Token Bearer | Status 200, datos completos del usuario | API real para verificar que la autenticación funciona en endpoints protegidos. |
| API-004 | API Real | Login de admin para crear turnos | identifier="admin", password="1234" | Status 200, token de admin | API real porque necesitamos acceso real al admin para crear turnos. |
| API-005 | API Real | Crear turno como admin | Todos los datos del turno (título, fecha, hora, lugar, etc.) | Status 201, turno guardado en BD | API real porque los turnos deben persistir en la BD para otras pruebas. |
| API-006 | API Real | Listar turnos disponibles | Token de empleado | Status 200, array de turnos abiertos | API real para verificar que los turnos creados están disponibles. |
| API-007 | API Real | Postularse a un turno | turnoId, token de empleado | Status 201, "Postulacion creada" | API real para verificar el flujo completo de postulación. |
| API-008 | API Real | Ver mis postulaciones | Token de empleado | Status 200, array de postulaciones del usuario | API real para verificar que las postulaciones se guardan. |
| API-009 | API Real | Error sin autenticación | GET /turnos/disponibles sin token | Status 401 | Verifica que los endpoints requieren autenticación. |
| API-010 | API Real | Error postulación duplicada | Postularse 2 veces al mismo turno | Status 409, "Ya te postulaste" | Verifica validaciones de negocio en el backend. |

**Cuándo usar API Real:**
- Probar flujos de datos que deben persistir
- Validar reglas de negocio del backend
- Verificar integridad de datos
- Probar autenticación real

---

### PRUEBAS CON MOCKING E INTERCEPCIÓN (test-mocking.spec.js)

| ID | Tipo de Prueba | Objetivo | Entradas | Resultado Esperado | Justificación |
|---|---|---|---|---|---|
| MOCK-001 | Mocking | Simular error 500 en login | Abortar conexión al endpoint login | UI maneja error sin crashear | Mocking porque no queremos que falle el servidor real; validamos que UI tolera errores. |
| MOCK-002 | Mocking | Simular credenciales incorrectas (401) | Mock de respuesta 401 | Usuario permanece en login | Mocking para probar flujos de error sin afectar BD. |
| MOCK-003 | Mocking | Error 500 al listar turnos | Respuesta 500 en /turnos/disponibles | UI muestra error o maneja gracefully | Mocking para simular caída de servidor sin afectarlo. |
| MOCK-004 | Mocking | Listar turnos vacío | Mock array vacío en /turnos/disponibles | UI muestra "No hay turnos" | Mocking para probar estado vacío sin crear/eliminar datos. |
| MOCK-005 | Intercepción | Validar payload de postulación | Interceptar POST /postulaciones | Payload contiene turnoId correcto | Intercepción para validar que el cliente envía datos correctos. |
| MOCK-006 | Mocking | Simular timeout | Respuesta lenta en /turnos/disponibles | UI maneja timeout sin crashear | Mocking para simular lentitud de red. |
| MOCK-007 | Mocking | Error de validación (400) | Mock error 400 en postulación | UI muestra mensaje de error | Mocking para probar errores de validación. |
| MOCK-008 | Mocking | Datos con caracteres especiales | Mock turno con acentos, comillas | Caracteres mostrados correctamente en UI | Mocking para probar manejo de caracteres especiales. |

**Cuándo usar Mocking:**
- Simular errores sin afectar servidor
- Probar escenarios raros (timeout, lista vacía)
- Validar comportamiento de error en UI
- Interceptar y validar payloads
- Probar sin dependencias externas

---

### PRUEBAS HÍBRIDAS (test-hybrid.spec.js)

| ID | Tipo de Prueba | Objetivo | Entradas (API) | Pasos | Resultado Esperado | Justificación |
|---|---|---|---|---|---|---|
| HYBRID-001 | Híbrida | Crear usuario en API y login en UI | Datos de usuario nuevo | 1. POST /register vía API 2. Login en UI con credenciales | Usuario autentica en UI exitosamente | Híbrida porque necesita estado real en BD pero valida desde UI. |
| HYBRID-002 | Híbrida | Crear turno en API y verificar en UI | Datos de turno nuevo | 1. Admin crea turno vía API 2. Empleado ve turno en UI | Turno visible en lista de disponibles en UI | Híbrida para verificar sincronización BD-UI. |
| HYBRID-003 | Híbrida | Postularse vía API y verificar en UI | Datos de turno existente | 1. POST /postulaciones vía API 2. UI muestra en "Mis Postulaciones" | Postulación visible en UI inmediatamente | Híbrida para probar que cambios en API se reflejan en UI. |
| HYBRID-004 | Híbrida | Preparar múltiples estados y flujo completo | Admin crea 2 turnos, empleado se postula a ambos | 1. API: crear turnos 2. API: postulaciones 3. UI: verificar list | Todas las postulaciones visibles en UI | Híbrida para probar flujo completo. |
| HYBRID-005 | Híbrida | Crear turno y postulación, verificar en admin | Admin crea turno vía API, empleado se postula | 1. API: turno 2. API: postulación 3. UI admin: ver postulados | Postulación visible en dashboard admin | Híbrida para probar coordinación entre admin y empleado. |
| HYBRID-006 | Híbrida | Cambio de estado vía API y reflejo en UI | Postulación existente | 1. API: cancelar postulación 2. UI: recargar y verificar | Postulación actualizada en UI | Híbrida para probar actualización de estado. |

**Cuándo usar Pruebas Híbridas:**
- Preparar estado complejo vía API (más rápido que UI)
- Validar sincronización frontend-backend
- Probar flujos multi-usuario (admin + empleado)
- Necesitar datos reales pero validar desde UI
- Probar cambios de estado

---

## Explicación de Decisiones

### ¿Por qué usar API Real?

**Ventajas:**
- ✅ Prueba la integración completa del sistema
- ✅ Valida persistencia en base de datos
- ✅ Detecta errores de lógica de negocio
- ✅ Crea datos reutilizables para otras pruebas

**Desventajas:**
- ❌ Más lento (conexión a BD real)
- ❌ Depende del servidor funcionando
- ❌ Puede tener efectos secundarios (datos quedan en BD)

**Mejor para:**
- Flujos críticos de negocio
- Validar reglas de validación
- Probar autenticación/autorización
- Escenarios que requieren persistencia

### ¿Por qué usar Mocking?

**Ventajas:**
- ✅ Muy rápido (sin servidor)
- ✅ Simula errores sin afectar servidor
- ✅ Aislado y predecible
- ✅ Prueba casos extremos (timeout, lista vacía)

**Desventajas:**
- ❌ No prueba servidor real
- ❌ No detecta bugs en backend
- ❌ Puede ser falso positivo

**Mejor para:**
- Flujos de manejo de errores
- Escenarios raros o costosos (timeout)
- Validar comportamiento de UI sin dependencias
- Desarrollo rápido mientras backend está en construcción

### ¿Por qué usar Pruebas Híbridas?

**Ventajas:**
- ✅ Mejor de ambos mundos: datos reales + validación desde UI
- ✅ Más rápido que UI puro (api para setup)
- ✅ Valida sincronización completa
- ✅ Simula escenarios realistas

**Desventajas:**
- ❌ Más complejo de escribir
- ❌ Depende de que API funcione

**Mejor para:**
- Flujos multi-paso (create → view → update)
- Simular múltiples usuarios
- Validar que cambios en API se reflejan en UI
- Reducir tiempo de prueba (setup rápido vía API, validación vía UI)

---

## Estructura de Archivos de Prueba

```
tests/
├── test-api.spec.js          (10 pruebas de API real)
├── test-mocking.spec.js      (8 pruebas con mocking)
├── test-hybrid.spec.js       (6 pruebas híbridas)
└── postulacion-turno.spec.js (prueba original)
```

**Total: 24 nuevas pruebas + 1 original = 25 pruebas**

---

## Ejecución de Pruebas

### Ejecutar todas las pruebas:
```bash
npm run test:e2e
```

### Ejecutar solo pruebas de API:
```bash
npx playwright test test-api.spec.js
```

### Ejecutar solo pruebas de mocking:
```bash
npx playwright test test-mocking.spec.js
```

### Ejecutar solo pruebas híbridas:
```bash
npx playwright test test-hybrid.spec.js
```

### Ejecutar en modo debug:
```bash
npx playwright test --debug
```

### Ejecutar con reporte HTML:
```bash
npx playwright test --reporter=html
```

---

## Matriz de Cobertura

| Aspecto | Prueba API | Prueba Mocking | Prueba Híbrida |
|---------|-----------|----------------|----------------|
| Validación de servidor | ✅ Sí | ❌ No | ✅ Sí |
| Manejo de errores en UI | ⚠️ Poco | ✅ Sí | ✅ Sí |
| Persistencia de datos | ✅ Sí | ❌ No | ✅ Sí |
| Velocidad | ⚠️ Lento | ✅ Rápido | ✅ Medio |
| Casos extremos | ❌ Difícil | ✅ Fácil | ❌ Difícil |
| Sincronización UI-API | ⚠️ No completa | ❌ No | ✅ Sí |
| Flujos realistas | ✅ Sí | ❌ No | ✅ Sí |

---

## Requisitos para Ejecutar

1. **Backend ejecutándose en localhost:3000**
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Frontend ejecutándose en localhost:5173**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Base de datos con datos iniciales**
   - Admin user: usuario="admin", password="1234"
   - Employee users con permisos adecuados

4. **Playwright instalado**
   ```bash
   npm install -D @playwright/test
   ```

---

## Notas Importantes

### Variables Dinámicas
- Se usan timestamps para emails únicos: `${Date.now()}`
- IDs se capturan de respuestas anteriores
- Tokens se reutilizan entre llamadas

### Sincronización
- Las pruebas esperan a que elementos sean visibles
- Se usan `waitForTimeout` en UI para esperar carga
- Se validan respuestas antes de hacer llamadas posteriores

### Datos de Prueba
- **Admin**: usuario="admin", password="1234"
- **Empleado**: usuario="lucia", password="1234"
- Los nuevos usuarios se crean con emails únicos para evitar conflictos

### Consideraciones de Mantenimiento
- Si URLs cambien, actualizar en todas las pruebas
- Si validaciones de backend cambien, actualizar pruebas de mocking
- Si estructura de BD cambie, actualizar pruebas de API
- Borrar datos de prueba periódicamente (emails, turnos con "Híbrido" en nombre)

---

## Ejecución en CI/CD

Para GitHub Actions o similar:
```yaml
- name: Run Playwright tests
  run: npm run test:e2e
  env:
    BACKEND_URL: http://localhost:3000
    FRONTEND_URL: http://localhost:5173
```

---

## Mejoras Futuras

1. **Paralelización**: Ejecutar pruebas en paralelo
2. **Reportes**: Generar reportes en formato Allure
3. **Integración**: Agregar a pipeline de CI/CD
4. **Performance**: Pruebas de carga con artillery o k6
5. **Seguridad**: Pruebas de OWASP Top 10
6. **E2E avanzado**: Pruebas con WebSocket para notificaciones en tiempo real
