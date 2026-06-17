import { CATEGORY_LABELS } from "./categories.js";
import { cnbcStateArticleUrl, METHODOLOGY_URLS } from "../lib/cnbcUrls.js";
import {
  loadIndex,
  loadYearPayload,
  getYearFromUrl,
  resolveYear,
  getPriorYear,
  computeYoYMovers,
  computeStateYoYDrivers,
  formatRankDelta,
  syncYearToUrl,
  buildStateDetailUrl,
} from "./yearData.js";
import {
  renderDumbbellCharts,
  setDumbbellHighlight,
  setDumbbellExpanded,
  wireDumbbellChartInteractions,
} from "./moversChart.js";

let expandedAbbr = null;
let highlightedAbbr = null;
let lastPriorPayload = null;
let lastCurrentPayload = null;
let lastPriorYear = null;
let lastCurrentYear = null;
let lastCategoryKey = "";
let lastIndex = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderDriverList(drivers, label, className) {
  if (!drivers.length) {
    return `<p class="movers-context-muted">No major ${label} in this period.</p>`;
  }
  return `<ul class="movers-driver-list ${className}">
    ${drivers
      .slice(0, 3)
      .map(
        (cat) =>
          `<li><span class="movers-driver-label">${escapeHtml(cat.label)}</span> <span class="movers-driver-delta">${formatRankDelta(cat.rankDelta)} ranks</span> <span class="movers-driver-ranks">#${cat.priorRank}→#${cat.currentRank}</span></li>`
      )
      .join("")}
  </ul>`;
}

function renderContextPanel(drivers, { priorYear, currentYear, categoryKey }) {
  if (!drivers) {
    return "";
  }

  const scopeLabel = categoryKey ? CATEGORY_LABELS[categoryKey] : "Overall";
  const scopedCategory = categoryKey
    ? drivers.categories.find((cat) => cat.key === categoryKey)
    : null;

  const compareHref = `/?state=${drivers.abbr}&year=${currentYear}`;
  const stateHref = buildStateDetailUrl(drivers.slug, currentYear, lastIndex);
  const cnbcHref = cnbcStateArticleUrl(currentYear, drivers.slug);
  const snapshotHref = `${stateHref}#founder-snapshot`;

  const focusBlock = scopedCategory
    ? `<p class="movers-context-focus">
        <strong>${escapeHtml(scopeLabel)}:</strong>
        #${scopedCategory.priorRank} → #${scopedCategory.currentRank}
        (${formatRankDelta(scopedCategory.rankDelta)} ranks ·
        ${scopedCategory.priorScore}→${scopedCategory.currentScore} CNBC pts)
      </p>`
    : `<p class="movers-context-focus">
        <strong>Overall:</strong>
        #${drivers.overall.priorRank} → #${drivers.overall.currentRank}
        (${formatRankDelta(drivers.overall.rankDelta)} ranks ·
        ${drivers.overall.priorScore}→${drivers.overall.currentScore} CNBC pts)
      </p>`;

  return `
    <div class="movers-context-inner">
      <p class="movers-context-title">What moved for ${escapeHtml(drivers.name)}</p>
      ${focusBlock}
      <div class="movers-context-columns">
        <div>
          <p class="movers-context-subhead is-up">Biggest lifts</p>
          ${renderDriverList(drivers.lifts, "lifts", "is-up")}
        </div>
        <div>
          <p class="movers-context-subhead is-down">Biggest drags</p>
          ${renderDriverList(drivers.drags, "drags", "is-down")}
        </div>
      </div>
      <p class="movers-context-note">
        Rank changes use CNBC ${priorYear} vs ${currentYear} category ranks and point totals.
        Methodology and weights can differ year to year — a drop may reflect peer movement, not only local conditions.
      </p>
      <div class="movers-context-links">
        <a href="${compareHref}">Preview on map</a>
        <a href="${stateHref}">Full state page</a>
        <a href="${cnbcHref}" target="_blank" rel="noopener noreferrer">CNBC ${currentYear} writeup</a>
        <a href="${snapshotHref}">Founder Snapshot</a>
      </div>
      <p class="movers-context-disclaimer">Founder Snapshot is operational context — not CNBC-scored.</p>
    </div>
  `;
}

