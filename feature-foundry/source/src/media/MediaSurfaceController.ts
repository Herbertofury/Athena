type MediaKind = "video" | "youtube" | "idle";

type MediaState = {
  kind: MediaKind;
  source: string;
  label: string;
  playing: boolean;
};

function youtubeEmbed(value: URL): string | null {
  let id = "";
  if (value.hostname === "youtu.be") id = value.pathname.split("/").filter(Boolean)[0] ?? "";
  if (["youtube.com", "www.youtube.com", "music.youtube.com"].includes(value.hostname)) {
    id = value.searchParams.get("v") ?? (value.pathname.startsWith("/shorts/") ? value.pathname.split("/")[2] ?? "" : "");
  }
  return /^[a-zA-Z0-9_-]{6,20}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
}

export class MediaSurfaceController {
  private readonly root: HTMLDivElement;
  private readonly input: HTMLInputElement;
  private readonly tv: HTMLElement | null;
  private objectUrl: string | null = null;
  private idleFrame = 0;
  private lastIdlePaint = 0;
  private state: MediaState = { kind: "idle", source: "", label: "No media loaded", playing: false };

  constructor() {
    this.tv = document.querySelector<HTMLElement>("#environmentTv");
    this.root = document.createElement("div");
    this.root.id = "mediaSurfaceStudio";
    this.root.className = "media-surface-overlay";
    this.root.hidden = true;
    this.root.innerHTML = `
      <button class="media-surface-scrim" data-media-action="close" aria-label="Close media surface studio"></button>
      <section class="media-surface-panel" role="dialog" aria-modal="true" aria-labelledby="mediaSurfaceTitle">
        <header><div><small>OBJECT ECOLOGY · SEMANTIC MEDIA SURFACE</small><h2 id="mediaSurfaceTitle">Living Screen Studio</h2><p>Route a local video, direct media URL, or YouTube video into every selected TV surface.</p></div><button data-media-action="close" aria-label="Close">×</button></header>
        <div class="media-surface-layout">
          <div class="media-preview-frame" data-media-preview><div class="media-idle"><i></i><strong>MEDIA SURFACE READY</strong><span>Select a real source below</span></div></div>
          <aside>
            <div class="media-source-status"><i></i><div><small>CURRENT SOURCE</small><strong data-media-label>No media loaded</strong><span data-media-kind>Idle procedural display</span></div></div>
            <label>Direct video or YouTube URL<input id="mediaSurfaceUrl" type="url" spellcheck="false" placeholder="https://…" /></label>
            <div class="media-actions"><button class="media-primary" data-media-action="load-url">Load URL</button><button data-media-action="browse">Choose local video</button></div>
            <div class="media-actions"><button data-media-action="toggle">Play / pause</button><button data-media-action="clear">Restore procedural screen</button></div>
            <p class="media-source-message" data-media-message aria-live="polite">Ready for a local file, direct HTTPS video, or YouTube URL.</p>
            <dl><div><dt>Surface</dt><dd>Room TV + inspector preview</dd></div><div><dt>Playback</dt><dd>Native HTML media / privacy-enhanced embed</dd></div><div><dt>Persistence</dt><dd>Session only for local files</dd></div><div><dt>Object contract</dt><dd>toggle-screen · play-video · glitch-channel</dd></div></dl>
          </aside>
        </div>
      </section>`;
    document.body.append(this.root);

    this.input = document.createElement("input");
    this.input.type = "file";
    this.input.accept = "video/*,.mp4,.webm,.mov,.m4v,.ogv";
    this.input.hidden = true;
    this.input.id = "mediaSurfaceFileInput";
    document.body.append(this.input);

    this.bind();
    this.ensureTvLauncher();
    this.idleFrame = requestAnimationFrame((now) => this.paintIdleChannel(now));
  }

