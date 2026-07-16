import profilesPayload from "../../public/data/founder_fit_profiles.json";
import { trackProfile } from "./analytics.js";
import { CATEGORY_ORDER } from "./categories.js";

export const FOUNDER_FIT_OVERALL = "overall";
export const LENS_OVERALL = FOUNDER_FIT_OVERALL;
export const FOUNDER_FIT_DISCLAIMER = profilesPayload.disclaimer;
export const FOUNDER_LENS_DISCLAIMER = profilesPayload.disclaimer;
export const FOUNDER_FIT_PROFILES = profilesPayload.profiles;
export const FOUNDER_LENSES = profilesPayload.profiles;

/** Legacy v1 profile ids → Feature 4 lens ids (URL backward compatibility). */
const LEGACY_PROFILE_ALIASES = {
  tech: "vc-backed",
  bootstrapped: "bootstrapper",
  "physical-ops": "remote-first",
};

const profileById = Object.fromEntries(
  FOUNDER_FIT_PROFILES.map((profile) => [profile.id, profile])
);

/**
 * Map a lens rank (1–50) to green / yellow / red tier bands.
 * Same thresholds as CNBC overall tiers.
 */
export function tierFromLensRank(rank) {
  if (rank <= 17) {
    return "green";
  }
  if (rank <= 34) {
    return "yellow";
  }
  return "red";
}

function resolveLensId(value) {
  if (!value || value === FOUNDER_FIT_OVERALL) {
    return FOUNDER_FIT_OVERALL;
  }
  if (profileById[value]) {
    return value;
  }
  const legacy = LEGACY_PROFILE_ALIASES[value];
  return legacy && profileById[legacy] ? legacy : FOUNDER_FIT_OVERALL;
}

/**
 * Founder Lens score (StateCompass derived, not CNBC official).
 *
 * For each CNBC category c:
 *   normalized_c = state.categories[c].score / state.categories[c].maxScore   (0–1)
 *
 * Lens raw = Σ (normalized_c × weight_c)   where Σ weight_c = 1
 *
 * Lens score (0–100) = round(raw × 100)
 *
 * Rank = position when all 50 states are sorted by Lens score descending.
 * Ties share the same rank (competition ranking: 1, 2, 2, 4).
 */
export function computeFounderFitRaw(state, profileId) {
  const profile = profileById[profileId];
  if (!profile || !state?.categories) {
    return null;
  }

  let raw = 0;
  for (const key of CATEGORY_ORDER) {
    const cat = state.categories[key];
    const weight = profile.weights[key];
    if (!cat || weight == null) {
      return null;
    }
    raw += (cat.score / cat.maxScore) * weight;
  }

  return raw;
}

export function computeLensRaw(state, lensId) {
  return computeFounderFitRaw(state, lensId);
}

export function computeFounderFitScore100(state, profileId) {
  const raw = computeFounderFitRaw(state, profileId);
  if (raw == null) {
    return null;
  }
  return Math.round(raw * 100);
}

export function computeLensScore100(state, lensId) {
  return computeFounderFitScore100(state, lensId);
}

export function getLensWeights(lensId) {
  const profile = profileById[lensId];
  if (!profile) {
    return null;
  }
  return { ...profile.weights };
}

export function rankStatesForProfile(statesObject, profileId) {
  const entries = Object.entries(statesObject).map(([abbr, state]) => ({
    abbr,
    state,
    score100: computeFounderFitScore100(state, profileId),
    raw: computeFounderFitRaw(state, profileId),
  }));

  entries.sort((a, b) => {
    if (b.raw !== a.raw) {
      return b.raw - a.raw;
    }
    return a.state.name.localeCompare(b.state.name);
  });

  let lastRaw = null;
  let lastRank = 0;

  return entries.map((entry, index) => {
    if (entry.raw !== lastRaw) {
      lastRank = index + 1;
      lastRaw = entry.raw;
    }

    return {
      abbr: entry.abbr,
      name: entry.state.name,
      slug: entry.state.slug,
      tier: entry.state.tier,
      cnbcRank: entry.state.rank,
      cnbcScore100: entry.state.score100,
      founderFitRank: lastRank,
      founderFitScore100: entry.score100,
      lensRank: lastRank,
      lensScore100: entry.score100,
    };
  });
}

