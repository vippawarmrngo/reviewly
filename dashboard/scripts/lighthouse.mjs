// Lighthouse scores for the landing page and the docs, mobile and desktop, against a running server.
// Dev-only (needs a browser). From a folder with `playwright`, `lighthouse` and `chrome-launcher` installed:
//   node lighthouse.mjs      (expects http://localhost:8000)
// Scores vary a few points between runs; run it twice before trusting a change.
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "playwright";

const chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless=new", "--no-sandbox"] });
const rows = [];
for (const [form, pathname] of [["mobile", "/"], ["desktop", "/"], ["mobile", "/docs"], ["desktop", "/docs"]]) {
  const config = form === "desktop" ? { extends: "lighthouse:default", settings: { formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1 } } } : undefined;
  const r = await lighthouse(`http://localhost:8000${pathname}`, { port: chrome.port, output: "json", logLevel: "error", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] }, config);
  const c = r.lhr.categories, a = r.lhr.audits;
  rows.push(`${form.padEnd(7)} ${pathname.padEnd(6)} ` + Object.entries(c).map(([k, v]) => `${k}:${Math.round(v.score * 100)}`).join(" ") + `  LCP ${a["largest-contentful-paint"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  TBT ${a["total-blocking-time"].displayValue}`);
  const failed = Object.values(r.lhr.audits).filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === "binary").map((x) => x.id);
  if (failed.length) rows.push("   failing checks: " + failed.join(", "));
}
console.log(rows.join("\n"));
await chrome.kill();
