import {
  handleOptions,
  methodNotAllowed,
  badRequest,
  serviceUnavailable,
  unauthorized,
  jsonResponse,
} from "../_lib/http.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { getProfileByToken, sanitizeProfileForClient } from "../_lib/profile.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) {
    return options;
  }

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile sessions are not configured yet.");
  }

  const url = new URL(request.url);
  const token = url.searchParams.get("token")?.trim();
  if (!token) {
    return badRequest("Missing session token.");
  }

  const profile = await getProfileByToken(token);
  if (!profile) {
    return unauthorized("Profile not found or link expired.");
  }

  return jsonResponse({
    ok: true,
    profile: sanitizeProfileForClient(profile),
    sessionToken: profile.sessionToken,
  });
}
