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
import { getProfileByToken, unsubscribeProfileByToken } from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile unsubscribe is not configured yet.");
  }

  const body = await readJsonBody(request);
  const token = String(body?.sessionToken ?? "").trim();
  if (!token) {
    return badRequest("Missing session token.");
  }

  const existing = await getProfileByToken(token, { allowUnsubscribed: true });
  if (!existing) {
    return unauthorized("Profile not found.");
  }

  try {
    await unsubscribeProfileByToken(token);
    return jsonResponse({ ok: true, unsubscribed: true });
  } catch (error) {
    console.error("Profile unsubscribe failed:", error);
    return serviceUnavailable("Could not unsubscribe profile.");
  }
}
