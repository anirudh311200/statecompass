import { dataYear } from "./states.js";

export const CNBC_RANKINGS_URL =
  "https://www.cnbc.com/2025/07/10/top-states-for-business-americas-2025-the-full-rankings.html";

export const SITE_NAME = "StateCompass";
export const SITE_TAGLINE =
  "Compare US states for HQ and expansion — CNBC business climate scores, ranked and sourced.";

export function cnbcSourceLabel(year = dataYear) {
  return `CNBC America's Top States for Business, ${year}`;
}

export function cnbcYearLabel(year = dataYear) {
  return `CNBC ${year}`;
}
