import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_PATH = ROOT / "public/data/states-index.json"
index = json.loads(INDEX_PATH.read_text(encoding="utf-8"))
available_years = index["availableYears"]
default_year = index["defaultYear"]

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

svg = (ROOT / "public/assets/us-map.svg").read_text(encoding="utf-8")
map_ids = set(re.findall(r'id="([A-Z]{2})"', svg))

year_payloads = {}
for year in available_years:
    path = ROOT / f"public/data/states-{year}.json"
    payload = json.loads(path.read_text(encoding="utf-8"))
    year_payloads[year] = payload

    json_ids = set(payload["states"].keys())
    assert len(json_ids) == 50, (year, len(json_ids))
    assert json_ids == map_ids, (year, json_ids - map_ids, map_ids - json_ids)
    assert payload["maxTotalScore"] == 2500, year
    assert set(payload["categories"].keys()) == EXPECTED_CATEGORIES, year

    slugs = set()
    for abbr, state in payload["states"].items():
        assert "slug" in state, (year, abbr)
        assert state["slug"] == state["name"].lower().replace(" ", "-"), (year, abbr)
        assert state["slug"] not in slugs, (year, state["slug"])
        slugs.add(state["slug"])
        assert set(state["categories"].keys()) == EXPECTED_CATEGORIES, (year, abbr)
        category_sum = 0
        for key, cat in state["categories"].items():
            assert 1 <= cat["rank"] <= 50, (year, abbr, key, cat["rank"])
            assert 0 <= cat["score"] <= cat["maxScore"], (year, abbr, key, cat)
            assert cat["maxScore"] == payload["categories"][key]["maxScore"], (year, abbr, key)
            category_sum += cat["score"]
        assert category_sum == state["rawScore"], (year, abbr, category_sum, state["rawScore"])

assert default_year in available_years
assert len(index["changelog"]) == len(available_years)
for entry in index["changelog"]:
    assert entry["year"] in available_years
    assert entry["message"].strip()
    assert entry["publishedAt"]

# Legacy states.json matches default year
legacy = json.loads((ROOT / "public/data/states.json").read_text(encoding="utf-8"))
assert legacy["year"] == default_year
assert legacy["states"].keys() == year_payloads[default_year]["states"].keys()

# YoY: every state appears in all years with valid ranks
if len(available_years) >= 2:
    years_sorted = sorted(available_years)
    prior_year = years_sorted[-2]
    current_year = years_sorted[-1]
    prior_states = year_payloads[prior_year]["states"]
    current_states = year_payloads[current_year]["states"]
    assert prior_states.keys() == current_states.keys()
    movers = []
    for abbr in prior_states:
        delta = prior_states[abbr]["rank"] - current_states[abbr]["rank"]
        movers.append((abbr, delta))
    assert any(delta != 0 for _, delta in movers), "YoY should show rank movement"

profiles_path = ROOT / "public/data/founder_fit_profiles.json"
profiles = json.loads(profiles_path.read_text(encoding="utf-8"))
profile_ids = set()
default_data = year_payloads[default_year]

for profile in profiles["profiles"]:
    profile_id = profile["id"]
    assert profile_id not in profile_ids, profile_id
    profile_ids.add(profile_id)
    weights = profile["weights"]
    assert set(weights.keys()) == EXPECTED_CATEGORIES, profile_id
    weight_sum = sum(weights.values())
    assert abs(weight_sum - 1.0) < 1e-9, (profile_id, weight_sum)

    for abbr, state in default_data["states"].items():
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
    for abbr, state in default_data["states"].items():
        raw = sum(
            (state["categories"][key]["score"] / state["categories"][key]["maxScore"]) * weights[key]
            for key in EXPECTED_CATEGORIES
        )
        entries.append((abbr, raw))
    entries.sort(key=lambda item: (-item[1], item[0]))
    ranks = {abbr: index + 1 for index, (abbr, _) in enumerate(entries)}
    ranked_by_profile[profile_id] = ranks

assert ranked_by_profile["vc-backed"]["NC"] != default_data["states"]["NC"]["rank"]
assert ranked_by_profile["vc-backed"] != {
    abbr: state["rank"] for abbr, state in default_data["states"].items()
}

cnbc_top10 = {
    abbr
    for abbr, _ in sorted(
        ((abbr, state["rank"]) for abbr, state in default_data["states"].items()),
        key=lambda item: item[1],
    )[:10]
}

