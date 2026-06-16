import { refreshMapSidebar } from "./mapSidebar.js";
import { isStateSaved, toggleSavedState } from "./memory.js";
import { buildStateDetailUrl, wireYearPicker } from "./yearData.js";
import { TIER_GLOWS, TIER_GLOWS_ACTIVE, TIER_GRADIENTS, TIER_MAP_FILLS } from "./categories.js";
import { isMapIntroActive, startMapIntro } from "./mapIntro.js";

const TIER_COLORS = TIER_MAP_FILLS;

const DEFAULT_FILL = TIER_MAP_FILLS.yellow;

const SVG_NS = "http://www.w3.org/2000/svg";

function injectTierGradients(svg) {
  if (!svg) {
    return;
  }

  let defs = svg.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svg.prepend(defs);
  }

  Object.values(TIER_GRADIENTS).forEach(({ id, hi, lo, hiOp, loOp }) => {
    defs.querySelector(`#${id}`)?.remove();

    const grad = document.createElementNS(SVG_NS, "linearGradient");
    grad.id = id;
    grad.setAttribute("x1", "0%");
    grad.setAttribute("y1", "0%");
    grad.setAttribute("x2", "100%");
    grad.setAttribute("y2", "100%");

    const stopHi = document.createElementNS(SVG_NS, "stop");
    stopHi.setAttribute("offset", "0%");
    stopHi.setAttribute("stop-color", hi);
    stopHi.setAttribute("stop-opacity", String(hiOp));

    const stopLo = document.createElementNS(SVG_NS, "stop");
    stopLo.setAttribute("offset", "100%");
    stopLo.setAttribute("stop-color", lo);
    stopLo.setAttribute("stop-opacity", String(loOp));

    grad.append(stopHi, stopLo);
    defs.appendChild(grad);
  });
}

let stateData = {};
let currentYear = 2025;
let yearIndex = null;
let mapPanel = null;
let hoverPath = null;
let pinnedAbbr = null;
let pinnedPath = null;

function normalizeAbbr(value) {
  if (!value) {
    return null;
  }
  const abbr = value.trim().toUpperCase();
  return stateData[abbr] ? abbr : null;
}

function getPathForAbbr(abbr) {
  return document.querySelector(`#us-map .state#${abbr}`);
}

function tierFill(tier) {
  return TIER_COLORS[tier] ?? DEFAULT_FILL;
}

function paintState(path, abbr) {
  const info = stateData[abbr];
  if (!info || !path) {
    return;
  }

  path.style.fill = tierFill(info.tier);
  path.style.filter = "";
}

function highlightPath(path, abbr) {
  const info = stateData[abbr];
  if (!info || !path) {
    return;
  }

  path.classList.add("is-active");
  path.style.fill = tierFill(info.tier);
  path.style.filter = TIER_GLOWS_ACTIVE[info.tier] ?? TIER_GLOWS[info.tier] ?? "";
}

function resetPath(path) {
  if (!path) {
    return;
  }

  path.classList.remove("is-active");
  paintState(path, path.id);
}

function paintAllStates() {
  document.querySelectorAll("#us-map .state").forEach((path) => {
    paintState(path, path.id);
  });
}

function updateMapDimming() {
  const hasFocus = Boolean(hoverPath || pinnedPath);
  mapPanel.classList.toggle("is-dimmed", hasFocus);
}

function updateYearLabels(year) {
  document.querySelectorAll("[data-cnbc-year]").forEach((el) => {
    el.textContent = `CNBC ${year}`;
  });
}

function refreshMapColors() {
  document.querySelectorAll("#us-map .state").forEach((path) => {
    const abbr = path.id;
    const info = stateData[abbr];
    if (!info) {
      return;
    }
    path.setAttribute(
      "aria-label",
      `${info.name}: rank ${info.rank}, score ${info.score100} out of 100`
    );
    if (path === pinnedPath || path === hoverPath) {
      highlightPath(path, abbr);
    } else {
      paintState(path, abbr);
    }
  });
}

