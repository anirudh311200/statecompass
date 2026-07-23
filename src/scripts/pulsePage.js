import {
  buildPulseStateOverview,
  filterPulseItems,
  formatPulseDate,
  formatPulseUpdateCount,
  parsePulseUrlStates,
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

function sortStatesByName(stateEntries, abbrs) {
  return [...abbrs].sort((a, b) => {
    const nameA = stateEntries.find((row) => row.abbr === a)?.name ?? a;
    const nameB = stateEntries.find((row) => row.abbr === b)?.name ?? b;
    return nameA.localeCompare(nameB);
  });
}

export async function initPulsePage() {
  const pageRoot = document.querySelector(".pulse-page");
  const industrySelect = document.querySelector("[data-pulse-industry]");
  const tableBody = document.querySelector("[data-pulse-table-body]");
  const pulseTable = document.querySelector(".pulse-table");
  const emptyEl = document.querySelector("[data-pulse-empty]");
  const sortButtons = document.querySelectorAll("[data-pulse-sort]");
  const chipsEl = document.querySelector("[data-pulse-state-chips]");
  const gridEl = document.querySelector("[data-pulse-state-grid]");
  const dialogEl = document.querySelector("[data-pulse-state-dialog]");
  const openBtn = document.querySelector("[data-pulse-state-open]");
  const clearStatesBtn = document.querySelector("[data-pulse-state-clear-all]");
  const applyBtn = document.querySelector("[data-pulse-state-apply]");
  const clearFiltersLink = document.querySelector("[data-pulse-clear-filters]");

  if (!pageRoot || !industrySelect || !tableBody || !pulseTable) {
    return;
  }

  let stateEntries = [];
  try {
    stateEntries = JSON.parse(pageRoot.dataset.pulseStateOptions ?? "[]");
  } catch {
    stateEntries = [];
  }

  const params = new URLSearchParams(window.location.search);
  const initialStates = parsePulseUrlStates(params);
  const initialIndustry = params.get("industry") ?? "";
  const initialOpen =
    params
      .get("open")
      ?.split(",")
      .map((abbr) => abbr.trim().toUpperCase())
      .filter(Boolean) ?? (initialStates.length === 1 ? [initialStates[0]] : []);

  const response = await fetch("/data/regulatory_pulse.json");
  if (!response.ok) {
    throw new Error(`Failed to load regulatory pulse data (${response.status})`);
  }
  const payload = await response.json();
  const items = Array.isArray(payload.items) ? payload.items : [];

  let selectedStates = [...initialStates];
  let expandedAbbrs = new Set(initialOpen);
  let sortKey = "name";
  let sortDirection = "asc";
  let dialogOpen = false;
  let lastFocusedElement = null;

  const gridStates = [...stateEntries].sort((a, b) => a.abbr.localeCompare(b.abbr));

  if (initialIndustry) {
    industrySelect.value = initialIndustry;
  }

  function getItemsForState(abbr) {
    return filterPulseItems(
      { stateAbbr: abbr, industry: industrySelect.value },
      items
    );
  }

  function buildDetailPanel(abbr) {
    const stateItems = getItemsForState(abbr);
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

    return panel;
  }

  function renderStateChips() {
    if (!chipsEl) {
      return;
    }

    chipsEl.replaceChildren();

    if (!selectedStates.length) {
      chipsEl.hidden = true;
      return;
    }

    chipsEl.hidden = false;
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
        syncGridSelection();
        renderStateChips();
        renderTable();
      });
      chipsEl.appendChild(chip);
    });
  }

  function syncGridSelection() {
    if (!gridEl) {
      return;
    }
    gridEl.querySelectorAll("[data-pulse-state-toggle]").forEach((button) => {
      const abbr = button.dataset.pulseStateToggle;
      const selected = selectedStates.includes(abbr);
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", selected ? "true" : "false");
    });
  }

  function renderStateGrid() {
    if (!gridEl) {
      return;
    }

    gridEl.replaceChildren(
      ...gridStates.map(({ abbr, name }) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pulse-state-grid-btn";
        button.dataset.pulseStateToggle = abbr;
        button.setAttribute("aria-pressed", selectedStates.includes(abbr) ? "true" : "false");
        button.setAttribute("aria-label", name);
        button.title = name;
        button.textContent = abbr;
        if (selectedStates.includes(abbr)) {
          button.classList.add("is-selected");
        }
        button.addEventListener("click", () => toggleStateSelection(abbr));
        return button;
      })
    );
  }

  function toggleStateSelection(abbr) {
    if (selectedStates.includes(abbr)) {
      selectedStates = selectedStates.filter((value) => value !== abbr);
      expandedAbbrs.delete(abbr);
    } else {
      selectedStates = sortStatesByName(stateEntries, [...selectedStates, abbr]);
    }
    syncGridSelection();
    renderStateChips();
    renderTable();
  }

  function openStateDialog() {
    if (!dialogEl || dialogOpen) {
      return;
    }

    lastFocusedElement = document.activeElement;
    dialogOpen = true;
    dialogEl.hidden = false;
    requestAnimationFrame(() => {
      dialogEl.classList.add("is-open");
    });
    openBtn?.setAttribute("aria-expanded", "true");
    document.body.classList.add("pulse-state-dialog-open");
    applyBtn?.focus();
  }

  function closeStateDialog() {
    if (!dialogEl || !dialogOpen) {
      return;
    }

    dialogOpen = false;
    dialogEl.classList.remove("is-open");
    openBtn?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("pulse-state-dialog-open");

    const onTransitionEnd = (event) => {
      if (event.target !== dialogEl.querySelector(".pulse-state-dialog-panel")) {
        return;
      }
      dialogEl.hidden = true;
      dialogEl.querySelector(".pulse-state-dialog-panel")?.removeEventListener(
        "transitionend",
        onTransitionEnd
      );
      if (lastFocusedElement instanceof HTMLElement) {
        lastFocusedElement.focus();
      }
    };

    dialogEl.querySelector(".pulse-state-dialog-panel")?.addEventListener(
      "transitionend",
      onTransitionEnd
    );

    window.setTimeout(() => {
      if (dialogEl.hidden === false && !dialogOpen) {
        dialogEl.hidden = true;
        if (lastFocusedElement instanceof HTMLElement) {
          lastFocusedElement.focus();
        }
      }
    }, 220);
  }

  function renderDetailRow(abbr, isExpanded) {
    const tr = document.createElement("tr");
    tr.className = "pulse-detail-row";
    tr.dataset.detailFor = abbr;
    tr.hidden = !isExpanded;

    const td = document.createElement("td");
    td.colSpan = 4;
    td.appendChild(buildDetailPanel(abbr));
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
      stateRow.tabIndex = 0;

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

      fragment.appendChild(stateRow);
      fragment.appendChild(renderDetailRow(row.abbr, isExpanded));
    });

    tableBody.appendChild(fragment);

    if (emptyEl) {
      emptyEl.hidden = rows.length > 0;
    }

    syncUrl(selectedStates, industry, expandedAbbrs);
    syncGridSelection();
    trackEvent("PulseFilter", {
      states: selectedStates.length ? selectedStates.join(",") : undefined,
      industry: industry || undefined,
      count: rows.length,
    });
  }

  function toggleExpanded(abbr) {
    const wasExpanded = expandedAbbrs.has(abbr);
    if (wasExpanded) {
      expandedAbbrs.delete(abbr);
    } else {
      expandedAbbrs.add(abbr);
    }

    const isExpanded = expandedAbbrs.has(abbr);
    const stateRow = tableBody.querySelector(`tr.pulse-state-row[data-abbr="${abbr}"]`);
    const detailRow = tableBody.querySelector(`tr.pulse-detail-row[data-detail-for="${abbr}"]`);
    const expandBtn = stateRow?.querySelector(".pulse-expand-btn");
    const expandIcon = stateRow?.querySelector(".pulse-expand-icon");
    const stateName = stateEntries.find((row) => row.abbr === abbr)?.name ?? abbr;

    if (expandBtn) {
      expandBtn.setAttribute("aria-expanded", String(isExpanded));
      expandBtn.setAttribute(
        "aria-label",
        `${isExpanded ? "Collapse" : "Expand"} regulatory updates for ${stateName}`
      );
    }
    if (expandIcon) {
      expandIcon.textContent = isExpanded ? "▾" : "▸";
    }
    if (detailRow) {
      detailRow.hidden = !isExpanded;
      if (isExpanded) {
        const td = detailRow.querySelector("td");
        td?.replaceChildren(buildDetailPanel(abbr));
        detailRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    syncUrl(selectedStates, industrySelect.value, expandedAbbrs);
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

  pulseTable.addEventListener("click", (event) => {
    const expandBtn = event.target.closest(".pulse-expand-btn");
    const row = event.target.closest(".pulse-state-row");
    if (!row) {
      return;
    }
    if (event.target.closest("a")) {
      return;
    }
    if (expandBtn || row.contains(event.target)) {
      event.preventDefault();
      const abbr = row.dataset.abbr;
      if (abbr) {
        toggleExpanded(abbr);
      }
    }
  });

  pulseTable.addEventListener("keydown", (event) => {
    const row = event.target.closest(".pulse-state-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const abbr = row.dataset.abbr;
      if (abbr) {
        toggleExpanded(abbr);
      }
    }
  });

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

  openBtn?.addEventListener("click", () => {
    if (dialogOpen) {
      closeStateDialog();
    } else {
      openStateDialog();
    }
  });

  dialogEl?.querySelectorAll("[data-pulse-state-close]").forEach((el) => {
    el.addEventListener("click", closeStateDialog);
  });

  applyBtn?.addEventListener("click", closeStateDialog);

  clearStatesBtn?.addEventListener("click", () => {
    selectedStates = [];
    expandedAbbrs.clear();
    syncGridSelection();
    renderStateChips();
    renderTable();
  });

  clearFiltersLink?.addEventListener("click", (event) => {
    event.preventDefault();
    selectedStates = [];
    expandedAbbrs.clear();
    industrySelect.value = "";
    syncGridSelection();
    renderStateChips();
    renderTable();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dialogOpen) {
      event.preventDefault();
      closeStateDialog();
    }
  });

  renderStateGrid();
  renderStateChips();
  updateSortButtons();
  renderTable();
}
