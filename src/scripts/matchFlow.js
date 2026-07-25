import {
  getTopMatches,
  QUIZ_QUESTIONS,
  validateQuizAnswers,
  getMatchSharePath,
  encodeQuizToParams,
  getComparePathForStates,
  suggestLensFromQuiz,
} from "./founderMatch.js";
import { getLensLabel, FOUNDER_FIT_OVERALL } from "./founderFit.js";
import { explainMatch } from "./matchExplain.js";
import { saveQuizProgress, saveQuizResults, clearQuizStorage, loadQuizProgress } from "./quizStore.js";
import { wireCopyButton } from "./share.js";
import {
  trackQuizStart,
  trackQuizComplete,
  trackMatchShare,
  trackMatchResultClick,
  trackMatchRetake,
  trackProfileSync,
} from "./analytics.js";
import { pinState, getStateData } from "./map.js";
import { enterStateFocus } from "./stateFocus.js";
import { initSaveProfileFlow } from "./saveProfileFlow.js";
import { getClerkSessionToken } from "./clerkClient.js";

const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export function initMatchFlow({ container, statesObject, onResultsShown, initialAnswers = null, hasMap = true }) {
  if (!container || !statesObject) {
    return () => {};
  }

  let stepIndex = 0;
  let answers = initialAnswers ? { ...initialAnswers } : {};
  let mode = initialAnswers ? "results" : "hero";

  const heroEl = container.querySelector("[data-match-hero]");
  const quizEl = container.querySelector("[data-match-quiz]");
  const resultsEl = container.querySelector("[data-match-results]");
  const mapSection = document.querySelector("[data-match-map-section]");
  const saveProfileRoot = container.querySelector("[data-save-profile]");

  const saveFlow = initSaveProfileFlow({
    root: saveProfileRoot,
    getAnswers: () => answers,
    statesObject,
    onSaved: () => {
      saveProfileRoot?.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "nearest" });
    },
  });

  function showPanel(panel) {
    heroEl?.toggleAttribute("hidden", panel !== "hero");
    quizEl?.toggleAttribute("hidden", panel !== "quiz");
    resultsEl?.toggleAttribute("hidden", panel !== "results");
    mode = panel;
  }

  function renderQuizStep() {
    if (!quizEl) {
      return;
    }

    const question = QUIZ_QUESTIONS[stepIndex];
    const progress = quizEl.querySelector("[data-quiz-progress]");
    const progressBar = quizEl.querySelector("[data-quiz-progress-bar]");
    const progressLabel = quizEl.querySelector("[data-quiz-progress-label]");
    const title = quizEl.querySelector("[data-quiz-title]");
    const options = quizEl.querySelector("[data-quiz-options]");
    const backBtn = quizEl.querySelector("[data-quiz-back]");

    const step = stepIndex + 1;
    const total = QUIZ_QUESTIONS.length;
    const pct = (step / total) * 100;

    if (progress) {
      progress.setAttribute("aria-valuenow", String(step));
      progress.setAttribute("aria-valuemax", String(total));
      progress.setAttribute("aria-valuetext", `Question ${step} of ${total}`);
    }
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }
    if (progressLabel) {
      progressLabel.textContent = `Question ${step} of ${total}`;
    }
    if (title) {
      title.textContent = question.label;
    }
    if (backBtn) {
      backBtn.hidden = stepIndex === 0;
    }

    options?.replaceChildren();
    question.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "match-quiz-option";
      btn.textContent = opt.label;
      btn.dataset.value = opt.id;
      if (answers[question.id] === opt.id) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", () => selectAnswer(question.id, opt.id));
      options?.appendChild(btn);
    });

    saveQuizProgress(answers, stepIndex);
  }

  function selectAnswer(questionId, value) {
    answers[questionId] = value;
    saveQuizProgress(answers, stepIndex);

    if (stepIndex < QUIZ_QUESTIONS.length - 1) {
      stepIndex += 1;
      renderQuizStep();
      quizEl?.querySelector("[data-quiz-title]")?.focus();
      return;
    }

    finishQuiz();
  }

  function finishQuiz() {
    const validated = validateQuizAnswers(answers);
    if (!validated) {
      return;
    }
    answers = validated;
    saveQuizResults(answers);

    const suggestedLens = suggestLensFromQuiz(validated);
    const url = new URL(window.location.href);
    for (const q of QUIZ_QUESTIONS) {
      url.searchParams.set(q.id, answers[q.id]);
    }
    if (suggestedLens !== FOUNDER_FIT_OVERALL) {
      url.searchParams.set("lens", suggestedLens);
    } else {
      url.searchParams.delete("lens");
    }
    history.replaceState(null, "", url);

    if (suggestedLens !== FOUNDER_FIT_OVERALL) {
      document.dispatchEvent(
        new CustomEvent("statecompass:lens-suggest", {
          detail: { lensId: suggestedLens },
        })
      );
    }

    trackQuizComplete();
    renderResults();
    onResultsShown?.(answers);
  }

  function renderResults() {
    const validated = validateQuizAnswers(answers);
    if (!validated || !resultsEl) {
      return;
    }

    const suggestedLens = suggestLensFromQuiz(validated);
    const top3 = getTopMatches(statesObject, validated, 3);
    const cardsHost = resultsEl.querySelector("[data-result-cards]");
    const liveRegion = resultsEl.querySelector("[data-results-live]");
    const lensNote = resultsEl.querySelector("[data-match-lens-note]");
    cardsHost?.replaceChildren();

    if (lensNote) {
      if (suggestedLens !== FOUNDER_FIT_OVERALL) {
        lensNote.textContent = `Founder Lens: ${getLensLabel(suggestedLens)} — match scores start from this lens and fine-tune with your quiz answers.`;
        lensNote.hidden = false;
      } else {
        lensNote.textContent = "";
        lensNote.hidden = true;
      }
    }

    top3.forEach((result, index) => {
      const bullets = explainMatch(result, validated, statesObject);
      const card = document.createElement("article");
      card.className = `match-result-card match-result-card--${result.tier ?? "yellow"}`;
      card.dataset.abbr = result.abbr;

      const rankBadge = document.createElement("span");
      rankBadge.className = "match-result-rank";
      rankBadge.textContent = `#${index + 1}`;

      const nameEl = document.createElement("h3");
      nameEl.className = "match-result-name";
      nameEl.textContent = result.name;

      const scoreEl = document.createElement("p");
      scoreEl.className = "match-result-score";
      scoreEl.innerHTML = `<span class="match-score-value">${result.matchScore100}%</span> match · #${result.matchRank} under your profile`;

      const list = document.createElement("ul");
      list.className = "match-result-bullets";
      bullets.forEach((text) => {
        const li = document.createElement("li");
        li.textContent = text;
        list.appendChild(li);
      });

      const actions = document.createElement("div");
      actions.className = "match-result-actions";

      const exploreBtn = document.createElement("button");
      exploreBtn.type = "button";
      exploreBtn.className = "btn btn-primary match-explore-btn";
      exploreBtn.textContent = `Explore ${result.abbr}`;
      exploreBtn.addEventListener("click", () => {
        trackMatchResultClick(result.abbr);
        if (hasMap) {
          enterStateFocus(result.abbr, validated);
          pinState(result.abbr, { scrollHomeMap: true });
        } else {
          const shareQuery = encodeQuizToParams(validated);
          window.location.href = `/?${shareQuery}&state=${result.abbr}&focus=1`;
        }
      });

      const stateLink = document.createElement("a");
      stateLink.className = "btn btn-secondary";
      stateLink.href = `/states/${result.slug}`;
      stateLink.textContent = "Full state page";

      actions.append(exploreBtn, stateLink);

      card.append(rankBadge, nameEl, scoreEl, list, actions);
      cardsHost?.appendChild(card);
    });

    if (liveRegion) {
      liveRegion.textContent = `Your top match is ${top3[0]?.name} at ${top3[0]?.matchScore100}%.`;
    }

    const comparePath = getComparePathForStates(
      top3.map((r) => r.abbr),
      suggestedLens
    );
    const compareBtn = resultsEl.querySelector("[data-compare-top3]");
    if (compareBtn instanceof HTMLAnchorElement && comparePath) {
      compareBtn.href = comparePath;
      compareBtn.hidden = false;
    } else if (compareBtn) {
      compareBtn.hidden = true;
    }

    showPanel("results");
    mapSection?.removeAttribute("hidden");

    void getClerkSessionToken().then((token) => {
      if (token) {
        saveFlow?.syncExistingProfile?.(validated)?.then?.(() => trackProfileSync());
      }
    });
  }

  function startQuiz() {
    trackQuizStart();
    stepIndex = 0;
    answers = {};
    showPanel("quiz");
    renderQuizStep();
    quizEl?.querySelector("[data-quiz-title]")?.focus();
  }

  function resumeQuiz() {
    const progress = loadQuizProgress();
    if (progress?.answers) {
      answers = { ...progress.answers };
    }
    if (progress?.stepIndex >= 0 && progress.stepIndex < QUIZ_QUESTIONS.length) {
      stepIndex = progress.stepIndex;
      showPanel("quiz");
      renderQuizStep();
      return;
    }
    if (validateQuizAnswers(answers)) {
      renderResults();
      return;
    }
    startQuiz();
  }

  function retakeQuiz() {
    trackMatchRetake();
    clearQuizStorage();
    answers = {};
    stepIndex = 0;
    const url = new URL(window.location.href);
    QUIZ_QUESTIONS.forEach((q) => url.searchParams.delete(q.id));
    url.searchParams.delete("lens");
    history.replaceState(null, "", url);
    startQuiz();
  }

  function editAnswers() {
    stepIndex = 0;
    showPanel("quiz");
    renderQuizStep();
  }

  container.querySelector("[data-start-quiz]")?.addEventListener("click", startQuiz);
  container.querySelector("[data-resume-quiz]")?.addEventListener("click", resumeQuiz);
  container.querySelector("[data-retake-quiz]")?.addEventListener("click", retakeQuiz);
  container.querySelector("[data-edit-quiz]")?.addEventListener("click", editAnswers);

  quizEl?.querySelector("[data-quiz-back]")?.addEventListener("click", () => {
    if (stepIndex > 0) {
      stepIndex -= 1;
      renderQuizStep();
    }
  });

  quizEl?.querySelector("[data-quiz-cancel]")?.addEventListener("click", () => {
    if (validateQuizAnswers(answers)) {
      renderResults();
    } else {
      showPanel("hero");
    }
  });

  const copyBtn = resultsEl?.querySelector("[data-copy-match-link]");
  wireCopyButton(
    copyBtn,
    () => getShareUrl(validatedAnswersForShare()),
    resultsEl?.querySelector("[data-share-status]"),
    { shareType: "match-link" }
  );
  copyBtn?.addEventListener("click", () => trackMatchShare());

  resultsEl?.querySelector("[data-compare-top3]")?.addEventListener("click", (event) => {
    const validated = validateQuizAnswers(answers);
    if (!validated) {
      return;
    }

    const path = getComparePathForStates(
      getTopMatches(statesObject, validated, 3).map((result) => result.abbr),
      suggestLensFromQuiz(validated)
    );
    if (!path) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    window.location.assign(path);
  });

  function validatedAnswersForShare() {
    return validateQuizAnswers(answers);
  }

  function getShareUrl(validated) {
    if (!validated) {
      return window.location.href;
    }
    return `${window.location.origin}${getMatchSharePath(validated)}`;
  }

  if (initialAnswers && validateQuizAnswers(initialAnswers)) {
    answers = initialAnswers;
    renderResults();
  } else {
    const fromUrl = decodeAnswersFromCurrentUrl();
    if (fromUrl) {
      answers = fromUrl;
      saveQuizResults(answers);
      renderResults();
    } else if (hasStoredComplete()) {
      const stored = loadQuizProgress()?.answers;
      if (validateQuizAnswers(stored)) {
        answers = stored;
        renderResults();
      }
    }
  }

  return { retakeQuiz, renderResults, getAnswers: () => answers };
}

function decodeAnswersFromCurrentUrl() {
  const params = new URLSearchParams(window.location.search);
  const answers = {};
  for (const q of QUIZ_QUESTIONS) {
    const v = params.get(q.id);
    if (v) {
      answers[q.id] = v;
    }
  }
  return validateQuizAnswers(Object.keys(answers).length === QUIZ_QUESTIONS.length ? answers : null);
}

function hasStoredComplete() {
  const p = loadQuizProgress();
  return p?.stepIndex === -1 && p?.answers;
}
