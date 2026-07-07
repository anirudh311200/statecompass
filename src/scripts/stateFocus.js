import metrosPayload from "../../public/data/state_metros.json";
import { getQuizLabel } from "./founderMatch.js";
import { explainBestMetro } from "./matchExplain.js";
import { trackStateFocusOpen, trackMetroHighlight } from "./analytics.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const DEFAULT_VIEWBOX = { x: 6, y: 6, w: 948, h: 588 };
const METRO_LAYER_ID = "state-focus-metros";
const FOCUS_CLASS = "is-state-focus";

let metrosByState = metrosPayload.states ?? {};
let focusAbbr = null;
let focusAnswers = null;
let reducedMotion = false;

function getSvg() {
  return document.getElementById("us-map");
}

function getMapPanel() {
  return document.querySelector(".map-panel");
}

function geoToSvg(lat, lng) {
  const x = DEFAULT_VIEWBOX.x + ((lng + 125) / 59) * DEFAULT_VIEWBOX.w;
  const y = DEFAULT_VIEWBOX.y + ((50 - lat) / 26) * DEFAULT_VIEWBOX.h;
  return { x, y };
}

function getStateBBox(abbr) {
  const path = document.getElementById(abbr);
  if (!path) {
    return null;
  }
  const box = path.getBBox();
  return { x: box.x, y: box.y, w: box.width, h: box.height };
}

function computeFocusViewBox(abbr, padding = 28) {
  const bbox = getStateBBox(abbr);
  if (!bbox || bbox.w <= 0 || bbox.h <= 0) {
    return { ...DEFAULT_VIEWBOX };
  }
  const padX = Math.max(padding, bbox.w * 0.12);
  const padY = Math.max(padding, bbox.h * 0.12);
  return {
    x: bbox.x - padX,
    y: bbox.y - padY,
    w: bbox.w + padX * 2,
    h: bbox.h + padY * 2,
  };
}

