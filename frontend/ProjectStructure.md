# GitRank – Frontend

Next.js 14 app with GitHub App authentication and repository-scoped team features. Focused on organisation-owned repositories — the GitHub App must be installed on the organisation and have **Organisation permissions → Projects: Read** granted.

## Project Structure

### `app/`
Next.js App Router pages and API routes.

#### Pages

- `app/login/` — sign-in page
- `app/repositories/` — repository selection page (with layout wrapper)
- `app/repository/[owner]/[repo]/` — per-repository section; uses a fixed-height (`h-screen`) layout with a sticky sidebar and independently scrolling content area
  - `overview/` — repository overview page; fetches current sprint WIP data and renders the `SprintGoalCard`
  - `overview/loading.tsx` — skeleton loading UI for the overview page; shown instantly by Next.js while the server fetches sprint data; mirrors the `SprintGoalCard` layout with `animate-pulse` shimmer placeholders
  - `profile/` — contributor profile page; shows GitHub profile info, contribution stats, and the Achievements section with earned/unearned medals
  - `profile/loading.tsx` — skeleton loading UI for the profile page; mirrors the profile card, 4 stats cards, and achievements medal grid with `animate-pulse` shimmer placeholders
  - `metrics/` — sprint metrics page; contains four cards: Oracle (velocity prediction), Work in Progress (donut chart), Story Points (bar chart across last 5 sprints), and Sprint Tasks Completed (bar chart across last 5 sprints)
  - `metrics/loading.tsx` — skeleton loading UI for the metrics page; shown instantly by Next.js while the server fetches GitHub data; mirrors the 2×2 card grid with `animate-pulse` shimmer placeholders
- `app/auth/error/` — OAuth error page

#### API Routes

- `app/api/auth/` — NextAuth.js handler
- `app/api/github/repositories/` — list repositories accessible to the authenticated user (across all orgs the user belongs to + personal account)
- `app/api/github/repositories/[owner]/[repo]/issues/assigned-open/` — open issues assigned to the current user
- `app/api/github/repositories/[owner]/[repo]/members/` — repository member list
- `app/api/github/repositories/[owner]/[repo]/milestone-current/issues/` — issues in the current milestone
- `app/api/github/[owner]/[repo]/commits/` — repository commit history
- `app/api/github/issues/` — general issues proxy
- `app/api/webhook/` — GitHub webhook receiver; dispatches to `handleIssue`, `handlePr`, `handlePush`

### `components/`
React components grouped by concern.

- `components/layout/Sidebar.tsx` — fixed sidebar with repository navigation; accepts `overviewHref`, `profileHref`, and `metricsHref` props
- `components/layout/RepositoryHeader.tsx` — top header for repository pages
- `components/ui/Buttons/GitHubSignInButton.tsx` — GitHub OAuth sign-in button
- `components/ui/Buttons/SignOutButton.tsx` — sign-out button
- `components/repository/` — repository selection form
- `components/overview/SprintGoalCard.tsx` — displays the current sprint goal (active milestone title) alongside a 2×2 grid of issue counts by status (DONE / DOING / REVIEW / TODO), using lucide-react icons and colour-coded status cards
- `components/overview/ProfileStatsCards.tsx` — 4-card grid showing Tasks done, Accumulated Points, Sprints done, and Commits done
- `components/metrics/OracleCard.tsx` — Oracle metric card; displays sprint velocity prediction with early/on-track/at-risk states
- `components/metrics/WorkInProgressCard.tsx` — WIP donut chart (recharts); categorises current-sprint issues into TO-DO / DOING / REVIEW / DONE using the GitHub Projects v2 **Status** field via the organisation installation token
- `components/metrics/StoryPointsCard.tsx` — Grouped bar chart (recharts); completed vs planned story points across the last 5 sprints; points sourced from the GitHub Projects v2 **Estimate** field
- `components/metrics/SprintTasksCard.tsx` — Grouped bar chart (recharts); completed vs planned tasks across the last 5 sprints; shows % change vs previous sprint
- `components/profile/AchievementsSection.tsx` — medal grid showing all 9 badges; earned badges are full-colour, unearned are greyscale + dimmed; hovering any card reveals a dark overlay with the badge name and achievement description
- `components/providers.tsx` — session provider wrapper

