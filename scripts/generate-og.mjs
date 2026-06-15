/**
 * Legacy OG generator — prefer `python scripts/generate_og.py` (used in prebuild).
 * Kept in sync with the luminous tier palette in generate_og.py.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "data", "states.json");
const outDir = path.join(root, "public", "og");

const payload = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const year = payload.year ?? 2025;
const tierText = { green: "#86efac", yellow: "#fde68a", red: "#fca5a5" };
const tierGradients = {
  green: ["og-tier-green", "#86efac", "0.75", "#22c55e", "0.35"],
  yellow: ["og-tier-yellow", "#fde68a", "0.7", "#eab308", "0.32"],
  red: ["og-tier-red", "#fca5a5", "0.65", "#ef4444", "0.28"],
};
const tagline = "Site selection for founders";

function tierDefs(tier) {
  const [gradId, hi, hiOp, lo, loOp] = tierGradients[tier] ?? tierGradients.yellow;
  return `<defs>
    <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${hi}" stop-opacity="${hiOp}"/>
      <stop offset="100%" stop-color="${lo}" stop-opacity="${loOp}"/>
    </linearGradient>
  </defs>`;
}

function cardShell(title, subtitle, accent = "#86efac") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#000000"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0a0a0a" stroke="#1a1a1a"/>
  <text x="96" y="180" fill="#888888" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC ${year}</text>
  <text x="96" y="280" fill="#fafafa" font-family="system-ui,sans-serif" font-size="72" font-weight="700">${title}</text>
  <text x="96" y="360" fill="${accent}" font-family="system-ui,sans-serif" font-size="40" font-weight="600">${subtitle}</text>
  <text x="96" y="500" fill="#888888" font-family="system-ui,sans-serif" font-size="24">${tagline}</text>
</svg>`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const state of Object.values(payload.states)) {
  const tier = state.tier ?? "yellow";
  const textColor = tierText[tier] || "#a3a3a3";
  const gradId = tierGradients[tier]?.[0] ?? tierGradients.yellow[0];
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${tierDefs(tier)}
  <rect width="1200" height="630" fill="#000000"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0a0a0a" stroke="#1a1a1a"/>
  <text x="96" y="180" fill="#888888" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC ${year}</text>
  <text x="96" y="280" fill="#fafafa" font-family="system-ui,sans-serif" font-size="72" font-weight="700">${state.name}</text>
  <text x="96" y="360" fill="${textColor}" font-family="system-ui,sans-serif" font-size="48" font-weight="600">Rank #${state.rank} · Score ${state.score100}/100</text>
  <rect x="96" y="400" width="420" height="12" rx="6" fill="#1a1a1a"/>
  <rect x="96" y="400" width="${Math.max(12, state.score100 * 4.2)}" height="12" rx="6" fill="url(#${gradId})"/>
  <text x="96" y="500" fill="#888888" font-family="system-ui,sans-serif" font-size="24">${tagline}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${state.slug}.svg`), svg);
}

fs.writeFileSync(path.join(outDir, "default.svg"), cardShell("Compare states", "CNBC rankings for founders"));
fs.writeFileSync(
  path.join(outDir, "compare.svg"),
  cardShell("Compare states", "Side-by-side CNBC scores · shareable link", "#86efac")
);

console.log(`Wrote ${Object.keys(payload.states).length + 2} OG images to public/og/`);
