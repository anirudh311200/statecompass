import config from "../../public/data/expansion_readiness_config.json";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "./categories.js";

export const EXPANSION_DISCLAIMER = config.disclaimer;
export const INDUSTRY_CAVEAT = config.industryCaveat;

export const ARR_OPTIONS = [
  { id: "pre-revenue", label: "Pre-revenue" },
  { id: "under-500k", label: "Under $500K ARR" },
  { id: "500k-2m", label: "$500K–$2M ARR" },
  { id: "2m-plus", label: "$2M+ ARR" },
];

export const MODEL_OPTIONS = [
  { id: "saas", label: "SaaS" },
  { id: "fintech", label: "Fintech" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "marketplace", label: "Marketplace" },
  { id: "other", label: "Other" },
];

const MAX_TARGETS = 3;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeWeights(raw) {
  const weights = {};
  for (const key of CATEGORY_ORDER) {
    weights[key] = Math.max(0, raw[key] ?? 0);
  }
  const sum = CATEGORY_ORDER.reduce((acc, key) => acc + weights[key], 0);
  if (sum <= 0) {
    return { ...config.profileWeights.base };
  }
  const normalized = {};
  for (const key of CATEGORY_ORDER) {
    normalized[key] = weights[key] / sum;
  }
  return normalized;
}

/**
 * Profile weights for climate comparison — base + model + stage modifiers.
 */
export function buildProfileWeights(profile) {
  const weights = { ...config.profileWeights.base };

  const modelMods = config.profileWeights.model?.[profile.model];
  if (modelMods) {
    for (const [key, delta] of Object.entries(modelMods)) {
      weights[key] = (weights[key] ?? 0) + delta;
    }
  }

  const stageMods = config.profileWeights.stage?.[profile.stage];
  if (stageMods) {
    for (const [key, delta] of Object.entries(stageMods)) {
      weights[key] = (weights[key] ?? 0) + delta;
    }
  }

  return normalizeWeights(weights);
}

function categoryNormScore(state, categoryKey) {
  const cat = state?.categories?.[categoryKey];
  if (!cat?.maxScore) {
    return null;
  }
  return cat.score / cat.maxScore;
}

export function computeWeightedClimateScore(state, weights) {
  if (!state?.categories) {
    return null;
  }

  let total = 0;
  for (const key of CATEGORY_ORDER) {
    const norm = categoryNormScore(state, key);
    const weight = weights[key];
    if (norm == null || weight == null) {
      return null;
    }
    total += norm * weight;
  }
  return total;
}

/**
 * Heuristic tax burden score from Founder Snapshot tax posture (0 = low burden, 10 = high).
 */
export function scoreTaxPosture(taxPostureValue) {
  if (!taxPostureValue) {
    return 5;
  }

  const text = taxPostureValue.toLowerCase();
  let score = 5;

  if (
    text.includes("no state personal income tax") ||
    text.includes("no personal income tax") ||
    text.includes("does not tax personal income")
  ) {
    score -= 3;
  }
  if (text.includes("no statewide sales tax")) {
    score -= 1;
  }
  if (text.includes("flat tax") || text.includes("low tax")) {
    score -= 1;
  }
  if (text.includes("progressive") || text.includes("rates up to")) {
    score += 1.5;
  }

  const rateMatches = text.match(/(\d+(?:\.\d+)?)\s*%/g);
  if (rateMatches) {
    const rates = rateMatches.map((match) => parseFloat(match));
    const maxRate = Math.max(...rates);
    if (maxRate >= 10) {
      score += 3;
    } else if (maxRate >= 7) {
      score += 2;
    } else if (maxRate >= 5) {
      score += 1;
    } else if (maxRate <= 3) {
      score -= 0.5;
    }
  }

  return clamp(score, 0, 10);
}

function scoreComplianceComplexity(complianceValue) {
  if (!complianceValue) {
    return 5;
  }
  const text = complianceValue.toLowerCase();
  let score = 5;
  if (text.includes("annual") || text.includes("biennial")) {
    score += 0.5;
  }
  if (text.includes("multiple") || text.includes("varies") || text.includes("many")) {
    score += 1;
  }
  if (text.includes("simple") || text.includes("online")) {
    score -= 0.5;
  }
  return clamp(score, 0, 10);
}

