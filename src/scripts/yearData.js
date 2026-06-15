import { CATEGORY_ORDER, CATEGORY_LABELS } from "./categories.js";

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

export function buildStateDetailUrl(slug, year, index) {
  const path = `/states/${slug}`;
  const defaultYear = index?.defaultYear ?? 2025;
  if (!year || year === defaultYear) {
    return path;
  }
  return `${path}?year=${year}`;
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

export function wireYearPicker(root, { index, initialYear, onChange }) {
  if (!root || !index) {
    return;
  }

  const select = root.matches?.("select[data-year-select]")
    ? root
    : root.querySelector?.("select[data-year-select]");

  if (select) {
    wireYearSelector(select, { index, initialYear, onChange });
    return;
  }

  const menu = root.matches?.("[data-year-menu]")
    ? root
    : root.querySelector?.("[data-year-menu]");
  if (menu) {
    wireYearMenu(menu, { index, initialYear, onChange });
    return;
  }

  const toggle = root.matches?.("[data-year-toggle]")
    ? root
    : root.querySelector?.("[data-year-toggle]");
  if (toggle) {
    wireYearToggle(toggle, { index, initialYear, onChange });
  }
}

function wireYearMenu(menu, { index, initialYear, onChange }) {
  const trigger = menu.querySelector("[data-year-menu-trigger]");
  const panel = menu.querySelector("[data-year-menu-panel]");
  const list = menu.querySelector("[data-year-menu-list]");
  const valueEl = menu.querySelector("[data-year-menu-value]");
  if (!trigger || !panel || !list || !valueEl) {
    return;
  }

  let activeYear = initialYear;
  let open = false;

  function setOpen(next) {
    open = next;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    menu.classList.toggle("is-open", open);
  }

  function renderOptions() {
    list.innerHTML = "";
    index.availableYears.forEach((year) => {
      const item = document.createElement("li");
      item.className = "year-menu-option";
      item.setAttribute("role", "option");
      item.dataset.year = String(year);
      item.textContent = `CNBC ${year}`;
      item.setAttribute("aria-selected", year === activeYear ? "true" : "false");
      item.classList.toggle("is-selected", year === activeYear);
      item.addEventListener("click", () => {
        if (year === activeYear) {
          setOpen(false);
          return;
        }
        activeYear = year;
        valueEl.textContent = `CNBC ${year}`;
        renderOptions();
        setOpen(false);
        onChange(year);
      });
      list.appendChild(item);
    });
    valueEl.textContent = `CNBC ${activeYear}`;
  }

  trigger.addEventListener("click", (event) => {
    event.stopPropagation();
    setOpen(!open);
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if ((event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") && !open) {
      event.preventDefault();
      setOpen(true);
    }
  });

  document.addEventListener("click", (event) => {
    if (!menu.contains(event.target)) {
      setOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });

  renderOptions();
}

function wireYearToggle(toggle, { index, initialYear, onChange }) {
  const track = toggle.querySelector("[data-year-toggle-track]");
  if (!track) {
    return;
  }

  let activeYear = initialYear;

  function syncButtons() {
    track.querySelectorAll("[data-year-toggle-btn]").forEach((button) => {
      const year = Number(button.dataset.year);
      const selected = year === activeYear;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  track.innerHTML = "";
  index.availableYears.forEach((year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "year-toggle-btn";
    button.dataset.yearToggleBtn = "";
    button.dataset.year = String(year);
    button.textContent = `CNBC ${year}`;
    button.setAttribute("aria-pressed", year === activeYear ? "true" : "false");
    button.classList.toggle("is-active", year === activeYear);
    button.addEventListener("click", () => {
      if (year === activeYear) {
        return;
      }
      activeYear = year;
      syncButtons();
      onChange(year);
    });
    track.appendChild(button);
  });
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

export function computeStateYoYDrivers(abbr, priorPayload, currentPayload) {
  const prior = priorPayload.states[abbr];
  const current = currentPayload.states[abbr];
  if (!prior || !current) {
    return null;
  }

  const categories = CATEGORY_ORDER.map((key) => {
    const priorCat = prior.categories[key];
    const currentCat = current.categories[key];
    const rankDelta = priorCat.rank - currentCat.rank;
    return {
      key,
      label: CATEGORY_LABELS[key],
      priorRank: priorCat.rank,
      currentRank: currentCat.rank,
      rankDelta,
      priorScore: priorCat.score,
      currentScore: currentCat.score,
      scoreDelta: currentCat.score - priorCat.score,
    };
  });

  const overallRankDelta = prior.rank - current.rank;

  return {
    abbr,
    name: current.name,
    slug: current.slug,
    overall: {
      priorRank: prior.rank,
      currentRank: current.rank,
      rankDelta: overallRankDelta,
      priorScore: prior.rawScore,
      currentScore: current.rawScore,
      scoreDelta: current.rawScore - prior.rawScore,
    },
    categories,
    drags: categories
      .filter((cat) => cat.rankDelta < 0)
      .sort((a, b) => a.rankDelta - b.rankDelta),
    lifts: categories
      .filter((cat) => cat.rankDelta > 0)
      .sort((a, b) => b.rankDelta - a.rankDelta),
  };
}

export function dispatchYearChange(year, payload) {
  document.dispatchEvent(
    new CustomEvent("statecompass:year", {
      detail: { year, payload, states: payload.states },
    })
  );
}
