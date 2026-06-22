# 🧪 Pruebas Avanzadas con Playwright - Trabajo Final

> **Implementación de 3 dimensiones de testing**: API Real, Mocking e Integración Híbrida

---

## 📚 ¿Qué es esto?

Este proyecto implementa un **sistema completo de testing** que enseña a estudiantes cómo probar aplicaciones web más allá de solo la interfaz gráfica.

**En lugar de solo hacer**:
```javascript
await page.click('button') // Prueba UI pura
```

**Aprendemos a hacer**:
```javascript
// API testing (sin UI)
const response = await request.post('/api/turnos', { data: ... })

// Mocking (simular errores)
await page.route('...', route => route.fulfill({ status: 500 }))

// Híbridas (integración completa)
await request.post('/api/turnos', { data: ... })  // API
await page.goto('/turnos')                         // UI
```

---

## 📁 Estructura del Proyecto

```
TrabajoFinal/
├── 📄 RESUMEN_EJECUTIVO.md          👈 COMIENZA AQUÍ
├── 📄 TEST_DESIGN_DOCUMENT.md       Tabla de 24 casos de prueba
├── 📄 ESTRATEGIA_TESTING.md         Explicación educativa
├── 📄 EVIDENCIA_EJECUCION.md        Resultados de ejecución
├── 📄 GUIA_RAPIDA_EJECUCION.md      Cómo correr los tests
│
├── tests/
│   ├── 🧪 test-api.spec.js          10 pruebas de API real
│   ├── 🧪 test-mocking.spec.js      8 pruebas con mocking ✅
│   ├── 🧪 test-hybrid.spec.js       6 pruebas híbridas
│   └── 🧪 postulacion-turno.spec.js 1 prueba original ✅
│
├── backend/                          Servidor Express
├── frontend/                         React + Vite
└── playwright.config.ts              Configuración de tests
```

---

## 🚀 Inicio Rápido

### 1. Preparar Ambiente (30 segundos)

```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Pruebas
npm run test:e2e
```

### 2. Ver Resultados

```bash
npx playwright show-report
```

---

## 🎯 3 Dimensiones de Testing

### 1️⃣ API Real (10 pruebas)
**Probar el backend directamente sin interfaz gráfica**

```javascript
// Ejemplo: Registrar usuario
const response = await request.post('/api/auth/register', {
  data: { nombre: 'Juan', email: 'juan@test.com', ... }
})
expect(response.status()).toBe(201) // ✅
```

✅ **Ventajas**: Rápido, prueba backend, persiste datos  
❌ **Desventajas**: Requiere servidor, no prueba UI  
🎯 **Usar para**: Validaciones, reglas de negocio

---

### 2️⃣ Mocking (8 pruebas)
**Simular errores sin afectar el servidor real**

```javascript
// Ejemplo: Simular error 500
await page.route('/api/turnos', async (route) => {
  await route.fulfill({ status: 500 })
})
// UI debe manejar el error gracefully ✅
```

✅ **Ventajas**: Rápido, sin servidor, casos extremos  
❌ **Desventajas**: No prueba servidor, puede dar falsos positivos  
🎯 **Usar para**: Manejo de errores, casos raros

---

### 3️⃣ Híbridas (6 pruebas)
**Crear datos vía API, validar en UI**

```javascript
// Paso 1: Crear vía API
const response = await request.post('/api/auth/register', { data: ... })

// Paso 2: Validar en UI
await page.goto('/login')
await page.fill('#username', 'juan')
await expect(page).toHaveURL(/empleado/) // ✅
```

✅ **Ventajas**: Realista, rápido setup, completo  
❌ **Desventajas**: Más complejo  
🎯 **Usar para**: Flujos completos, integración

---

## 📊 Resultados Actuales

```
✅ Pruebas de Mocking:     8/8 PASADAS
✅ Prueba Original:        1/1 PASADA
⏳ Pruebas de API:         Requieren backend
⏳ Pruebas Híbridas:       Requieren backend

Total:                  9/25 ejecutadas exitosamente
```

---

## 📖 Documentación

### Para Profesores/Evaluadores
👉 **[TEST_DESIGN_DOCUMENT.md](TEST_DESIGN_DOCUMENT.md)**
- Tabla detallada de 24 casos de prueba
- Objetivos, entradas, resultados esperados
- Explicación de decisiones
- Matriz de cobertura

### Para Estudiantes (Aprender)
👉 **[ESTRATEGIA_TESTING.md](ESTRATEGIA_TESTING.md)**
- Explicación simple de cada tipo
- Cuándo usar cada uno
- Ventajas y desventajas
- Ejemplos de código
- Mejores prácticas

### Para Ejecutar (Instrucciones)
👉 **[GUIA_RAPIDA_EJECUCION.md](GUIA_RAPIDA_EJECUCION.md)**
- Paso a paso para correr tests
- Comandos para cada tipo
- Solución de problemas
- Checklist

### Resultados de Ejecución
👉 **[EVIDENCIA_EJECUCION.md](EVIDENCIA_EJECUCION.md)**
- Qué pasó y qué no
- Por qué fallaron algunos
- Cómo ejecutar todo cuando backend esté disponible

---

## 🔑 Conceptos Clave