function renderMoverRows(movers, { categoryKey, categoryLabel, tableId }) {
  return movers
    .map((mover) => {
      const deltaClass =
        mover.delta > 0 ? "is-up" : mover.delta < 0 ? "is-down" : "is-flat";
      const isExpanded = expandedAbbr === mover.abbr;
      const drivers = computeStateYoYDrivers(mover.abbr, lastPriorPayload, lastCurrentPayload);
      const contextHtml = isExpanded
        ? renderContextPanel(drivers, {
            priorYear: lastPriorYear,
            currentYear: lastCurrentYear,
            categoryKey,
          })
        : "";

      return `
        <tr class="movers-row" data-abbr="${mover.abbr}" data-table="${tableId}">
          <td class="movers-name">
            <button type="button" class="movers-expand-btn" aria-expanded="${isExpanded}" aria-label="Show what moved for ${escapeHtml(mover.name)}">
              <span class="movers-expand-icon" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span>
            </button>
            <a href="${buildStateDetailUrl(mover.slug, lastCurrentYear, lastIndex)}">${escapeHtml(mover.name)}</a>
          </td>
          <td class="movers-rank">#${mover.priorRank}</td>
          <td class="movers-rank">#${mover.currentRank}</td>
          <td class="movers-delta ${deltaClass}">${formatRankDelta(mover.delta)}</td>
        </tr>
        <tr class="movers-detail-row" data-detail-for="${mover.abbr}" data-table="${tableId}" ${isExpanded ? "" : "hidden"}>
          <td colspan="4">${contextHtml}</td>
        </tr>
      `;
    })
    .join("");
}

function updateMethodologyNote(index, priorYear, currentYear) {
  const note = document.getElementById("movers-methodology");
  if (!note) {
    return;
  }

  const priorUrl = index.methodologyUrls?.[String(priorYear)] ?? METHODOLOGY_URLS[priorYear];
  const currentUrl = index.methodologyUrls?.[String(currentYear)] ?? METHODOLOGY_URLS[currentYear];

  note.innerHTML = `
    <strong>How to read YoY movers:</strong>
    Rank #1 is top of 50 — lower number is better. Leftward on the chart means climbed; rightward means fell.
    CNBC reweights categories and metrics each year. Compare ranks within the same study — point totals across years use different category caps.
    <a href="${priorUrl}" target="_blank" rel="noopener noreferrer">CNBC ${priorYear} methodology</a>
    ·
    <a href="${currentUrl}" target="_blank" rel="noopener noreferrer">CNBC ${currentYear} methodology</a>
  `;
}

function setTableHighlight(abbr) {
  document.querySelectorAll(".movers-row").forEach((row) => {
    row.classList.toggle("is-chart-highlighted", abbr != null && row.dataset.abbr === abbr);
  });
}

function wireTableRowHover(tbody, chartEl) {
  tbody?.querySelectorAll(".movers-row").forEach((row) => {
    row.addEventListener("mouseenter", () => {
      highlightedAbbr = row.dataset.abbr;
      setTableHighlight(highlightedAbbr);
      setDumbbellHighlight(chartEl, highlightedAbbr);
    });
    row.addEventListener("mouseleave", () => {
      highlightedAbbr = null;
      setTableHighlight(null);
      setDumbbellHighlight(chartEl, null);
    });
  });
}

function wireTableInteractions(tbody, tableId, chartEl) {
  tbody?.addEventListener("click", (event) => {
    const expandBtn = event.target.closest(".movers-expand-btn");
    const row = event.target.closest(".movers-row");

    if (expandBtn && row) {
      event.preventDefault();
      const abbr = row.dataset.abbr;
      expandedAbbr = expandedAbbr === abbr ? null : abbr;
      rerenderTables();
      setDumbbellExpanded(chartEl, expandedAbbr);
      return;
    }

    if (row && !event.target.closest("a") && !expandBtn) {
      const abbr = row.dataset.abbr;
      expandedAbbr = expandedAbbr === abbr ? null : abbr;
      rerenderTables();
      setDumbbellExpanded(chartEl, expandedAbbr);
    }
  });

  tbody?.addEventListener("keydown", (event) => {
    const row = event.target.closest(".movers-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (event.target.closest("a")) {
        return;
      }
      event.preventDefault();
      const abbr = row.dataset.abbr;
      expandedAbbr = expandedAbbr === abbr ? null : abbr;
      rerenderTables();
      setDumbbellExpanded(chartEl, expandedAbbr);
    }
  });
}

let rerenderTables = () => {};

