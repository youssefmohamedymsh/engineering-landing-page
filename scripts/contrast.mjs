// scripts/contrast.mjs — WCAG contrast for OKLCH tokens in css/styles.css
// Run: node scripts/contrast.mjs   (exit 1 on failure)
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../css/styles.css", import.meta.url), "utf8");
const tokens = {};
for (const m of css.matchAll(/--([\w-]+):\s*oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
  tokens[m[1]] = [Number(m[2]), Number(m[3]), Number(m[4])];
}

function oklchToLinearRgb(L, C, h) {
  const a = C * Math.cos((h * Math.PI) / 180);
  const b = C * Math.sin((h * Math.PI) / 180);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => Math.min(1, Math.max(0, v)));
}
const luminance = (t) => {
  const [r, g, b] = oklchToLinearRgb(...tokens[t]);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (fg, bg) => {
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
};

// [foreground, background, minimum]
const pairs = [
  ["ink", "bg", 4.5], ["ink", "surface", 4.5],
  ["ink-2", "bg", 7], ["ink-2", "surface", 7],
  ["brand", "bg", 4.5], ["brand", "surface", 4.5],
  ["on-brand", "brand", 4.5],            // primary button
  ["on-brand", "brand-deep", 7],         // process band body
  ["on-brand-2", "brand-deep", 7],       // process band secondary
  ["on-brand", "signal-deep", 4.5],      // WhatsApp button
  ["signal-text", "bg", 4.5],            // success message
  ["danger", "bg", 4.5],                 // error message
  ["on-brand-2", "ink", 4.5],            // footer links
  ["on-brand", "ink", 4.5],              // footer wordmark
  ["brand", "brand-tint", 4.5],          // chips
];

let failed = false;
for (const [fg, bg, min] of pairs) {
  if (!tokens[fg] || !tokens[bg]) { console.error(`missing token: ${fg} / ${bg}`); failed = true; continue; }
  const r = ratio(fg, bg);
  const ok = r >= min;
  failed ||= !ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${fg.padEnd(11)} on ${bg.padEnd(11)} ${r.toFixed(2)}:1  (min ${min})`);
}
process.exit(failed ? 1 : 0);
