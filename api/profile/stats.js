import {
  handleOptions,
  methodNotAllowed,
  serviceUnavailable,
  unauthorized,
  jsonResponse,
} from "../_lib/http.js";
import { isProfileStorageConfigured } from "../_lib/redis.js";
import { listProfilesForStats } from "../_lib/profile.js";
import { buildSegmentStats } from "../_lib/stats.js";

export default async function handler(request) {
  const options = handleOptions(request);
  if (options) {
    return options;
  }

  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const secret = process.env.PROFILE_STATS_SECRET;
  if (!secret) {
    return serviceUnavailable("Profile stats are not configured.");
  }

  const provided =
    request.headers.get("x-profile-stats-secret") ||
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (provided !== secret) {
    return unauthorized("Invalid stats secret.");
  }

  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile storage is not configured.");
  }

  try {
    const profiles = await listProfilesForStats();
    return jsonResponse({
      ok: true,
      generatedAt: new Date().toISOString(),
      segments: buildSegmentStats(profiles),
    });
  } catch (error) {
    console.error("Profile stats failed:", error);
    return serviceUnavailable("Could not load profile stats.");
  }
}
