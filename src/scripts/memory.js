const STORAGE_KEY = "statecompass:saved";
const MAX_SAVED_STATES = 3;

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { states: [], comparison: null };
    }
    const parsed = JSON.parse(raw);
    return {
      states: Array.isArray(parsed.states) ? parsed.states : [],
      comparison: Array.isArray(parsed.comparison) ? parsed.comparison : null,
    };
  } catch {
    return { states: [], comparison: null };
  }
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  document.dispatchEvent(new CustomEvent("statecompass:saved", { detail: store }));
}

export function getSaved() {
  return readStore();
}

export function saveState(abbr) {
  const normalized = abbr?.trim().toUpperCase();
  if (!normalized) {
    return readStore();
  }

  const store = readStore();
  const without = store.states.filter((item) => item !== normalized);
  store.states = [normalized, ...without].slice(0, MAX_SAVED_STATES);
  writeStore(store);
  return store;
}

export function removeSavedState(abbr) {
  const normalized = abbr?.trim().toUpperCase();
  const store = readStore();
  store.states = store.states.filter((item) => item !== normalized);
  writeStore(store);
  return store;
}

export function saveComparison(abbrs) {
  const normalized = (abbrs ?? [])
    .map((abbr) => abbr?.trim().toUpperCase())
    .filter(Boolean)
    .filter((abbr, index, list) => list.indexOf(abbr) === index)
    .slice(0, MAX_SAVED_STATES);

  const store = readStore();
  store.comparison = normalized.length >= 2 ? normalized : null;
  writeStore(store);
  return store;
}

export function clearSavedComparison() {
  const store = readStore();
  store.comparison = null;
  writeStore(store);
  return store;
}

export function buildCompareHref(abbrs) {
  const active = (abbrs ?? []).filter(Boolean);
  if (active.length < 2) {
    return "/compare";
  }
  return `/compare?states=${active.join(",")}`;
}

export function buildStateHref(abbr, statesObject) {
  const info = statesObject?.[abbr];
  return info?.slug ? `/states/${info.slug}` : null;
}

export function wireSaveButtons(root = document) {
  root.querySelectorAll("[data-save-state]").forEach((button) => {
    button.addEventListener("click", () => {
      saveState(button.dataset.saveState);
    });
  });

  root.querySelectorAll("[data-save-comparison]").forEach((button) => {
    button.addEventListener("click", () => {
      const raw = button.dataset.saveComparison || "";
      saveComparison(raw.split(",").map((part) => part.trim()));
    });
  });
}
