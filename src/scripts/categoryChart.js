import { CATEGORY_ORDER, CATEGORY_LABELS } from "./categories.js";
import { formatRankDelta } from "./yearData.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderCategoryChartHtml(categories, { rankDeltas = null } = {}) {
  const entries = CATEGORY_ORDER.filter((key) => categories[key]).map((key) => {
    const cat = categories[key];
    const pct = Math.round((cat.score / cat.maxScore) * 100);
    const delta = rankDeltas?.[key];
    const deltaHtml =
      delta != null && delta !== 0
        ? `<span class="category-chart-yoy ${delta > 0 ? "is-up" : "is-down"}">${formatRankDelta(delta)}</span>`
        : "";

    return `
      <div class="category-chart-row">
        <div class="category-chart-header">
          <span class="category-chart-label">${escapeHtml(CATEGORY_LABELS[key])}</span>
          <span class="category-chart-meta">
            <span class="category-chart-rank">#${cat.rank}</span>
            ${deltaHtml}
            <span class="category-chart-score">${cat.score}/${cat.maxScore}</span>
          </span>
        </div>
        <div class="category-bar-track" aria-hidden="true">
          <div class="category-bar-fill" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  });

  return `<div class="category-chart">${entries.join("")}</div>`;
}
