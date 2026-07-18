# StateCompass

**Site selection for founders** — compare where to build and operate your business, powered by [CNBC America's Top States for Business 2025](https://www.cnbc.com/2025/07/10/top-states-for-business-americas-2025-the-full-rankings.html).

Send a compare link in Slack instead of screenshotting ChatGPT. StateCompass gives linkable, visual, CNBC-sourced evidence for HQ and expansion decisions.

Built with [Astro](https://astro.build) — static export, deployable to Vercel or Netlify.

## Features

- **Map** — Search or click any state; see CNBC score, rank, tier, and top category strengths
- **Compare** — Side-by-side 2–3 states with winner highlighting; shareable URL and print/PDF export
- **Rankings** — Full 50-state table with sort, tier filter, and Founder Fit profiles
- **State pages** — All 10 CNBC categories with sourced breakdowns and social preview cards
- **Founder Fit** — Re-weighted rankings for tech startups, bootstrapped services, and physical ops
- **Embed & API** — iframe widgets and read-only JSON for accelerators and portfolio sites (`/partners`)

Scores come from CNBC via a verified data pipeline — never hand-edited in the UI.

## Local development

Requires Node.js 20+ and Python 3.10+.

```bash
npm install
pip install -r requirements.txt
npm run dev
```

Open http://localhost:4321

## Build

```bash
npm run build
npm run preview
```

The prebuild step regenerates `public/data/states.json`, OG social cards, and runs CI verification.

## Deploy

### Vercel

Connect the repo — `vercel.json` is included. Set `SITE_URL` to your production domain.

### Netlify

Connect the repo — `netlify.toml` is included.

### CI

GitHub Actions runs on every push to `main`: Python verify, then Astro build.

## Environment variables

| Variable | Description |
|----------|-------------|
| `SITE_URL` | Canonical site URL for sitemap and OG tags |
| `PUBLIC_PLAUSIBLE_DOMAIN` | Optional Plausible analytics domain (tracks Compare, Share, Profile events) |
| `UPSTASH_REDIS_REST_URL` | Feature 6 profile storage (Upstash Redis REST URL) |
| `UPSTASH_REDIS_REST_TOKEN` | Feature 6 profile storage token |
| `RESEND_API_KEY` | Magic-link emails for saved founder profiles |
| `PROFILE_FROM_EMAIL` | Optional Resend from address (default: StateCompass hello@) |
| `PROFILE_STATS_SECRET` | Optional secret for aggregate profile segment stats API |

See `docs/PROFILE.md` for the full Feature 6 setup guide.

## Regenerate assets

```bash
python scripts/generate_states.py   # Rankings data
python scripts/generate_og.py       # Social preview cards (50 states + compare + default)
python scripts/generate_map.py      # SVG map from topojson
python scripts/verify.py            # Assert 50 states align
```

## Project structure

```
src/
  pages/
    index.astro           — Map home
    compare.astro         — Side-by-side compare
    rankings.astro        — Full rankings table
    states/[slug].astro   — Per-state detail (50 pages)
  components/             — Header, Footer, charts, Founder Fit
  scripts/                — Map, compare, rankings, founder fit
  layouts/Layout.astro    — SEO, OG tags, JSON-LD
public/
  assets/                 — Logo, favicon, SVG map
  data/states.json        — Generated ranking data
  og/                     — Generated social preview cards
scripts/                  — Python data generators
docs/ROADMAP.md           — Product phases
```