export function rankStatesForLens(statesObject, lensId) {
  return rankStatesForProfile(statesObject, lensId);
}

export function getFounderFitLookup(statesObject, profileId) {
  return Object.fromEntries(
    rankStatesForProfile(statesObject, profileId).map((row) => [row.abbr, row])
  );
}

export function getLensLookup(statesObject, lensId) {
  return getFounderFitLookup(statesObject, lensId);
}

export function getTopStatesForLens(statesObject, lensId, count = 10) {
  if (lensId === FOUNDER_FIT_OVERALL) {
    return Object.entries(statesObject)
      .map(([abbr, state]) => ({
        abbr,
        rank: state.rank,
        name: state.name,
      }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, count);
  }
  return rankStatesForLens(statesObject, lensId).slice(0, count);
}

/**
 * Read active Founder Lens from URL.
 * Primary param: ?lens=fintech — legacy ?profile=tech is mapped to vc-backed.
 */
export function getLensFromUrl(search = window.location.search) {
  const params = new URLSearchParams(search);
  const lens = params.get("lens");
  if (lens) {
    return resolveLensId(lens);
  }
  const legacyProfile = params.get("profile");
  if (legacyProfile) {
    return resolveLensId(legacyProfile);
  }
  return FOUNDER_FIT_OVERALL;
}

/** @deprecated Use getLensFromUrl */
export function getProfileFromUrl(search) {
  return getLensFromUrl(search);
}

export function syncLensToUrl(lensId, { replace = true } = {}) {
  const url = new URL(window.location.href);
  url.searchParams.delete("profile");

  if (!lensId || lensId === FOUNDER_FIT_OVERALL) {
    url.searchParams.delete("lens");
  } else if (profileById[lensId]) {
    url.searchParams.set("lens", lensId);
  }

  const method = replace ? "replaceState" : "pushState";
  history[method](null, "", url);
}

/** @deprecated Use syncLensToUrl */
export function syncProfileToUrl(profileId, options) {
  syncLensToUrl(profileId, options);
}

export function getLensLabel(lensId) {
  if (!lensId || lensId === FOUNDER_FIT_OVERALL) {
    return "Overall";
  }
  return profileById[lensId]?.label ?? "Overall";
}

/** @deprecated Use getLensLabel */
export function getProfileLabel(profileId) {
  return getLensLabel(profileId);
}

/**
 * Suggest a default Founder Lens from quiz answers (Feature 4.C.1).
 * Used when no explicit ?lens= is set.
 */
export function suggestLensFromQuiz(answers) {
  if (!answers || typeof answers !== "object") {
    return FOUNDER_FIT_OVERALL;
  }

  if (answers.model === "fintech") {
    return "fintech";
  }

  if (answers.vc === "no") {
    return "bootstrapper";
  }

  if (answers.vc === "yes" || answers.vc === "planning") {
    return "vc-backed";
  }

  if (answers.col === "yes" && (answers.hiring === "0-5" || answers.talent === "general")) {
    return "remote-first";
  }

  if (answers.tax === "critical") {
    return "bootstrapper";
  }

  if (answers.model === "saas" || answers.model === "marketplace") {
    return "vc-backed";
  }

  return FOUNDER_FIT_OVERALL;
}

export function wireFounderFitSelector({
  select,
  disclaimer,
  onChange,
  initialProfile = FOUNDER_FIT_OVERALL,
}) {
  if (!select) {
    return () => {};
  }

  const initial = resolveLensId(initialProfile);
  select.value = profileById[initial] ? initial : FOUNDER_FIT_OVERALL;

  function updateDisclaimer(lensId) {
    if (!disclaimer) {
      return;
    }
    const show = lensId && lensId !== FOUNDER_FIT_OVERALL;
    disclaimer.hidden = !show;
  }

  function handleChange() {
    const lensId = resolveLensId(select.value);
    select.value = lensId;
    updateDisclaimer(lensId);
    trackProfile(lensId);
    onChange?.(lensId);
  }

  select.addEventListener("change", handleChange);
  updateDisclaimer(select.value);
  onChange?.(select.value);

  return () => select.removeEventListener("change", handleChange);
}

export const wireFounderLensSelector = wireFounderFitSelector;
