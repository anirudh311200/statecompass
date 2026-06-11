import profilesPayload from "../../public/data/founder_fit_profiles.json";
import { CATEGORY_ORDER } from "./categories.js";

export const FOUNDER_FIT_OVERALL = "overall";
export const FOUNDER_FIT_DISCLAIMER = profilesPayload.disclaimer;
export const FOUNDER_FIT_PROFILES = profilesPayload.profiles;

const profileById = Object.fromEntries(
  FOUNDER_FIT_PROFILES.map((profile) => [profile.id, profile])
);

/**
 * Founder Fit score (StateCompass derived, not CNBC official).
 *
 * For each CNBC category c:
 *   normalized_c = state.categories[c].score / state.categories[c].maxScore   (0–1)
 *
 * Founder Fit raw = Σ (normalized_c × weight_c)   where Σ weight_c = 1
 *
 * Founder Fit score (0–100) = round(raw × 100)
 *
 * Rank = position when all 50 states are sorted by Founder Fit score descending.
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

export function computeFounderFitScore100(state, profileId) {
  const raw = computeFounderFitRaw(state, profileId);
  if (raw == null) {
    return null;
  }
  return Math.round(raw * 100);
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
    };
  });
}

export function getFounderFitLookup(statesObject, profileId) {
  return Object.fromEntries(
    rankStatesForProfile(statesObject, profileId).map((row) => [row.abbr, row])
  );
}

export function getProfileFromUrl(search = window.location.search) {
  const value = new URLSearchParams(search).get("profile");
  if (!value || value === FOUNDER_FIT_OVERALL) {
    return FOUNDER_FIT_OVERALL;
  }
  return profileById[value] ? value : FOUNDER_FIT_OVERALL;
}

export function syncProfileToUrl(profileId, { replace = true } = {}) {
  const url = new URL(window.location.href);
  if (!profileId || profileId === FOUNDER_FIT_OVERALL) {
    url.searchParams.delete("profile");
  } else if (profileById[profileId]) {
    url.searchParams.set("profile", profileId);
  }

  const method = replace ? "replaceState" : "pushState";
  history[method](null, "", url);
}

export function getProfileLabel(profileId) {
  if (!profileId || profileId === FOUNDER_FIT_OVERALL) {
    return "Overall (CNBC)";
  }
  return profileById[profileId]?.label ?? "Overall (CNBC)";
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

  select.value = profileById[initialProfile] ? initialProfile : FOUNDER_FIT_OVERALL;

  function updateDisclaimer(profileId) {
    if (!disclaimer) {
      return;
    }
    const show = profileId && profileId !== FOUNDER_FIT_OVERALL;
    disclaimer.hidden = !show;
  }

  function handleChange() {
    const profileId = getProfileFromUrl(`?profile=${select.value}`);
    select.value = profileId;
    updateDisclaimer(profileId);
    onChange?.(profileId);
  }

  select.addEventListener("change", handleChange);
  updateDisclaimer(select.value);
  onChange?.(select.value);

  return () => select.removeEventListener("change", handleChange);
}
