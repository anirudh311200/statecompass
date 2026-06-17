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
  buildStateDetailUrl,
} from "./yearData.js";

const SORT_DEFAULT_DIR = {
  rank: "asc",
  score: "desc",
  name: "asc",
  cnbc: "asc",
};

const SORT_LABELS = {
  rank: "Rank",
  score: "Score",
  name: "State",
  cnbc: "CNBC rank",
};

export async function initRankings() {
  const tbody = document.getElementById("rankings-body");
  const emptyMsg = document.getElementById("rankings-empty");
  const filterButtons = document.querySelectorAll(".tier-filter-btn");
  const sortButtons = document.querySelectorAll(".rankings-sort-btn");
  const profileSelect = document.querySelector("[data-founder-fit-select]");
  const disclaimer = document.querySelector("[data-founder-fit-disclaimer]");
  const modeLabel = document.getElementById("rankings-mode-label");
  const rankHeader = document.getElementById("rankings-rank-header");
  const scoreHeader = document.getElementById("rankings-score-header");
  const cnbcHeaderCol = document.getElementById("rankings-cnbc-header-col");
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
  let sortDir = SORT_DEFAULT_DIR.rank;
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
        ? `Founder Fit: ${profileLabel} — CNBC ${currentYear}, derived from category scores. Click a column header to sort; click a row for the full breakdown.`
        : `CNBC America's Top States for Business, ${currentYear} — click a column header to sort; click a row for the full breakdown.`;
    }

    const rankLabel = rankHeader?.querySelector(".rankings-sort-label");
    const scoreLabel = scoreHeader?.querySelector(".rankings-sort-label");
    if (rankLabel) {
      rankLabel.textContent = isFounderFit ? "Fit rank" : "Rank";
    }
    if (scoreLabel) {
      scoreLabel.textContent = isFounderFit ? "Fit score" : "Score";
    }

    if (cnbcHeaderCol) {
      cnbcHeaderCol.hidden = !isFounderFit;
    }

    rows.forEach((row) => {
      const cnbcCell = row.querySelector(".rankings-cnbc");
      if (cnbcCell) {
        cnbcCell.hidden = !isFounderFit;
      }
    });

    updateSortIndicators();
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
          cnbcCell.hidden = false;
        }
      } else {
        row.dataset.rank = cnbcRank;
        row.dataset.score = cnbcScore;
        rankCell.textContent = `#${cnbcRank}`;
        scoreCell.textContent = `${cnbcScore}/100`;
        if (cnbcCell) {
          cnbcCell.textContent = "";
          cnbcCell.hidden = true;
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
    let result = 0;

    if (sortKey === "name") {
      result = a.dataset.name.localeCompare(b.dataset.name);
    } else if (sortKey === "score") {
      result = Number(a.dataset.score) - Number(b.dataset.score);
    } else if (sortKey === "cnbc") {
      result = Number(a.dataset.cnbcRank) - Number(b.dataset.cnbcRank);
    } else {
      result = Number(a.dataset.rank) - Number(b.dataset.rank);
    }

    return sortDir === "desc" ? -result : result;
  }

  function updateSortIndicators() {
    sortButtons.forEach((button) => {
      const key = button.dataset.sort;
      const active = key === sortKey;
      const indicator = button.querySelector(".rankings-sort-indicator");
      const th = button.closest("th");

      button.classList.toggle("is-sorted", active);

      if (indicator) {
        indicator.textContent = active ? (sortDir === "asc" ? "▲" : "▼") : "";
      }

      if (th) {
        th.setAttribute(
          "aria-sort",
          active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
        );
      }

      const columnLabel =
        key === "rank"
          ? (rankHeader?.querySelector(".rankings-sort-label")?.textContent ?? SORT_LABELS.rank)
          : key === "score"
            ? (scoreHeader?.querySelector(".rankings-sort-label")?.textContent ?? SORT_LABELS.score)
            : (SORT_LABELS[key] ?? key);

      const directionLabel = active
        ? sortDir === "asc"
          ? "ascending"
          : "descending"
        : "not sorted";

      button.setAttribute(
        "aria-label",
        active
          ? `Sort by ${columnLabel}, ${directionLabel}. Click to reverse.`
          : `Sort by ${columnLabel}`
      );
    });
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

  function setSort(key) {
    if (sortKey === key) {
      sortDir = sortDir === "asc" ? "desc" : "asc";
    } else {
      sortKey = key;
      sortDir = SORT_DEFAULT_DIR[key] ?? "asc";
    }
    updateSortIndicators();
    applyView();
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

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setSort(button.dataset.sort);
    });
  });

  tbody.addEventListener("click", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row || row.hidden) {
      return;
    }
    window.location.href = buildStateDetailUrl(row.dataset.slug, currentYear, index);
  });

  tbody.addEventListener("keydown", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = buildStateDetailUrl(row.dataset.slug, currentYear, index);
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
  updateSortIndicators();
  applyView();
}
