# GitRank – Frontend

Next.js 14 app with GitHub App authentication and repository-scoped team features.

## Project Structure

### `app/`
Next.js App Router pages and API routes.

- `app/login/` — sign-in page
- `app/repositories/` — repository selection page
- `app/repository/[owner]/[repo]/profile/` — per-repository profile page
- `app/auth/error/` — OAuth error page
- `app/api/auth/` — NextAuth.js handler
- `app/api/github/` — GitHub API proxy routes (installation repos, issues, commits)
- `app/api/webhook/` — GitHub webhook receiver

### `components/`
React components grouped by concern.

- `components/ui/Buttons/` — generic UI buttons (sign in, sign out)
- `components/repository/` — repository selection form
- `components/providers.tsx` — session provider wrapper

### `lib/`
Server-side logic and utilities.

- `lib/auth.ts` — NextAuth config; upserts User on login
- `lib/prisma.ts` — Prisma client singleton
- `lib/github-app.ts` — GitHub App JWT, installation token, repo listing
- `lib/repository.ts` — upserts Repository row on page visit
- `lib/webhooks/` — webhook event handlers (push, issues)

### `prisma/`
Database schema and migrations (PostgreSQL via Supabase).

- `prisma/schema.prisma` — data models
- `prisma/migrations/` — migration history

### `types/`
TypeScript module augmentations.

- `types/next-auth.d.ts` — extends Session and JWT with GitHub fields

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GITHUB_ID` | GitHub App client ID |
| `GITHUB_SECRET` | GitHub App client secret |
| `GITHUB_APP_ID` | Numeric GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Base64-encoded PEM private key — `base64 -i key.pem \| tr -d '\n'` |
| `GITHUB_APP_INSTALLATION_URL` | URL to install the GitHub App on repos |

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```
