const TOKEN_KEY = "statecompass:profile-token";
const PROFILE_CACHE_KEY = "statecompass:profile-cache";

export function getSessionToken() {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setSessionToken(token) {
  if (typeof localStorage === "undefined" || !token) {
    return;
  }
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* quota or private mode */
  }
}

export function clearSessionToken() {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function cacheProfile(profile) {
  if (typeof localStorage === "undefined" || !profile) {
    return;
  }
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

export function getCachedProfile() {
  if (typeof localStorage === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function parseResponse(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.error || "Request failed");
    error.status = response.status;
    throw error;
  }

  return payload;
}

export async function fetchProfileSession(token = getSessionToken()) {
  if (!token) {
    return null;
  }

  const response = await fetch(`/api/profile/session?token=${encodeURIComponent(token)}`);
  const payload = await parseResponse(response);

  if (payload?.sessionToken) {
    setSessionToken(payload.sessionToken);
  }
  if (payload?.profile) {
    cacheProfile(payload.profile);
  }

  return payload;
}

export async function saveProfileRemote(payload) {
  const response = await fetch("/api/profile/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await parseResponse(response);
  if (result?.sessionToken) {
    setSessionToken(result.sessionToken);
  }
  if (result?.profile) {
    cacheProfile(result.profile);
  }
  return result;
}

export async function updateProfileRemote(payload) {
  const token = getSessionToken();
  if (!token) {
    throw new Error("No saved session");
  }

  const response = await fetch("/api/profile/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, sessionToken: token }),
  });

  const result = await parseResponse(response);
  if (result?.profile) {
    cacheProfile(result.profile);
  }
  return result;
}

export async function deleteProfileRemote() {
  const token = getSessionToken();
  if (!token) {
    return { ok: true };
  }

  const response = await fetch("/api/profile/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken: token }),
  });

  await parseResponse(response);
  clearSessionToken();
  return { ok: true };
}

export async function unsubscribeProfileRemote() {
  const token = getSessionToken();
  if (!token) {
    throw new Error("No saved session");
  }

  const response = await fetch("/api/profile/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionToken: token }),
  });

  await parseResponse(response);
  clearSessionToken();
  return { ok: true };
}

export function mergeProfileIntoLocalStorage(profile) {
  if (!profile || typeof localStorage === "undefined") {
    return;
  }

  try {
    const memoryKey = "statecompass:saved";
    const raw = localStorage.getItem(memoryKey);
    const store = raw ? JSON.parse(raw) : { states: [], comparison: null };

    const remoteStates = Array.isArray(profile.savedStates) ? profile.savedStates : [];
    const localStates = Array.isArray(store.states) ? store.states : [];
    const mergedStates = [...new Set([...remoteStates, ...localStates])].slice(0, 3);

    const remoteComparison = profile.savedComparison;
    const localComparison = Array.isArray(store.comparison) ? store.comparison : null;
    const mergedComparison =
      remoteComparison?.length >= 2
        ? remoteComparison
        : localComparison?.length >= 2
          ? localComparison
          : null;

    localStorage.setItem(
      memoryKey,
      JSON.stringify({ states: mergedStates, comparison: mergedComparison })
    );
    document.dispatchEvent(
      new CustomEvent("statecompass:saved", {
        detail: { states: mergedStates, comparison: mergedComparison },
      })
    );
  } catch {
    /* ignore merge errors */
  }
}

export function applyProfileQuizToStorage(profile) {
  if (!profile?.quizAnswers || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(
      "statecompass:match-quiz",
      JSON.stringify({
        answers: profile.quizAnswers,
        stepIndex: -1,
        updatedAt: Date.now(),
      })
    );
  } catch {
    /* ignore */
  }
}
