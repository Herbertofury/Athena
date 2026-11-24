import { openUrl as openNativeUrl } from "@tauri-apps/plugin-opener";
import { invoke } from "@tauri-apps/api/core";
import { once } from "@tauri-apps/api/event";
import { PROVIDERS, isProviderId, providerById, type ProviderDefinition, type ProviderId } from "./providerCatalog";
import { activePremiumThemeId, themeById } from "../world/themeCatalog";

type MusicRoute = "home" | "settings" | ProviderId;

type SoundtrackMapping = {
  provider: ProviderId;
  url: string;
  label: string;
  status: string;
  sourceId?: string;
  updatedAt: string;
};

type StoredMusicState = {
  version: 2;
  route: MusicRoute;
  mappings: Record<string, SoundtrackMapping>;
};

type SpotifySession = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  accountId?: string;
  displayName?: string;
};

type SpotifyCallbackPayload = { code?: string; state?: string; error?: string; redirectUri: string };

type ProviderRuntimeState = {
  status: "external" | "config-required" | "authorizing" | "connected" | "reauthorization-required" | "rate-limited" | "quota-exhausted" | "error";
  detail: string;
};

type NativeRoomSoundtrack = Omit<SoundtrackMapping, "updatedAt"> & { themeId: string; roomId: string; updatedAt: number };

export type MusicHubDiagnostics = {
  open: boolean;
  route: MusicRoute;
  theme: string;
  district: string;
  mapping: SoundtrackMapping;
  providers: Record<ProviderId, ProviderRuntimeState>;
  credentialStorage: "session-only";
};

const STORE_KEY = "ff.music-hub.v2";
const SPOTIFY_SESSION_KEY = "ff.spotify.session.v1";
const SPOTIFY_VERIFIER_KEY = "ff.spotify.pkce.verifier";
const SPOTIFY_STATE_KEY = "ff.spotify.pkce.state";
const SPOTIFY_REDIRECT_KEY = "ff.spotify.pkce.redirect";
const SPOTIFY_CLIENT_KEY = "ff.spotify.client-id";
const APPLE_TOKEN_KEY = "ff.apple.developer-token";

const initialProviderRuntime = (): Record<ProviderId, ProviderRuntimeState> => ({
  spotify: { status: "config-required", detail: "Add a Spotify Client ID to activate PKCE." },
  apple: { status: "config-required", detail: "Add a MusicKit developer token to authorize." },
  deezer: { status: "external", detail: "Verified external handoff is ready." },
  soundcloud: { status: "external", detail: "Verified external handoff is ready." },
  tidal: { status: "external", detail: "Verified external handoff is ready." },
  youtube: { status: "external", detail: "Verified external handoff is ready." },
});

const createDefaultState = (): StoredMusicState => ({ version: 2, route: "home", mappings: {} });

function restoreState(): StoredMusicState {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_KEY) ?? "null") as Partial<StoredMusicState> | null;
    if (!parsed || parsed.version !== 2 || typeof parsed.mappings !== "object" || !parsed.mappings) return createDefaultState();
    const route = typeof parsed.route === "string" && (parsed.route === "home" || parsed.route === "settings" || isProviderId(parsed.route))
      ? parsed.route
      : "home";
    return { version: 2, route, mappings: parsed.mappings as Record<string, SoundtrackMapping> };
  } catch {
    return createDefaultState();
  }
}

function randomUrlSafe(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256UrlSafe(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function readSessionJson<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null") as T | null;
  } catch {
    return null;
  }
}

