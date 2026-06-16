const STORAGE_KEY = "statecompass:seen-intro";
const INTRO_DURATION_MS = 1100;
const MAX_STAGGER_MS = 420;

let introActive = false;
let cleanupFns = [];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function hasSeenIntro() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  } catch {
    return true;
  }
}

export function markIntroSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* storage unavailable */
  }
}

export function isMapIntroActive() {
  return introActive;
}

function shouldRunIntro() {
  if (prefersReducedMotion()) {
    return false;
  }
  if (document.body.classList.contains("embed-body")) {
    return false;
  }
  if (hasSeenIntro()) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("state")) {
    return false;
  }
  return true;
}

function computeStaggerDelay(path, svg) {
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || svg.getBoundingClientRect().width || 1000;
  const bbox = path.getBBox();
  const centerX = bbox.x + bbox.width / 2;
  const origin = viewBox.x || 0;
  const normalized = Math.max(0, Math.min(1, (centerX - origin) / width));
  return Math.round(normalized * MAX_STAGGER_MS);
}

function maybePulseSearch() {
  if (prefersReducedMotion()) {
    return;
  }

  const defaultText = document.getElementById("tooltip-default");
  const sidebar = document.querySelector(".sidebar");
  if (!defaultText || defaultText.hidden || sidebar?.classList.contains("has-selection")) {
    return;
  }

  const searchWrap = document.querySelector(".search-wrap--map");
  if (!searchWrap) {
    return;
  }

  searchWrap.classList.add("search-prompt-pulse");
  window.setTimeout(() => {
    searchWrap.classList.remove("search-prompt-pulse");
  }, 4200);
}

function clearIntroStyles(mapPanel) {
  mapPanel.classList.remove("is-map-intro", "is-map-intro-animate", "is-map-intro-skipped");
  mapPanel.querySelectorAll(".map-intro-state").forEach((path) => {
    path.classList.remove("map-intro-state");
    path.style.fillOpacity = "";
    path.style.removeProperty("--intro-delay");
  });
}

function finishIntro(mapPanel, { pulseSearch = true } = {}) {
  if (!introActive) {
    return;
  }

  introActive = false;
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  clearIntroStyles(mapPanel);
  markIntroSeen();

  if (pulseSearch) {
    maybePulseSearch();
  }

  document.dispatchEvent(new CustomEvent("statecompass:intro-complete"));
}

function skipIntro(mapPanel) {
  if (!introActive) {
    return;
  }

  mapPanel.classList.add("is-map-intro-skipped");
  finishIntro(mapPanel, { pulseSearch: false });
}

export function startMapIntro(mapPanel) {
  if (!mapPanel || !shouldRunIntro()) {
    return;
  }

  const svg = mapPanel.querySelector("#us-map");
  if (!svg) {
    return;
  }

  introActive = true;
  mapPanel.classList.add("is-map-intro");

  svg.querySelectorAll(".state").forEach((path) => {
    path.style.setProperty("--intro-delay", `${computeStaggerDelay(path, svg)}ms`);
    path.classList.add("map-intro-state");
    path.style.fillOpacity = "0";
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (introActive) {
        mapPanel.classList.add("is-map-intro-animate");
      }
    });
  });

  const completeTimer = window.setTimeout(
    () => finishIntro(mapPanel),
    INTRO_DURATION_MS + MAX_STAGGER_MS + 80
  );
  cleanupFns.push(() => window.clearTimeout(completeTimer));

  const onSkipInteraction = () => skipIntro(mapPanel);
  const onKeyDown = (event) => {
    if (event.key !== "Escape") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    skipIntro(mapPanel);
  };
  const onPin = () => skipIntro(mapPanel);

  document.addEventListener("click", onSkipInteraction, true);
  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("statecompass:pin", onPin);

  cleanupFns.push(() => {
    document.removeEventListener("click", onSkipInteraction, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("statecompass:pin", onPin);
  });
}
