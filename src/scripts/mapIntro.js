const INTRO_DURATION_MS = 2600;
const MAX_STAGGER_MS = 1000;
const REPLAY_INTRO_DURATION_MS = 1400;
const REPLAY_MAX_STAGGER_MS = 600;
const SKIP_GRACE_MS = 500;

let introActive = false;
let introCompletedThisPage = false;
let cleanupFns = [];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isMapIntroActive() {
  return introActive;
}

function shouldRunIntro() {
  if (introCompletedThisPage) {
    return false;
  }
  if (prefersReducedMotion()) {
    return false;
  }
  if (document.body.classList.contains("embed-body")) {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  if (params.get("state")) {
    return false;
  }
  return true;
}

function computeStaggerDelay(path, svg, maxStaggerMs = MAX_STAGGER_MS) {
  const viewBox = svg.viewBox.baseVal;
  const width = viewBox.width || svg.getBoundingClientRect().width || 1000;
  const bbox = path.getBBox();
  const centerX = bbox.x + bbox.width / 2;
  const origin = viewBox.x || 0;
  const normalized = Math.max(0, Math.min(1, (centerX - origin) / width));
  return Math.round(normalized * maxStaggerMs);
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
  mapPanel.style.removeProperty("--intro-duration");
  mapPanel.querySelectorAll(".map-intro-state").forEach((path) => {
    path.classList.remove("map-intro-state");
    path.style.fillOpacity = "";
    path.style.removeProperty("--intro-delay");
  });
}

function cancelIntro(mapPanel) {
  if (!introActive || !mapPanel) {
    return;
  }

  introActive = false;
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];
  clearIntroStyles(mapPanel);
}

function finishIntro(mapPanel, { pulseSearch = true, markPageComplete = true } = {}) {
  if (!introActive) {
    return;
  }

  introActive = false;
  if (markPageComplete) {
    introCompletedThisPage = true;
  }
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  clearIntroStyles(mapPanel);

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

function wireSkipHandlers(mapPanel) {
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

function runMapIntro(
  mapPanel,
  {
    durationMs = INTRO_DURATION_MS,
    maxStaggerMs = MAX_STAGGER_MS,
    pulseSearch = true,
    wireSkip = true,
    markPageComplete = true,
  } = {}
) {
  if (!mapPanel || prefersReducedMotion()) {
    return;
  }

  const svg = mapPanel.querySelector("#us-map");
  if (!svg) {
    return;
  }

  cancelIntro(mapPanel);

  introActive = true;
  mapPanel.classList.add("is-map-intro");
  mapPanel.style.setProperty("--intro-duration", `${durationMs}ms`);

  svg.querySelectorAll(".state").forEach((path) => {
    path.style.setProperty("--intro-delay", `${computeStaggerDelay(path, svg, maxStaggerMs)}ms`);
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
    () => finishIntro(mapPanel, { pulseSearch, markPageComplete }),
    durationMs + maxStaggerMs + 120
  );
  cleanupFns.push(() => window.clearTimeout(completeTimer));

  if (wireSkip) {
    const skipGraceTimer = window.setTimeout(() => wireSkipHandlers(mapPanel), SKIP_GRACE_MS);
    cleanupFns.push(() => window.clearTimeout(skipGraceTimer));
  }
}

export function startMapIntro(mapPanel) {
  if (!mapPanel || !shouldRunIntro()) {
    return;
  }

  runMapIntro(mapPanel);
}

export function replayMapIntro(mapPanel) {
  if (!mapPanel || document.body.classList.contains("embed-body")) {
    return;
  }

  runMapIntro(mapPanel, {
    durationMs: REPLAY_INTRO_DURATION_MS,
    maxStaggerMs: REPLAY_MAX_STAGGER_MS,
    pulseSearch: false,
    wireSkip: false,
    markPageComplete: false,
  });
}
