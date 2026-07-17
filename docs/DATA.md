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

---

# Regulatory Pulse data (Feature 5)

Regulatory Pulse is **lane B** operational intelligence — recent regulatory changes with official source links, separate from CNBC scores.

## Source of truth

| File | Purpose |
|------|---------|
| `scripts/build_regulatory_pulse.py` | Hand-curated pulse items with source URLs |
| `data/regulatory_pulse.json` | Generated JSON (committed) |
| `public/data/regulatory_pulse.json` | Copy served to the site at build time |

Regenerate:

```bash
python scripts/build_regulatory_pulse.py
python scripts/verify.py
```

Or via npm:

```bash
npm run data
```

## Schema

Root payload:

- `disclaimer` — shown on every Pulse view
- `industries` — filter tags (SaaS, Fintech, E-commerce, Healthcare, Marketplace, General)
- `staleAfterDays` — items older than this from `effectiveDate` are flagged stale in curation review (default 365)
- `lastCuratedAt` — ISO date of last corpus review
- `items[]` — pulse entries

Each item:

```json
{
  "id": "ca-cpra-2023",
  "stateAbbr": "CA",
  "title": "Short headline",
  "summary": "One-line founder-facing summary",
  "effectiveDate": "2023-01-01",
  "industries": ["SaaS", "E-commerce"],
  "sourceUrl": "https://official-source.example",
  "sourceLabel": "Agency or publication name",
  "publishedAt": "2022-11-01"
}
```

`verify.py` enforces:

- 50–120 items in the corpus
- Every item has `sourceUrl` (`https://`) and ISO dates
- At least 5 items each for CA, NY, TX, WA, FL
- Unique `id` values; valid state abbreviations

## Curation workflow (monthly)

1. **Review** — Open a PR (or edit `scripts/build_regulatory_pulse.py`) with new or updated items.
2. **Source check** — Every claim must link to an official agency page, statute, or reputable publication. No unsourced regulatory claims.
3. **Stale flag** — Items with `effectiveDate` older than `staleAfterDays` should be reviewed: update summary, replace with newer rule, or remove if obsolete.
4. **Build** — Run `python scripts/build_regulatory_pulse.py && python scripts/verify.py`.
5. **Spot-check** — `/pulse`, a major state detail page, and expansion results for that state.

Future: optional CMS or email digest hook (Feature 6) can read the same JSON.

## Sourcing rules

Same as Founder Snapshot — informational only, not legal advice. Prefer `.gov` and state agency sites. Label industry tags honestly; do not imply licensing-specific guidance unless the source covers it.

## Updating items

1. Add or edit entries in `PULSE_ITEMS` inside `scripts/build_regulatory_pulse.py`.
2. Run `python scripts/build_regulatory_pulse.py && python scripts/verify.py`.
3. Spot-check `/pulse?state=XX` and the state detail Regulatory Pulse section.

