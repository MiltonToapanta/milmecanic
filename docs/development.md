# Desarrollo

## Instalar

```bash
docker compose up -d

cd backend
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed
npm run start:dev
```

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Pruebas

Backend:

```bash
cd backend
npm run test
npm run build
```

Frontend:

```bash
cd frontend
npm run test
npm run build
```

## Convenciones

- Código en inglés.
- Interfaz en español.
- TypeScript estricto.
- DTO para entradas HTTP.
- Servicios para negocio.
- Repositorios para acceso a datos.
- No exponer contraseñas, hashes ni refresh tokens almacenados.
- No agregar clientes, vehículos, órdenes, inventario ni facturación en esta etapa.
