import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from brand_mark import og_watermark  # noqa: E402
DATA_PATH = ROOT / "public" / "data" / "states.json"
OUT_DIR = ROOT / "public" / "og"

TIER_TEXT = {
    "green": "#86efac",
    "yellow": "#fde68a",
    "red": "#fca5a5",
}

TIER_GRADIENTS = {
    "green": ("og-tier-green", "#86efac", "0.75", "#22c55e", "0.35"),
    "yellow": ("og-tier-yellow", "#fde68a", "0.7", "#eab308", "0.32"),
    "red": ("og-tier-red", "#fca5a5", "0.65", "#ef4444", "0.28"),
}

TAGLINE = "Site selection for founders"


def tier_defs(tier: str) -> str:
    grad_id, hi, hi_op, lo, lo_op = TIER_GRADIENTS.get(
        tier, ("og-tier-neutral", "#a3a3a3", "0.5", "#525252", "0.25")
    )
    return f"""<defs>
    <linearGradient id="{grad_id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{hi}" stop-opacity="{hi_op}"/>
      <stop offset="100%" stop-color="{lo}" stop-opacity="{lo_op}"/>
    </linearGradient>
  </defs>"""


def card_shell(year: int, eyebrow: str, title: str, subtitle: str, accent: str = "#86efac") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#000000"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0a0a0a" stroke="#1a1a1a"/>
  <text x="96" y="180" fill="#888888" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC {year}</text>
  <text x="96" y="280" fill="#fafafa" font-family="system-ui,sans-serif" font-size="72" font-weight="700">{title}</text>
  <text x="96" y="360" fill="{accent}" font-family="system-ui,sans-serif" font-size="40" font-weight="600">{subtitle}</text>
  <text x="96" y="500" fill="#888888" font-family="system-ui,sans-serif" font-size="24">{TAGLINE}</text>
  {og_watermark()}
</svg>"""


def report_card_og(state: dict, year: int, prior_year: int | None, prior_rank: int | None) -> str:
    tier = state.get("tier", "yellow")
    text_color = TIER_TEXT.get(tier, "#a3a3a3")
    grad_id = TIER_GRADIENTS.get(tier, TIER_GRADIENTS["yellow"])[0]
    bar_width = max(12, int(state["score100"] * 4.2))

    trend_line = ""
    if prior_year and prior_rank is not None:
        delta = prior_rank - state["rank"]
        if delta > 0:
            direction = "up"
            trend_text = f"↑ +{delta} since CNBC {prior_year}"
            trend_color = "#86efac"
        elif delta < 0:
            direction = "down"
            trend_text = f"↓ {delta} since CNBC {prior_year}"
            trend_color = "#fca5a5"
        else:
            direction = "flat"
            trend_text = f"→ Unchanged since CNBC {prior_year}"
            trend_color = "#a3a3a3"
        trend_line = (
            f'<text x="96" y="440" fill="{trend_color}" '
            f'font-family="system-ui,sans-serif" font-size="32" font-weight="600">'
            f"{trend_text}</text>"
        )

    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  {tier_defs(tier)}
  <rect width="1200" height="630" fill="#000000"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0a0a0a" stroke="#1a1a1a"/>
  <text x="96" y="150" fill="#888888" font-family="system-ui,sans-serif" font-size="26">StateCompass · Report Card · CNBC {year}</text>
  <text x="96" y="250" fill="#fafafa" font-family="system-ui,sans-serif" font-size="68" font-weight="700">{state["name"]}</text>
  <text x="96" y="340" fill="{text_color}" font-family="system-ui,sans-serif" font-size="44" font-weight="600">Rank #{state["rank"]} · Score {state["score100"]}/100</text>
  <rect x="96" y="370" width="420" height="12" rx="6" fill="#1a1a1a"/>
  <rect x="96" y="370" width="{bar_width}" height="12" rx="6" fill="url(#{grad_id})"/>
  {trend_line}
  <text x="96" y="520" fill="#888888" font-family="system-ui,sans-serif" font-size="24">{TAGLINE}</text>
  {og_watermark()}
</svg>"""


def state_card(state: dict, year: int) -> str:
    tier = state.get("tier", "yellow")
    text_color = TIER_TEXT.get(tier, "#a3a3a3")
    grad_id = TIER_GRADIENTS.get(tier, TIER_GRADIENTS["yellow"])[0]
    bar_width = max(12, int(state["score100"] * 4.2))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  {tier_defs(tier)}
  <rect width="1200" height="630" fill="#000000"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0a0a0a" stroke="#1a1a1a"/>
  <text x="96" y="180" fill="#888888" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC {year}</text>
  <text x="96" y="280" fill="#fafafa" font-family="system-ui,sans-serif" font-size="72" font-weight="700">{state["name"]}</text>
  <text x="96" y="360" fill="{text_color}" font-family="system-ui,sans-serif" font-size="48" font-weight="600">Rank #{state["rank"]} · Score {state["score100"]}/100</text>
  <rect x="96" y="400" width="420" height="12" rx="6" fill="#1a1a1a"/>
  <rect x="96" y="400" width="{bar_width}" height="12" rx="6" fill="url(#{grad_id})"/>
  <text x="96" y="500" fill="#888888" font-family="system-ui,sans-serif" font-size="24">{TAGLINE}</text>
  {og_watermark()}
</svg>"""


def main():
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    year = payload.get("year", 2025)
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    index_path = ROOT / "public" / "data" / "states-index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else {}
    available = sorted(index.get("availableYears", [year]))
    prior_year = available[available.index(year) - 1] if year in available and available.index(year) > 0 else None

    prior_payload = None
    if prior_year:
        prior_path = ROOT / "public" / "data" / f"states-{prior_year}.json"
        if prior_path.exists():
            prior_payload = json.loads(prior_path.read_text(encoding="utf-8"))

    for abbr, state in payload["states"].items():
        (OUT_DIR / f"{state['slug']}.svg").write_text(state_card(state, year), encoding="utf-8")

        prior_rank = None
        if prior_payload and abbr in prior_payload.get("states", {}):
            prior_rank = prior_payload["states"][abbr]["rank"]
        (OUT_DIR / f"{state['slug']}-report-card.svg").write_text(
            report_card_og(state, year, prior_year, prior_rank),
            encoding="utf-8",
        )

    (OUT_DIR / "default.svg").write_text(
        card_shell(
            year,
            "StateCompass",
            "Compare states",
            "CNBC rankings for founders",
        ),
        encoding="utf-8",
    )

    (OUT_DIR / "compare.svg").write_text(
        card_shell(
            year,
            "StateCompass",
            "Compare states",
            "Side-by-side CNBC scores · shareable link",
            accent="#86efac",
        ),
        encoding="utf-8",
    )

    (OUT_DIR / "match.svg").write_text(
        card_shell(
            year,
            "Founder State Match",
            "Your top 3 states",
            "Personalized match % · CNBC category data",
            accent="#fde68a",
        ),
        encoding="utf-8",
    )

    (OUT_DIR / "expand.svg").write_text(
        card_shell(
            year,
            "Expansion Readiness",
            "Expansion readiness",
            "Home state → target · friction scores",
            accent="#86efac",
        ),
        encoding="utf-8",
    )

    (OUT_DIR / "pulse.svg").write_text(
        card_shell(
            year,
            "Regulatory Pulse",
            "Regulatory Pulse",
            "Sourced regulatory updates by state",
            accent="#fde68a",
        ),
        encoding="utf-8",
    )

    count = len(payload["states"]) * 2 + 5
    print(f"Wrote {count} OG images to {OUT_DIR}")


if __name__ == "__main__":
    main()
