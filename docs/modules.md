# Módulos

## Auth

Implementa login, access token, refresh token, logout, rotación de refresh tokens y consulta del usuario autenticado.

## Users

Permite listar, consultar, crear, actualizar, activar/desactivar y cambiar contraseña.

## Roles Y Permissions

Roles iniciales:

- Administrador
- Asesor de servicio
- Mecánico
- Bodega
- Caja

Permisos iniciales:

- `users.read`
- `users.create`
- `users.update`
- `users.change-status`
- `users.change-password`
- `roles.read`
- `settings.read`
- `settings.update`
- `audit.read`

## Settings

Almacena configuración general del taller: nombre comercial, razón social, identificación tributaria, contacto, moneda, zona horaria y prefijos documentales.

## Audit

Registra acciones relevantes como login, logout, creación, actualización, cambio de estado y cambio de contraseña.

## Crear Nuevos Módulos

Crear la carpeta bajo `backend/src/modules/<module>` y separar:

- `controllers`
- `dto`
- `repositories`
- `services`
- `<module>.module.ts`

En frontend, crear `frontend/src/features/<feature>` con `api`, `pages`, `schemas`, `types` y componentes propios si aplica.
