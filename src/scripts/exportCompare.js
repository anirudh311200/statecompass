function buildFilename(abbrs, year) {
  const slug = abbrs.map((abbr) => abbr.toLowerCase()).join("-");
  return `statecompass-${slug}-${year}.png`;
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function downloadComparePng(root, { abbrs, dataYear, statusEl, buttonEl }) {
  if (!root || abbrs.length < 2) {
    return;
  }

  const defaultLabel = buttonEl?.dataset.defaultLabel || "Save as PNG";
  const urlEl = document.getElementById("compare-export-url");

  if (urlEl) {
    urlEl.textContent = window.location.href;
  }

  try {
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = "Generating…";
    }

    root.classList.add("is-capturing-png");
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(root, {
      backgroundColor: "#050505",
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) {
          return true;
        }
        if (node.classList.contains("compare-detail-link")) {
          return false;
        }
        if (node.id === "compare-live-status") {
          return false;
        }
        return true;
      },
    });

    triggerDownload(dataUrl, buildFilename(abbrs, dataYear));

    if (statusEl) {
      statusEl.textContent = "PNG downloaded.";
      window.setTimeout(() => {
        if (statusEl.textContent === "PNG downloaded.") {
          statusEl.textContent = "";
        }
      }, 2500);
    }
  } catch {
    if (statusEl) {
      statusEl.textContent = "Could not save PNG. Try Print / save PDF instead.";
    }
  } finally {
    root.classList.remove("is-capturing-png");
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.textContent = defaultLabel;
    }
  }
}
