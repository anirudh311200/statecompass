import {
  FOUNDER_FIT_OVERALL,
  getFounderFitLookup,
  getProfileFromUrl,
  getProfileLabel,
  syncProfileToUrl,
  wireFounderFitSelector,
} from "./founderFit.js";

let stateData = {};
let activeProfile = FOUNDER_FIT_OVERALL;
let founderFitLookup = null;
let pinnedAbbr = null;

function syncMapUrl() {
  const url = new URL(window.location.href);

  if (activeProfile && activeProfile !== FOUNDER_FIT_OVERALL) {
    url.searchParams.set("profile", activeProfile);
  } else {
    url.searchParams.delete("profile");
  }

  if (pinnedAbbr) {
    url.searchParams.set("state", pinnedAbbr);
  }

  history.replaceState(null, "", url);
}

function updateFounderFitDisplay(abbr) {
  const row = document.getElementById("founder-fit-rank-row");
  const value = document.getElementById("founder-fit-rank-value");

  if (!row || !value) {
    return;
  }

  if (!abbr || activeProfile === FOUNDER_FIT_OVERALL || !founderFitLookup?.[abbr]) {
    row.hidden = true;
    return;
  }

  const fit = founderFitLookup[abbr];
  const label = getProfileLabel(activeProfile);
  value.textContent = `#${fit.founderFitRank} of 50 (${label}) · ${fit.founderFitScore100}/100`;
  row.hidden = false;
}

function setProfile(profileId) {
  activeProfile = profileId;
  founderFitLookup =
    profileId === FOUNDER_FIT_OVERALL ? null : getFounderFitLookup(stateData, profileId);
  updateFounderFitDisplay(pinnedAbbr);
  syncMapUrl();
}

export function initMapFounderFit(states) {
  stateData = states;
  activeProfile = getProfileFromUrl();
  pinnedAbbr = new URLSearchParams(window.location.search).get("state")?.trim().toUpperCase() || null;

  if (activeProfile !== FOUNDER_FIT_OVERALL) {
    founderFitLookup = getFounderFitLookup(stateData, activeProfile);
  }

  wireFounderFitSelector({
    select: document.querySelector("[data-founder-fit-select]"),
    disclaimer: document.querySelector("[data-founder-fit-disclaimer]"),
    initialProfile: activeProfile,
    onChange: setProfile,
  });

  document.addEventListener("statecompass:pin", (event) => {
    pinnedAbbr = event.detail?.abbr ?? null;
    updateFounderFitDisplay(pinnedAbbr);
    syncMapUrl();
  });

  document.addEventListener("statecompass:clear", () => {
    pinnedAbbr = null;
    updateFounderFitDisplay(null);
    syncMapUrl();
  });

  updateFounderFitDisplay(pinnedAbbr);
}
