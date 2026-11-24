import { themeById, type PremiumTheme, type WorldObjectRecord } from "./themeCatalog";

type ActorState = {
  record: WorldObjectRecord;
  element: HTMLButtonElement;
  side: "left" | "right";
  x: number;
  y: number;
  vx: number;
  vy: number;
  dragging: boolean;
  moved: boolean;
  lastX: number;
  lastY: number;
  lastAt: number;
  frame: number;
};

export class ObjectEcologyLayer {
  private readonly layers: Record<"left" | "right", HTMLDivElement>;
  private readonly actors = new Map<string, ActorState>();
  private selectedId: string | null = null;
  private themeId = "frutiger-aero";

  constructor() {
    this.layers = { left: this.makeLayer("left"), right: this.makeLayer("right") };
    window.addEventListener("ff:premium-theme-change", (event) => {
      const theme = event instanceof CustomEvent ? event.detail?.theme as PremiumTheme | undefined : undefined;
      if (theme) this.load(theme);
    });
    this.load(themeById(document.body.dataset.premiumTheme ?? "frutiger-aero"));
  }

  private makeLayer(side: "left" | "right"): HTMLDivElement {
    const layer = document.createElement("div");
    layer.className = `premium-ecology-layer premium-ecology-${side}`;
    layer.dataset.ecologySide = side;
    document.querySelector(`#${side}World`)?.append(layer);
    return layer;
  }

  private load(theme: PremiumTheme): void {
    this.themeId = theme.id;
    this.clear();
    const laneCounts = { left: 0, right: 0 };
    theme.objects.forEach((record, index) => {
      const side: "left" | "right" = record.lanePreference === "right" ? "right" : record.lanePreference === "left" ? "left" : index % 2 ? "right" : "left";
      const laneIndex = laneCounts[side]++;
      this.spawn(record, side, laneIndex);
    });
  }

  private spawn(record: WorldObjectRecord, side: "left" | "right", laneIndex: number): void {
    const element = document.createElement("button");
    element.className = "premium-ecology-actor";
    element.dataset.objectId = record.id;
    element.dataset.shape = record.shape;
    element.dataset.material = record.material;
    element.setAttribute("aria-label", `${record.name}. ${record.affordances.join(", ")}`);
    element.title = `${record.name} · drag, throw or click · ${record.affordances.join(" · ")}`;
    element.innerHTML = `<span class="ecology-object-form"><i></i><i></i><i></i></span><span class="ecology-object-name">${this.escape(record.name)}</span><span class="ecology-object-energy"></span>`;
    const host = this.layers[side];
    host.append(element);
    const x = 18 + (laneIndex % 2) * 76;
    const ecologyShelf = Math.max(300, host.clientHeight - 360);
    const y = ecologyShelf + Math.floor(laneIndex / 2) * 118 + (side === "right" ? 22 : 0);
    const state: ActorState = { record, element, side, x, y, vx: 0, vy: 0, dragging: false, moved: false, lastX: 0, lastY: 0, lastAt: 0, frame: 0 };
    this.actors.set(record.id, state);
    this.position(state);
    this.bindActor(state);
  }

