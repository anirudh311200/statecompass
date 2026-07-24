import { randomBytes, createHash } from "node:crypto";
import { getRedis } from "./redis.js";

const PROFILE_INDEX_KEY = "profile:index";
const EMAIL_PREFIX = "profile:email:";
const TOKEN_PREFIX = "profile:token:";
const CLERK_USER_PREFIX = "profile:clerk:";
const PROFILE_PREFIX = "profile:id:";

const QUIZ_KEYS = ["stage", "model", "tax", "vc", "hiring", "talent", "col"];

const VALID_OPTIONS = {
  stage: new Set(["pre-revenue", "under-500k", "500k-2m", "2m-plus"]),
  model: new Set(["saas", "fintech", "ecommerce", "marketplace", "other"]),
  tax: new Set(["critical", "somewhat", "not-priority"]),
  vc: new Set(["yes", "planning", "no"]),
  hiring: new Set(["0-5", "5-20", "20-plus"]),
  talent: new Set(["engineering", "finance", "healthcare", "general"]),
  col: new Set(["yes", "no", "neutral"]),
};

const LENS_IDS = new Set([
  "overall",
  "bootstrapper",
  "vc-backed",
  "fintech",
  "remote-first",
]);

export function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function isValidEmail(email) {
  const normalized = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
}

export function createSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashEmail(email) {
  return createHash("sha256").update(normalizeEmail(email)).digest("hex");
}

export function validateQuizAnswers(answers) {
  if (!answers || typeof answers !== "object") {
    return null;
  }

  const normalized = {};
  for (const key of QUIZ_KEYS) {
    const value = answers[key];
    if (!VALID_OPTIONS[key]?.has(value)) {
      return null;
    }
    normalized[key] = value;
  }
  return normalized;
}

export function validateTop3Snapshot(top3) {
  if (!Array.isArray(top3) || top3.length === 0 || top3.length > 3) {
    return null;
  }

  const normalized = top3.map((item) => {
    const abbr = String(item?.abbr ?? "")
      .trim()
      .toUpperCase();
    const name = String(item?.name ?? "").trim();
    const slug = String(item?.slug ?? "").trim();
    const matchScore100 = Number(item?.matchScore100);
    const matchRank = Number(item?.matchRank);

    if (!abbr || !name || !slug || !Number.isFinite(matchScore100) || !Number.isFinite(matchRank)) {
      return null;
    }

    return { abbr, name, slug, matchScore100, matchRank };
  });

  if (normalized.some((item) => !item)) {
    return null;
  }

  return normalized;
}

