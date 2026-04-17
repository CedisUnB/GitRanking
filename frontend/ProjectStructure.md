# GitRank – Frontend

Next.js 14 app with GitHub App authentication and repository-scoped team features.

## Project Structure

### `app/`
Next.js App Router pages and API routes.

#### Pages

- `app/login/` — sign-in page
- `app/repositories/` — repository selection page (with layout wrapper)
- `app/repository/[owner]/[repo]/` — per-repository section with sidebar layout
  - `overview/` — repository overview page
  - `profile/` — contributor profile page
  - `metrics/` — sprint metrics page; currently contains the Oracle card (velocity-based sprint prediction)
- `app/auth/error/` — OAuth error page

#### API Routes

- `app/api/auth/` — NextAuth.js handler
- `app/api/github/repositories/` — list repositories accessible to the authenticated user
- `app/api/github/repositories/[owner]/[repo]/issues/assigned-open/` — open issues assigned to the current user
- `app/api/github/repositories/[owner]/[repo]/members/` — repository member list
- `app/api/github/repositories/[owner]/[repo]/milestone-current/issues/` — issues in the current milestone
- `app/api/github/[owner]/[repo]/commits/` — repository commit history
- `app/api/github/issues/` — general issues proxy
- `app/api/webhook/` — GitHub webhook receiver

### `components/`
React components grouped by concern.

- `components/layout/Sidebar.tsx` — collapsible sidebar with repository navigation; accepts `overviewHref`, `profileHref`, and `metricsHref` props
- `components/layout/RepositoryHeader.tsx` — top header for repository pages
- `components/ui/Buttons/GitHubSignInButton.tsx` — GitHub OAuth sign-in button
- `components/ui/Buttons/SignOutButton.tsx` — sign-out button
- `components/repository/` — repository selection form
- `components/metrics/OracleCard.tsx` — Oracle metric card; displays sprint velocity prediction with early/on-track/at-risk states
- `components/providers.tsx` — session provider wrapper

### `lib/`
Server-side logic and utilities.

- `lib/auth.ts` — NextAuth config; upserts User on login
- `lib/prisma.ts` — Prisma client singleton
- `lib/github-app.ts` — GitHub App JWT, installation token, repo listing
- `lib/github-client.ts` — GitHub REST API client wrapper (members, issues, milestones, commits); includes `getMilestoneVelocityData` for sprint velocity computation
- `lib/repository.ts` — upserts Repository row on page visit
- `lib/webhooks/` — webhook event handlers (push, issues, pull requests)

### `prisma/`
Database schema and migrations (PostgreSQL via Supabase).

- `prisma/schema.prisma` — data models
- `prisma/migrations/` — migration history

### `types/`
TypeScript type definitions.

- `types/next-auth.d.ts` — extends Session and JWT with GitHub fields
- `types/github.ts` — GitHub API response types; `MilestoneDto` includes `createdAt` for velocity calculations

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
