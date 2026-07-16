import { wireCopyButton } from "./share.js";
import { downloadReportCardPng } from "./exportReportCard.js";

export function initReportCard(root) {
  if (!root) {
    return;
  }

  const slug = root.dataset.stateSlug;
  const dataYear = Number(root.dataset.cnbcYear) || 2025;
  const statusEl = document.getElementById("report-card-share-status");

  const printBtn = document.getElementById("print-report-card");
  printBtn?.addEventListener("click", () => window.print());

  const pngBtn = document.getElementById("download-report-card-png");
  pngBtn?.addEventListener("click", () => {
    downloadReportCardPng(root, { slug, dataYear, statusEl, buttonEl: pngBtn });
  });

  wireCopyButton(
    document.getElementById("copy-report-card-link"),
    () => window.location.href,
    statusEl,
    { shareType: "report-card" }
  );
}
