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

profiles_path = ROOT / "public/data/founder_fit_profiles.json"
profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
profile_ids = set()

for profile in profiles["profiles"]:
    profile_id = profile["id"]
    assert profile_id not in profile_ids, profile_id
    profile_ids.add(profile_id)
    weights = profile["weights"]
    assert set(weights.keys()) == EXPECTED_CATEGORIES, profile_id
    weight_sum = sum(weights.values())
    assert abs(weight_sum - 1.0) < 1e-9, (profile_id, weight_sum)

    for abbr, state in data["states"].items():
        raw = 0.0
        for key in EXPECTED_CATEGORIES:
            cat = state["categories"][key]
            raw += (cat["score"] / cat["maxScore"]) * weights[key]
        score100 = round(raw * 100)
        assert 0 <= score100 <= 100, (profile_id, abbr, score100)

ranked_by_profile = {}
for profile in profiles["profiles"]:
    profile_id = profile["id"]
    weights = profile["weights"]
    entries = []
    for abbr, state in data["states"].items():
        raw = sum(
            (state["categories"][key]["score"] / state["categories"][key]["maxScore"]) * weights[key]
            for key in EXPECTED_CATEGORIES
        )
        entries.append((abbr, raw))
    entries.sort(key=lambda item: (-item[1], item[0]))
    ranks = {abbr: index + 1 for index, (abbr, _) in enumerate(entries)}
    ranked_by_profile[profile_id] = ranks

assert ranked_by_profile["tech"]["NC"] != data["states"]["NC"]["rank"], "tech profile should reorder NC"
assert ranked_by_profile["tech"] != {
    abbr: state["rank"] for abbr, state in data["states"].items()
}, "tech profile should change at least one rank"

print("OK: all 50 states aligned with category data")
print("OK: founder fit profiles validated")
