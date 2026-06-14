"""Fetch CNBC per-state category scores from state ranking pages (one-time / refresh)."""

import argparse
import json
import re
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

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

YEAR_CONFIG = {
    2025: {
        "out_path": ROOT / "data" / "cnbc_categories.json",
        "max_scores": {
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
        },
        "url_templates": [
            "https://www.cnbc.com/2025/07/10/{slug}-top-states-for-business-ranking.html",
            "https://www.cnbc.com/2025/07/10/top-states-for-business-{slug}.html",
        ],
    },
    2024: {
        "out_path": ROOT / "data" / "cnbc_categories_2024.json",
        "max_scores": {
            "economy": 350,
            "infrastructure": 425,
            "workforce": 375,
            "costOfDoingBusiness": 275,
            "businessFriendliness": 250,
            "qualityOfLife": 325,
            "technologyAndInnovation": 250,
            "education": 125,
            "accessToCapital": 75,
            "costOfLiving": 50,
        },
        "url_templates": [
            "https://www.cnbc.com/2024/07/11/top-states-for-business-{slug}.html",
            "https://www.cnbc.com/2024/07/11/top-states-for-business-2024-{slug}.html",
            "https://www.cnbc.com/2024/07/11/{slug}-top-states-for-business-ranking.html",
        ],
    },
}


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def parse_page(html: str, max_scores: dict) -> dict:
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
                "maxScore": max_scores[key],
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


def fetch_state(abbr: str, name: str, config: dict, retries: int = 3) -> dict:
    slug = slugify(name)
    last_error = None
    for attempt in range(retries):
        for template in config["url_templates"]:
            url = template.format(slug=slug)
            try:
                req = urllib.request.Request(
                    url, headers={"User-Agent": "Mozilla/5.0 (compatible; StateCompass/1.0)"}
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    html = resp.read().decode("utf-8", errors="replace")
                parsed = parse_page(html, config["max_scores"])
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
        if attempt < retries - 1:
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"{abbr} ({name}): all URLs failed — {last_error}")


def main():
    parser = argparse.ArgumentParser(description="Fetch CNBC category scores for a given year.")
    parser.add_argument(
        "--year",
        type=int,
        default=2025,
        choices=sorted(YEAR_CONFIG.keys()),
        help="CNBC study year to fetch (default: 2025)",
    )
    args = parser.parse_args()
    config = YEAR_CONFIG[args.year]

    payload = {
        "source": f"CNBC {args.year} state ranking pages",
        "year": args.year,
        "states": {},
    }

    if config["out_path"].exists():
        existing = json.loads(config["out_path"].read_text(encoding="utf-8"))
        payload["states"] = existing.get("states", {})

    for abbr, name in STATES:
        if abbr in payload["states"]:
            print(f"Skipping {abbr} ({name}) — already fetched")
            continue
        print(f"Fetching {abbr} ({name})...")
        payload["states"][abbr] = fetch_state(abbr, name, config)
        config["out_path"].write_text(json.dumps(payload, indent=2), encoding="utf-8")
        time.sleep(1.0)

    config["out_path"].parent.mkdir(parents=True, exist_ok=True)
    config["out_path"].write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {config['out_path']}")


if __name__ == "__main__":
    main()
