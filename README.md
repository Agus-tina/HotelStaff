# HotelStaff

Sistema de gestión de turnos y personal para hoteles. Reemplaza la coordinación informal por WhatsApp con una plataforma centralizada, trazable y con notificaciones automáticas.

🔗 **Demo en vivo:** [hotel-staff-aguz.vercel.app](https://hotel-staff-aguz.vercel.app)
📦 **Repositorio:** [github.com/Agus-tina/HotelStaff](https://github.com/Agus-tina/HotelStaff)

---

## Descripción

HotelStaff centraliza la gestión de turnos del personal de mozos en hoteles. Los supervisores (Admin) crean turnos, gestionan postulaciones y asignan personal; los mozos (Empleado) visualizan turnos disponibles, se postulan y reciben confirmaciones automáticas por email y en su Google Calendar.

## Integrantes

- Ismael Paez — Líder de Proyecto / Full Stack
- Alejo Vilches — Frontend Developer
- Agustina Zartmann — Backend Developer

## Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite, Tailwind CSS, Socket.IO (cliente) |
| Backend | Node.js, Express, TypeScript, Socket.IO (servidor) |
| Base de datos | PostgreSQL + Prisma ORM |
| Autenticación | JWT + bcryptjs |
| Validaciones | Zod |
| APIs externas | Resend (emails), Google Calendar API (OAuth2) |
| Despliegue | Docker, Vercel |

## Requisitos previos

- Node.js v18 o superior
- PostgreSQL 14 o superior (o Docker)
- npm o yarn

## Instalación

```bash
git clone https://github.com/Agus-tina/HotelStaff.git
cd HotelStaff
```

Configurar variables de entorno:

```bash
cp .env.example .env
```

Backend:

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
```

Frontend:

```bash
cd ../frontend
npm install
```

## Ejecución

```bash
# Backend (desde /backend)
npm run dev

# Frontend (desde /frontend)
npm run dev   # http://localhost:5173

# Con Docker (desde la raíz)
docker-compose up --build
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT |
| `RESEND_API_KEY` | API Key de Resend para emails de notificación |
| `GOOGLE_CLIENT_ID` | Client ID de Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Client Secret de Google Cloud Console |
| `GOOGLE_REDIRECT_URI` | URI de callback para OAuth2 |
| `FRONTEND_URL` | URL base del frontend |
| `PORT` | Puerto del servidor Express (default: 3000) |

Ver `.env.example` para la referencia completa.

## Credenciales de prueba

| Rol | Email | Contraseña |
|---|---|---|
| Admin | admin@hotel.com | AdminPass456 |
| Mozo | mozo@hotel.com | MozoPass123 |


## Funcionalidades principales

- Autenticación con JWT y control de acceso por rol (Admin / Mozo)
- CRUD completo de turnos con validaciones y eliminación en cascada
- Actualizaciones en tiempo real vía Socket.IO
- Sistema de postulaciones y asignación de personal
- Notificaciones automáticas por email al asignar un turno (Resend)
- Integración con Google Calendar (OAuth2) para crear eventos en el calendario del empleado

## Documentación adicional

La documentación técnica completa, la guía de usuario y el reporte de pruebas de regresión se encuentran en la carpeta [`/docs`](./docs) y en la Carpeta de Proyecto entregada para la cátedra.

## Materia

Metodología y Testing — Dr. Ing. Miguel Mendez-Garabetti
Instituto Tecnológico Universitario — Universidad Nacional de Cuyo — 2026
