import {
  getStrengthsAndWeaknesses,
  renderCategoryList,
  TIER_LABELS,
} from "./categories.js";
import {
  FOUNDER_FIT_OVERALL,
  FOUNDER_FIT_DISCLAIMER,
  getFounderFitLookup,
  getProfileFromUrl,
  getProfileLabel,
  syncProfileToUrl,
} from "./founderFit.js";

const TIER_FROM_RANK = (rank) => {
  if (rank <= 17) return "green";
  if (rank <= 34) return "yellow";
  return "red";
};

let stateData = {};
let activeProfile = FOUNDER_FIT_OVERALL;
let founderFitLookup = null;
let focusedAbbr = null;

function formatOverallFootnote(cnbcRank, fitRank) {
  const delta = cnbcRank - fitRank;
  if (delta === 0) {
    return `Same as #${cnbcRank} overall`;
  }
  if (delta > 0) {
    return `↑ ${delta} spot${delta > 1 ? "s" : ""} vs #${cnbcRank} overall`;
  }
  const drop = Math.abs(delta);
  return `↓ ${drop} spot${drop > 1 ? "s" : ""} vs #${cnbcRank} overall`;
}

function syncMapUrl() {
  const url = new URL(window.location.href);

  if (activeProfile && activeProfile !== FOUNDER_FIT_OVERALL) {
    url.searchParams.set("profile", activeProfile);
  } else {
    url.searchParams.delete("profile");
  }

  if (focusedAbbr) {
    url.searchParams.set("state", focusedAbbr);
  } else {
    url.searchParams.delete("state");
  }

  history.replaceState(null, "", url);
}

function renderCategories(info) {
  const details = document.getElementById("category-details");
  if (!details || !info?.categories) {
    return;
  }

  const { strengths, weaknesses } = getStrengthsAndWeaknesses(info.categories);
  renderCategoryList(document.getElementById("category-strengths"), strengths, {
    variant: "strength",
  });
  renderCategoryList(document.getElementById("category-weaknesses"), weaknesses, {
    variant: "weakness",
  });
  details.hidden = false;
}

function applySidebarLens(abbr, info) {
  if (!info) {
    return;
  }

  focusedAbbr = abbr;
  const isProfile = activeProfile !== FOUNDER_FIT_OVERALL && founderFitLookup?.[abbr];
  const fit = isProfile ? founderFitLookup[abbr] : null;

  const scoreValue = document.getElementById("score-value");
  const rankValue = document.getElementById("rank-value");
  const barFill = document.getElementById("score-bar-fill");
  const badge = document.getElementById("tier-badge");
  const profileChip = document.getElementById("profile-chip");
  const footnote = document.getElementById("rank-footnote");
  const scoreLabel = document.getElementById("score-label");
  const disclaimer = document.querySelector("[data-map-founder-fit-disclaimer]");

  const displayScore = isProfile ? fit.founderFitScore100 : info.score100;
  const displayRank = isProfile ? fit.founderFitRank : info.rank;
  const displayTier = isProfile ? TIER_FROM_RANK(fit.founderFitRank) : info.tier;

  if (scoreLabel) {
    scoreLabel.textContent = isProfile ? "Fit score" : "Score";
  }
  if (scoreValue) {
    scoreValue.textContent = displayScore;
  }
  if (rankValue) {
    rankValue.textContent = `#${displayRank} of 50`;
  }
  if (barFill) {
    barFill.style.width = `${displayScore}%`;
    barFill.className = `score-bar-fill ${displayTier}`;
  }
  if (badge) {
    badge.textContent = TIER_LABELS[displayTier];
    badge.className = `tier-badge ${displayTier}`;
    badge.hidden = Boolean(isProfile);
  }
  if (profileChip) {
    if (isProfile) {
      profileChip.textContent = getProfileLabel(activeProfile);
      profileChip.hidden = false;
    } else {
      profileChip.hidden = true;
    }
  }
  if (footnote) {
    if (isProfile) {
      footnote.textContent = formatOverallFootnote(info.rank, fit.founderFitRank);
      footnote.hidden = false;
    } else {
      footnote.hidden = true;
    }
  }
  if (disclaimer) {
    disclaimer.hidden = !isProfile;
  }

  document.querySelectorAll("[data-founder-fit-pill]").forEach((pill) => {
    const selected = pill.dataset.profile === activeProfile;
    pill.classList.toggle("is-active", selected);
    pill.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  renderCategories(info);
}

function setProfile(profileId) {
  activeProfile = profileId;
  founderFitLookup =
    profileId === FOUNDER_FIT_OVERALL ? null : getFounderFitLookup(stateData, profileId);

  if (focusedAbbr && stateData[focusedAbbr]) {
    applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
  }

  syncMapUrl();
}

function wireProfilePills() {
  document.querySelectorAll("[data-founder-fit-pill]").forEach((pill) => {
    pill.addEventListener("click", () => {
      setProfile(pill.dataset.profile);
    });
  });
}

export function initMapSidebar(states) {
  stateData = states;
  activeProfile = getProfileFromUrl();
  focusedAbbr =
    new URLSearchParams(window.location.search).get("state")?.trim().toUpperCase() || null;

  if (activeProfile !== FOUNDER_FIT_OVERALL) {
    founderFitLookup = getFounderFitLookup(stateData, activeProfile);
  }

  wireProfilePills();

  document.addEventListener("statecompass:pin", (event) => {
    focusedAbbr = event.detail?.abbr ?? null;
    if (focusedAbbr && stateData[focusedAbbr]) {
      applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
    }
    syncMapUrl();
  });

  document.addEventListener("statecompass:clear", () => {
    focusedAbbr = null;
    syncMapUrl();
  });

  document.addEventListener("statecompass:hover", (event) => {
    const abbr = event.detail?.abbr;
    if (abbr && stateData[abbr]) {
      applySidebarLens(abbr, stateData[abbr]);
    }
  });

  document.addEventListener("statecompass:year", (event) => {
    stateData = event.detail?.states ?? stateData;
    if (activeProfile !== FOUNDER_FIT_OVERALL) {
      founderFitLookup = getFounderFitLookup(stateData, activeProfile);
    }
    if (focusedAbbr && stateData[focusedAbbr]) {
      applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
    }
  });

  if (focusedAbbr && stateData[focusedAbbr]) {
    applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
  }
}

export function refreshMapSidebar(abbr, info) {
  applySidebarLens(abbr, info);
}

export { FOUNDER_FIT_DISCLAIMER };
