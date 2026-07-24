import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  unauthorized,
  jsonResponse,
} from "../_lib/http.js";
import { requireClerkAuth } from "../_lib/clerkAuth.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { deleteProfileByClerkUserId, getProfileByClerkUserId } from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile delete is not configured yet.");
  }

  const authResult = await requireClerkAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  const existing = await getProfileByClerkUserId(authResult.auth.userId, { allowUnsubscribed: true });
  if (!existing) {
    return unauthorized("Profile not found.");
  }

  try {
    await deleteProfileByClerkUserId(authResult.auth.userId, existing);
    return jsonResponse({ ok: true, deleted: true });
  } catch (error) {
    console.error("Profile delete failed:", error);
    return serviceUnavailable("Could not delete profile.");
  }
}
