# MilMecanic ERP

Base arquitectónica para un ERP de administración de talleres mecánicos y automotrices.

## Requisitos

- Node.js 22 o superior
- Docker y Docker Compose
- PostgreSQL 16, provisto por `docker-compose.yml`

## Inicio rápido

```bash
docker compose up -d

cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

En otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Credenciales de desarrollo:

- Correo: `admin@milmecanic.local`
- Contraseña temporal: `Admin123*`

Estas credenciales son solo para desarrollo y deben cambiarse antes de cualquier entorno productivo.

## URLs

- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/docs`
- Frontend: `http://localhost:5173`

## Comandos principales

Backend:

```bash
npm run build
npm run test
npm run lint
npm run prisma:migrate
npm run prisma:seed
```

Frontend:

```bash
npm run build
npm run test
npm run lint
```

## Documentación

Consulta `docs/` para arquitectura, base de datos, API, módulos y flujo de desarrollo.
