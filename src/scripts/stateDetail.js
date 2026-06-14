import { TIER_LABELS } from "./categories.js";
import { renderCategoryChartHtml } from "./categoryChart.js";
import { cnbcStateArticleUrl, METHODOLOGY_URLS } from "../lib/cnbcUrls.js";
import {
  loadIndex,
  getYearFromUrl,
  resolveYear,
  loadYearPayload,
  getPriorYear,
  computeStateYoYDrivers,
  formatRankDelta,
  syncYearToUrl,
  wireYearSelector,
} from "./yearData.js";

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

function clearYoYPanel() {
  const panel = document.getElementById("state-yoy-panel");
  const helper = document.getElementById("state-yoy-helper");
  const columns = document.getElementById("state-yoy-columns");
  const links = document.getElementById("state-yoy-links");
  const note = document.getElementById("state-yoy-note");

  if (helper) {
    helper.textContent = "";
  }
  if (columns) {
    columns.innerHTML = "";
  }
  if (links) {
    links.innerHTML = "";
  }
  if (note) {
    note.textContent = "";
  }
  if (panel) {
    panel.hidden = true;
  }
}

function renderYoYPanel(drivers, { priorYear, currentYear, slug }) {
  const panel = document.getElementById("state-yoy-panel");
  const helper = document.getElementById("state-yoy-helper");
  const columns = document.getElementById("state-yoy-columns");
  const links = document.getElementById("state-yoy-links");
  const note = document.getElementById("state-yoy-note");

  if (!panel || !drivers) {
    clearYoYPanel();
    return null;
  }

  const { overall } = drivers;
  const direction = overall.rankDelta > 0 ? "up" : overall.rankDelta < 0 ? "down" : "flat";
  const deltaLabel = formatRankDelta(overall.rankDelta);

  if (helper) {
    helper.innerHTML = `
      <span class="state-yoy-overall is-${direction}">
        Overall rank #${overall.priorRank} → #${overall.currentRank}
        (${deltaLabel}) · CNBC ${priorYear} vs ${currentYear}
      </span>
      <span class="state-yoy-overall-note">Category shifts below (#1 is best).</span>
    `;
  }

  if (columns) {
    columns.innerHTML = `
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
    `;
  }

  const cnbcHref = cnbcStateArticleUrl(currentYear, slug);
  const moversHref = `/movers?year=${currentYear}`;

  if (links) {
    links.innerHTML = `
      <a href="${moversHref}">All YoY movers</a>
      <a href="${cnbcHref}" target="_blank" rel="noopener noreferrer">CNBC ${currentYear} writeup</a>
      <a href="/?state=${drivers.abbr}&year=${currentYear}">Preview on map</a>
    `;
  }

  if (note) {
    note.textContent =
      direction === "flat"
        ? "Overall rank held steady vs the prior CNBC study. Category shifts reflect movement among peers and methodology changes."
        : "Rank changes use CNBC category ranks vs the prior study — methodology and weights can differ year to year.";
  }

  panel.hidden = false;
  return Object.fromEntries(drivers.categories.map((cat) => [cat.key, cat.rankDelta]));
}

function updateHero(state, year) {
  const eyebrow = document.getElementById("state-hero-eyebrow");
  const tierBadge = document.getElementById("state-tier-badge");
  const scoreValue = document.getElementById("state-score-value");
  const scoreBar = document.getElementById("state-score-bar-fill");
  const rankValue = document.getElementById("state-rank-value");

  if (eyebrow) {
    eyebrow.textContent = `CNBC ${year} · #${state.rank} of 50`;
  }
  if (tierBadge) {
    tierBadge.className = `tier-badge ${state.tier}`;
    tierBadge.textContent = TIER_LABELS[state.tier] ?? state.tier;
  }
  if (scoreValue) {
    scoreValue.textContent = String(state.score100);
  }
  if (scoreBar) {
    scoreBar.className = `score-bar-fill ${state.tier}`;
    scoreBar.style.width = `${state.score100}%`;
  }
  if (rankValue) {
    rankValue.textContent = `#${state.rank} of 50`;
  }
}

function updateCtaLinks(abbr, slug, year, index) {
  const compareLink = document.getElementById("state-compare-link");
  const mapLink = document.getElementById("state-map-link");
  const rankingsCrumb = document.getElementById("state-rankings-crumb");

  const yearParam = year !== index.defaultYear ? `&year=${year}` : "";
  const yearQuery = year !== index.defaultYear ? `?year=${year}` : "";

  if (compareLink) {
    compareLink.href = `/compare?states=${abbr}${yearParam}`;
  }
  if (mapLink) {
    mapLink.href = `/?state=${abbr}${yearParam}`;
  }
  if (rankingsCrumb) {
    rankingsCrumb.href = `/rankings${yearQuery}`;
  }
}

function updateMethodologyLink(year) {
  const link = document.getElementById("state-methodology-link");
  if (link) {
    link.href = METHODOLOGY_URLS[year] ?? METHODOLOGY_URLS[2025];
  }
}

function updateCategoryHelper(year, hasYoY) {
  const helper = document.getElementById("state-category-helper");
  if (helper) {
    helper.textContent = hasYoY
      ? `All 10 CNBC ${year} categories — score out of category max, rank among 50 states. Colored badges show YoY rank change vs prior study.`
      : `All 10 CNBC ${year} categories — score out of category max, rank among 50 states.`;
  }
}

export async function initStateDetail(abbr) {
  if (!abbr) {
    return;
  }

  const index = await loadIndex();
  let currentYear = resolveYear(getYearFromUrl(), index);
  const yearSelect = document.querySelector("[data-year-select]");
  const slug = document.querySelector(".state-detail")?.dataset.stateSlug ?? "";
  const categoryChart = document.getElementById("state-category-chart");

  async function renderYear(year) {
    const payload = await loadYearPayload(year);
    const state = payload.states[abbr];
    if (!state) {
      return;
    }

    currentYear = year;
    syncYearToUrl(year, index);

    updateHero(state, year);
    updateCtaLinks(abbr, slug, year, index);
    updateMethodologyLink(year);

    const priorYear = getPriorYear(year, index);
    let rankDeltas = null;

    if (priorYear) {
      const priorPayload = await loadYearPayload(priorYear);
      const drivers = computeStateYoYDrivers(abbr, priorPayload, payload);
      rankDeltas = renderYoYPanel(drivers, { priorYear, currentYear: year, slug });
      updateCategoryHelper(year, true);
    } else {
      clearYoYPanel();
      updateCategoryHelper(year, false);
    }

    if (categoryChart) {
      categoryChart.innerHTML = renderCategoryChartHtml(state.categories, { rankDeltas });
    }

    document.title = `${state.name} — #${state.rank} | StateCompass CNBC ${year}`;
  }

  wireYearSelector(yearSelect, {
    index,
    initialYear: currentYear,
    onChange: (year) => {
      renderYear(year).catch((error) => console.error(error));
    },
  });

  await renderYear(currentYear);
}
