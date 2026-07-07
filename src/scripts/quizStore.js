const STORAGE_KEY = "statecompass:match-quiz";

export function saveQuizProgress(answers, stepIndex = 0) {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ answers, stepIndex, updatedAt: Date.now() })
    );
  } catch {
    /* quota or private mode */
  }
}

export function loadQuizProgress() {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveQuizResults(answers) {
  saveQuizProgress(answers, -1);
}

export function clearQuizStorage() {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCompletedQuiz() {
  const progress = loadQuizProgress();
  return Boolean(progress?.answers && progress.stepIndex === -1);
}

export function getStoredAnswers() {
  const progress = loadQuizProgress();
  if (!progress?.answers) {
    return null;
  }
  return progress.answers;
}
