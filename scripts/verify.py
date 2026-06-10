import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "public/data/states.json").read_text(encoding="utf-8"))
svg = (ROOT / "public/assets/us-map.svg").read_text(encoding="utf-8")
ids = set(re.findall(r'id="([A-Z]{2})"', svg))
json_ids = set(data["states"].keys())

EXPECTED_CATEGORIES = {
    "economy",
    "infrastructure",
    "workforce",
    "costOfDoingBusiness",
    "businessFriendliness",
    "qualityOfLife",
    "technologyAndInnovation",
    "education",
    "accessToCapital",
    "costOfLiving",
}

assert len(json_ids) == 50, len(json_ids)
assert json_ids == ids, (json_ids - ids, ids - json_ids)
assert data["states"]["NC"]["rank"] == 1
assert data["states"]["AK"]["rank"] == 50
assert data["maxTotalScore"] == 2500
assert set(data["categories"].keys()) == EXPECTED_CATEGORIES

slugs = set()
for abbr, state in data["states"].items():
    assert "slug" in state, abbr
    assert state["slug"] == state["name"].lower().replace(" ", "-"), abbr
    assert state["slug"] not in slugs, state["slug"]
    slugs.add(state["slug"])
    assert "categories" in state, abbr
    assert set(state["categories"].keys()) == EXPECTED_CATEGORIES, abbr
    category_sum = 0
    for key, cat in state["categories"].items():
        assert 1 <= cat["rank"] <= 50, (abbr, key, cat["rank"])
        assert 0 <= cat["score"] <= cat["maxScore"], (abbr, key, cat)
        assert cat["maxScore"] == data["categories"][key]["maxScore"], (abbr, key)
        category_sum += cat["score"]
    assert category_sum == state["rawScore"], (abbr, category_sum, state["rawScore"])

print("OK: all 50 states aligned with category data")
