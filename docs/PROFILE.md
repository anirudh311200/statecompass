# Founder profiles (Feature 6)

Lightweight saved founder profiles: email + quiz answers + Founder Lens + top-3 match snapshot. No passwords — magic-link return sessions only.

## Backend choice

| Layer | Service | Why |
|-------|---------|-----|
| **Storage** | [Upstash Redis](https://upstash.com/) (REST) | Serverless-friendly key-value store on Vercel; no persistent connections |
| **Email** | [Resend](https://resend.com/) | Transactional magic-link emails |
| **API** | Vercel serverless functions in `/api/profile/*` | Minimal surface alongside static Astro export |

Alternatives documented for future migration: Supabase (Postgres + auth), Convex, or Vercel KV (same Redis API with different env var names).

## Profile schema

Stored at `profile:id:{profileId}` in Redis:

```json
{
  "id": "hex",
  "email": "founder@company.com",
  "quizAnswers": {
    "stage": "under-500k",
    "model": "saas",
    "tax": "critical",
    "vc": "no",
    "hiring": "5-20",
    "talent": "engineering",
    "col": "yes"
  },
  "defaultLens": "bootstrapper",
  "top3Snapshot": [
    {
      "abbr": "TX",
      "name": "Texas",
      "slug": "texas",
      "matchScore100": 91,
      "matchRank": 1
    }
  ],
  "savedStates": ["TX"],
  "savedComparison": null,
  "sessionToken": "64-char hex",
  "createdAt": "2026-07-18T00:00:00.000Z",
  "updatedAt": "2026-07-18T00:00:00.000Z",
  "unsubscribed": false
}
```

Indexes:

- `profile:email:{sha256(email)}` → profile id
- `profile:token:{sessionToken}` → profile id
- `profile:index` → set of profile ids (for aggregate stats)

## Update behavior

Re-taking the quiz **overwrites** `quizAnswers`, `defaultLens`, `top3Snapshot`, and optional saved states/comparison when the user has an active session token. `createdAt` is preserved; `updatedAt` bumps.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/profile/save` | Create/update by email; sends magic link |
| `GET` | `/api/profile/session?token=` | Restore profile for browser session |
| `POST` | `/api/profile/update` | Update quiz snapshot (session token required) |
| `POST` | `/api/profile/delete` | GDPR delete |
| `POST` | `/api/profile/unsubscribe` | Stop email restore; clears local session |
| `GET` | `/api/profile/stats` | Aggregate segment counts (secret header) |

Plausible events (no PII): `ProfileCreated`, `ProfileReturn`, `ProfileSync`, `ProfileDelete`, `ProfileUnsubscribe`, `ProfileSaveError`.

## Environment variables

See `.env.example`. Required for production save/restore:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `SITE_URL` (magic link host)
- `PROFILE_FROM_EMAIL` (optional Resend from address)

Optional:

- `PROFILE_STATS_SECRET` — protects `/api/profile/stats`
- `PROFILE_DEV_EXPOSE_LINK=true` — local dev only; returns magic link in API response when email is not configured

## User flows

1. **Save after quiz** — Post-quiz panel on `/` and `/match` → email → magic link to `/me?token=…`
2. **Return visit** — Homepage banner + localStorage session restore top 3
3. **Manage** — `/me` unsubscribe or delete
4. **localStorage merge** — Saved states/comparison from `memory.js` merged on restore and included on save

## Privacy

- No passwords in MVP
- Magic link equals session token (store only on user devices / email)
- Clear copy on signup; delete + unsubscribe on `/me`
- Stats endpoint returns aggregate counts only

## Provisioning (Vercel)

1. Create an Upstash Redis database → add REST URL + token to Vercel env
2. Verify a domain in Resend → add `RESEND_API_KEY` and `PROFILE_FROM_EMAIL`
3. Set `SITE_URL=https://statecompass.app`
4. Redeploy

## Segment stats example

```bash
curl -H "X-Profile-Stats-Secret: $PROFILE_STATS_SECRET" \
  https://statecompass.app/api/profile/stats
```

Returns counts by stage, model, tax priority, VC status, and lens — no emails or tokens.
