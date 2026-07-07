import { CATEGORY_LABELS } from "./categories.js";
import { buildWeightsFromQuiz, getQuizLabel } from "./founderMatch.js";

const STAGE_COPY = {
  "pre-revenue": "you're pre-revenue",
  "under-500k": "you're under $500K ARR",
  "500k-2m": "you're in the $500K–$2M ARR range",
  "2m-plus": "you're past $2M ARR",
};

const MODEL_COPY = {
  saas: "building SaaS",
  fintech: "building fintech",
  ecommerce: "running e-commerce",
  marketplace: "running a marketplace",
  other: "building your business",
};

const TAX_COPY = {
  critical: "state income tax is a top priority",
  somewhat: "tax posture matters to you",
  "not-priority": "ecosystem beats tax savings for you",
};

const VC_COPY = {
  yes: "you've raised VC",
  planning: "you're planning to raise",
  no: "you're bootstrapping",
};

const HIRING_COPY = {
  "0-5": "hiring a small team",
  "5-20": "scaling hiring (5–20)",
  "20-plus": "hiring aggressively (20+)",
};

const TALENT_COPY = {
  engineering: "engineering talent",
  finance: "finance talent",
  healthcare: "healthcare talent",
  general: "general talent",
};

const COL_COPY = {
  yes: "prioritizing lower cost of living",
  no: "prioritizing ecosystem over COL",
  neutral: "balancing COL and ecosystem",
};

function topWeightedCategories(weights, count = 3) {
  return Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key]) => CATEGORY_LABELS[key] ?? key);
}

/**
 * Deterministic explanation bullets citing quiz answers (not AI).
 */
export function explainMatch(stateResult, answers, stateData) {
  const { abbr, name, matchScore100 } = stateResult;
  const state = stateData[abbr];
  const weights = buildWeightsFromQuiz(answers);
  const topCats = topWeightedCategories(weights);

  const bullets = [];

  bullets.push(
    `${name} scores ${matchScore100}% for you because ${VC_COPY[answers.vc]}, ${TAX_COPY[answers.tax]}, and you're ${HIRING_COPY[answers.hiring]}.`
  );

  if (answers.talent === "engineering" && state?.categories?.technologyAndInnovation) {
    const rank = state.categories.technologyAndInnovation.rank;
    bullets.push(
      `Your engineering focus aligns with ${name}'s Technology & Innovation rank (#${rank} nationally).`
    );
  } else if (answers.talent === "finance" && state?.categories?.economy) {
    const rank = state.categories.economy.rank;
    bullets.push(
      `Your finance hiring need fits ${name}'s Economy rank (#${rank} nationally).`
    );
  } else if (answers.vc === "no" && state?.categories?.costOfDoingBusiness) {
    const rank = state.categories.costOfDoingBusiness.rank;
    bullets.push(
      `Bootstrapping makes Cost of Doing Business (#${rank}) especially relevant — ${name} ranks well on your cost-sensitive profile.`
    );
  } else if (state?.categories) {
    const bestKey = Object.entries(weights).sort((a, b) => b[1] - a[1])[0]?.[0];
    const cat = bestKey ? state.categories[bestKey] : null;
    if (cat) {
      bullets.push(
        `Your profile weights ${topCats[0]} heavily — ${name} ranks #${cat.rank} in ${CATEGORY_LABELS[bestKey] ?? bestKey}.`
      );
    }
  }

  const modelPhrase = MODEL_COPY[answers.model] ?? "your business model";
  const stagePhrase = STAGE_COPY[answers.stage] ?? "";
  bullets.push(
    `${name} fits a founder ${modelPhrase}${stagePhrase ? ` while ${stagePhrase}` : ""}, with ${COL_COPY[answers.col]}.`
  );

  return bullets.slice(0, 3);
}

export function explainBestMetro(metro, answers) {
  const talent = getQuizLabel("talent", answers.talent);
  const model = getQuizLabel("model", answers.model);
  const note = metro.derivedNote
    ? metro.derivedNote
    : `${metro.name} aligns with your ${model.toLowerCase()} focus and ${talent.toLowerCase()} hiring priority.`;
  return note;
}
