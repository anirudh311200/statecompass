import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  TIER_LABELS,
} from "./categories.js";

const MAX_STATES = 3;
const MIN_STATES = 2;

let stateData = {};
let selectedAbbrs = ["", "", ""];

function normalizeAbbr(value) {
  if (!value) {
    return null;
  }
  const abbr = value.trim().toUpperCase();
  return stateData[abbr] ? abbr : null;
}

function parseUrlStates() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("states");
  if (!raw) {
    return [];
  }

  const seen = new Set();
  const result = [];

  raw.split(",").forEach((part) => {
    const abbr = normalizeAbbr(part);
    if (abbr && !seen.has(abbr) && result.length < MAX_STATES) {
      seen.add(abbr);
      result.push(abbr);
    }
  });

  return result;
}

function syncUrl() {
  const active = selectedAbbrs.filter(Boolean);
  const url = new URL(window.location.href);

  if (active.length >= MIN_STATES) {
    url.searchParams.set("states", active.join(","));
  } else if (active.length === 1) {
    url.searchParams.set("states", active[0]);
  } else {
    url.searchParams.delete("states");
  }

  history.replaceState(null, "", url);
}

function getActiveAbbrs() {
  return selectedAbbrs.filter(Boolean);
}

function populateSelects() {
  const sorted = Object.entries(stateData).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );

  document.querySelectorAll(".compare-select").forEach((select, index) => {
    const current = selectedAbbrs[index] || "";
    const placeholder = index === 2 ? "None" : "Select a state…";

    select.innerHTML = `<option value="">${placeholder}</option>`;
    sorted.forEach(([abbr, info]) => {
      const option = document.createElement("option");
      option.value = abbr;
      option.textContent = `${info.name} (${abbr})`;
      if (abbr === current) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

function updateSelectOptions() {
  const active = new Set(getActiveAbbrs());

  document.querySelectorAll(".compare-select").forEach((select, index) => {
    const own = selectedAbbrs[index];
    select.querySelectorAll("option").forEach((option) => {
      if (!option.value || option.value === own) {
        option.disabled = false;
        return;
      }
      option.disabled = active.has(option.value);
    });
  });
}

function renderChips() {
  const container = document.getElementById("compare-chips");
  const active = getActiveAbbrs();

  if (!active.length) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.replaceChildren();

  active.forEach((abbr) => {
    const info = stateData[abbr];
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "compare-chip";
    chip.dataset.abbr = abbr;
    chip.innerHTML = `<span>${info.name}</span><span class="compare-chip-remove" aria-hidden="true">×</span>`;
    chip.setAttribute("aria-label", `Remove ${info.name}`);
    container.appendChild(chip);
  });
}

function renderSummary(abbrs) {
  const container = document.getElementById("compare-summary");
  container.replaceChildren();

  abbrs.forEach((abbr) => {
    const info = stateData[abbr];
    const card = document.createElement("div");
    card.className = `compare-summary-card tier-border-${info.tier}`;
    card.innerHTML = `
      <h3 class="compare-state-name">${info.name}</h3>
      <div class="compare-score-row">
        <span class="score-value">${info.score100}</span>
        <span class="score-max">/100</span>
      </div>
      <div class="score-bar-track" aria-hidden="true">
        <div class="score-bar-fill ${info.tier}" style="width: ${info.score100}%"></div>
      </div>
      <p class="compare-meta">Rank <strong>#${info.rank}</strong></p>
      <span class="tier-badge tier-badge--sm ${info.tier}">${TIER_LABELS[info.tier]}</span>
      <a href="/states/${info.slug}" class="compare-detail-link">Full breakdown →</a>
    `;
    container.appendChild(card);
  });
}

function getCategoryWinner(abbrs, categoryKey) {
  let bestRank = Infinity;
  let winners = [];

  abbrs.forEach((abbr) => {
    const cat = stateData[abbr].categories[categoryKey];
    if (!cat) {
      return;
    }
    if (cat.rank < bestRank) {
      bestRank = cat.rank;
      winners = [abbr];
    } else if (cat.rank === bestRank) {
      winners.push(abbr);
    }
  });

  return winners;
}

function renderCategories(abbrs) {
  const container = document.getElementById("compare-categories");
  container.replaceChildren();

  CATEGORY_ORDER.forEach((key) => {
    const winners = getCategoryWinner(abbrs, key);
    const row = document.createElement("div");
    row.className = "compare-category-row";

    const header = document.createElement("div");
    header.className = "compare-category-header";
    header.innerHTML = `<span class="compare-category-label">${CATEGORY_LABELS[key]}</span>`;
    row.appendChild(header);

    const bars = document.createElement("div");
    bars.className = "compare-category-bars";

    abbrs.forEach((abbr) => {
      const info = stateData[abbr];
      const cat = info.categories[key];
      const pct = Math.round((cat.score / cat.maxScore) * 100);
      const isWinner = winners.includes(abbr);

      const barWrap = document.createElement("div");
      barWrap.className = `compare-category-bar-wrap${isWinner ? " is-winner" : ""}`;
      barWrap.innerHTML = `
        <div class="compare-bar-header">
          <span class="compare-bar-state">${info.name}</span>
          <span class="compare-bar-meta">
            ${isWinner ? '<span class="compare-winner-badge">Best</span>' : ""}
            <span class="compare-bar-rank">#${cat.rank}</span>
            <span class="compare-bar-score">${cat.score}/${cat.maxScore}</span>
          </span>
        </div>
        <div class="category-bar-track" aria-hidden="true">
          <div class="category-bar-fill${isWinner ? " is-winner" : ""}" style="width: ${pct}%"></div>
        </div>
      `;
      bars.appendChild(barWrap);
    });

    row.appendChild(bars);
    container.appendChild(row);
  });
}

function renderCompare() {
  const abbrs = getActiveAbbrs();
  const empty = document.getElementById("compare-empty");
  const results = document.getElementById("compare-results");

  if (abbrs.length < MIN_STATES) {
    empty.hidden = false;
    results.hidden = true;
    return;
  }

  empty.hidden = true;
  results.hidden = false;
  renderSummary(abbrs);
  renderCategories(abbrs);
}

function setSlotAbbr(index, abbr) {
  selectedAbbrs[index] = abbr || "";
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
  syncUrl();
}

function removeAbbr(abbr) {
  selectedAbbrs = selectedAbbrs.map((value) => (value === abbr ? "" : value));
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
  syncUrl();
}

function applyUrlToSlots() {
  const fromUrl = parseUrlStates();
  selectedAbbrs = ["", "", ""];
  fromUrl.forEach((abbr, index) => {
    selectedAbbrs[index] = abbr;
  });
}

function wireControls() {
  document.querySelectorAll(".compare-select").forEach((select, index) => {
    select.addEventListener("change", () => {
      setSlotAbbr(index, normalizeAbbr(select.value));
    });
  });

  document.getElementById("compare-chips")?.addEventListener("click", (event) => {
    const chip = event.target.closest(".compare-chip");
    if (!chip) {
      return;
    }
    removeAbbr(chip.dataset.abbr);
  });
}

export async function initCompare() {
  const response = await fetch("/data/states.json");
  if (!response.ok) {
    throw new Error("Could not load state data.");
  }

  const payload = await response.json();
  stateData = payload.states;

  applyUrlToSlots();
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
  wireControls();
}
