import {
  buildPulseStateOverview,
  filterPulseItems,
  formatPulseDate,
  formatPulseUpdateCount,
  PULSE_ACTIVITY_LABELS,
} from "../lib/pulse.js";
import { trackEvent } from "./analytics.js";

function renderPulseCard(item, { nested = false } = {}) {
  const article = document.createElement("article");
  article.className = "pulse-card";
  if (nested) {
    article.classList.add("pulse-card--nested");
  }
  article.dataset.pulseId = item.id;

  const tags = item.industries
    .map(
      (tag) =>
        `<a href="/pulse?industry=${encodeURIComponent(tag)}" class="pulse-tag">${tag}</a>`
    )
    .join("");

  article.innerHTML = `
    <header class="pulse-card-header">
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

function compareOverviewRows(a, b, sortKey, direction) {
  let cmp = 0;
  if (sortKey === "name") {
    cmp = a.name.localeCompare(b.name);
  } else if (sortKey === "count") {
    cmp = a.count - b.count;
  } else if (sortKey === "pulse") {
    const tierOrder = { red: 3, yellow: 2, green: 1 };
    cmp = tierOrder[a.tier] - tierOrder[b.tier];
    if (cmp === 0) {
      cmp = a.count - b.count;
    }
  }
  return direction === "asc" ? cmp : -cmp;
}

function syncUrl(selectedStates, industry, expandedAbbrs) {
  const params = new URLSearchParams();
  if (selectedStates.length === 1) {
    params.set("state", selectedStates[0]);
  } else if (selectedStates.length > 1) {
    params.set("states", selectedStates.join(","));
  }
  if (industry) {
    params.set("industry", industry);
  }
  if (expandedAbbrs.size === 1) {
    params.set("open", [...expandedAbbrs][0]);
  } else if (expandedAbbrs.size > 1) {
    params.set("open", [...expandedAbbrs].join(","));
  }
  const query = params.toString();
  window.history.replaceState({}, "", query ? `/pulse?${query}` : "/pulse");
}

export function initPulsePage({
  stateEntries,
  initialStates = [],
  initialIndustry = "",
  initialOpen = [],
  items: initialItems = [],
}) {
  const industrySelect = document.querySelector("[data-pulse-industry]");
  const tableBody = document.querySelector("[data-pulse-table-body]");
  const emptyEl = document.querySelector("[data-pulse-empty]");
  const sortButtons = document.querySelectorAll("[data-pulse-sort]");
  const chipsEl = document.querySelector("[data-pulse-state-chips]");
  const checklistEl = document.querySelector("[data-pulse-state-checklist]");
  const stateSearch = document.querySelector("[data-pulse-state-search]");
  const clearStatesBtn = document.querySelector("[data-pulse-state-clear-all]");
  const clearFiltersLink = document.querySelector("[data-pulse-clear-filters]");

  if (!industrySelect || !tableBody) {
    return;
  }

  let items = Array.isArray(initialItems) ? initialItems : [];
  let selectedStates = [...initialStates];
  let expandedAbbrs = new Set(initialOpen);
  let sortKey = "name";
  let sortDirection = "asc";

  if (initialIndustry) {
    industrySelect.value = initialIndustry;
  }

  function getItemsForState(abbr) {
    return filterPulseItems(
      { stateAbbr: abbr, industry: industrySelect.value },
      items
    );
  }

  function renderStateChips() {
    if (!chipsEl) {
      return;
    }

    chipsEl.replaceChildren();

    if (!selectedStates.length) {
      const all = document.createElement("span");
      all.className = "pulse-state-chip pulse-state-chip--all";
      all.textContent = "All 50 states";
      chipsEl.appendChild(all);
      return;
    }

    selectedStates.forEach((abbr) => {
      const entry = stateEntries.find((row) => row.abbr === abbr);
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "pulse-state-chip";
      chip.dataset.abbr = abbr;
      chip.setAttribute("aria-label", `Remove ${entry?.name ?? abbr} from filter`);
      chip.innerHTML = `<span>${entry?.name ?? abbr}</span><span class="pulse-state-chip-remove" aria-hidden="true">×</span>`;
      chip.addEventListener("click", () => {
        selectedStates = selectedStates.filter((value) => value !== abbr);
        expandedAbbrs.delete(abbr);
        syncChecklist();
        renderStateChips();
        renderTable();
      });
      chipsEl.appendChild(chip);
    });
  }

  function syncChecklist() {
    if (!checklistEl) {
      return;
    }
    checklistEl.querySelectorAll("[data-pulse-state-option]").forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.checked = selectedStates.includes(input.value);
      }
    });
  }

  function renderChecklist(filterText = "") {
    if (!checklistEl) {
      return;
    }

    const needle = filterText.trim().toLowerCase();
    checklistEl.replaceChildren(
      ...stateEntries
        .filter(({ name, abbr }) => {
          if (!needle) {
            return true;
          }
          return name.toLowerCase().includes(needle) || abbr.toLowerCase().includes(needle);
        })
        .map(({ abbr, name }) => {
          const label = document.createElement("label");
          label.className = "pulse-state-option";
          label.innerHTML = `
            <input type="checkbox" value="${abbr}" data-pulse-state-option ${selectedStates.includes(abbr) ? "checked" : ""} />
            <span>${name}</span>
          `;
          const input = label.querySelector("input");
          input?.addEventListener("change", () => {
            if (input.checked) {
              if (!selectedStates.includes(abbr)) {
                selectedStates.push(abbr);
                selectedStates.sort((a, b) => {
                  const nameA = stateEntries.find((row) => row.abbr === a)?.name ?? a;
                  const nameB = stateEntries.find((row) => row.abbr === b)?.name ?? b;
                  return nameA.localeCompare(nameB);
                });
              }
            } else {
              selectedStates = selectedStates.filter((value) => value !== abbr);
              expandedAbbrs.delete(abbr);
            }
            renderStateChips();
            renderTable();
          });
          return label;
        })
    );
  }

  function renderDetailRow(abbr, isExpanded) {
    const stateItems = getItemsForState(abbr);
    const tr = document.createElement("tr");
    tr.className = "pulse-detail-row";
    tr.dataset.detailFor = abbr;
    tr.hidden = !isExpanded;

    const td = document.createElement("td");
    td.colSpan = 4;

    const panel = document.createElement("div");
    panel.className = "pulse-state-details";

    if (stateItems.length) {
      const list = document.createElement("div");
      list.className = "pulse-card-list pulse-card-list--nested";
      stateItems.forEach((item) => list.appendChild(renderPulseCard(item, { nested: true })));
      panel.appendChild(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "pulse-state-details-empty";
      empty.textContent = "No regulatory updates match the current industry filter.";
      panel.appendChild(empty);
    }

    td.appendChild(panel);
    tr.appendChild(td);
    return tr;
  }

  function renderTable() {
    const industry = industrySelect.value;
    const rows = buildPulseStateOverview(stateEntries, items, {
      industry,
      stateAbbrs: selectedStates.length ? selectedStates : null,
    });
    rows.sort((a, b) => compareOverviewRows(a, b, sortKey, sortDirection));

    const visibleAbbrs = new Set(rows.map((row) => row.abbr));
    expandedAbbrs = new Set([...expandedAbbrs].filter((abbr) => visibleAbbrs.has(abbr)));

    tableBody.replaceChildren();
    const fragment = document.createDocumentFragment();

    rows.forEach((row) => {
      const isExpanded = expandedAbbrs.has(row.abbr);
      const stateRow = document.createElement("tr");
      stateRow.className = "pulse-state-row";
      stateRow.dataset.abbr = row.abbr;
      stateRow.dataset.tier = row.tier;
      stateRow.dataset.count = String(row.count);

      stateRow.innerHTML = `
        <td class="pulse-expand-cell">
          <button
            type="button"
            class="pulse-expand-btn"
            aria-expanded="${isExpanded}"
            aria-label="${isExpanded ? "Collapse" : "Expand"} regulatory updates for ${row.name}"
          >
            <span class="pulse-expand-icon" aria-hidden="true">${isExpanded ? "▾" : "▸"}</span>
          </button>
        </td>
        <td class="pulse-state-name">${row.name}</td>
        <td class="pulse-heart-cell">
          <span
            class="pulse-heart pulse-heart--${row.tier}"
            aria-label="${PULSE_ACTIVITY_LABELS[row.tier]} regulatory activity"
          ></span>
        </td>
        <td class="pulse-updates-cell">${formatPulseUpdateCount(row.count)}</td>
      `;

      const expandBtn = stateRow.querySelector(".pulse-expand-btn");
      expandBtn?.addEventListener("click", (event) => {
        event.stopPropagation();
        toggleExpanded(row.abbr);
      });

      stateRow.addEventListener("click", (event) => {
        if (event.target.closest(".pulse-expand-btn")) {
          return;
        }
        toggleExpanded(row.abbr);
      });

      stateRow.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleExpanded(row.abbr);
        }
      });

      fragment.appendChild(stateRow);
      fragment.appendChild(renderDetailRow(row.abbr, isExpanded));
    });

    tableBody.appendChild(fragment);

    if (emptyEl) {
      emptyEl.hidden = rows.length > 0;
    }

    syncUrl(selectedStates, industry, expandedAbbrs);
    syncChecklist();
    trackEvent("PulseFilter", {
      states: selectedStates.length ? selectedStates.join(",") : undefined,
      industry: industry || undefined,
      count: rows.length,
    });
  }

  function toggleExpanded(abbr) {
    if (expandedAbbrs.has(abbr)) {
      expandedAbbrs.delete(abbr);
    } else {
      expandedAbbrs.add(abbr);
    }
    renderTable();
    if (expandedAbbrs.has(abbr)) {
      tableBody.querySelector(`tr[data-detail-for="${abbr}"]`)?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
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
      button
        .closest("th")
        ?.setAttribute(
          "aria-sort",
          active ? (sortDirection === "asc" ? "ascending" : "descending") : "none"
        );
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
      renderTable();
    });
  });

  industrySelect.addEventListener("change", renderTable);

  clearStatesBtn?.addEventListener("click", () => {
    selectedStates = [];
    expandedAbbrs.clear();
    renderStateChips();
    renderTable();
  });

  clearFiltersLink?.addEventListener("click", (event) => {
    event.preventDefault();
    selectedStates = [];
    expandedAbbrs.clear();
    industrySelect.value = "";
    renderStateChips();
    renderTable();
  });

  stateSearch?.addEventListener("input", () => {
    renderChecklist(stateSearch.value);
  });

  renderChecklist();
  renderStateChips();
  updateSortButtons();
  renderTable();
}
