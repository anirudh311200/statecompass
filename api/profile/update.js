import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  unauthorized,
  jsonResponse,
  readJsonBody,
} from "../_lib/http.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { getProfileByToken, updateProfileByToken, sanitizeProfileForClient } from "../_lib/profile.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) {
    return options;
  }

  if (request.method !== "POST") {
    return methodNotAllowed();
  }

  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile update is not configured yet.");
  }

  const body = await readJsonBody(request);
  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const token = String(body.sessionToken ?? "").trim();
  if (!token) {
    return badRequest("Missing session token.");
  }

  const existing = await getProfileByToken(token);
  if (!existing) {
    return unauthorized("Profile not found.");
  }

  try {
    const profile = await updateProfileByToken(token, {
      quizAnswers: body.quizAnswers,
      defaultLens: body.defaultLens,
      top3Snapshot: body.top3Snapshot,
      savedStates: body.savedStates,
      savedComparison: body.savedComparison,
    });

    return jsonResponse({
      ok: true,
      profile: sanitizeProfileForClient(profile),
      sessionToken: profile.sessionToken,
    });
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message === "INVALID_QUIZ" || message === "INVALID_TOP3") {
      return badRequest("Quiz results payload is invalid.");
    }
    if (message === "INVALID_SAVED_STATES") {
      return badRequest("Saved states payload is invalid.");
    }
    console.error("Profile update failed:", error);
    return serviceUnavailable("Could not update profile.");
  }
}
