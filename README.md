# WorkFlow Pro Backend

NestJS + TypeScript backend for the WorkFlow Pro platform.

This API covers:
- Authentication and role-based access control (`ADMIN`, `MANAGER`, `EMPLOYEE`)
- Users and profiles
- Tasks and task comments
- HR (attendance and leave requests)
- Financial records and summaries
- Reports and AI insights

## Requirements

- Node.js 18+
- PostgreSQL

## Quick start

Install dependencies:

```bash
npm install
```

Copy environment variables:

```bash
copy .env.example .env
```

Then update `.env` values for your environment.

## Environment variables

Main variables used by the app:
- `PORT` (default: `3000`)
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET` (required for auth)
- `JWT_EXPIRES_IN` (optional, default `1d`)
- `OPENAI_API_KEY` (required only for AI endpoints)
- `OPENAI_MODEL` (optional, default `gpt-4o-mini`)

## Database (Prisma)

Generate Prisma client:

```bash
npm run prisma:generate
```

Push schema to database (first local run):

```bash
npx prisma db push
```

Seed sample data:

```bash
npm run prisma:seed
```

Local seeded users (for frontend testing):
- `admin@workflowpro.com` / `Password123!`
- `manager@workflowpro.com` / `Password123!`
- `employee@workflowpro.com` / `Password123!`

## Run in development

```bash
npm run start:dev
```

Base URL:
- `http://localhost:3000/api`

Swagger (API docs):
- `http://localhost:3000/api`

Health check:
- `http://localhost:3000/api/health`

## Frontend integration notes

1. Login using `POST /api/auth/login` with `email` and `password`.
2. Save `accessToken` from the response.
3. Send token in headers:
   - `Authorization: Bearer <accessToken>`
4. Use Swagger to explore request/response shapes and role permissions per endpoint.

Main endpoint groups:
- `/api/auth`
- `/api/users`
- `/api/tasks`
- `/api/hr/attendance`
- `/api/hr/leaves`
- `/api/financial`
- `/api/reports`
- `/api/ai`
