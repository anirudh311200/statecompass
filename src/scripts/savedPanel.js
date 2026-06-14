import {
  getSaved,
  removeSavedState,
  clearSavedComparison,
  buildCompareHref,
  buildStateHref,
} from "./memory.js";
import { loadYearData } from "./yearData.js";

let statesObject = {};

function renderSaved(store) {
  const listEl = document.getElementById("saved-states-list");
  const comparisonEl = document.getElementById("saved-comparison");
  const emptyEl = document.getElementById("saved-empty");

  if (!listEl || !comparisonEl || !emptyEl) {
    return;
  }

  listEl.innerHTML = "";
  comparisonEl.innerHTML = "";
  comparisonEl.hidden = true;

  const hasStates = store.states.length > 0;
  const hasComparison = Boolean(store.comparison?.length >= 2);

  emptyEl.hidden = hasStates || hasComparison;

  store.states.forEach((abbr) => {
    const info = statesObject[abbr];
    if (!info) {
      return;
    }

    const item = document.createElement("div");
    item.className = "saved-item";
    item.innerHTML = `
      <a href="${buildStateHref(abbr, statesObject)}" class="saved-item-link">${info.name}</a>
      <span class="saved-item-meta">#${info.rank} · ${info.score100}/100</span>
      <button type="button" class="saved-item-remove" data-remove-state="${abbr}" aria-label="Remove ${info.name} from saved">Remove</button>
    `;
    listEl.appendChild(item);
  });

  if (hasComparison) {
    const names = store.comparison
      .map((abbr) => statesObject[abbr]?.name || abbr)
      .join(" vs ");
    const href = buildCompareHref(store.comparison);

    comparisonEl.hidden = false;
    comparisonEl.innerHTML = `
      <p class="saved-comparison-label">Saved comparison</p>
      <a href="${href}" class="saved-comparison-link">${names}</a>
      <button type="button" class="saved-item-remove" data-clear-comparison aria-label="Clear saved comparison">Clear</button>
    `;
  }

  listEl.querySelectorAll("[data-remove-state]").forEach((button) => {
    button.addEventListener("click", () => {
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

export function refreshSavedPanelStates(states) {
  statesObject = states;
  renderSaved(getSaved());
}
