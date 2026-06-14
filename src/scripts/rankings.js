import {
  FOUNDER_FIT_OVERALL,
  getFounderFitLookup,
  getProfileFromUrl,
  getProfileLabel,
  syncProfileToUrl,
  wireFounderFitSelector,
} from "./founderFit.js";
import { TIER_LABELS } from "./categories.js";
import {
  loadIndex,
  getYearFromUrl,
  resolveYear,
  loadYearPayload,
  syncYearToUrl,
} from "./yearData.js";

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
  const yearSelect = document.querySelector("[data-year-select]");

  if (!tbody) {
    return;
  }

  const index = await loadIndex();
  let currentYear = resolveYear(getYearFromUrl(), index);
  let payload = await loadYearPayload(currentYear);
  let statesObject = payload.states;
  const lookups = {};

  const rows = Array.from(tbody.querySelectorAll(".rankings-row"));
  let activeTier = "all";
  let sortKey = "rank";
  let activeProfile = getProfileFromUrl();

  function populateRowsFromYear() {
    rows.forEach((row) => {
      const abbr = row.dataset.abbr;
      const state = statesObject[abbr];
      if (!state) {
        return;
      }
      row.dataset.tier = state.tier;
      row.dataset.cnbcRank = String(state.rank);
      row.dataset.cnbcScore = String(state.score100);
      row.dataset.rank = String(state.rank);
      row.dataset.score = String(state.score100);
      row.dataset.slug = state.slug;
      row.dataset.name = state.name;
      row.setAttribute(
        "aria-label",
        `${state.name}, rank ${state.rank}, score ${state.score100} out of 100`
      );
    });
  }

  function wireYearSelector() {
    if (!yearSelect) {
      return;
    }

    yearSelect.innerHTML = "";
    index.availableYears.forEach((year) => {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = `CNBC ${year}`;
      yearSelect.appendChild(option);
    });
    yearSelect.value = String(currentYear);

    yearSelect.addEventListener("change", async () => {
      currentYear = Number(yearSelect.value);
      payload = await loadYearPayload(currentYear);
      statesObject = payload.states;
      populateRowsFromYear();
      applyProfileToRows(activeProfile);
      syncYearToUrl(currentYear, index);
      applyView();
      document.dispatchEvent(
        new CustomEvent("statecompass:year", {
          detail: { year: currentYear, payload, states: statesObject },
        })
      );
    });
  }

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
        ? `Founder Fit: ${profileLabel} — CNBC ${currentYear}, derived from category scores. Click a row for the full breakdown.`
        : `CNBC America's Top States for Business, ${currentYear} — click a row for the full breakdown.`;
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
    Object.keys(lookups).forEach((key) => delete lookups[key]);
    const lookup = getLookup(profileId);
    const isFounderFit = Boolean(lookup);

    rows.forEach((row) => {
      const abbr = row.dataset.abbr;
      const cnbcRank = row.dataset.cnbcRank;
      const cnbcScore = row.dataset.cnbcScore;
      const rankCell = row.querySelector(".rankings-rank");
      const scoreCell = row.querySelector(".rankings-score");
      const cnbcCell = row.querySelector(".rankings-cnbc");
      const tierCell = row.querySelector(".tier-badge");

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

      if (tierCell && statesObject[abbr]) {
        const tier = statesObject[abbr].tier;
        row.dataset.tier = tier;
        tierCell.className = `tier-badge tier-badge--sm ${tier}`;
        tierCell.textContent = TIER_LABELS[tier] ?? tier;
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

  wireYearSelector();
  populateRowsFromYear();

  if (profileSelect) {
    profileSelect.value = activeProfile;
  }
  applyProfileToRows(activeProfile);
  applyView();
}
