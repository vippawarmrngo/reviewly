// Real-browser audit of every page: console errors, horizontal overflow, and axe accessibility violations,
// in light and dark mode at phone, tablet and desktop widths. Dev-only; not part of CI (it needs a running
// server and a browser). From a folder with `playwright` and `@axe-core/playwright` installed:
//   BASE=http://localhost:8000 node audit.mjs            # public pages
//   BASE=http://localhost:8000 APP=1 node audit.mjs      # also the signed-in app (dev login, installation 42)
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE ?? "http://localhost:8000";
const PUBLIC = ["/", "/docs", "/changelog", "/status", "/privacy", "/signin", "/no-such-page"];
const APP = ["/app", "/app/settings"];
const SIZES = [[390, 800], [768, 900], [1280, 900]];
const browser = await chromium.launch();
const problems = [];
let checks = 0;

for (const scheme of ["light", "dark"]) {
  for (const [w, h] of SIZES) {
    for (const path of [...PUBLIC, ...(process.env.APP ? APP : [])]) {
      // Reduced motion shows every animated element in its settled state, so axe measures the colours at rest
      // instead of a frame halfway through a fade (which gives false contrast failures).
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme, reducedMotion: "reduce" });
      const page = await ctx.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(String(e)));
      page.on("console", (m) => {
        // the deliberate 404 page logs one failed-resource line; that is not a bug
        if (m.type() === "error" && !(path === "/no-such-page" && m.text().includes("404"))) errors.push(m.text());
      });
      if (process.env.APP) await page.goto(`${BASE}/auth/dev-login?installation=42`);
      await page.goto(BASE + path);
      await page.waitForSelector("h1", { timeout: 10000 });
      await page.waitForTimeout(700);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      const serious = axe.violations.filter((v) => ["serious", "critical"].includes(v.impact));
      const tag = `${path} ${w}px ${scheme}`;
      checks++;
      if (errors.length) problems.push(`${tag}: console errors ${JSON.stringify(errors)}`);
      if (overflow) problems.push(`${tag}: horizontal overflow`);
      for (const v of serious) problems.push(`${tag}: axe ${v.impact} ${v.id} (${v.nodes.length} nodes) ${v.nodes[0].target.join(" ")}`);
      for (const v of axe.violations.filter((x) => !["serious", "critical"].includes(x.impact))) problems.push(`${tag}: axe ${v.impact} ${v.id} (${v.nodes.length})`);
      await ctx.close();
    }
  }
}
await browser.close();
console.log(`${checks} page/size/theme combinations checked`);
console.log(problems.length ? problems.join("\n") : "no console errors, no overflow, no axe violations");
process.exit(problems.length ? 1 : 0);