  private bind(): void {
    this.root.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-media-action]") : null;
      const action = target?.dataset.mediaAction;
      if (!action) return;
      if (action === "close") this.close();
      else if (action === "browse") this.input.click();
      else if (action === "load-url") this.attempt(() => this.loadFromInput());
      else if (action === "toggle") this.attempt(() => this.toggle());
      else if (action === "clear") this.clear();
    });
    this.input.addEventListener("change", () => {
      const file = this.input.files?.[0];
      if (file) this.attempt(() => this.loadFile(file));
      this.input.value = "";
    });
    window.addEventListener("ff:open-media-surface", () => this.open());
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !this.root.hidden) this.close(); });
  }

  private ensureTvLauncher(): void {
    if (!this.tv) return;
    this.tv.setAttribute("role", "button");
    this.tv.setAttribute("tabindex", "0");
    this.tv.setAttribute("aria-label", "Open the Living Screen Studio");
    this.tv.title = "Click to route real video to this TV";
    this.tv.addEventListener("click", () => this.open());
    this.tv.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.open(); }
    });
  }

  open(): void {
    this.root.hidden = false;
    requestAnimationFrame(() => this.root.classList.add("open"));
    document.body.dataset.mediaStudio = "open";
    this.sync();
    this.root.querySelector<HTMLInputElement>("#mediaSurfaceUrl")?.focus({ preventScroll: true });
  }

  close(): void {
    this.root.classList.remove("open");
    delete document.body.dataset.mediaStudio;
    window.setTimeout(() => { if (!this.root.classList.contains("open")) this.root.hidden = true; }, 240);
  }

  private loadFromInput(): void {
    const value = this.root.querySelector<HTMLInputElement>("#mediaSurfaceUrl")?.value.trim() ?? "";
    if (!value) throw new Error("Enter a direct media or YouTube URL.");
    const url = new URL(value);
    if (url.protocol !== "https:") throw new Error("Remote media must use HTTPS.");
    const embed = youtubeEmbed(url);
    this.releaseObjectUrl();
    this.state = embed
      ? { kind: "youtube", source: embed, label: "YouTube room video", playing: true }
      : { kind: "video", source: url.toString(), label: decodeURIComponent(url.pathname.split("/").pop() || "Remote video"), playing: true };
    this.renderPlayers();
    this.setMessage(`${this.state.label} is playing on the room TV and inspector surface.`, "success");
    this.signal("media-url-loaded");
  }

  private loadFile(file: File): void {
    if (!file.type.startsWith("video/")) throw new Error(`${file.name} is not a supported video file.`);
    this.releaseObjectUrl();
    this.objectUrl = URL.createObjectURL(file);
    this.state = { kind: "video", source: this.objectUrl, label: file.name, playing: true };
    this.renderPlayers();
    this.setMessage(`${file.name} is playing from this session.`, "success");
    this.signal("local-video-loaded");
  }

  private renderPlayer(className: string): HTMLElement {
    if (this.state.kind === "youtube") {
      const frame = document.createElement("iframe");
      frame.className = className;
      frame.src = this.state.source;
      frame.title = this.state.label;
      frame.allow = "autoplay; encrypted-media; picture-in-picture";
      frame.allowFullscreen = true;
      return frame;
    }
    const video = document.createElement("video");
    video.className = className;
    video.src = this.state.source;
    video.controls = className.includes("preview");
    video.loop = true;
    video.muted = className.includes("tv");
    video.playsInline = true;
    video.autoplay = true;
    void video.play().catch(() => { this.state.playing = false; this.sync(); });
    return video;
  }

  private renderPlayers(): void {
    const preview = this.root.querySelector<HTMLElement>("[data-media-preview]");
    if (preview) { preview.replaceChildren(this.renderPlayer("media-preview-player")); }
    if (this.tv) {
      this.tv.querySelector(".premium-tv-media-layer")?.remove();
      const layer = document.createElement("div");
      layer.className = "premium-tv-media-layer";
      layer.append(this.renderPlayer("media-tv-player"));
      this.tv.append(layer);
      this.tv.dataset.mediaActive = "true";
    }
    this.sync();
  }

  private toggle(): void {
    const videos = document.querySelectorAll<HTMLVideoElement>(".media-preview-player, .media-tv-player");
    if (!videos.length && this.state.kind === "youtube") { this.open(); return; }
    const shouldPlay = Array.from(videos).some((video) => video.paused);
    videos.forEach((video) => { if (shouldPlay) void video.play(); else video.pause(); });
    this.state.playing = shouldPlay;
    this.sync();
    this.signal(shouldPlay ? "media-play" : "media-pause");
  }

  clear(): void {
    this.releaseObjectUrl();
    this.state = { kind: "idle", source: "", label: "No media loaded", playing: false };
    const preview = this.root.querySelector<HTMLElement>("[data-media-preview]");
    if (preview) preview.innerHTML = `<div class="media-idle"><i></i><strong>MEDIA SURFACE READY</strong><span>Select a real source below</span></div>`;
    this.tv?.querySelector(".premium-tv-media-layer")?.remove();
    if (this.tv) delete this.tv.dataset.mediaActive;
    this.sync();
    this.setMessage("The room TV is back on its procedural living-world channel.", "success");
    this.signal("media-cleared");
  }

  private attempt(operation: () => void): void {
    try { operation(); }
    catch (error) { this.setMessage(error instanceof Error ? error.message : "The media source could not be loaded.", "error"); }
  }

  private setMessage(message: string, state: "ready" | "success" | "error"): void {
    const element = this.root.querySelector<HTMLElement>("[data-media-message]");
    if (!element) return;
    element.textContent = message;
    element.dataset.state = state;
  }

  private sync(): void {
    const label = this.root.querySelector<HTMLElement>("[data-media-label]");
    const kind = this.root.querySelector<HTMLElement>("[data-media-kind]");
    if (label) label.textContent = this.state.label;
    if (kind) kind.textContent = this.state.kind === "idle" ? "Idle procedural display" : `${this.state.kind === "youtube" ? "YouTube embed" : "Native video"} · ${this.state.playing ? "playing" : "paused"}`;
  }

  private releaseObjectUrl(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
  }

  private paintIdleChannel(now: number): void {
    this.idleFrame = requestAnimationFrame((next) => this.paintIdleChannel(next));
    if (this.state.kind !== "idle" || now - this.lastIdlePaint < 50) return;
    this.lastIdlePaint = now;
    const canvas = this.tv?.querySelector<HTMLCanvasElement>("#tvCanvas");
    if (!canvas) return;
    const width = Math.max(220, Math.round(canvas.clientWidth * Math.min(2, devicePixelRatio)));
    const height = Math.max(120, Math.round(canvas.clientHeight * Math.min(2, devicePixelRatio)));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    const context = canvas.getContext("2d");
    if (!context) return;
    const phase = now * 0.00022;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#062c35");
    gradient.addColorStop(.52, "#0c5f5c");
    gradient.addColorStop(1, "#06131e");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    const glowX = width * (.5 + Math.sin(phase * 4) * .24);
    const glow = context.createRadialGradient(glowX, height * .45, 4, glowX, height * .45, width * .48);
    glow.addColorStop(0, "rgba(182,255,198,.65)");
    glow.addColorStop(.3, "rgba(72,218,215,.2)");
    glow.addColorStop(1, "rgba(3,20,31,0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(187,255,235,.17)";
    context.lineWidth = Math.max(1, devicePixelRatio);
    for (let row = 0; row < 8; row += 1) {
      const y = height * (.22 + row * .1) + Math.sin(phase * 9 + row) * 3;
      context.beginPath();
      context.moveTo(0, y);
      for (let x = 0; x <= width; x += 12) context.lineTo(x, y + Math.sin(x * .032 + phase * 13 + row) * (3 + row * .25));
      context.stroke();
    }
    context.fillStyle = "rgba(238,255,232,.88)";
    context.font = `700 ${Math.max(10, width * .042)}px system-ui`;
    context.textAlign = "center";
    context.fillText("LIVING SIGNAL", width / 2, height * .48);
    context.fillStyle = "rgba(221,255,243,.56)";
    context.font = `500 ${Math.max(7, width * .025)}px system-ui`;
    context.fillText("CLICK TO ROUTE MEDIA", width / 2, height * .61);
    context.fillStyle = "rgba(255,255,255,.045)";
    for (let y = 0; y < height; y += 4) context.fillRect(0, y, width, 1);
  }

  private signal(reason: string): void {
    window.dispatchEvent(new CustomEvent("ff:media-signal", { detail: { reason, ...this.state } }));
  }

  diagnostics(): MediaState {
    return { ...this.state, source: this.objectUrl ? "session-object-url" : this.state.source };
  }

  dispose(): void {
    cancelAnimationFrame(this.idleFrame);
    this.releaseObjectUrl();
    this.root.remove();
    this.input.remove();
  }
}
