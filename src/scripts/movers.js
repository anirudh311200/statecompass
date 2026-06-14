import { CATEGORY_ORDER, CATEGORY_LABELS } from "./categories.js";
import {
  loadIndex,
  loadYearPayload,
  getYearFromUrl,
  resolveYear,
  getPriorYear,
  computeYoYMovers,
  formatRankDelta,
  syncYearToUrl,
} from "./yearData.js";

function renderMoverRow(mover, { showCategory = false, categoryLabel = "" }) {
  const deltaClass =
    mover.delta > 0 ? "is-up" : mover.delta < 0 ? "is-down" : "is-flat";
  const deltaLabel =
    mover.delta > 0
      ? `Up ${mover.delta} ranks`
      : mover.delta < 0
        ? `Down ${Math.abs(mover.delta)} ranks`
        : "No change";

  return `
    <tr class="movers-row" data-abbr="${mover.abbr}" tabindex="0" role="link" aria-label="${mover.name}, ${deltaLabel}">
      <td class="movers-name"><a href="/states/${mover.slug}">${mover.name}</a></td>
      <td class="movers-rank">#${mover.priorRank}</td>
      <td class="movers-rank">#${mover.currentRank}</td>
      <td class="movers-delta ${deltaClass}">${formatRankDelta(mover.delta)}</td>
      ${showCategory ? `<td class="movers-category">${categoryLabel}</td>` : ""}
    </tr>
  `;
}

function updateSummary(risers, fallers, priorYear, currentYear, categoryLabel) {
  const summary = document.getElementById("movers-summary");
  if (!summary) {
    return;
  }

  const topRiser = risers.find((m) => m.delta > 0);
  const topFaller = fallers.find((m) => m.delta < 0);
  const scope = categoryLabel ? `${categoryLabel} rank` : "overall rank";

  summary.textContent = [
    topRiser
      ? `${topRiser.name} gained the most (${scope}): #${topRiser.priorRank} → #${topRiser.currentRank}.`
      : null,
    topFaller
      ? `${topFaller.name} dropped the most: #${topFaller.priorRank} → #${topFaller.currentRank}.`
      : null,
    `Comparing CNBC ${priorYear} vs ${currentYear}.`,
  ]
    .filter(Boolean)
    .join(" ");
}

function wireRowNavigation(tbody) {
  tbody?.addEventListener("click", (event) => {
    const row = event.target.closest(".movers-row");
    if (!row) {
      return;
    }
    const link = row.querySelector("a");
    if (link && !event.target.closest("a")) {
      window.location.href = link.href;
    }
  });

  tbody?.addEventListener("keydown", (event) => {
    const row = event.target.closest(".movers-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const link = row.querySelector("a");
      if (link) {
        window.location.href = link.href;
      }
    }
  });
}

export async function initMovers() {
  const index = await loadIndex();
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

  if (!priorYear || !risersBody || !fallersBody) {
    return;
  }

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
      syncYearToUrl(currentYear, index);
      await render();
    });
  }

  async function render() {
    const priorPayload = await loadYearPayload(priorYear);
    const currentPayload = await loadYearPayload(currentYear);
    const categoryKey = categorySelect?.value || "";
    const categoryLabel = categoryKey ? CATEGORY_LABELS[categoryKey] : "";

    const movers = computeYoYMovers(priorPayload, currentPayload, {
      categoryKey: categoryKey || null,
    });
    const risers = movers.filter((m) => m.delta > 0).slice(0, 15);
    const fallers = [...movers].filter((m) => m.delta < 0).sort((a, b) => a.delta - b.delta).slice(0, 15);

    if (modeLabel) {
      modeLabel.textContent = categoryKey
        ? `${categoryLabel} — CNBC ${priorYear} vs ${currentYear}`
        : `Overall rank — CNBC ${priorYear} vs ${currentYear}`;
    }

    risersBody.innerHTML = risers
      .map((mover) =>
        renderMoverRow(mover, { showCategory: Boolean(categoryKey), categoryLabel })
      )
      .join("");
    fallersBody.innerHTML = fallers
      .map((mover) =>
        renderMoverRow(mover, { showCategory: Boolean(categoryKey), categoryLabel })
      )
      .join("");

    if (risersEmpty) {
      risersEmpty.hidden = risers.length > 0;
    }
    if (fallersEmpty) {
      fallersEmpty.hidden = fallers.length > 0;
    }

    updateSummary(risers, fallers, priorYear, currentYear, categoryLabel);
  }

  categorySelect?.addEventListener("change", () => {
    render().catch((error) => console.error(error));
  });

  wireRowNavigation(risersBody);
  wireRowNavigation(fallersBody);
  await render();
}