function computeClimateFactor(homeState, targetState, weights) {
  const homeScore = computeWeightedClimateScore(homeState, weights);
  const targetScore = computeWeightedClimateScore(targetState, weights);
  if (homeScore == null || targetScore == null) {
    return 0.5;
  }
  const delta = targetScore - homeScore;
  return clamp(0.5 + delta * 2.5, 0, 1);
}

function computeTaxFactor(homeSnapshot, targetSnapshot) {
  const homeTax = scoreTaxPosture(homeSnapshot?.taxPosture?.value);
  const targetTax = scoreTaxPosture(targetSnapshot?.taxPosture?.value);
  const delta = homeTax - targetTax;
  return clamp(0.5 + delta / 8, 0, 1);
}

function computeRegulatoryFactor(homeState, targetState, homeSnapshot, targetSnapshot) {
  const homeBf = homeState?.categories?.businessFriendliness?.rank ?? 25;
  const targetBf = targetState?.categories?.businessFriendliness?.rank ?? 25;
  const rankDelta = targetBf - homeBf;
  const rankFactor = clamp(0.5 - rankDelta / 40, 0, 1);

  const homeCompliance = scoreComplianceComplexity(homeSnapshot?.complianceCalendar?.value);
  const targetCompliance = scoreComplianceComplexity(targetSnapshot?.complianceCalendar?.value);
  const complianceDelta = targetCompliance - homeCompliance;
  const complianceFactor = clamp(0.5 - complianceDelta / 10, 0, 1);

  return rankFactor * 0.7 + complianceFactor * 0.3;
}

function computeTalentFactor(targetState) {
  const workforce = categoryNormScore(targetState, "workforce");
  const tech = categoryNormScore(targetState, "technologyAndInnovation");
  if (workforce == null || tech == null) {
    return 0.5;
  }
  return clamp((workforce + tech) / 2, 0, 1);
}

function getStageModifiers(stage) {
  return config.stageFactorModifiers?.[stage] ?? {
    taxBurdenChange: 1,
    regulatoryComplexity: 1,
    talentAvailability: 1,
  };
}

function getFrictionLabel(score100) {
  const { low, moderate } = config.frictionThresholds;
  if (score100 >= low) {
    return { id: "low", label: "Low expansion friction" };
  }
  if (score100 >= moderate) {
    return { id: "moderate", label: "Moderate expansion friction" };
  }
  return { id: "high", label: "High expansion friction" };
}

function getCategoryDeltas(homeState, targetState) {
  return CATEGORY_ORDER.map((key) => {
    const homeCat = homeState.categories[key];
    const targetCat = targetState.categories[key];
    const homeNorm = homeCat ? homeCat.score / homeCat.maxScore : null;
    const targetNorm = targetCat ? targetCat.score / targetCat.maxScore : null;
    const delta = homeNorm != null && targetNorm != null ? targetNorm - homeNorm : null;
    return {
      key,
      label: CATEGORY_LABELS[key],
      homeRank: homeCat?.rank ?? null,
      targetRank: targetCat?.rank ?? null,
      homeScore: homeCat?.score ?? null,
      targetScore: targetCat?.score ?? null,
      homeMax: homeCat?.maxScore ?? null,
      targetMax: targetCat?.maxScore ?? null,
      delta,
    };
  }).filter((entry) => entry.delta != null);
}

function topCategoryDeltas(deltas, count = 3, direction = "positive") {
  const sorted = [...deltas].sort((a, b) =>
    direction === "positive" ? b.delta - a.delta : a.delta - b.delta
  );
  return sorted.slice(0, count);
}

