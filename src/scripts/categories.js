export const CATEGORY_ORDER = [
  "economy",
  "infrastructure",
  "workforce",
  "costOfDoingBusiness",
  "businessFriendliness",
  "qualityOfLife",
  "technologyAndInnovation",
  "education",
  "accessToCapital",
  "costOfLiving",
];

export const CATEGORY_LABELS = {
  economy: "Economy",
  infrastructure: "Infrastructure",
  workforce: "Workforce",
  costOfDoingBusiness: "Cost of Doing Business",
  businessFriendliness: "Business Friendliness",
  qualityOfLife: "Quality of Life",
  technologyAndInnovation: "Technology & Innovation",
  education: "Education",
  accessToCapital: "Access to Capital",
  costOfLiving: "Cost of Living",
};

export const METHODOLOGY_URL =
  "https://www.cnbc.com/2025/06/11/how-we-are-choosing-americas-top-states-for-business-in-2025.html";

export const TIER_LABELS = {
  green: "Very favourable",
  yellow: "Moderate",
  red: "Less favourable",
};

export const TIER_FILTER_LABELS = {
  green: "Green — 1–17",
  yellow: "Yellow — 18–34",
  red: "Red — 35–50",
};

/** SVG gradient ids — injected into #us-map at runtime. */
export const TIER_MAP_FILLS = {
  green: "url(#tier-green)",
  yellow: "url(#tier-yellow)",
  red: "url(#tier-red)",
};

/** Shared luminous palette — map tiers; CSS mirrors these in styles.css :root */
export const TIER_GRADIENTS = {
  green: { id: "tier-green", hi: "#86efac", lo: "#22c55e", hiOp: 0.72, loOp: 0.22 },
  yellow: { id: "tier-yellow", hi: "#fde68a", lo: "#eab308", hiOp: 0.68, loOp: 0.2 },
  red: { id: "tier-red", hi: "#fca5a5", lo: "#ef4444", hiOp: 0.62, loOp: 0.18 },
};

export const TIER_GLOWS = {
  green: "drop-shadow(0 0 8px rgba(74, 222, 128, 0.35))",
  yellow: "drop-shadow(0 0 7px rgba(250, 204, 21, 0.32))",
  red: "drop-shadow(0 0 7px rgba(248, 113, 113, 0.3))",
};

export const TIER_GLOWS_ACTIVE = {
  green: "drop-shadow(0 0 14px rgba(110, 231, 183, 0.7))",
  yellow: "drop-shadow(0 0 12px rgba(253, 224, 71, 0.65))",
  red: "drop-shadow(0 0 12px rgba(252, 165, 165, 0.6))",
};

export function getCategoryEntries(categories) {
  if (!categories) {
    return [];
  }

  return CATEGORY_ORDER.filter((key) => categories[key]).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    ...categories[key],
  }));
}

export function getStrengthsAndWeaknesses(categories, count = 3) {
  const entries = getCategoryEntries(categories);
  if (!entries.length) {
    return { strengths: [], weaknesses: [] };
  }

  const sorted = [...entries].sort((a, b) => a.rank - b.rank);
  return {
    strengths: sorted.slice(0, count),
    weaknesses: sorted.slice(-count).reverse(),
  };
}

export function renderCategoryList(container, items, { variant }) {
  container.replaceChildren();

  if (!items.length) {
    return;
  }

  const list = document.createElement("ul");
  list.className = `category-list category-list--${variant}`;

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "category-item";

    const name = document.createElement("span");
    name.className = "category-name";
    name.textContent = item.label;

    const rank = document.createElement("span");
    rank.className = "category-rank";
    rank.textContent = `#${item.rank}`;

    li.append(name, rank);
    list.appendChild(li);
  });

  container.appendChild(list);
}
