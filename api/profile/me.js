import {
  handleOptions,
  methodNotAllowed,
  serviceUnavailable,
  jsonResponse,
} from "../_lib/http.js";
import { requireClerkAuth } from "../_lib/clerkAuth.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { getProfileByClerkUserId, sanitizeProfileForClient } from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function GET(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile storage is not configured yet.");
  }

  const authResult = await requireClerkAuth(request);
  if (authResult.error) {
    return authResult.error;
  }

  const profile = await getProfileByClerkUserId(authResult.auth.userId);
  if (!profile) {
    return jsonResponse({ ok: true, profile: null });
  }

  return jsonResponse({
    ok: true,
    profile: sanitizeProfileForClient(profile),
  });
}
