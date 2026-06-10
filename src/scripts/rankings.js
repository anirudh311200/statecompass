export function initRankings() {
  const tbody = document.getElementById("rankings-body");
  const emptyMsg = document.getElementById("rankings-empty");
  const sortSelect = document.getElementById("rankings-sort");
  const filterButtons = document.querySelectorAll(".tier-filter-btn");

  if (!tbody) {
    return;
  }

  const rows = Array.from(tbody.querySelectorAll(".rankings-row"));
  let activeTier = "all";
  let sortKey = "rank";

  function compareRows(a, b) {
    if (sortKey === "name") {
      return a.dataset.name.localeCompare(b.dataset.name);
    }
    if (sortKey === "score") {
      return Number(b.dataset.score) - Number(a.dataset.score);
    }
    if (sortKey === "tier") {
      const tierOrder = { green: 0, yellow: 1, red: 2 };
      return tierOrder[a.dataset.tier] - tierOrder[b.dataset.tier];
    }
    return Number(a.dataset.rank) - Number(b.dataset.rank);
  }

  function applyView() {
    let visibleCount = 0;

    rows.forEach((row) => {
      const matchesTier = activeTier === "all" || row.dataset.tier === activeTier;
      row.hidden = !matchesTier;
      if (matchesTier) {
        visibleCount += 1;
      }
    });

    const visibleRows = rows.filter((row) => !row.hidden);
    visibleRows.sort(compareRows);
    visibleRows.forEach((row) => tbody.appendChild(row));

    if (emptyMsg) {
      emptyMsg.hidden = visibleCount > 0;
    }
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeTier = button.dataset.tier;
      filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
      applyView();
    });
  });

  sortSelect?.addEventListener("change", () => {
    sortKey = sortSelect.value;
    applyView();
  });

  tbody.addEventListener("click", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row || row.hidden) {
      return;
    }
    window.location.href = `/states/${row.dataset.slug}`;
  });

  tbody.addEventListener("keydown", (event) => {
    const row = event.target.closest(".rankings-row");
    if (!row) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      window.location.href = `/states/${row.dataset.slug}`;
    }
  });

  applyView();
}
