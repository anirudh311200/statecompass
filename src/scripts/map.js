import { refreshMapSidebar } from "./mapSidebar.js";

const TIER_COLORS = {
  green: "#22c55e",
  yellow: "#eab308",
  red: "#ef4444",
};

const TIER_GLOWS = {
  green: "drop-shadow(0 0 6px rgba(34, 197, 94, 0.55))",
  yellow: "drop-shadow(0 0 6px rgba(234, 179, 8, 0.55))",
  red: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.55))",
};

const DEFAULT_FILL = "#d1d5db";

let stateData = {};
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

function highlightPath(path, abbr) {
  const info = stateData[abbr];
  if (!info || !path) {
    return;
  }

  path.classList.add("is-active");
  path.style.fill = TIER_COLORS[info.tier];
  path.style.filter = TIER_GLOWS[info.tier];
}

function resetPath(path) {
  if (!path) {
    return;
  }

  path.classList.remove("is-active");
  path.style.fill = DEFAULT_FILL;
  path.style.filter = "";
}

function updateMapDimming() {
  const hasFocus = Boolean(hoverPath || pinnedPath);
  mapPanel.classList.toggle("is-dimmed", hasFocus);
}

function updateDetailLinks(abbr, info) {
  if (!info?.slug) {
    return;
  }

  const href = `/states/${info.slug}`;
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
  return info?.slug ? `/states/${info.slug}` : null;
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
      window.location.href = `/states/${info.slug}`;
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

export async function initMap() {
  mapPanel = document.querySelector(".map-panel");
  const response = await fetch("/data/states.json");
  if (!response.ok) {
    throw new Error("Could not load state data.");
  }

  const payload = await response.json();
  stateData = payload.states;

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
  }

  wireStates();
  wireGlobalControls();
  applyUrlState();

  return stateData;
}
