import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  jsonResponse,
  readJsonBody,
} from "../_lib/http.js";
import { getClerkPrimaryEmail, requireClerkAuth } from "../_lib/clerkAuth.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { saveProfileForClerkUser, sanitizeProfileForClient } from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile save is not configured yet.");
  }

  const authResult = await requireClerkAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  const body = await readJsonBody(request);
  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  const email = await getClerkPrimaryEmail(authResult.auth.userId);
  if (!email) {
    return badRequest("Add a verified email to your account before saving.");
  }

  try {
    const profile = await saveProfileForClerkUser({
      clerkUserId: authResult.auth.userId,
      email,
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
      return badRequest("Complete the quiz before saving your profile.");
    }
    if (message === "INVALID_SAVED_STATES") {
      return badRequest("Saved states payload is invalid.");
    }
    console.error("Profile save failed:", error);
    return serviceUnavailable("Could not save profile. Try again shortly.");
  }
}
