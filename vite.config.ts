import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { type ManifestOptions, VitePWA } from "vite-plugin-pwa";
import { createHtmlPlugin } from "vite-plugin-html";
import postcssPresetEnv from "postcss-preset-env";
import manifest from "./public/manifest.json" with { type: "json" };

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    VitePWA({
      // devOptions: {
      //   enabled: true
      // },
      manifest: manifest as Partial<ManifestOptions>,
      manifestFilename: "manifest.json",
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        swDest: "./dist/sw.js",
        skipWaiting: true,
        clientsClaim: true,
        disableDevLogs: true
      },
      registerType: "autoUpdate"
    }),
    createHtmlPlugin({
      minify: true
    })
  ],
  css: {
    postcss: {
      plugins: [
        postcssPresetEnv({ stage: 0 })
      ]
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("src", import.meta.url)),
      "services": fileURLToPath(new URL("src/services", import.meta.url)),
      "components": fileURLToPath(new URL("src/components", import.meta.url))
    }
  },
  build: {
    target: "esnext"
  },
  base: "./"
})
