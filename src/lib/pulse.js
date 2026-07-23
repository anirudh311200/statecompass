import payload from "../../public/data/regulatory_pulse.json";

export const pulsePayload = payload;
export const pulseDisclaimer = payload.disclaimer;
export const pulseIndustries = payload.industries ?? [];
export const pulseItems = payload.items ?? [];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPulseDate(value) {
  return typeof value === "string" && ISO_DATE.test(value);
}

export function formatPulseDate(isoDate) {
  if (!isValidPulseDate(isoDate)) {
    return isoDate ?? "";
  }
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function getPulseItemsForState(abbr, { limit = null, industry = null } = {}) {
  let items = pulseItems.filter((item) => item.stateAbbr === abbr);
  if (industry) {
    items = items.filter(
      (item) => item.industries.includes(industry) || item.industries.includes("General")
    );
  }
  items = [...items].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  if (limit != null && limit > 0) {
    return items.slice(0, limit);
  }
  return items;
}

export function getPulseItemById(id) {
  return pulseItems.find((item) => item.id === id) ?? null;
}

export function filterPulseItems(
  { stateAbbr = "", stateAbbrs = null, industry = "" } = {},
  items = pulseItems
) {
  let filtered = [...items];
  const resolvedStates = resolveStateFilter(stateAbbr, stateAbbrs);

  if (resolvedStates.length) {
    const allowed = new Set(resolvedStates);
    filtered = filtered.filter((item) => allowed.has(item.stateAbbr));
  }
  if (industry) {
    filtered = filtered.filter(
      (item) => item.industries.includes(industry) || item.industries.includes("General")
    );
  }
  return filtered.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
}

export function resolveStateFilter(stateAbbr = "", stateAbbrs = null) {
  if (Array.isArray(stateAbbrs) && stateAbbrs.length) {
    return stateAbbrs.map((abbr) => abbr.trim().toUpperCase()).filter(Boolean);
  }
  if (stateAbbr) {
    return [stateAbbr.trim().toUpperCase()];
  }
  return [];
}

export function parsePulseUrlStates(searchParams) {
  const multi = searchParams.get("states");
  if (multi) {
    return multi
      .split(",")
      .map((abbr) => abbr.trim().toUpperCase())
      .filter(Boolean);
  }
  const single = searchParams.get("state")?.trim().toUpperCase();
  return single ? [single] : [];
}

export function formatPulseUpdateCount(count) {
  if (!count || count <= 0) {
    return "No updates yet";
  }
  return `${count} update${count === 1 ? "" : "s"}`;
}

export const PULSE_ACTIVITY_LABELS = {
  green: "Light",
  yellow: "Moderate",
  red: "High",
};

/** Tier bands for curated pulse item counts in the feed (not total regulatory burden). */
export function pulseActivityTier(itemCount) {
  if (itemCount >= 6) {
    return "red";
  }
  if (itemCount >= 3) {
    return "yellow";
  }
  return "green";
}

export function countPulseItemsByState(items = pulseItems, { industry = "" } = {}) {
  const filtered = industry ? filterPulseItems({ industry }, items) : items;
  const counts = {};

  for (const item of filtered) {
    counts[item.stateAbbr] = (counts[item.stateAbbr] ?? 0) + 1;
  }

  return counts;
}

export function buildPulseStateOverview(
  stateEntries,
  items = pulseItems,
  { industry = "", stateAbbrs = null } = {}
) {
  const counts = countPulseItemsByState(items, { industry });
  const allowed =
    Array.isArray(stateAbbrs) && stateAbbrs.length
      ? new Set(stateAbbrs.map((abbr) => abbr.toUpperCase()))
      : null;

  return stateEntries
    .filter(({ abbr }) => !allowed || allowed.has(abbr))
    .map(({ abbr, name }) => {
      const count = counts[abbr] ?? 0;
      return {
        abbr,
        name,
        count,
        tier: pulseActivityTier(count),
      };
    });
}

export function groupPulseItemsByState(items, stateAbbrs = []) {
  const grouped = new Map();
  for (const item of items) {
    if (!grouped.has(item.stateAbbr)) {
      grouped.set(item.stateAbbr, []);
    }
    grouped.get(item.stateAbbr).push(item);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
  }

  if (stateAbbrs.length) {
    const ordered = new Map();
    for (const abbr of stateAbbrs) {
      if (grouped.has(abbr)) {
        ordered.set(abbr, grouped.get(abbr));
      }
    }
    return ordered;
  }

  return grouped;
}

/**
 * Pick pulse bullets relevant to expansion into a target state.
 * Prefers items matching the founder's business model industry tag.
 */
export function getExpansionPulseBullets(targetAbbr, profile, items = pulseItems, max = 2) {
  const model = profile?.model ?? "";
  const modelIndustryMap = {
    saas: "SaaS",
    fintech: "Fintech",
    ecommerce: "E-commerce",
    marketplace: "Marketplace",
    other: "General",
  };
  const preferredIndustry = modelIndustryMap[model] ?? "General";

  const forState = items.filter((item) => item.stateAbbr === targetAbbr);
  if (!forState.length) {
    return [];
  }

  const ranked = [...forState].sort((a, b) => {
    const aMatch =
      a.industries.includes(preferredIndustry) || a.industries.includes("General") ? 1 : 0;
    const bMatch =
      b.industries.includes(preferredIndustry) || b.industries.includes("General") ? 1 : 0;
    if (bMatch !== aMatch) {
      return bMatch - aMatch;
    }
    return b.effectiveDate.localeCompare(a.effectiveDate);
  });

  return ranked.slice(0, max).map(
    (item) =>
      `Regulatory Pulse — ${item.title}: ${item.summary} (effective ${formatPulseDate(item.effectiveDate)}).`
  );
}
