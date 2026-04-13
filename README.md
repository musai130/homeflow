# Next.js + NestJS Starter

Monorepo-style starter with:

- `frontend` - Next.js (App Router, TypeScript, Tailwind)
- `backend` - NestJS (TypeScript)

## Quick Start

From repository root:

```bash
npm run dev
```

This starts both apps in parallel:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001 (default Nest port is 3000; change one side if needed)

## Useful Scripts

```bash
npm run dev            # frontend + backend together
npm run dev:frontend   # only Next.js
npm run dev:backend    # only NestJS
npm run build          # build frontend and backend
npm run start          # start production mode for both
npm run install:all    # install deps in frontend and backend
npm run docker:dev:up  # docker dev stack (frontend + backend + postgres)
npm run docker:dev:down
npm run docker:prod:up # docker prod stack (detached)
npm run docker:prod:down
```

## Docker

Development stack:

```bash
npm run docker:dev:up
```

Production-like stack:

```bash
npm run docker:prod:up
```

Services and ports:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

PostgreSQL credentials in both compose files:

- Database: app
- User: postgres
- Password: postgres

Backend receives DB and JWT settings via environment variables:

```text
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=app
DB_SYNC=true
JWT_SECRET=dev_secret_change_me
```

## Auth API

Base URL: `http://localhost:3001`

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me` (Bearer token required)

Register body:

```json
{
	"email": "user@example.com",
	"password": "password123"
}
```

Login response includes `accessToken`.

Use token for identification endpoint:

```http
Authorization: Bearer <accessToken>
```

## Notes

- Next.js dev server uses port `3000` by default.
- NestJS also uses port `3000` by default.
- To avoid port conflict, update backend port in `backend/src/main.ts` to `3001`.