function applyYearPayload(payload, year) {
  stateData = payload.states;
  currentYear = year;
  updateYearLabels(year);
  refreshMapColors();

  if (pinnedAbbr && stateData[pinnedAbbr]) {
    updateSidebar(pinnedAbbr, stateData[pinnedAbbr]);
  } else if (hoverPath) {
    const abbr = hoverPath.id;
    if (stateData[abbr]) {
      updateSidebar(abbr, stateData[abbr]);
    }
  }

  document.dispatchEvent(
    new CustomEvent("statecompass:year", {
      detail: { year, payload, states: stateData },
    })
  );
}

function updateBookmarkButton(abbr) {
  const bookmarkBtn = document.getElementById("bookmark-state");
  if (!bookmarkBtn) {
    return;
  }

  const saved = isStateSaved(abbr);
  const info = stateData[abbr];
  bookmarkBtn.hidden = !abbr;
  bookmarkBtn.setAttribute("aria-pressed", saved ? "true" : "false");
  bookmarkBtn.setAttribute(
    "aria-label",
    saved
      ? `Remove ${info?.name ?? abbr} from saved`
      : `Save ${info?.name ?? abbr} for later`
  );
  bookmarkBtn.title = saved ? "Saved — click to remove" : "Save for later";
  bookmarkBtn.classList.toggle("is-saved", saved);
  const icon = bookmarkBtn.querySelector(".bookmark-icon");
  if (icon) {
    icon.textContent = saved ? "★" : "☆";
  }
}

function wireBookmarkControl() {
  const bookmarkBtn = document.getElementById("bookmark-state");
  bookmarkBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const abbr = pinnedAbbr || hoverPath?.id;
    if (!abbr) {
      return;
    }
    toggleSavedState(abbr);
    updateBookmarkButton(abbr);
  });

  document.addEventListener("statecompass:saved", () => {
    const abbr = pinnedAbbr || hoverPath?.id;
    if (abbr) {
      updateBookmarkButton(abbr);
    }
  });
}

function wireYearControl() {
  const root =
    document.querySelector("[data-year-toggle]") ||
    document.querySelector("select[data-year-select]");
  if (!root || !yearIndex) {
    return;
  }

  wireYearPicker(root, {
    index: yearIndex,
    initialYear: currentYear,
    onChange: async (year) => {
      const response = await fetch(`/data/states-${year}.json`);
      if (!response.ok) {
        return;
      }
      const payload = await response.json();
      applyYearPayload(payload, year);

      const url = new URL(window.location.href);
      if (year === yearIndex.defaultYear) {
        url.searchParams.delete("year");
      } else {
        url.searchParams.set("year", String(year));
      }
      history.replaceState(null, "", url);
    },
  });
}

function updateDetailLinks(abbr, info) {
  if (!info?.slug) {
    return;
  }

  const href = buildStateDetailUrl(info.slug, currentYear, yearIndex);
  const nameLink = document.getElementById("state-name-link");
  const detailLink = document.getElementById("map-detail-link");

  if (nameLink) {
    nameLink.textContent = info.name;
    nameLink.href = href;
    nameLink.title = `Full ${info.name} page — categories and Founder Snapshot`;
  }
  if (detailLink) {
    detailLink.href = href;
  }
}

function updateSidebar(abbr, info) {
  const content = document.getElementById("tooltip-content");
  const defaultText = document.getElementById("tooltip-default");
  const clearBtn = document.getElementById("clear-pin");

  content.hidden = true;
  void content.offsetWidth;
  content.hidden = false;

  updateDetailLinks(abbr, info);
  refreshMapSidebar(abbr, info);
  updateBookmarkButton(abbr);

  if (defaultText) {
    defaultText.hidden = true;
  }
  if (clearBtn) {
    clearBtn.hidden = !pinnedAbbr;
  }

  document.querySelector(".info-card")?.classList.add("has-selection");
  document.querySelector(".sidebar")?.classList.add("has-selection");
}

