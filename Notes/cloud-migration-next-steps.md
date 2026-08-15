# DexForge — Cloud Migration: Next Steps (Claude Code Instructions)

## Context
Deployment plumbing is sorted — `vercel.json` multi-service config, backend `entrypoint`, and
the GitHub↔Vercel webhook are all working, confirmed by a successful `v0.4.2` deploy. The site
loads. It has no content because **the actual data migration hasn't happened yet** — this doc
covers that remaining work. Decision made along the way: keep FastAPI as the backend (deployed
zero-config on Vercel) rather than porting logic to client-side JS.

## Immediate: why there's no content
Two separate, independent causes — check both:

1. **Dex reference data likely isn't in the deployed bundle.** `data/cache/*.json` (the 8
   PokeAPI-derived files) may be `.gitignore`d as generated/build output, which is reasonable
   for local dev but means Vercel's build never receives them. Check: is `data/cache/` in
   `.gitignore`? If so, either remove that exclusion and commit the files (simplest — ~45MB is
   well within Vercel's function bundle limits), or add a build step that regenerates/fetches
   them during deploy. Simplest fix first: just commit them.
2. **Saved lists (if any existed) are gone regardless of #1** — SQLite on Vercel is not
   persistent storage. Every cold start gets a fresh, empty filesystem. This isn't a bug to fix
   in the traditional sense; it's the reason the Supabase migration below is necessary, not
   optional. Don't spend time trying to make SQLite "stick" on Vercel — it structurally can't.

Fixing #1 alone should restore all the reference-data pages (Lookup, Compare, Typing
Calculator, Natures, Evolution Items, Move Pool). List Builder / Fusion List / Quick Links stay
empty (correctly, since there's no persistent store yet) until the Supabase work below lands.

## The remaining work: Supabase for data + auth + fusion art storage

### 1. Schema migration (SQLite → Supabase Postgres)
Recreate the 5 tables (`saved_lists`, `saved_list_entries`, `fusion_lists`,
`fusion_list_entries`, `quick_links`) in Supabase, via a SQL migration (Supabase CLI or the
dashboard's SQL editor). Structural addition needed for multi-user support that didn't exist
before: **add `user_id` to `saved_lists` and `fusion_lists`**, referencing Supabase's built-in
`auth.users` table. Decide once, don't mix approaches: either also add `user_id` directly to
the entry tables (simpler RLS, minor duplication) or scope entries via a join to their parent
list's `user_id` (no duplication, slightly more complex policy).

### 2. Row Level Security policies
For each of the 5 tables: a policy restricting select/insert/update/delete to rows where
`user_id = auth.uid()` (or, for entry tables using the join approach, where the parent list's
`user_id` matches). This is what actually keeps friends' lists separate — it's enforced by
Postgres itself, not by application code, so it holds even if a future bug in the frontend or
backend tries to request the wrong data.

### 3. Auth: Supabase Auth (frontend) + JWT verification (backend)
Cleanest split, and it keeps FastAPI simple:
- **Frontend** talks to Supabase Auth directly for sign up / log in (using the
  username→fake-email trick discussed earlier), and gets back a session/access token.
- **Frontend** attaches that token as an `Authorization: Bearer <token>` header on every
  request to the FastAPI backend.
- **Backend** verifies the token (Supabase's JWT secret, available in your project settings)
  and extracts the user ID from it — no password handling, no session storage, no custom auth
  logic in FastAPI at all beyond "verify this token and know who's asking."
This avoids writing a custom auth system in Python (the original Option B idea) while still
keeping FastAPI as the API layer — you get Supabase's auth for free without doing the full
client-side rewrite either.

### 4. Point FastAPI's DB layer at Supabase Postgres
Swap the SQLAlchemy connection string from the local SQLite file to Supabase's Postgres
connection string (via an environment variable — see below). Models mostly translate as-is;
double-check any SQLite-specific column types or autoincrement behavior that differs under
Postgres.

### 5. Fusion art cache → Supabase Storage
`services/fusion_art.py`'s scrape-and-cache logic stays in Python, just retarget where it
writes: instead of `data/cache/fusion_sprites/` on local disk (which won't persist on Vercel
between invocations anyway), upload to a public Supabase Storage bucket and serve via its URL
instead of the `/static/fusion-sprites` mount.

### 6. Environment variables — backend needs its own, separate from the frontend's
The frontend already has `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` set in Vercel. The
**backend service** needs its own set, added separately (multi-service Vercel projects don't
share env vars between services automatically):
- `SUPABASE_URL`
- `SUPABASE_JWT_SECRET` (for verifying tokens from the frontend)
- `SUPABASE_SERVICE_ROLE_KEY` (elevated key, needed for Storage uploads from the backend —
  keep this backend-only, never expose it to the frontend/browser)
- `DATABASE_URL` (Supabase's Postgres connection string, for SQLAlchemy)

## Suggested order
1. Fix the missing dex-cache-data issue first (#1 above) — fastest win, restores most of the
   app's visible content immediately, independent of everything else.
2. Supabase schema + RLS (steps 1-2 above)
3. Auth wiring (step 3) — needed before lists mean anything per-user
4. Point FastAPI at Postgres (step 4)
5. Fusion art storage (step 5) — lowest priority, only affects one feature (community art),
   the rest of the app works fine without it
