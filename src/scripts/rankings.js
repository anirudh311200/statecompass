import {
  FOUNDER_FIT_OVERALL,
  getFounderFitLookup,
  getProfileFromUrl,
  getProfileLabel,
  syncProfileToUrl,
  wireFounderFitSelector,
} from "./founderFit.js";

export async function initRankings() {
  const tbody = document.getElementById("rankings-body");
  const emptyMsg = document.getElementById("rankings-empty");
  const sortSelect = document.getElementById("rankings-sort");
  const filterButtons = document.querySelectorAll(".tier-filter-btn");
  const profileSelect = document.querySelector("[data-founder-fit-select]");
  const disclaimer = document.querySelector("[data-founder-fit-disclaimer]");
  const modeLabel = document.getElementById("rankings-mode-label");
  const rankHeader = document.getElementById("rankings-rank-header");
  const scoreHeader = document.getElementById("rankings-score-header");
  const cnbcHeader = document.getElementById("rankings-cnbc-header");

  if (!tbody) {
    return;
  }

  const response = await fetch("/data/states.json");
  if (!response.ok) {
    throw new Error("Could not load state data.");
  }

  const payload = await response.json();
  const statesObject = payload.states;
  const lookups = {};

  const rows = Array.from(tbody.querySelectorAll(".rankings-row"));
  let activeTier = "all";
  let sortKey = "rank";
  let activeProfile = getProfileFromUrl();

  rows.forEach((row) => {
    row.dataset.abbr = row.dataset.abbr || "";
  });

  function getLookup(profileId) {
    if (profileId === FOUNDER_FIT_OVERALL) {
      return null;
    }
    if (!lookups[profileId]) {
      lookups[profileId] = getFounderFitLookup(statesObject, profileId);
    }
    return lookups[profileId];
  }

  function updateHeaders(profileId) {
    const isFounderFit = profileId !== FOUNDER_FIT_OVERALL;
    const profileLabel = getProfileLabel(profileId);

    if (modeLabel) {
      modeLabel.textContent = isFounderFit
        ? `Founder Fit: ${profileLabel} — derived from CNBC category scores. Click a row for the full breakdown.`
        : "CNBC America's Top States for Business — click a row for the full breakdown.";
    }

    if (rankHeader) {
      rankHeader.textContent = isFounderFit ? "Fit rank" : "Rank";
    }
    if (scoreHeader) {
      scoreHeader.textContent = isFounderFit ? "Fit score" : "Score";
    }
    if (cnbcHeader) {
      cnbcHeader.hidden = !isFounderFit;
    }
  }

  function applyProfileToRows(profileId) {
    const lookup = getLookup(profileId);
    const isFounderFit = Boolean(lookup);

    rows.forEach((row) => {
      const abbr = row.dataset.abbr;
      const cnbcRank = row.dataset.cnbcRank;
      const cnbcScore = row.dataset.cnbcScore;
      const rankCell = row.querySelector(".rankings-rank");
      const scoreCell = row.querySelector(".rankings-score");
      const cnbcCell = row.querySelector(".rankings-cnbc");

      if (isFounderFit && lookup[abbr]) {
        const fit = lookup[abbr];
        row.dataset.rank = String(fit.founderFitRank);
        row.dataset.score = String(fit.founderFitScore100);
        rankCell.textContent = `#${fit.founderFitRank}`;
        scoreCell.textContent = `${fit.founderFitScore100}/100`;
        if (cnbcCell) {
          cnbcCell.textContent = `#${cnbcRank}`;
        }
      } else {
        row.dataset.rank = cnbcRank;
        row.dataset.score = cnbcScore;
        rankCell.textContent = `#${cnbcRank}`;
        scoreCell.textContent = `${cnbcScore}/100`;
        if (cnbcCell) {
          cnbcCell.textContent = "";
        }
      }
    });

    updateHeaders(profileId);
  }

  function compareRows(a, b) {
    if (sortKey === "name") {
      return a.dataset.name.localeCompare(b.dataset.name);
    }
    if (sortKey === "score") {
      return Number(b.dataset.score) - Number(a.dataset.score);
    }
    if (sortKey === "tier") {
      const tierOrder = { green: 0, yellow: 1, red: 2 };
      return tierOrder[a.dataset.tier] - tierOrder[b.dataset.tier];
    }
    if (sortKey === "cnbc") {
      return Number(a.dataset.cnbcRank) - Number(b.dataset.cnbcRank);
    }
    return Number(a.dataset.rank) - Number(b.dataset.rank);
  }

  function applyView() {
    let visibleCount = 0;

    rows.forEach((row) => {
      const matchesTier = activeTier === "all" || row.dataset.tier === activeTier;
      row.hidden = !matchesTier;
      if (matchesTier) {
        visibleCount += 1;
      }
    });

    const visibleRows = rows.filter((row) => !row.hidden);
    visibleRows.sort(compareRows);
    visibleRows.forEach((row) => tbody.appendChild(row));

    if (emptyMsg) {
      emptyMsg.hidden = visibleCount > 0;
    }
  }

  function setProfile(profileId) {
    activeProfile = profileId;
    if (profileSelect) {
      profileSelect.value = profileId;
    }
    applyProfileToRows(profileId);
    syncProfileToUrl(profileId);
    applyView();
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTier = button.dataset.tier;
      filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
      applyView();
    });
  });

  sortSelect?.addEventListener("change", () => {
    sortKey = sortSelect.value;
    applyView();
  });

  tbody.addEventListener("click", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row || row.hidden) {
      return;
    }
    window.location.href = `/states/${row.dataset.slug}`;
  });

  tbody.addEventListener("keydown", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = `/states/${row.dataset.slug}`;
    }
  });

  wireFounderFitSelector({
    select: profileSelect,
    disclaimer,
    initialProfile: activeProfile,
    onChange: setProfile,
  });

  if (profileSelect) {
    profileSelect.value = activeProfile;
  }
  applyProfileToRows(activeProfile);
  applyView();
}
