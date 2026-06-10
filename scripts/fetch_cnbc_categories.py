"""One-time fetch of CNBC 2025 per-state category scores from state ranking pages."""

import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "data" / "cnbc_categories.json"

STATES = [
    ("NC", "North Carolina"),
    ("TX", "Texas"),
    ("FL", "Florida"),
    ("VA", "Virginia"),
    ("OH", "Ohio"),
    ("MI", "Michigan"),
    ("GA", "Georgia"),
    ("TN", "Tennessee"),
    ("IN", "Indiana"),
    ("MN", "Minnesota"),
    ("CO", "Colorado"),
    ("AZ", "Arizona"),
    ("IL", "Illinois"),
    ("WA", "Washington"),
    ("NE", "Nebraska"),
    ("UT", "Utah"),
    ("PA", "Pennsylvania"),
    ("SC", "South Carolina"),
    ("AL", "Alabama"),
    ("MA", "Massachusetts"),
    ("WI", "Wisconsin"),
    ("CA", "California"),
    ("NY", "New York"),
    ("IA", "Iowa"),
    ("KY", "Kentucky"),
    ("ND", "North Dakota"),
    ("ID", "Idaho"),
    ("CT", "Connecticut"),
    ("DE", "Delaware"),
    ("NJ", "New Jersey"),
    ("WY", "Wyoming"),
    ("MD", "Maryland"),
    ("KS", "Kansas"),
    ("MO", "Missouri"),
    ("SD", "South Dakota"),
    ("NH", "New Hampshire"),
    ("OK", "Oklahoma"),
    ("VT", "Vermont"),
    ("OR", "Oregon"),
    ("WV", "West Virginia"),
    ("AR", "Arkansas"),
    ("NV", "Nevada"),
    ("ME", "Maine"),
    ("NM", "New Mexico"),
    ("MS", "Mississippi"),
    ("LA", "Louisiana"),
    ("RI", "Rhode Island"),
    ("MT", "Montana"),
    ("HI", "Hawaii"),
    ("AK", "Alaska"),
]

CATEGORY_MAP = {
    "ECONOMY": "economy",
    "INFRASTRUCTURE": "infrastructure",
    "WORKFORCE": "workforce",
    "COST OF DOING BUSINESS": "costOfDoingBusiness",
    "BUSINESS FRIENDLINESS": "businessFriendliness",
    "QUALITY OF LIFE": "qualityOfLife",
    "TECHNOLOGY & INNOVATION": "technologyAndInnovation",
    "EDUCATION": "education",
    "ACCESS TO CAPITAL": "accessToCapital",
    "COST OF LIVING": "costOfLiving",
}

MAX_SCORES = {
    "economy": 445,
    "infrastructure": 405,
    "workforce": 335,
    "costOfDoingBusiness": 295,
    "businessFriendliness": 270,
    "qualityOfLife": 265,
    "technologyAndInnovation": 255,
    "education": 110,
    "accessToCapital": 60,
    "costOfLiving": 60,
}


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def ranking_urls(name: str) -> list[str]:
    slug = slugify(name)
    return [
        f"https://www.cnbc.com/2025/07/10/{slug}-top-states-for-business-ranking.html",
        f"https://www.cnbc.com/2025/07/10/top-states-for-business-{slug}.html",
    ]


def parse_page(html: str) -> dict:
    categories = {}
    overall = None

    for category_label, key in CATEGORY_MAP.items():
        pattern = (
            rf"{re.escape(category_label)}</td>"
            rf'<td class="BasicTable-numData">(\d+)</td>'
            rf'<td class="BasicTable-numData">(\d+)</td>'
        )
        match = re.search(pattern, html, re.IGNORECASE)
        if match:
            categories[key] = {
                "score": int(match.group(1)),
                "maxScore": MAX_SCORES[key],
                "rank": int(match.group(2)),
            }

    overall_match = re.search(
        r"OVERALL</td><td class=\"BasicTable-numData\">(\d+)</td>"
        r"<td class=\"BasicTable-numData\">(\d+)</td>",
        html,
        re.IGNORECASE,
    )
    if overall_match:
        overall = int(overall_match.group(1))

    return {"categories": categories, "rawScore": overall}


def fetch_state(abbr: str, name: str) -> dict:
    last_error = None
    for url in ranking_urls(name):
        try:
            req = urllib.request.Request(
                url, headers={"User-Agent": "Mozilla/5.0 (compatible; StateCompass/1.0)"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                html = resp.read().decode("utf-8", errors="replace")
            parsed = parse_page(html)
            if len(parsed["categories"]) != 10:
                raise ValueError(
                    f"{abbr}: expected 10 categories, got {len(parsed['categories'])}"
                )
            if parsed["rawScore"] is None:
                raise ValueError(f"{abbr}: missing overall score")
            return parsed
        except Exception as exc:
            last_error = exc
            continue
    raise RuntimeError(f"{abbr} ({name}): all URLs failed — {last_error}")


def main():
    payload = {"source": "CNBC 2025 state ranking pages", "states": {}}

    for abbr, name in STATES:
        print(f"Fetching {abbr} ({name})...")
        payload["states"][abbr] = fetch_state(abbr, name)
        time.sleep(0.5)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
