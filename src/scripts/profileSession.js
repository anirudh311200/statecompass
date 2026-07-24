const PROFILE_CACHE_KEY = "statecompass:profile-cache";
const SAVE_TIMEOUT_MS = 30000;

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

export function clearProfileCache() {
  if (typeof localStorage === "undefined") {
    return;
  }
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
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

async function fetchWithTimeout(url, options = {}, timeoutMs = SAVE_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("Request timed out. Try again.");
      timeoutError.status = 408;
      throw timeoutError;
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function authorizedFetch(url, options = {}) {
  const { getClerkAuthHeaders } = await import("./clerkClient.js");
  const headers = await getClerkAuthHeaders({
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  });

  return fetchWithTimeout(url, {
    ...options,
    headers,
  });
}

export async function fetchProfileMe() {
  const { getClerkSessionToken } = await import("./clerkClient.js");
  const token = await getClerkSessionToken();
  if (!token) {
    return null;
  }

  const response = await authorizedFetch("/api/profile/me");
  const payload = await parseResponse(response);

  if (payload?.profile) {
    cacheProfile(payload.profile);
  }

  return payload;
}

export async function saveProfileRemote(payload) {
  const response = await authorizedFetch("/api/profile/save", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const result = await parseResponse(response);
  if (result?.profile) {
    cacheProfile(result.profile);
  }
  return result;
}

export async function updateProfileRemote(payload) {
  const response = await authorizedFetch("/api/profile/update", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const result = await parseResponse(response);
  if (result?.profile) {
    cacheProfile(result.profile);
  }
  return result;
}

export async function deleteProfileRemote() {
  const response = await authorizedFetch("/api/profile/delete", {
    method: "POST",
    body: JSON.stringify({}),
  });

  await parseResponse(response);
  clearProfileCache();
  return { ok: true };
}

export async function unsubscribeProfileRemote() {
  return deleteProfileRemote();
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

export async function bootstrapSavedProfile() {
  const payload = await fetchProfileMe();
  if (!payload?.profile) {
    return null;
  }

  applyProfileQuizToStorage(payload.profile);
  mergeProfileIntoLocalStorage(payload.profile);
  return payload.profile;
}
