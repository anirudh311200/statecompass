import {
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  TIER_LABELS,
} from "./categories.js";
import {
  FOUNDER_FIT_OVERALL,
  getFounderFitLookup,
  getProfileFromUrl,
  getProfileLabel,
  wireFounderFitSelector,
} from "./founderFit.js";
import { trackCompare } from "./analytics.js";
import { wireCopyButton } from "./share.js";
import { downloadComparePng } from "./exportCompare.js";
import { HEADS_UP_COMPARE_ROWS, HEADS_UP_SHARED_TITLE } from "./snapshotLabels.js";
import { saveComparison } from "./memory.js";
import {
  loadIndex,
  getYearFromUrl,
  resolveYear,
  loadYearPayload,
  syncYearToUrl,
  buildStateDetailUrl,
} from "./yearData.js";

const MAX_STATES = 3;
const MIN_STATES = 2;

const SNAPSHOT_ROWS = [
  { key: "taxPosture", label: "Tax posture" },
  { key: "businessRegistration", label: "Business registration" },
  { key: "complianceCalendar", label: "Compliance calendar" },
];

let stateData = {};
let snapshotData = {};
let snapshotDisclaimer = "";
let dataYear = 2025;
let yearIndex = null;
let selectedAbbrs = ["", "", ""];
let activeProfile = FOUNDER_FIT_OVERALL;
let founderFitLookup = null;
let embedMode = false;
let lastCompareTrackKey = "";

function normalizeAbbr(value) {
  if (!value) {
    return null;
  }
  const abbr = value.trim().toUpperCase();
  return stateData[abbr] ? abbr : null;
}

function parseUrlStates() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("states");
  if (!raw) {
    return [];
  }

  const seen = new Set();
  const result = [];

  raw.split(",").forEach((part) => {
    const abbr = normalizeAbbr(part);
    if (abbr && !seen.has(abbr) && result.length < MAX_STATES) {
      seen.add(abbr);
      result.push(abbr);
    }
  });

  return result;
}

function syncUrl() {
  const active = selectedAbbrs.filter(Boolean);
  const url = new URL(window.location.href);

  if (active.length >= MIN_STATES) {
    url.searchParams.set("states", active.join(","));
  } else if (active.length === 1) {
    url.searchParams.set("states", active[0]);
  } else {
    url.searchParams.delete("states");
  }

  if (activeProfile && activeProfile !== FOUNDER_FIT_OVERALL) {
    url.searchParams.set("profile", activeProfile);
  } else {
    url.searchParams.delete("profile");
  }

  history.replaceState(null, "", url);
}

function getActiveAbbrs() {
  return selectedAbbrs.filter(Boolean);
}

