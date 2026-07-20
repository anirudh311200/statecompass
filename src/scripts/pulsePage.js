import { formatPulseDate } from "../lib/pulse.js";
import { trackEvent } from "./analytics.js";

function renderPulseCard(item, states) {
  const stateName = states[item.stateAbbr]?.name ?? item.stateAbbr;
  const article = document.createElement("article");
  article.className = "pulse-card";
  article.dataset.pulseId = item.id;

  const tags = item.industries
    .map(
      (tag) =>
        `<a href="/pulse?industry=${encodeURIComponent(tag)}" class="pulse-tag">${tag}</a>`
    )
    .join("");

  article.innerHTML = `
    <header class="pulse-card-header">
      <p class="pulse-card-state">
        <a href="/pulse?state=${item.stateAbbr}">${stateName}</a>
      </p>
      <h3 class="pulse-card-title">
        <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">${item.title}</a>
      </h3>
    </header>
    <p class="pulse-card-summary">${item.summary}</p>
    <div class="pulse-card-meta">
      <span class="pulse-card-date">Effective ${formatPulseDate(item.effectiveDate)}</span>
      <div class="pulse-card-tags" aria-label="Industry tags">${tags}</div>
    </div>
    <p class="pulse-card-source">
      Source: <a href="${item.sourceUrl}" target="_blank" rel="noopener noreferrer">${item.sourceLabel}</a>
    </p>
  `;

  return article;
}

function sortItems(items) {
  return [...items].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
}

function filterItems(items, { stateAbbr, industry }) {
  let filtered = items;
  if (stateAbbr) {
    filtered = filtered.filter((item) => item.stateAbbr === stateAbbr);
  }
  if (industry) {
    filtered = filtered.filter(
      (item) => item.industries.includes(industry) || item.industries.includes("General")
    );
  }
  return sortItems(filtered);
}

function syncUrl(stateAbbr, industry) {
  const params = new URLSearchParams();
  if (stateAbbr) {
    params.set("state", stateAbbr);
  }
  if (industry) {
    params.set("industry", industry);
  }
  const query = params.toString();
  const next = query ? `/pulse?${query}` : "/pulse";
  window.history.replaceState({}, "", next);
}

export function initPulsePage({ items, states }) {
  const stateSelect = document.querySelector("[data-pulse-state]");
  const industrySelect = document.querySelector("[data-pulse-industry]");
  const listEl = document.querySelector("[data-pulse-list]");
  const emptyEl = document.querySelector("[data-pulse-empty]");
  const countEl = document.querySelector("[data-pulse-count]");

  if (!stateSelect || !industrySelect || !listEl) {
    return;
  }

  function render() {
    const stateAbbr = stateSelect.value;
    const industry = industrySelect.value;

    listEl.classList.add("is-updating");

    requestAnimationFrame(() => {
      const filtered = filterItems(items, { stateAbbr, industry });

      listEl.replaceChildren(...filtered.map((item) => renderPulseCard(item, states)));
      listEl.classList.remove("is-updating");

      if (emptyEl) {
        emptyEl.hidden = filtered.length > 0;
      }
      if (countEl) {
        countEl.textContent = `${filtered.length} item${filtered.length === 1 ? "" : "s"}`;
      }

      syncUrl(stateAbbr, industry);
      trackEvent("PulseFilter", {
        state: stateAbbr || undefined,
        industry: industry || undefined,
        count: filtered.length,
      });
    });
  }

  document.querySelector("[data-pulse-clear-filters]")?.addEventListener("click", (event) => {
    event.preventDefault();
    stateSelect.value = "";
    industrySelect.value = "";
    render();
  });

  stateSelect.addEventListener("change", render);
  industrySelect.addEventListener("change", render);
}
