import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { CinematicWorld } from "./world/CinematicWorld";
import { ThemeDirector } from "./world/ThemeDirector";
import { ObjectEcologyLayer } from "./world/ObjectEcologyLayer";
import { MusicHub } from "./music/MusicHub";
import { MediaSurfaceController } from "./media/MediaSurfaceController";
import { activePremiumThemeId, catalogDiagnostics, themeById } from "./world/themeCatalog";

type PremiumState = {
  virtualTime: number;
  pointer: { x: number; y: number };
  lastInteraction: string;
  nativeProfile: Record<string, unknown> | null;
  nativeCatalog: Record<string, unknown> | null;
  snapshot: "idle" | "saving" | "saved" | "error";
};

const premiumState: PremiumState = {
  virtualTime: 0,
  pointer: { x: 0.5, y: 0.5 },
  lastInteraction: "ready",
  nativeProfile: null,
  nativeCatalog: null,
  snapshot: "idle",
};

const host = document.querySelector<HTMLElement>("#fullWorldBackground");
const cinematicWorld = host ? new CinematicWorld(host) : null;
const mediaSurface = new MediaSurfaceController();
const musicHub = new MusicHub();
const ecology = new ObjectEcologyLayer();
const themeDirector = new ThemeDirector();

function worldRendererTheme(id = activePremiumThemeId()): string {
  if (id.includes("frawgy") || id.includes("karoline")) return "frawgy";
  const theme = themeById(id);
  return theme.baseTheme === "frutiger" ? "frutiger" : theme.baseTheme;
}

cinematicWorld?.setTheme(worldRendererTheme());

function signalWorld(reason: string, intensity = 0.9): void {
  premiumState.lastInteraction = reason;
  cinematicWorld?.pulse(intensity);
  ecology.pulse();
  document.body.dataset.premiumSignal = reason;
  window.setTimeout(() => { if (document.body.dataset.premiumSignal === reason) delete document.body.dataset.premiumSignal; }, 680);
}

function readState(): string {
  const product = window.ffPrototype;
  const state = product?.getState?.() ?? {};
  return JSON.stringify({
    coordinateSystem: "viewport pixels; origin top-left; x right; y down",
    mode: state.currentMode ?? document.body.dataset.mode,
    view: state.currentView ?? document.body.dataset.view,
    theme: activePremiumThemeId(),
    baseTheme: document.body.dataset.theme,
    lineage: document.body.dataset.premiumLineage,
    world: state.currentWorldState ?? document.body.dataset.world,
    worldLayout: state.worldLayout ?? document.body.dataset.worldLayout,
    visualQuality: state.visualQuality ?? null,
    objects: product?.getObjectSnapshots?.() ?? [],
    objectEcology: ecology.diagnostics(),
    selected: product?.getSelectedSnapshot?.() ?? null,
    mascots: state.mascots ?? [],
    floatingVaultOpen: Boolean(state.floatingVaultOpen),
    runtime: product?.getRuntimeDiagnostics?.() ?? null,
    catalog: catalogDiagnostics(),
    themeDirector: themeDirector.diagnostics(),
    musicHub: musicHub.diagnostics(),
    mediaSurface: mediaSurface.diagnostics(),
    pointer: premiumState.pointer,
    lastInteraction: premiumState.lastInteraction,
    nativeProfile: premiumState.nativeProfile,
    nativeCatalog: premiumState.nativeCatalog,
    snapshot: premiumState.snapshot,
  });
}

window.render_game_to_text = readState;
window.advanceTime = (milliseconds = 1000 / 60) => {
  const delta = Math.max(0, Number(milliseconds) || 0);
  premiumState.virtualTime += delta;
  window.dispatchEvent(new CustomEvent("ff:advance-time", { detail: { now: premiumState.virtualTime, delta } }));
  cinematicWorld?.step(delta);
  window.ffPrototype?.scheduleCinematicWorld?.();
  return readState();
};

window.addEventListener("pointermove", (event) => {
  premiumState.pointer.x = event.clientX / Math.max(1, innerWidth);
  premiumState.pointer.y = event.clientY / Math.max(1, innerHeight);
  document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
  document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
  document.documentElement.style.setProperty("--pointer-nx", premiumState.pointer.x.toFixed(4));
  document.documentElement.style.setProperty("--pointer-ny", premiumState.pointer.y.toFixed(4));
  cinematicWorld?.setPointer(premiumState.pointer.x, premiumState.pointer.y);
  premiumState.lastInteraction = "pointermove";
}, { passive: true });

