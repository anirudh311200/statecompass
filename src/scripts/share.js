export function getShareUrl(pathOrUrl) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${window.location.origin}${path}`;
}

export async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

import { trackShare } from "./analytics.js";

export function wireCopyButton(button, getUrl, statusEl, { shareType = "link" } = {}) {
  if (!button) {
    return;
  }

  button.addEventListener("click", async () => {
    const url = typeof getUrl === "function" ? getUrl() : getUrl;
    const label = button.dataset.defaultLabel || button.textContent.trim();

    try {
      await copyText(getShareUrl(url));
      trackShare(shareType);
      button.textContent = "Copied!";
      if (statusEl) {
        statusEl.textContent = "Link copied to clipboard.";
      }
      window.setTimeout(() => {
        button.textContent = label;
        if (statusEl) {
          statusEl.textContent = "";
        }
      }, 2000);
    } catch {
      if (statusEl) {
        statusEl.textContent = "Could not copy link. Copy the URL from your browser bar.";
      }
    }
  });
}
