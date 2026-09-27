// Fails when the JavaScript a first-time visitor must download (everything index.html loads up front)
// exceeds the budget, so the landing page cannot silently get heavy. Run after `npm run build`.
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const BUDGET_KB = Number(process.env.SIZE_BUDGET_KB ?? 120); // gzip
const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");
const files = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
if (files.length === 0) {
  console.error("size-check: no scripts found in dist/index.html (did you run the build?)");
  process.exit(2);
}
let total = 0;
for (const f of files) {
  const kb = gzipSync(readFileSync(join(dist, f))).length / 1024;
  total += kb;
  console.log(`  ${f}  ${kb.toFixed(1)} KB gzip`);
}
console.log(`initial JavaScript: ${total.toFixed(1)} KB gzip (budget ${BUDGET_KB} KB)`);
if (total > BUDGET_KB) {
  console.error("size-check: over budget");
  process.exit(1);
}
