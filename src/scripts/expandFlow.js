import {
  ARR_OPTIONS,
  MODEL_OPTIONS,
  validateExpansionProfile,
  computeAllTargets,
  explainExpansionReadiness,
  encodeExpansionToParams,
  getExpansionSharePath,
} from "./expansionReadiness.js";
import { getStoredAnswers } from "./quizStore.js";
import { wireCopyButton } from "./share.js";
import { trackExpansionComplete, trackExpansionShare } from "./analytics.js";

const MAX_TARGETS = 3;

function sortedStateOptions(statesObject) {
  return Object.entries(statesObject)
    .map(([abbr, state]) => ({ abbr, name: state.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderCategoryDeltaSection(result) {
  const section = document.createElement("section");
  section.className = "expand-delta-panel";
  section.innerHTML = `
    <h4 class="expand-delta-title">${result.homeName} → ${result.targetName}</h4>
    <p class="panel-helper">CNBC category comparison — home vs target (StateCompass derived).</p>
  `;

  const list = document.createElement("div");
  list.className = "expand-delta-rows";

  result.categoryDeltas.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "expand-delta-row";

    const deltaPct = Math.round(entry.delta * 100);
    const deltaClass =
      deltaPct > 5 ? "is-positive" : deltaPct < -5 ? "is-negative" : "is-neutral";
    const sign = deltaPct > 0 ? "+" : "";

    row.innerHTML = `
      <span class="expand-delta-label">${entry.label}</span>
      <span class="expand-delta-ranks">#${entry.homeRank} → #${entry.targetRank}</span>
      <span class="expand-delta-change ${deltaClass}">${sign}${deltaPct} pts</span>
    `;
    list.appendChild(row);
  });

  section.appendChild(list);
  return section;
}

function renderResultCard(result, profile, snapshots, pulseItems) {
  const bullets = explainExpansionReadiness(result, profile, snapshots, pulseItems);
  const card = document.createElement("article");
  card.className = "expand-result-card";
  card.dataset.target = result.targetAbbr;

  const frictionClass = `expand-friction--${result.friction.id}`;

  card.innerHTML = `
    <header class="expand-result-header">
      <h3 class="expand-result-target">${result.targetName}</h3>
      <p class="expand-result-score">
        <span class="expand-score-value">${result.readinessScore100}%</span> ready
      </p>
      <span class="expand-friction-badge ${frictionClass}">${result.friction.label}</span>
    </header>
  `;

  const list = document.createElement("ul");
  list.className = "expand-result-bullets";
  bullets.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
  });
  card.appendChild(list);

  const links = document.createElement("div");
  links.className = "expand-result-links";
  links.innerHTML = `
    <a href="/states/${result.targetSlug}" class="btn btn-secondary btn-sm">Founder Snapshot — ${result.targetName}</a>
    <a href="/pulse?state=${result.targetAbbr}" class="btn btn-secondary btn-sm">Regulatory Pulse — ${result.targetAbbr}</a>
    <a href="/compare?states=${result.homeAbbr},${result.targetAbbr}" class="btn btn-secondary btn-sm">Compare ${result.homeAbbr} vs ${result.targetAbbr}</a>
  `;
  card.appendChild(links);

  card.appendChild(renderCategoryDeltaSection(result));

  return card;
}