export function explainExpansionReadiness(result, profile, snapshots) {
  const { homeAbbr, targetAbbr, homeName, targetName, readinessScore100, factors, friction } = result;
  const homeSnapshot = snapshots[homeAbbr];
  const targetSnapshot = snapshots[targetAbbr];
  const bullets = [];

  if (factors.climate >= 0.55) {
    bullets.push(
      `${targetName}'s business climate aligns better with your ${profile.model} profile than ${homeName} on CNBC category scores.`
    );
  } else if (factors.climate <= 0.45) {
    bullets.push(
      `${targetName} trails ${homeName} on profile-weighted CNBC categories — expect a step down in overall business climate.`
    );
  }

  const homeTax = scoreTaxPosture(homeSnapshot?.taxPosture?.value);
  const targetTax = scoreTaxPosture(targetSnapshot?.taxPosture?.value);
  if (targetTax - homeTax >= 2) {
    bullets.push(
      `Tax posture shifts upward: ${targetName}'s income-tax environment is heavier than ${homeName}'s based on Founder Snapshot facts.`
    );
  } else if (homeTax - targetTax >= 2) {
    bullets.push(
      `Tax posture improves: ${targetName} is lighter on state income tax than ${homeName} per Founder Snapshot.`
    );
  }

  const homeBf = result.homeState?.categories?.businessFriendliness?.rank;
  const targetBf = result.targetState?.categories?.businessFriendliness?.rank;
  if (targetBf != null && homeBf != null && targetBf > homeBf + 8) {
    bullets.push(
      `Regulatory friction rises: ${targetName} ranks #${targetBf} vs #${homeBf} for Business Friendliness — plan for more compliance overhead.`
    );
  } else if (targetBf != null && homeBf != null && targetBf < homeBf - 5) {
    bullets.push(
      `Business Friendliness improves: ${targetName} (#${targetBf}) beats ${homeName} (#${homeBf}) on CNBC's regulatory climate category.`
    );
  }

  const workforceRank = result.targetState?.categories?.workforce?.rank;
  const techRank = result.targetState?.categories?.technologyAndInnovation?.rank;
  if (workforceRank != null && techRank != null && (workforceRank <= 15 || techRank <= 15)) {
    bullets.push(
      `Talent pool: ${targetName} ranks #${workforceRank} for Workforce and #${techRank} for Technology & Innovation — strong for hiring.`
    );
  }

  if (profile.stage === "500k-2m" || profile.stage === "2m-plus") {
    bullets.push(INDUSTRY_CAVEAT);
  }

  if (bullets.length < 3) {
    bullets.push(
      `Readiness ${readinessScore100}% with ${friction.label.toLowerCase()} — compare category deltas below before committing.`
    );
  }

  return bullets.slice(0, 5);
}

/**
 * Expansion readiness engine (StateCompass derived, not CNBC official).
 *
 * Factors (each 0–1, weighted):
 * 1. Climate delta — profile-weighted CNBC category scores, target vs home
 * 2. Tax burden change — Founder Snapshot tax posture heuristics
 * 3. Regulatory complexity — businessFriendliness rank delta + compliance calendar
 * 4. Talent availability — workforce + tech/innovation on target
 *
 * Stage modifiers scale tax/regulatory/talent factor weights.
 * Readiness % = round(weighted sum × 100), clamped 0–100.
 */