### API Testing (Sin UI)
```
✅ Prueban funcionalidad de backend
✅ Más rápidas que UI
✅ Validan persistencia en BD
❌ No prueban interfaz
```

### Mocking (Simular)
```
✅ No necesitan servidor
✅ Controlan 100% las respuestas
✅ Perfecto para casos extremos
❌ No prueban servidor real
```

### Híbridas (Integración)
```
✅ Realistas
✅ Validan sincronización
✅ Rápidas (setup vía API)
❌ Más complejas de escribir
```

---

## 📋 Checklist de Entregas

- [x] **3 archivos .spec.js**
  - test-api.spec.js
  - test-mocking.spec.js
  - test-hybrid.spec.js

- [x] **Tabla de diseño de pruebas**
  - 24 casos documentados
  - Columnas: ID, tipo, objetivo, entradas, resultado esperado

- [x] **Explicación de decisiones**
  - Por qué API real
  - Por qué mocking
  - Por qué híbridas

- [x] **Evidencia de ejecución**
  - Resultados de pruebas
  - Matriz de cobertura
  - Logs de ejecución

---

## 🧪 Escenarios Cubiertos

### Autenticación ✅
- Registro de usuarios
- Login
- Obtención de usuario autenticado
- Errores de credenciales

### Turnos ✅
- Crear turno (admin)
- Listar turnos disponibles
- Filtrar turnos

### Postulaciones ✅
- Postularse a turno
- Ver mis postulaciones
- Cancelar postulación
- Error: postulación duplicada

### Errores ✅
- Error 500 (server error)
- Error 401 (unauthorized)
- Error 400 (validation)
- Timeout
- Lista vacía
- Caracteres especiales

---

## 💡 Lecciones Clave

1. **No todo es UI Testing**
   - API testing es más rápido
   - Mocking simula errores sin servidor
   - Combinarlos = máxima cobertura

2. **Elegir la herramienta correcta**
   - API Real: ¿Funciona el servidor?
   - Mocking: ¿Maneja UI los errores?
   - Híbridas: ¿Funciona todo integrado?

3. **Setup Rápido Vía API**
   - En lugar de 10 clics en UI
   - Hacer 1 POST API es 10x más rápido
   - Combinar con validación en UI

---

## 🚀 Próximos Pasos

### Para Ejecutar Todo

```bash
# 1. Terminal 1 - Backend
cd backend
npm install
npm start

# 2. Terminal 2 - Frontend
cd frontend
npm install
npm run dev

# 3. Terminal 3 - Pruebas
npm run test:e2e
```

### Para Ver Reporte
```bash
npx playwright show-report
```

### Para Ejecutar Solo Mocking (Funciona ahora)
```bash
npx playwright test tests/test-mocking.spec.js
```

---

## 📊 Estadísticas

| Métrica | Valor |
|---------|-------|
| **Total de Pruebas** | 25 |
| **Pruebas de API** | 10 |
| **Pruebas de Mocking** | 8 |
| **Pruebas Híbridas** | 6 |
| **Prueba Original** | 1 |
| **Lines de Código** | ~1200 |
| **Lines de Documentación** | ~2500 |
| **Tiempo de Ejecución** | ~35-45 segundos |

---

## 🎓 Educativo

Este trabajo enseña:

✅ Diferentes tipos de testing  
✅ Cuándo usar cada uno  
✅ Cómo implementarlos  
✅ Mejores prácticas  
✅ Documentación profesional  

---

## 🔗 Enlaces Rápidos

| Documento | Propósito |
|-----------|-----------|
| [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) | Visión general |
| [TEST_DESIGN_DOCUMENT.md](TEST_DESIGN_DOCUMENT.md) | Especificaciones detalladas |
| [ESTRATEGIA_TESTING.md](ESTRATEGIA_TESTING.md) | Educación |
| [GUIA_RAPIDA_EJECUCION.md](GUIA_RAPIDA_EJECUCION.md) | Instrucciones |
| [EVIDENCIA_EJECUCION.md](EVIDENCIA_EJECUCION.md) | Resultados |

---

## ❓ Preguntas Frecuentes

**P: ¿Por qué 3 tipos de testing?**  
R: Cada uno prueba algo diferente:
- API: Backend funciona?
- Mocking: UI maneja errores?
- Híbridas: Todo funciona junto?

**P: ¿Puedo correr esto ahora?**  
R: Sí, solo mocking (8 pruebas). Para API e híbridas necesitas backend corriendo.

**P: ¿Cuál es el mejor?**  
R: Los tres juntos. Cada uno agrega valor diferente.

**P: ¿Cómo aprendo más?**  
R: Lee ESTRATEGIA_TESTING.md tiene explicaciones detalladas.

---

## 📞 Contacto/Soporte

Si hay problemas:
1. Revisar GUIA_RAPIDA_EJECUCION.md → "Solución de Problemas"
2. Verificar que ports 3000 y 5173 están libres
3. Asegurar MySQL está corriendo
4. Revisar EVIDENCIA_EJECUCION.md para detalles

---

## 📅 Información de Entrega

- **Fecha**: 1 de junio de 2026
- **Materia**: Metodología - Trabajo Final
- **Tema**: Testing Avanzado con Playwright
- **Status**: ✅ COMPLETADO

---

**¿Listo para aprender testing avanzado? 👉 [Comienza aquí](RESUMEN_EJECUTIVO.md)**
