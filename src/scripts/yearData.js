const INDEX_PATH = "/data/states-index.json";
const YEAR_PATH = (year) => `/data/states-${year}.json`;

let indexCache = null;
const yearPayloadCache = new Map();

export async function loadIndex() {
  if (indexCache) {
    return indexCache;
  }
  const response = await fetch(INDEX_PATH);
  if (!response.ok) {
    throw new Error("Could not load states index.");
  }
  indexCache = await response.json();
  return indexCache;
}

export function getYearFromUrl(search = window.location.search) {
  const raw = new URLSearchParams(search).get("year");
  if (!raw || !/^\d{4}$/.test(raw)) {
    return null;
  }
  return Number(raw);
}

export function resolveYear(requestedYear, index) {
  const available = index?.availableYears ?? [];
  if (requestedYear && available.includes(requestedYear)) {
    return requestedYear;
  }
  return index?.defaultYear ?? available[0] ?? 2025;
}

export async function loadYearPayload(year) {
  if (yearPayloadCache.has(year)) {
    return yearPayloadCache.get(year);
  }
  const response = await fetch(YEAR_PATH(year));
  if (!response.ok) {
    throw new Error(`Could not load CNBC data for ${year}.`);
  }
  const payload = await response.json();
  yearPayloadCache.set(year, payload);
  return payload;
}

export async function loadYearData(requestedYear) {
  const index = await loadIndex();
  const year = resolveYear(requestedYear, index);
  const payload = await loadYearPayload(year);
  return { index, year, payload, states: payload.states };
}

export function syncYearToUrl(year, index) {
  const url = new URL(window.location.href);
  if (year === index.defaultYear) {
    url.searchParams.delete("year");
  } else {
    url.searchParams.set("year", String(year));
  }
  history.replaceState(null, "", url);
}

export function wireYearSelector(select, { index, initialYear, onChange }) {
  if (!select) {
    return;
  }

  select.innerHTML = "";
  index.availableYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `CNBC ${year}`;
    select.appendChild(option);
  });
  select.value = String(initialYear);

  select.addEventListener("change", () => {
    const year = Number(select.value);
    onChange(year);
  });
}

export function getLatestChangelog(index) {
  if (!index?.changelog?.length) {
    return null;
  }
  return index.changelog[0];
}

export function getPriorYear(year, index) {
  const years = [...(index?.availableYears ?? [])].sort((a, b) => a - b);
  const idx = years.indexOf(year);
  return idx > 0 ? years[idx - 1] : null;
}

export function computeYoYMovers(priorPayload, currentPayload, { categoryKey = null } = {}) {
  const movers = [];

  for (const [abbr, current] of Object.entries(currentPayload.states)) {
    const prior = priorPayload.states[abbr];
    if (!prior) {
      continue;
    }

    let priorRank;
    let currentRank;

    if (categoryKey) {
      priorRank = prior.categories?.[categoryKey]?.rank;
      currentRank = current.categories?.[categoryKey]?.rank;
    } else {
      priorRank = prior.rank;
      currentRank = current.rank;
    }

    if (priorRank == null || currentRank == null) {
      continue;
    }

    const delta = priorRank - currentRank;
    movers.push({
      abbr,
      name: current.name,
      slug: current.slug,
      priorRank,
      currentRank,
      delta,
    });
  }

  return movers.sort((a, b) => b.delta - a.delta || a.name.localeCompare(b.name));
}

export function formatRankDelta(delta) {
  if (delta > 0) {
    return `+${delta}`;
  }
  if (delta < 0) {
    return String(delta);
  }
  return "—";
}

export function dispatchYearChange(year, payload) {
  document.dispatchEvent(
    new CustomEvent("statecompass:year", {
      detail: { year, payload, states: payload.states },
    })
  );
}
