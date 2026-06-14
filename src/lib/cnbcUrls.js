export const METHODOLOGY_URLS = {
  2025:
    "https://www.cnbc.com/2025/06/11/how-we-are-choosing-americas-top-states-for-business-in-2025.html",
  2024:
    "https://www.cnbc.com/2024/06/13/how-we-are-choosing-americas-top-states-for-business-in-2024.html",
};

export function cnbcStateArticleUrl(year, slug) {
  if (year === 2025) {
    return `https://www.cnbc.com/2025/07/10/${slug}-top-states-for-business-ranking.html`;
  }
  if (year === 2024) {
    return `https://www.cnbc.com/2024/07/11/top-states-for-business-${slug}.html`;
  }
  return `https://www.cnbc.com/${year}/07/10/top-states-for-business-${slug}.html`;
}
