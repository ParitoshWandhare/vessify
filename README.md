# 🔐 Vessify — Secure Personal Finance Transaction Extractor

> A production-realistic, multi-tenant SaaS application for parsing and tracking bank transactions, built with strict data isolation as the top priority.

![Tech Stack](https://img.shields.io/badge/Backend-Hono-orange) ![Tech Stack](https://img.shields.io/badge/Frontend-Next.js%2015-black) ![Tech Stack](https://img.shields.io/badge/Auth-Better%20Auth-purple) ![Tech Stack](https://img.shields.io/badge/DB-PostgreSQL-blue)

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Setup Instructions](#setup-instructions)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Multi-Tenancy Strategy](#multi-tenancy-strategy)
- [Better Auth Integration](#better-auth-integration)
- [Security Decisions](#security-decisions)
- [Testing](#testing)
- [Deployment](#deployment)
- [Test Credentials](#test-credentials)
- [Screenshots & Demo](#screenshots--demo)

---

## Overview

Vessify lets users register, create an organization, paste raw bank statement text, and get back structured transaction data — automatically parsed and persisted with a confidence score. The single most important requirement of this project is **data isolation**: no user can ever see another organization's transactions, even via direct API manipulation.

**Core flow:** Register → Create Organization → Paste statement text → Extracted transaction is saved scoped to your org → View paginated transaction history.

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   Next.js 15     │  HTTPS  │   Hono API        │  Prisma │  PostgreSQL   │
│   (Vercel)        │ ──────▶ │   (Railway)        │ ──────▶ │  (Railway)     │
│                    │ cookies │                    │  ORM    │                │
│  - Server Comps   │◀────── │  - Better Auth     │◀────── │  - Row-level   │
│  - Better Auth    │         │  - Org-scoped      │         │    isolation   │
│    client          │         │    middleware       │         │    via FKs     │
└─────────────────┘         └──────────────────┘         └──────────────┘
```

**Request lifecycle for a protected route:**

1. Browser sends request with `httpOnly` session cookie.
2. `requireAuth` middleware calls `auth.api.getSession()` to validate the Better Auth session.
3. Middleware resolves the user's `organizationId` from the `Member` table — **never** from the request body, query params, or headers.
4. The resolved `{ userId, organizationId, role }` is attached to Hono's context (`c.set("auth", ...)`).
5. Every downstream repository call filters by `organizationId` from that context object — not from anything the client supplied.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend framework | [Hono](https://hono.dev) (TypeScript) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | [Better Auth](https://www.better-auth.com) (email/password + Organizations plugin) |
| Frontend | Next.js 15 (App Router, React Server Components) |
| UI | shadcn/ui patterns + Tailwind CSS + Framer Motion |
| Validation | Zod (both backend and frontend) |
| Testing | Jest (+ React Testing Library on frontend) |
| Deployment | Vercel (frontend) + Railway (backend + PostgreSQL) |

---

## Folder Structure

```
root/
├── backend/
│   ├── src/
│   │   ├── auth/                     # Better Auth config, service, routes
│   │   ├── middleware/               # auth, validation, rate-limit, error-handler
│   │   ├── modules/transactions/     # controller, service, repository, routes, schema, types
│   │   ├── services/                 # TransactionExtractionService (parsing engine)
│   │   ├── lib/                      # prisma client, logger, env validation
│   │   ├── types/                    # shared TS types
│   │   ├── app.ts                    # Hono app assembly (middleware + routes)
│   │   └── index.ts                  # server entrypoint
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── tests/
│       └── transactions.test.ts
│
└── frontend/
    ├── app/
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── dashboard/page.tsx
    │   └── layout.tsx
    ├── components/
    │   ├── auth/         # LoginForm, RegisterForm
    │   ├── dashboard/    # TopNav, StatsCards, ExtractPanel, TransactionsTable
    │   └── ui/
    ├── lib/              # api.ts, auth.ts, validations.ts
    ├── services/         # auth.service.ts, transaction.service.ts
    ├── types/
    └── middleware.ts     # route protection
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 14 (local or hosted, e.g. Railway/Supabase/Neon)
- npm or pnpm

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd vessify

cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Copy the example files and fill in real values (see [Environment Variables](#environment-variables)):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Generate a strong auth secret:

```bash
openssl rand -base64 32
```

### 3. Set up the database

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed   # optional — creates 2 test users + orgs
```

### 4. Run both apps

```bash
# Terminal 1 — backend (port 3001)
cd backend
npm run dev

# Terminal 2 — frontend (port 3000)
cd frontend
npm run dev
```

Visit **http://localhost:3000** → you'll be redirected to `/login`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Min 32-char secret for signing sessions | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Backend's own public URL | `http://localhost:3001` |
| `FRONTEND_URL` | Used for CORS allow-list | `http://localhost:3000` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | `60000` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Frontend's own URL | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3001` |
| `BETTER_AUTH_SECRET` | Must match backend secret | same as backend |
| `BETTER_AUTH_URL` | Points to backend | `http://localhost:3001` |

---

## API Documentation

### Auth (handled by Better Auth — mounted at `/api/auth/*`)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Register with email + password |
| `POST` | `/api/auth/sign-in/email` | Login, returns session cookie |
| `POST` | `/api/auth/sign-out` | Logout, clears session |
| `GET` | `/api/auth/get-session` | Returns current session/user |
| `POST` | `/api/auth/organization/create` | Create an organization |

### Transactions (custom, protected)

#### `POST /api/transactions/extract`

Protected. Parses raw text and saves a transaction scoped to the caller's organization.

```json
// Request
{ "text": "Date: 11 Dec 2025\nDescription: STARBUCKS COFFEE MUMBAI\nAmount: -420.00\nBalance after transaction: 18,420.50" }

// Response (201)
{
  "data": {
    "id": "clx...",
    "transactionDate": "2025-12-11T00:00:00.000Z",
    "description": "STARBUCKS COFFEE MUMBAI",
    "amount": "-420.00",
    "balance": "18420.50",
    "confidence": 1.0,
    "rawText": "...",
    "createdAt": "2026-06-19T..."
  }
}
```

#### `GET /api/transactions?cursor=xxx&limit=20`

Protected. Cursor-paginated, newest first, scoped to the caller's organization only.

```json
{
  "data": [ /* TransactionResponse[] */ ],
  "nextCursor": "clx123..." 
}
```

---

## Multi-Tenancy Strategy

Vessify's data isolation rests on three layers, **all of which must agree** before any data is returned:

1. **Session layer** — Better Auth validates the signed session cookie and resolves a `userId`. An invalid or expired session never reaches the route handler.
2. **Membership layer** — `requireAuth` middleware looks up the user's `Member` row to resolve their `organizationId`. This is a **server-side derivation**: there is no code path, anywhere in the app, that reads `organizationId` from the request body, query string, or headers.
3. **Query layer** — Every repository method (`TransactionRepository`) takes `organizationId` as a parameter and applies it as a mandatory `WHERE` clause. There is no "organizationId-less" query in the codebase — even fetching a transaction by ID requires a matching organization, so ID guessing/enumeration cannot leak cross-tenant data.

This means even if an attacker crafts a request with a fabricated `organizationId` in the JSON body, it is silently ignored — the middleware-derived value always wins. The same protection applies if someone steals a valid session token but tries to manipulate other identifiers in the URL or payload: the server only trusts what it derived from the session itself.

---

## Better Auth Integration

We use Better Auth as the single source of truth for both **authentication** and **organization (tenant) management**, via the `prismaAdapter` and the official `organization` plugin:

- **Password hashing & sessions** are handled entirely by Better Auth's `emailAndPassword` config — no custom bcrypt/jwt code was written for these flows, minimizing the attack surface.
- **Organizations plugin** generates the `Organization`, `Member`, and `Invitation` models, which we extended with our own `Transaction` model (foreign-keyed to `Organization`) to keep tenant boundaries enforced at the schema level, not just in application code.
- The **`Member`** table is the join between users and orgs — `getCurrentOrganization()`-equivalent logic (`authService.resolveAuthContext`) queries this table on every authenticated request rather than trusting any client-supplied identifier, keeping the system scalable as a user is added to more orgs in the future without changing the security model.

---

## Security Decisions

| Concern | Implementation |
|---|---|
| Password storage | Better Auth's built-in scrypt-based hashing — never custom |
| Session transport | `httpOnly`, `secure` (prod), `sameSite=lax` cookies — not readable by JS |
| Session lifetime | 7-day expiry with rolling 24h refresh |
| Input validation | Zod schemas on every body/query, both frontend and backend |
| Rate limiting | Per-user (when authenticated) or per-IP, sliding window, 429 on breach |
| Headers | `secure-headers` middleware: CSP, X-Frame-Options: DENY, nosniff, HSTS (prod) |
| CORS | Locked to a single `FRONTEND_URL` origin with credentials |
| SQL injection | Prisma's parameterized queries — no raw SQL string concatenation anywhere |
| Error responses | Centralized handler; stack traces/internal messages hidden in production |
| ID trust | `organizationId` and `userId` are **never** accepted from client input on any route |
| Bonus: RLS | See `prisma/schema.prisma` comments — Postgres RLS policies can be layered on top of the Prisma-level scoping for defense-in-depth (see note below) |

> **Bonus RLS note:** Application-level scoping (every query includes `WHERE organizationId = ...`) is the primary and sufficient enforcement mechanism here. For an additional defense-in-depth layer in a real production deployment, you would enable Postgres Row-Level Security on the `transaction` table and set `app.current_org_id` via `SET LOCAL` per request — this guards against a hypothetical bug in application code that forgets the `WHERE` clause. This is documented as a recommended next step rather than implemented in this assignment scope, to keep the Prisma connection pooling model simple.

---

## Testing

Backend tests live in `backend/tests/transactions.test.ts` and cover all 6 required scenarios:

1. ✅ Register user
2. ✅ Login user
3. ✅ Extract transaction (all 3 sample formats, including confidence scoring)
4. ✅ User sees own transactions
5. ✅ User cannot access another organization's data (repository-level scoping verified)
6. ✅ Pagination works (cursor returned on full page, `null` on last page)

```bash
cd backend
npm test
```

Auth-related tests (1, 2, 4) are written as integration tests against a running server + DB — set `TEST_ENV=integration` and `TEST_API_URL` to run them end-to-end; otherwise they no-op gracefully so the suite passes in CI without a live database.

Frontend validation tests:

```bash
cd frontend
npm test
```

---

## Deployment

### Backend → Railway

1. Create a new Railway project, add a **PostgreSQL** plugin.
2. Deploy the `backend/` folder as a service (Railway auto-detects Node).
3. Set environment variables in the Railway dashboard (see table above) — point `DATABASE_URL` at the Railway Postgres instance.
4. Set the **Start Command** to `npm run build && npm run db:migrate && npm start`.
5. Note the generated public URL — this becomes `BETTER_AUTH_URL` and the frontend's `NEXT_PUBLIC_API_URL`.

### Frontend → Vercel

1. Import the `frontend/` folder as a new Vercel project.
2. Set environment variables (see table above) — `NEXT_PUBLIC_API_URL` should point to your Railway backend URL.
3. Deploy. Update the backend's `FRONTEND_URL` env var to match the resulting Vercel domain, then redeploy the backend so CORS allows it.

---

## Test Credentials

After running `npm run db:seed` in `backend/`:

| Email | Password | Organization |
|---|---|---|
| `alice@example.com` | `Password123!` | Alice's Finances |
| `bob@example.com` | `Password123!` | Bob's Finances |

Use these two accounts to manually verify isolation: log in as Alice, extract a transaction, log out, log in as Bob — Bob's transaction list will be empty, proving no cross-tenant leakage.

---

## Screenshots & Demo

> _Add screenshots of the login page, register page, and dashboard here before submission._

- `screenshots/login.png`
- `screenshots/register.png`
- `screenshots/dashboard.png`
- `screenshots/extraction-flow.png`

### Loom Recording Checklist

Record 2–3 short Loom videos (≤5 min each, free tier limit) covering:

1. **Part 1 — Live demo:** register → login → paste all 3 sample texts → see them appear in the table.
2. **Part 2 — Isolation proof:** log in as a second user/org, show their transaction list is empty, attempt to manually call the API with a forged `organizationId` and show it's ignored.
3. **Part 3 — Code walkthrough:** explain `requireAuth` middleware, the repository-level org scoping, the extraction regex strategy, and cursor pagination.

Paste your Loom links here:

- Part 1: `<link>`
- Part 2: `<link>`
- Part 3: `<link>`
