import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  jsonResponse,
  readJsonBody,
} from "../_lib/http.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { saveProfile, sanitizeProfileForClient } from "../_lib/profile.js";
import { sendMagicLinkEmail } from "../_lib/email.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile save is not configured yet.");
  }

  const body = await readJsonBody(request);
  if (!body) {
    return badRequest("Invalid JSON body.");
  }

  try {
    const profile = await saveProfile({
      email: body.email,
      quizAnswers: body.quizAnswers,
      defaultLens: body.defaultLens,
      top3Snapshot: body.top3Snapshot,
      savedStates: body.savedStates,
      savedComparison: body.savedComparison,
    });

    const top = profile.top3Snapshot?.[0];
    let emailResult = { sent: false };

    try {
      emailResult = await sendMagicLinkEmail({
        email: profile.email,
        sessionToken: profile.sessionToken,
        topStateName: top?.name,
        matchScore100: top?.matchScore100,
      });
    } catch (error) {
      console.error("Magic link email failed:", error);
    }

    const payload = {
      ok: true,
      profile: sanitizeProfileForClient(profile),
      sessionToken: profile.sessionToken,
      emailSent: emailResult.sent,
    };

    if (!emailResult.sent && process.env.PROFILE_DEV_EXPOSE_LINK === "true") {
      payload.devMagicLink = emailResult.magicLink;
    }

    return jsonResponse(payload);
  } catch (error) {
    const message = String(error?.message ?? error);
    if (message === "INVALID_EMAIL") {
      return badRequest("Enter a valid email address.");
    }
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