function hideSidebar() {
  document.getElementById("tooltip-content").hidden = true;
  const categoryDetails = document.getElementById("category-details");
  if (categoryDetails) {
    categoryDetails.hidden = true;
  }
  const defaultText = document.getElementById("tooltip-default");
  if (defaultText) {
    defaultText.hidden = false;
  }
  const clearBtn = document.getElementById("clear-pin");
  if (clearBtn) {
    clearBtn.hidden = true;
  }
  const bookmarkBtn = document.getElementById("bookmark-state");
  if (bookmarkBtn) {
    bookmarkBtn.hidden = true;
  }
  document.querySelector(".info-card")?.classList.remove("has-selection");
  document.querySelector(".sidebar")?.classList.remove("has-selection");
}

function syncUrl(abbr) {
  const url = new URL(window.location.href);
  if (abbr) {
    url.searchParams.set("state", abbr);
  } else {
    url.searchParams.delete("state");
  }
  history.replaceState(null, "", url);
}

export function getStateDetailUrl(abbr) {
  const info = stateData[abbr];
  return info?.slug ? buildStateDetailUrl(info.slug, currentYear, yearIndex) : null;
}

export function navigateToStateDetail(abbr) {
  const href = getStateDetailUrl(abbr);
  if (href) {
    window.location.href = href;
  }
}

export function pinState(abbr, { skipUrl = false, focusSidebar = false } = {}) {
  const normalized = normalizeAbbr(abbr);
  if (!normalized) {
    return false;
  }

  const path = getPathForAbbr(normalized);
  if (!path) {
    return false;
  }

  if (pinnedPath && pinnedPath !== path) {
    pinnedPath.classList.remove("is-pinned");
    resetPath(pinnedPath);
  }

  pinnedAbbr = normalized;
  pinnedPath = path;
  path.classList.add("is-pinned");
  highlightPath(path, normalized);
  updateSidebar(normalized, stateData[normalized]);
  updateMapDimming();

  if (!skipUrl) {
    syncUrl(normalized);
  }

  if (focusSidebar) {
    focusSidebarPanel();
  }

  document.dispatchEvent(
    new CustomEvent("statecompass:pin", { detail: { abbr: normalized } })
  );

  return true;
}

export function clearPin({ skipUrl = false } = {}) {
  if (!pinnedAbbr) {
    return;
  }

  if (pinnedPath) {
    pinnedPath.classList.remove("is-pinned");
    resetPath(pinnedPath);
  }

  pinnedAbbr = null;
  pinnedPath = null;

  if (!skipUrl) {
    syncUrl(null);
  }

  if (hoverPath) {
    const abbr = hoverPath.id;
    highlightPath(hoverPath, abbr);
    updateSidebar(abbr, stateData[abbr]);
  } else {
    hideSidebar();
  }

  updateMapDimming();
  document.dispatchEvent(new CustomEvent("statecompass:clear"));
}

export function getStateData() {
  return stateData;
}

