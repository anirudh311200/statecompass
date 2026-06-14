import { loadIndex, getLatestChangelog } from "./yearData.js";

const DISMISS_KEY = "statecompass:changelog-dismiss";

export async function initChangelogBanner() {
  const banner = document.getElementById("changelog-banner");
  const textEl = document.getElementById("changelog-banner-text");
  const dismissBtn = document.getElementById("changelog-banner-dismiss");

  if (!banner || !textEl) {
    return;
  }

  const index = await loadIndex();
  const latest = getLatestChangelog(index);
  if (!latest) {
    return;
  }

  const dismissedYear = Number(localStorage.getItem(DISMISS_KEY));
  if (dismissedYear === latest.year) {
    return;
  }

  textEl.textContent = `${latest.message} Published ${latest.publishedAt}.`;
  banner.hidden = false;

  dismissBtn?.addEventListener("click", () => {
    localStorage.setItem(DISMISS_KEY, String(latest.year));
    banner.hidden = true;
  });
}
