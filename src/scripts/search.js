import { pinState, navigateToStateDetail } from "./map.js";

const MAX_RESULTS = 8;

function normalizeQuery(value) {
  return value.trim().toLowerCase();
}

function matchesState(info, abbr, query) {
  if (!query) {
    return true;
  }

  return (
    info.name.toLowerCase().includes(query) ||
    abbr.toLowerCase().startsWith(query)
  );
}

function buildResultItem(abbr, info, index) {
  const item = document.createElement("li");
  item.id = `state-search-option-${index}`;
  item.setAttribute("role", "option");
  item.dataset.abbr = abbr;
  item.innerHTML = `<span class="search-result-name">${info.name}</span><span class="search-result-abbr">${abbr}</span>`;
  return item;
}

export function initSearch(stateData) {
  const input = document.getElementById("state-search");
  const list = document.getElementById("state-search-list");
  if (!input || !list || !stateData) {
    return;
  }

  const entries = Object.entries(stateData).sort(([, a], [, b]) =>
    a.name.localeCompare(b.name)
  );

  let activeIndex = -1;
  let visibleResults = [];

  function setExpanded(expanded) {
    input.setAttribute("aria-expanded", expanded ? "true" : "false");
    list.hidden = !expanded;
  }

  function setActiveIndex(index) {
    activeIndex = index;
    const options = list.querySelectorAll('[role="option"]');
    options.forEach((option, optionIndex) => {
      const selected = optionIndex === index;
      option.classList.toggle("is-active", selected);
      option.setAttribute("aria-selected", selected ? "true" : "false");
    });

    if (index >= 0 && options[index]) {
      input.setAttribute("aria-activedescendant", options[index].id);
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function renderResults(query) {
    const normalized = normalizeQuery(query);
    visibleResults = entries.filter(([abbr, info]) =>
      matchesState(info, abbr, normalized)
    );

    list.innerHTML = "";
    const slice = visibleResults.slice(0, MAX_RESULTS);
    slice.forEach(([abbr, info], index) => {
      list.appendChild(buildResultItem(abbr, info, index));
    });

    const hasResults = slice.length > 0;
    setExpanded(hasResults && normalized.length > 0);
    setActiveIndex(hasResults && normalized.length > 0 ? 0 : -1);
  }

  function selectAbbr(abbr, { openDetail = false } = {}) {
    if (!abbr) {
      return;
    }

    if (openDetail) {
      navigateToStateDetail(abbr);
      return;
    }

    pinState(abbr, { scrollHomeMap: Boolean(document.querySelector(".layout--home")) });
    input.value = stateData[abbr].name;
    setExpanded(false);
    setActiveIndex(-1);
    input.blur();
  }

  input.addEventListener("input", () => {
    renderResults(input.value);
  });

  input.addEventListener("focus", () => {
    if (normalizeQuery(input.value)) {
      renderResults(input.value);
    }
  });

  input.addEventListener("keydown", (event) => {
    if (!list.hidden && visibleResults.length > 0) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = activeIndex < visibleResults.length - 1 ? activeIndex + 1 : 0;
        setActiveIndex(Math.min(next, Math.min(visibleResults.length, MAX_RESULTS) - 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        const max = Math.min(visibleResults.length, MAX_RESULTS) - 1;
        const next = activeIndex > 0 ? activeIndex - 1 : max;
        setActiveIndex(next);
        return;
      }
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const openDetail = event.ctrlKey || event.metaKey;

      if (!list.hidden && activeIndex >= 0) {
        selectAbbr(visibleResults[activeIndex][0], { openDetail });
        return;
      }

      const normalized = normalizeQuery(input.value);
      const exact = entries.find(
        ([abbr, info]) =>
          abbr.toLowerCase() === normalized ||
          info.name.toLowerCase() === normalized
      );
      if (exact) {
        selectAbbr(exact[0], { openDetail });
        return;
      }

      if (visibleResults.length === 1) {
        selectAbbr(visibleResults[0][0], { openDetail });
      }
      return;
    }

    if (event.key === "Escape") {
      setExpanded(false);
      setActiveIndex(-1);
      input.blur();
    }
  });

  list.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  list.addEventListener("click", (event) => {
    const option = event.target.closest('[role="option"]');
    if (!option) {
      return;
    }
    selectAbbr(option.dataset.abbr, { openDetail: event.ctrlKey || event.metaKey });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search-wrap")) {
      setExpanded(false);
      setActiveIndex(-1);
    }
  });

  document.addEventListener("statecompass:pin", (event) => {
    const abbr = event.detail?.abbr;
    if (abbr && stateData[abbr]) {
      input.value = stateData[abbr].name;
    }
  });

  document.addEventListener("statecompass:clear", () => {
    input.value = "";
    setExpanded(false);
    setActiveIndex(-1);
  });
}
