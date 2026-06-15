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

    for state in payload["states"].values():
        (OUT_DIR / f"{state['slug']}.svg").write_text(state_card(state, year), encoding="utf-8")

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

    count = len(payload["states"]) + 2
    print(f"Wrote {count} OG images to {OUT_DIR}")


if __name__ == "__main__":
    main()
