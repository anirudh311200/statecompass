const CHART_COLORS = {
  up: "#22c55e",
  down: "#ef4444",
};

function rankY(rank, height, padding) {
  const plotHeight = height - padding * 2;
  return padding + ((rank - 1) / 49) * plotHeight;
}

export function renderSlopeChart(container, { risers, fallers, priorYear, currentYear, limit = 8 }) {
  if (!container) {
    return;
  }

  const topRisers = risers.filter((m) => m.delta > 0).slice(0, limit);
  const topFallers = fallers.filter((m) => m.delta < 0).slice(0, limit);
  const movers = [...topRisers, ...topFallers];

  if (!movers.length) {
    container.innerHTML = `<p class="movers-chart-empty">No rank movement to chart for this view.</p>`;
    return;
  }

  const width = 640;
  const height = 320;
  const padding = { top: 28, right: 24, bottom: 36, left: 48 };
  const xPrior = padding.left + 40;
  const xCurrent = width - padding.right - 40;

  const lines = movers
    .map((mover) => {
      const color = mover.delta > 0 ? CHART_COLORS.up : CHART_COLORS.down;
      const y1 = rankY(mover.priorRank, height, padding.top);
      const y2 = rankY(mover.currentRank, height, padding.top);
      return `<line class="movers-slope-line" x1="${xPrior}" y1="${y1}" x2="${xCurrent}" y2="${y2}" stroke="${color}" stroke-width="2" stroke-linecap="round" opacity="0.85" />`;
    })
    .join("");

  const labels = movers
    .map((mover) => {
      const color = mover.delta > 0 ? CHART_COLORS.up : CHART_COLORS.down;
      const y = rankY(mover.currentRank, height, padding.top);
      return `<text class="movers-slope-label" x="${xCurrent + 8}" y="${y + 4}" fill="${color}" font-size="11">${mover.abbr}</text>`;
    })
    .join("");

  const gridLines = [1, 10, 25, 40, 50]
    .map((rank) => {
      const y = rankY(rank, height, padding.top);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end" fill="#737373" font-size="10">#${rank}</text>
      `;
    })
    .join("");

  container.innerHTML = `
    <figure class="movers-slope-figure">
      <figcaption class="visually-hidden">
        Slope chart of CNBC rank changes from ${priorYear} to ${currentYear} for top movers.
      </figcaption>
      <svg class="movers-slope-svg" viewBox="0 0 ${width} ${height}" role="img" aria-hidden="true">
        ${gridLines}
        <line x1="${xPrior}" y1="${padding.top}" x2="${xPrior}" y2="${height - padding.bottom}" stroke="#404040" stroke-width="1.5" />
        <line x1="${xCurrent}" y1="${padding.top}" x2="${xCurrent}" y2="${height - padding.bottom}" stroke="#404040" stroke-width="1.5" />
        ${lines}
        ${labels}
        <text x="${xPrior}" y="${height - 12}" text-anchor="middle" fill="#a3a3a3" font-size="12" font-weight="600">${priorYear}</text>
        <text x="${xCurrent}" y="${height - 12}" text-anchor="middle" fill="#a3a3a3" font-size="12" font-weight="600">${currentYear}</text>
        <text x="${(xPrior + xCurrent) / 2}" y="16" text-anchor="middle" fill="#737373" font-size="11">Lower on chart = better rank</text>
      </svg>
      <div class="movers-slope-legend" aria-hidden="true">
        <span class="movers-slope-legend-item is-up"><span class="movers-slope-swatch"></span> Risers</span>
        <span class="movers-slope-legend-item is-down"><span class="movers-slope-swatch"></span> Fallers</span>
      </div>
    </figure>
  `;
}