export function initExpandFlow({
  container,
  statesObject,
  snapshots,
  pulseItems = [],
  initialProfile = null,
}) {
  if (!container || !statesObject) {
    return () => {};
  }

  let profile = initialProfile ? { ...initialProfile } : {
    home: "",
    stage: "",
    model: "",
    targets: [],
  };

  const quizAnswers = getStoredAnswers();
  if (quizAnswers) {
    profile = {
      home: profile.home || "",
      stage: profile.stage || quizAnswers.stage,
      model: profile.model || quizAnswers.model,
      targets: profile.targets?.length ? profile.targets : [],
    };
  }

  let mode = initialProfile ? "results" : "form";

  const formEl = container.querySelector("[data-expand-form]");
  const resultsEl = container.querySelector("[data-expand-results]");
  const homeSelect = container.querySelector("[data-expand-home]");
  const stageSelect = container.querySelector("[data-expand-stage]");
  const modelSelect = container.querySelector("[data-expand-model]");
  const targetSelects = [
    container.querySelector("[data-expand-target-0]"),
    container.querySelector("[data-expand-target-1]"),
    container.querySelector("[data-expand-target-2]"),
  ];
  const prefillNote = container.querySelector("[data-expand-prefill-note]");

  const stateOptions = sortedStateOptions(statesObject);

  function populateSelect(select, { includeEmpty = true, emptyLabel = "Select…", exclude = [] } = {}) {
    if (!select) {
      return;
    }
    select.replaceChildren();
    if (includeEmpty) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = emptyLabel;
      select.appendChild(opt);
    }
    stateOptions.forEach(({ abbr, name }) => {
      if (exclude.includes(abbr)) {
        return;
      }
      const opt = document.createElement("option");
      opt.value = abbr;
      opt.textContent = `${name} (${abbr})`;
      select.appendChild(opt);
    });
  }

  function refreshTargetOptions() {
    const home = homeSelect?.value || profile.home;
    const selectedTargets = targetSelects.map((sel) => sel?.value).filter(Boolean);
    targetSelects.forEach((select, index) => {
      if (!select) {
        return;
      }
      const exclude = [home, ...selectedTargets.filter((_, i) => i !== index)].filter(Boolean);
      const current = select.value;
      populateSelect(select, { includeEmpty: true, emptyLabel: index === 0 ? "Target state 1…" : "Optional", exclude });
      if (current && !exclude.includes(current)) {
        select.value = current;
      }
    });
  }

  function populateFormControls() {
    populateSelect(homeSelect, { emptyLabel: "Your home state…" });
    refreshTargetOptions();

    if (stageSelect) {
      stageSelect.replaceChildren();
      const emptyStage = document.createElement("option");
      emptyStage.value = "";
      emptyStage.textContent = "ARR / stage…";
      stageSelect.appendChild(emptyStage);
      ARR_OPTIONS.forEach((opt) => {
        const el = document.createElement("option");
        el.value = opt.id;
        el.textContent = opt.label;
        stageSelect.appendChild(el);
      });
    }

    if (modelSelect) {
      modelSelect.replaceChildren();
      const emptyModel = document.createElement("option");
      emptyModel.value = "";
      emptyModel.textContent = "Business model…";
      modelSelect.appendChild(emptyModel);
      MODEL_OPTIONS.forEach((opt) => {
        const el = document.createElement("option");
        el.value = opt.id;
        el.textContent = opt.label;
        modelSelect.appendChild(el);
      });
    }

    if (homeSelect && profile.home) {
      homeSelect.value = profile.home;
    }
    if (stageSelect && profile.stage) {
      stageSelect.value = profile.stage;
    }
    if (modelSelect && profile.model) {
      modelSelect.value = profile.model;
    }
    profile.targets.forEach((abbr, index) => {
      if (targetSelects[index]) {
        targetSelects[index].value = abbr;
      }
    });

    if (prefillNote) {
      prefillNote.hidden = !quizAnswers;
      if (quizAnswers) {
        prefillNote.textContent =
          "Pre-filled from your Founder Match quiz (stage and business model). You can change anything below.";
      }
    }
  }

  function readFormProfile() {
    const targets = targetSelects
      .map((sel) => sel?.value?.trim()?.toUpperCase())
      .filter(Boolean)
      .slice(0, MAX_TARGETS);

    return validateExpansionProfile({
      home: homeSelect?.value,
      stage: stageSelect?.value,
      model: modelSelect?.value,
      targets,
    });
  }

  function showPanel(panel) {
    formEl?.toggleAttribute("hidden", panel !== "form");
    resultsEl?.toggleAttribute("hidden", panel !== "results");
    mode = panel;
  }

  function renderResults() {
    const validated = validateExpansionProfile(profile);
    if (!validated || !resultsEl) {
      return;
    }

    profile = validated;
    const results = computeAllTargets(profile, statesObject, snapshots);
    const cardsHost = resultsEl.querySelector("[data-expand-result-cards]");
    const summaryEl = resultsEl.querySelector("[data-expand-summary]");
    const liveRegion = resultsEl.querySelector("[data-expand-live]");

    if (summaryEl) {
      const homeName = statesObject[profile.home]?.name ?? profile.home;
      summaryEl.textContent = `Expanding from ${homeName} (${profile.home}) into ${results.length} target state${results.length === 1 ? "" : "s"}.`;
    }

    cardsHost?.replaceChildren();
    results.forEach((result) => {
      cardsHost?.appendChild(renderResultCard(result, profile, snapshots, pulseItems));
    });

    if (liveRegion) {
      liveRegion.textContent = `Expansion readiness calculated for ${results.length} states. Top: ${results[0]?.targetName} at ${results[0]?.readinessScore100}%.`;
    }

    const compareLink = resultsEl.querySelector("[data-expand-compare-all]");
    if (compareLink && results.length >= 2) {
      const abbrs = [profile.home, ...results.map((r) => r.targetAbbr)].slice(0, 3);
      compareLink.href = `/compare?states=${abbrs.join(",")}`;
      compareLink.hidden = false;
    } else if (compareLink) {
      compareLink.hidden = true;
    }

    trackExpansionComplete({
      home: profile.home,
      targets: profile.targets.join(","),
      model: profile.model,
    });
  }

  function submitForm(event) {
    event?.preventDefault?.();
    const validated = readFormProfile();
    if (!validated) {
      const errorEl = formEl?.querySelector("[data-expand-error]");
      if (errorEl) {
        errorEl.textContent =
          "Pick your home state, ARR stage, business model, and at least one target state (all different).";
      }
      return;
    }

    profile = validated;
    const url = new URL(window.location.href);
    url.search = encodeExpansionToParams(profile);
    history.replaceState(null, "", url);

    renderResults();
    showPanel("results");
    resultsEl?.querySelector(".page-title")?.focus?.();
  }

  function editForm() {
    showPanel("form");
    populateFormControls();
    formEl?.querySelector(".page-title")?.focus?.();
  }

  populateFormControls();

  homeSelect?.addEventListener("change", () => {
    refreshTargetOptions();
    formEl?.querySelector("[data-expand-error]")?.replaceChildren?.();
  });
  targetSelects.forEach((sel) => {
    sel?.addEventListener("change", refreshTargetOptions);
  });

  formEl?.querySelector("[data-expand-submit]")?.addEventListener("click", submitForm);
  formEl?.querySelector("form")?.addEventListener("submit", submitForm);

  resultsEl?.querySelector("[data-expand-edit]")?.addEventListener("click", editForm);

  wireCopyButton(
    resultsEl?.querySelector("[data-copy-expand-link]"),
    () => getExpansionSharePath(profile),
    resultsEl?.querySelector("[data-share-status]"),
    { shareType: "expand" }
  );

  resultsEl?.querySelector("[data-copy-expand-link]")?.addEventListener("click", () => {
    trackExpansionShare();
  });

  resultsEl?.querySelector("[data-expand-print]")?.addEventListener("click", () => {
    window.print();
  });

  if (mode === "results" && validateExpansionProfile(profile)) {
    renderResults();
    showPanel("results");
  } else {
    showPanel("form");
  }

  return () => {};
}
