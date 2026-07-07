import weightsPayload from "../../public/data/founder_match_weights.json";
import { CATEGORY_ORDER } from "./categories.js";

export const MATCH_DISCLAIMER = weightsPayload.disclaimer;

/** Quiz question keys and valid answer ids. */
export const QUIZ_QUESTIONS = [
  {
    id: "stage",
    label: "What stage is your company?",
    options: [
      { id: "pre-revenue", label: "Pre-revenue" },
      { id: "under-500k", label: "Under $500K ARR" },
      { id: "500k-2m", label: "$500K–$2M ARR" },
      { id: "2m-plus", label: "$2M+ ARR" },
    ],
  },
  {
    id: "model",
    label: "What's your business model?",
    options: [
      { id: "saas", label: "SaaS" },
      { id: "fintech", label: "Fintech" },
      { id: "ecommerce", label: "E-commerce" },
      { id: "marketplace", label: "Marketplace" },
      { id: "other", label: "Other" },
    ],
  },
  {
    id: "tax",
    label: "How much does state income tax matter?",
    options: [
      { id: "critical", label: "Critical — top priority" },
      { id: "somewhat", label: "Somewhat important" },
      { id: "not-priority", label: "Not a priority" },
    ],
  },
  {
    id: "vc",
    label: "VC funding status",
    options: [
      { id: "yes", label: "Yes — already raised" },
      { id: "planning", label: "Yes — planning to raise" },
      { id: "no", label: "No — bootstrapping" },
    ],
  },
  {
    id: "hiring",
    label: "Hiring plan (next 12 months)",
    options: [
      { id: "0-5", label: "0–5 people" },
      { id: "5-20", label: "5–20 people" },
      { id: "20-plus", label: "20+ people" },
    ],
  },
  {
    id: "talent",
    label: "Primary talent need",
    options: [
      { id: "engineering", label: "Engineering" },
      { id: "finance", label: "Finance" },
      { id: "healthcare", label: "Healthcare" },
      { id: "general", label: "General / mixed" },
    ],
  },
  {
    id: "col",
    label: "Cost of living vs ecosystem tradeoff",
    options: [
      { id: "yes", label: "Yes — prioritize lower COL" },
      { id: "no", label: "No — prioritize ecosystem" },
      { id: "neutral", label: "Neutral / balanced" },
    ],
  },
];

const questionById = Object.fromEntries(QUIZ_QUESTIONS.map((q) => [q.id, q]));

/**
 * Match engine (StateCompass derived, not CNBC official).
 *
 * 1. Start with baseWeights (sum = 1).
 * 2. For each quiz answer, add category deltas from quizModifiers[question][answer].
 * 3. Clamp each weight to >= 0, then normalize so Σ weight = 1.
 * 4. Match raw = Σ (normalized_category × weight) per state.
 * 5. Match % = round(raw × 100). Rank all 50; return top 3.
 */
export function buildWeightsFromQuiz(answers) {
  const weights = { ...weightsPayload.baseWeights };

  for (const [questionId, answerId] of Object.entries(answers)) {
    const modifiers = weightsPayload.quizModifiers?.[questionId]?.[answerId];
    if (!modifiers) {
      continue;
    }
    for (const [key, delta] of Object.entries(modifiers)) {
      weights[key] = (weights[key] ?? 0) + delta;
    }
  }

  for (const key of CATEGORY_ORDER) {
    if (weights[key] == null || weights[key] < 0) {
      weights[key] = 0;
    }
  }

  const sum = CATEGORY_ORDER.reduce((acc, key) => acc + weights[key], 0);
  if (sum <= 0) {
    return { ...weightsPayload.baseWeights };
  }

  const normalized = {};
  for (const key of CATEGORY_ORDER) {
    normalized[key] = weights[key] / sum;
  }
  return normalized;
}

export function computeMatchRaw(state, weights) {
  if (!state?.categories) {
    return null;
  }

  let raw = 0;
  for (const key of CATEGORY_ORDER) {
    const cat = state.categories[key];
    const weight = weights[key];
    if (!cat || weight == null) {
      return null;
    }
    raw += (cat.score / cat.maxScore) * weight;
  }
  return raw;
}

export function computeMatchScore100(state, weights) {
  const raw = computeMatchRaw(state, weights);
  if (raw == null) {
    return null;
  }
  return Math.round(raw * 100);
}

export function rankStatesForQuiz(statesObject, answers) {
  const weights = buildWeightsFromQuiz(answers);
  const entries = Object.entries(statesObject).map(([abbr, state]) => ({
    abbr,
    state,
    raw: computeMatchRaw(state, weights),
    matchScore100: computeMatchScore100(state, weights),
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
      matchRank: lastRank,
      matchScore100: entry.matchScore100,
      weights,
    };
  });
}

export function getTopMatches(statesObject, answers, count = 3) {
  return rankStatesForQuiz(statesObject, answers).slice(0, count);
}

export function validateQuizAnswers(answers) {
  if (!answers || typeof answers !== "object") {
    return null;
  }

  const normalized = {};
  for (const question of QUIZ_QUESTIONS) {
    const value = answers[question.id];
    const valid = question.options.some((opt) => opt.id === value);
    if (!valid) {
      return null;
    }
    normalized[question.id] = value;
  }
  return normalized;
}

export function getQuizLabel(questionId, answerId) {
  const question = questionById[questionId];
  const option = question?.options.find((opt) => opt.id === answerId);
  return option?.label ?? answerId;
}

export function encodeQuizToParams(answers) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(answers)) {
    params.set(key, value);
  }
  return params.toString();
}

export function decodeQuizFromParams(search = "") {
  const params = new URLSearchParams(search);
  const answers = {};
  for (const question of QUIZ_QUESTIONS) {
    const value = params.get(question.id);
    if (value) {
      answers[question.id] = value;
    }
  }
  return validateQuizAnswers(answers);
}

export function getMatchSharePath(answers) {
  const query = encodeQuizToParams(answers);
  return `/match?${query}`;
}

export function getComparePathForStates(abbrs) {
  const list = abbrs.filter(Boolean).slice(0, 3);
  if (list.length < 2) {
    return null;
  }
  return `/compare?states=${list.join(",")}`;
}
