# Service Platform

A simple marketplace for local services: plumbing, painting, gardening, cleaning, street clean-ups and similar jobs.

Three account types, chosen at sign-up:

| Account | Can do | Plans |
|---|---|---|
| Employer | Post jobs (paid or volunteer), accept or decline requests, mark jobs done | Free: 3 posts a month. Pro: unlimited, 30 TND a month |
| Worker | Apply to any open job, keep a profile with skills | Free: 5 applications a month. Pro: unlimited, 10 TND a month |
| Volunteer | Join volunteer jobs only | Always free, no limits |

Phone numbers stay private until an employer accepts a request; then both sides see each other's number.

Every user has a public card (`/users/<id>`) with a 0 to 100 score built from reviews, reliability, responsiveness and profile completeness. After a job is marked done, both sides can review each other. See [DESIGN.md](DESIGN.md) for the database design and the score formula.

## Run it

```
cd web
npm install
npm run dev
```

Open http://localhost:3000. `web/.env.local` already points at the Supabase project.

For quick testing, turn off **Confirm email** in Supabase (Authentication > Sign In / Providers > Email). With it on, new accounts must click the emailed link first, and the built-in mailer only sends a few emails per hour.

For email links (confirm, reset password) to return to the right page, add `http://localhost:3000/**` (and later your real domain) under Authentication > URL Configuration > Redirect URLs. Links must be opened in the same browser that requested them.

## Where things are

- `web/app` pages: `/` job list, `/signup`, `/login`, `/forgot-password`, `/reset-password`, `/jobs/new`, `/jobs/[id]`, `/users/[id]`, `/dashboard`, `/pricing`, `/checkout`, `/account`
- `web/lib/site.ts` product name, currency (categories are rows in the `categories` table)
- `web/lib/plans.ts` plan names, prices, monthly limits
- Database: Supabase project `service-platform` (ref `qyfgwixhweuwuxentmze`, region eu-west-3). Tables `profiles`, `private_contacts`, `categories`, `jobs`, `applications`, `reviews`, `user_stats`, `payments`. The schema was applied as three migrations; run `supabase link --project-ref qyfgwixhweuwuxentmze` then `supabase db pull` to get it as a file in `supabase/migrations`.

## Payments are in test mode

"Upgrade to Pro" calls the database function `change_plan_test`, which switches the plan and records a payment with status `test`. No money moves. To go live, replace that function with a payment provider checkout and a webhook that sets `profiles.plan`, and remove `change_plan_test`.

Prices and limits live in two places that must agree: `web/lib/plans.ts` and the database (`change_plan_test`, `private.enforce_job_rules`, `private.enforce_application_rules`).

## Rules enforced in the database

- Only employers can post jobs; only the owner can edit, close or delete a job.
- Employers cannot apply; volunteers can only join volunteer jobs.
- Free-plan limits are checked on insert, so they hold even if someone calls the API directly.
- Users cannot change their own plan or role by writing to `profiles`.
- Account type is fixed at sign-up.
