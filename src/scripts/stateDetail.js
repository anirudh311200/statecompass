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

const RANK_MIN = 1;
const RANK_MAX = 50;
const MINI_SVG_WIDTH = 180;
const MINI_SVG_HEIGHT = 36;
const MINI_CY = 16;
const MINI_PAD = 12;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rankToX(rank) {
  const plotWidth = MINI_SVG_WIDTH - MINI_PAD * 2;
  return MINI_PAD + ((rank - RANK_MIN) / (RANK_MAX - RANK_MIN)) * plotWidth;
}

function bezierPath(x1, x2) {
  const y = MINI_CY;
  const dx = x2 - x1;
  const bend = Math.min(Math.abs(dx) * 0.4, 12);
  const direction = x2 >= x1 ? 1 : -1;
  return `M ${x1} ${y} C ${x1 + dx * 0.33} ${y - bend * direction}, ${x1 + dx * 0.67} ${y + bend * direction}, ${x2} ${y}`;
}

function renderMiniDumbbell(priorRank, currentRank, delta, priorYear, currentYear) {
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const xPrior = rankToX(priorRank);
  const xCurrent = rankToX(currentRank);
  const path = bezierPath(xPrior, xCurrent);
  const gradId = "state-yoy-grad";

  return `
    <div class="state-yoy-dumbbell-wrap is-${direction}" aria-hidden="true">
      <div class="state-yoy-dumbbell-labels">
        <span class="state-yoy-dumbbell-year">${priorYear}</span>
        <span class="state-yoy-dumbbell-year">${currentYear}</span>
      </div>
      <svg class="state-yoy-dumbbell-svg" viewBox="0 0 ${MINI_SVG_WIDTH} ${MINI_SVG_HEIGHT}" role="img" aria-label="Overall rank ${priorRank} to ${currentRank}">
        <defs>
          <linearGradient id="${gradId}" x1="${xPrior}" y1="0" x2="${xCurrent}" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" class="state-yoy-grad-stop is-prior" />
            <stop offset="100%" class="state-yoy-grad-stop is-current" />
          </linearGradient>
        </defs>
        <path class="state-yoy-connector" d="${path}" fill="none" stroke="url(#${gradId})" stroke-width="2.5" stroke-linecap="round" pathLength="100" />
        <circle class="state-yoy-dot is-prior" cx="${xPrior}" cy="${MINI_CY}" r="4.5" />
        <circle class="state-yoy-dot is-current" cx="${xCurrent}" cy="${MINI_CY}" r="5.5" />
        <text class="state-yoy-rank-label" x="${xPrior}" y="${MINI_SVG_HEIGHT - 3}" text-anchor="middle">#${priorRank}</text>
        <text class="state-yoy-rank-label" x="${xCurrent}" y="${MINI_SVG_HEIGHT - 3}" text-anchor="middle">#${currentRank}</text>
      </svg>
      <span class="state-yoy-dumbbell-delta is-${direction}">${formatRankDelta(delta)}</span>
    </div>
  `;
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

function renderYoYPanel(drivers, { priorYear, currentYear, slug }) {
  const panel = document.getElementById("state-yoy-panel");
  const helper = document.getElementById("state-yoy-helper");
  const dumbbell = document.getElementById("state-yoy-dumbbell");
  const columns = document.getElementById("state-yoy-columns");
  const links = document.getElementById("state-yoy-links");
  const note = document.getElementById("state-yoy-note");

  if (!panel || !drivers) {
    if (panel) {
      panel.hidden = true;
    }
    return null;
  }

  const { overall } = drivers;
  const direction = overall.rankDelta > 0 ? "up" : overall.rankDelta < 0 ? "down" : "flat";

  if (helper) {
    helper.textContent = `CNBC ${priorYear} vs ${currentYear} — overall and category rank shifts (#1 is best).`;
  }

  if (dumbbell) {
    dumbbell.innerHTML = renderMiniDumbbell(
      overall.priorRank,
      overall.currentRank,
      overall.rankDelta,
      priorYear,
      currentYear
    );
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
        ? "Overall rank held steady vs the prior CNBC study. Category shifts below reflect movement among peers and methodology changes."
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
      : `All 10 CNBC categories — score out of category max, rank among 50 states.`;
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
      const panel = document.getElementById("state-yoy-panel");
      if (panel) {
        panel.hidden = true;
      }
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
