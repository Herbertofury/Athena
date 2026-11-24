import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const canonical = readFileSync("reference/feature-foundry-living-world-prototype-v24.html", "utf8");
const index = readFileSync("index.html", "utf8");
const css = readFileSync("src/styles/prototype-v24.css", "utf8");
const js = readFileSync("src/prototype-v24.ts", "utf8");
const premium = readFileSync("src/premium.ts", "utf8");

const canonicalCss = canonical.slice(canonical.indexOf("  <style>") + "  <style>".length, canonical.indexOf("</style>")).trim();
const canonicalScriptStart = canonical.lastIndexOf("  <script>") + "  <script>".length;
const canonicalJs = canonical.slice(canonicalScriptStart, canonical.lastIndexOf("</script>")).trim();
const canonicalBody = canonical.slice(canonical.indexOf("<body"), canonical.lastIndexOf("  <script>"));
const projectBody = index.slice(index.indexOf("<body"), index.lastIndexOf("  <script type=\"module\""));

assert.equal(css.trim(), canonicalCss, "Canonical V24 CSS changed during modularization");
assert.equal(js.replace(/^\/\/ @ts-nocheck[^\n]*\n/, "").trim(), canonicalJs, "Canonical V24 runtime changed during modularization");
assert.equal(projectBody, canonicalBody, "Canonical V24 body markup, wording, classes, or data attributes changed");

for (const token of [
  "data-world-layout=\"unified\"",
  "data-mascot-resize=\"false\"",
  "id=\"cinematicWorldCanvas\"",
  "id=\"floatingVault\"",
  "id=\"objectSelectionHud\"",
  "id=\"historyPanel\"",
  "id=\"environmentPanel\"",
  "id=\"roomIntelligencePanel\"",
  "Soundtrack",
  "Quick actions",
]) assert.ok(index.includes(token), `Missing V24 contract token: ${token}`);

for (const token of ["window.render_game_to_text", "window.advanceTime", "requestFullscreen"]) {
  assert.ok(premium.includes(token), `Missing verification or interaction hook: ${token}`);
}

const shippedSource = `${index}\n${css}\n${js}\n${premium}`;
assert.ok(!/\bTODO\b|lorem ipsum|coming soon/i.test(shippedSource), "Shipped source contains unfinished implementation copy");

console.log("V24 structural and behavioral source contract: PASS");
