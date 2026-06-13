# Founder Snapshot data

Founder Snapshot is **lane B** data in StateCompass — operational facts with source links, separate from CNBC competitiveness scores (lane A).

## Source of truth

| File | Purpose |
|------|---------|
| `scripts/build_founder_snapshots.py` | Curated facts and official URLs for all 50 states |
| `data/founder_snapshots.json` | Generated JSON (committed) |
| `public/data/founder_snapshots.json` | Copy served to the site at build time |

Regenerate:

```bash
python scripts/build_founder_snapshots.py
python scripts/verify.py
```

Or via npm:

```bash
npm run data
```

## Schema

Each state entry includes:

- `taxPosture` — high-level corporate / income tax summary
- `businessRegistration` — Secretary of State (or equivalent) link
- `complianceCalendar` — franchise tax, annual report, or similar filing overview
- `multiStateHeadsUp` — 3–5 bullets on nexus, remote workers, foreign qualification

Every fact object:

```json
{
  "value": "Human-readable summary",
  "sourceUrl": "https://official-or-reputable-source.example",
  "sourceLabel": "Agency or publication name"
}
```

`verify.py` enforces:

- All 50 state abbreviations present and aligned with `states.json`
- Required fields on every state
- `sourceUrl` must use `https://`
- 3–5 multi-state bullets per state
- Non-empty disclaimer string at the root

## Sourcing rules

1. **No Snapshot field without a source URL** — if we cannot cite an official or reputable source, do not ship the fact.
2. **Prefer `.gov` and state agency sites** for tax, registration, and compliance links.
3. **High-level summaries only** — rates and thresholds change; link to the authority for details.
4. **Not legal or tax advice** — the disclaimer on every Snapshot section applies; do not add filing instructions or entity-type recommendations.
5. **Do not blend into CNBC scores** — Snapshot content never affects ranks, tiers, or Founder Fit.

## Updating a state

1. Edit the state's block in `scripts/build_founder_snapshots.py`.
2. Run `python scripts/build_founder_snapshots.py && python scripts/verify.py`.
3. Spot-check the state detail page (`/states/{slug}`) in dev.

## Trust principles

See [ROADMAP.md](./ROADMAP.md) — Snapshot data follows the same trust rules as the rest of the product: sourced, attributed, and clearly informational.