function populateSelects() {
  const sorted = Object.entries(stateData).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );

  document.querySelectorAll(".compare-select").forEach((select, index) => {
    const current = selectedAbbrs[index] || "";
    const placeholder = index === 2 ? "None" : "Select a state…";

    select.innerHTML = `<option value="">${placeholder}</option>`;
    sorted.forEach(([abbr, info]) => {
      const option = document.createElement("option");
      option.value = abbr;
      option.textContent = `${info.name} (${abbr})`;
      if (abbr === current) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  });
}

function updateSelectOptions() {
  const active = new Set(getActiveAbbrs());

  document.querySelectorAll(".compare-select").forEach((select, index) => {
    const own = selectedAbbrs[index];
    select.querySelectorAll("option").forEach((option) => {
      if (!option.value || option.value === own) {
        option.disabled = false;
        return;
      }
      option.disabled = active.has(option.value);
    });
  });
}

function renderChips() {
  const container = document.getElementById("compare-chips");
  const active = getActiveAbbrs();

  if (!active.length) {
    container.hidden = true;
    container.replaceChildren();
    return;
  }

  container.hidden = false;
  container.replaceChildren();

  active.forEach((abbr) => {
    const info = stateData[abbr];
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "compare-chip";
    chip.dataset.abbr = abbr;
    chip.innerHTML = `<span>${info.name}</span><span class="compare-chip-remove" aria-hidden="true">×</span>`;
    chip.setAttribute("aria-label", `Remove ${info.name}`);
    container.appendChild(chip);
  });
}

function renderSummary(abbrs) {
  const container = document.getElementById("compare-summary");
  container.replaceChildren();
  const showFounderFit = activeProfile !== FOUNDER_FIT_OVERALL && founderFitLookup;

  let bestRank = Infinity;
  abbrs.forEach((abbr) => {
    const rank = stateData[abbr].rank;
    if (rank < bestRank) {
      bestRank = rank;
    }
  });

  abbrs.forEach((abbr) => {
    const info = stateData[abbr];
    const fit = showFounderFit ? founderFitLookup[abbr] : null;
    const card = document.createElement("div");
    const isLeading = info.rank === bestRank;
    card.className = `compare-summary-card tier-border-${info.tier}${isLeading ? " is-leading" : ""}`;
    card.innerHTML = `
      <h3 class="compare-state-name">${info.name}</h3>
      <div class="compare-score-row">
        <span class="score-value">${info.score100}</span>
        <span class="score-max">/100</span>
      </div>
      <div class="score-bar-track" aria-hidden="true">
        <div class="score-bar-fill ${info.tier}" style="width: ${info.score100}%"></div>
      </div>
      <p class="compare-meta">Overall rank <strong>#${info.rank}</strong></p>
      ${
        fit
          ? `<p class="compare-meta compare-founder-fit-meta">Founder Fit (${getProfileLabel(activeProfile)}): <strong>#${fit.founderFitRank}</strong> · ${fit.founderFitScore100}/100</p>`
          : ""
      }
      <span class="tier-badge tier-badge--sm ${info.tier}">${TIER_LABELS[info.tier]}</span>
      <a href="${buildStateDetailUrl(info.slug, dataYear, yearIndex)}" class="compare-detail-link"${embedMode ? ' target="_blank" rel="noopener noreferrer"' : ""}>Full breakdown →</a>
    `;
    container.appendChild(card);
  });
}

function getCategoryWinner(abbrs, categoryKey) {
  let bestRank = Infinity;
  let winners = [];

  abbrs.forEach((abbr) => {
    const cat = stateData[abbr].categories[categoryKey];
    if (!cat) {
      return;
    }
    if (cat.rank < bestRank) {
      bestRank = cat.rank;
      winners = [abbr];
    } else if (cat.rank === bestRank) {
      winners.push(abbr);
    }
  });

  return winners;
}

function renderCategories(abbrs) {
  const container = document.getElementById("compare-categories");
  container.replaceChildren();

  CATEGORY_ORDER.forEach((key) => {
    const winners = getCategoryWinner(abbrs, key);
    const row = document.createElement("div");
    row.className = "compare-category-row";

    const header = document.createElement("div");
    header.className = "compare-category-header";
    header.innerHTML = `<span class="compare-category-label">${CATEGORY_LABELS[key]}</span>`;
    row.appendChild(header);

    const bars = document.createElement("div");
    bars.className = "compare-category-bars";

    abbrs.forEach((abbr) => {
      const info = stateData[abbr];
      const cat = info.categories[key];
      const pct = Math.round((cat.score / cat.maxScore) * 100);
      const isWinner = winners.includes(abbr);

      const barWrap = document.createElement("div");
      barWrap.className = `compare-category-bar-wrap${isWinner ? " is-winner" : ""}`;
      barWrap.innerHTML = `
        <div class="compare-bar-header">
          <span class="compare-bar-state">${info.name}</span>
          <span class="compare-bar-meta">
            ${isWinner ? '<span class="compare-winner-badge">Best</span>' : ""}
            <span class="compare-bar-rank">#${cat.rank}</span>
            <span class="compare-bar-score">${cat.score}/${cat.maxScore}</span>
          </span>
        </div>
        <div class="category-bar-track" aria-hidden="true">
          <div class="category-bar-fill${isWinner ? " is-winner" : ""}" style="width: ${pct}%"></div>
        </div>
      `;
      bars.appendChild(barWrap);
    });

    row.appendChild(bars);
    container.appendChild(row);
  });
}

function appendSourceLine(parent, fact) {
  const source = document.createElement("p");
  source.className = "compare-snapshot-source";
  source.append("Source: ");
  const link = document.createElement("a");
  link.href = fact.sourceUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = fact.sourceLabel;
  source.append(link);
  parent.appendChild(source);
}

function renderSnapshotFactCell(fact) {
  const cell = document.createElement("div");
  cell.className = "compare-snapshot-cell";

  const value = document.createElement("p");
  value.className = "compare-snapshot-value";
  value.textContent = fact.value;
  cell.appendChild(value);
  appendSourceLine(cell, fact);

  return cell;
}

function renderSnapshotCompareRow(abbrs, label, resolveFact) {
  const row = document.createElement("div");
  row.className = "compare-snapshot-row";

  const header = document.createElement("div");
  header.className = "compare-snapshot-header";
  header.innerHTML = `<span class="compare-snapshot-label">${label}</span>`;
  row.appendChild(header);

  const cols = document.createElement("div");
  cols.className = "compare-snapshot-cols";

  abbrs.forEach((abbr) => {
    const info = stateData[abbr];
    const col = document.createElement("div");
    col.className = "compare-snapshot-col";

    const stateLabel = document.createElement("p");
    stateLabel.className = "compare-snapshot-state";
    stateLabel.textContent = info.name;
    col.appendChild(stateLabel);

    const fact = resolveFact(abbr);
    if (fact) {
      col.appendChild(renderSnapshotFactCell(fact));
    } else {
      const missing = document.createElement("p");
      missing.className = "compare-snapshot-value compare-snapshot-missing";
      missing.textContent = "Not available.";
      col.appendChild(missing);
    }

    cols.appendChild(col);
  });

  row.appendChild(cols);
  return row;
}

function renderSharedHeadsUpNote(abbrs) {
  const sampleAbbr = abbrs.find((abbr) => snapshotData[abbr]?.multiStateHeadsUp?.length >= 4);
  if (!sampleAbbr) {
    return null;
  }

  const sharedBullets = snapshotData[sampleAbbr].multiStateHeadsUp.slice(2);
  const note = document.createElement("div");
  note.className = "compare-snapshot-shared-note";

  const title = document.createElement("p");
  title.className = "compare-snapshot-shared-title";
  title.textContent = HEADS_UP_SHARED_TITLE;
  note.appendChild(title);

  const list = document.createElement("ul");
  list.className = "compare-snapshot-shared-list";

  sharedBullets.forEach((bullet) => {
    const item = document.createElement("li");
    item.className = "compare-snapshot-shared-item";

    const value = document.createElement("p");
    value.className = "compare-snapshot-value";
    value.textContent = bullet.value;
    item.appendChild(value);
    appendSourceLine(item, bullet);

    list.appendChild(item);
  });

  note.appendChild(list);
  return note;
}

function renderSnapshotCompare(abbrs) {
  const container = document.getElementById("compare-snapshot");
  const disclaimerEl = document.getElementById("compare-snapshot-disclaimer");
  if (!container) {
    return;
  }

  container.replaceChildren();

  if (disclaimerEl && snapshotDisclaimer) {
    disclaimerEl.replaceChildren();
    const text = document.createElement("p");
    text.className = "snapshot-disclaimer-text";
    text.textContent = snapshotDisclaimer;
    disclaimerEl.append(text);
  }

  SNAPSHOT_ROWS.forEach(({ key, label }) => {
    container.appendChild(
      renderSnapshotCompareRow(abbrs, label, (abbr) => snapshotData[abbr]?.[key] ?? null)
    );
  });

  const subsection = document.createElement("div");
  subsection.className = "compare-snapshot-subsection";
  subsection.innerHTML = `
    <p class="compare-snapshot-subsection-title">Multi-state heads-up</p>
    <p class="compare-snapshot-subsection-helper">If you operate outside these states or hire remotely — compare topic by topic, not ranked.</p>
  `;
  container.appendChild(subsection);

  HEADS_UP_COMPARE_ROWS.forEach(({ index, label }) => {
    container.appendChild(
      renderSnapshotCompareRow(abbrs, label, (abbr) => {
        const bullets = snapshotData[abbr]?.multiStateHeadsUp;
        return bullets?.[index] ?? null;
      })
    );
  });

  const sharedNote = renderSharedHeadsUpNote(abbrs);
  if (sharedNote) {
    container.appendChild(sharedNote);
  }
}

function announceCompareUpdate(abbrs) {
  const liveStatus = document.getElementById("compare-live-status");
  if (!liveStatus || abbrs.length < MIN_STATES) {
    return;
  }

  const names = abbrs.map((abbr) => stateData[abbr].name).join(", ");
  liveStatus.textContent = `Comparison updated: ${names}.`;
}

function updateShareBar(abbrs) {
  const shareBar = document.getElementById("compare-share-bar");
  if (!shareBar) {
    return;
  }

  shareBar.hidden = abbrs.length < MIN_STATES;
}

function renderCompare() {
  const abbrs = getActiveAbbrs();
  const empty = document.getElementById("compare-empty");
  const results = document.getElementById("compare-results");

  if (abbrs.length < MIN_STATES) {
    empty.hidden = false;
    results.hidden = true;
    updateShareBar(abbrs);
    return;
  }

  empty.hidden = true;
  results.hidden = false;
  renderSummary(abbrs);
  renderCategories(abbrs);
  renderSnapshotCompare(abbrs);
  updateShareBar(abbrs);
  announceCompareUpdate(abbrs);

  const trackKey = abbrs.join(",");
  if (trackKey !== lastCompareTrackKey) {
    lastCompareTrackKey = trackKey;
    trackCompare(abbrs);
  }
}

function setSlotAbbr(index, abbr) {
  selectedAbbrs[index] = abbr || "";
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
  syncUrl();
}

function removeAbbr(abbr) {
  selectedAbbrs = selectedAbbrs.map((value) => (value === abbr ? "" : value));
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
  syncUrl();
}

function applyUrlToSlots() {
  const fromUrl = parseUrlStates();
  selectedAbbrs = ["", "", ""];
  fromUrl.forEach((abbr, index) => {
    selectedAbbrs[index] = abbr;
  });
}

function updateYearLabels(year) {
  document.querySelectorAll("[data-cnbc-year]").forEach((el) => {
    el.textContent = `CNBC ${year}`;
  });
}

function applyYearPayload(payload, year) {
  stateData = payload.states;
  dataYear = year;
  founderFitLookup =
    activeProfile === FOUNDER_FIT_OVERALL ? null : getFounderFitLookup(stateData, activeProfile);
  updateYearLabels(year);
  populateSelects();
  updateSelectOptions();
  renderChips();
  renderCompare();
}

function wireYearControl() {
  const select = document.querySelector("[data-year-select]");
  if (!select || !yearIndex) {
    return;
  }

  select.innerHTML = "";
  yearIndex.availableYears.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `CNBC ${year}`;
    select.appendChild(option);
  });
  select.value = String(dataYear);

  select.addEventListener("change", async () => {
    const year = Number(select.value);
    const payload = await loadYearPayload(year);
    applyYearPayload(payload, year);
    syncYearToUrl(year, yearIndex);
  });
}

function wireControls() {
  document.querySelectorAll(".compare-select").forEach((select, index) => {
    select.addEventListener("change", () => {
      setSlotAbbr(index, normalizeAbbr(select.value));
    });
  });

  document.getElementById("compare-chips")?.addEventListener("click", (event) => {
    const chip = event.target.closest(".compare-chip");
    if (!chip) {
      return;
    }
    removeAbbr(chip.dataset.abbr);
  });

  wireCopyButton(
    document.getElementById("copy-compare-link"),
    () => window.location.href,
    document.getElementById("compare-share-status"),
    { shareType: "compare" }
  );

  document.getElementById("print-compare")?.addEventListener("click", () => {
    window.print();
  });

  document.getElementById("download-compare-png")?.addEventListener("click", () => {
    downloadComparePng(document.getElementById("compare-results"), {
      abbrs: getActiveAbbrs(),
      dataYear,
      statusEl: document.getElementById("compare-share-status"),
      buttonEl: document.getElementById("download-compare-png"),
    });
  });

  document.getElementById("save-comparison")?.addEventListener("click", () => {
    const abbrs = getActiveAbbrs();
    if (abbrs.length < MIN_STATES) {
      return;
    }
    saveComparison(abbrs);
    const status = document.getElementById("compare-share-status");
    if (status) {
      status.textContent = "Comparison saved for later in this browser.";
    }
  });
}

function setProfile(profileId) {
  activeProfile = profileId;
  founderFitLookup =
    profileId === FOUNDER_FIT_OVERALL ? null : getFounderFitLookup(stateData, profileId);
  renderCompare();
  syncUrl();
}

export async function initCompare(options = {}) {
  embedMode = Boolean(options.embed);
  yearIndex = await loadIndex();
  const year = resolveYear(getYearFromUrl(), yearIndex);

  const payloadPromise = loadYearPayload(year);
  const snapshotsPromise = embedMode
    ? Promise.resolve(null)
    : fetch("/data/founder_snapshots.json");

  const [payload, snapshotsResponse] = await Promise.all([payloadPromise, snapshotsPromise]);

  if (!embedMode) {
    if (!snapshotsResponse.ok) {
      throw new Error("Could not load Founder Snapshot data.");
    }
    const snapshotsPayload = await snapshotsResponse.json();
    snapshotData = snapshotsPayload.states;
    snapshotDisclaimer = snapshotsPayload.disclaimer ?? "";
  }

  stateData = payload.states;
  dataYear = payload.year ?? year;
  activeProfile = getProfileFromUrl();
  updateYearLabels(dataYear);

  wireFounderFitSelector({
    select: document.querySelector("[data-founder-fit-select]"),
    disclaimer: document.querySelector("[data-founder-fit-disclaimer]"),
    initialProfile: activeProfile,
    onChange: setProfile,
  });

  if (activeProfile !== FOUNDER_FIT_OVERALL) {
    founderFitLookup = getFounderFitLookup(stateData, activeProfile);
  }

  applyUrlToSlots();
  if (!embedMode) {
    populateSelects();
    updateSelectOptions();
    renderChips();
  }
  renderCompare();

  wireYearControl();

  if (embedMode) {
    return;
  }

  wireControls();

  const saved = new URLSearchParams(window.location.search).get("states");
  if (!saved) {
    try {
      const stored = JSON.parse(localStorage.getItem("statecompass:saved") || "{}");
      if (stored.comparison?.length >= MIN_STATES) {
        selectedAbbrs = ["", "", ""];
        stored.comparison.forEach((abbr, index) => {
          if (index < MAX_STATES && stateData[abbr]) {
            selectedAbbrs[index] = abbr;
          }
        });
        populateSelects();
        updateSelectOptions();
        renderChips();
        renderCompare();
      }
    } catch {
      // ignore malformed saved data
    }
  }
}
