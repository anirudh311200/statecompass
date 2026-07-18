import { getSaved } from "./memory.js";
import { getTopMatches, suggestLensFromQuiz, validateQuizAnswers } from "./founderMatch.js";
import {
  getSessionToken,
  saveProfileRemote,
  updateProfileRemote,
} from "./profileSession.js";
import {
  trackProfileCreated,
  trackProfileSaveError,
} from "./analytics.js";

function buildSavePayload({ email, answers, statesObject }) {
  const validated = validateQuizAnswers(answers);
  if (!validated) {
    return null;
  }

  const defaultLens = suggestLensFromQuiz(validated);
  const top3 = getTopMatches(statesObject, validated, 3).map((result) => ({
    abbr: result.abbr,
    name: result.name,
    slug: result.slug,
    matchScore100: result.matchScore100,
    matchRank: result.matchRank,
  }));

  const saved = getSaved();

  return {
    email,
    quizAnswers: validated,
    defaultLens,
    top3Snapshot: top3,
    savedStates: saved.states,
    savedComparison: saved.comparison,
  };
}

export function initSaveProfileFlow({
  root,
  getAnswers,
  statesObject,
  onSaved,
}) {
  if (!root) {
    return;
  }

  const form = root.querySelector("[data-save-profile-form]");
  const emailInput = root.querySelector("[data-save-profile-email]");
  const submitBtn = root.querySelector("[data-save-profile-submit]");
  const statusEl = root.querySelector("[data-save-profile-status]");
  const savedState = root.querySelector("[data-save-profile-saved]");
  const formPanel = root.querySelector("[data-save-profile-form-panel]");

  function setStatus(message, tone = "info") {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function showSavedState(email) {
    formPanel?.setAttribute("hidden", "");
    savedState?.removeAttribute("hidden");
    const emailEl = savedState?.querySelector("[data-save-profile-email-display]");
    if (emailEl) {
      emailEl.textContent = email;
    }
  }

  async function syncExistingProfile(answers) {
    const token = getSessionToken();
    if (!token || !statesObject) {
      return;
    }

    const payload = buildSavePayload({ email: "", answers, statesObject });
    if (!payload) {
      return;
    }

    delete payload.email;

    try {
      await updateProfileRemote({
        quizAnswers: payload.quizAnswers,
        defaultLens: payload.defaultLens,
        top3Snapshot: payload.top3Snapshot,
        savedStates: payload.savedStates,
        savedComparison: payload.savedComparison,
      });
    } catch {
      /* silent background sync */
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput?.value?.trim();
    const answers = getAnswers?.();
    const payload = buildSavePayload({ email, answers, statesObject });

    if (!payload) {
      setStatus("Complete the quiz before saving.", "error");
      return;
    }

    submitBtn?.setAttribute("disabled", "");
    setStatus("Saving your profile…");

    try {
      const result = await saveProfileRemote(payload);
      trackProfileCreated({ emailSent: Boolean(result.emailSent) });
      showSavedState(payload.email);

      if (result.emailSent) {
        setStatus("Check your email for a magic link to reopen your results on any device.", "success");
      } else if (result.devMagicLink) {
        setStatus(`Dev mode: open ${result.devMagicLink}`, "success");
      } else {
        setStatus("Profile saved. Email delivery is not configured yet — use this browser to return.", "success");
      }

      onSaved?.(result.profile);
    } catch (error) {
      trackProfileSaveError(error.status ?? "unknown");
      const message =
        error.status === 503
          ? "Save is temporarily unavailable. Your results link still works in this browser."
          : error.message || "Could not save profile. Try again.";
      setStatus(message, "error");
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  });

  return { syncExistingProfile, showSavedState };
}

export async function bootstrapSavedProfile({ tokenFromUrl = null } = {}) {
  const token = tokenFromUrl || getSessionToken();
  if (!token) {
    return null;
  }

  const { fetchProfileSession, mergeProfileIntoLocalStorage, applyProfileQuizToStorage } =
    await import("./profileSession.js");

  const payload = await fetchProfileSession(token);
  if (!payload?.profile) {
    return null;
  }

  applyProfileQuizToStorage(payload.profile);
  mergeProfileIntoLocalStorage(payload.profile);
  return payload.profile;
}
