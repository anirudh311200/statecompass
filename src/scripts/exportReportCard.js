function buildFilename(slug, year) {
  return `statecompass-${slug}-report-card-${year}.png`;
}

function triggerDownload(dataUrl, filename) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function downloadReportCardPng(root, { slug, dataYear, statusEl, buttonEl }) {
  if (!root || !slug) {
    return;
  }

  const defaultLabel = buttonEl?.dataset.defaultLabel || "Save as PNG";

  try {
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonTextContent(buttonEl, "Generating…");
    }

    root.classList.add("is-capturing-png");
    await new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(root, {
      backgroundColor: "#000000",
      pixelRatio: 2,
      cacheBust: true,
      filter: (node) => {
        if (!(node instanceof HTMLElement)) {
          return true;
        }
        if (node.classList.contains("report-card-toolbar")) {
          return false;
        }
        return true;
      },
    });

    triggerDownload(dataUrl, buildFilename(slug, dataYear));

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
      buttonTextContent(buttonEl, defaultLabel);
    }
  }
}

function buttonTextContent(button, text) {
  button.textContent = text;
}
