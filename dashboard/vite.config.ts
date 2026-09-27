/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// In development the API runs on :8000; in production FastAPI serves this build from the same origin.
// In development there is no server to fill the page placeholders, so use the defaults.
const devDefaults = {
  name: "dev-index-defaults",
  apply: "serve" as const,
  transformIndexHtml: (html: string) =>
    html
      .replaceAll("__TITLE__", "Reviewly (dev)")
      .replaceAll("__DESCRIPTION__", "Reviewly development server")
      .replaceAll("__ROBOTS__", "noindex")
      .replaceAll("__CANONICAL__", "http://localhost:5173/")
      .replaceAll("__OG_IMAGE__", "http://localhost:5173/og.png"),
};

export default defineConfig({
  plugins: [react(), devDefaults],
  server: {
    proxy: { "/api": "http://localhost:8000", "/auth": "http://localhost:8000" },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
    css: false,
  },
});
