/**
 * Rasterize an SVG brand asset to PNG via @resvg/resvg-js.
 * Usage: node scripts/render-svg-png.mjs <svg-path> <png-path> [width]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const [svgArg, pngArg, widthArg = "1200"] = process.argv.slice(2);
if (!svgArg || !pngArg) {
  console.error("Usage: node scripts/render-svg-png.mjs <svg> <png> [width]");
  process.exit(1);
}

const svgPath = path.resolve(root, svgArg);
const pngPath = path.resolve(root, pngArg);
const width = parseInt(widthArg, 10);
const fontPath = path.join(root, "public/assets/fonts/sora-latin-700-normal.ttf");
const fontFiles = fs.existsSync(fontPath) ? [fontPath] : [];

const svg = fs.readFileSync(svgPath, "utf8");
const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: width },
  font: {
    fontFiles,
    loadSystemFonts: true,
    defaultFontFamily: "Sora",
  },
});

fs.mkdirSync(path.dirname(pngPath), { recursive: true });
fs.writeFileSync(pngPath, resvg.render().asPng());
console.log(`Wrote ${path.relative(root, pngPath)}`);