export function validateSavedStates(states) {
  if (states == null) {
    return [];
  }
  if (!Array.isArray(states)) {
    return null;
  }

  const normalized = states
    .map((abbr) =>
      String(abbr ?? "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean)
    .filter((abbr, index, list) => list.indexOf(abbr) === index)
    .slice(0, 3);

  return normalized;
}

export function validateSavedComparison(comparison) {
  if (comparison == null) {
    return null;
  }
  if (!Array.isArray(comparison)) {
    return null;
  }

  const normalized = comparison
    .map((abbr) =>
      String(abbr ?? "")
        .trim()
        .toUpperCase()
    )
    .filter(Boolean)
    .filter((abbr, index, list) => list.indexOf(abbr) === index)
    .slice(0, 3);

  return normalized.length >= 2 ? normalized : null;
}

export function validateLensId(lensId) {
  const value = String(lensId ?? "overall").trim();
  return LENS_IDS.has(value) ? value : "overall";
}

function profileKey(profileId) {
  return `${PROFILE_PREFIX}${profileId}`;
}

function emailKey(email) {
  return `${EMAIL_PREFIX}${hashEmail(email)}`;
}

function tokenKey(token) {
  return `${TOKEN_PREFIX}${token}`;
}

function clerkUserKey(userId) {
  return `${CLERK_USER_PREFIX}${userId}`;
}

export async function getProfileByClerkUserId(userId, { allowUnsubscribed = false } = {}) {
  const redis = getRedis();
  if (!redis || !userId) {
    return null;
  }

  const profileId = await redis.get(clerkUserKey(userId));
  if (!profileId) {
    return null;
  }

  const profile = await redis.get(profileKey(profileId));
  if (!profile) {
    return null;
  }

  if (profile.unsubscribed && !allowUnsubscribed) {
    return null;
  }

  return profile;
}

export async function getProfileByToken(token, { allowUnsubscribed = false } = {}) {
  const redis = getRedis();
  if (!redis || !token) {
    return null;
  }

  const profileId = await redis.get(tokenKey(token));
  if (!profileId) {
    return null;
  }

  const profile = await redis.get(profileKey(profileId));
  if (!profile) {
    return null;
  }

  if (profile.unsubscribed && !allowUnsubscribed) {
    return null;
  }

  return profile;
}

export async function getProfileByEmail(email) {
  const redis = getRedis();
  const normalized = normalizeEmail(email);
  if (!redis || !normalized) {
    return null;
  }

  const profileId = await redis.get(emailKey(normalized));
  if (!profileId) {
    return null;
  }

  return redis.get(profileKey(profileId));
}

export async function saveProfileForClerkUser({
  clerkUserId,
  email,
  quizAnswers,
  defaultLens,
  top3Snapshot,
  savedStates = [],
  savedComparison = null,
}) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  if (!clerkUserId) {
    throw new Error("INVALID_CLERK_USER");
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("INVALID_EMAIL");
  }

  const validatedAnswers = validateQuizAnswers(quizAnswers);
  if (!validatedAnswers) {
    throw new Error("INVALID_QUIZ");
  }

  const validatedTop3 = validateTop3Snapshot(top3Snapshot);
  if (!validatedTop3) {
    throw new Error("INVALID_TOP3");
  }

  const validatedStates = validateSavedStates(savedStates);
  if (validatedStates == null) {
    throw new Error("INVALID_SAVED_STATES");
  }

  const validatedComparison = validateSavedComparison(savedComparison);
  const lens = validateLensId(defaultLens);

  const now = new Date().toISOString();
  const existing = await getProfileByClerkUserId(clerkUserId, { allowUnsubscribed: true });
  const profileId = existing?.id ?? randomBytes(16).toString("hex");

  const profile = {
    id: profileId,
    clerkUserId,
    email: normalizedEmail,
    quizAnswers: validatedAnswers,
    defaultLens: lens,
    top3Snapshot: validatedTop3,
    savedStates: validatedStates,
    savedComparison: validatedComparison,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    unsubscribed: false,
    sessionToken: existing?.sessionToken ?? null,
  };

  const pipeline = redis.pipeline();
  pipeline.set(profileKey(profileId), profile);
  pipeline.set(clerkUserKey(clerkUserId), profileId);
  pipeline.set(emailKey(normalizedEmail), profileId);
  pipeline.sadd(PROFILE_INDEX_KEY, profileId);
  await pipeline.exec();

  return profile;
}

export async function updateProfileByClerkUserId(clerkUserId, payload) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const existing = await getProfileByClerkUserId(clerkUserId);
  if (!existing) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const validatedAnswers = validateQuizAnswers(payload.quizAnswers);
  if (!validatedAnswers) {
    throw new Error("INVALID_QUIZ");
  }

  const validatedTop3 = validateTop3Snapshot(payload.top3Snapshot);
  if (!validatedTop3) {
    throw new Error("INVALID_TOP3");
  }

  const validatedStates =
    payload.savedStates == null
      ? existing.savedStates ?? []
      : validateSavedStates(payload.savedStates);
  if (validatedStates == null) {
    throw new Error("INVALID_SAVED_STATES");
  }

  const validatedComparison =
    payload.savedComparison === undefined
      ? existing.savedComparison ?? null
      : validateSavedComparison(payload.savedComparison);

  const profile = {
    ...existing,
    quizAnswers: validatedAnswers,
    defaultLens: validateLensId(payload.defaultLens ?? existing.defaultLens),
    top3Snapshot: validatedTop3,
    savedStates: validatedStates,
    savedComparison: validatedComparison,
    updatedAt: new Date().toISOString(),
    unsubscribed: false,
  };

  await redis.set(profileKey(profile.id), profile);
  return profile;
}

export async function deleteProfileByClerkUserId(clerkUserId, profile = null) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const resolved =
    profile ?? (await getProfileByClerkUserId(clerkUserId, { allowUnsubscribed: true }));
  if (!resolved) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const pipeline = redis.pipeline();
  pipeline.del(profileKey(resolved.id));
  pipeline.del(emailKey(resolved.email));
  pipeline.del(clerkUserKey(clerkUserId));
  if (resolved.sessionToken) {
    pipeline.del(tokenKey(resolved.sessionToken));
  }
  pipeline.srem(PROFILE_INDEX_KEY, resolved.id);
  await pipeline.exec();

  return { deleted: true };
}