export function focusSidebarPanel() {
  const sidebar = document.getElementById("sidebar");
  const infoCard = document.getElementById("info-card");
  if (!sidebar || !infoCard) {
    return;
  }

  infoCard.setAttribute("tabindex", "-1");
  infoCard.focus({ preventScroll: false });
  sidebar.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function activateHover(path, abbr) {
  if (hoverPath && hoverPath !== path) {
    resetPath(hoverPath);
  }

  if (pinnedPath && pinnedPath !== path) {
    resetPath(pinnedPath);
  }

  hoverPath = path;
  highlightPath(path, abbr);
  updateSidebar(abbr, stateData[abbr]);
  updateMapDimming();

  document.dispatchEvent(
    new CustomEvent("statecompass:hover", { detail: { abbr } })
  );
}

function deactivateHover(path) {
  if (hoverPath !== path) {
    return;
  }

  hoverPath = null;
  resetPath(path);

  if (pinnedPath) {
    highlightPath(pinnedPath, pinnedAbbr);
    updateSidebar(pinnedAbbr, stateData[pinnedAbbr]);
  } else {
    hideSidebar();
  }

  updateMapDimming();
}

function wireStates() {
  paintAllStates();

  const paths = document.querySelectorAll("#us-map .state");

  paths.forEach((path) => {
    const abbr = path.id;
    const info = stateData[abbr];
    if (!info) {
      return;
    }

    path.setAttribute("tabindex", "0");
    path.setAttribute("role", "button");
    path.setAttribute(
      "aria-label",
      `${info.name}: rank ${info.rank}, score ${info.score100} out of 100`
    );
    path.setAttribute("aria-pressed", "false");

    path.addEventListener("mouseenter", () => activateHover(path, abbr));
    path.addEventListener("mouseleave", () => deactivateHover(path));
    path.addEventListener("focus", () => activateHover(path, abbr));
    path.addEventListener("blur", () => deactivateHover(path));
    path.addEventListener("click", () => pinState(abbr));
    path.addEventListener("dblclick", () => {
      const href = buildStateDetailUrl(info.slug, currentYear, yearIndex);
      if (document.body.classList.contains("embed-body")) {
        window.open(href, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = href;
      }
    });
    path.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pinState(abbr);
      }
    });
  });
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const abbr = normalizeAbbr(params.get("state"));
  if (abbr) {
    pinState(abbr, { skipUrl: true });
  }
}

function wireGlobalControls() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isMapIntroActive()) {
      return;
    }
    if (event.key === "Escape" && pinnedAbbr) {
      event.preventDefault();
      clearPin();
    }
  });

  const clearBtn = document.getElementById("clear-pin");
  clearBtn?.addEventListener("click", () => clearPin());

  document.addEventListener("statecompass:pin", (event) => {
    const abbr = event.detail?.abbr;
    document.querySelectorAll("#us-map .state").forEach((path) => {
      path.setAttribute("aria-pressed", path.id === abbr ? "true" : "false");
    });
  });

  document.addEventListener("statecompass:clear", () => {
    document.querySelectorAll("#us-map .state").forEach((path) => {
      path.setAttribute("aria-pressed", "false");
    });
  });
}

export async function initMap(options = {}) {
  const embedMode = Boolean(options.embed);
  mapPanel = document.querySelector(".map-panel");

  const indexResponse = await fetch("/data/states-index.json");
  if (!indexResponse.ok) {
    throw new Error("Could not load states index.");
  }
  yearIndex = await indexResponse.json();

  const params = new URLSearchParams(window.location.search);
  const requestedYear = params.get("year");
  const year = requestedYear && yearIndex.availableYears.includes(Number(requestedYear))
    ? Number(requestedYear)
    : yearIndex.defaultYear;

  const response = await fetch(`/data/states-${year}.json`);
  if (!response.ok) {
    throw new Error("Could not load state data.");
  }

  const payload = await response.json();
  stateData = payload.states;
  currentYear = year;
  updateYearLabels(year);

  const svgContainer = document.getElementById("map-container");
  const svgResponse = await fetch("/assets/us-map.svg");
  if (!svgResponse.ok) {
    throw new Error("Could not load map.");
  }
  svgContainer.innerHTML = await svgResponse.text();

  const svg = svgContainer.querySelector("svg");
  if (svg) {
    svg.id = "us-map";
    svg.setAttribute("aria-labelledby", "map-title map-desc");
    injectTierGradients(svg);
  }

  wireStates();
  wireGlobalControls();
  wireYearControl();
  if (!embedMode) {
    wireBookmarkControl();
  }
  applyUrlState();

  if (!embedMode) {
    startMapIntro(mapPanel);
  }

  return stateData;
}
