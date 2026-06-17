import { formatRankDelta } from "./yearData.js";

const RANK_MIN = 1;
const RANK_MAX = 50;
const SVG_WIDTH = 220;
const SVG_HEIGHT = 32;
const SVG_CY = 14;
const DOT_PRIOR_R = 4;
const DOT_CURRENT_R = 5;
const PLOT_PAD = 10;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function rankToX(rank) {
  const plotWidth = SVG_WIDTH - PLOT_PAD * 2;
  return PLOT_PAD + ((rank - RANK_MIN) / (RANK_MAX - RANK_MIN)) * plotWidth;
}

function bezierPath(x1, x2) {
  const y = SVG_CY;
  const dx = x2 - x1;
  const bend = Math.min(Math.abs(dx) * 0.4, 14);
  const direction = x2 >= x1 ? 1 : -1;
  return `M ${x1} ${y} C ${x1 + dx * 0.33} ${y - bend * direction}, ${x1 + dx * 0.67} ${y + bend * direction}, ${x2} ${y}`;
}

function renderDumbbellRow(mover, direction, index) {
  const xPrior = rankToX(mover.priorRank);
  const xCurrent = rankToX(mover.currentRank);
  const path = bezierPath(xPrior, xCurrent);
  const gradId = `movers-grad-${direction}-${mover.abbr}`;
  const delay = `${index * 0.07}s`;
  const deltaLabel = formatRankDelta(mover.delta);

  return `
    <button
      type="button"
      class="movers-dumbbell-row is-${direction}"
      data-abbr="${mover.abbr}"
      data-table="${direction === "up" ? "risers" : "fallers"}"
      aria-label="${escapeHtml(mover.name)}: rank ${mover.priorRank} to ${mover.currentRank}, ${deltaLabel}"
      style="--row-delay: ${delay}"
    >
      <span class="movers-dumbbell-name">${escapeHtml(mover.name)}</span>
      <span class="movers-dumbbell-track" aria-hidden="true">
        <svg class="movers-dumbbell-svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="${gradId}" x1="${xPrior}" y1="0" x2="${xCurrent}" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" class="movers-dumbbell-grad-stop is-prior" />
              <stop offset="100%" class="movers-dumbbell-grad-stop is-current" />
            </linearGradient>
          </defs>
          <path
            class="movers-dumbbell-connector"
            d="${path}"
            fill="none"
            stroke="url(#${gradId})"
            stroke-width="2"
            stroke-linecap="round"
            pathLength="100"
          />
          <circle class="movers-dumbbell-dot is-prior" cx="${xPrior}" cy="${SVG_CY}" r="${DOT_PRIOR_R}" />
          <circle class="movers-dumbbell-dot is-current" cx="${xCurrent}" cy="${SVG_CY}" r="${DOT_CURRENT_R}" />
          <text class="movers-dumbbell-rank-label is-prior" x="${xPrior}" y="${SVG_HEIGHT - 2}" text-anchor="middle">#${mover.priorRank}</text>
          <text class="movers-dumbbell-rank-label is-current" x="${xCurrent}" y="${SVG_HEIGHT - 2}" text-anchor="middle">#${mover.currentRank}</text>
        </svg>
      </span>
      <span class="movers-dumbbell-delta is-${direction}">${deltaLabel}</span>
    </button>
  `;
}

function renderPanel(title, direction, movers, { priorYear, currentYear }) {
  if (!movers.length) {
    return `
      <div class="movers-dumbbell-panel is-${direction}">
        <div class="movers-dumbbell-panel-head">
          <h3 class="movers-dumbbell-panel-title">${title}</h3>
        </div>
        <p class="movers-chart-empty">No ${direction === "up" ? "risers" : "fallers"} to chart for this view.</p>
      </div>
    `;
  }

  const rows = movers.map((mover, index) => renderDumbbellRow(mover, direction, index)).join("");

  return `
    <div class="movers-dumbbell-panel is-${direction}">
      <div class="movers-dumbbell-panel-head">
        <h3 class="movers-dumbbell-panel-title">${title}</h3>
        <div class="movers-dumbbell-years" aria-hidden="true">
          <span class="movers-dumbbell-year is-prior">${priorYear}</span>
          <span class="movers-dumbbell-year-arrow">→</span>
          <span class="movers-dumbbell-year is-current">${currentYear}</span>
        </div>
      </div>
      <div class="movers-dumbbell-rows">
        ${rows}
      </div>
    </div>
  `;
}

export function renderDumbbellCharts(
  container,
  { risers, fallers, priorYear, currentYear, limit = 6 }
) {
  if (!container) {
    return;
  }

  const topRisers = risers.filter((m) => m.delta > 0).slice(0, limit);
  const topFallers = fallers.filter((m) => m.delta < 0).slice(0, limit);

  if (!topRisers.length && !topFallers.length) {
    container.innerHTML = `<p class="movers-chart-empty">No rank movement to chart for this view.</p>`;
    return;
  }

  container.innerHTML = `
    <figure class="movers-dumbbell-figure">
      <figcaption class="visually-hidden">
        Dumbbell charts of CNBC rank changes from ${priorYear} to ${currentYear} for top risers and fallers.
        Rank scale #1 to #50; lower rank number is better.
      </figcaption>
      <div class="movers-dumbbell-axis movers-dumbbell-axis--shared" aria-hidden="true">
        <span>#1</span>
        <span>#50</span>
      </div>
      <div class="movers-dumbbell-grid">
        ${renderPanel("Top risers", "up", topRisers, { priorYear, currentYear })}
        ${renderPanel("Top fallers", "down", topFallers, { priorYear, currentYear })}
      </div>
    </figure>
  `;
}

export function setDumbbellHighlight(container, abbr) {
  if (!container) {
    return;
  }

  container.querySelectorAll(".movers-dumbbell-row").forEach((row) => {
    row.classList.toggle("is-highlighted", abbr != null && row.dataset.abbr === abbr);
  });
}

export function setDumbbellExpanded(container, abbr) {
  if (!container) {
    return;
  }

  container.querySelectorAll(".movers-dumbbell-row").forEach((row) => {
    row.classList.toggle("is-expanded", abbr != null && row.dataset.abbr === abbr);
  });
}

export function wireDumbbellChartInteractions(container, { onSelect, onHighlight }) {
  if (!container) {
    return;
  }

  container.querySelectorAll(".movers-dumbbell-row").forEach((row) => {
    row.addEventListener("click", () => {
      onSelect?.(row.dataset.abbr, row.dataset.table);
    });

    row.addEventListener("mouseenter", () => {
      onHighlight?.(row.dataset.abbr);
    });

    row.addEventListener("mouseleave", () => {
      onHighlight?.(null);
    });

    row.addEventListener("focus", () => {
      onHighlight?.(row.dataset.abbr);
    });

    row.addEventListener("blur", () => {
      onHighlight?.(null);
    });
  });
}
