import { getSaved } from "./memory.js";
import { getTopMatches, suggestLensFromQuiz, validateQuizAnswers } from "./founderMatch.js";
import {
  saveProfileRemote,
  updateProfileRemote,
  fetchProfileMe,
} from "./profileSession.js";
import { getClerkSessionToken, whenClerkReady } from "./clerkClient.js";
import {
  trackProfileCreated,
  trackProfileSaveError,
} from "./analytics.js";

function buildSavePayload({ answers, statesObject }) {
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
  const submitBtn = root.querySelector("[data-save-profile-submit]");
  const signInBtn = root.querySelector("[data-save-profile-sign-in]");
  const statusEl = root.querySelector("[data-save-profile-status]");
  const savedState = root.querySelector("[data-save-profile-saved]");
  const formPanel = root.querySelector("[data-save-profile-form-panel]");
  const signedOutPanel = root.querySelector("[data-save-profile-signed-out]");

  function setStatus(message, tone = "info") {
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.dataset.tone = tone;
  }

  function showSavedState() {
    formPanel?.setAttribute("hidden", "");
    signedOutPanel?.setAttribute("hidden", "");
    savedState?.removeAttribute("hidden");
  }

  async function refreshAuthState() {
    const token = await getClerkSessionToken();
    if (token) {
      signedOutPanel?.setAttribute("hidden", "");
      formPanel?.removeAttribute("hidden");
    } else {
      formPanel?.setAttribute("hidden", "");
      signedOutPanel?.removeAttribute("hidden");
      savedState?.setAttribute("hidden", "");
    }
  }

  async function persistProfile(payload, { updateOnly = false } = {}) {
    submitBtn?.setAttribute("disabled", "");
    setStatus(updateOnly ? "Updating your profile…" : "Saving to your account…");

    try {
      const result = updateOnly
        ? await updateProfileRemote(payload)
        : await saveProfileRemote(payload);

      trackProfileCreated({ emailSent: false });
      showSavedState();
      setStatus("Saved to your account. Open Profile anytime to review your top states.", "success");
      onSaved?.(result.profile);
      return result.profile;
    } catch (error) {
      trackProfileSaveError(error.status ?? "unknown");
      const message =
        error.status === 401
          ? "Sign in to save your results."
          : error.status === 503
            ? "Save is temporarily unavailable. Try again shortly."
            : error.status === 408
              ? "Save timed out. Check your connection and try again."
              : error.message || "Could not save profile. Try again.";
      setStatus(message, "error");
      return null;
    } finally {
      submitBtn?.removeAttribute("disabled");
    }
  }

  async function syncExistingProfile(answers) {
    const token = await getClerkSessionToken();
    if (!token || !statesObject) {
      return;
    }

    const payload = buildSavePayload({ answers, statesObject });
    if (!payload) {
      return;
    }

    try {
      const existing = await fetchProfileMe();
      if (existing?.profile) {
        await updateProfileRemote(payload);
      }
    } catch {
      /* silent background sync */
    }
  }

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const answers = getAnswers?.();
    const payload = buildSavePayload({ answers, statesObject });

    if (!payload) {
      setStatus("Complete the quiz before saving.", "error");
      return;
    }

    const token = await getClerkSessionToken();
    if (!token) {
      setStatus("Sign in to save your results.", "error");
      return;
    }

    await persistProfile(payload);
  });

  signInBtn?.addEventListener("click", () => {
    window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname + window.location.hash)}`;
  });

  refreshAuthState();
  whenClerkReady(() => {
    refreshAuthState();
  });

  return { syncExistingProfile, showSavedState, refreshAuthState };
}

export async function bootstrapSavedProfile() {
  const { getClerkSessionToken } = await import("./clerkClient.js");
  const token = await getClerkSessionToken();
  if (!token) {
    return null;
  }

  const { fetchProfileMe, mergeProfileIntoLocalStorage, applyProfileQuizToStorage } =
    await import("./profileSession.js");

  const payload = await fetchProfileMe();
  if (!payload?.profile) {
    return null;
  }

  applyProfileQuizToStorage(payload.profile);
  mergeProfileIntoLocalStorage(payload.profile);
  return payload.profile;
}