export async function initMovers() {
  const index = await loadIndex();
  lastIndex = index;
  const requestedYear = getYearFromUrl();
  let currentYear = resolveYear(requestedYear, index);
  const priorYear = getPriorYear(currentYear, index);

  const currentSelect = document.querySelector("[data-movers-current-year]");
  const categorySelect = document.getElementById("movers-category");
  const risersBody = document.getElementById("movers-risers");
  const fallersBody = document.getElementById("movers-fallers");
  const risersEmpty = document.getElementById("movers-risers-empty");
  const fallersEmpty = document.getElementById("movers-fallers-empty");
  const modeLabel = document.getElementById("movers-mode-label");
  const chartEl = document.getElementById("movers-dumbbell-chart");

  if (!priorYear || !risersBody || !fallersBody) {
    return;
  }

  let lastRisers = [];
  let lastFallers = [];

  if (currentSelect) {
    currentSelect.innerHTML = "";
    index.availableYears.forEach((year) => {
      if (year === priorYear) {
        return;
      }
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = `CNBC ${year} vs ${priorYear}`;
      currentSelect.appendChild(option);
    });
    currentSelect.value = String(currentYear);
    currentSelect.addEventListener("change", async () => {
      currentYear = Number(currentSelect.value);
      expandedAbbr = null;
      highlightedAbbr = null;
      syncYearToUrl(currentYear, index);
      await render();
    });
  }

  rerenderTables = () => {
    const categoryLabel = lastCategoryKey ? CATEGORY_LABELS[lastCategoryKey] : "";
    risersBody.innerHTML = renderMoverRows(lastRisers, {
      categoryKey: lastCategoryKey,
      categoryLabel,
      tableId: "risers",
    });
    fallersBody.innerHTML = renderMoverRows(lastFallers, {
      categoryKey: lastCategoryKey,
      categoryLabel,
      tableId: "fallers",
    });
    wireTableRowHover(risersBody, chartEl);
    wireTableRowHover(fallersBody, chartEl);
    setDumbbellExpanded(chartEl, expandedAbbr);
    setTableHighlight(highlightedAbbr);
  };

  async function render() {
    const priorPayload = await loadYearPayload(priorYear);
    const currentPayload = await loadYearPayload(currentYear);
    const categoryKey = categorySelect?.value || "";
    const categoryLabel = categoryKey ? CATEGORY_LABELS[categoryKey] : "";

    lastPriorPayload = priorPayload;
    lastCurrentPayload = currentPayload;
    lastPriorYear = priorYear;
    lastCurrentYear = currentYear;
    lastCategoryKey = categoryKey;

    const movers = computeYoYMovers(priorPayload, currentPayload, {
      categoryKey: categoryKey || null,
    });
    lastRisers = movers.filter((m) => m.delta > 0).slice(0, 15);
    lastFallers = [...movers]
      .filter((m) => m.delta < 0)
      .sort((a, b) => a.delta - b.delta)
      .slice(0, 15);

    if (modeLabel) {
      modeLabel.textContent = categoryKey
        ? `${categoryLabel} rank changes — CNBC ${priorYear} vs ${currentYear}`
        : `Overall rank changes — CNBC ${priorYear} vs ${currentYear}`;
    }

    rerenderTables();

    if (risersEmpty) {
      risersEmpty.hidden = lastRisers.length > 0;
    }
    if (fallersEmpty) {
      fallersEmpty.hidden = lastFallers.length > 0;
    }

    renderDumbbellCharts(chartEl, {
      risers: lastRisers,
      fallers: lastFallers,
      priorYear,
      currentYear,
      limit: 6,
    });

    wireDumbbellChartInteractions(chartEl, {
      onSelect: (abbr) => {
        expandedAbbr = expandedAbbr === abbr ? null : abbr;
        rerenderTables();
        if (expandedAbbr) {
          document.querySelector(`.movers-row[data-abbr="${expandedAbbr}"]`)?.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }
      },
      onHighlight: (abbr) => {
        highlightedAbbr = abbr;
        setTableHighlight(abbr);
        setDumbbellHighlight(chartEl, abbr);
      },
    });

    setDumbbellExpanded(chartEl, expandedAbbr);

    updateMethodologyNote(index, priorYear, currentYear);
  }

  categorySelect?.addEventListener("change", () => {
    expandedAbbr = null;
    highlightedAbbr = null;
    render().catch((error) => console.error(error));
  });

  wireTableInteractions(risersBody, "risers", chartEl);
  wireTableInteractions(fallersBody, "fallers", chartEl);
  await render();
}