  private bindActor(state: ActorState): void {
    const element = state.element;
    element.addEventListener("pointerdown", (event) => {
      if (document.body.dataset.world !== "interactive" || !["living", "stage"].includes(document.body.dataset.mode ?? "")) return;
      event.preventDefault();
      cancelAnimationFrame(state.frame);
      element.setPointerCapture(event.pointerId);
      state.dragging = true;
      state.moved = false;
      state.vx = 0;
      state.vy = 0;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastAt = performance.now();
      element.classList.add("dragging");
      this.select(state);
    });
    element.addEventListener("pointermove", (event) => {
      if (!state.dragging) return;
      const now = performance.now();
      const delta = Math.max(8, now - state.lastAt);
      const dx = event.clientX - state.lastX;
      const dy = event.clientY - state.lastY;
      state.x += dx;
      state.y += dy;
      state.vx = dx / delta * 16;
      state.vy = dy / delta * 16;
      state.moved ||= Math.abs(dx) + Math.abs(dy) > 3;
      state.lastX = event.clientX;
      state.lastY = event.clientY;
      state.lastAt = now;
      this.clamp(state);
      this.position(state);
    });
    const release = () => {
      if (!state.dragging) return;
      state.dragging = false;
      element.classList.remove("dragging");
      if (state.moved) this.throw(state);
      else this.activate(state);
    };
    element.addEventListener("pointerup", release);
    element.addEventListener("pointercancel", release);
    element.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); this.select(state); this.activate(state); }
      const step = event.shiftKey ? 20 : 8;
      if (event.key === "ArrowLeft") state.x -= step;
      else if (event.key === "ArrowRight") state.x += step;
      else if (event.key === "ArrowUp") state.y -= step;
      else if (event.key === "ArrowDown") state.y += step;
      else return;
      event.preventDefault();
      this.clamp(state);
      this.position(state);
    });
  }

  private select(state: ActorState): void {
    this.selectedId = state.record.id;
    this.actors.forEach((actor) => actor.element.classList.toggle("selected", actor === state));
  }

  private activate(state: ActorState): void {
    const actions = state.record.affordances;
    state.element.classList.remove("activated");
    void state.element.offsetWidth;
    state.element.classList.add("activated");
    if (actions.some((action) => action.includes("screen") || action.includes("video"))) {
      window.dispatchEvent(new CustomEvent("ff:open-media-surface", { detail: { object: state.record } }));
    } else if (actions.some((action) => action.includes("music") || action.includes("note"))) {
      window.dispatchEvent(new CustomEvent("ff:open-music-hub", { detail: { object: state.record } }));
    } else {
      window.dispatchEvent(new CustomEvent("ff:object-ecology-action", { detail: { object: state.record, theme: this.themeId } }));
    }
  }

  private throw(state: ActorState): void {
    let previous = performance.now();
    const frame = (now: number) => {
      const delta = Math.min(32, now - previous) / 16.67;
      previous = now;
      state.vy += 0.28 * delta;
      state.vx *= Math.pow(0.987, delta);
      state.vy *= Math.pow(0.993, delta);
      state.x += state.vx * delta;
      state.y += state.vy * delta;
      const bounds = this.layers[state.side].getBoundingClientRect();
      const maxX = Math.max(0, bounds.width - state.element.offsetWidth);
      const maxY = Math.max(0, bounds.height - state.element.offsetHeight);
      if (state.x <= 0 || state.x >= maxX) { state.x = Math.max(0, Math.min(maxX, state.x)); state.vx *= -Math.max(0.18, state.record.behavior.restitution); }
      if (state.y <= 0) { state.y = 0; state.vy *= -0.42; }
      if (state.y >= maxY) { state.y = maxY; state.vy *= -Math.max(0.12, state.record.behavior.restitution); state.vx *= 0.86; }
      this.position(state);
      if (Math.abs(state.vx) + Math.abs(state.vy) > 0.32 || state.y < maxY - 1) state.frame = requestAnimationFrame(frame);
      else { state.vx = 0; state.vy = 0; state.element.classList.add("settled"); }
    };
    state.frame = requestAnimationFrame(frame);
  }

  private clamp(state: ActorState): void {
    const bounds = this.layers[state.side].getBoundingClientRect();
    state.x = Math.max(0, Math.min(Math.max(0, bounds.width - state.element.offsetWidth), state.x));
    state.y = Math.max(0, Math.min(Math.max(0, bounds.height - state.element.offsetHeight), state.y));
  }

  private position(state: ActorState): void {
    state.element.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) rotate(${Math.max(-10, Math.min(10, state.vx * 0.5))}deg)`;
  }

  private clear(): void {
    this.actors.forEach((state) => { cancelAnimationFrame(state.frame); state.element.remove(); });
    this.actors.clear();
    this.selectedId = null;
  }

  private escape(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  pulse(): void {
    let index = 0;
    this.actors.forEach((state) => {
      const delay = index * 34;
      index += 1;
      window.setTimeout(() => {
      state.element.classList.remove("world-pulse");
      void state.element.offsetWidth;
      state.element.classList.add("world-pulse");
      }, delay);
    });
  }

  diagnostics() {
    return { theme: this.themeId, actors: this.actors.size, selected: this.selectedId, moving: Array.from(this.actors.values()).filter((state) => state.frame).length };
  }
}
