import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "public" / "data" / "states.json"
OUT_DIR = ROOT / "public" / "og"

TIER_COLORS = {
    "green": "#22c55e",
    "yellow": "#eab308",
    "red": "#ef4444",
}

TAGLINE = "Site selection for founders"


def card_shell(year: int, eyebrow: str, title: str, subtitle: str, accent: str = "#737373") -> str:
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0e0e0e" stroke="#262626"/>
  <text x="96" y="180" fill="#737373" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC {year}</text>
  <text x="96" y="280" fill="#f5f5f5" font-family="system-ui,sans-serif" font-size="72" font-weight="700">{title}</text>
  <text x="96" y="360" fill="{accent}" font-family="system-ui,sans-serif" font-size="40" font-weight="600">{subtitle}</text>
  <text x="96" y="500" fill="#737373" font-family="system-ui,sans-serif" font-size="24">{TAGLINE}</text>
</svg>"""


def state_card(state: dict, year: int) -> str:
    color = TIER_COLORS.get(state["tier"], "#737373")
    bar_width = max(12, int(state["score100"] * 4.2))
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0e0e0e" stroke="#262626"/>
  <text x="96" y="180" fill="#737373" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC {year}</text>
  <text x="96" y="280" fill="#f5f5f5" font-family="system-ui,sans-serif" font-size="72" font-weight="700">{state["name"]}</text>
  <text x="96" y="360" fill="{color}" font-family="system-ui,sans-serif" font-size="48" font-weight="600">Rank #{state["rank"]} · Score {state["score100"]}/100</text>
  <rect x="96" y="400" width="420" height="12" rx="6" fill="#262626"/>
  <rect x="96" y="400" width="{bar_width}" height="12" rx="6" fill="{color}"/>
  <text x="96" y="500" fill="#737373" font-family="system-ui,sans-serif" font-size="24">{TAGLINE}</text>
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
            accent="#22c55e",
        ),
        encoding="utf-8",
    )

    count = len(payload["states"]) + 2
    print(f"Wrote {count} OG images to {OUT_DIR}")


if __name__ == "__main__":
    main()
