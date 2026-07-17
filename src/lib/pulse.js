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

export function filterPulseItems({ stateAbbr = "", industry = "" } = {}) {
  let items = [...pulseItems];
  if (stateAbbr) {
    items = items.filter((item) => item.stateAbbr === stateAbbr);
  }
  if (industry) {
    items = items.filter(
      (item) => item.industries.includes(industry) || item.industries.includes("General")
    );
  }
  return items.sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));
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
