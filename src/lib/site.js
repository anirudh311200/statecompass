import { dataYear } from "./states.js";

const RANKINGS_URLS = {
  2025:
    "https://www.cnbc.com/2025/07/10/top-states-for-business-americas-2025-the-full-rankings.html",
  2024:
    "https://www.cnbc.com/2024/07/11/americas-top-states-for-business-full-rankings.html",
};

export const CNBC_RANKINGS_URL = RANKINGS_URLS[dataYear] ?? RANKINGS_URLS[2025];

export const SITE_NAME = "StateCompass";
export const BRAND_VERSION = "2";
export const SEARCH_FAVICON_PNG = "/favicon-192x192.png";
export const SITE_TAGLINE =
  "Compare US states for HQ and expansion — CNBC business climate scores, ranked and sourced.";

export function cnbcSourceLabel(year = dataYear) {
  return `CNBC America's Top States for Business, ${year}`;
}

export function cnbcYearLabel(year = dataYear) {
  return `CNBC ${year}`;
}

export function cnbcRankingsUrl(year = dataYear) {
  return RANKINGS_URLS[year] ?? RANKINGS_URLS[2025];
}
