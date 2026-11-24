import { ARTIST_WORLD_CATALOG, DURABLE_THEME_CATALOG, THEME_CATALOG, themeById, type PremiumTheme } from "./themeCatalog";

const STORE_KEY = "ff.premium-theme.v1";

function html(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function readStoredTheme(): string {
  try { return localStorage.getItem(STORE_KEY) ?? "frutiger-aero"; } catch { return "frutiger-aero"; }
}

export class ThemeDirector {
  private readonly root: HTMLDivElement;
  private selectedId = readStoredTheme();
  private filter = "";
  private lineage: "all" | "v33-runtime" | "artist-worlds-v4.0.1" = "all";

  constructor() {
    this.root = document.createElement("div");
    this.root.id = "themeAtlasStudio";
    this.root.className = "theme-atlas-overlay";
    this.root.hidden = true;
    this.root.innerHTML = `
      <button class="theme-atlas-scrim" data-theme-atlas-action="close" aria-label="Close Theme Atlas"></button>
      <section class="theme-atlas-panel" role="dialog" aria-modal="true" aria-labelledby="themeAtlasTitle">
        <header class="theme-atlas-header">
          <div><small>VERIFIED WORLD REGISTRY</small><h2 id="themeAtlasTitle">Theme Atlas</h2><p>V33 runtime worlds and v4.0.1 artist-world curation, kept in separate authority lanes.</p></div>
          <div class="theme-atlas-header-actions"><label><span>⌕</span><input type="search" data-theme-atlas-search placeholder="Search worlds, rooms, materials…" /></label><button data-theme-atlas-action="close" aria-label="Close">×</button></div>
        </header>
        <nav class="theme-atlas-tabs" aria-label="Theme catalog source"><button class="active" data-theme-lineage="all">All worlds <b>${THEME_CATALOG.length}</b></button><button data-theme-lineage="v33-runtime">Verified runtime <b>${DURABLE_THEME_CATALOG.length}</b></button><button data-theme-lineage="artist-worlds-v4.0.1">Artist worlds <b>${ARTIST_WORLD_CATALOG.length}</b></button></nav>
        <div class="theme-atlas-body"><div class="theme-atlas-grid" data-theme-atlas-grid></div><aside class="theme-atlas-inspector" data-theme-atlas-inspector></aside></div>
      </section>`;
    document.body.append(this.root);
    this.bind();
    this.installSelector();
    this.apply(themeById(this.selectedId).id, false);
    // The untouched V24 runtime runs its own delayed contract self-test. Reassert
    // the selected premium world after that test without changing V24 itself.
    window.setTimeout(() => this.apply(themeById(this.selectedId).id, false), 900);
  }

  private bind(): void {
    this.root.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-theme-atlas-action], [data-theme-id], [data-theme-lineage], [data-object-action]") : null;
      if (!target) return;
      if (target.dataset.themeId) { this.selectedId = target.dataset.themeId; this.render(); return; }
      if (target.dataset.themeLineage) {
        const value = target.dataset.themeLineage;
        if (value === "all" || value === "v33-runtime" || value === "artist-worlds-v4.0.1") this.lineage = value;
        this.render();
        return;
      }
      if (target.dataset.objectAction) { this.runObjectAction(target); return; }
      if (target.dataset.themeAtlasAction === "close") this.close();
      if (target.dataset.themeAtlasAction === "activate") this.apply(this.selectedId, true);
      if (target.dataset.themeAtlasAction === "music") window.dispatchEvent(new CustomEvent("ff:open-music-hub"));
    });
    this.root.querySelector<HTMLInputElement>("[data-theme-atlas-search]")?.addEventListener("input", (event) => {
      this.filter = event.target instanceof HTMLInputElement ? event.target.value : "";
      this.render();
    });
    document.querySelector("#editTheme")?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.open();
    }, { capture: true });
    window.addEventListener("ff:open-theme-atlas", () => this.open());
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !this.root.hidden) this.close(); });
  }

  private installSelector(): void {
    const select = document.querySelector<HTMLSelectElement>("#themeSelect");
    if (!select) return;
    select.innerHTML = `
      <optgroup label="Verified V33 worlds">${DURABLE_THEME_CATALOG.map((theme) => `<option value="${html(theme.id)}">${html(theme.name)}</option>`).join("")}</optgroup>
      <optgroup label="Favorite artist worlds v4.0.1">${ARTIST_WORLD_CATALOG.map((theme) => `<option value="${html(theme.id)}">${html(theme.name)}</option>`).join("")}</optgroup>`;
    select.addEventListener("change", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const id = event.target instanceof HTMLSelectElement ? event.target.value : "";
      this.apply(id, true);
    }, { capture: true });
  }

  open(): void {
    this.selectedId = document.body.dataset.premiumTheme ?? this.selectedId;
    this.root.hidden = false;
    this.render();
    requestAnimationFrame(() => this.root.classList.add("open"));
    document.body.dataset.themeAtlas = "open";
    this.root.querySelector<HTMLInputElement>("[data-theme-atlas-search]")?.focus({ preventScroll: true });
  }

  close(): void {
    this.root.classList.remove("open");
    delete document.body.dataset.themeAtlas;
    window.setTimeout(() => { if (!this.root.classList.contains("open")) this.root.hidden = true; }, 260);
  }

  private visibleThemes(): readonly PremiumTheme[] {
    const term = this.filter.trim().toLowerCase();
    return THEME_CATALOG.filter((theme) => {
      if (this.lineage !== "all" && theme.lineage !== this.lineage) return false;
      const corpus = `${theme.name} ${theme.description} ${theme.worldName} ${theme.materialLanguage} ${theme.rooms.join(" ")} ${theme.objects.map((object) => object.name).join(" ")}`.toLowerCase();
      return !term || corpus.includes(term);
    });
  }

  private render(): void {
    const visible = this.visibleThemes();
    if (!visible.some((theme) => theme.id === this.selectedId)) this.selectedId = visible[0]?.id ?? this.selectedId;
    const activeId = document.body.dataset.premiumTheme;
    const grid = this.root.querySelector<HTMLElement>("[data-theme-atlas-grid]");
    if (grid) grid.innerHTML = visible.map((theme) => `
      <button class="theme-atlas-card ${theme.id === this.selectedId ? "selected" : ""} ${theme.id === activeId ? "active" : ""}" data-theme-id="${html(theme.id)}" style="--c1:${theme.palette[0]};--c2:${theme.palette[1]};--c3:${theme.palette[2]};--c4:${theme.palette[3]}">
        <span class="theme-atlas-art"><i></i><i></i><i></i><b>${theme.lineage === "v33-runtime" ? "V33" : "ARTIST"}</b></span>
        <span class="theme-atlas-card-copy"><strong>${html(theme.name)}</strong><small>${html(theme.worldName)}</small><em>${theme.rooms.length} rooms · ${theme.objects.length} ecology objects</em></span>
      </button>`).join("") || `<div class="theme-atlas-empty">No worlds match this search.</div>`;
    this.root.querySelectorAll<HTMLElement>("[data-theme-lineage]").forEach((button) => button.classList.toggle("active", button.dataset.themeLineage === this.lineage));
    this.renderInspector(themeById(this.selectedId));
  }

  private renderInspector(theme: PremiumTheme): void {
    const inspector = this.root.querySelector<HTMLElement>("[data-theme-atlas-inspector]");
    if (!inspector) return;
    inspector.style.setProperty("--c1", theme.palette[0]);
    inspector.style.setProperty("--c2", theme.palette[1]);
    inspector.innerHTML = `
      <div class="theme-inspector-hero"><small>${theme.lineage === "v33-runtime" ? "VERIFIED V33 PACKAGE" : "CURATOR DATABASE v4.0.1"}</small><h3>${html(theme.name)}</h3><p>${html(theme.description)}</p><div>${theme.palette.map((color) => `<i style="background:${color}"></i>`).join("")}</div></div>
      <dl class="theme-inspector-facts"><div><dt>World</dt><dd>${html(theme.worldName)}</dd></div><div><dt>Material</dt><dd>${html(theme.materialLanguage)}</dd></div><div><dt>Motion</dt><dd>${html(theme.motion)}</dd></div><div><dt>Mascot</dt><dd>${html(theme.mascot)}</dd></div></dl>
      <section><div class="theme-inspector-section-head"><strong>Rooms + districts</strong><span>${theme.rooms.length}</span></div><div class="theme-inspector-chips">${theme.rooms.map((room) => `<span>${html(room)}</span>`).join("")}</div></section>
      <section><div class="theme-inspector-section-head"><strong>Weather system</strong><span>${theme.weather.length}</span></div><div class="theme-inspector-chips weather">${theme.weather.map((weather) => `<span>${html(weather)}</span>`).join("")}</div></section>
      <section><div class="theme-inspector-section-head"><strong>Object ecology</strong><span>${theme.objects.length}</span></div><div class="theme-object-list">${theme.objects.map((object) => {
        const screen = object.affordances.some((action) => action.includes("screen") || action.includes("video"));
        const music = object.affordances.some((action) => action.includes("music") || action.includes("note"));
        return `<button data-object-action="${screen ? "media" : music ? "music" : "play"}" data-object-id="${html(object.id)}"><span class="theme-object-glyph" data-shape="${html(object.shape)}"></span><span><strong>${html(object.name)}</strong><small>${html(object.material)} · ${html(object.affordances.join(" · "))}</small></span><i>${screen ? "VIDEO" : music ? "AUDIO" : "PLAY"}</i></button>`;
      }).join("")}</div></section>
      ${theme.musicRoutes.length ? `<section><div class="theme-inspector-section-head"><strong>Verified music routes</strong><span>${theme.musicRoutes.length}</span></div><button class="theme-inspector-music" data-theme-atlas-action="music">Open Music Hub to assign exact routes →</button></section>` : ""}
      <button class="theme-atlas-activate" data-theme-atlas-action="activate">Enter ${html(theme.name)}</button>`;
  }

  apply(id: string, notify: boolean): void {
    const theme = themeById(id);
    this.selectedId = theme.id;
    window.ffPrototype?.setTheme?.(theme.baseTheme, false);
    document.body.dataset.premiumTheme = theme.id;
    document.body.dataset.premiumLineage = theme.lineage;
    document.body.dataset.premiumMaterial = theme.materialLanguage;
    theme.palette.slice(0, 3).forEach((color, index) => document.documentElement.style.setProperty(index ? `--accent-${index + 1}` : "--accent", color));
    const select = document.querySelector<HTMLSelectElement>("#themeSelect");
    if (select) select.value = theme.id;
    this.setText("heroTheme", theme.name);
    this.setText("heroDescription", `${theme.description} Every work surface remains authoritative while rooms, object ecology, weather, media and soundtrack routing follow this world.`);
    this.setText("selectedThemeTitle", theme.name);
    this.setText("selectedThemeCopy", theme.description);
    this.setText("selectedDistricts", theme.rooms.join(", "));
    this.setText("selectedWeather", theme.weather.join(", "));
    this.setText("selectedObjects", theme.objects.map((object) => object.name).join(", "));
    this.setText("selectedPlaylist", theme.soundtrack.status === "UNASSIGNED" ? "User-assigned or local ambience" : `${theme.soundtrack.label} · ${theme.soundtrack.status}`);
    this.setText("leftDistrict", theme.rooms[0] ?? theme.worldName);
    this.setText("rightDistrict", theme.rooms[1] ?? theme.rooms[0] ?? theme.worldName);
    this.setText("weatherDistrict", theme.rooms[0] ?? theme.worldName);
    this.setText("districtChip", theme.rooms[0] ?? theme.worldName);
    this.setText("commandRoomName", theme.rooms[0] ?? theme.worldName);
    this.setText("mascotLabel", theme.mascot);
    this.setText("districtCount", String(theme.rooms.length));
    const districtSelect = document.querySelector<HTMLSelectElement>("#districtSelect");
    if (districtSelect) districtSelect.innerHTML = theme.rooms.map((room) => `<option>${html(room)}</option>`).join("");
    const weatherSelect = document.querySelector<HTMLSelectElement>("#weatherSelect");
    const weatherValues = ["sun", "bubbles", "rain", "fog"];
    if (weatherSelect) weatherSelect.innerHTML = theme.weather.slice(0, 4).map((weather, index) => `<option value="${weatherValues[index] ?? "fog"}">${html(weather)}</option>`).join("");
    try { localStorage.setItem(STORE_KEY, theme.id); } catch { /* State remains active for this session. */ }
    window.dispatchEvent(new CustomEvent("ff:premium-theme-change", { detail: { theme, notify } }));
    window.ffPrototype?.scheduleCinematicWorld?.();
    this.render();
    if (notify) this.close();
  }

  private setText(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  private runObjectAction(target: HTMLElement): void {
    const theme = themeById(this.selectedId);
    const object = theme.objects.find((candidate) => candidate.id === target.dataset.objectId);
    if (!object) return;
    target.classList.remove("reacting");
    void target.offsetWidth;
    target.classList.add("reacting");
    if (target.dataset.objectAction === "media") window.dispatchEvent(new CustomEvent("ff:open-media-surface", { detail: { object } }));
    else if (target.dataset.objectAction === "music") window.dispatchEvent(new CustomEvent("ff:open-music-hub", { detail: { object } }));
    else window.dispatchEvent(new CustomEvent("ff:object-ecology-action", { detail: { object, theme } }));
  }

  roomChanged(): void {
    const room = document.querySelector<HTMLSelectElement>("#districtSelect")?.value;
    if (!room) return;
    this.setText("districtChip", room);
    this.setText("weatherDistrict", room);
    this.setText("commandRoomName", room);
    window.dispatchEvent(new CustomEvent("ff:premium-room-change", { detail: { theme: this.selectedId, room } }));
  }

  diagnostics() {
    const theme = themeById(document.body.dataset.premiumTheme ?? this.selectedId);
    return { active: theme.id, lineage: theme.lineage, availableThemes: DURABLE_THEME_CATALOG.length, artistWorlds: ARTIST_WORLD_CATALOG.length, rooms: theme.rooms, objects: theme.objects.length };
  }
}
