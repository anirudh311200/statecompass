import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "public", "data", "states.json");
const outDir = path.join(root, "public", "og");

const payload = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
const year = payload.year ?? 2025;
const tierColors = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
const tagline = "Site selection for founders";

function cardShell(title, subtitle, accent = "#737373") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0e0e0e" stroke="#262626"/>
  <text x="96" y="180" fill="#737373" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC ${year}</text>
  <text x="96" y="280" fill="#f5f5f5" font-family="system-ui,sans-serif" font-size="72" font-weight="700">${title}</text>
  <text x="96" y="360" fill="${accent}" font-family="system-ui,sans-serif" font-size="40" font-weight="600">${subtitle}</text>
  <text x="96" y="500" fill="#737373" font-family="system-ui,sans-serif" font-size="24">${tagline}</text>
</svg>`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const state of Object.values(payload.states)) {
  const color = tierColors[state.tier] || "#737373";
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#050505"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="#0e0e0e" stroke="#262626"/>
  <text x="96" y="180" fill="#737373" font-family="system-ui,sans-serif" font-size="28">StateCompass · CNBC ${year}</text>
  <text x="96" y="280" fill="#f5f5f5" font-family="system-ui,sans-serif" font-size="72" font-weight="700">${state.name}</text>
  <text x="96" y="360" fill="${color}" font-family="system-ui,sans-serif" font-size="48" font-weight="600">Rank #${state.rank} · Score ${state.score100}/100</text>
  <rect x="96" y="400" width="420" height="12" rx="6" fill="#262626"/>
  <rect x="96" y="400" width="${Math.max(12, state.score100 * 4.2)}" height="12" rx="6" fill="${color}"/>
  <text x="96" y="500" fill="#737373" font-family="system-ui,sans-serif" font-size="24">${tagline}</text>
</svg>`;
  fs.writeFileSync(path.join(outDir, `${state.slug}.svg`), svg);
}

fs.writeFileSync(path.join(outDir, "default.svg"), cardShell("Compare states", "CNBC rankings for founders"));
fs.writeFileSync(
  path.join(outDir, "compare.svg"),
  cardShell("Compare states", "Side-by-side CNBC scores · shareable link", "#22c55e")
);

console.log(`Wrote ${Object.keys(payload.states).length + 2} OG images to public/og/`);
