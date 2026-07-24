import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  unauthorized,
  jsonResponse,
  readJsonBody,
} from "../_lib/http.js";
import { requireClerkAuth } from "../_lib/clerkAuth.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import {
  getProfileByClerkUserId,
  updateProfileByClerkUserId,
  sanitizeProfileForClient,
} from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile update is not configured yet.");
  }

  const authResult = await requireClerkAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const existing = await getProfileByClerkUserId(authResult.auth.userId);
  if (!existing) {
    return unauthorized("Profile not found.");
  }

  try {
    const profile = await updateProfileByClerkUserId(authResult.auth.userId, {
      quizAnswers: body.quizAnswers,
      defaultLens: body.defaultLens,
      top3Snapshot: body.top3Snapshot,
      savedStates: body.savedStates,
      savedComparison: body.savedComparison,
    });

    return jsonResponse({
      ok: true,
      profile: sanitizeProfileForClient(profile),
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
