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
import { deleteProfileByToken, getProfileByToken } from "../_lib/profile.js";

export async function OPTIONS(request) {
  return handleOptions(request) ?? methodNotAllowed();
}

export async function POST(request) {
  if (!isProfileStorageConfigured()) {
    return serviceUnavailable("Profile delete is not configured yet.");
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
    await deleteProfileByToken(token, existing);
    return jsonResponse({ ok: true, deleted: true });
  } catch (error) {
    console.error("Profile delete failed:", error);
    return serviceUnavailable("Could not delete profile.");
  }
}
