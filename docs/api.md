# API

La API expone respuestas uniformes:

```json
{
  "success": true,
  "message": "Operación realizada correctamente",
  "data": {},
  "timestamp": "2026-07-17T20:00:00.000Z"
}
```

Errores:

```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [],
  "path": "/api/v1/recurso",
  "timestamp": "2026-07-17T20:00:00.000Z"
}
```

## Rutas Iniciales

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `GET /api/v1/users/:id`
- `POST /api/v1/users`
- `PATCH /api/v1/users/:id`
- `PATCH /api/v1/users/:id/status`
- `PATCH /api/v1/users/:id/password`
- `GET /api/v1/roles`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`
- `GET /api/v1/audit`
- `GET /api/v1/health`

Swagger está disponible en `/api/docs`.
