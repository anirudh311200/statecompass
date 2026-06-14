import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "public" / "data"
LEGACY_OUT_PATH = ROOT / "data" / "states.json"

MAX_TOTAL_SCORE = 2500
DEFAULT_YEAR = 2025

STATES_2025 = [
    ("NC", "North Carolina", 1),
    ("TX", "Texas", 2),
    ("FL", "Florida", 3),
    ("VA", "Virginia", 4),
    ("OH", "Ohio", 5),
    ("MI", "Michigan", 6),
    ("GA", "Georgia", 7),
    ("TN", "Tennessee", 8),
    ("IN", "Indiana", 9),
    ("MN", "Minnesota", 10),
    ("CO", "Colorado", 11),
    ("AZ", "Arizona", 12),
    ("IL", "Illinois", 13),
    ("WA", "Washington", 14),
    ("NE", "Nebraska", 15),
    ("UT", "Utah", 16),
    ("PA", "Pennsylvania", 17),
    ("SC", "South Carolina", 18),
    ("AL", "Alabama", 19),
    ("MA", "Massachusetts", 20),
    ("WI", "Wisconsin", 21),
    ("CA", "California", 22),
    ("NY", "New York", 23),
    ("IA", "Iowa", 24),
    ("KY", "Kentucky", 25),
    ("ND", "North Dakota", 25),
    ("ID", "Idaho", 27),
    ("CT", "Connecticut", 28),
    ("DE", "Delaware", 29),
    ("NJ", "New Jersey", 30),
    ("WY", "Wyoming", 31),
    ("MD", "Maryland", 32),
    ("KS", "Kansas", 33),
    ("MO", "Missouri", 34),
    ("SD", "South Dakota", 35),
    ("NH", "New Hampshire", 36),
    ("OK", "Oklahoma", 37),
    ("VT", "Vermont", 38),
    ("OR", "Oregon", 39),
    ("WV", "West Virginia", 40),
    ("AR", "Arkansas", 41),
    ("NV", "Nevada", 42),
    ("ME", "Maine", 43),
    ("NM", "New Mexico", 44),
    ("MS", "Mississippi", 45),
    ("LA", "Louisiana", 46),
    ("RI", "Rhode Island", 46),
    ("MT", "Montana", 48),
    ("HI", "Hawaii", 49),
    ("AK", "Alaska", 50),
]

STATES_2024 = [
    ("VA", "Virginia", 1),
    ("NC", "North Carolina", 2),
    ("TX", "Texas", 3),
    ("GA", "Georgia", 4),
    ("FL", "Florida", 5),
    ("MN", "Minnesota", 6),
    ("OH", "Ohio", 7),
    ("TN", "Tennessee", 8),
    ("MI", "Michigan", 9),
    ("WA", "Washington", 10),
    ("IN", "Indiana", 11),
    ("AZ", "Arizona", 12),
    ("UT", "Utah", 13),
    ("IA", "Iowa", 14),
    ("IL", "Illinois", 15),
    ("CO", "Colorado", 16),
    ("PA", "Pennsylvania", 17),
    ("MO", "Missouri", 18),
    ("SC", "South Carolina", 19),
    ("AL", "Alabama", 20),
    ("WI", "Wisconsin", 21),
    ("NY", "New York", 22),
    ("CA", "California", 23),
    ("NE", "Nebraska", 24),
    ("NJ", "New Jersey", 25),
    ("OK", "Oklahoma", 26),
    ("KY", "Kentucky", 27),
    ("OR", "Oregon", 28),
    ("KS", "Kansas", 29),
    ("WY", "Wyoming", 30),
    ("MD", "Maryland", 31),
    ("CT", "Connecticut", 32),
    ("SD", "South Dakota", 33),
    ("DE", "Delaware", 34),
    ("ND", "North Dakota", 34),
    ("ID", "Idaho", 36),
    ("VT", "Vermont", 37),
    ("MA", "Massachusetts", 38),
    ("NV", "Nevada", 39),
    ("WV", "West Virginia", 40),
    ("NH", "New Hampshire", 41),
    ("ME", "Maine", 42),
    ("NM", "New Mexico", 43),
    ("RI", "Rhode Island", 44),
    ("AR", "Arkansas", 45),
    ("MT", "Montana", 46),
    ("LA", "Louisiana", 47),
    ("AK", "Alaska", 48),
    ("MS", "Mississippi", 49),
    ("HI", "Hawaii", 50),
]

