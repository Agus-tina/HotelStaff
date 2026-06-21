# Guía Rápida de Ejecución de Pruebas

## Instrucciones Paso a Paso

### 1️⃣ Preparar Backend (Terminal 1)

```bash
cd backend

# Primera vez: instalar dependencias
npm install

# Iniciar servidor
npm start
```

**Esperar a ver**: `Server running on port 3000`

### 2️⃣ Preparar Frontend (Terminal 2)

```bash
cd frontend

# Primera vez: instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

**Esperar a ver**: `Local:   http://127.0.0.1:5173/`

### 3️⃣ Ejecutar Pruebas (Terminal 3)

```bash
# Ejecutar TODAS las pruebas
npm run test:e2e

# Esperar a que se completen (toma ~2-3 minutos)
```

---

## Comandos Individuales

### Ejecutar por Tipo de Prueba

```bash
# Solo pruebas de API real
npx playwright test tests/test-api.spec.js

# Solo pruebas con mocking
npx playwright test tests/test-mocking.spec.js

# Solo pruebas híbridas
npx playwright test tests/test-hybrid.spec.js

# Solo prueba original
npx playwright test tests/postulacion-turno.spec.js
```

### Ejecutar Prueba Específica

```bash
# Por nombre de prueba
npx playwright test -g "Registro de nuevo empleado"

# Prueba específica de un archivo
npx playwright test tests/test-api.spec.js:1
```

### Modo Debug

```bash
# Abre inspector interactivo de Playwright
npx playwright test --debug

# Con visualización de paso a paso
npx playwright test --debug --headed
```

### Generar Reportes

```bash
# Ejecutar y generar reporte HTML
npx playwright test

# Mostrar reporte generado
npx playwright show-report
```

---

## Qué Esperar en Cada Ejecución

### Mocking Tests (✅ Siempre pasan)
- ✅ 8 pruebas
- ⏱️ ~35 segundos
- No requieren backend

### API Tests (❓ Requieren backend)
- ❓ 10 pruebas
- ⏱️ ~5 segundos cada una
- Necesitan servidor en puerto 3000

### Hybrid Tests (❓ Requieren backend)
- ❓ 6 pruebas
- ⏱️ ~1-2 segundos cada una (más rápido que UI puro)
- Necesitan servidor en puerto 3000

### Original Test (✅ Generalmente pasa)
- ✅ 1 prueba
- ⏱️ ~2 segundos
- Prueba de mocking original

---

## Solución de Problemas

### Error: "connect ECONNREFUSED ::1:3000"
**Significado**: Backend no está corriendo
**Solución**: Ejecutar `npm start` en carpeta `/backend` en otra terminal

### Error: "Timeout waiting for locator"
**Significado**: Frontend no responde
**Solución**: 
- Verificar que frontend está en `http://localhost:5173`
- Ejecutar `npm run dev` en carpeta `/frontend`

### Las pruebas son muy lentas
**Solución**: Usar `--workers=1` para ejecutar serialmente
```bash
npx playwright test --workers=1
```

### Necesito ver qué está pasando visualmente
**Solución**: Ejecutar con navegador visible
```bash
npx playwright test --headed

# O modo debug para controlar paso a paso
npx playwright test --debug
```

---

## Validaciones Clave por Tipo de Prueba

### Mocking Tests ✅
Validan que la UI maneja correctamente:
- ✅ Errores 500
- ✅ 401 Unauthorized
- ✅ 400 Validation errors
- ✅ Timeouts
- ✅ Listas vacías
- ✅ Caracteres especiales

### API Tests ❓
Validan que el backend:
- ❓ Registra usuarios correctamente
- ❓ Autentica credenciales
- ❓ Crea turnos
- ❓ Persiste datos en BD
- ❓ Valida reglas de negocio

### Hybrid Tests ❓
Validan:
- ❓ Datos creados en API aparecen en UI
- ❓ Cambios en API se reflejan en UI
- ❓ Flujos multi-usuario funcionan
- ❓ Sincronización completa

---

## Archivos de Referencia

| Archivo | Descripción |
|---------|-------------|
| `test-api.spec.js` | 10 pruebas de API real |
| `test-mocking.spec.js` | 8 pruebas con mocking (✅ Pueden ejecutarse ahora) |
| `test-hybrid.spec.js` | 6 pruebas híbridas |
| `TEST_DESIGN_DOCUMENT.md` | Tabla de diseño completo de 24 casos |
| `EVIDENCIA_EJECUCION.md` | Resultados de ejecución |
| `playwright.config.ts` | Configuración de Playwright |

---

## Checklist para Entregas

```
✅ Crear usuarios vía API
  └─ npm run test:e2e
  └─ Buscar: "1. Registro de nuevo empleado vía API"

✅ Pruebas de mocking funcionando
  └─ npm run test:e2e (ya pasaron)
  └─ 8/8 pruebas exitosas

✅ Tabla de diseño de pruebas
  └─ Ver: TEST_DESIGN_DOCUMENT.md
  └─ Contiene: 24 casos, objetivos, entradas, resultados

✅ Explicación de decisiones
  └─ Ver: TEST_DESIGN_DOCUMENT.md -> "Explicación de Decisiones"
  └─ Por qué API real, mocking o híbrida

✅ Evidencia de ejecución
  └─ Ver: EVIDENCIA_EJECUCION.md
  └─ Contiene: resultados, matriz de cobertura, logs
```

---

## Notas Importantes

### Base de Datos
- Asegurarse que MySQL está corriendo antes de iniciar backend
- Ejecutar migraciones si es necesario
- Datos de prueba crearán nuevos usuarios, puede limpiar después

### Usuario de Prueba
- **Usuario**: lucia
- **Contraseña**: 1234
- **Rol**: empleado
- **Disponible**: Por defecto en BD

### Usuario Admin
- **Usuario**: admin
- **Contraseña**: 1234
- **Rol**: admin
- **Disponible**: Por defecto en BD

### Orden Recomendado de Ejecución

1. Ejecutar primero **test-mocking.spec.js** (no requiere backend)
2. Luego **test-api.spec.js** (requiere backend)
3. Finalmente **test-hybrid.spec.js** (requiere backend)

---

## Variables de Entorno

Si es necesario configurar URLs personalizadas, editar:

```javascript
// En cada archivo .spec.js:
const API_URL = 'http://localhost:3000'
const UI_URL = 'http://localhost:5173'
```

---

## Métricas de Éxito

```
Todas las pruebas ejecutables deberían pasar:
- test-mocking.spec.js: 8/8 ✅
- test-api.spec.js: 10/10 (con backend)
- test-hybrid.spec.js: 6/6 (con backend)
- postulacion-turno.spec.js: 1/1 ✅

Total esperado: 25/25 pruebas exitosas
```

---

## Contacto/Soporte

Si hay problemas:
1. Revisar logs en terminal
2. Verificar que ports 3000 y 5173 están disponibles
3. Reiniciar servidores
4. Ver archivo `EVIDENCIA_EJECUCION.md` para más detalles