export async function saveProfile({
  email,
  quizAnswers,
  defaultLens,
  top3Snapshot,
  savedStates = [],
  savedComparison = null,
}) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    throw new Error("INVALID_EMAIL");
  }

  const validatedAnswers = validateQuizAnswers(quizAnswers);
  if (!validatedAnswers) {
    throw new Error("INVALID_QUIZ");
  }

  const validatedTop3 = validateTop3Snapshot(top3Snapshot);
  if (!validatedTop3) {
    throw new Error("INVALID_TOP3");
  }

  const validatedStates = validateSavedStates(savedStates);
  if (validatedStates == null) {
    throw new Error("INVALID_SAVED_STATES");
  }

  const validatedComparison = validateSavedComparison(savedComparison);
  const lens = validateLensId(defaultLens);

  const now = new Date().toISOString();
  const existing = await getProfileByEmail(normalizedEmail);
  const profileId = existing?.id ?? randomBytes(16).toString("hex");
  const sessionToken = existing?.sessionToken ?? createSessionToken();

  const profile = {
    id: profileId,
    email: normalizedEmail,
    quizAnswers: validatedAnswers,
    defaultLens: lens,
    top3Snapshot: validatedTop3,
    savedStates: validatedStates,
    savedComparison: validatedComparison,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    unsubscribed: false,
    sessionToken,
  };

  const pipeline = redis.pipeline();
  pipeline.set(profileKey(profileId), profile);
  pipeline.set(emailKey(normalizedEmail), profileId);
  pipeline.set(tokenKey(sessionToken), profileId);
  pipeline.sadd(PROFILE_INDEX_KEY, profileId);
  await pipeline.exec();

  return profile;
}

/**
 * Overwrites quiz answers, lens, and top-3 snapshot on re-take.
 * Preserves createdAt; bumps updatedAt.
 */
export async function updateProfileByToken(token, payload) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const existing = await getProfileByToken(token);
  if (!existing) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const validatedAnswers = validateQuizAnswers(payload.quizAnswers);
  if (!validatedAnswers) {
    throw new Error("INVALID_QUIZ");
  }

  const validatedTop3 = validateTop3Snapshot(payload.top3Snapshot);
  if (!validatedTop3) {
    throw new Error("INVALID_TOP3");
  }

  const validatedStates =
    payload.savedStates == null
      ? existing.savedStates ?? []
      : validateSavedStates(payload.savedStates);
  if (validatedStates == null) {
    throw new Error("INVALID_SAVED_STATES");
  }

  const validatedComparison =
    payload.savedComparison === undefined
      ? existing.savedComparison ?? null
      : validateSavedComparison(payload.savedComparison);

  const profile = {
    ...existing,
    quizAnswers: validatedAnswers,
    defaultLens: validateLensId(payload.defaultLens ?? existing.defaultLens),
    top3Snapshot: validatedTop3,
    savedStates: validatedStates,
    savedComparison: validatedComparison,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(profileKey(profile.id), profile);
  return profile;
}

export async function deleteProfileByToken(token, profile = null) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const resolved = profile ?? (await getProfileByToken(token, { allowUnsubscribed: true }));
  if (!resolved) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const pipeline = redis.pipeline();
  pipeline.del(profileKey(resolved.id));
  pipeline.del(emailKey(resolved.email));
  pipeline.del(tokenKey(resolved.sessionToken));
  pipeline.srem(PROFILE_INDEX_KEY, resolved.id);
  await pipeline.exec();

  return { deleted: true };
}

export async function unsubscribeProfileByToken(token) {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const profile = await getProfileByToken(token, { allowUnsubscribed: true });
  if (!profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const updated = {
    ...profile,
    unsubscribed: true,
    updatedAt: new Date().toISOString(),
  };

  await redis.set(profileKey(profile.id), updated);
  return updated;
}

export async function listProfilesForStats() {
  const redis = getRedis();
  if (!redis) {
    throw new Error("PROFILE_STORAGE_UNAVAILABLE");
  }

  const ids = await redis.smembers(PROFILE_INDEX_KEY);
  if (!ids?.length) {
    return [];
  }

  const keys = ids.map((id) => profileKey(id));
  const profiles = await redis.mget(...keys);
  return profiles.filter(Boolean);
}

export function sanitizeProfileForClient(profile) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    clerkUserId: profile.clerkUserId ?? null,
    email: profile.email,
    quizAnswers: profile.quizAnswers,
    defaultLens: profile.defaultLens,
    top3Snapshot: profile.top3Snapshot,
    savedStates: profile.savedStates ?? [],
    savedComparison: profile.savedComparison ?? null,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    unsubscribed: Boolean(profile.unsubscribed),
  };
}
