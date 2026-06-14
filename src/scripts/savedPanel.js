import {
  getSaved,
  removeSavedState,
  clearSavedComparison,
  buildCompareHref,
} from "./memory.js";
import { loadYearData } from "./yearData.js";

let statesObject = {};

function renderSaved(store) {
  const listEl = document.getElementById("saved-states-list");
  const comparisonEl = document.getElementById("saved-comparison");
  const emptyEl = document.getElementById("saved-empty");
  const countEl = document.getElementById("saved-count");

  if (!listEl || !comparisonEl || !emptyEl) {
    return;
  }

  listEl.innerHTML = "";
  comparisonEl.innerHTML = "";
  comparisonEl.hidden = true;

  const hasStates = store.states.length > 0;
  const hasComparison = Boolean(store.comparison?.length >= 2);

  emptyEl.hidden = hasStates || hasComparison;

  if (countEl) {
    countEl.textContent = String(store.states.length);
    countEl.hidden = !hasStates;
  }

  store.states.forEach((abbr) => {
    const info = statesObject[abbr];
    if (!info) {
      return;
    }

    const chip = document.createElement("div");
    chip.className = `saved-chip saved-chip--${info.tier}`;
    chip.innerHTML = `
      <a href="/?state=${abbr}" class="saved-chip-link" title="Preview ${info.name} on map">
        <span class="saved-chip-dot" aria-hidden="true"></span>
        <span class="saved-chip-name">${info.name}</span>
        <span class="saved-chip-meta">#${info.rank}</span>
      </a>
      <button type="button" class="saved-chip-remove" data-remove-state="${abbr}" aria-label="Remove ${info.name}">×</button>
    `;
    listEl.appendChild(chip);
  });

  if (hasComparison) {
    const names = store.comparison
      .map((abbr) => statesObject[abbr]?.name || abbr)
      .join(" · ");
    const href = buildCompareHref(store.comparison);

    comparisonEl.hidden = false;
    comparisonEl.innerHTML = `
      <p class="saved-comparison-label">Saved comparison</p>
      <a href="${href}" class="saved-comparison-chip">${names} →</a>
      <button type="button" class="saved-chip-remove saved-comparison-clear" data-clear-comparison aria-label="Clear saved comparison">×</button>
    `;
  }

  listEl.querySelectorAll("[data-remove-state]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      removeSavedState(button.dataset.removeState);
    });
  });

  comparisonEl.querySelector("[data-clear-comparison]")?.addEventListener("click", () => {
    clearSavedComparison();
  });
}

export async function initSavedPanel() {
  const panel = document.getElementById("saved-panel");
  if (!panel) {
    return;
  }

  const { states } = await loadYearData();
  statesObject = states;
  renderSaved(getSaved());

  document.addEventListener("statecompass:saved", (event) => {
    renderSaved(event.detail ?? getSaved());
  });

  document.addEventListener("statecompass:year", (event) => {
    statesObject = event.detail?.states ?? statesObject;
    renderSaved(getSaved());
  });
}
