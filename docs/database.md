# Base De Datos

La base de datos inicial usa PostgreSQL y Prisma. Los identificadores principales son UUID y las fechas se almacenan como `TIMESTAMPTZ`.

Modelos iniciales:

- `User`
- `Role`
- `Permission`
- `RolePermission`
- `RefreshToken`
- `WorkshopSetting`
- `AuditLog`

Los modelos principales incluyen `createdAt`, `updatedAt` y `deletedAt` cuando corresponde. La eliminación de usuarios es lógica; no se realiza eliminación física.

## Migraciones

```bash
cd backend
npm run prisma:migrate
```

## Seed

```bash
cd backend
npm run prisma:seed
```

El seed crea roles, permisos, configuración inicial y un administrador de desarrollo:

- `admin@milmecanic.local`
- `Admin123*`

Debe cambiarse antes de producción.
