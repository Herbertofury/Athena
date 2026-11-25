/* ═══════════════════════════════════════════════════════════════════════════
   GameSync Mascot Games — Core Engine
   Canvas management, input, physics, particles, rendering, audio hooks.
   dt-based, no FPS caps, native refresh rate via requestAnimationFrame.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  if (window.__gsMascotGameCore) return;

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  const lerp  = (a, b, t) => a + (b - a) * t;
  const rand  = (lo, hi) => Math.random() * (hi - lo) + lo;
  const randInt = (lo, hi) => Math.floor(rand(lo, hi + 1));
  const pick  = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const TAU   = Math.PI * 2;
  const DEG   = Math.PI / 180;
  const WEBPAGE_GROUND_REFRESH_MS = 15000;

  /* ── Color helpers ───────────────────────────────────────────────────── */
  const hsl = (h, s, l, a) => a != null ? `hsla(${h},${s}%,${l}%,${a})` : `hsl(${h},${s}%,${l}%)`;
  const rgba = (r, g, b, a) => `rgba(${r},${g},${b},${a})`;

  /* ── Theme palette from CSS vars ─────────────────────────────────────── */
  function getThemeColors() {
    const s = getComputedStyle(document.documentElement);
    const get = (v) => s.getPropertyValue(v).trim();
    return {
      bg: get("--bg") || "#0e0e14",
      text: get("--text") || "#e8e6e3",
      panel: get("--panel") || "#1a1a2e",
      panel2: get("--panel2") || "#16213e",
      accent: get("--accent") || "#e94560",
      accentRgb: get("--accent-rgb") || "233,69,96",
      border: get("--border2") || "#2a2a4a",
      muted: get("--muted") || "#888",
    };
  }

  const presentationByCanvas = new WeakMap();

  function safeStorageGet(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value == null ? fallback : value;
    } catch (_error) {
      return fallback;
    }
  }

  function safeStorageSet(key, value) {
    try { localStorage.setItem(key, value); } catch (_error) {}
  }

  function runElementTransition(el, keyframes, options) {
    if (!el || typeof el.animate !== "function") return null;
    try {
      return el.animate(keyframes, Object.assign({ duration: 360, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" }, options || {}));
    } catch (_error) {
      return null;
    }
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });
  }

  function chromeApiPromise(call) {
    return new Promise((resolve, reject) => {
      try {
        const maybePromise = call((value) => {
          const error = chrome && chrome.runtime && chrome.runtime.lastError;
          if (error) reject(new Error(error.message || String(error)));
          else resolve(value);
        });
        if (maybePromise && typeof maybePromise.then === "function") maybePromise.then(resolve, reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  function isOwnExtensionUrl(url) {
    const raw = String(url || "");
    if (!raw) return false;
    try {
      if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getURL === "function") {
        return raw.startsWith(chrome.runtime.getURL(""));
      }
    } catch (_error) {}
    return raw.startsWith("chrome-extension://") || raw.startsWith("moz-extension://");
  }

  async function captureCurrentWebpageGround() {
    if (typeof chrome === "undefined" || !chrome.tabs || typeof chrome.tabs.captureVisibleTab !== "function") return null;
    const tabs = typeof chrome.tabs.query === "function"
      ? await chromeApiPromise((done) => chrome.tabs.query({ active: true, lastFocusedWindow: true }, done)).catch(() => [])
      : [];
    const tab = Array.isArray(tabs) ? tabs[0] : null;
    if (tab && isOwnExtensionUrl(tab.url)) return null;
    const windowId = tab && Number.isFinite(tab.windowId) ? tab.windowId : undefined;
    const dataUrl = await chromeApiPromise((done) => {
      if (windowId == null) return chrome.tabs.captureVisibleTab({ format: "jpeg", quality: 72 }, done);
      return chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 72 }, done);
    }).catch(() => null);
    if (!dataUrl) return null;
    const image = await loadImage(dataUrl).catch(() => null);
    return image ? { image, title: tab && tab.title || "Current page", at: performance.now() } : null;
  }

  function requestWebpageGround(state, force) {
    if (!state || state.groundMode !== "webpage") return null;
    const ground = state.webpageGround;
    const now = performance.now();
    if (!force && ground.image && now - ground.capturedAt < WEBPAGE_GROUND_REFRESH_MS) return ground.capturePromise;
    if (ground.capturePromise) return ground.capturePromise;
    ground.status = "loading";
    ground.capturePromise = captureCurrentWebpageGround()
      .then((result) => {
        if (result && result.image) {
          ground.image = result.image;
          ground.title = result.title;
          ground.capturedAt = result.at || performance.now();
          ground.status = "ready";
        } else {
          ground.status = ground.image ? "ready" : "unavailable";
        }
        return ground;
      })
      .catch(() => {
        ground.status = ground.image ? "ready" : "unavailable";
        return ground;
      })
      .finally(() => {
        ground.capturePromise = null;
      });
    return ground.capturePromise;
  }

  function inferGameId(canvas, opts) {
    if (opts && opts.gameId) return String(opts.gameId);
    const container = opts && opts.container || canvas && canvas.parentElement;
    const id = container && (container.dataset && container.dataset.gameId || container.id || container.className);
    return String(id || "mascot-game").replace(/\s+/g, "-").toLowerCase();
  }

  function ensurePresentation(canvas, opts = {}) {
    if (!canvas) return null;
    const existing = presentationByCanvas.get(canvas);
    if (existing) return existing;

    const container = opts.container || canvas.parentElement;
    const gameId = inferGameId(canvas, Object.assign({}, opts, { container }));
    const storageKey = "gsMascotGamePresentation:" + gameId;
    const saved = safeStorageGet(storageKey, "2d");
    const state = {
      gameId,
      dimensionMode: saved === "3d" ? "3d" : "2d",
      cameraMode: safeStorageGet(storageKey + ":camera", "third-person") === "first-person" ? "first-person" : "third-person",
      groundMode: safeStorageGet(storageKey + ":ground", "synthetic") === "webpage" ? "webpage" : "synthetic",
      controlRail: null,
      buttons: {},
      characterSelect: null,
      transition: { at: 0, duration: 0 },
      webpageGround: { image: null, title: "", capturedAt: 0, status: "idle", capturePromise: null },
      destroyed: false
    };

    function updateControls() {
      canvas.dataset.gsDimensionMode = state.dimensionMode;
      canvas.dataset.gsCameraMode = state.cameraMode;
      canvas.dataset.gsGroundMode = state.groundMode;
      const active = {
        twoD: state.dimensionMode !== "3d",
        third: state.dimensionMode === "3d" && state.cameraMode !== "first-person" && state.groundMode !== "webpage",
        first: state.dimensionMode === "3d" && state.cameraMode === "first-person" && state.groundMode !== "webpage",
        page: state.dimensionMode === "3d" && state.groundMode === "webpage"
      };
      for (const key of Object.keys(state.buttons)) {
        const button = state.buttons[key];
        const on = !!active[key];
        button.dataset.active = on ? "true" : "false";
        button.style.background = on ? "rgba(48, 211, 255, 0.88)" : "rgba(8, 10, 18, 0.72)";
        button.style.color = on ? "#021016" : "#f5f7ff";
        button.style.boxShadow = on ? "0 0 0 1px rgba(255,255,255,0.26), 0 10px 28px rgba(48,211,255,0.28)" : "none";
      }
    }

    function triggerTransition() {
      state.transition = { at: performance.now(), duration: 540 };
      runElementTransition(canvas, [
        { filter: "saturate(1) brightness(1)", transform: "scale(1)" },
        { filter: "saturate(1.45) brightness(1.18)", transform: "scale(1.006)", offset: 0.45 },
        { filter: "saturate(1) brightness(1)", transform: "scale(1)" }
      ], { duration: 540 });
    }

    function setPresentationMode(dimensionMode, cameraMode, groundMode) {
      state.dimensionMode = String(dimensionMode || state.dimensionMode).toLowerCase() === "3d" ? "3d" : "2d";
      if (cameraMode) state.cameraMode = String(cameraMode).toLowerCase() === "first-person" ? "first-person" : "third-person";
      if (groundMode) state.groundMode = String(groundMode).toLowerCase() === "webpage" ? "webpage" : "synthetic";
      if (state.dimensionMode !== "3d") state.groundMode = "synthetic";
      safeStorageSet(storageKey, state.dimensionMode);
      safeStorageSet(storageKey + ":camera", state.cameraMode);
      safeStorageSet(storageKey + ":ground", state.groundMode);
      updateControls();
      triggerTransition();
      if (state.groundMode === "webpage") requestWebpageGround(state, true);
      return { dimensionMode: state.dimensionMode, cameraMode: state.cameraMode, groundMode: state.groundMode };
    }

    function toggleDimensionMode() {
      return setPresentationMode(state.dimensionMode === "3d" ? "2d" : "3d", state.cameraMode);
    }

    function cycleCameraMode() {
      if (state.dimensionMode !== "3d") return setPresentationMode("3d", "third-person");
      return setPresentationMode("3d", state.cameraMode === "first-person" ? "third-person" : "first-person");
    }

    function setWebpageGroundMode() {
      return setPresentationMode("3d", state.cameraMode, state.groundMode === "webpage" ? "synthetic" : "webpage");
    }

    function makeControlButton(label, title, onClick) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.title = title;
      button.style.cssText = [
        "width:36px",
        "height:28px",
        "border:1px solid rgba(255,255,255,0.16)",
        "border-radius:6px",
        "font:800 10px/1 system-ui,sans-serif",
        "letter-spacing:0",
        "cursor:pointer",
        "transition:background .18s ease,color .18s ease,box-shadow .18s ease,transform .18s ease"
      ].join(";");
      button.addEventListener("click", () => {
        onClick();
        runElementTransition(button, [
          { transform: "translateY(0) scale(1)" },
          { transform: "translateY(-1px) scale(1.08)" },
          { transform: "translateY(0) scale(1)" }
        ], { duration: 260 });
      });
      return button;
    }

    function hydrateCharacterSelect() {
      const runtime = window.__gsMascotGameMascotRuntime;
      const select = state.characterSelect;
      if (!runtime || !select || typeof runtime.discoverCharacters !== "function") return;
      runtime.discoverCharacters().then((characters) => {
        if (state.destroyed || !Array.isArray(characters) || !characters.length) return;
        const selected = typeof runtime.getSelectedCharacter === "function" ? runtime.getSelectedCharacter(gameId) : null;
        select.textContent = "";
        for (const character of characters) {
          const option = document.createElement("option");
          option.value = character.packId;
          option.textContent = character.name || character.packId;
          option.title = character.origin || "Mascot Pack";
          select.appendChild(option);
        }
        select.value = selected && selected.packId ? selected.packId : characters[0].packId;
        select.disabled = false;
      }).catch(() => {});
    }

    if (container) {
      const computed = getComputedStyle(container);
      if (computed.position === "static") container.style.position = "relative";
      const rail = document.createElement("div");
      rail.className = "gs-mascot-game-control-rail";
      rail.style.cssText = [
        "position:absolute",
        "top:8px",
        "right:8px",
        "z-index:6",
        "display:flex",
        "align-items:center",
        "gap:4px",
        "max-width:calc(100% - 16px)",
        "padding:4px",
        "border:1px solid rgba(255,255,255,0.14)",
        "border-radius:8px",
        "background:rgba(5,8,16,0.56)",
        "box-shadow:0 14px 36px rgba(0,0,0,0.30)",
        "backdrop-filter:blur(12px)",
        "opacity:0.42",
        "transform:translateY(-2px)",
        "transition:opacity .22s ease,transform .22s ease"
      ].join(";");
      rail.addEventListener("mouseenter", () => { rail.style.opacity = "0.98"; rail.style.transform = "translateY(0)"; });
      rail.addEventListener("mouseleave", () => { rail.style.opacity = "0.42"; rail.style.transform = "translateY(-2px)"; });

      state.buttons.twoD = makeControlButton("2D", "2D mascot game view", () => setPresentationMode("2d", state.cameraMode, "synthetic"));
      state.buttons.third = makeControlButton("3P", "Third-person 3D mascot game view", () => setPresentationMode("3d", "third-person", "synthetic"));
      state.buttons.first = makeControlButton("1P", "First-person 3D mascot game view", () => setPresentationMode("3d", "first-person", "synthetic"));
      state.buttons.page = makeControlButton("PAGE", "Use the current browser page as the 3D ground", () => setPresentationMode("3d", state.cameraMode, "webpage"));
      for (const key of ["twoD", "third", "first", "page"]) rail.appendChild(state.buttons[key]);

      const select = document.createElement("select");
      select.className = "gs-mascot-game-character-select";
      select.title = "Mascot character";
      select.disabled = true;
      const pendingOption = document.createElement("option");
      pendingOption.textContent = "Mascot";
      select.appendChild(pendingOption);
      select.style.cssText = [
        "width:118px",
        "border:1px solid rgba(255,255,255,0.18)",
        "border-radius:6px",
        "height:28px",
        "background:rgba(8,10,18,0.82)",
        "color:#f5f7ff",
        "font:700 11px/1 system-ui,sans-serif",
        "letter-spacing:0",
        "cursor:pointer",
        "outline:none"
      ].join(";");
      select.addEventListener("change", () => {
        const runtime = window.__gsMascotGameMascotRuntime;
        if (runtime && typeof runtime.setSelectedCharacter === "function") runtime.setSelectedCharacter(gameId, select.value).catch(() => null);
        triggerTransition();
        runElementTransition(select, [
          { filter: "brightness(1)", transform: "scale(1)" },
          { filter: "brightness(1.35)", transform: "scale(1.035)" },
          { filter: "brightness(1)", transform: "scale(1)" }
        ], { duration: 340 });
      });
      rail.appendChild(select);
      container.appendChild(rail);
      state.controlRail = rail;
      state.characterSelect = select;
      hydrateCharacterSelect();
    }

    const keyHandler = (event) => {
      if (state.destroyed || !canvas.isConnected) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/i.test(target.tagName || ""))) return;
      if (event.code === "KeyB") {
        toggleDimensionMode();
      } else if (event.code === "KeyN") {
        cycleCameraMode();
      } else if (event.code === "KeyM") {
        setWebpageGroundMode();
      } else {
        return;
      }
      event.preventDefault();
    };
    document.addEventListener("keydown", keyHandler, true);

    state.setPresentationMode = setPresentationMode;
    state.toggleDimensionMode = toggleDimensionMode;
    state.cycleCameraMode = cycleCameraMode;
    state.setWebpageGroundMode = setWebpageGroundMode;
    state.refreshWebpageGround = () => requestWebpageGround(state, true);
    state.destroy = () => {
      state.destroyed = true;
      document.removeEventListener("keydown", keyHandler, true);
      if (state.controlRail && state.controlRail.parentNode) state.controlRail.parentNode.removeChild(state.controlRail);
      presentationByCanvas.delete(canvas);
    };

    updateControls();
    if (state.groundMode === "webpage") requestWebpageGround(state, false);
    presentationByCanvas.set(canvas, state);
    canvas.__gsMascotPresentation = state;
    return state;
  }

  function getPresentation(canvas) {
    return canvas ? (presentationByCanvas.get(canvas) || canvas.__gsMascotPresentation || null) : null;
  }

  function project3DPoint(canvas, x, y) {
    const W = canvas && canvas.width || 640;
    const H = canvas && canvas.height || 400;
    const presentation = getPresentation(canvas);
    const firstPerson = presentation && presentation.cameraMode === "first-person";
    const horizon = firstPerson ? H * 0.28 : H * 0.36;
    const depth = clamp((Number(y) || 0) / Math.max(1, H), 0, 1.2);
    const curved = Math.pow(depth, firstPerson ? 1.55 : 1.28);
    const scale = (firstPerson ? 0.42 : 0.34) + curved * (firstPerson ? 1.55 : 1.1);
    return {
      x: W * 0.5 + (Number(x) - W * 0.5) * scale,
      y: horizon + curved * (H - horizon) + (firstPerson ? H * 0.05 : 0),
      scale
    };
  }

  function drawWebpageGroundFloor(ctx, W, H, presentation, horizon, t) {
    const ground = presentation && presentation.webpageGround;
    if (!ground || !ground.image) {
      ctx.save();
      const shimmer = ctx.createLinearGradient(0, horizon, W, H);
      shimmer.addColorStop(0, "rgba(48,211,255,0.08)");
      shimmer.addColorStop(0.5 + Math.sin(t * 1.8) * 0.18, "rgba(255,255,255,0.18)");
      shimmer.addColorStop(1, "rgba(255,205,96,0.08)");
      ctx.fillStyle = shimmer;
      ctx.globalAlpha = 0.78;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(W, horizon);
      ctx.lineTo(W + W * 0.28, H + 40);
      ctx.lineTo(-W * 0.28, H + 40);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      return false;
    }

    const image = ground.image;
    const strips = 48;
    const sourceW = Math.max(1, image.naturalWidth || image.width || 1);
    const sourceH = Math.max(1, image.naturalHeight || image.height || 1);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(W, horizon);
    ctx.lineTo(W + W * 0.28, H + 40);
    ctx.lineTo(-W * 0.28, H + 40);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "rgba(2,8,16,0.92)";
    ctx.fillRect(0, horizon, W, H - horizon);

    for (let i = 0; i < strips; i++) {
      const p0 = i / strips;
      const p1 = (i + 1) / strips;
      const y0 = horizon + Math.pow(p0, 1.62) * (H - horizon);
      const y1 = horizon + Math.pow(p1, 1.62) * (H - horizon);
      const width0 = W * (0.22 + p0 * 1.05);
      const width1 = W * (0.22 + p1 * 1.05);
      const dx = W * 0.5 - Math.max(width0, width1) * 0.5;
      const dw = Math.max(width0, width1);
      const sy = Math.max(0, sourceH * (0.22 + p0 * 0.76));
      const sh = Math.max(1, sourceH * (p1 - p0) * 0.86);
      ctx.globalAlpha = 0.34 + p1 * 0.5;
      ctx.drawImage(image, 0, sy, sourceW, sh, dx, y0, dw, Math.max(1, y1 - y0 + 1));
    }

    ctx.globalCompositeOperation = "screen";
    const gloss = ctx.createLinearGradient(0, horizon, W, H);
    gloss.addColorStop(0, "rgba(48,211,255,0.24)");
    gloss.addColorStop(0.46, "rgba(255,255,255,0.06)");
    gloss.addColorStop(1, "rgba(255,205,96,0.16)");
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = gloss;
    ctx.fillRect(0, horizon, W, H - horizon);
    ctx.restore();
    return true;
  }

  function drawPresentationTransition(ctx, W, H, presentation) {
    if (!presentation || !presentation.transition || !presentation.transition.at) return;
    const elapsed = performance.now() - presentation.transition.at;
    const duration = Math.max(1, presentation.transition.duration || 1);
    const p = clamp(elapsed / duration, 0, 1);
    if (p >= 1) {
      presentation.transition.at = 0;
      return;
    }
    const alpha = Math.sin(p * Math.PI);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.24 * alpha;
    const sweepX = -W * 0.24 + W * 1.48 * p;
    const gradient = ctx.createLinearGradient(sweepX - W * 0.18, 0, sweepX + W * 0.18, H);
    gradient.addColorStop(0, "rgba(48,211,255,0)");
    gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
    gradient.addColorStop(1, "rgba(255,205,96,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function drawCinematicViewFX(ctx, W, H, opts = {}) {
    const presentation = getPresentation(ctx && ctx.canvas);
    const t = Number(opts.time) || performance.now() / 1000;
    const accent = opts.accent || "#30d3ff";
    const intensity = clamp(Number(opts.intensity) || 0.35, 0, 1.6);
    const speed = clamp(Number(opts.speed) || 0, 0, 1.8);
    const is3D = presentation && presentation.dimensionMode === "3d";
    const firstPerson = is3D && presentation.cameraMode === "first-person";
    const webpageGround = is3D && presentation.groundMode === "webpage";
    const centerY = firstPerson ? H * 0.42 : H * 0.54;

    ctx.save();
    const vignette = ctx.createRadialGradient(W * 0.5, centerY, W * 0.12, W * 0.5, centerY, W * 0.76);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.64, "rgba(0,0,0,0.08)");
    vignette.addColorStop(1, `rgba(0,0,0,${is3D ? 0.44 : 0.22})`);
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (is3D) {
      const horizon = firstPerson ? H * 0.28 : H * 0.36;
      const lineCount = Math.floor(8 + intensity * 10 + speed * 12);
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = accent;
      ctx.lineWidth = firstPerson ? 1.25 : 1;
      for (let lineIndex = 0; lineIndex < lineCount; lineIndex++) {
        const phase = (lineIndex / Math.max(1, lineCount - 1) + t * (0.18 + speed * 0.18)) % 1;
        const side = lineIndex % 2 === 0 ? -1 : 1;
        const startX = W * 0.5 + side * W * (0.05 + phase * 0.22);
        const startY = horizon + Math.pow(phase, 1.4) * H * 0.18;
        const endX = W * 0.5 + side * W * (0.42 + phase * 0.2);
        const endY = H * (0.78 + phase * 0.18);
        ctx.globalAlpha = (0.06 + phase * 0.16) * (0.8 + speed * 0.7);
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      if (firstPerson) {
        ctx.globalAlpha = 0.26 + intensity * 0.08;
        ctx.strokeStyle = "rgba(255,255,255,0.72)";
        ctx.lineWidth = 1;
        const reticlePulse = 1 + Math.sin(t * 4.2) * 0.08;
        ctx.beginPath();
        ctx.arc(W * 0.5, H * 0.5, 16 * reticlePulse, 0, TAU);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(W * 0.5 - 28, H * 0.5);
        ctx.lineTo(W * 0.5 - 9, H * 0.5);
        ctx.moveTo(W * 0.5 + 9, H * 0.5);
        ctx.lineTo(W * 0.5 + 28, H * 0.5);
        ctx.moveTo(W * 0.5, H * 0.5 - 28);
        ctx.lineTo(W * 0.5, H * 0.5 - 9);
        ctx.moveTo(W * 0.5, H * 0.5 + 9);
        ctx.lineTo(W * 0.5, H * 0.5 + 28);
        ctx.stroke();
      }

      if (webpageGround) {
        ctx.globalAlpha = 0.18 + intensity * 0.05;
        const gloss = ctx.createLinearGradient(0, horizon, W, H);
        gloss.addColorStop(0, "rgba(255,255,255,0.16)");
        gloss.addColorStop(0.42 + Math.sin(t * 1.7) * 0.08, "rgba(48,211,255,0.08)");
        gloss.addColorStop(1, "rgba(255,205,96,0.18)");
        ctx.fillStyle = gloss;
        ctx.fillRect(0, horizon, W, H - horizon);
      }
    }

    if (speed > 0.05) {
      ctx.globalCompositeOperation = "screen";
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1 + speed;
      const streakCount = Math.floor(6 + speed * 10);
      for (let streakIndex = 0; streakIndex < streakCount; streakIndex++) {
        const y = H * (0.18 + ((streakIndex / streakCount + t * (0.34 + speed * 0.2)) % 1) * 0.68);
        const length = W * (0.08 + speed * 0.14);
        const x = W * ((streakIndex * 0.173 + t * 0.16) % 1);
        ctx.globalAlpha = 0.08 + speed * 0.12;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - length, y + Math.sin(t + streakIndex) * 3);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function isFirstPersonView(target) {
    const canvas = target && target.canvas ? target.canvas : target;
    const presentation = getPresentation(canvas);
    return !!(presentation && presentation.dimensionMode === "3d" && presentation.cameraMode === "first-person");
  }

  function drawFirstPersonBackdrop(ctx, W, H, opts = {}) {
    const t = Number(opts.time) || performance.now() / 1000;
    const accent = opts.accent || "#30d3ff";
    const groundTint = opts.groundTint || "rgba(8, 18, 32, 0.62)";
    const skyTop = opts.skyTop || "#050712";
    const skyBottom = opts.skyBottom || "#101b31";
    const drewStage = drawHybridStage(ctx, W, H, opts);
    const horizon = H * 0.28;

    if (!drewStage) {
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, skyTop);
      sky.addColorStop(0.5, skyBottom);
      sky.addColorStop(1, "#05070d");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = groundTint;
      ctx.beginPath();
      ctx.moveTo(0, horizon);
      ctx.lineTo(W, horizon);
      ctx.lineTo(W + W * 0.28, H + 40);
      ctx.lineTo(-W * 0.28, H + 40);
      ctx.closePath();
      ctx.fill();
    }

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 16; i++) {
      const p = i / 15;
      const y = horizon + Math.pow(p, 1.55) * (H - horizon);
      const width = W * (0.16 + p * 0.92);
      ctx.globalAlpha = 0.06 + p * 0.16;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 - width * 0.5, y);
      ctx.lineTo(W * 0.5 + width * 0.5, y);
      ctx.stroke();
    }
    for (let i = -7; i <= 7; i++) {
      ctx.globalAlpha = 0.08 + (1 - Math.abs(i) / 8) * 0.14;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + i * 4, horizon);
      ctx.lineTo(W * 0.5 + i * W * 0.075, H + 18);
      ctx.stroke();
    }
    const fog = ctx.createLinearGradient(0, horizon - 20, 0, H);
    fog.addColorStop(0, "rgba(255,255,255,0.08)");
    fog.addColorStop(0.32 + Math.sin(t * 1.4) * 0.04, "rgba(48,211,255,0.05)");
    fog.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = fog;
    ctx.globalAlpha = 0.75;
    ctx.fillRect(0, horizon - 20, W, H - horizon + 20);
    ctx.restore();
    return true;
  }

  function drawFirstPersonReticle(ctx, W, H, opts = {}) {
    const t = Number(opts.time) || performance.now() / 1000;
    const accent = opts.accent || "#f8fafc";
    const cx = Number(opts.x) || W * 0.5;
    const cy = Number(opts.y) || H * 0.5;
    const spread = 16 + (Number(opts.spread) || 0);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.34 + Math.sin(t * 4.4) * 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, 13 + Math.sin(t * 3.2) * 1.5, 0, TAU);
    ctx.moveTo(cx - spread, cy);
    ctx.lineTo(cx - 7, cy);
    ctx.moveTo(cx + 7, cy);
    ctx.lineTo(cx + spread, cy);
    ctx.moveTo(cx, cy - spread);
    ctx.lineTo(cx, cy - 7);
    ctx.moveTo(cx, cy + 7);
    ctx.lineTo(cx, cy + spread);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  function drawHybridStage(ctx, W, H, opts = {}) {
    const presentation = getPresentation(ctx && ctx.canvas);
    if (!presentation || presentation.dimensionMode !== "3d") return false;
    if (presentation.groundMode === "webpage") requestWebpageGround(presentation, false);
    const t = Number(opts.time) || performance.now() / 1000;
    const firstPerson = presentation.cameraMode === "first-person";
    const horizon = firstPerson ? H * 0.28 : H * 0.36;
    const accent = opts.accent || "#30d3ff";

    ctx.save();
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050712");
    sky.addColorStop(0.45, "#111a32");
    sky.addColorStop(1, "#06070e");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "rgba(7, 16, 28, 0.96)";
    ctx.beginPath();
    ctx.moveTo(0, horizon);
    ctx.lineTo(W, horizon);
    ctx.lineTo(W + W * 0.26, H + 40);
    ctx.lineTo(-W * 0.26, H + 40);
    ctx.closePath();
    ctx.fill();

    const drewWebpageGround = presentation.groundMode === "webpage" && drawWebpageGroundFloor(ctx, W, H, presentation, horizon, t);

    ctx.strokeStyle = "rgba(75, 210, 255, 0.18)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const p = i / 12;
      const y = horizon + Math.pow(p, 1.65) * (H - horizon);
      ctx.globalAlpha = (drewWebpageGround ? 0.12 : 0.18) + p * (drewWebpageGround ? 0.22 : 0.34);
      ctx.beginPath();
      ctx.moveTo(W * (0.5 - 0.52 * p), y);
      ctx.lineTo(W * (0.5 + 0.52 * p), y);
      ctx.stroke();
    }
    for (let i = -8; i <= 8; i++) {
      const x = W * 0.5 + i * W * 0.065;
      ctx.globalAlpha = (drewWebpageGround ? 0.1 : 0.18) + (1 - Math.abs(i) / 9) * (drewWebpageGround ? 0.12 : 0.2);
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + i * 5, horizon);
      ctx.lineTo(x, H + 20);
      ctx.stroke();
    }

    const cards = [
      { x: W * 0.18, y: H * 0.54, w: 82, h: 18, c: "rgba(255,255,255,0.13)" },
      { x: W * 0.72, y: H * 0.5, w: 96, h: 22, c: "rgba(48,211,255,0.16)" },
      { x: W * 0.42, y: H * 0.72, w: 130, h: 24, c: "rgba(255,205,96,0.14)" },
      { x: W * 0.62, y: H * 0.82, w: 160, h: 28, c: "rgba(255,255,255,0.12)" }
    ];
    for (const card of cards) {
      const bob = Math.sin(t * 1.4 + card.x * 0.01) * 2;
      const p1 = project3DPoint(ctx.canvas, card.x, card.y + bob);
      const p2 = project3DPoint(ctx.canvas, card.x + card.w, card.y + bob);
      const p3 = project3DPoint(ctx.canvas, card.x + card.w * 1.06, card.y + card.h + bob);
      const p4 = project3DPoint(ctx.canvas, card.x - card.w * 0.06, card.y + card.h + bob);
      ctx.globalAlpha = 1;
      ctx.fillStyle = card.c;
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W * 0.12, horizon + 2);
    ctx.quadraticCurveTo(W * 0.5, horizon - 24 - Math.sin(t) * 4, W * 0.88, horizon + 2);
    ctx.stroke();
    drawPresentationTransition(ctx, W, H, presentation);
    ctx.restore();
    return true;
  }

  /* ── Canvas factory ──────────────────────────────────────────────────── */
  function createCanvas(container, w, h, opts = {}) {
    const cvs = document.createElement("canvas");
    cvs.width = w;
    cvs.height = h;
    cvs.style.cssText = `display:block;width:100%;height:auto;border-radius:${opts.radius || 8}px;background:${opts.bg || "#0a0a12"};image-rendering:pixelated;`;
    if (opts.className) cvs.className = opts.className;
    container.appendChild(cvs);
    const ctx = cvs.getContext("2d", { alpha: opts.alpha !== false });
    const presentation = ensurePresentation(cvs, Object.assign({}, opts, { container }));
    return { cvs, ctx, w, h, presentation };
  }

  /* ── Input manager ───────────────────────────────────────────────────── */
  function createInput(target) {
    const keys = {};
    const mouse = { x: 0, y: 0, down: false, clicked: false, rightDown: false };
    let touches = [];

    const kd = (e) => { keys[e.code] = true; keys[e.key] = true; };
    const ku = (e) => { keys[e.code] = false; keys[e.key] = false; };
    const mm = (e) => {
      const r = target.getBoundingClientRect();
      const sx = target.width / r.width;
      const sy = target.height / r.height;
      mouse.x = (e.clientX - r.left) * sx;
      mouse.y = (e.clientY - r.top) * sy;
    };
    const md = (e) => { if (e.button === 0) { mouse.down = true; mouse.clicked = true; } if (e.button === 2) mouse.rightDown = true; };
    const mu = (e) => { if (e.button === 0) mouse.down = false; if (e.button === 2) mouse.rightDown = false; };

    const ts = (e) => {
      const r = target.getBoundingClientRect();
      const sx = target.width / r.width;
      const sy = target.height / r.height;
      touches = Array.from(e.touches).map(t => ({
        x: (t.clientX - r.left) * sx,
        y: (t.clientY - r.top) * sy
      }));
      if (touches.length > 0) {
        mouse.x = touches[0].x;
        mouse.y = touches[0].y;
        mouse.down = true;
        mouse.clicked = true;
      }
    };
    const te = () => { touches = []; mouse.down = false; };

    document.addEventListener("keydown", kd);
    document.addEventListener("keyup", ku);
    target.addEventListener("mousemove", mm);
    target.addEventListener("mousedown", md);
    target.addEventListener("mouseup", mu);
    target.addEventListener("touchstart", ts, { passive: true });
    target.addEventListener("touchmove", ts, { passive: true });
    target.addEventListener("touchend", te, { passive: true });
    target.addEventListener("contextmenu", (e) => e.preventDefault());

    return {
      keys, mouse, touches,
      clearClicked() { mouse.clicked = false; },
      destroy() {
        document.removeEventListener("keydown", kd);
        document.removeEventListener("keyup", ku);
        target.removeEventListener("mousemove", mm);
        target.removeEventListener("mousedown", md);
        target.removeEventListener("mouseup", mu);
        target.removeEventListener("touchstart", ts);
        target.removeEventListener("touchmove", ts);
        target.removeEventListener("touchend", te);
      }
    };
  }

  /* ── Particle system ─────────────────────────────────────────────────── */
  function createParticleSystem(maxParticles = 500) {
    const pool = [];
    return {
      emit(x, y, count, opts = {}) {
        for (let i = 0; i < count && pool.length < maxParticles; i++) {
          const angle = opts.angle != null ? opts.angle + rand(-opts.spread || 0.3, opts.spread || 0.3) : rand(0, TAU);
          const speed = rand(opts.speedMin || 40, opts.speedMax || 200);
          pool.push({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: opts.life || rand(0.4, 1.2),
            maxLife: opts.life || rand(0.4, 1.2),
            size: opts.size || rand(2, 6),
            color: opts.color || hsl(randInt(0, 360), 80, 60),
            gravity: opts.gravity ?? 120,
            friction: opts.friction ?? 0.98,
            shape: opts.shape || "circle",
            rotation: rand(0, TAU),
            rotSpeed: rand(-4, 4),
          });
        }
      },
      update(dt) {
        for (let i = pool.length - 1; i >= 0; i--) {
          const p = pool[i];
          p.life -= dt;
          if (p.life <= 0) { pool.splice(i, 1); continue; }
          p.vy += p.gravity * dt;
          p.vx *= p.friction;
          p.vy *= p.friction;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotSpeed * dt;
        }
      },
      render(ctx) {
        for (const p of pool) {
          const alpha = clamp(p.life / p.maxLife, 0, 1);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          const s = p.size * (0.5 + alpha * 0.5);
          if (p.shape === "square") {
            ctx.fillRect(-s, -s, s * 2, s * 2);
          } else if (p.shape === "star") {
            drawStar(ctx, 0, 0, s, s * 0.4, 5);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, s, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
        ctx.globalAlpha = 1;
      },
      clear() { pool.length = 0; },
      get count() { return pool.length; }
    };
  }

  function drawStar(ctx, cx, cy, or, ir, pts) {
    ctx.beginPath();
    for (let i = 0; i < pts * 2; i++) {
      const r = i % 2 === 0 ? or : ir;
      const a = (i * Math.PI) / pts - Math.PI / 2;
      const fn = i === 0 ? "moveTo" : "lineTo";
      ctx[fn](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
  }

  /* ── Screen effects ──────────────────────────────────────────────────── */
  const ScreenFX = {
    _shake: 0, _shakeMag: 0,
    _flash: 0, _flashColor: "#fff",

    shake(magnitude, duration) {
      this._shakeMag = magnitude;
      this._shake = duration;
    },
    flash(color, duration) {
      this._flashColor = color;
      this._flash = duration;
    },
    update(dt) {
      if (this._shake > 0) this._shake -= dt;
      if (this._flash > 0) this._flash -= dt;
    },
    applyShake(ctx) {
      if (this._shake > 0) {
        const m = this._shakeMag;
        ctx.translate(rand(-m, m), rand(-m, m));
      }
    },
    renderFlash(ctx, w, h) {
      if (this._flash > 0) {
        ctx.globalAlpha = clamp(this._flash * 3, 0, 0.6);
        ctx.fillStyle = this._flashColor;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }
    }
  };

  /* ── Game loop factory ───────────────────────────────────────────────── */
  function createGameLoop(updateFn, renderFn) {
    let running = false;
    let rafId = 0;
    let lastTime = 0;

    function tick(now) {
      if (!running) return;
      rafId = requestAnimationFrame(tick);
      const dt = Math.min((now - lastTime) / 1000, 0.05); // cap dt at 50ms to avoid spiral
      lastTime = now;
      if (dt <= 0) return;
      updateFn(dt);
      renderFn();
    }

    return {
      start() {
        if (running) return;
        running = true;
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        cancelAnimationFrame(rafId);
      },
      get running() { return running; }
    };
  }

  /* ── Drawing helpers ─────────────────────────────────────────────────── */
  const Draw = {
    roundRect(ctx, x, y, w, h, r, fill, stroke) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
    },
    text(ctx, text, x, y, opts = {}) {
      ctx.font = `${opts.weight || "bold"} ${opts.size || 14}px ${opts.font || "'Segoe UI',system-ui,sans-serif"}`;
      ctx.textAlign = opts.align || "center";
      ctx.textBaseline = opts.baseline || "middle";
      if (opts.outline) {
        ctx.strokeStyle = opts.outlineColor || "#000";
        ctx.lineWidth = opts.outlineWidth || 3;
        ctx.lineJoin = "round";
        ctx.strokeText(text, x, y);
      }
      ctx.fillStyle = opts.color || "#fff";
      ctx.fillText(text, x, y);
    },
    gradient(ctx, x, y, w, h, stops) {
      const g = ctx.createLinearGradient(x, y, x, y + h);
      stops.forEach(([pos, col]) => g.addColorStop(pos, col));
      return g;
    },
    radialGradient(ctx, cx, cy, r, stops) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      stops.forEach(([pos, col]) => g.addColorStop(pos, col));
      return g;
    },
    circle(ctx, x, y, r, fill) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    },
    line(ctx, x1, y1, x2, y2, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  };

  /* ── Collision helpers ───────────────────────────────────────────────── */
  const Collision = {
    rectRect(a, b) {
      return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    },
    circleCircle(a, b) {
      const dx = a.x - b.x, dy = a.y - b.y;
      return dx * dx + dy * dy < (a.r + b.r) * (a.r + b.r);
    },
    pointRect(px, py, r) {
      return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
    },
    circleRect(c, r) {
      const cx = clamp(c.x, r.x, r.x + r.w);
      const cy = clamp(c.y, r.y, r.y + r.h);
      const dx = c.x - cx, dy = c.y - cy;
      return dx * dx + dy * dy < c.r * c.r;
    }
  };

  function drawMascotSprite(ctx, x, y, size, color, expression, direction) {
    const runtimeBridge = window.__gsMascotGameMascotRuntime;
    const presentation = getPresentation(ctx && ctx.canvas);
    const wants3D = presentation && presentation.dimensionMode === "3d";
    const height = Math.max(36, Number(size) * (wants3D ? 2.25 : 1.95));
    const key = [color || "mascot", expression || "normal", direction || 1].join(":");
    const action = expression === "happy" ? "celebrate" : expression === "hurt" ? "hurt" : "walk";

    if (runtimeBridge && typeof runtimeBridge.draw === "function") {
      if (wants3D && ctx && typeof ctx.getTransform === "function" && typeof ctx.setTransform === "function") {
        const transform = ctx.getTransform();
        const baselineX = Number(x) || 0;
        const baselineY = (Number(y) || 0) + Number(size) * 0.56;
        const point = typeof DOMPoint !== "undefined"
          ? new DOMPoint(baselineX, baselineY).matrixTransform(transform)
          : { x: transform.a * baselineX + transform.c * baselineY + transform.e, y: transform.b * baselineX + transform.d * baselineY + transform.f };
        const projected = project3DPoint(ctx.canvas, point.x, point.y);
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const drawn = runtimeBridge.draw(ctx, {
          gameId: presentation && presentation.gameId,
          key,
          x: projected.x,
          y: projected.y,
          size: height * projected.scale,
          height: height * projected.scale,
          expression,
          action,
          direction,
          shadowScale: projected.scale,
          glow: color || "#30d3ff"
        });
        ctx.restore();
        if (drawn) return;
      } else if (runtimeBridge.draw(ctx, {
        gameId: presentation && presentation.gameId,
        key,
        x,
        y: y + Number(size) * 0.56,
        size: height,
        height,
        expression,
        action,
        direction,
        glow: color || "#30d3ff"
      })) {
        return;
      }
    }

    drawFallbackMascotSprite(ctx, x, y, size, color, expression, direction);
  }

  /* ── Simple sprite mascot renderer ───────────────────────────────────── */
  function drawFallbackMascotSprite(ctx, x, y, size, color, expression, direction) {
    const s = size;
    const dir = direction || 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dir, 1);

    // Body
    ctx.fillStyle = color || "#e94560";
    Draw.roundRect(ctx, -s * 0.4, -s * 0.3, s * 0.8, s * 0.7, s * 0.15, color || "#e94560");

    // Head
    Draw.circle(ctx, 0, -s * 0.5, s * 0.35, color || "#e94560");

    // Eyes
    const eyeExpr = expression || "normal";
    ctx.fillStyle = "#fff";
    Draw.circle(ctx, -s * 0.12, -s * 0.55, s * 0.1, "#fff");
    Draw.circle(ctx, s * 0.12, -s * 0.55, s * 0.1, "#fff");
    ctx.fillStyle = "#111";
    const ey = eyeExpr === "happy" ? -s * 0.53 : eyeExpr === "hurt" ? -s * 0.57 : -s * 0.55;
    const es = eyeExpr === "hurt" ? s * 0.04 : s * 0.05;
    Draw.circle(ctx, -s * 0.12, ey, es, "#111");
    Draw.circle(ctx, s * 0.12, ey, es, "#111");

    // Mouth
    if (eyeExpr === "happy") {
      ctx.beginPath();
      ctx.arc(0, -s * 0.42, s * 0.1, 0, Math.PI);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (eyeExpr === "hurt") {
      ctx.beginPath();
      ctx.arc(0, -s * 0.38, s * 0.06, Math.PI, 0);
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Legs
    ctx.fillStyle = color || "#e94560";
    ctx.fillRect(-s * 0.3, s * 0.35, s * 0.2, s * 0.2);
    ctx.fillRect(s * 0.1, s * 0.35, s * 0.2, s * 0.2);

    // Feet
    ctx.fillStyle = "#222";
    Draw.roundRect(ctx, -s * 0.35, s * 0.5, s * 0.25, s * 0.1, 3, "#222");
    Draw.roundRect(ctx, s * 0.1, s * 0.5, s * 0.25, s * 0.1, 3, "#222");

    ctx.restore();
  }

  /* ── Easing functions ────────────────────────────────────────────────── */
  const Ease = {
    linear: t => t,
    inQuad: t => t * t,
    outQuad: t => t * (2 - t),
    inOutQuad: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    outBack: t => { const s = 1.70158; return 1 + (--t) * t * (s * t + s); },
    outElastic: t => t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * TAU / 0.4) + 1,
    outBounce: t => {
      if (t < 1 / 2.75) return 7.5625 * t * t;
      if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    }
  };

  /* ── Tween manager ───────────────────────────────────────────────────── */
  function createTweenManager() {
    const tweens = [];
    return {
      add(obj, props, duration, ease, onDone) {
        const start = {};
        const end = {};
        for (const k in props) { start[k] = obj[k]; end[k] = props[k]; }
        tweens.push({ obj, start, end, duration, ease: ease || Ease.outQuad, elapsed: 0, onDone });
      },
      update(dt) {
        for (let i = tweens.length - 1; i >= 0; i--) {
          const tw = tweens[i];
          tw.elapsed += dt;
          const t = clamp(tw.elapsed / tw.duration, 0, 1);
          const e = tw.ease(t);
          for (const k in tw.end) {
            tw.obj[k] = tw.start[k] + (tw.end[k] - tw.start[k]) * e;
          }
          if (t >= 1) {
            tweens.splice(i, 1);
            if (tw.onDone) tw.onDone();
          }
        }
      },
      clear() { tweens.length = 0; }
    };
  }

  /* ── Audio helper (reuses existing sound FX system) ──────────────────── */
  const Audio = {
    play(name) {
      try {
        // Try to use existing GameSync sound system
        if (window.__gsSoundFx?.play) {
          window.__gsSoundFx.play(name);
          return;
        }
        // Fallback: create a tiny oscillator beep
        const actx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = actx.createOscillator();
        const gain = actx.createGain();
        osc.connect(gain);
        gain.connect(actx.destination);
        gain.gain.value = 0.1;
        const tones = { hit: 220, jump: 440, collect: 660, win: 880, lose: 165, click: 550 };
        osc.frequency.value = tones[name] || 440;
        osc.type = "square";
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + 0.15);
        osc.stop(actx.currentTime + 0.15);
      } catch (_) {}
    }
  };

  /* ── DB helpers (chrome.storage.local) ───────────────────────────────── */
  const DB = {
    async get(key, fallback) {
      try {
        const r = await chrome.storage.local.get(key);
        return r[key] ?? fallback;
      } catch (_) { return fallback; }
    },
    async set(key, val) {
      try { await chrome.storage.local.set({ [key]: val }); } catch (_) {}
    }
  };

  /* ── Button helper for canvas ────────────────────────────────────────── */
  function createButton(x, y, w, h, label, opts = {}) {
    return {
      x, y, w, h, label,
      color: opts.color || "rgba(233,69,96,0.9)",
      hoverColor: opts.hoverColor || "rgba(233,69,96,1)",
      textColor: opts.textColor || "#fff",
      hovered: false,
      pressed: false,
      radius: opts.radius || 6,
      fontSize: opts.fontSize || 14,
      contains(mx, my) { return mx >= x && mx <= x + w && my >= y && my <= y + h; },
      render(ctx, mx, my) {
        this.hovered = this.contains(mx, my);
        const c = this.hovered ? this.hoverColor : this.color;
        Draw.roundRect(ctx, this.x, this.y, this.w, this.h, this.radius, c);
        if (this.hovered) {
          ctx.shadowColor = this.color;
          ctx.shadowBlur = 12;
          Draw.roundRect(ctx, this.x, this.y, this.w, this.h, this.radius, null, this.color);
          ctx.shadowBlur = 0;
        }
        Draw.text(ctx, this.label, this.x + this.w / 2, this.y + this.h / 2, {
          size: this.fontSize, color: this.textColor
        });
      }
    };
  }

  /* ── Mascot color palette ────────────────────────────────────────────── */
  const MASCOT_COLORS = [
    "#e94560", "#0f3460", "#16c79a", "#f5a623", "#a855f7",
    "#06b6d4", "#ef4444", "#22c55e", "#f97316", "#ec4899",
    "#8b5cf6", "#14b8a6", "#f59e0b", "#6366f1", "#d946ef"
  ];

  const MASCOT_NAMES = [
    "Pixel", "Glitch", "Nova", "Spark", "Blaze", "Frost", "Shadow",
    "Echo", "Drift", "Flux", "Cosmo", "Neon", "Byte", "Zap", "Luna"
  ];

  /* ── Export ──────────────────────────────────────────────────────────── */
  window.__gsMascotGameCore = {
    // Helpers
    clamp, lerp, rand, randInt, pick, TAU, DEG, hsl, rgba,
    // Factories
    createCanvas, createInput, createParticleSystem, createGameLoop, createTweenManager, createButton,
    // Singletons
    ScreenFX: Object.create(ScreenFX),
    Draw, Collision, Ease, Audio, DB,
    // Mascot rendering
    drawMascotSprite, MASCOT_COLORS, MASCOT_NAMES,
    // 2D/3D presentation
    ensurePresentation, getPresentation, isFirstPersonView, project3DPoint, drawHybridStage, drawCinematicViewFX, drawFirstPersonBackdrop, drawFirstPersonReticle, requestWebpageGround,
    // Theme
    getThemeColors,
  };
})();