### `lib/`
Server-side logic and utilities.

- `lib/auth.ts` — NextAuth config with GitHub App OAuth provider (`read:user user:email` scope); upserts User on login
- `lib/prisma.ts` — Prisma client singleton (Prisma 7 + `@prisma/adapter-pg`)
- `lib/github-app.ts` — GitHub App helpers: App JWT creation, installation token exchange (`getInstallationToken`), repo listing (`getInstallationRepos`), direct owner→installation lookup via App JWT (`getInstallationIdForOwner`), and user-scoped installation discovery across orgs + personal account (`getInstallationIdsForUser`)
- `lib/github-client.ts` — GitHub REST + GraphQL API client; key exports: `getAccessibleRepositories`, `getMilestoneVelocityData`, `getWorkInProgressData` (also returns `sprintGoal`), `getSprintHistoryData`; all repo-scoped functions resolve the installation token via `getInstallationIdForOwner`
- `lib/repository.ts` — upserts Repository row on page visit
- `lib/badges.ts` — badge award logic; `evaluateBadgesForUser` checks all thresholds (task count, bug count, sprint count) and awards badges idempotently; `awardAllTasksBadgeToMilestoneParticipants` awards the team badge when a milestone's last issue is closed; `getUserBadgesForRepo` fetches all badges and the set of IDs earned by a given user in a given repository
- `lib/webhooks/handleIssue.ts` — processes GitHub `issues` webhook events: on `opened` increments `issuesCreated` and evaluates the backlog badge; on `closed` increments `issuesClosed` / `bugsClosed`, records sprint participation via the issue's milestone, evaluates all badges, and awards the `all_tasks` team badge when `milestone.open_issues === 0`
- `lib/webhooks/handlePr.ts` — processes GitHub `pull_request` webhook events
- `lib/webhooks/handlePush.ts` — processes GitHub `push` webhook events

### `prisma/`
Database schema and migrations (PostgreSQL via Supabase).

- `prisma/schema.prisma` — data models (see table below)
- `prisma/migrations/` — migration history
- `prisma/seed.js` — seeds the `Badges` table with the 9 medal definitions; run with `npx prisma db seed`
- `prisma/upload-medals.js` — uploads medal PNG files from `public/medals/` to Supabase Storage and updates `icon_url` in the `Badges` table with the public CDN URLs; requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`

#### Data Models

| Model | Purpose |
|---|---|
| `User` | GitHub-authenticated user; upserted on login |
| `Repository` | GitHub repo accessed via the app at least once |
| `Badges` | Badge definitions (name, description, icon URL in Supabase Storage) |
| `UserBadges` | Join table — which badges a user has earned, per repository; unique on `(userId, badgeId)` |
| `UserStats` | Tracks `issuesClosed`, `issuesCreated`, `bugsClosed` per user per repository; updated by the issues webhook |
| `UserSprintParticipation` | Records each unique milestone a user participated in per repository; unique on `(userId, repositoryId, milestoneId)`; drives sprint badge thresholds |
| `VotesForHeroOfSprint` | Sprint hero nominations and votes |
| `RecognitionMessage` | Peer recognition messages between team members |

#### Badge Definitions

| Badge name | Condition |
|---|---|
| `task10` | User closes 10 issues |
| `task20` | User closes 20 issues |
| `task40` | User closes 40+ issues |
| `backlog` | User opens 20+ issues |
| `bug` | User closes 20+ issues labelled `bug` |
| `sprint1` | User participates in 1 sprint (milestone) |
| `sprint5` | User participates in 5 sprints |
| `sprint10` | User participates in 10 sprints |
| `all_tasks` | All issues in a milestone are closed — awarded to every participant |

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
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key — required only to run `prisma/upload-medals.js`; found in Supabase dashboard → Settings → API |

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
npx prisma db seed
node prisma/upload-medals.js   # requires SUPABASE_SERVICE_ROLE_KEY in .env.local
npm run dev
```