function setViewBox(vb, animate = true) {
  const svg = getSvg();
  if (!svg) {
    return;
  }

  const target = `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`;
  if (reducedMotion || !animate) {
    svg.setAttribute("viewBox", target);
    return;
  }

  const start = svg.viewBox.baseVal;
  const from = {
    x: start.x,
    y: start.y,
    w: start.width,
    h: start.height,
  };
  const duration = 650;
  const t0 = performance.now();

  function frame(now) {
    const t = Math.min(1, (now - t0) / duration);
    const ease = 1 - (1 - t) ** 3;
    const x = from.x + (vb.x - from.x) * ease;
    const y = from.y + (vb.y - from.y) * ease;
    const w = from.w + (vb.w - from.w) * ease;
    const h = from.h + (vb.h - from.h) * ease;
    svg.setAttribute("viewBox", `${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)}`);
    if (t < 1) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

function scoreMetroForProfile(metro, answers) {
  if (!answers) {
    return 0;
  }

  let score = 0;
  const tags = metro.industryTags ?? [];

  const modelMap = {
    saas: ["saas"],
    fintech: ["fintech", "finance"],
    ecommerce: ["ecommerce"],
    marketplace: ["marketplace"],
    other: ["bootstrap"],
  };
  (modelMap[answers.model] ?? []).forEach((tag) => {
    if (tags.includes(tag)) {
      score += 3;
    }
  });

  const talentMap = {
    engineering: ["engineering", "saas"],
    finance: ["finance", "fintech"],
    healthcare: ["healthcare"],
    general: ["bootstrap"],
  };
  (talentMap[answers.talent] ?? []).forEach((tag) => {
    if (tags.includes(tag)) {
      score += 2;
    }
  });

  if (answers.vc === "yes" || answers.vc === "planning") {
    if (tags.includes("vc")) {
      score += 2;
    }
  }
  if (answers.vc === "no" && tags.includes("bootstrap")) {
    score += 2;
  }

  if (answers.col === "yes" && tags.includes("bootstrap")) {
    score += 1;
  }

  return score;
}

function pickBestMetro(stateAbbr, answers) {
  const entry = metrosByState[stateAbbr];
  if (!entry?.metros?.length) {
    return null;
  }
  const sorted = [...entry.metros].sort(
    (a, b) => scoreMetroForProfile(b, answers) - scoreMetroForProfile(a, answers)
  );
  return sorted[0] ?? null;
}

function removeMetroLayer() {
  document.getElementById(METRO_LAYER_ID)?.remove();
}

function renderMetroLayer(stateAbbr, answers) {
  removeMetroLayer();
  const svg = getSvg();
  const entry = metrosByState[stateAbbr];
  if (!svg || !entry?.metros?.length) {
    return null;
  }

  const best = pickBestMetro(stateAbbr, answers);
  const layer = document.createElementNS(SVG_NS, "g");
  layer.id = METRO_LAYER_ID;
  layer.setAttribute("role", "group");
  layer.setAttribute("aria-label", `Metro areas in ${stateAbbr}`);

  entry.metros.forEach((metro) => {
    const { x, y } = geoToSvg(metro.lat, metro.lng);
    const isBest = best?.id === metro.id;

    const pin = document.createElementNS(SVG_NS, "circle");
    pin.setAttribute("cx", x.toFixed(2));
    pin.setAttribute("cy", y.toFixed(2));
    pin.setAttribute("r", isBest ? "6" : "4");
    pin.classList.add("metro-pin");
    if (isBest) {
      pin.classList.add("metro-pin--best");
    }
    pin.dataset.metroId = metro.id;

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", (x + 8).toFixed(2));
    label.setAttribute("y", (y + 4).toFixed(2));
    label.classList.add("metro-label");
    if (isBest) {
      label.classList.add("metro-label--best");
    }
    label.textContent = metro.name;

    layer.append(pin, label);
  });

  svg.appendChild(layer);

  if (best) {
    trackMetroHighlight(stateAbbr, best.id);
  }

  return best;
}

function renderMetroSidebar(stateAbbr, answers, bestMetro) {
  const host = document.getElementById("match-metro-panel");
  if (!host) {
    return;
  }

  const entry = metrosByState[stateAbbr];
  if (!entry?.metros?.length) {
    host.hidden = true;
    return;
  }

  host.hidden = false;
  const title = host.querySelector("[data-metro-state-name]");
  const list = host.querySelector("[data-metro-list]");
  const bestLine = host.querySelector("[data-metro-best-line]");

  if (title) {
    title.textContent = entry.stateAbbr;
  }

  list?.replaceChildren();
  entry.metros.forEach((metro) => {
    const item = document.createElement("li");
    item.className = "metro-list-item";
    if (bestMetro?.id === metro.id) {
      item.classList.add("metro-list-item--best");
    }

    const name = document.createElement("strong");
    name.textContent = metro.name;

    const strengths = document.createElement("p");
    strengths.className = "metro-strengths";
    strengths.textContent = metro.strengths.join(" · ");

    item.append(name, strengths);
    list?.appendChild(item);
  });

  if (bestLine && bestMetro) {
    bestLine.textContent = explainBestMetro(bestMetro, answers);
    bestLine.hidden = false;
  } else if (bestLine) {
    bestLine.hidden = true;
  }
}

function applyFocusDimming(activeAbbr) {
  document.querySelectorAll("#us-map .state").forEach((path) => {
    if (path.id === activeAbbr) {
      path.classList.add("is-focus-active");
      path.style.opacity = "1";
    } else {
      path.classList.remove("is-focus-active");
      path.style.opacity = "0.18";
    }
  });
}

function clearFocusDimming() {
  document.querySelectorAll("#us-map .state").forEach((path) => {
    path.classList.remove("is-focus-active");
    path.style.opacity = "";
  });
}

export function enterStateFocus(stateAbbr, answers) {
  const abbr = String(stateAbbr ?? "").toUpperCase();
  if (!abbr || !metrosByState[abbr]) {
    return;
  }

  focusAbbr = abbr;
  focusAnswers = answers ?? null;

  const panel = getMapPanel();
  panel?.classList.add(FOCUS_CLASS);
  panel?.classList.add("is-dimmed");

  applyFocusDimming(abbr);
  setViewBox(computeFocusViewBox(abbr), !reducedMotion);

  const best = renderMetroLayer(abbr, answers);
  renderMetroSidebar(abbr, answers, best);

  trackStateFocusOpen(abbr);

  const toolbar = document.getElementById("state-focus-toolbar");
  if (toolbar) {
    toolbar.hidden = false;
  }

  document.dispatchEvent(
    new CustomEvent("statecompass:state-focus", { detail: { abbr, bestMetro: best } })
  );
}

export function exitStateFocus({ animate = true } = {}) {
  if (!focusAbbr) {
    return;
  }

  focusAbbr = null;
  focusAnswers = null;

  const panel = getMapPanel();
  panel?.classList.remove(FOCUS_CLASS);

  clearFocusDimming();
  removeMetroLayer();
  setViewBox({ ...DEFAULT_VIEWBOX }, animate && !reducedMotion);

  const host = document.getElementById("match-metro-panel");
  if (host) {
    host.hidden = true;
  }

  const toolbar = document.getElementById("state-focus-toolbar");
  if (toolbar) {
    toolbar.hidden = true;
  }

  document.dispatchEvent(new CustomEvent("statecompass:state-focus-clear"));
}

export function getFocusAbbr() {
  return focusAbbr;
}

export function initStateFocus() {
  reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("statecompass:clear", () => {
    exitStateFocus();
  });

  document.addEventListener("statecompass:pin", (event) => {
    const abbr = event.detail?.abbr;
    if (focusAbbr && abbr && abbr !== focusAbbr) {
      enterStateFocus(abbr, focusAnswers);
    }
  });

  const exitBtn = document.getElementById("exit-state-focus");
  exitBtn?.addEventListener("click", () => {
    exitStateFocus();
    document.getElementById("clear-pin")?.click();
  });
}

export async function loadMetrosData() {
  try {
    const res = await fetch("/data/state_metros.json");
    if (res.ok) {
      const payload = await res.json();
      metrosByState = payload.states ?? metrosByState;
    }
  } catch {
    /* use bundled fallback */
  }
}
