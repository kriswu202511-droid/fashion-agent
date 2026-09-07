import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";

function chromeExtensionPlugin(): Plugin {
  return {
    name: "chrome-extension",
    closeBundle() {
      const dist = resolve(__dirname, "dist");

      const sidepanelDistDir = resolve(dist, "sidepanel");
      const popupDistDir = resolve(dist, "popup");
      mkdirSync(sidepanelDistDir, { recursive: true });
      mkdirSync(popupDistDir, { recursive: true });

      const sidepanelHtml = readFileSync(
        resolve(__dirname, "src/sidepanel/index.html"),
        "utf-8"
      ).replace("./index.tsx", "../sidepanel.js");
      writeFileSync(resolve(sidepanelDistDir, "index.html"), sidepanelHtml);

      const popupHtml = readFileSync(
        resolve(__dirname, "src/popup/index.html"),
        "utf-8"
      ).replace("./index.tsx", "../popup.js");
      writeFileSync(resolve(popupDistDir, "index.html"), popupHtml);

      const manifest = JSON.parse(
        readFileSync(resolve(__dirname, "manifest.json"), "utf-8")
      );
      manifest.background.service_worker = "background.js";
      manifest.content_scripts[0].js = ["content.js"];
      manifest.side_panel.default_path = "sidepanel/index.html";
      manifest.action.default_popup = "popup/index.html";
      writeFileSync(resolve(dist, "manifest.json"), JSON.stringify(manifest, null, 2));

      const iconsDir = resolve(__dirname, "icons");
      const distIconsDir = resolve(dist, "icons");
      if (existsSync(iconsDir)) {
        mkdirSync(distIconsDir, { recursive: true });
        for (const size of ["16", "48", "128"]) {
          const src = resolve(iconsDir, `icon${size}.png`);
          if (existsSync(src)) {
            copyFileSync(src, resolve(distIconsDir, `icon${size}.png`));
          }
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), chromeExtensionPlugin()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        content: resolve(__dirname, "src/content/index.ts"),
        sidepanel: resolve(__dirname, "src/sidepanel/index.tsx"),
        popup: resolve(__dirname, "src/popup/index.tsx"),
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "chunks/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});