YEAR_CONFIG = {
    2025: {
        "cnbc_path": ROOT / "data" / "cnbc_categories.json",
        "states": STATES_2025,
        "methodology_url": (
            "https://www.cnbc.com/2025/06/11/"
            "how-we-are-choosing-americas-top-states-for-business-in-2025.html"
        ),
        "rankings_url": (
            "https://www.cnbc.com/2025/07/10/"
            "top-states-for-business-americas-2025-the-full-rankings.html"
        ),
        "published_at": "2025-07-10",
        "changelog": (
            "CNBC 2025 rankings ingested — North Carolina #1 overall; "
            "Virginia climbs to #4 from #1 in 2024."
        ),
        "category_meta": {
            "economy": {"label": "Economy", "maxScore": 445},
            "infrastructure": {"label": "Infrastructure", "maxScore": 405},
            "workforce": {"label": "Workforce", "maxScore": 335},
            "costOfDoingBusiness": {"label": "Cost of Doing Business", "maxScore": 295},
            "businessFriendliness": {"label": "Business Friendliness", "maxScore": 270},
            "qualityOfLife": {"label": "Quality of Life", "maxScore": 265},
            "technologyAndInnovation": {"label": "Technology & Innovation", "maxScore": 255},
            "education": {"label": "Education", "maxScore": 110},
            "accessToCapital": {"label": "Access to Capital", "maxScore": 60},
            "costOfLiving": {"label": "Cost of Living", "maxScore": 60},
        },
    },
    2024: {
        "cnbc_path": ROOT / "data" / "cnbc_categories_2024.json",
        "states": STATES_2024,
        "methodology_url": (
            "https://www.cnbc.com/2024/06/13/"
            "how-we-are-choosing-americas-top-states-for-business-2024.html"
        ),
        "rankings_url": (
            "https://www.cnbc.com/2024/07/11/"
            "americas-top-states-for-business-full-rankings.html"
        ),
        "published_at": "2024-07-11",
        "changelog": (
            "CNBC 2024 rankings archived — Virginia #1 overall; "
            "North Carolina runner-up at #2."
        ),
        "category_meta": {
            "economy": {"label": "Economy", "maxScore": 350},
            "infrastructure": {"label": "Infrastructure", "maxScore": 425},
            "workforce": {"label": "Workforce", "maxScore": 375},
            "costOfDoingBusiness": {"label": "Cost of Doing Business", "maxScore": 275},
            "businessFriendliness": {"label": "Business Friendliness", "maxScore": 250},
            "qualityOfLife": {"label": "Quality of Life", "maxScore": 325},
            "technologyAndInnovation": {"label": "Technology & Innovation", "maxScore": 250},
            "education": {"label": "Education", "maxScore": 125},
            "accessToCapital": {"label": "Access to Capital", "maxScore": 75},
            "costOfLiving": {"label": "Cost of Living", "maxScore": 50},
        },
    },
}


def tier_for_rank(rank: int) -> str:
    if rank <= 17:
        return "green"
    if rank <= 34:
        return "yellow"
    return "red"


def slug_for_name(name: str) -> str:
    return name.lower().replace(" ", "-")


def load_cnbc_data(path: Path) -> dict:
    if not path.exists():
        raise FileNotFoundError(f"Missing {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def build_year_payload(year: int, config: dict) -> dict:
    cnbc = load_cnbc_data(config["cnbc_path"])
    cnbc_states = cnbc["states"]
    states_list = config["states"]
    category_meta = config["category_meta"]

    raw_scores = [cnbc_states[abbr]["rawScore"] for abbr, _, _ in states_list]
    max_raw = max(raw_scores)
    min_raw = min(raw_scores)

    payload = {
        "source": "CNBC America's Top States for Business",
        "year": year,
        "maxTotalScore": MAX_TOTAL_SCORE,
        "maxRawScore": max_raw,
        "minRawScore": min_raw,
        "methodologyUrl": config["methodology_url"],
        "rankingsUrl": config["rankings_url"],
        "categories": {
            key: {"label": meta["label"], "maxScore": meta["maxScore"]}
            for key, meta in category_meta.items()
        },
        "tierBreakdown": {
            "green": "Ranks 1–17 — very favourable",
            "yellow": "Ranks 18–34 — moderate",
            "red": "Ranks 35–50 — less favourable",
        },
        "states": {},
    }

    for abbr, name, rank in states_list:
        entry = cnbc_states.get(abbr)
        if not entry:
            raise KeyError(f"Missing CNBC category data for {abbr} ({year})")

        raw = entry["rawScore"]
        payload["states"][abbr] = {
            "name": name,
            "slug": slug_for_name(name),
            "rank": rank,
            "rawScore": raw,
            "score100": round(raw / max_raw * 100),
            "tier": tier_for_rank(rank),
            "categories": entry["categories"],
        }

    return payload


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    available_years = sorted(YEAR_CONFIG.keys(), reverse=True)

    index_payload = {
        "defaultYear": DEFAULT_YEAR,
        "availableYears": available_years,
        "rankingsUrls": {
            str(year): YEAR_CONFIG[year]["rankings_url"] for year in available_years
        },
        "methodologyUrls": {
            str(year): YEAR_CONFIG[year]["methodology_url"] for year in available_years
        },
        "changelog": [
            {
                "year": year,
                "publishedAt": YEAR_CONFIG[year]["published_at"],
                "message": YEAR_CONFIG[year]["changelog"],
            }
            for year in available_years
        ],
    }

    latest_payload = None
    for year in available_years:
        payload = build_year_payload(year, YEAR_CONFIG[year])
        year_path = DATA_DIR / f"states-{year}.json"
        year_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        print(f"Wrote {year_path}")
        if year == DEFAULT_YEAR:
            latest_payload = payload

    index_path = DATA_DIR / "states-index.json"
    index_path.write_text(json.dumps(index_payload, indent=2), encoding="utf-8")
    print(f"Wrote {index_path}")

    if latest_payload:
        legacy_text = json.dumps(latest_payload, indent=2)
        legacy_path = DATA_DIR / "states.json"
        legacy_path.write_text(legacy_text, encoding="utf-8")
        LEGACY_OUT_PATH.write_text(legacy_text, encoding="utf-8")
        print(f"Wrote {legacy_path}")


if __name__ == "__main__":
    main()
