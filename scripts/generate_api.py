"""Generate public API v1 static JSON exports (same data as public/data, with API metadata)."""

from __future__ import annotations

import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
API_DIR = ROOT / "public" / "api" / "v1"
SITE_URL = "https://statecompass.app"


def wrap_payload(payload: dict) -> dict:
    return {
        "apiVersion": "1",
        "documentation": f"{SITE_URL}/partners#api",
        "attribution": "Scores from CNBC America's Top States for Business. Do not remove attribution when republishing.",
        **payload,
    }


def write_state_files(states: dict, year: int) -> None:
    state_dir = API_DIR / "state"
    state_dir.mkdir(parents=True, exist_ok=True)

    for abbr, state in states.items():
        out = {
            "apiVersion": "1",
            "documentation": f"{SITE_URL}/partners#api",
            "year": year,
            "abbreviation": abbr,
            "state": state,
        }
        path = state_dir / f"{abbr}.json"
        path.write_text(json.dumps(out, indent=2), encoding="utf-8")


def main() -> None:
    API_DIR.mkdir(parents=True, exist_ok=True)

    index = json.loads((DATA_DIR / "states-index.json").read_text(encoding="utf-8"))
    default_payload = json.loads((DATA_DIR / "states.json").read_text(encoding="utf-8"))

    (API_DIR / "states.json").write_text(
        json.dumps(wrap_payload(default_payload), indent=2),
        encoding="utf-8",
    )

    shutil.copy2(DATA_DIR / "states-index.json", API_DIR / "states-index.json")

    for year in index.get("availableYears", []):
        year_path = DATA_DIR / f"states-{year}.json"
        if not year_path.exists():
            continue
        year_payload = json.loads(year_path.read_text(encoding="utf-8"))
        (API_DIR / f"states-{year}.json").write_text(
            json.dumps(wrap_payload(year_payload), indent=2),
            encoding="utf-8",
        )
        write_state_files(year_payload.get("states", {}), year)

    discovery = {
        "apiVersion": "1",
        "name": "StateCompass Public API",
        "documentation": f"{SITE_URL}/partners#api",
        "attribution": "CNBC America's Top States for Business — required on all republished scores.",
        "endpoints": {
            "index": "/api/v1/index.json",
            "statesDefaultYear": "/api/v1/states.json",
            "statesByYear": "/api/v1/states-{year}.json",
            "statesIndex": "/api/v1/states-index.json",
            "singleState": "/api/v1/state/{ABBR}.json",
            "compareEmbed": "/embed/compare?states=TX,NC,FL",
            "comparePage": "/compare?states=TX,NC,FL",
        },
        "compare": {
            "description": "Fetch two or three state objects and compare client-side, or link to the compare page.",
            "example": f"{SITE_URL}/compare?states=TX,NC,FL",
            "statesField": "Use /api/v1/states.json and read the `states` object keyed by abbreviation.",
        },
        "availableYears": index.get("availableYears", []),
        "defaultYear": index.get("defaultYear"),
        "cors": "Access-Control-Allow-Origin: * on /api/v1/*",
        "rateLimit": "Static JSON — CDN cached; no authentication required.",
    }

    (API_DIR / "index.json").write_text(json.dumps(discovery, indent=2), encoding="utf-8")
    print(f"Wrote API exports to {API_DIR}")


if __name__ == "__main__":
    main()
