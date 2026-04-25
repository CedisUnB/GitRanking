# GitRank – Frontend

Next.js 14 app with GitHub App authentication and repository-scoped team features. Focused on organisation-owned repositories — the GitHub App must be installed on the organisation and have **Organisation permissions → Projects: Read** granted.

## Project Structure

### `app/`
Next.js App Router pages and API routes.

#### Pages

- `app/login/` — sign-in page
- `app/repositories/` — repository selection page (with layout wrapper)
- `app/repository/[owner]/[repo]/` — per-repository section; uses a fixed-height (`h-screen`) layout with a sticky sidebar and independently scrolling content area
  - `overview/` — repository overview page
  - `profile/` — contributor profile page
  - `metrics/` — sprint metrics page; contains four cards: Oracle (velocity prediction), Work in Progress (donut chart), Story Points (bar chart across last 5 sprints), and Sprint Tasks Completed (bar chart across last 5 sprints)
- `app/auth/error/` — OAuth error page

#### API Routes

- `app/api/auth/` — NextAuth.js handler
- `app/api/github/repositories/` — list repositories accessible to the authenticated user (across all orgs the user belongs to + personal account)
- `app/api/github/repositories/[owner]/[repo]/issues/assigned-open/` — open issues assigned to the current user
- `app/api/github/repositories/[owner]/[repo]/members/` — repository member list
- `app/api/github/repositories/[owner]/[repo]/milestone-current/issues/` — issues in the current milestone
- `app/api/github/[owner]/[repo]/commits/` — repository commit history
- `app/api/github/issues/` — general issues proxy
- `app/api/webhook/` — GitHub webhook receiver

### `components/`
React components grouped by concern.

- `components/layout/Sidebar.tsx` — fixed sidebar with repository navigation; accepts `overviewHref`, `profileHref`, and `metricsHref` props
- `components/layout/RepositoryHeader.tsx` — top header for repository pages
- `components/ui/Buttons/GitHubSignInButton.tsx` — GitHub OAuth sign-in button
- `components/ui/Buttons/SignOutButton.tsx` — sign-out button
- `components/repository/` — repository selection form
- `components/metrics/OracleCard.tsx` — Oracle metric card; displays sprint velocity prediction with early/on-track/at-risk states
- `components/metrics/WorkInProgressCard.tsx` — WIP donut chart (recharts); categorises current-sprint issues into TO-DO / DOING / REVIEW / DONE using the GitHub Projects v2 **Status** field via the organisation installation token
- `components/metrics/StoryPointsCard.tsx` — Grouped bar chart (recharts); completed vs planned story points across the last 5 sprints; points sourced from the GitHub Projects v2 **Estimate** field
- `components/metrics/SprintTasksCard.tsx` — Grouped bar chart (recharts); completed vs planned tasks across the last 5 sprints; shows % change vs previous sprint
- `components/providers.tsx` — session provider wrapper

### `lib/`
Server-side logic and utilities.

- `lib/auth.ts` — NextAuth config with GitHub App OAuth provider (`read:user user:email` scope); upserts User on login
- `lib/prisma.ts` — Prisma client singleton
- `lib/github-app.ts` — GitHub App helpers: App JWT creation, installation token exchange (`getInstallationToken`), repo listing (`getInstallationRepos`), direct owner→installation lookup via App JWT (`getInstallationIdForOwner`), and user-scoped installation discovery across orgs + personal account (`getInstallationIdsForUser`)
- `lib/github-client.ts` — GitHub REST + GraphQL API client; key exports: `getAccessibleRepositories` (repos across all user-relevant installations), `getMilestoneVelocityData` (sprint velocity), `getWorkInProgressData` (Projects v2 Status-field WIP categorisation for the current sprint), `getSprintHistoryData` (last-N-milestones task and story-point aggregation via Projects v2 Estimate field); all repo-scoped functions resolve the installation token via `getInstallationIdForOwner`
- `lib/repository.ts` — upserts Repository row on page visit
- `lib/webhooks/` — webhook event handlers (push, issues, pull requests)

### `prisma/`
Database schema and migrations (PostgreSQL via Supabase).

- `prisma/schema.prisma` — data models
- `prisma/migrations/` — migration history

### `types/`
TypeScript type definitions.

- `types/next-auth.d.ts` — extends Session and JWT with GitHub fields (`accessToken`, `username`, `githubId`)
- `types/github.ts` — GitHub API response types; `MilestoneDto` includes `createdAt` for velocity calculations

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values.

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `NEXTAUTH_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `GITHUB_ID` | GitHub App OAuth client ID |
| `GITHUB_SECRET` | GitHub App OAuth client secret |
| `GITHUB_APP_ID` | Numeric GitHub App ID |
| `GITHUB_APP_PRIVATE_KEY` | Base64-encoded PEM private key — `base64 -i key.pem \| tr -d '\n'` |
| `GITHUB_APP_INSTALLATION_URL` | URL to install the GitHub App on an organisation |

## GitHub App Permissions Required

| Permission | Level | Reason |
|---|---|---|
| Contents | Repository → Read | Access repository data |
| Issues | Repository → Read | Fetch issues and milestones |
| Metadata | Repository → Read | List repositories |
| Members | Repository → Read | List collaborators |
| Projects | Organisation → Read | Read GitHub Projects v2 Status and Estimate fields |

## Getting Started

```bash
npm install
npx prisma migrate dev
npm run dev
```
