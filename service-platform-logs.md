# service-platform logs

## 2026-11-16: first version built

Commands run and what each was for:

| Command | Purpose |
|---|---|
| `cat` / `find` / `git log` / `git status` in work.jobs (read-only) | See what the connected folder holds and copy its Next.js + Supabase conventions; nothing in work.jobs was changed |
| Supabase: create project `service-platform` (eu-west-3, org slurp) | New database and auth for this app |
| Supabase: apply migration `init_service_platform` | Tables, row level security, plan limits, RPC functions |
| Supabase: get project URL and publishable key | Fill `web/.env.local` |
| `mkdir`, `cp` of config files from work.jobs/web, `cat > file` for each source file | Create `service-platform/web` |
| `npm install` (in a scratch copy outside this folder) | Install dependencies to check the build; produced `package-lock.json` |
| `npx tsc --noEmit`, `npx eslint .` | Type check and lint: both clean |
| `npx next build` | Production build. First run failed fetching the Geist Google font, so the font was replaced with the system font; second run passed |
| `npx next start` + `curl` on each route | Routes answer; signed-out visits to /dashboard, /account, /jobs/new redirect to /login |
| `curl` / web fetch of `/rest/v1/jobs` | Confirm the Supabase API answers with the publishable key |
| Supabase: SQL test in a rolled-back transaction | Checked role rules, plan limits, phone privacy, plan change, account deletion |
| Supabase: security advisors | 3 warnings, all for the intentional RPC functions |

## 2026-11-16: database v2 (reviews, stats, score, password recovery)

| Command | Purpose |
|---|---|
| Supabase: SQL count of users, jobs, requests, extensions | Check for existing data before changing the schema (1 user, no jobs) |
| Supabase: apply migration `reviews_stats_scoring_lifecycle` | Categories table, job lifecycle, reviews, `user_stats` + score, search indexes, audit log, locking, new functions |
| Supabase: SQL test in a rolled-back transaction (run twice) | First run caught a broken profile trigger; second run passed every rule and score check |
| Supabase: apply migration `fix_stats_on_profile_trigger` | Fix for that trigger (saving a profile would have failed) |
| `python3` edits and `cat > file` in `web/` | User card, `/users/[id]`, reviews on the job page, forgot/reset password, email and password change, search and paging on the job list |
| `npx tsc --noEmit`, `npx eslint .`, `npx next build` (scratch copy) | Type check, lint, production build: all clean |
| Web fetch of `/rest/v1/profiles`, `/reviews`, `/jobs` | Confirm the card, review and search queries work through the live API |
| Supabase: security advisors | 6 warnings for the intentional functions, 1 for leaked-password protection being off |
| `cat > DESIGN.md`, README edits | Write the design down |

## 2026-11-16: repo and Vercel (blocked on push access)

| Command | Purpose |
|---|---|
| Add repo `Badis-tech/Nexus` to the session with push access | Refused: Claude has no push access to that repo |
| `ls -a`, `git remote -v`, `git ls-remote`, `git config --list` | Check the folder is not yet a git repo and whether this shell has GitHub credentials (it has none) |
| Vercel: list teams | Find the team to deploy under (badis' projects) |

## 2026-11-16: deployed to Vercel

Live at https://nexus-olive-three-18.vercel.app (Vercel project `nexus`, team badis' projects, repo Badis-tech/Nexus, root directory `web`).

| Command | Purpose |
|---|---|
| Vercel: create git project `nexus` linked to Badis-tech/Nexus, root `web` | Every push to `main` deploys |
| Vercel: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Point the deployed app at the Supabase project |
| Vercel: create production deployment from `main` (first try refused for missing project settings, second passed) | Build and publish commit efc4ba1 |
| Vercel: get deployment, get project | Confirm the build is ready and read the domains |
| Web fetch of the live home page | Confirm it is public and reads from the database |

## 2026-11-16: test pass

| Command | Purpose |
|---|---|
| Supabase: SQL scenario in a rolled-back transaction (2 employers, 3 workers, 2 volunteers) | Plans and limits, applying, accepting, declining, withdrawing, volunteer jobs, done, reviews, late cancel, phone privacy, cross-account access, account deletion. All 30+ checks passed; nothing was left in the database |
| Built-in browser: 11 pages on the live site, signed out | Home, search, pricing, sign-up role preselect, login, reset page, 404, private pages redirect to login, bad email-link code shows a clear error |
| `python3` edit + `cat > app/resend-confirmation/page.tsx` | New "resend confirmation email" page and action; login now sends unconfirmed users there |
| `npx tsc --noEmit`, `npx eslint .`, `npx next build` (scratch copy) | Type check, lint, build: clean |
| Supabase: SQL count of users / confirmed / emails sent | Confirm email confirmation is switched on and has worked once |

## 2026-11-16: login / sign-up problem

| Command | Purpose |
|---|---|
| Supabase: auth logs for the evening, and account state (no email addresses read) | Find why login and sign-up fail: wrong password on a confirmed account, repeat sign-ups that send nothing, hourly email limit reached |
| `python3` edit of `web/app/auth/actions.ts` | Clear messages for the email limit and for signing up with an email that already has an account; forgot-password no longer claims success when the email was not sent |
| `npx tsc --noEmit`, `npx eslint .`, `npx next build` (scratch copy) | Type check, lint, build: clean |
