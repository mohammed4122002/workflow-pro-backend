# WorkFlow Pro Backend

NestJS + TypeScript backend for the WorkFlow Pro project.

## Requirements

- Node.js 18+
- PostgreSQL (for Stage 2)

## Setup

```bash
npm install
```

Copy environment variables:

```bash
copy .env.example .env
```

Update values in `.env` as needed.

## Prisma (later)

Prisma schema, migrations, and seed will be added in Stage 2.

## Run (dev)

```bash
npm run start:dev
```

Swagger:

- `http://localhost:3000/api/docs`

Health check:

- `http://localhost:3000/api/health`
