import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const screenshotDir = "artifacts/screenshots";
mkdirSync(screenshotDir, { recursive: true });

const server = await preview({ preview: { host: "127.0.0.1", port: 4173, strictPort: true } });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
const pageErrors = [];
page.on("pageerror", (error) => pageErrors.push(error.message));

try {
  await page.goto("http://127.0.0.1:4173", { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.body.dataset.selftest === "pass", undefined, { timeout: 15_000 });
  await page.waitForFunction(() => document.body.dataset.premiumTheme === "frutiger-aero");

  const [left, center, right, worldCanvas] = await Promise.all([
    page.locator("#leftWorld").boundingBox(),
    page.locator(".workbench").boundingBox(),
    page.locator("#rightWorld").boundingBox(),
    page.locator("#cinematicWorldCanvas").boundingBox(),
  ]);
  assert.ok(left && left.width >= 200, "Left living-world lane is not fully rendered");
  assert.ok(center && center.width >= 650, "Center workspace is not fully rendered");
  assert.ok(right && right.width >= 200, "Right living-world lane is not fully rendered");
  assert.ok(worldCanvas && worldCanvas.width >= 1300 && worldCanvas.height >= 850, `Procedural world canvas does not cover the living shell: ${JSON.stringify(worldCanvas)}`);
  assert.equal(await page.locator(".premium-ecology-actor").count(), 5, "Active V33 room must render five exact ecology actors");
  await page.screenshot({ path: `${screenshotDir}/frutiger-dashboard.png`, fullPage: true });

  await page.locator("#themeSelect").selectOption("world.frawgy.verdant-conservatory");
  await page.waitForFunction(() => document.body.dataset.premiumTheme === "world.frawgy.verdant-conservatory");
  await page.mouse.move(1240, 260, { steps: 8 });
  await page.evaluate(() => window.advanceTime?.(1200));
  await page.screenshot({ path: `${screenshotDir}/frawgy-dashboard.png`, fullPage: true });

  await page.locator("#editTheme").click();
  await page.locator("#themeAtlasStudio.open").waitFor();
  assert.equal(await page.locator(".theme-atlas-card").count(), 27, "Theme Atlas must expose 17 V33 plus 10 artist worlds");
  await page.screenshot({ path: `${screenshotDir}/theme-atlas.png`, fullPage: true });
  await page.locator(".theme-atlas-header [data-theme-atlas-action=close]").click();

  await page.locator("#musicQuick").click();
  await page.locator("#musicHub.open").waitFor();
  await page.locator("[data-music-action=toggle-menu]").click();
  assert.equal(await page.locator(".music-provider-menu [data-music-route]").count(), 8, "Music menu must expose Home, six real providers, and Settings");
  await page.screenshot({ path: `${screenshotDir}/music-hub.png`, fullPage: true });
  await page.locator(".music-hub-close").click();

  await page.locator("#environmentTv").click();
  await page.locator("#mediaSurfaceStudio.open").waitFor();
  await page.locator("#mediaSurfaceUrl").fill("http://example.com/video.mp4");
  await page.locator("[data-media-action=load-url]").click();
  assert.match(await page.locator("[data-media-message]").textContent(), /HTTPS/);
  await page.screenshot({ path: `${screenshotDir}/living-screen-studio.png`, fullPage: true });

  const state = JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? "{}"));
  assert.equal(state.catalog.durableThemes, 17);
  assert.equal(state.catalog.artistWorlds, 10);
  assert.equal(state.musicHub.credentialStorage, "session-only");
  assert.equal(state.themeDirector.active, "world.frawgy.verdant-conservatory");
  assert.equal(state.mediaSurface.kind, "idle");
  assert.equal(pageErrors.length, 0, `Browser runtime errors: ${pageErrors.join(" | ")}`);
  console.log("Frutiger, Frawgy, Theme Atlas, Music Hub, media surface, and runtime diagnostics: PASS");
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
