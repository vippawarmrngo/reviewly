// Renders the raster brand assets (apple-touch-icon.png, og.png) from SVG/HTML with headless Chromium.
// Dev-only: run from a folder where `playwright` is installed, e.g.
//   npm i --no-save playwright && npx playwright install chromium && node scripts/render_brand.mjs
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const mark = readFileSync(join(root, "favicon.svg"), "utf8");
const browser = await chromium.launch();

async function shot(name, width, height, html, scale = 1) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
  await page.setContent(html);
  writeFileSync(join(root, name), await page.screenshot({ type: "png" }));
  await page.close();
  console.log("wrote", name);
}

await shot("apple-touch-icon.png", 180, 180, `<body style="margin:0">${mark.replace("<svg ", '<svg width="180" height="180" ')}</body>`);

const og = `<body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;
  font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f1226;
  background:radial-gradient(900px 500px at 85% -10%,rgba(99,102,241,.28),transparent),#f5f6fb;position:relative">
  <div style="padding:0 80px;width:100%">
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:38px">
      ${mark.replace("<svg ", '<svg width="64" height="64" ')}
      <span style="font-size:38px;font-weight:700;letter-spacing:-.02em">Reviewly</span>
    </div>
    <div style="font-size:66px;font-weight:750;letter-spacing:-.035em;line-height:1.08;max-width:1040px;text-wrap:balance">
      Catch bugs in pull requests before your teammates have to</div>
    <div style="margin-top:30px;font-size:30px;color:#666c82;max-width:900px">
      One focused AI review on every GitHub pull request: inline comments and suggested fixes.</div>
  </div></body>`;
await shot("og.png", 1200, 630, og);
await browser.close();