export function computeExpansionReadiness(homeAbbr, targetAbbr, profile, statesObject, snapshots) {
  const homeState = statesObject[homeAbbr];
  const targetState = statesObject[targetAbbr];
  if (!homeState || !targetState) {
    return null;
  }

  const weights = buildProfileWeights(profile);
  const stageMods = getStageModifiers(profile.stage);
  const factorWeights = { ...config.factorWeights };

  factorWeights.taxBurdenChange *= stageMods.taxBurdenChange ?? 1;
  factorWeights.regulatoryComplexity *= stageMods.regulatoryComplexity ?? 1;
  factorWeights.talentAvailability *= stageMods.talentAvailability ?? 1;

  const weightSum = Object.values(factorWeights).reduce((a, b) => a + b, 0);
  for (const key of Object.keys(factorWeights)) {
    factorWeights[key] /= weightSum;
  }

  const homeSnapshot = snapshots[homeAbbr] ?? null;
  const targetSnapshot = snapshots[targetAbbr] ?? null;

  const factors = {
    climate: computeClimateFactor(homeState, targetState, weights),
    tax: computeTaxFactor(homeSnapshot, targetSnapshot),
    regulatory: computeRegulatoryFactor(homeState, targetState, homeSnapshot, targetSnapshot),
    talent: computeTalentFactor(targetState),
  };

  const raw =
    factors.climate * factorWeights.climateDelta +
    factors.tax * factorWeights.taxBurdenChange +
    factors.regulatory * factorWeights.regulatoryComplexity +
    factors.talent * factorWeights.talentAvailability;

  const readinessScore100 = clamp(Math.round(raw * 100), 0, 100);
  const friction = getFrictionLabel(readinessScore100);
  const categoryDeltas = getCategoryDeltas(homeState, targetState);

  return {
    homeAbbr,
    targetAbbr,
    homeName: homeState.name,
    targetName: targetState.name,
    homeSlug: homeState.slug,
    targetSlug: targetState.slug,
    homeState,
    targetState,
    readinessScore100,
    friction,
    factors,
    categoryDeltas,
    strengths: topCategoryDeltas(categoryDeltas, 3, "positive"),
    weaknesses: topCategoryDeltas(categoryDeltas, 3, "negative"),
  };
}

export function computeAllTargets(profile, statesObject, snapshots) {
  const { home, targets } = profile;
  if (!home || !targets?.length) {
    return [];
  }

  return targets
    .filter((abbr) => abbr && abbr !== home && statesObject[abbr])
    .slice(0, MAX_TARGETS)
    .map((targetAbbr) => computeExpansionReadiness(home, targetAbbr, profile, statesObject, snapshots))
    .filter(Boolean)
    .sort((a, b) => b.readinessScore100 - a.readinessScore100);
}

export function validateExpansionProfile(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const home = raw.home?.trim?.()?.toUpperCase();
  if (!home) {
    return null;
  }

  const stage = raw.stage;
  if (!ARR_OPTIONS.some((opt) => opt.id === stage)) {
    return null;
  }

  const model = raw.model;
  if (!MODEL_OPTIONS.some((opt) => opt.id === model)) {
    return null;
  }

  let targets = raw.targets;
  if (typeof targets === "string") {
    targets = targets.split(",").map((part) => part.trim().toUpperCase());
  }
  if (!Array.isArray(targets)) {
    return null;
  }

  const normalizedTargets = [];
  const seen = new Set([home]);
  for (const abbr of targets) {
    const upper = String(abbr).trim().toUpperCase();
    if (upper && !seen.has(upper) && normalizedTargets.length < MAX_TARGETS) {
      seen.add(upper);
      normalizedTargets.push(upper);
    }
  }

  if (!normalizedTargets.length) {
    return null;
  }

  return { home, stage, model, targets: normalizedTargets };
}

export function encodeExpansionToParams(profile) {
  const params = new URLSearchParams();
  params.set("home", profile.home);
  params.set("stage", profile.stage);
  params.set("model", profile.model);
  params.set("targets", profile.targets.join(","));
  return params.toString();
}

export function decodeExpansionFromParams(search = "") {
  const params = new URLSearchParams(search);
  const home = params.get("home");
  const stage = params.get("stage");
  const model = params.get("model");
  const targets = params.get("targets");

  if (!home || !stage || !model || !targets) {
    return null;
  }

  return validateExpansionProfile({ home, stage, model, targets });
}

export function getExpansionSharePath(profile) {
  return `/expand?${encodeExpansionToParams(profile)}`;
}

export function profileFromQuizAnswers(quizAnswers, homeAbbr) {
  if (!quizAnswers?.stage || !quizAnswers?.model) {
    return null;
  }
  return {
    home: homeAbbr?.toUpperCase(),
    stage: quizAnswers.stage,
    model: quizAnswers.model,
    targets: [],
  };
}

export function mergeQuizPrefill(profile, quizAnswers) {
  if (!quizAnswers) {
    return profile;
  }
  return {
    ...profile,
    stage: profile.stage || quizAnswers.stage,
    model: profile.model || quizAnswers.model,
  };
}
