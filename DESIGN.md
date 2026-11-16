# Database and backend design

Supabase project `service-platform` (ref `qyfgwixhweuwuxentmze`). Three migrations: `init_service_platform`, `reviews_stats_scoring_lifecycle`, `fix_stats_on_profile_trigger`.

## Tables

| Table | Holds | Who can read | Who can write |
|---|---|---|---|
| `profiles` | Public identity: role, name, city, bio, skills, plan | Everyone | Owner, only name/city/bio/skills |
| `private_contacts` | Phone number | Owner, and the other side of an accepted request | Owner |
| `categories` | Lookup list of service categories | Everyone | Nobody through the API |
| `jobs` | Job posts with lifecycle timestamps and a full-text search column | Open jobs: everyone. Others: owner and applicants | Owner (content only; status goes through a function) |
| `applications` | Requests to take a job; never deleted, only change status | Applicant and job owner | Applicant inserts; everything else through functions |
| `reviews` | 1 to 5 stars + comment, tied to a finished job | Everyone | Only through `submit_review` |
| `user_stats` | One row per user: counters, score parts, score | Everyone | Only the database |
| `payments` | Payment history, with `provider` and unique `provider_ref` | Owner | Only the database |
| `private.audit_log` | Who did what (plan change, decisions, reviews, deletion) | Nobody through the API | Only the database |

## Principles applied

- **The database is the security boundary.** Row level security plus column-level grants on every table. The app holds only the publishable key, so nothing depends on app code being correct.
- **State changes go through functions.** `decide_application`, `set_job_status`, `withdraw_application`, `submit_review`, `change_plan_test`, `delete_my_account`. Each checks who is calling and which transitions are legal, in one transaction.
- **Concurrency.** Decisions lock the job row (`for update`), so two accepts cannot both win. Plan limits take a per-user advisory lock, so two fast requests cannot both slip under the limit.
- **Read model for the card.** `user_stats` is denormalised on purpose: a user card is one indexed row instead of aggregates over three tables. Triggers recompute the affected users whenever a job, request, review or profile changes. It is always a full recompute for that user, so it cannot drift.
- **History is kept.** Requests are marked `withdrawn` / `dropped` instead of deleted; a job that had someone accepted cannot be deleted; reviews survive the reviewer or the job being removed.
- **Indexes match the queries.** Partial index for the open-jobs feed, GIN for full-text search, trigram GIN for city search, composite indexes for "my jobs", "my requests", "reviews about me".
- **Keyset pagination** on the job feed (older than the last one seen), which stays fast at any depth.
- **Idempotency.** One review per person per job (unique constraint); `payments.provider_ref` is unique so a repeated webhook cannot double-record.
- **Lookup table** for categories with a foreign key, read by the app, so there is one list.

## Score (0 to 100)

`score = 55% reviews + 25% reliability + 10% responsiveness + 10% profile`

| Part | How it is computed | Why |
|---|---|---|
| Reviews | Bayesian average: `(5 x 4.0 + sum of stars) / (5 + number of reviews)`, mapped from 1..5 to 0..100 | One review cannot make or break a new account; many reviews dominate the prior |
| Reliability | `(done + 3) / (done + 2 x bad + 3)`, where bad = late cancellations (employer) + drop-outs after being accepted (worker/volunteer) | Rewards finishing, punishes leaving the other side stranded |
| Responsiveness | Average time an employer takes to answer requests: within 24 h = 100, a week or more = 0, no data = 70 | Workers should not wait in silence |
| Profile | Share of name, city, phone, description (and skills for workers/volunteers) filled in | Small nudge to complete the profile |

A new account with an empty profile starts around 73 to 75. The formula lives in `private.refresh_user_stats`; change weights there, then run `select private.refresh_user_stats(id) from public.profiles;`.

Guards against gaming: reviews need a job marked done between the two people; one per pair per job; no self-review; reviews cannot be edited; employers cannot apply to jobs.

Known limits:
- Two colluding accounts can still trade 5-star reviews on fake jobs. The fix later is to weight reviews by the reviewer's own history, or require a paid transaction.
- Deleting an account removes its jobs, so the other side's "jobs done" count (and any drop-out on those jobs) goes with them. Their received reviews stay. The fix later is to anonymise accounts instead of deleting.

## Accounts

- Sign-up creates `profiles`, `private_contacts` and `user_stats` in the same transaction as the auth user (trigger), so no account exists without a profile.
- Forgot password: `/forgot-password` emails a link; the link signs in and lands on `/reset-password`. The response is the same whether or not the email exists.
- Changing the password in `/account` asks for the current one. Changing email needs confirmation from the new inbox.
- Passwords, sessions and email links are handled by Supabase Auth; the app never stores a password.

## Left out on purpose, and when to add

| Not built | Add when |
|---|---|
| Table partitioning, read replicas | Tables reach tens of millions of rows or reads saturate one database |
| Queue for stats (pgmq) instead of triggers | A single action touches hundreds of users, e.g. a volunteer job with 500 people |
| Caching layer (Redis) | The job feed is slow despite the indexes |
| Avatars (Supabase Storage) | Next profile iteration; cards show initials for now |
| Subscriptions table, renewals, webhooks | A payment provider is chosen |
| Rate limiting beyond Supabase Auth defaults | Before public launch |