for lens_id in ("bootstrapper", "vc-backed", "fintech", "remote-first"):
    lens_top10 = {
        abbr
        for abbr, _ in sorted(
            ranked_by_profile[lens_id].items(), key=lambda item: item[1]
        )[:10]
    }
    assert lens_top10 != cnbc_top10, (lens_id, "top-10 should differ from CNBC overall")

SNAPSHOT_FIELDS = ("taxPosture", "businessRegistration", "complianceCalendar")
SNAPSHOTS_PATH = ROOT / "public/data/founder_snapshots.json"
snapshots_payload = json.loads(SNAPSHOTS_PATH.read_text(encoding="utf-8"))
snapshot_states = snapshots_payload["states"]
default_ids = set(default_data["states"].keys())

assert "disclaimer" in snapshots_payload and snapshots_payload["disclaimer"].strip()
assert snapshot_states.keys() == default_ids

for abbr in default_ids:
    entry = snapshot_states[abbr]
    for field in SNAPSHOT_FIELDS:
        fact = entry[field]
        assert fact["value"].strip(), (abbr, field, "value")
        assert fact["sourceUrl"].startswith("https://"), (abbr, field, fact["sourceUrl"])
        assert fact["sourceLabel"].strip(), (abbr, field, "sourceLabel")

    heads_up = entry["multiStateHeadsUp"]
    assert 3 <= len(heads_up) <= 5, (abbr, len(heads_up))
    for bullet_index, bullet in enumerate(heads_up):
        assert bullet["value"].strip(), (abbr, "multiStateHeadsUp", bullet_index)
        assert bullet["sourceUrl"].startswith("https://"), (abbr, "multiStateHeadsUp", bullet_index)
        assert bullet["sourceLabel"].strip(), (abbr, "multiStateHeadsUp", bullet_index)

# Feature 1 — founder match weights
MATCH_WEIGHTS_PATH = ROOT / "public/data/founder_match_weights.json"
match_weights = json.loads(MATCH_WEIGHTS_PATH.read_text(encoding="utf-8"))
assert match_weights.get("disclaimer", "").strip()
base = match_weights["baseWeights"]
assert set(base.keys()) == EXPECTED_CATEGORIES
base_sum = sum(base.values())
assert abs(base_sum - 1.0) < 1e-9, ("baseWeights", base_sum)

for question_id, answers in match_weights["quizModifiers"].items():
    assert answers, question_id
    for answer_id, deltas in answers.items():
        assert set(deltas.keys()).issubset(EXPECTED_CATEGORIES), (question_id, answer_id)

fixture = match_weights["fixtures"]["bootstrap-saas-engineer"]
merged = dict(base)
for qid in match_weights["quizModifiers"]:
    ans = fixture[qid]
    for key, delta in match_weights["quizModifiers"][qid][ans].items():
        merged[key] = merged.get(key, 0) + delta
for key in list(merged.keys()):
    merged[key] = max(0, merged[key])
norm_sum = sum(merged.values())
assert norm_sum > 0
for abbr, state in default_data["states"].items():
    raw = sum(
        (state["categories"][k]["score"] / state["categories"][k]["maxScore"]) * (merged[k] / norm_sum)
        for k in EXPECTED_CATEGORIES
    )
    score100 = round(raw * 100)
    assert 0 <= score100 <= 100, (abbr, score100)

# Feature 1 — state metros
METROS_PATH = ROOT / "public/data/state_metros.json"
metros_payload = json.loads(METROS_PATH.read_text(encoding="utf-8"))
assert metros_payload.get("disclaimer", "").strip()
metro_states = metros_payload["states"]
assert metro_states.keys() == default_ids
for abbr, entry in metro_states.items():
    assert entry["stateAbbr"] == abbr
    metros = entry["metros"]
    assert 2 <= len(metros) <= 6, (abbr, len(metros))
    metro_ids = set()
    for metro in metros:
        assert metro["id"] not in metro_ids, (abbr, metro["id"])
        metro_ids.add(metro["id"])
        assert metro["name"].strip()
        assert isinstance(metro["lat"], (int, float))
        assert isinstance(metro["lng"], (int, float))
        assert 2 <= len(metro["strengths"]) <= 5, (abbr, metro["id"])
        assert metro["sourceUrl"].startswith("https://"), (abbr, metro["id"])
        assert metro["sourceLabel"].strip(), (abbr, metro["id"])
        assert metro["industryTags"]