window.addEventListener("ff:premium-theme-change", (event) => {
  const id = event instanceof CustomEvent ? String(event.detail?.theme?.id ?? activePremiumThemeId()) : activePremiumThemeId();
  cinematicWorld?.setTheme(worldRendererTheme(id));
  signalWorld("theme-transition", 2.2);
});
window.addEventListener("ff:premium-room-change", () => signalWorld("room-transition", 1.7));
window.addEventListener("ff:music-signal", (event) => signalWorld("music-reactive", event instanceof CustomEvent ? Number(event.detail?.intensity ?? 1) : 1));
window.addEventListener("ff:media-signal", () => signalWorld("media-reactive", 1.35));
window.addEventListener("ff:object-ecology-action", () => signalWorld("object-ecology", 1.2));

document.querySelector<HTMLSelectElement>("#districtSelect")?.addEventListener("change", () => themeDirector.roomChanged());

window.addEventListener("keydown", async (event) => {
  const target = event.target;
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
  if (!editing && event.key.toLowerCase() === "f" && !event.repeat && !event.altKey && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    if (document.fullscreenElement) await document.exitFullscreen?.();
    else await document.documentElement.requestFullscreen?.();
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
    event.preventDefault();
    await saveNativeSnapshot();
  }
});

window.addEventListener("click", (event) => {
  const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button, .asset-card, .theme-card, [data-asset], [data-theme-card]") : null;
  if (!target) return;
  premiumState.lastInteraction = target.id || target.dataset.asset || target.dataset.themeCard || target.getAttribute("aria-label") || "click";
  cinematicWorld?.pulse(target.matches(".primary-button, [data-theme-id]") ? 1.15 : 0.45);
}, { capture: true });

async function saveNativeSnapshot(): Promise<void> {
  if (!window.__TAURI_INTERNALS__) {
    premiumState.snapshot = "saved";
    try { localStorage.setItem("ff.browser-snapshot.v1", readState()); } catch { premiumState.snapshot = "error"; }
    signalWorld("browser-snapshot", 0.8);
    return;
  }
  premiumState.snapshot = "saving";
  try {
    await invoke<string>("save_world_snapshot", { state: readState() });
    premiumState.snapshot = "saved";
    signalWorld("native-snapshot", 1);
  } catch {
    premiumState.snapshot = "error";
  }
}

function installNativeChrome(): void {
  const topbar = document.querySelector<HTMLElement>(".topbar");
  const brand = document.querySelector<HTMLElement>(".brand");
  if (topbar) topbar.dataset.tauriDragRegion = "";
  if (brand) brand.dataset.tauriDragRegion = "";
  if (!window.__TAURI_INTERNALS__) return;
  const actions = document.querySelector<HTMLElement>("#topActions");
  if (!actions || actions.querySelector(".native-window-controls")) return;
  const controls = document.createElement("div");
  controls.className = "native-window-controls";
  controls.innerHTML = `<button data-window-action="minimize" aria-label="Minimize">—</button><button data-window-action="maximize" aria-label="Maximize or restore">□</button><button data-window-action="close" aria-label="Close">×</button>`;
  actions.append(controls);
  controls.addEventListener("click", async (event) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>("[data-window-action]") : null;
    if (!button) return;
    const windowHandle = getCurrentWindow();
    if (button.dataset.windowAction === "minimize") await windowHandle.minimize();
    else if (button.dataset.windowAction === "maximize") await windowHandle.toggleMaximize();
    else if (button.dataset.windowAction === "close") await windowHandle.close();
  });
}

installNativeChrome();
if (window.__TAURI_INTERNALS__) {
  void invoke<Record<string, unknown>>("runtime_profile").then((profile) => { premiumState.nativeProfile = profile; }).catch(() => { premiumState.nativeProfile = { nativeShell: true, status: "profile-unavailable" }; });
  void invoke<Record<string, unknown>>("catalog_summary").then((summary) => { premiumState.nativeCatalog = summary; }).catch(() => { premiumState.nativeCatalog = { integrity: "unavailable" }; });
}

Object.assign(window, {
  ffPremium: {
    version: "24.0.0",
    themeDirector,
    musicHub,
    mediaSurface,
    ecology,
    cinematicWorld,
    saveSnapshot: saveNativeSnapshot,
    diagnostics: () => JSON.parse(readState()) as Record<string, unknown>,
  },
});
