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
  green: "Green — Ranks 1–17",
  yellow: "Yellow — Ranks 18–34",
  red: "Red — Ranks 35–50",
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
