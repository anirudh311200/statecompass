# StateCompass

Interactive site showing how business-friendly each US state is, based on [CNBC America's Top States for Business 2025](https://www.cnbc.com/2025/07/10/top-states-for-business-americas-2025-the-full-rankings.html).

Built with [Astro](https://astro.build) — static export, deployable to Vercel or Netlify.

## Features

- Hover or keyboard-focus any state to highlight it green, yellow, or red by tier
- Sidebar shows state name, score out of 100, and rank (#1–#50)
- Fully static — HTML, CSS, and JavaScript only

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

The prebuild step regenerates `public/data/states.json` and verifies map alignment.

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
| `PUBLIC_PLAUSIBLE_DOMAIN` | Optional Plausible analytics domain |

## Regenerate assets

```bash
python scripts/generate_states.py   # Rankings data
python scripts/generate_map.py      # SVG map from topojson
python scripts/verify.py            # Assert 50 states align
```

## Project structure

```
src/
  pages/index.astro    — Map home page
  layouts/Layout.astro — Page shell
  scripts/map.js       — Hover/focus logic
  styles/styles.css    — Layout and colors
public/
  assets/              — Logo, favicon, SVG map
  data/states.json     — Generated ranking data
scripts/               — Python data generators
data/                  — US Atlas topojson (map source)
```
