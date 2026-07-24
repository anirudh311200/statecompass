const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Profile-Stats-Secret",
};

export function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function methodNotAllowed() {
  return jsonResponse({ error: "Method not allowed" }, 405);
}

export function badRequest(message) {
  return jsonResponse({ error: message }, 400);
}

export function unauthorized(message = "Unauthorized") {
  return jsonResponse({ error: message }, 401);
}

export function serviceUnavailable(message) {
  return jsonResponse({ error: message }, 503);
}

export function handleOptions(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  return null;
}

export function getRequestUrl(request) {
  if (request.url.startsWith("http://") || request.url.startsWith("https://")) {
    return new URL(request.url);
  }

  const host =
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    "statecompass.app";
  const proto = request.headers.get("x-forwarded-proto") || "https";
  return new URL(request.url, `${proto}://${host}`);
}

export async function readJsonBody(request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object") {
      return null;
    }
    return body;
  } catch {
    return null;
  }
}
