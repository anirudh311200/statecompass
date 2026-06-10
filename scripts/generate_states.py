import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_PATH = ROOT / "public" / "data" / "states.json"
LEGACY_OUT_PATH = ROOT / "data" / "states.json"
CNBC_DATA_PATH = ROOT / "data" / "cnbc_categories.json"

# CNBC America's Top States for Business 2025 — overall rankings
STATES = [
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

MAX_TOTAL_SCORE = 2500
METHODOLOGY_URL = (
    "https://www.cnbc.com/2025/06/11/"
    "how-we-are-choosing-americas-top-states-for-business-in-2025.html"
)

CATEGORY_META = {
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
}


def tier_for_rank(rank: int) -> str:
    if rank <= 17:
        return "green"
    if rank <= 34:
        return "yellow"
    return "red"


def slug_for_name(name: str) -> str:
    return name.lower().replace(" ", "-")


def load_cnbc_data() -> dict:
    if not CNBC_DATA_PATH.exists():
        raise FileNotFoundError(
            f"Missing {CNBC_DATA_PATH}. Run: python scripts/fetch_cnbc_categories.py"
        )
    return json.loads(CNBC_DATA_PATH.read_text(encoding="utf-8"))


def main():
    cnbc = load_cnbc_data()
    cnbc_states = cnbc["states"]

    raw_scores = [cnbc_states[abbr]["rawScore"] for abbr, _, _ in STATES]
    max_raw = max(raw_scores)
    min_raw = min(raw_scores)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "source": "CNBC America's Top States for Business",
        "year": 2025,
        "maxTotalScore": MAX_TOTAL_SCORE,
        "maxRawScore": max_raw,
        "minRawScore": min_raw,
        "methodologyUrl": METHODOLOGY_URL,
        "categories": {
            key: {"label": meta["label"], "maxScore": meta["maxScore"]}
            for key, meta in CATEGORY_META.items()
        },
        "tierBreakdown": {
            "green": "Ranks 1–17 — very favourable",
            "yellow": "Ranks 18–34 — moderate",
            "red": "Ranks 35–50 — less favourable",
        },
        "states": {},
    }

    for abbr, name, rank in STATES:
        entry = cnbc_states.get(abbr)
        if not entry:
            raise KeyError(f"Missing CNBC category data for {abbr}")

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

    json_text = json.dumps(payload, indent=2)
    OUT_PATH.write_text(json_text, encoding="utf-8")
    LEGACY_OUT_PATH.write_text(json_text, encoding="utf-8")
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