# Feature 2 — expansion readiness config
EXPANSION_PATH = ROOT / "public/data/expansion_readiness_config.json"
expansion_config = json.loads(EXPANSION_PATH.read_text(encoding="utf-8"))
assert expansion_config.get("disclaimer", "").strip()
factor_weights = expansion_config["factorWeights"]
assert abs(sum(factor_weights.values()) - 1.0) < 1e-9
profile_base = expansion_config["profileWeights"]["base"]
assert set(profile_base.keys()) == EXPECTED_CATEGORIES
assert abs(sum(profile_base.values()) - 1.0) < 1e-9

fixture = expansion_config["fixtures"]["wa-fintech-500k-2m"]
home_abbr = fixture["home"]
targets = fixture["targets"]
stage = fixture["stage"]
model = fixture["model"]


def _expansion_profile_weights(stage_id, model_id):
    weights = dict(expansion_config["profileWeights"]["base"])
    for key, delta in expansion_config["profileWeights"]["model"].get(model_id, {}).items():
        weights[key] = weights.get(key, 0) + delta
    for key, delta in expansion_config["profileWeights"]["stage"].get(stage_id, {}).items():
        weights[key] = weights.get(key, 0) + delta
    for key in list(weights.keys()):
        weights[key] = max(0, weights[key])
    total = sum(weights.values())
    return {k: weights[k] / total for k in weights}


def _tax_score(text):
    if not text:
        return 5
    lower = text.lower()
    score = 5.0
    if "no state personal income tax" in lower or "no personal income tax" in lower:
        score -= 3
    if "no statewide sales tax" in lower:
        score -= 1
    import re as _re

    rates = [float(m.group(1)) for m in _re.finditer(r"(\d+(?:\.\d+)?)\s*%", lower)]
    if rates:
        mx = max(rates)
        if mx >= 10:
            score += 3
        elif mx >= 7:
            score += 2
        elif mx >= 5:
            score += 1
    return max(0, min(10, score))


def _readiness_score(home, target, stage_id, model_id):
    weights = _expansion_profile_weights(stage_id, model_id)
    home_state = default_data["states"][home]
    target_state = default_data["states"][target]
    home_snap = snapshot_states[home]
    target_snap = snapshot_states[target]

    def climate(state):
        return sum(
            (state["categories"][k]["score"] / state["categories"][k]["maxScore"]) * weights[k]
            for k in EXPECTED_CATEGORIES
        )

    climate_delta = climate(target_state) - climate(home_state)
    climate_factor = max(0, min(1, 0.5 + climate_delta * 2.5))

    home_tax = _tax_score(home_snap["taxPosture"]["value"])
    target_tax = _tax_score(target_snap["taxPosture"]["value"])
    tax_factor = max(0, min(1, 0.5 + (home_tax - target_tax) / 8))

    home_bf = home_state["categories"]["businessFriendliness"]["rank"]
    target_bf = target_state["categories"]["businessFriendliness"]["rank"]
    reg_factor = max(0, min(1, 0.5 - (target_bf - home_bf) / 40))

    talent = (
        target_state["categories"]["workforce"]["score"] / target_state["categories"]["workforce"]["maxScore"]
        + target_state["categories"]["technologyAndInnovation"]["score"]
        / target_state["categories"]["technologyAndInnovation"]["maxScore"]
    ) / 2

    fw = factor_weights
    raw = (
        climate_factor * fw["climateDelta"]
        + tax_factor * fw["taxBurdenChange"]
        + reg_factor * fw["regulatoryComplexity"]
        + talent * fw["talentAvailability"]
    )
    return round(max(0, min(100, raw * 100)))


scores = {t: _readiness_score(home_abbr, t, stage, model) for t in targets}
for abbr, score in scores.items():
    assert 0 <= score <= 100, (abbr, score)
higher = fixture["expectHigherThan"]
for winner, loser in higher.items():
    assert scores[winner] > scores[loser], scores

print("OK: multi-year index and payloads validated")
print("OK: all 50 states aligned with category data per year")
print("OK: founder fit profiles validated")
print("OK: founder snapshots validated")
print("OK: founder match weights validated")
print("OK: state metros validated")
print("OK: expansion readiness config validated")
