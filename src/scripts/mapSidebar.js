import {
  getStrengthsAndWeaknesses,
  renderCategoryList,
  TIER_LABELS,
} from "./categories.js";
import {
  FOUNDER_FIT_OVERALL,
  FOUNDER_FIT_DISCLAIMER,
  getFounderFitLookup,
  getLensFromUrl,
  getLensLabel,
  syncLensToUrl,
  tierFromLensRank,
} from "./founderFit.js";

const TIER_FROM_RANK = tierFromLensRank;

let stateData = {};
let activeProfile = FOUNDER_FIT_OVERALL;
let founderFitLookup = null;
let focusedAbbr = null;

function formatOverallFootnote(cnbcRank, fitRank) {
  const delta = cnbcRank - fitRank;
  if (delta === 0) {
    return { html: `Same as #${cnbcRank} overall` };
  }
  if (delta > 0) {
    return {
      html: `<span class="rank-footnote-direction is-up" aria-hidden="true">↑</span> ${delta} spot${delta > 1 ? "s" : ""} vs #${cnbcRank} overall`,
      direction: "up",
    };
  }
  const drop = Math.abs(delta);
  return {
    html: `<span class="rank-footnote-direction is-down" aria-hidden="true">↓</span> ${drop} spot${drop > 1 ? "s" : ""} vs #${cnbcRank} overall`,
    direction: "down",
  };
}

function syncMapUrl() {
  const url = new URL(window.location.href);

  if (activeProfile && activeProfile !== FOUNDER_FIT_OVERALL) {
    url.searchParams.set("lens", activeProfile);
  } else {
    url.searchParams.delete("lens");
  }
  url.searchParams.delete("profile");

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

  const displayScore = isProfile ? fit.founderFitScore100 : info.score100;
  const displayRank = isProfile ? fit.founderFitRank : info.rank;
  const displayTier = isProfile ? TIER_FROM_RANK(fit.founderFitRank) : info.tier;

  if (scoreLabel) {
    scoreLabel.textContent = isProfile ? "Lens score" : "Score";
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
      profileChip.textContent = getLensLabel(activeProfile);
      profileChip.hidden = false;
    } else {
      profileChip.hidden = true;
    }
  }
  if (footnote) {
    if (isProfile) {
      const note = formatOverallFootnote(info.rank, fit.founderFitRank);
      footnote.innerHTML = note.html;
      footnote.classList.remove("is-up", "is-down");
      if (note.direction) {
        footnote.classList.add(`is-${note.direction}`);
      }
      footnote.hidden = false;
    } else {
      footnote.innerHTML = "";
      footnote.classList.remove("is-up", "is-down");
      footnote.hidden = true;
    }
  }
  document.querySelectorAll("[data-founder-fit-pill]").forEach((pill) => {
    const selected = pill.dataset.profile === activeProfile;
    pill.classList.toggle("is-active", selected);
    pill.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  renderCategories(info);
  document.dispatchEvent(new CustomEvent("statecompass:sidebar-render"));
}

function setProfile(profileId, { replayIntro = false } = {}) {
  if (profileId === activeProfile) {
    return;
  }

  activeProfile = profileId;
  founderFitLookup =
    profileId === FOUNDER_FIT_OVERALL ? null : getFounderFitLookup(stateData, profileId);

  if (focusedAbbr && stateData[focusedAbbr]) {
    applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
  }

  syncMapUrl();

  document.dispatchEvent(
    new CustomEvent("statecompass:lens", {
      detail: { lensId: profileId, lookup: founderFitLookup, replayIntro },
    })
  );
}

function wireProfilePills() {
  document.querySelectorAll("[data-founder-fit-pill]").forEach((pill) => {
    pill.addEventListener("click", () => {
      setProfile(pill.dataset.profile, { replayIntro: true });
    });
  });
}

export function initMapSidebar(states) {
  stateData = states;
  activeProfile = getLensFromUrl();
  focusedAbbr =
    new URLSearchParams(window.location.search).get("state")?.trim().toUpperCase() || null;

  if (activeProfile !== FOUNDER_FIT_OVERALL) {
    founderFitLookup = getFounderFitLookup(stateData, activeProfile);
  }

  wireProfilePills();

  document.querySelectorAll("[data-founder-fit-pill]").forEach((pill) => {
    const selected = pill.dataset.profile === activeProfile;
    pill.classList.toggle("is-active", selected);
    pill.setAttribute("aria-pressed", selected ? "true" : "false");
  });

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
    document.dispatchEvent(
      new CustomEvent("statecompass:lens", {
        detail: { lensId: activeProfile, lookup: founderFitLookup },
      })
    );
  });

  document.addEventListener("statecompass:lens-suggest", (event) => {
    const lensId = event.detail?.lensId;
    if (lensId && lensId !== FOUNDER_FIT_OVERALL) {
      setProfile(lensId, { replayIntro: true });
    }
  });

  if (focusedAbbr && stateData[focusedAbbr]) {
    applySidebarLens(focusedAbbr, stateData[focusedAbbr]);
  }

  document.dispatchEvent(
    new CustomEvent("statecompass:lens", {
      detail: { lensId: activeProfile, lookup: founderFitLookup },
    })
  );
}

export function refreshMapSidebar(abbr, info) {
  applySidebarLens(abbr, info);
}

export { FOUNDER_FIT_DISCLAIMER };
