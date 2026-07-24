import { createClerkClient, verifyToken } from "@clerk/backend";
import { getRequestHeader, unauthorized } from "./http.js";

let clerkClient;

function getClerkClient() {
  if (!clerkClient && process.env.CLERK_SECRET_KEY) {
    clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  }
  return clerkClient;
}

export async function requireClerkAuth(request) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return { error: unauthorized("Authentication is not configured yet.") };
  }

  const authHeader = getRequestHeader(request, "authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return { error: unauthorized("Sign in required.") };
  }

  try {
    const payload = await verifyToken(token, { secretKey });
    const userId = payload.sub;
    if (!userId) {
      return { error: unauthorized("Invalid session.") };
    }

    return {
      auth: {
        userId,
        sessionId: payload.sid ?? null,
      },
    };
  } catch (error) {
    console.error("Clerk token verification failed:", error);
    return { error: unauthorized("Invalid or expired session.") };
  }
}

export async function getClerkPrimaryEmail(userId) {
  const clerk = getClerkClient();
  if (!clerk || !userId) {
    return null;
  }

  try {
    const user = await clerk.users.getUser(userId);
    const primaryId = user.primaryEmailAddressId;
    const primary = user.emailAddresses.find((entry) => entry.id === primaryId);
    return primary?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  } catch (error) {
    console.error("Clerk user lookup failed:", error);
    return null;
  }
}
