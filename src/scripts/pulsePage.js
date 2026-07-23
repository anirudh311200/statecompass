import {
  filterPulseItems,
  formatPulseDate,
  PULSE_ACTIVITY_LABELS,
  buildPulseStateOverview,
} from "../lib/pulse.js";
import { trackEvent } from "./analytics.js";

function renderPulseCard(item, stateNames) {
  const stateName = stateNames[item.stateAbbr] ?? item.stateAbbr;
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

function compareOverviewRows(a, b, sortKey, direction) {
  let cmp = 0;
  if (sortKey === "name") {
    cmp = a.name.localeCompare(b.name);
  } else if (sortKey === "count") {
    cmp = a.count - b.count;
  } else if (sortKey === "activity") {
    const tierOrder = { red: 3, yellow: 2, green: 1 };
    cmp = tierOrder[a.tier] - tierOrder[b.tier];
    if (cmp === 0) {
      cmp = a.count - b.count;
    }
  }
  return direction === "asc" ? cmp : -cmp;
}

export function initPulsePage({
  stateNames,
  stateEntries,
  initialState = "",
  initialIndustry = "",
  items: initialItems = [],
}) {
  const stateSelect = document.querySelector("[data-pulse-state]");
  const industrySelect = document.querySelector("[data-pulse-industry]");
  const listEl = document.querySelector("[data-pulse-list]");
  const emptyEl = document.querySelector("[data-pulse-empty]");
  const overviewBody = document.querySelector("[data-pulse-overview-body]");
  const sortButtons = document.querySelectorAll("[data-pulse-sort]");

  if (!stateSelect || !industrySelect || !listEl) {
    return;
  }

  let items = Array.isArray(initialItems) ? initialItems : [];
  let sortKey = "name";
  let sortDirection = "asc";

  if (initialState) {
    stateSelect.value = initialState;
  }
  if (initialIndustry) {
    industrySelect.value = initialIndustry;
  }

  function renderOverview() {
    if (!overviewBody) {
      return;
    }

    const industry = industrySelect.value;
    const activeState = stateSelect.value;
    const rows = buildPulseStateOverview(stateEntries, items, { industry });
    rows.sort((a, b) => compareOverviewRows(a, b, sortKey, sortDirection));

    overviewBody.replaceChildren(
      ...rows.map((row) => {
        const tr = document.createElement("tr");
        tr.className = "pulse-overview-row";
        tr.dataset.abbr = row.abbr;
        tr.dataset.name = row.name;
        tr.dataset.count = String(row.count);
        tr.dataset.tier = row.tier;
        tr.tabIndex = 0;
        tr.setAttribute("role", "button");
        tr.setAttribute(
          "aria-label",
          `${row.name}, ${row.count} pulse item${row.count === 1 ? "" : "s"}, ${PULSE_ACTIVITY_LABELS[row.tier]} activity`
        );

        if (row.abbr === activeState) {
          tr.classList.add("is-selected");
        }

        tr.innerHTML = `
          <td class="pulse-overview-name">${row.name}</td>
          <td class="pulse-overview-count">${row.count}</td>
          <td class="pulse-overview-activity">
            <span class="pulse-heart pulse-heart--${row.tier}" aria-hidden="true"></span>
            <span class="pulse-activity-label">${PULSE_ACTIVITY_LABELS[row.tier]}</span>
          </td>
        `;

        const selectState = () => {
          stateSelect.value = row.abbr;
          renderFeed();
          document.getElementById("pulse-feed")?.scrollIntoView({ behavior: "smooth", block: "start" });
        };

        tr.addEventListener("click", selectState);
        tr.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            selectState();
          }
        });

        return tr;
      })
    );
  }

  function updateSortButtons() {
    sortButtons.forEach((button) => {
      const key = button.dataset.pulseSort;
      const active = key === sortKey;
      button.classList.toggle("is-sorted", active);
      const indicator = button.querySelector(".rankings-sort-indicator");
      if (indicator) {
        indicator.textContent = active ? (sortDirection === "asc" ? "▲" : "▼") : "";
      }
      button.closest("th")?.setAttribute("aria-sort", active ? (sortDirection === "asc" ? "ascending" : "descending") : "none");
    });
  }

  function renderFeed() {
    const stateAbbr = stateSelect.value;
    const industry = industrySelect.value;

    listEl.classList.add("is-updating");

    requestAnimationFrame(() => {
      const filtered = filterPulseItems({ stateAbbr, industry }, items);

      listEl.replaceChildren(...filtered.map((item) => renderPulseCard(item, stateNames)));
      listEl.classList.remove("is-updating");

      if (emptyEl) {
        emptyEl.hidden = filtered.length > 0;
      }

      renderOverview();
      syncUrl(stateAbbr, industry);
      trackEvent("PulseFilter", {
        state: stateAbbr || undefined,
        industry: industry || undefined,
        count: filtered.length,
      });
    });
  }

  sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.pulseSort;
      if (!key) {
        return;
      }
      if (sortKey === key) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortKey = key;
        sortDirection = key === "name" ? "asc" : "desc";
      }
      updateSortButtons();
      renderOverview();
    });
  });

  document.querySelector("[data-pulse-clear-filters]")?.addEventListener("click", (event) => {
    event.preventDefault();
    stateSelect.value = "";
    industrySelect.value = "";
    renderFeed();
  });

  stateSelect.addEventListener("change", renderFeed);
  industrySelect.addEventListener("change", renderFeed);

  updateSortButtons();
  renderFeed();
}
