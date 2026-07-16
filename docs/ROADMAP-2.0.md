# StateCompass 2.0

> **Product era:** July 2026 onward — the founder platform chapter.  
> **v1 frozen at:** git tag `v1.0.0` (June 2026) · branch `v1` · [Release](https://github.com/anirudh311200/statecompass/releases/tag/v1.0.0)  
> **Live:** [statecompass.app](https://statecompass.app)  
> **How to use in Cursor:** *"Read `docs/ROADMAP-2.0.md`. Implement Feature N only."*

---

## North star

**One sentence:** Tell StateCompass about your company — get personalized state and city matches, expansion readiness, shareable evidence, and a reason to come back.

**v1 was:** Explore and compare all 50 states with CNBC-sourced evidence.  
**2.0 is:** A founder decision platform — personalized, shareable, and evolving toward operating intelligence.

**Build rule:** Ship **one feature at a time**, in order (Feature 1 → 6). Finish all checkpoints and exit criteria for a feature before starting the next.

---

## v1 baseline (what already ships — do not rebuild unless broken)

| Area | Location | Notes |
|------|----------|-------|
| Interactive US map + tier glow | `src/scripts/map.js`, `categories.js` | Pin/dim/hover; west→east intro via `mapIntro.js` |
| Search + sidebar | `index.astro`, `search.js`, `mapSidebar.js` | State preview, Founder Fit pills, bookmark |
| Compare 2–3 states | `compare.astro`, `compare.js` | Shareable URL, print/PDF |
| Rankings table | `rankings.astro`, `rankings.js` | Sort, tier filter, 3 Founder Fit profiles |
| State detail pages (×50) | `states/[slug].astro` | 10 CNBC categories, Founder Snapshot |
| Movers / YoY | `movers.astro`, `yearData.js` | Multi-year CNBC data |
| Saved states (browser) | `memory.js`, `SavedPanel.astro` | localStorage only — no accounts |
| Embed + API | `partners.astro`, `embed/` | Read-only distribution |
| CNBC data pipeline | `scripts/generate_states.py`, `verify.py` | Scores never hand-edited in UI |

**v1 does not have:** quiz, match scores, city/metro layer, map zoom on pin, expansion scoring, report cards, full Lens set, regulatory feed, or saved founder profiles.

---

## Trust principles (every feature)

1. **CNBC scores are sacred** — ranks and category totals come from the verified pipeline only.
2. **Label derived scores** — Match %, Expansion Readiness, Lens ranks = "StateCompass derived — not CNBC official."
3. **Two data lanes** — (A) CNBC competitiveness; (B) operational facts (Snapshot, Pulse, metros) with **source links**.
4. **Disclaimers on guidance** — not legal, tax, or compliance advice.
5. **Ship vertical slices** — one complete user flow before scaling edge cases.

---

## The six features (overview)

| # | Feature | One-line job |
|---|---------|--------------|
| **1** | Founder State Match | Quiz → top 3 states + match % + why + **State Focus Mode** (zoom, cities, best metro for you) |
| **2** | Expansion Readiness Score | Already in state X → how ready am I to expand into Y? |
| **3** | State Report Card | Shareable one-pager per state for board decks |
| **4** | Founder Lens | Reweight rankings/compare for founder type (Bootstrapper, VC-Backed, Fintech, Remote-First) |
| **5** | Regulatory Pulse | Lightweight sourced feed of recent regulatory changes per state |
| **6** | Save My Profile | Email + quiz/lens answers → return sessions + email list |

**Build order:** **1 → 2 → 3 → 4 → 5 → 6** — one feature at a time; finish all checkpoints + exit criteria before moving on.

**Cross-feature notes (not reordering):**
- Feature 2 works better once Feature 1 quiz exists (can use inline form until then).
- Feature 4 Lens can retroactively enhance Match/Compare after it ships in step 4.
- Feature 6 Save Profile unlocks return visits for everything built in 1–5.

---

# Feature 1 — Founder State Match

**Status:** Not started

**Goal:** Make the homepage about *you* — a short quiz produces a personalized top 3 states with match scores, plain-English explanations, and a cinematic **State Focus Mode** drill-down (state zoom → cities → best metro for your profile).

**Headline user story:** *"I'm bootstrapping a SaaS company, hiring engineers, tax matters — where should I build?"* → Texas 91% → zoom into TX → Austin highlighted for tech.

**Builds on v1:** `founderFit.js` weighted scoring, `map.js` pin/dim, CNBC category data, OG card pipeline.

**Does not require:** accounts (Feature 6), Expansion Readiness (Feature 2).

---

### Checkpoints

#### A — Quiz & homepage entry

- [ ] **1.A.1** Homepage hero: quiz as primary CTA ("Find your state match"); map remains exploration layer below or after quiz
- [ ] **1.A.2** Quiz UI — 6–8 questions, one at a time or stepped form, plain founder language:
  - Stage (Pre-revenue / Under $500K ARR / $500K–$2M / $2M+)
  - Business model (SaaS / Fintech / E-commerce / Marketplace / Other)
  - State income tax priority (Critical / Somewhat / Not a priority)
  - VC funding (Yes already / Yes planning / No bootstrapping)
  - Hiring plan next 12 months (0–5 / 5–20 / 20+)
  - Talent pool (Engineering / Finance / Healthcare / General)
  - COL vs ecosystem tradeoff (Yes / No / Neutral)
- [ ] **1.A.3** Quiz state persisted in session (localStorage) until results shown or cleared
- [ ] **1.A.4** Mobile-friendly quiz layout; `prefers-reduced-motion` respected

#### B — Match engine (state level)

- [ ] **1.B.1** `data/founder_match_weights.json` (or equivalent) — map each quiz answer → CNBC category weight adjustments; formula documented in code comments
- [ ] **1.B.2** `src/scripts/founderMatch.js` — compute Match % (0–100) per state from weighted CNBC categories; rank all 50
- [ ] **1.B.3** Select and return **top 3 states** with scores
- [ ] **1.B.4** Disclaimer on results: *"Derived from CNBC category scores — not CNBC's official overall rank."*
- [ ] **1.B.5** Unit tests or verify script: weight sums, score bounds, deterministic output for fixture quiz

#### C — Results & explanations (state level)

- [ ] **1.C.1** Results view — top 3 cards: state name, Match %, rank under user's profile
- [ ] **1.C.2** Explanation template engine — 2–3 plain-English bullets per state citing *which quiz answers* drove the score (deterministic templates, not black-box AI)
- [ ] **1.C.3** Example quality bar: *"Texas scores 91% for you because you're bootstrapping, prioritize low income tax, and are hiring engineers."*
- [ ] **1.C.4** Links from each result → full state page + compare pre-fill
- [ ] **1.C.5** Shareable results URL (`/match?…` or encoded profile hash) + copy button
- [ ] **1.C.6** OG/social card for match results (build-time or dynamic) — screenshot-ready for LinkedIn loop

#### D — State Focus Mode (part of Feature 1)

- [ ] **1.D.1** On result click (or "Explore Texas"): map **zooms** into state bounds (SVG `viewBox` animation); other 49 states recede (stronger dim/blur than today)
- [ ] **1.D.2** Smooth zoom out / reset when clearing focus or picking another top-3 state
- [ ] **1.D.3** `data/state_metros.json` — schema: `{ stateAbbr, metros: [{ id, name, lat, lng, strengths[], industryTags[] }] }` with source URLs where facts are cited
- [ ] **1.D.4** Metro data Wave A — top ~15 founder states (TX, CA, NY, FL, WA, NC, CO, GA, MA, TN, AZ, UT, NV, IL, VA)
- [ ] **1.D.5** Metro data Wave B — remaining states + AK/HI inset handling
- [ ] **1.D.6** City pins + labels on zoomed map; sidebar or overlay lists metro **strengths** (what each city is known for)
- [ ] **1.D.7** **Profile-aware best metro** — highlight one city based on quiz answers (e.g. tech + engineers → Austin; energy → Houston)
- [ ] **1.D.8** Metro explanation line tied to quiz (e.g. *"Austin's tech talent density ranks #4 nationally"*) — sourced or clearly labeled as derived estimate
- [ ] **1.D.9** Mobile: zoom + metro list (simplified layout if full zoom is tight); desktop: full focus mode
- [ ] **1.D.10** `prefers-reduced-motion`: skip zoom animation, show metros instantly; embed routes unchanged

#### E — Integration & polish

- [ ] **1.E.1** Plausible events: quiz start, quiz complete, result share, state focus open, metro highlight
- [ ] **1.E.2** Re-take quiz flow; edit answers
- [ ] **1.E.3** Accessibility: keyboard through quiz, focus management on zoom, aria-live on results
- [ ] **1.E.4** `npm run build` + `verify.py` green; no CNBC score drift

### Exit criteria (Feature 1 done when)

- New visitor completes quiz and sees top 3 states with Match % and personalized copy
- Clicking #1 state zooms map, shows ≥3 metros for TX-scale states, highlights best metro for their quiz profile
- Results share link works; OG preview is sensible
- Mobile usable; reduced-motion respected
- You would send the link to a founder without apologizing

---

# Feature 2 — Expansion Readiness Score

**Status:** Shipped · **Depends on:** Feature 1 quiz/profile object (recommended; can use lightweight inline form if Feature 6 not done)

**Goal:** For founders **already operating** in a home state — score how ready they are to expand into each target state.

**Headline user story:** *"I'm in Washington, fintech, $1M ARR — thinking California and Texas."* → Texas 88% ready, California 41% with friction callouts.

**Builds on v1:** Compare deltas, Founder Snapshot tax/regulatory facts, CNBC category comparison, `founder_snapshots.json`.

---

### Checkpoints

#### A — Input flow

- [ ] **2.A.1** New route or modal: `/expand` (or section on homepage post-quiz) — home state picker, ARR range, target states (1–3)
- [ ] **2.A.2** Pre-fill from Feature 1 quiz when available (home state, stage/ARR, business model)
- [ ] **2.A.3** Shareable URL encoding home + targets + profile snapshot

#### B — Readiness engine

- [ ] **2.B.1** Readiness formula documented — weighted factors, e.g.:
  - Business climate delta (CNBC categories home vs target)
  - Tax burden change (Snapshot facts, qualitative → scored)
  - Regulatory complexity jump (`businessFriendliness` delta + Snapshot)
  - Talent availability (workforce + tech/innovation on target)
- [ ] **2.B.2** `src/scripts/expansionReadiness.js` — score 0–100 per target state
- [ ] **2.B.3** Friction labels: Low / Moderate / High expansion friction
- [ ] **2.B.4** Industry caveat copy where data is general (not licensing-specific): *"Based on general business climate and tax posture — not industry-specific licensing."*

#### C — Results UI

- [ ] **2.C.1** Results panel per target: Readiness %, friction badge, 3–5 bullet "what to know before you go"
- [ ] **2.C.2** Side-by-side home vs target category delta (reuse compare chart patterns)
- [ ] **2.C.3** Link to Founder Snapshot + Regulatory Pulse (Feature 5) when live
- [ ] **2.C.4** Share + optional print-friendly export

#### D — Integration

- [ ] **2.D.1** Entry point from state detail ("Expand from here") and compare page
- [ ] **2.D.2** Analytics events; disclaimers visible

### Exit criteria (Feature 2 done when)

- Marcus scenario (WA → CA + TX) produces differentiated scores with actionable bullets
- Formula traceable to CNBC + Snapshot; disclaimers present
- Shareable URL works on mobile

---

# Feature 3 — State Report Card

**Status:** Not started · **Depends on:** v1 state pages + movers data; richer with Feature 1 "Best for" tags and Feature 4 Lens labels

**Goal:** Every state gets a **beautiful, shareable one-page summary** — grade, trend, key stats, "Best for:" tags — drop-in ready for board decks and investor updates.

**Headline user story:** *"Drop the Texas report card into my Series A deck."* → VCs see StateCompass brand.

**Builds on v1:** `states/[slug].astro`, movers/YoY ranks, OG generation (`generate_og.py`), tier badges.

---

### Checkpoints

#### A — Content & data

- [ ] **3.A.1** Report card schema — overall grade (CNBC normalized + optional Lens grade), rank, tier, YoY trend arrow from movers
- [ ] **3.A.2** "Best for:" tags per state (e.g. *Bootstrapped SaaS, Low Tax Priority, Remote-First*) — rules-based from category strengths + Lens fit
- [ ] **3.A.3** Top 3 category strengths + bottom 2 on card; CNBC attribution + methodology link

#### B — Page & design

- [ ] **3.B.1** Route: `/states/[slug]/report-card` — print-optimized layout, single page
- [ ] **3.B.2** Visual design: clean typography (Sora + Inter), tier glow accents, trend ↑/↓, QR or link to statecompass.app
- [ ] **3.B.3** Print CSS + browser PDF export (same pattern as compare export)
- [ ] **3.B.4** Link from state detail page + map sidebar ("Download report card")

#### C — Share & generate

- [ ] **3.C.1** PNG/PDF generation at build time or on-demand for OG/sharing
- [ ] **3.C.2** OG preview for report card URLs
- [ ] **3.C.3** "Copy link" + analytics

### Exit criteria (Feature 3 done when)

- All 50 states have a report card route; print output is board-deck legible
- Trend arrow reflects movers data for current CNBC year pair
- At least 3 "Best for" tags on high-traffic states are sensible and defensible

---

# Feature 4 — Founder Lens

**Status:** Not started · **Depends on:** v1 Founder Fit (`founderFit.js`, 3 profiles); enhances Feature 1 when both live

**Goal:** Let founders toggle a **Founder Lens** that reweights rankings and compare for their context — not one-size-fits-all CNBC order.

**Headline user story:** *"Show me states for a VC-backed fintech, not generic overall rank."*

**Builds on v1:** `FounderFitSelector.astro`, `founder_fit_profiles.json`, rankings + compare + map sidebar.

---

### Checkpoints

#### A — Lens definitions

- [ ] **4.A.1** Extend `founder_fit_profiles.json` — add lenses:
  - **Bootstrapper** (tax, COL, business friendliness) — may merge/enhance existing bootstrapped profile
  - **VC-Backed** (ecosystem, talent, access to capital)
  - **Fintech** (business friendliness, infrastructure; Snapshot tax/regulatory proxies — labeled derived)
  - **Remote-First** (infrastructure/broadband, COL, talent; de-emphasize access to capital)
- [ ] **4.A.2** Document weights per lens; verify weight sums in CI
- [ ] **4.A.3** Rename UI copy: "Business profile" → **"Founder Lens"** where appropriate

#### B — Surfaces

- [ ] **4.B.1** Lens toggle on map sidebar, rankings, compare — persists in URL (`?lens=fintech`)
- [ ] **4.B.2** Map tier colors re-rank visually when lens changes (optional: re-color by lens rank)
- [ ] **4.B.3** Compare page: show Lens rank alongside CNBC overall rank
- [ ] **4.B.4** Rankings table: Lens mode vs Overall mode clearly labeled

#### C — Feature 1 integration

- [ ] **4.C.1** Quiz answers suggest default Lens (e.g. bootstrapping → Bootstrapper Lens)
- [ ] **4.C.2** Match engine can use Lens weights as starting point + quiz fine-tuning (document precedence)

### Exit criteria (Feature 4 done when)

- Four lenses produce visibly different top-10 states vs CNBC overall
- Compare + rankings + map stay in sync with URL param
- Disclaimer on every Lens view; CNBC scores unchanged underneath

---

# Feature 5 — Regulatory Pulse

**Status:** Not started · **Depends on:** v1 state pages; optional surfacing in Feature 1 sidebar and Feature 2 expansion results

**Goal:** Lightweight **sourced feed** of recent regulatory changes per state — the bridge from site *selection* to *operating* intelligence.

**Headline user story:** *"California — new data privacy amendment, effective Jan 2026. May affect SaaS handling consumer data."*

**Builds on v1:** Founder Snapshot sourcing patterns, state detail pages, disclaimer components.

---

### Checkpoints

#### A — Data layer

- [ ] **5.A.1** `data/regulatory_pulse.json` schema: `{ id, stateAbbr, title, summary, effectiveDate, industries[], sourceUrl, sourceLabel, publishedAt }`
- [ ] **5.A.2** Validation in `verify.py` — every item has source URL; dates ISO format
- [ ] **5.A.3** MVP corpus: hand-curated **50–100 high-impact items** across major states (CA, NY, TX, DE, WA, FL, IL, …)
- [ ] **5.A.4** Document curation process in `docs/DATA.md` — monthly update workflow (PR or CMS); stale items flagged

#### B — UI

- [ ] **5.B.1** `/pulse` index — filter by state, industry tag (SaaS, Fintech, …)
- [ ] **5.B.2** State detail section: "Regulatory Pulse" — latest 3–5 items for that state
- [ ] **5.B.3** Item card: title, one-line summary, effective date, source link, industry tags
- [ ] **5.B.4** Prominent disclaimer: informational only, not legal advice

#### C — Integration

- [ ] **5.C.1** Surface relevant Pulse items in Feature 2 expansion bullets when state pair matches
- [ ] **5.C.2** Optional email digest hook (future; ties to Feature 6 list)

### Exit criteria (Feature 5 done when)

- Pulse index + per-state sections live; every item links to official/reputable source
- At least 5 items each for CA, NY, TX, WA, FL
- No unsourced regulatory claims

---

# Feature 6 — Save My Profile + Return Sessions

**Status:** Not started · **Depends on:** Feature 1 quiz (primary profile source); enhanced by Feature 4 Lens

**Goal:** Lightweight profile (email + quiz/lens answers) so founders **return** to their personalized view — and you build an email list + segment data.

**Headline user story:** *"I took the quiz last week — open statecompass.app and my top 3 are waiting."*

**Builds on v1:** `memory.js` (localStorage), optional `EmailNotify.astro` (Buttondown pattern).

---

### Checkpoints

#### A — Profile model

- [ ] **6.A.1** Profile schema: email, quiz answers, default Lens, top 3 match snapshot, createdAt, updatedAt
- [ ] **6.A.2** Backend choice documented (e.g. Supabase, Convex, or magic-link + edge KV) — static Astro site + minimal API route or serverless
- [ ] **6.A.3** Privacy: no password MVP — magic link via email; clear privacy note on signup

#### B — Save flow

- [ ] **6.B.1** Post-quiz CTA: "Save my results" — email capture
- [ ] **6.B.2** Magic link email → `/me` or `/match?token=…` restores profile + results
- [ ] **6.B.3** Merge with localStorage saved states/comparisons where possible

#### C — Return experience

- [ ] **6.C.1** Logged-in/anonymous token session: homepage shows personalized top 3 + last Lens
- [ ] **6.C.2** "Update my answers" re-runs match; profile versioned or overwritten (document behavior)
- [ ] **6.C.3** Optional: notify when CNBC year or Pulse updates affect saved states

#### D — Ops & compliance

- [ ] **6.D.1** Unsubscribe / delete profile path
- [ ] **6.D.2** Analytics: profile created, return visit, quiz retake (no PII in event payloads)
- [ ] **6.D.3** Export segment counts for internal use (founder types, tax priority breakdown) — aggregate only

### Exit criteria (Feature 6 done when)

- User saves email after quiz, clicks magic link on another device, sees same top 3
- Profile persists Lens + quiz answers; re-take updates results
- GDPR-friendly delete + unsubscribe works

---

## Feature status tracker

| Feature | Status | Started | Shipped |
|---------|--------|---------|---------|
| 1 — Founder State Match | Not started | | |
| 2 — Expansion Readiness | Shipped | Jul 2026 | Jul 2026 |
| 3 — State Report Card | Not started | | |
| 4 — Founder Lens | Not started | | |
| 5 — Regulatory Pulse | Not started | | |
| 6 — Save My Profile | Not started | | |

Update this table as each feature ships.

---

## Architecture notes (2.0)

**Stay on Astro** for static pages; add serverless/API only where Feature 6 (and optional Pulse CMS) require it.

**New data files (expected):**

```
data/
  founder_match_weights.json   # Feature 1
  state_metros.json            # Feature 1 — State Focus Mode
  regulatory_pulse.json        # Feature 5
public/data/                   # copied or generated at build
```

**New scripts (expected):**

```
src/scripts/founderMatch.js    # Feature 1
src/scripts/stateFocus.js      # Feature 1 — zoom + metros
src/scripts/expansionReadiness.js  # Feature 2
```

**Scores rule:** CNBC JSON is never mutated in the browser for official ranks — derived layers read from it.

---

## v1 → 2.0 glossary

| Term | Meaning |
|------|---------|
| **Match %** | Feature 1 derived score — fit between quiz profile and state CNBC categories |
| **State Focus Mode** | Feature 1 map zoom + metro pins + profile-aware city highlight |
| **Readiness %** | Feature 2 derived score — expansion friction home → target |
| **Founder Lens** | Feature 4 reweighted ranking profile |
| **Report Card** | Feature 3 one-page state summary export |
| **Pulse** | Feature 5 regulatory change feed item |

---

*StateCompass 2.0 — July 2026. v1 preserved at `v1.0.0`.*