function spotifyContextUri(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "open.spotify.com") return null;
    const [kind, id] = parsed.pathname.split("/").filter(Boolean);
    return kind && id && ["album", "artist", "playlist", "show"].includes(kind) ? `spotify:${kind}:${id}` : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export class MusicHub {
  private readonly root: HTMLDivElement;
  private readonly state = restoreState();
  private readonly providerRuntime = initialProviderRuntime();
  private spotifySession = readSessionJson<SpotifySession>(SPOTIFY_SESSION_KEY);
  private appleMusic: MusicKitInstance | null = null;
  private appleScriptPromise: Promise<void> | null = null;
  private dropdownOpen = false;
  private statusMessage = "Soundtrack routing ready.";
  private statusTone: "neutral" | "success" | "warning" | "error" = "neutral";
  private mutationObserver: MutationObserver;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "music-hub-overlay";
    this.root.id = "musicHub";
    this.root.hidden = true;
    this.root.innerHTML = this.shellMarkup();
    document.body.append(this.root);
    this.bind();
    this.syncProviderRuntime();
    this.render();
    this.bindLaunchers();
    this.mutationObserver = new MutationObserver(() => this.syncContext());
    this.mutationObserver.observe(document.body, { attributes: true, attributeFilter: ["data-theme", "data-premium-theme"] });
    document.querySelector<HTMLSelectElement>("#districtSelect")?.addEventListener("change", () => this.syncContext());
    window.addEventListener("ff:open-music-hub", () => this.open());
    window.addEventListener("ff:premium-room-change", () => this.syncContext());
    void this.completeSpotifyCallback();
    void this.hydrateNativeMapping();
  }

  private shellMarkup(): string {
    const providerRows = PROVIDERS.map((provider) => `
      <button class="music-provider-menu-item" data-music-route="${provider.id}" role="menuitem">
        <span class="music-provider-glyph" style="--provider-accent:${provider.accent}">${provider.shortName}</span>
        <span>${provider.name}</span>
        <i data-provider-dot="${provider.id}"></i>
      </button>`).join("");
    return `
      <button class="music-hub-scrim" data-music-action="close" aria-label="Close Music Hub"></button>
      <section class="music-hub-panel" role="dialog" aria-modal="true" aria-labelledby="musicHubTitle">
        <header class="music-hub-header">
          <div class="music-hub-heading"><span class="music-hub-pulse"></span><div><small>Source Hubs · live routing</small><h2 id="musicHubTitle">Music Hub</h2></div></div>
          <div class="music-hub-toolbar">
            <div class="music-provider-switcher">
              <button class="music-provider-trigger" data-music-action="toggle-menu" aria-haspopup="menu" aria-expanded="false">
                <span class="music-provider-glyph" data-current-provider-glyph>S</span><span data-current-provider-name>Spotify</span><span class="music-chevron">⌄</span>
              </button>
              <div class="music-provider-menu" role="menu" hidden>
                <button class="music-provider-menu-item" data-music-route="home" role="menuitem"><span class="music-provider-glyph home">⌂</span><span>Home</span></button>
                ${providerRows}
                <div class="music-provider-separator"></div>
                <button class="music-provider-menu-item" data-music-route="settings" role="menuitem"><span class="music-provider-glyph settings">⚙</span><span>Settings</span></button>
              </div>
            </div>
            <label class="music-search"><span>⌕</span><input id="musicHubSearch" type="search" autocomplete="off" placeholder="Search the selected provider" /><button data-music-action="search" aria-label="Search">↗</button></label>
            <button class="music-hub-close" data-music-action="close" aria-label="Close Music Hub">×</button>
          </div>
        </header>
        <div class="music-hub-context-bar"><span data-context-theme>Frutiger Aero</span><b>·</b><span data-context-room>Horizon Vista</span><i></i><span data-context-route>Room soundtrack armed</span></div>
        <main class="music-hub-content" data-music-content></main>
        <footer class="music-transport">
          <div class="music-album-art" data-music-album-art><i></i><b>FF</b></div>
          <div class="music-now-playing"><small>ROOM SOUNDTRACK</small><strong data-transport-title>Aero Skyline Mix</strong><span data-transport-provider>Spotify · Horizon Vista</span></div>
          <div class="music-transport-controls">
            <button data-music-action="ambient" title="Play or pause the local living score">◀</button>
            <button class="music-transport-play" data-music-action="remote-play" title="Play through the authorized provider">▶</button>
            <button data-music-action="remote-next" title="Next provider item">▶▶</button>
          </div>
          <div class="music-reactive-meter" aria-label="Music reactive world energy"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
          <button class="music-open-external" data-music-action="open-mapping"><span>Open provider</span><b>↗</b></button>
        </footer>
        <div class="music-status" data-music-status data-tone="neutral"><span></span><p>Soundtrack routing ready.</p></div>
      </section>`;
  }

  private bind(): void {
    this.root.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-music-action], [data-music-route]") : null;
      if (!target) return;
      const route = target.dataset.musicRoute;
      if (route) {
        this.setRoute(route);
        return;
      }
      const action = target.dataset.musicAction;
      if (!action) return;
      void this.runAction(action, target);
    });
    this.root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") this.close();
      if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.id === "musicHubSearch") {
        event.preventDefault();
        void this.search();
      }
    });
  }

  private bindLaunchers(): void {
    const launcherIds = new Set(["musicQuick", "dockMusic", "soundToggle", "commandSoundtrack"]);
    document.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("button") : null;
      if (!target || !launcherIds.has(target.id)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    }, { capture: true });
  }

  private async runAction(action: string, target: HTMLElement): Promise<void> {
    try {
      switch (action) {
        case "close": this.close(); break;
        case "toggle-menu": this.toggleMenu(); break;
        case "search": await this.search(); break;
        case "open-mapping": await this.openMapping(); break;
        case "ambient": document.querySelector<HTMLButtonElement>("#playButton")?.click(); this.worldPulse("local-score"); break;
        case "remote-play": await this.remotePlay(); break;
        case "remote-next": await this.remoteNext(); break;
        case "connect": await this.connectProvider(target.dataset.provider); break;
        case "disconnect": await this.disconnectProvider(target.dataset.provider); break;
        case "save-mapping": this.saveMappingFromForm(); break;
        case "use-source-route": this.useSourceRoute(target.dataset.routeId); break;
        case "save-credentials": this.saveCredentialsFromForm(); break;
        case "provider-home": await this.openProviderHome(target.dataset.provider); break;
        case "show-settings": this.setRoute("settings"); break;
        default: break;
      }
    } catch (error) {
      this.setStatus(error instanceof Error ? error.message : String(error), "error");
    }
  }

  open(route?: MusicRoute): void {
    if (route) this.state.route = route;
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add("open"));
    document.body.dataset.musicHub = "open";
    this.syncContext();
    this.root.querySelector<HTMLButtonElement>(".music-provider-trigger")?.focus({ preventScroll: true });
  }

  close(): void {
    this.dropdownOpen = false;
    this.root.classList.remove("open");
    delete document.body.dataset.musicHub;
    window.setTimeout(() => { if (!this.root.classList.contains("open")) this.root.hidden = true; }, 260);
  }

  private setRoute(route: string): void {
    if (!(route === "home" || route === "settings" || isProviderId(route))) return;
    if (isProviderId(route)) {
      const context = this.context();
      const existing = this.mappingFor(context.theme, context.district);
      if (existing.provider !== route) {
        const theme = themeById(context.theme);
        const provider = providerById(route);
        this.state.mappings[this.contextKey(context.theme, context.district)] = {
          provider: route,
          url: provider.searchUrl(theme.soundtrack.query),
          label: theme.soundtrack.label,
          status: "USER_SEARCH_ROUTE",
          updatedAt: new Date().toISOString(),
        };
        this.persist();
      }
    }
    this.state.route = route;
    this.dropdownOpen = false;
    this.persist();
    this.render();
    this.worldPulse(`provider-${route}`);
  }

  private toggleMenu(): void {
    this.dropdownOpen = !this.dropdownOpen;
    const menu = this.root.querySelector<HTMLElement>(".music-provider-menu");
    const trigger = this.root.querySelector<HTMLElement>(".music-provider-trigger");
    if (menu) menu.hidden = !this.dropdownOpen;
    trigger?.setAttribute("aria-expanded", String(this.dropdownOpen));
  }

  private context(): { theme: string; district: string } {
    const theme = activePremiumThemeId();
    const themeRecord = themeById(theme);
    const district = document.querySelector<HTMLSelectElement>("#districtSelect")?.value || themeRecord.rooms[0] || themeRecord.worldName;
    return { theme, district };
  }

  private contextKey(theme: string, district: string): string {
    return `${theme}::${district}`;
  }

  private mappingFor(themeId: string, district: string): SoundtrackMapping {
    const stored = this.state.mappings[this.contextKey(themeId, district)];
    if (stored && isProviderId(stored.provider)) return stored;
    const theme = themeById(themeId);
    const provider = providerById(theme.soundtrack.provider);
    return {
      provider: provider.id,
      url: theme.soundtrack.url,
      label: theme.soundtrack.label,
      status: theme.soundtrack.status,
      updatedAt: theme.lineage,
    };
  }

  private persist(): void {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
    } catch {
      this.setStatus("Browser storage is unavailable; this mapping remains active for the current view.", "warning");
    }
  }

  private syncProviderRuntime(): void {
    if (this.spotifySession?.accessToken) {
      const expiredRefresh = Boolean(this.spotifySession.refreshExpiresAt && Date.now() >= this.spotifySession.refreshExpiresAt);
      this.providerRuntime.spotify = expiredRefresh
        ? { status: "reauthorization-required", detail: "Spotify refresh authorization expired; reconnect without losing mappings." }
        : { status: "connected", detail: this.spotifySession.displayName ? `Connected as ${this.spotifySession.displayName}.` : "Authorized Spotify session active." };
    } else if (sessionStorage.getItem(SPOTIFY_CLIENT_KEY)) {
      this.providerRuntime.spotify = { status: "config-required", detail: "Client configured; authorize this session to activate library and playback controls." };
    }
    if (this.appleMusic) this.providerRuntime.apple = { status: "connected", detail: "MusicKit user authorization is active for this session." };
    else if (sessionStorage.getItem(APPLE_TOKEN_KEY)) this.providerRuntime.apple = { status: "config-required", detail: "Developer token configured; authorize the Apple Music user session." };
  }

  private syncContext(): void {
    this.render();
    this.worldPulse("room-soundtrack-sync", 0.45);
    void this.hydrateNativeMapping();
  }

  private async hydrateNativeMapping(): Promise<void> {
    if (!window.__TAURI_INTERNALS__) return;
    const context = this.context();
    try {
      const mapping = await invoke<NativeRoomSoundtrack | null>("room_soundtrack", { themeId: context.theme, roomId: context.district });
      if (!mapping) return;
      this.state.mappings[this.contextKey(context.theme, context.district)] = {
        provider: mapping.provider,
        url: mapping.url,
        label: mapping.label,
        status: mapping.status,
        sourceId: mapping.sourceId,
        updatedAt: new Date(mapping.updatedAt * 1000).toISOString(),
      };
      this.persist();
      this.render();
    } catch {
      this.setStatus("Native soundtrack storage is temporarily unavailable; the active mapping remains in local state.", "warning");
    }
  }

  private async persistNativeMapping(context: { theme: string; district: string }, mapping: SoundtrackMapping): Promise<void> {
    if (!window.__TAURI_INTERNALS__) return;
    try {
      await invoke("assign_room_soundtrack", {
        assignment: {
          themeId: context.theme,
          roomId: context.district,
          provider: mapping.provider,
          url: mapping.url,
          label: mapping.label,
          status: mapping.status,
          sourceId: mapping.sourceId ?? null,
        },
      });
    } catch {
      this.setStatus("The room mapping is active locally, but native database persistence failed.", "warning");
    }
  }

  private render(): void {
    this.syncProviderRuntime();
    const context = this.context();
    const theme = themeById(context.theme);
    const mapping = this.mappingFor(context.theme, context.district);
    const provider = providerById(mapping.provider);
    const content = this.root.querySelector<HTMLElement>("[data-music-content]");
    if (content) {
      if (this.state.route === "settings") content.innerHTML = this.settingsMarkup();
      else if (this.state.route === "home") content.innerHTML = this.homeMarkup();
      else content.innerHTML = this.providerMarkup(provider);
      this.populateDynamicFields();
    }
    this.root.querySelector<HTMLElement>("[data-current-provider-glyph]")!.textContent = provider.shortName;
    this.root.querySelector<HTMLElement>("[data-current-provider-glyph]")!.style.setProperty("--provider-accent", provider.accent);
    this.root.querySelector<HTMLElement>("[data-current-provider-name]")!.textContent = this.state.route === "home" ? "Music" : this.state.route === "settings" ? "Settings" : provider.name;
    this.root.querySelector<HTMLElement>("[data-context-theme]")!.textContent = theme.name;
    this.root.querySelector<HTMLElement>("[data-context-room]")!.textContent = context.district;
    this.root.querySelector<HTMLElement>("[data-context-route]")!.textContent = mapping.url ? `${provider.name} · ${mapping.status}` : "Soundtrack unassigned";
    this.root.querySelector<HTMLElement>("[data-transport-title]")!.textContent = mapping.label;
    this.root.querySelector<HTMLElement>("[data-transport-provider]")!.textContent = `${provider.name} · ${context.district}`;
    this.root.querySelector<HTMLElement>("[data-music-album-art]")!.style.setProperty("--provider-accent", provider.accent);
    const openLabel = this.root.querySelector<HTMLElement>(".music-open-external span");
    if (openLabel) openLabel.textContent = mapping.url ? `Open ${provider.name}` : "Assign soundtrack";
    const externalButton = this.root.querySelector<HTMLButtonElement>(".music-open-external");
    if (externalButton) externalButton.disabled = !mapping.url;
    const menu = this.root.querySelector<HTMLElement>(".music-provider-menu");
    if (menu) menu.hidden = !this.dropdownOpen;
    this.root.querySelector<HTMLElement>(".music-provider-trigger")?.setAttribute("aria-expanded", String(this.dropdownOpen));
    for (const definition of PROVIDERS) {
      const dot = this.root.querySelector<HTMLElement>(`[data-provider-dot="${definition.id}"]`);
      if (dot) dot.dataset.status = this.providerRuntime[definition.id].status;
    }
    this.syncCanonicalHud(mapping, provider, context.district);
    this.renderStatus();
  }

  private homeMarkup(): string {
    const theme = themeById(this.context().theme);
    const sourceRoutes = theme.musicRoutes.length ? `
      <article class="music-feature-card music-source-routes">
        <div class="music-card-kicker"><span>VERIFIED CURATOR ROUTES</span><i>${theme.musicRoutes.length} sources</i></div>
        <h3>Artist-world soundtrack pool</h3>
        <p>Status is preserved exactly from the v4.0.1 database. Candidate routes are never presented as approved.</p>
        <div class="music-source-route-list">${theme.musicRoutes.map((route) => `
          <button data-music-action="use-source-route" data-route-id="${escapeHtml(route.playlist_id)}">
            <span><strong>${escapeHtml(route.playlist)}</strong><small>${escapeHtml(route.suggested_routing)}</small></span>
            <i data-route-status="${escapeHtml(route.approval_status)}">${escapeHtml(route.approval_status.replaceAll("_", " "))}</i>
          </button>`).join("")}</div>
      </article>` : "";
    return `
      <section class="music-home-grid">
        <article class="music-feature-card music-current-card">
          <div class="music-card-kicker"><span>ACTIVE ROOM SCORE</span><i data-mapping-health>Mapped</i></div>
          <div class="music-current-visual"><div class="music-vinyl"><i></i></div><div><h3 data-mapping-label></h3><p data-mapping-context></p><div class="music-waveform">${"<i></i>".repeat(28)}</div></div></div>
          <div class="music-card-actions"><button class="music-primary" data-music-action="open-mapping">Open assigned soundtrack ↗</button><button data-music-action="remote-play">Play with provider</button></div>
        </article>
        <article class="music-feature-card music-route-card">
          <div class="music-card-kicker"><span>ROOM ROUTING</span><i>Persistent</i></div>
          <h3>Theme + room soundtrack</h3>
          <p>Each room keeps its own provider and destination. Switching worlds recalls that route without overwriting any other room.</p>
          <label>Soundtrack name<input id="musicMappingLabel" maxlength="80" /></label>
          <label>Provider URL<input id="musicMappingUrl" type="url" spellcheck="false" /></label>
          <button data-music-action="save-mapping">Save this room mapping</button>
        </article>
        <article class="music-feature-card music-provider-matrix">
          <div class="music-card-kicker"><span>PROVIDER MATRIX</span><i>Truthful capabilities</i></div>
          <div class="music-provider-cards">${PROVIDERS.map((provider) => `
            <button data-music-route="${provider.id}" style="--provider-accent:${provider.accent}">
              <span class="music-provider-glyph">${provider.shortName}</span><strong>${provider.name}</strong><small data-runtime-label="${provider.id}"></small>
            </button>`).join("")}</div>
        </article>
        <article class="music-feature-card music-signal-card">
          <div class="music-card-kicker"><span>WORLD SIGNAL BUS</span><i>Live</i></div>
          <h3>Every beat moves the world</h3><p>The local score and authorized provider controls pulse water, particles, specular light, grass, atmosphere and mascot reactions.</p>
          <div class="music-signal-orbit"><i></i><i></i><i></i><b>ROOM</b></div>
          <button data-music-action="ambient">Play local living score</button>
        </article>
        ${sourceRoutes}
      </section>`;
  }

  private providerMarkup(provider: ProviderDefinition): string {
    const runtime = this.providerRuntime[provider.id];
    const canAuthorize = provider.id === "spotify" || provider.id === "apple";
    const authAction = runtime.status === "connected"
      ? `<button data-music-action="disconnect" data-provider="${provider.id}">Disconnect session</button>`
      : canAuthorize
        ? `<button class="music-primary" data-music-action="connect" data-provider="${provider.id}">Connect ${provider.name}</button>`
        : `<button class="music-primary" data-music-action="provider-home" data-provider="${provider.id}">Open ${provider.name} ↗</button>`;
    const capability = provider.capability;
    return `
      <section class="music-provider-view" style="--provider-accent:${provider.accent}">
        <article class="music-provider-hero">
          <span class="music-provider-glyph">${provider.shortName}</span><div><small>SOURCE ADAPTER</small><h3>${provider.name}</h3><p>${runtime.detail}</p></div>
          <div class="music-provider-state" data-state="${runtime.status}"><i></i>${runtime.status.replaceAll("-", " ")}</div>
        </article>
        <div class="music-provider-layout">
          <article class="music-feature-card"><div class="music-card-kicker"><span>CURRENT DESTINATION</span><i>Per room</i></div><h3 data-mapping-label></h3><p data-mapping-context></p><label>Soundtrack name<input id="musicMappingLabel" maxlength="80" /></label><label>Provider URL<input id="musicMappingUrl" type="url" spellcheck="false" /></label><div class="music-card-actions"><button data-music-action="save-mapping">Save mapping</button><button data-music-action="open-mapping">Open now ↗</button></div></article>
          <article class="music-feature-card music-capability-card"><div class="music-card-kicker"><span>CAPABILITY RECORD</span><i>Reviewed ${capability.reviewed}</i></div><dl><div><dt>Public catalog</dt><dd>${capability.publicCatalog ? "Available" : "Unavailable"}</dd></div><div><dt>Authorized library</dt><dd>${capability.authenticatedLibrary ? "Feature-detected" : "Not activated"}</dd></div><div><dt>In-app playback</dt><dd>${capability.embeddedPlayback ? "Requires authorization" : "External handoff"}</dd></div><div><dt>Authorization</dt><dd>${capability.authMode}</dd></div><div><dt>Identity</dt><dd>${capability.accountIdentity}</dd></div><div><dt>Token boundary</dt><dd>${capability.tokenOwner}</dd></div><div><dt>Quota boundary</dt><dd>${capability.quotaOwner}</dd></div><div><dt>Fallback</dt><dd>${capability.fallback}</dd></div></dl>${authAction}</article>
        </div>
      </section>`;
  }

  private settingsMarkup(): string {
    const defaultRedirect = window.__TAURI_INTERNALS__ ? "http://127.0.0.1/callback" : `${location.origin}${location.pathname}`;
    return `
      <section class="music-settings-grid">
        <article class="music-feature-card"><div class="music-card-kicker"><span>SPOTIFY PKCE</span><i>No client secret</i></div><h3>Authorized Spotify session</h3><p>Use your Spotify dashboard Client ID and an allowlisted redirect URI. Tokens remain in this window session and never enter theme packages or exports.</p><label>Client ID<input id="spotifyClientId" autocomplete="off" spellcheck="false" /></label><label>Redirect URI<input id="spotifyRedirectUri" type="url" spellcheck="false" value="${defaultRedirect}" /></label><div class="music-card-actions"><button data-music-action="save-credentials">Keep for this session</button><button class="music-primary" data-music-action="connect" data-provider="spotify">Authorize Spotify</button></div></article>
        <article class="music-feature-card"><div class="music-card-kicker"><span>APPLE MUSICKIT</span><i>Managed user token</i></div><h3>Authorized Apple Music session</h3><p>Paste a server-issued MusicKit developer token. The signing private key must stay on your protected server; MusicKit manages the user authorization token.</p><label>Developer token (session only)<input id="appleDeveloperToken" type="password" autocomplete="off" spellcheck="false" /></label><div class="music-card-actions"><button data-music-action="save-credentials">Keep for this session</button><button class="music-primary" data-music-action="connect" data-provider="apple">Authorize Apple Music</button></div></article>
        <article class="music-feature-card music-security-boundary"><div class="music-card-kicker"><span>CREDENTIAL BOUNDARY</span><i>Fail closed</i></div><h3>No credentials in projects</h3><p>Connection material is session-only. Theme mappings persist separately and survive provider failures, expired authorization and restarts.</p><ul><li>No client secret in browser code</li><li>No signing private key in the app</li><li>No token in exported worlds</li><li>Provider failures stay isolated</li></ul></article>
        <article class="music-feature-card"><div class="music-card-kicker"><span>FALLBACK</span><i>Always available</i></div><h3>External provider handoff</h3><p>All six services remain useful without credentials: room mappings, searches and assigned soundtrack links open in the real provider.</p><div class="music-provider-cards compact">${PROVIDERS.map((provider) => `<button data-music-action="provider-home" data-provider="${provider.id}" style="--provider-accent:${provider.accent}"><span class="music-provider-glyph">${provider.shortName}</span><strong>${provider.name}</strong></button>`).join("")}</div></article>
      </section>`;
  }

  private populateDynamicFields(): void {
    const context = this.context();
    const theme = themeById(context.theme);
    const mapping = this.mappingFor(context.theme, context.district);
    const provider = providerById(mapping.provider);
    this.root.querySelectorAll<HTMLElement>("[data-mapping-label]").forEach((element) => { element.textContent = mapping.label; });
    this.root.querySelectorAll<HTMLElement>("[data-mapping-context]").forEach((element) => { element.textContent = `${theme.name} · ${context.district} · ${provider.name}`; });
    this.root.querySelectorAll<HTMLElement>("[data-mapping-health]").forEach((element) => {
      element.textContent = mapping.url ? mapping.status.replaceAll("_", " ") : "UNASSIGNED";
      element.dataset.state = mapping.url ? "mapped" : "unassigned";
    });
    const label = this.root.querySelector<HTMLInputElement>("#musicMappingLabel");
    const url = this.root.querySelector<HTMLInputElement>("#musicMappingUrl");
    if (label) label.value = mapping.label;
    if (url) url.value = mapping.url;
    const spotifyClient = this.root.querySelector<HTMLInputElement>("#spotifyClientId");
    const spotifyRedirect = this.root.querySelector<HTMLInputElement>("#spotifyRedirectUri");
    const appleToken = this.root.querySelector<HTMLInputElement>("#appleDeveloperToken");
    if (spotifyClient) spotifyClient.value = sessionStorage.getItem(SPOTIFY_CLIENT_KEY) ?? "";
    if (spotifyRedirect) spotifyRedirect.value = sessionStorage.getItem(SPOTIFY_REDIRECT_KEY) ?? (window.__TAURI_INTERNALS__ ? "http://127.0.0.1/callback" : `${location.origin}${location.pathname}`);
    if (appleToken) appleToken.value = sessionStorage.getItem(APPLE_TOKEN_KEY) ?? "";
    for (const definition of PROVIDERS) {
      const runtimeLabel = this.root.querySelector<HTMLElement>(`[data-runtime-label="${definition.id}"]`);
      if (runtimeLabel) runtimeLabel.textContent = this.providerRuntime[definition.id].status.replaceAll("-", " ");
    }
  }

  private saveMappingFromForm(): void {
    const context = this.context();
    const current = this.mappingFor(context.theme, context.district);
    const label = this.root.querySelector<HTMLInputElement>("#musicMappingLabel")?.value.trim() ?? "";
    const url = this.root.querySelector<HTMLInputElement>("#musicMappingUrl")?.value.trim() ?? "";
    if (!label) throw new Error("Give this room soundtrack a name before saving.");
    const valid = this.validateProviderUrl(url, current.provider);
    const mapping = { ...current, label, url: valid.toString(), status: "USER_ASSIGNED", updatedAt: new Date().toISOString() };
    this.state.mappings[this.contextKey(context.theme, context.district)] = mapping;
    this.persist();
    void this.persistNativeMapping(context, mapping);
    this.setStatus(`${label} is now assigned to ${context.district}.`, "success");
    this.render();
    this.worldPulse("mapping-saved", 1.4);
  }

  private useSourceRoute(routeId?: string): void {
    const context = this.context();
    const route = themeById(context.theme).musicRoutes.find((candidate) => candidate.playlist_id === routeId);
    if (!route) throw new Error("That curator route is not available for this artist world.");
    const valid = this.validateProviderUrl(route.open_in_spotify, "spotify");
    const mapping: SoundtrackMapping = {
      provider: "spotify",
      url: valid.toString(),
      label: route.playlist,
      status: route.approval_status,
      sourceId: route.playlist_id,
      updatedAt: new Date().toISOString(),
    };
    this.state.mappings[this.contextKey(context.theme, context.district)] = mapping;
    this.persist();
    void this.persistNativeMapping(context, mapping);
    this.setStatus(`${route.playlist} is routed to ${context.district} with status ${route.approval_status}.`, "success");
    this.render();
    this.worldPulse("curator-route-assigned", 1.5);
  }

  private saveCredentialsFromForm(): void {
    const clientId = this.root.querySelector<HTMLInputElement>("#spotifyClientId")?.value.trim();
    const redirect = this.root.querySelector<HTMLInputElement>("#spotifyRedirectUri")?.value.trim();
    const appleToken = this.root.querySelector<HTMLInputElement>("#appleDeveloperToken")?.value.trim();
    if (clientId !== undefined) clientId ? sessionStorage.setItem(SPOTIFY_CLIENT_KEY, clientId) : sessionStorage.removeItem(SPOTIFY_CLIENT_KEY);
    if (redirect) sessionStorage.setItem(SPOTIFY_REDIRECT_KEY, new URL(redirect).toString());
    if (appleToken !== undefined) appleToken ? sessionStorage.setItem(APPLE_TOKEN_KEY, appleToken) : sessionStorage.removeItem(APPLE_TOKEN_KEY);
    this.syncProviderRuntime();
    this.setStatus("Provider configuration is held for this session only.", "success");
    this.render();
  }

  private validateProviderUrl(value: string, providerId: ProviderId): URL {
    const url = new URL(value);
    const provider = providerById(providerId);
    if (url.protocol !== "https:" || !provider.allowedHosts.includes(url.hostname)) {
      throw new Error(`Use an https://${provider.allowedHosts[0]} address for ${provider.name}.`);
    }
    return url;
  }

  private async openExternal(url: string): Promise<void> {
    if (window.__TAURI_INTERNALS__) {
      await openNativeUrl(url);
      return;
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) throw new Error("The browser blocked the provider window. Allow pop-ups for Feature Foundry and try again.");
  }

  private async openMapping(): Promise<void> {
    const context = this.context();
    const mapping = this.mappingFor(context.theme, context.district);
    if (!mapping.url) throw new Error("Assign a real provider URL to this room before opening it.");
    await this.openExternal(this.validateProviderUrl(mapping.url, mapping.provider).toString());
    this.setStatus(`${mapping.label} opened in ${providerById(mapping.provider).name}.`, "success");
    this.worldPulse("provider-handoff", 1.1);
  }

  private async openProviderHome(providerValue?: string): Promise<void> {
    if (!providerValue || !isProviderId(providerValue)) throw new Error("Provider route is unavailable.");
    await this.openExternal(providerById(providerValue).homeUrl);
    this.setStatus(`${providerById(providerValue).name} opened.`, "success");
  }

  private async search(): Promise<void> {
    const query = this.root.querySelector<HTMLInputElement>("#musicHubSearch")?.value.trim() ?? "";
    if (!query) throw new Error("Enter an artist, album, playlist or mood to search.");
    const mapping = this.mappingFor(this.context().theme, this.context().district);
    const provider = providerById(mapping.provider);
    await this.openExternal(provider.searchUrl(query));
    this.setStatus(`Searching ${provider.name} for “${query}”.`, "success");
  }

  private async connectProvider(providerValue?: string): Promise<void> {
    if (providerValue === "spotify") await this.beginSpotifyAuthorization();
    else if (providerValue === "apple") await this.authorizeAppleMusic();
    else throw new Error("This adapter currently guarantees real external handoff; authenticated controls are not advertised.");
  }

  private async disconnectProvider(providerValue?: string): Promise<void> {
    if (providerValue === "spotify") {
      this.spotifySession = null;
      sessionStorage.removeItem(SPOTIFY_SESSION_KEY);
      this.providerRuntime.spotify = { status: "config-required", detail: "Spotify session disconnected; room mappings are preserved." };
    } else if (providerValue === "apple") {
      await this.appleMusic?.unauthorize?.();
      this.appleMusic = null;
      this.providerRuntime.apple = { status: "config-required", detail: "Apple Music session disconnected; room mappings are preserved." };
    }
    this.setStatus("Provider session disconnected. Soundtrack mappings were not changed.", "success");
    this.render();
  }

  private async beginSpotifyAuthorization(): Promise<void> {
    this.saveCredentialsFromForm();
    const clientId = sessionStorage.getItem(SPOTIFY_CLIENT_KEY);
    if (!clientId) {
      this.setRoute("settings");
      throw new Error("Add your Spotify Client ID before starting PKCE authorization.");
    }
    const verifier = randomUrlSafe(64);
    const challenge = await sha256UrlSafe(verifier);
    const state = randomUrlSafe(24);
    const native = Boolean(window.__TAURI_INTERNALS__);
    const redirectUri = native
      ? await invoke<string>("start_spotify_callback")
      : sessionStorage.getItem(SPOTIFY_REDIRECT_KEY) ?? `${location.origin}${location.pathname}`;
    sessionStorage.setItem(SPOTIFY_VERIFIER_KEY, verifier);
    sessionStorage.setItem(SPOTIFY_STATE_KEY, state);
    sessionStorage.setItem(SPOTIFY_REDIRECT_KEY, redirectUri);
    const parameters = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      scope: "user-read-private playlist-read-private playlist-read-collaborative user-read-playback-state user-modify-playback-state streaming",
    });
    this.providerRuntime.spotify = { status: "authorizing", detail: "Spotify authorization is in progress." };
    const authorizationUrl = `https://accounts.spotify.com/authorize?${parameters.toString()}`;
    if (native) {
      const unlisten = await once<SpotifyCallbackPayload>("spotify-oauth-callback", (event) => {
        const callback = new URLSearchParams();
        if (event.payload.code) callback.set("code", event.payload.code);
        if (event.payload.state) callback.set("state", event.payload.state);
        if (event.payload.error) callback.set("error", event.payload.error);
        sessionStorage.setItem(SPOTIFY_REDIRECT_KEY, event.payload.redirectUri);
        void this.completeSpotifyCallback(callback, false).catch((error) => this.setStatus(error instanceof Error ? error.message : String(error), "error"));
      });
      try {
        this.setStatus("Spotify authorization opened in your browser. This app is waiting on its secure loopback callback…", "neutral");
        await openNativeUrl(authorizationUrl);
      } catch (error) {
        unlisten();
        throw error;
      }
    } else {
      this.setStatus("Opening Spotify authorization in this window…", "neutral");
      location.assign(authorizationUrl);
    }
  }

  private async completeSpotifyCallback(parameters = new URLSearchParams(location.search), cleanBrowserQuery = true): Promise<void> {
    const code = parameters.get("code");
    const returnedState = parameters.get("state");
    const error = parameters.get("error");
    if (!code && !error) return;
    const expectedState = sessionStorage.getItem(SPOTIFY_STATE_KEY);
    if (error) {
      this.providerRuntime.spotify = { status: "error", detail: `Spotify authorization returned ${error}.` };
      this.setStatus(`Spotify authorization returned ${error}.`, "error");
      if (cleanBrowserQuery) this.cleanAuthorizationQuery();
      this.render();
      return;
    }
    if (!expectedState || returnedState !== expectedState) {
      this.providerRuntime.spotify = { status: "error", detail: "Spotify authorization state did not match." };
      this.setStatus("Spotify authorization was rejected because its state did not match.", "error");
      if (cleanBrowserQuery) this.cleanAuthorizationQuery();
      this.render();
      return;
    }
    const verifier = sessionStorage.getItem(SPOTIFY_VERIFIER_KEY);
    const clientId = sessionStorage.getItem(SPOTIFY_CLIENT_KEY);
    const redirectUri = sessionStorage.getItem(SPOTIFY_REDIRECT_KEY);
    if (!verifier || !clientId || !redirectUri) throw new Error("Spotify PKCE session material is missing; restart authorization.");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, grant_type: "authorization_code", code: code!, redirect_uri: redirectUri, code_verifier: verifier }),
    });
    if (!response.ok) throw new Error(`Spotify token exchange failed (${response.status}).`);
    const payload = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
    this.spotifySession = {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      expiresAt: Date.now() + payload.expires_in * 1000 - 30_000,
      refreshExpiresAt: payload.refresh_token ? Date.now() + 183 * 24 * 60 * 60 * 1000 : undefined,
    };
    sessionStorage.setItem(SPOTIFY_SESSION_KEY, JSON.stringify(this.spotifySession));
    sessionStorage.removeItem(SPOTIFY_VERIFIER_KEY);
    sessionStorage.removeItem(SPOTIFY_STATE_KEY);
    if (cleanBrowserQuery) this.cleanAuthorizationQuery();
    await this.verifySpotifyIdentity();
    this.state.route = "spotify";
    this.open("spotify");
    this.setStatus("Spotify authorization and account identity verified.", "success");
  }

  private cleanAuthorizationQuery(): void {
    const clean = new URL(location.href);
    ["code", "state", "error", "error_description"].forEach((key) => clean.searchParams.delete(key));
    history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);
  }

  private async refreshSpotifyAccess(): Promise<void> {
    if (!this.spotifySession?.refreshToken) throw new Error("Spotify authorization must be renewed.");
    if (this.spotifySession.refreshExpiresAt && Date.now() >= this.spotifySession.refreshExpiresAt) {
      this.providerRuntime.spotify = { status: "reauthorization-required", detail: "The Spotify refresh authorization reached its terminal lifetime." };
      throw new Error("Spotify requires authorization again. Your room mappings are preserved.");
    }
    const clientId = sessionStorage.getItem(SPOTIFY_CLIENT_KEY);
    if (!clientId) throw new Error("Spotify Client ID is missing from this session.");
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, grant_type: "refresh_token", refresh_token: this.spotifySession.refreshToken }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      if (payload.error === "invalid_grant") {
        this.providerRuntime.spotify = { status: "reauthorization-required", detail: "Spotify refresh authorization expired and must be renewed." };
        throw new Error("Spotify requires authorization again. Your room mappings are preserved.");
      }
      throw new Error(`Spotify access renewal failed (${response.status}).`);
    }
    const payload = await response.json() as { access_token: string; refresh_token?: string; expires_in: number };
    this.spotifySession = { ...this.spotifySession, accessToken: payload.access_token, refreshToken: payload.refresh_token ?? this.spotifySession.refreshToken, expiresAt: Date.now() + payload.expires_in * 1000 - 30_000 };
    sessionStorage.setItem(SPOTIFY_SESSION_KEY, JSON.stringify(this.spotifySession));
  }

  private async spotifyRequest(path: string, init: RequestInit = {}): Promise<Response> {
    if (!this.spotifySession) throw new Error("Connect Spotify before using authorized controls.");
    if (Date.now() >= this.spotifySession.expiresAt) await this.refreshSpotifyAccess();
    const response = await fetch(`https://api.spotify.com/v1${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.spotifySession.accessToken}` } });
    if (response.status === 429) {
      const payload = await response.clone().json().catch(() => ({})) as { reason?: string };
      if (payload.reason === "QUOTA_EXCEEDED") {
        this.providerRuntime.spotify = { status: "quota-exhausted", detail: "Spotify Development Mode quota is exhausted for the developer account." };
        throw new Error("Spotify developer-account quota is exhausted. External handoff remains available.");
      }
      this.providerRuntime.spotify = { status: "rate-limited", detail: "Spotify asked this session to wait before retrying." };
      throw new Error(`Spotify rate limit reached. Retry after ${response.headers.get("Retry-After") ?? "the requested interval"}.`);
    }
    if (response.status === 401) {
      await this.refreshSpotifyAccess();
      return fetch(`https://api.spotify.com/v1${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${this.spotifySession!.accessToken}` } });
    }
    return response;
  }

  private async verifySpotifyIdentity(): Promise<void> {
    const response = await this.spotifyRequest("/me");
    if (!response.ok) throw new Error(`Spotify profile verification failed (${response.status}).`);
    const profile = await response.json() as { account_id?: string; id?: string; display_name?: string };
    if (!this.spotifySession) return;
    this.spotifySession.accountId = profile.account_id ?? profile.id;
    this.spotifySession.displayName = profile.display_name ?? "Spotify listener";
    sessionStorage.setItem(SPOTIFY_SESSION_KEY, JSON.stringify(this.spotifySession));
    this.providerRuntime.spotify = { status: "connected", detail: `Connected as ${this.spotifySession.displayName}.` };
  }

  private async loadAppleMusicScript(): Promise<void> {
    if (window.MusicKit) return;
    if (this.appleScriptPromise) return this.appleScriptPromise;
    this.appleScriptPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("MusicKit could not be loaded from Apple."));
      document.head.append(script);
    });
    return this.appleScriptPromise;
  }

  private async authorizeAppleMusic(): Promise<void> {
    this.saveCredentialsFromForm();
    const developerToken = sessionStorage.getItem(APPLE_TOKEN_KEY);
    if (!developerToken) {
      this.setRoute("settings");
      throw new Error("Add a server-issued MusicKit developer token before authorization.");
    }
    this.providerRuntime.apple = { status: "authorizing", detail: "Loading MusicKit and requesting user authorization." };
    this.render();
    await this.loadAppleMusicScript();
    if (!window.MusicKit) throw new Error("MusicKit loaded without exposing its runtime.");
    this.appleMusic = window.MusicKit.configure({ developerToken, app: { name: "Feature Foundry", build: "24.0.0" } });
    await this.appleMusic.authorize();
    this.providerRuntime.apple = { status: "connected", detail: "MusicKit user authorization is active for this session." };
    this.state.route = "apple";
    this.setStatus("Apple Music user authorization is active.", "success");
    this.render();
  }

  private async remotePlay(): Promise<void> {
    const context = this.context();
    const mapping = this.mappingFor(context.theme, context.district);
    if (mapping.provider === "spotify" && this.providerRuntime.spotify.status === "connected") {
      const contextUri = spotifyContextUri(mapping.url);
      const response = await this.spotifyRequest("/me/player/play", { method: "PUT", headers: { "Content-Type": "application/json" }, body: contextUri ? JSON.stringify({ context_uri: contextUri }) : undefined });
      if (!response.ok) throw new Error(`Spotify playback did not start (${response.status}). Choose an active Spotify device or open the provider.`);
      this.setStatus(`${mapping.label} is playing through Spotify.`, "success");
      this.worldPulse("spotify-play", 2);
      return;
    }
    if (mapping.provider === "apple" && this.providerRuntime.apple.status === "connected" && this.appleMusic) {
      await this.appleMusic.setQueue({ url: mapping.url });
      await this.appleMusic.play();
      this.setStatus(`${mapping.label} is playing through Apple Music.`, "success");
      this.worldPulse("apple-play", 2);
      return;
    }
    await this.openMapping();
  }

  private async remoteNext(): Promise<void> {
    const mapping = this.mappingFor(this.context().theme, this.context().district);
    if (mapping.provider === "spotify" && this.providerRuntime.spotify.status === "connected") {
      const response = await this.spotifyRequest("/me/player/next", { method: "POST" });
      if (!response.ok) throw new Error(`Spotify could not skip (${response.status}).`);
      this.setStatus("Spotify advanced to the next item.", "success");
      this.worldPulse("spotify-next", 1.5);
      return;
    }
    if (mapping.provider === "apple" && this.providerRuntime.apple.status === "connected" && this.appleMusic?.skipToNextItem) {
      await this.appleMusic.skipToNextItem();
      this.setStatus("Apple Music advanced to the next item.", "success");
      this.worldPulse("apple-next", 1.5);
      return;
    }
    throw new Error(`Connect ${providerById(mapping.provider).name} to use in-app queue controls; external handoff remains available.`);
  }

  private syncCanonicalHud(mapping: SoundtrackMapping, provider: ProviderDefinition, district: string): void {
    const playlist = document.querySelector<HTMLElement>("#playlistName");
    const track = document.querySelector<HTMLElement>("#trackName");
    const artist = document.querySelector<HTMLElement>("#trackArtist");
    const orb = document.querySelector<HTMLElement>(".provider-orb");
    if (playlist) playlist.textContent = mapping.label;
    if (track) track.textContent = mapping.label;
    if (artist) artist.textContent = `${provider.name} · ${district}`;
    if (orb) { orb.textContent = provider.shortName; orb.style.setProperty("--provider-accent", provider.accent); }
  }

  private worldPulse(reason: string, intensity = 0.9): void {
    window.dispatchEvent(new CustomEvent("ff:music-signal", { detail: { reason, intensity, context: this.context() } }));
  }

  private setStatus(message: string, tone: "neutral" | "success" | "warning" | "error"): void {
    this.statusMessage = message;
    this.statusTone = tone;
    this.renderStatus();
  }

  private renderStatus(): void {
    const status = this.root.querySelector<HTMLElement>("[data-music-status]");
    const copy = status?.querySelector("p");
    if (status) status.dataset.tone = this.statusTone;
    if (copy) copy.textContent = this.statusMessage;
  }

  diagnostics(): MusicHubDiagnostics {
    const context = this.context();
    return {
      open: this.root.classList.contains("open"),
      route: this.state.route,
      theme: context.theme,
      district: context.district,
      mapping: { ...this.mappingFor(context.theme, context.district) },
      providers: structuredClone(this.providerRuntime),
      credentialStorage: "session-only",
    };
  }

  dispose(): void {
    this.mutationObserver.disconnect();
    this.root.remove();
  }
}
