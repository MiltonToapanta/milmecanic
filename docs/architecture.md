# Arquitectura

MilMecanic ERP se divide en dos proyectos independientes:

- `backend`: API NestJS modular, Prisma ORM y PostgreSQL.
- `frontend`: aplicación React con Vite, React Router, React Query y Zustand.

La primera etapa es monotaler. No incluye SaaS, multiempresa, suscripciones ni límites por planes.

## Backend

El backend usa módulos NestJS por dominio. Cada módulo separa controladores, servicios, repositorios y DTO. Los controladores reciben HTTP y delegan la lógica de negocio en servicios. Los repositorios encapsulan acceso a Prisma.

Capas transversales:

- Prefijo global `/api/v1`.
- `ValidationPipe` global con whitelist y transformación.
- Filtro global de excepciones.
- Interceptor global de respuestas.
- Helmet, CORS configurable y throttling.
- Swagger en `/api/docs`.

## Frontend

El frontend se organiza por funcionalidades bajo `src/features`. Las piezas compartidas viven en `src/components`, `src/services`, `src/lib` y `src/types`.

Incluye layout administrativo con sidebar, header, breadcrumbs, tema claro/oscuro, rutas protegidas y guardias por permisos.
