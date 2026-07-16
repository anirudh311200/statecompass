import priorPayload from "../../public/data/states-2024.json";
import indexPayload from "../../public/data/states-index.json";
import { getStrengthsAndWeaknesses } from "../scripts/categories.js";
import {
  FOUNDER_FIT_PROFILES,
  rankStatesForProfile,
} from "../scripts/founderFit.js";

/** Category rank thresholds → "Best for" tag labels (rules-based, not Lens). */
const CATEGORY_TAG_RULES = [
  { tag: "Low cost of doing business", key: "costOfDoingBusiness", maxRank: 10 },
  { tag: "Low cost of living", key: "costOfLiving", maxRank: 10 },
  { tag: "Strong tech ecosystem", key: "technologyAndInnovation", maxRank: 10 },
  { tag: "Deep talent pool", key: "workforce", maxRank: 10 },
  { tag: "Business-friendly", key: "businessFriendliness", maxRank: 10 },
  { tag: "Capital access", key: "accessToCapital", maxRank: 10 },
  { tag: "Infrastructure-ready", key: "infrastructure", maxRank: 10 },
  { tag: "Strong economy", key: "economy", maxRank: 10 },
];

const PROFILE_TAG_MAX_RANK = 12;
const MAX_BEST_FOR_TAGS = 5;

export function formatTrendLabel(rankDelta, priorYear) {
  if (rankDelta > 0) {
    return `Improved ${rankDelta} rank${rankDelta === 1 ? "" : "s"} since CNBC ${priorYear}`;
  }
  if (rankDelta < 0) {
    const abs = Math.abs(rankDelta);
    return `Fell ${abs} rank${abs === 1 ? "" : "s"} since CNBC ${priorYear}`;
  }
  return `Unchanged since CNBC ${priorYear}`;
}

export function computeYoYTrend(abbr, state, { prior = priorPayload, index = indexPayload } = {}) {
  const priorYear = index?.defaultYear
    ? getPriorYearFromIndex(index.defaultYear, index)
    : null;
  if (!priorYear || !prior?.states?.[abbr]) {
    return null;
  }

  const priorState = prior.states[abbr];
  const rankDelta = priorState.rank - state.rank;
  const direction = rankDelta > 0 ? "up" : rankDelta < 0 ? "down" : "flat";

  return {
    priorYear,
    currentYear: state.year ?? index.defaultYear,
    priorRank: priorState.rank,
    currentRank: state.rank,
    rankDelta,
    direction,
    label: formatTrendLabel(rankDelta, priorYear),
  };
}

function getPriorYearFromIndex(year, index) {
  const years = [...(index?.availableYears ?? [])].sort((a, b) => a - b);
  const idx = years.indexOf(year);
  return idx > 0 ? years[idx - 1] : null;
}

/**
 * Rules-based "Best for" tags from CNBC category strengths and Founder Fit ranks.
 * Feature 4 Lens labels can extend this later.
 */
export function computeBestForTags(abbr, state, statesObject) {
  const tags = [];
  const seen = new Set();

  function add(tag) {
    if (!seen.has(tag) && tags.length < MAX_BEST_FOR_TAGS) {
      seen.add(tag);
      tags.push(tag);
    }
  }

  for (const profile of FOUNDER_FIT_PROFILES) {
    const ranked = rankStatesForProfile(statesObject, profile.id);
    const row = ranked.find((entry) => entry.abbr === abbr);
    if (row && row.founderFitRank <= PROFILE_TAG_MAX_RANK) {
      add(profile.label);
    }
  }

  for (const rule of CATEGORY_TAG_RULES) {
    const cat = state.categories?.[rule.key];
    if (cat && cat.rank <= rule.maxRank) {
      add(rule.tag);
    }
  }

  const infra = state.categories?.infrastructure?.rank;
  const col = state.categories?.costOfLiving?.rank;
  if (infra != null && col != null && infra <= 15 && col <= 15) {
    add("Remote-first friendly");
  }

  return tags;
}

export function buildReportCard(abbr, state, statesObject, dataYear) {
  const { strengths, weaknesses } = getStrengthsAndWeaknesses(state.categories, 3);
  const yoy = computeYoYTrend(abbr, state);
  const bestFor = computeBestForTags(abbr, state, statesObject);

  const founderFit = FOUNDER_FIT_PROFILES.map((profile) => {
    const ranked = rankStatesForProfile(statesObject, profile.id);
    const row = ranked.find((entry) => entry.abbr === abbr);
    return row
      ? {
          id: profile.id,
          label: profile.label,
          rank: row.founderFitRank,
          score100: row.founderFitScore100,
        }
      : null;
  }).filter(Boolean);

  const topFounderFit = [...founderFit].sort((a, b) => a.rank - b.rank)[0] ?? null;

  return {
    abbr,
    slug: state.slug,
    name: state.name,
    year: dataYear,
    cnbc: {
      rank: state.rank,
      score100: state.score100,
      tier: state.tier,
      rawScore: state.rawScore,
    },
    yoy,
    strengths,
    weaknesses: weaknesses.slice(0, 2),
    bestFor,
    founderFit,
    topFounderFit,
  };
}
