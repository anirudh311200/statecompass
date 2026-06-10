import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: process.env.SITE_URL || "https://statecompass.app",
  integrations: [sitemap()],
  compressHTML: true,
});
