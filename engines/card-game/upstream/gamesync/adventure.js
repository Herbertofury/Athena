/**
 * @module cardgame/adventure
 * @description Full adventure mode — 2D canvas world with exploration, card-battle
 * encounters, equipment, NPCs, treasure, perspective switching, and boss fights.
 * Uses actual shimeji/mascot sprites via the same pack system as the GTA open-world
 * engine. AAAA-quality rendering: parallax sky, district gradients, detailed buildings
 * with shadows/windows/neon signs, roads with lane markings + streetlamps, weather
 * system (rain, lightning, fog), Y-sorted sprite actors, and vignette overlays.
 *
 * §14.4 Mascot Adventure — fully playable PvE adventure.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Constants & World Data
   ═══════════════════════════════════════════════════════════════════════════ */

const W = 800, H = 500;                       // viewport
const WORLD_W = 3200, WORLD_H = 2400;         // full world
const TILE = 32;
const PLAYER_SPEED = 160;                      // px/sec
const SPRINT_MULT = 1.7;
const GRAVITY = 680;
const JUMP_VEL = -290;
const CAM_LERP = 0.08;
const INTERACT_DIST = 56;
const MINIMAP_SIZE = 120;
const TAU = Math.PI * 2;

/* ═══════════════════════════════════════════════════════════════════════════
   Mascot Pack System (verbatim from GTA open-world engine)
   ═══════════════════════════════════════════════════════════════════════════ */
const DEFAULT_PACK_ID = "five-nights-at-freddys-toy-bonnie-01";
const MASCOT_MSG = Object.freeze({
  LIST_PACKS: "MASCOT_LIST_PACKS",
  ENSURE_BUNDLED_REFERENCE_SHIMEJIS: "MASCOT_ENSURE_BUNDLED_REFERENCE_SHIMEJIS",
  GET_ACTIVE_PACK_RUNTIME: "MASCOT_GET_ACTIVE_PACK_RUNTIME"
});
const LOCAL_SHIMEJI_PACKS = Object.freeze([
  { packId: "five-nights-at-freddys-toy-bonnie-01", name: "Toy Bonnie", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/five-nights-at-freddys-toy-bonnie-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/five-nights-at-freddys-toy-bonnie-01/spritesheet.png" },
  { packId: "five-nights-at-freddys-mangle-01", name: "Mangle", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/five-nights-at-freddys-mangle-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/five-nights-at-freddys-mangle-01/spritesheet.png" },
  { packId: "pochita-chainsaw-man-01", name: "Pochita", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/pochita-chainsaw-man-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/pochita-chainsaw-man-01/spritesheet.png" },
  { packId: "search-rover-xp-01", name: "Search Rover", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/search-rover-xp-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/search-rover-xp-01/spritesheet.png" },
  { packId: "bonzi-blobbuddy-01", name: "BlobBuddy", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/bonzi-blobbuddy-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/bonzi-blobbuddy-01/spritesheet.png" },
  { packId: "bonzi-maxalert-01", name: "MaxALERT", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/bonzi-maxalert-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/bonzi-maxalert-01/spritesheet.png" },
  { packId: "shijima-default-01", name: "Shijima", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/shijima-default-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/shijima-default-01/spritesheet.png" },
  { packId: "webmeji-default-shimeji-01", name: "Webmeji", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/webmeji-default-shimeji-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/webmeji-default-shimeji-01/spritesheet.png" }
]);
const PACK_THEME_HINTS = Object.freeze({
  "five-nights-at-freddys-toy-bonnie-01": "#6ee7ff",
  "five-nights-at-freddys-mangle-01": "#fb7185",
  "pochita-chainsaw-man-01": "#f59e0b",
  "search-rover-xp-01": "#facc15",
  "bonzi-blobbuddy-01": "#60a5fa",
  "bonzi-maxalert-01": "#a78bfa",
  "shijima-default-01": "#34d399",
  "webmeji-default-shimeji-01": "#22d3ee"
});

/* ── Pack Utility Helpers ───────────────────────────────────────────────── */
function _s(v) { return v == null ? "" : String(v); }
function _rgba(color, alpha) {
  const value = _s(color).trim();
  if (/^#([0-9a-f]{6})$/i.test(value)) {
    const hex = value.slice(1);
    return "rgba(" + parseInt(hex.slice(0, 2), 16) + "," + parseInt(hex.slice(2, 4), 16) + "," + parseInt(hex.slice(4, 6), 16) + "," + alpha + ")";
  }
  if (/^#([0-9a-f]{3})$/i.test(value)) {
    const hex = value.slice(1);
    return "rgba(" + parseInt(hex[0] + hex[0], 16) + "," + parseInt(hex[1] + hex[1], 16) + "," + parseInt(hex[2] + hex[2], 16) + "," + alpha + ")";
  }
  if (/^rgba?\(/i.test(value)) {
    const parts = value.replace(/^rgba?\(/i, "").replace(/\)\s*$/, "").split(",").map(p => p.trim());
    if (parts.length >= 3) return "rgba(" + parts[0] + "," + parts[1] + "," + parts[2] + "," + alpha + ")";
  }
  return "rgba(118,215,255," + alpha + ")";
}
function _normalizePackId(v) { return _s(v).trim().toLowerCase(); }
function _friendlyPackName(packId) {
  const exact = LOCAL_SHIMEJI_PACKS.find(e => e.packId === packId);
  if (exact && exact.name) return exact.name;
  const label = _s(packId).replace(/[-_]+/g, " ").trim();
  return label ? label.replace(/\b\w/g, c => c.toUpperCase()) : "Mascot";
}
function _findLocalPackSpec(packId) {
  const id = _normalizePackId(packId);
  return LOCAL_SHIMEJI_PACKS.find(e => _normalizePackId(e.packId) === id) || null;
}
function _sortPackSpecs(rows) {
  return (rows || []).slice().sort((a, b) => {
    if (_normalizePackId(a.packId) === DEFAULT_PACK_ID) return -1;
    if (_normalizePackId(b.packId) === DEFAULT_PACK_ID) return 1;
    return _s(a.name || a.packId).localeCompare(_s(b.name || b.packId));
  });
}
function _resolvePackUrl(path) {
  const raw = _s(path).trim();
  if (!raw) return raw;
  if (/^(data:|blob:|https?:|chrome-extension:)/i.test(raw)) return raw;
  if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getURL === "function") {
    return chrome.runtime.getURL(raw);
  }
  return raw;
}
function _stripBom(text) { return _s(text).replace(/^\uFEFF/, ""); }
function _directChildElements(node) { return Array.from((node && node.children) || []); }
function _directChildrenByLocalName(node, name) {
  return _directChildElements(node).filter(c => _s(c.localName).toLowerCase() === _s(name).toLowerCase());
}
function _loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image load failed: " + src));
    img.src = src;
  });
}
function _parseFloatPair(text, fallbackA, fallbackB) {
  const parts = _s(text).split(",").map(p => Number(p.trim()));
  return { a: Number.isFinite(parts[0]) ? parts[0] : fallbackA, b: Number.isFinite(parts[1]) ? parts[1] : fallbackB };
}
function _poseDurationMs(rawDuration, frameCount) {
  const n = Number(rawDuration);
  if (!Number.isFinite(n) || n <= 0) return frameCount > 1 ? 110 : 180;
  if (frameCount <= 1) return Math.max(140, Math.min(220, n * 2));
  return Math.max(60, Math.min(220, n * 34));
}
function _actionCategory(name) {
  const lower = _s(name).toLowerCase();
  if (/run|dash/.test(lower)) return "Sprint";
  if (/walk/.test(lower)) return "Walk";
  if (/sit|sprawl|lie|dangle/.test(lower)) return "Rest";
  if (/grab|hold/.test(lower)) return "Grab";
  if (/climb/.test(lower)) return "Climb";
  if (/jump|fall|bounce|trip/.test(lower)) return "Air";
  if (/withie|throwie|ie/.test(lower)) return "Carry";
  if (/split|divide|pullup/.test(lower)) return "Special";
  if (/drag|pinch|resist/.test(lower)) return "Drag";
  return "General";
}
function _spriteKeyCandidates(value) {
  const raw = _s(value).trim().replace(/\\/g, "/");
  if (!raw) return [];
  const out = new Set([raw]);
  out.add(raw.replace(/^\.\/+/, ""));
  out.add(raw.replace(/^\/+/, ""));
  out.add("/" + raw.replace(/^\/+/, ""));
  const base = raw.split("/").pop() || raw;
  out.add(base);
  out.add("/" + base);
  const lowered = raw.toLowerCase();
  out.add(lowered);
  out.add(lowered.replace(/^\/+/, ""));
  out.add("/" + lowered.replace(/^\/+/, ""));
  return Array.from(out).filter(Boolean);
}

/* ── Runtime Message ─────────────────────────────────────────────────── */
async function _runtimeMessage(payload) {
  if (typeof chrome === "undefined" || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
    throw new Error("Mascot runtime messaging unavailable.");
  }
  return await new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; reject(new Error("Mascot runtime message timed out" + (payload && payload.type ? ": " + payload.type : "."))); } }, 3200);
    const finish = (fn, value) => { if (settled) return; settled = true; clearTimeout(timer); fn(value); };
    try {
      chrome.runtime.sendMessage(payload, (response) => {
        const err = chrome.runtime && chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
        if (err) { finish(reject, new Error(err)); return; }
        finish(resolve, response || null);
      });
    } catch (error) { finish(reject, error); }
  });
}

/* ── Frame Image Loader ──────────────────────────────────────────────── */
async function _loadFrameImages(assets) {
  const entries = Object.entries(assets || {});
  const pairs = await Promise.all(entries.map(async ([name, src]) => {
    try {
      const image = await _loadImage(src);
      return _spriteKeyCandidates(name).map(key => [key, image]);
    } catch (_) { return []; }
  }));
  return new Map(pairs.flat());
}

/* ── Build Action Runtime (sprite parser) ────────────────────────────── */
function _buildActionRuntime(config, options) {
  const opts = options || {};
  const parser = new DOMParser();
  const xml = parser.parseFromString(_stripBom(config.actions), "application/xml");
  const spriteMap = config && config.sprites && typeof config.sprites === "object" ? config.sprites : {};
  const frameImages = opts.frameImages instanceof Map ? opts.frameImages : new Map();
  const allActionNodes = Array.from(xml.getElementsByTagNameNS("*", "Action"));
  const namedNodes = new Map();
  for (const node of allActionNodes) {
    const name = _s(node.getAttribute("Name")).trim();
    if (name && !namedNodes.has(name)) namedNodes.set(name, node);
  }
  function collectPoseFrames(animationNode) {
    return _directChildrenByLocalName(animationNode, "Pose").map(pose => {
      const spriteKey = _s(pose.getAttribute("Image")).trim();
      const sprite = spriteMap[spriteKey] || spriteMap[spriteKey.replace(/^\/+/, "")] || null;
      let frameImage = null;
      for (const candidate of _spriteKeyCandidates(spriteKey)) {
        if (frameImages.has(candidate)) { frameImage = frameImages.get(candidate); break; }
      }
      const width = Number(sprite && sprite.width) || Number(frameImage && (frameImage.naturalWidth || frameImage.width)) || 0;
      const height = Number(sprite && sprite.height) || Number(frameImage && (frameImage.naturalHeight || frameImage.height)) || 0;
      if (!width || !height) return null;
      const anchor = _parseFloatPair(pose.getAttribute("ImageAnchor"), width * 0.5, height);
      const velocity = _parseFloatPair(pose.getAttribute("Velocity"), 0, 0);
      return {
        spriteKey, image: frameImage,
        sx: Number(sprite && sprite.x) || 0, sy: Number(sprite && sprite.y) || 0, sw: width, sh: height,
        anchorX: anchor.a, anchorY: anchor.b, vx: velocity.a, vy: velocity.b,
        durationRaw: Number(pose.getAttribute("Duration")) || 4
      };
    }).filter(Boolean);
  }
  function collectFragments(node, visited) {
    const fragments = [];
    for (const child of _directChildElements(node)) {
      const local = _s(child.localName);
      if (local === "Animation") {
        const frames = collectPoseFrames(child);
        if (frames.length) fragments.push(...frames);
      } else if (local === "ActionReference") {
        const refName = _s(child.getAttribute("Name")).trim();
        if (!refName || visited.has(refName)) continue;
        visited.add(refName);
        const refNode = namedNodes.get(refName);
        if (refNode) fragments.push(...collectFragments(refNode, visited));
        visited.delete(refName);
      } else if (local === "Action") {
        fragments.push(...collectFragments(child, visited));
      }
    }
    return fragments;
  }
  const actions = {};
  for (const [name, node] of namedNodes.entries()) {
    const frames = collectFragments(node, new Set([name]));
    actions[name] = {
      name, type: _s(node.getAttribute("Type")).trim(), borderType: _s(node.getAttribute("BorderType")).trim(),
      className: _s(node.getAttribute("Class")).trim(), category: _actionCategory(name),
      frames: frames.map(f => ({ ...f, durationMs: _poseDurationMs(f.durationRaw, frames.length) }))
    };
  }
  const actionNames = Object.keys(actions).sort((a, b) => {
    const ca = actions[a].category, cb = actions[b].category;
    if (ca !== cb) return ca.localeCompare(cb);
    return a.localeCompare(b);
  });
  const aliasMap = Object.freeze({
    idle: ["Stand", "StandUp", "SitDown", "Look"],
    walk: ["Walk", "WalkAlongWorkAreaFloor", "WalkAlongFloor"],
    run: ["Run", "RunAlongWorkAreaFloor", "Dash"],
    dash: ["Dash", "Run"],
    sit: ["Sit", "SitWithLegsDown", "SitAndDangleLegs", "SitWhileDanglingLegs"],
    relax: ["Sprawl", "LieDown", "Sit"],
    creep: ["Creep", "CrawlAlongWorkAreaFloor", "Walk"],
    jump: ["Jumping", "Jump", "JumpFromBottomOfIE"],
    fall: ["Falling", "Fall", "FallFromWall", "FallFromCeiling"],
    land: ["Bouncing", "Tripping", "Stand"],
    hurt: ["Tripping", "Bouncing", "Resisting"],
    drag: ["Pinched", "Dragged", "Resisting"],
    split: ["SplitIntoTwo", "Divide1", "Divided"],
    carryWalk: ["WalkWithIe", "Walk"],
    carryRun: ["RunWithIe", "Dash", "Run"],
    throwCarry: ["ThrowIe", "WalkWithIe"],
    wallGrab: ["GrabWall", "HoldOntoWall", "GrabLeftWall", "GrabRightWall"],
    wallClimb: ["ClimbWall", "ClimbAlongWall", "ClimbHalfwayAlongWall"],
    ceilingGrab: ["GrabCeiling", "HoldOntoCeiling"],
    ceilingClimb: ["ClimbCeiling", "ClimbAlongCeiling", "WalkAlongIECeiling"],
    pullUp: ["PullUpShimeji", "PullUp"],
    lookUp: ["SitAndLookUp", "SitAndFaceMouse", "Look"],
    spin: ["SitAndSpinHead", "SitAndSpinHeadAction", "Look"],
    restCarry: ["WalkWithIe", "Sit"],
    resist: ["Resisting", "Pinched"]
  });
  function resolveAlias(name) {
    const key = _s(name).trim();
    if (actions[key]) return key;
    const aliasList = aliasMap[key];
    if (!aliasList) return actionNames[0] || "";
    return aliasList.find(c => actions[c] && actions[c].frames.length) || aliasList.find(c => actions[c]) || actionNames[0] || "";
  }
  function createAnimator(defaultAction) {
    const animator = {
      action: resolveAlias(defaultAction || "idle"),
      frameIndex: 0, frameElapsed: 0, actionElapsed: 0,
      loop: true, queuedAction: "", queuedLoop: true,
      facing: 1, transient: false, speedScale: 1,
      setAction(name, options) {
        const next = resolveAlias(name);
        if (!next) return;
        const restart = !!(options && options.restart);
        const nextLoop = options && typeof options.loop === "boolean" ? options.loop : true;
        if (!restart && next === this.action && this.loop === nextLoop) return;
        this.action = next;
        this.loop = nextLoop;
        this.frameIndex = 0; this.frameElapsed = 0; this.actionElapsed = 0;
        this.queuedAction = _s(options && options.afterAction).trim();
        this.queuedLoop = options && typeof options.afterLoop === "boolean" ? options.afterLoop : true;
        this.transient = !!(options && options.transient);
        this.speedScale = Math.max(0.25, Number(options && options.speedScale) || 1);
      },
      update(dt) {
        const action = actions[this.action];
        if (!action || !action.frames.length) return;
        this.actionElapsed += dt;
        if (action.frames.length <= 1) return;
        const frame = action.frames[this.frameIndex];
        this.frameElapsed += dt * 1000 * this.speedScale;
        while (this.frameElapsed >= frame.durationMs) {
          this.frameElapsed -= frame.durationMs;
          if (this.frameIndex < action.frames.length - 1) { this.frameIndex += 1; }
          else if (this.loop) { this.frameIndex = 0; }
          else if (this.queuedAction) { this.setAction(this.queuedAction, { loop: this.queuedLoop }); return; }
          else { this.frameIndex = action.frames.length - 1; return; }
        }
      },
      currentFrame() {
        const action = actions[this.action];
        if (!action || !action.frames.length) return null;
        return action.frames[Math.max(0, Math.min(action.frames.length - 1, this.frameIndex))];
      }
    };
    animator.setAction(defaultAction || "idle", { restart: true });
    return animator;
  }
  const runtime = { actions, actionNames, resolveAlias, createAnimator, image: null };
  runtime.drawActor = function drawActor(ctx, animator, x, y, options) {
    const frame = animator && animator.currentFrame ? animator.currentFrame() : null;
    const sourceImage = frame && frame.image ? frame.image : runtime.image;
    if (!frame || !sourceImage) return;
    const height = Math.max(68, Number(options && options.height) || 82);
    const scale = height / Math.max(1, frame.sh);
    const flip = Number(options && options.facing || animator.facing || 1) < 0;
    const offsetY = Number(options && options.offsetY) || 0;
    const shadowScale = Math.max(0.1, Number(options && options.shadowScale) || 1);
    ctx.save();
    ctx.translate(x, y + offsetY);
    if (flip) ctx.scale(-1, 1);
    if (!options || options.shadow !== false) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "rgba(6, 8, 16, 0.9)";
      ctx.beginPath();
      ctx.ellipse(0, 8, 18 * shadowScale, 8 * shadowScale, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.imageSmoothingEnabled = false;
    if (frame.image) {
      ctx.drawImage(sourceImage, 0, 0, frame.sw, frame.sh, -frame.anchorX * scale, -frame.anchorY * scale, frame.sw * scale, frame.sh * scale);
    } else {
      ctx.drawImage(sourceImage, frame.sx, frame.sy, frame.sw, frame.sh, -frame.anchorX * scale, -frame.anchorY * scale, frame.sw * scale, frame.sh * scale);
    }
    if (options && options.glow) {
      const auraW = frame.sw * scale * 0.72, auraH = frame.sh * scale * 0.92;
      const aura = ctx.createRadialGradient(0, -auraH * 0.46, 4, 0, -auraH * 0.46, Math.max(auraW, auraH));
      aura.addColorStop(0, _rgba(options.glow, 0.58));
      aura.addColorStop(0.45, _rgba(options.glow, 0.18));
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.38;
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.ellipse(0, -auraH * 0.46, auraW * 0.7, auraH * 0.88, 0, 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
  return runtime;
}

/* ── Build Runtime from Pack Data ────────────────────────────────────── */
async function _buildRuntimeFromPackRuntime(packRuntime, fallbackPackId) {
  const runtimeData = packRuntime && typeof packRuntime === "object" ? packRuntime : null;
  const pack = runtimeData && runtimeData.pack && typeof runtimeData.pack === "object" ? runtimeData.pack : {};
  const original = pack.shimejiCompat && pack.shimejiCompat.shimejisXyzOriginal && typeof pack.shimejiCompat.shimejisXyzOriginal === "object"
    ? pack.shimejiCompat.shimejisXyzOriginal : null;
  if (!original || !_s(original.actions).trim()) {
    throw new Error("Pack runtime is missing exact shimeji action data.");
  }
  const frameImages = await _loadFrameImages(runtimeData.assets || {});
  const runtime = _buildActionRuntime(
    { actions: original.actions, behaviors: original.behaviors, sprites: original.sprites || {} },
    { packId: pack.packId || fallbackPackId || DEFAULT_PACK_ID, packName: pack.name || _friendlyPackName(pack.packId || fallbackPackId || DEFAULT_PACK_ID), frameImages }
  );
  const sheetCandidates = [];
  for (const candidate of [original.spritesheet, "spritesheet.png", "/spritesheet.png"]) {
    const trimmed = _s(candidate).trim();
    if (!trimmed) continue;
    if (runtimeData.assets && runtimeData.assets[trimmed]) sheetCandidates.push(runtimeData.assets[trimmed]);
    if (runtimeData.assets && runtimeData.assets[trimmed.replace(/^\/+/, "")]) sheetCandidates.push(runtimeData.assets[trimmed.replace(/^\/+/, "")]);
    sheetCandidates.push(trimmed);
  }
  for (const candidate of sheetCandidates) {
    try { runtime.image = await _loadImage(_resolvePackUrl(candidate)); break; } catch (_) {}
  }
  return runtime;
}

/* ── Load a Mascot Pack Runtime ──────────────────────────────────────── */
const _packRuntimePromises = new Map();
async function _loadPackRuntime(packSpec) {
  const spec = packSpec || {};
  const packId = _normalizePackId(spec.packId || DEFAULT_PACK_ID) || DEFAULT_PACK_ID;
  if (_packRuntimePromises.has(packId)) return _packRuntimePromises.get(packId);
  const pending = (async () => {
    if (spec.configPath) {
      const response = await fetch(_resolvePackUrl(spec.configPath));
      if (!response.ok) throw new Error("Failed to load " + _friendlyPackName(packId) + " config: HTTP " + response.status);
      const config = await response.json();
      const runtime = _buildActionRuntime(config, { packId, packName: spec.name || _friendlyPackName(packId) });
      const sheetPath = _s(spec.spritesheetPath || config.spritesheet).trim();
      if (sheetPath) runtime.image = await _loadImage(_resolvePackUrl(sheetPath));
      return runtime;
    }
    const response = await _runtimeMessage({ type: MASCOT_MSG.GET_ACTIVE_PACK_RUNTIME, packId });
    const packRuntime = response && response.ok && response.runtime ? response.runtime : response && response.runtime ? response.runtime : null;
    if (!packRuntime) throw new Error("Pack runtime unavailable for " + _friendlyPackName(packId) + ".");
    return await _buildRuntimeFromPackRuntime(packRuntime, packId);
  })().finally(() => { _packRuntimePromises.delete(packId); });
  _packRuntimePromises.set(packId, pending);
  return pending;
}

/* ── Discover Owned Shimeji Packs ────────────────────────────────────── */
async function _discoverOwnedShimejiPacks() {
  const localFallback = _sortPackSpecs(LOCAL_SHIMEJI_PACKS.map(entry => ({
    packId: entry.packId, name: entry.name, origin: entry.origin,
    configPath: entry.configPath, spritesheetPath: entry.spritesheetPath, source: "local"
  })));
  if (typeof chrome === "undefined" || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
    return localFallback;
  }
  try {
    await _runtimeMessage({ type: MASCOT_MSG.ENSURE_BUNDLED_REFERENCE_SHIMEJIS }).catch(() => null);
    const response = await _runtimeMessage({ type: MASCOT_MSG.LIST_PACKS });
    const packs = Array.isArray(response && response.packs) ? response.packs : [];
    const normalized = [];
    for (const row of packs) {
      const packId = _normalizePackId(row && row.packId);
      if (!packId) continue;
      const tags = Array.isArray(row && row.tags) ? row.tags.map(tag => _s(tag).toLowerCase()) : [];
      const looksShimeji = tags.includes("shimeji") || tags.includes("shimeji-ee") || _s(row && row.importType).toLowerCase() === "shimeji-ee" || !!(row && row.shimejiCompat);
      if (!looksShimeji) continue;
      const localSpec = _findLocalPackSpec(packId);
      normalized.push({
        packId, name: _s(row && row.name || (localSpec && localSpec.name) || _friendlyPackName(packId)),
        origin: _s(row && row.origin || (localSpec && localSpec.origin) || "Owned Pack"),
        configPath: localSpec && localSpec.configPath, spritesheetPath: localSpec && localSpec.spritesheetPath,
        source: localSpec ? "local" : "background"
      });
    }
    if (normalized.length) return _sortPackSpecs(normalized);
  } catch (_) {}
  return localFallback;
}

/* ── Draw Utility (from game-core.js) ────────────────────────────────── */
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
  text(ctx, text, x, y, font, color, align, outline) {
    ctx.font = font;
    ctx.textAlign = align || "center";
    if (outline) {
      ctx.strokeStyle = outline.color || "#000";
      ctx.lineWidth = outline.width || 3;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
    }
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
};

/* ── Screen Effects (from game-core.js) ──────────────────────────────── */
const ScreenFX = {
  _shake: 0, _shakeMag: 0, _flash: 0, _flashColor: "#fff",
  shake(magnitude, duration) { this._shakeMag = magnitude; this._shake = duration; },
  flash(color, duration) { this._flashColor = color; this._flash = duration; },
  update(dt) { if (this._shake > 0) this._shake -= dt; if (this._flash > 0) this._flash -= dt; },
  applyShake(ctx) {
    if (this._shake > 0) {
      const m = this._shakeMag;
      ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
    }
  },
  renderFlash(ctx, w, h) {
    if (this._flash > 0) {
      ctx.globalAlpha = Math.min(this._flash * 3, 0.6);
      ctx.fillStyle = this._flashColor;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }
  }
};

/* ── Vehicle Specs (roaming NPCs in world) ───────────────────────────── */
const VEHICLE_SPECS = {
  sedan:   { width: 38, height: 62, wheelX: 14, wheelY: 22, body: "#1a3a5a", accent: "#0d2842", roofScale: 0.55 },
  suv:     { width: 42, height: 68, wheelX: 16, wheelY: 26, body: "#2a1a3a", accent: "#1a0e28", roofScale: 0.52 },
  truck:   { width: 44, height: 72, wheelX: 16, wheelY: 28, body: "#3a2a1a", accent: "#281a0e", truckBed: true },
  cruiser: { width: 40, height: 64, wheelX: 15, wheelY: 24, body: "#0e1428", accent: "#0a0e1e", roofScale: 0.56 },
};

/* ── Building Sign Text ──────────────────────────────────────────────── */
const BUILDING_SIGN_TEXT = {
  inn: "REST INN", shop: "PIXEL PETE'S", forge: "FORGE+",
  shrine_main: "PATCH SHRINE", mine_entrance: "DATA MINE",
  tower_base: "FRAMEWORK HQ", lab_door: "MOD LAB",
  vault_gate: "VAULT LOCK", apex_throne: "APEX"
};

/* ── Regions ─────────────────────────────────────────────────────────── */
const REGIONS = [
  { id: "haven",    name: "Haven Village",      x: 100,  y: 1700, w: 900, h: 600,  base: "#0c1628", glow: "rgba(110,231,255,0.12)", tier: 0 },
  { id: "forest",   name: "Haunted Repository", x: 1050, y: 1500, w: 800, h: 700,  base: "#0a1a10", glow: "rgba(74,222,128,0.10)",  tier: 1 },
  { id: "shrine",   name: "Shrine of Patches",  x: 200,  y: 900,  w: 700, h: 600,  base: "#1a0f2e", glow: "rgba(192,132,252,0.12)", tier: 2 },
  { id: "mine",     name: "Data Mine",          x: 1000, y: 700,  w: 800, h: 700,  base: "#1c1006", glow: "rgba(251,191,36,0.10)",  tier: 2 },
  { id: "tower",    name: "Framework Tower",    x: 1900, y: 1200, w: 600, h: 800,  base: "#0f1c2e", glow: "rgba(96,165,250,0.12)",  tier: 3 },
  { id: "lab",      name: "The Mod Lab",        x: 1900, y: 400,  w: 700, h: 700,  base: "#1e0a1e", glow: "rgba(244,114,182,0.10)", tier: 3 },
  { id: "vault",    name: "Platform Vault",     x: 2700, y: 800,  w: 500, h: 600,  base: "#061e1e", glow: "rgba(45,212,191,0.10)",  tier: 4 },
  { id: "apex",     name: "Apex Sanctum",       x: 2600, y: 100,  w: 600, h: 600,  base: "#1e0606", glow: "rgba(248,113,113,0.14)", tier: 5 },
];

/* ── Buildings ───────────────────────────────────────────────────────── */
const BUILDINGS = [
  { id: "inn",       region: "haven",  x: 200,  y: 1850, w: 160, h: 120, fill: "#1a2744", roof: "#2d4472", label: "Card Inn",    interactable: true, type: "rest"     },
  { id: "shop",      region: "haven",  x: 500,  y: 1800, w: 180, h: 140, fill: "#1d2a14", roof: "#3a5228", label: "Merchant",    interactable: true, type: "shop"     },
  { id: "forge",     region: "haven",  x: 780,  y: 1900, w: 140, h: 110, fill: "#2a1814", roof: "#5a3020", label: "Equipment",   interactable: true, type: "equip"    },
  { id: "gate_forest", region: "forest", x: 1080, y: 1850, w: 100, h: 80, fill: "#14261a", roof: "#285030", label: "Forest Gate", interactable: false },
  { id: "shrine_main", region: "shrine", x: 350, y: 1050, w: 200, h: 160, fill: "#241440", roof: "#4a2880", label: "Patch Shrine", interactable: true, type: "encounter" },
  { id: "mine_entrance", region: "mine", x: 1200, y: 900, w: 180, h: 130, fill: "#302008", roof: "#604010", label: "Mine Shaft",  interactable: true, type: "encounter" },
  { id: "tower_base",  region: "tower", x: 2050, y: 1600, w: 160, h: 200, fill: "#162848", roof: "#2a4880", label: "Tower",       interactable: true, type: "encounter" },
  { id: "lab_door",    region: "lab",   x: 2100, y: 600,  w: 180, h: 140, fill: "#3a1440", roof: "#6a2870", label: "Lab",         interactable: true, type: "encounter" },
  { id: "vault_gate",  region: "vault", x: 2800, y: 950,  w: 200, h: 160, fill: "#0a3030", roof: "#186060", label: "Vault",       interactable: true, type: "encounter" },
  { id: "apex_throne", region: "apex",  x: 2780, y: 250,  w: 240, h: 200, fill: "#3a0a0a", roof: "#701818", label: "Apex Throne", interactable: true, type: "boss"     },
];

/* ── Road network ────────────────────────────────────────────────────── */
const ROADS = [
  { x1: 550,  y1: 2000, x2: 550,  y2: 1700 },   // haven vertical
  { x1: 550,  y1: 1700, x2: 1100, y2: 1700 },    // haven → forest
  { x1: 1100, y1: 1700, x2: 1400, y2: 1300 },    // forest inner
  { x1: 1400, y1: 1300, x2: 1400, y2: 900  },    // forest → mine
  { x1: 550,  y1: 1700, x2: 550,  y2: 1200 },    // haven → shrine
  { x1: 550,  y1: 1200, x2: 1200, y2: 900  },    // shrine → mine
  { x1: 1400, y1: 1300, x2: 2050, y2: 1500 },    // forest → tower
  { x1: 2050, y1: 1500, x2: 2200, y2: 800  },    // tower → lab
  { x1: 1200, y1: 900,  x2: 2100, y2: 700  },    // mine → lab
  { x1: 2200, y1: 800,  x2: 2850, y2: 1000 },    // lab → vault
  { x1: 2850, y1: 1000, x2: 2850, y2: 400  },    // vault → apex
  { x1: 2200, y1: 800,  x2: 2800, y2: 300  },    // lab → apex shortcut
];

/* ── NPCs ────────────────────────────────────────────────────────────── */
const NPCS = [
  { id: "merchant",   x: 540,  y: 1810, region: "haven",  sprite: "merchant", name: "Pixel Pete",    dialog: ["Welcome, adventurer!", "I sell cards and supplies.", "Check my wares!"], type: "shop" },
  { id: "blacksmith", x: 810,  y: 1910, region: "haven",  sprite: "smith",    name: "Forge Master",  dialog: ["Need better gear?", "I can upgrade your equipment."], type: "equip" },
  { id: "healer",     x: 240,  y: 1860, region: "haven",  sprite: "healer",   name: "Sister Debug",  dialog: ["Rest here to heal.", "Your HP and cards are restored."], type: "rest" },
  { id: "scout",      x: 1100, y: 1860, region: "forest", sprite: "scout",    name: "Byte Scout",    dialog: ["The forest is dangerous!", "Corrupted data lurks within.", "Prepare your deck!"], type: "info" },
  { id: "sage",       x: 380,  y: 1060, region: "shrine", sprite: "sage",     name: "Patch Sage",    dialog: ["Only patches can harm the spirit.", "Bring patch cards or perish."], type: "info" },
  { id: "miner",      x: 1230, y: 910,  region: "mine",   sprite: "miner",    name: "Data Miner",    dialog: ["Tokens everywhere down there!", "Clear them fast before they overwhelm you."], type: "info" },
  { id: "guardian",    x: 2780, y: 270,  region: "apex",   sprite: "guardian", name: "The Watcher",   dialog: ["The Apex Debugger awaits.", "Only the worthy may enter.", "Defeat all encounters first."], type: "info" },
];

/* ── Encounters ──────────────────────────────────────────────────────── */
const ENCOUNTERS = [
  { id: "enc_tutorial",  region: "haven",  x: 650,  y: 1950, name: "Training Dummy",        tier: 0, bossHp: 15, bossAtk: 1, difficulty: "easy",   reward: { gold: 10, xp: 5 },  desc: "A practice fight. Get your bearings." },
  { id: "enc_forest_1",  region: "forest", x: 1200, y: 1650, name: "Corrupted Clone",        tier: 1, bossHp: 25, bossAtk: 2, difficulty: "normal", reward: { gold: 20, xp: 15 }, desc: "Face corrupted clones in the repository." },
  { id: "enc_forest_2",  region: "forest", x: 1350, y: 1550, name: "Data Phantom",           tier: 1, bossHp: 28, bossAtk: 2, difficulty: "normal", reward: { gold: 20, xp: 15 }, desc: "Spectral code haunts these paths." },
  { id: "enc_shrine",    region: "shrine", x: 400,  y: 1080, name: "Shrine Spirit",          tier: 2, bossHp: 30, bossAtk: 3, difficulty: "hard",   reward: { gold: 25, xp: 20 }, desc: "Only patch cards deal damage here." },
  { id: "enc_mine",      region: "mine",   x: 1250, y: 930,  name: "Token Swarm",            tier: 2, bossHp: 30, bossAtk: 2, difficulty: "hard",   reward: { gold: 25, xp: 20 }, desc: "Boss summons 1/1 tokens every turn." },
  { id: "enc_tower",     region: "tower",  x: 2080, y: 1550, name: "Framework Guardian",     tier: 3, bossHp: 35, bossAtk: 3, difficulty: "hard",   reward: { gold: 35, xp: 25 }, desc: "Starts with 2 frameworks in play." },
  { id: "enc_lab",       region: "lab",    x: 2150, y: 650,  name: "Mod Mutant",             tier: 3, bossHp: 35, bossAtk: 3, difficulty: "hard",   reward: { gold: 35, xp: 25 }, desc: "Random mods installed each turn." },
  { id: "enc_vault",     region: "vault",  x: 2830, y: 980,  name: "Platform Sentinel",      tier: 4, bossHp: 40, bossAtk: 4, difficulty: "elite",  reward: { gold: 45, xp: 30 }, desc: "Immune to off-platform cards." },
  { id: "enc_apex",      region: "apex",   x: 2820, y: 280,  name: "Apex Debugger",          tier: 5, bossHp: 50, bossAtk: 5, difficulty: "boss",   reward: { gold: 100, xp: 75 }, desc: "Final boss. Full board, full hand, hero power every turn." },
];

/* ── Treasure Chests ─────────────────────────────────────────────────── */
const CHESTS = [
  { id: "ch_haven_1",  x: 350,  y: 1980, region: "haven",  loot: { gold: 15 } },
  { id: "ch_haven_2",  x: 750,  y: 1760, region: "haven",  loot: { gold: 20 } },
  { id: "ch_forest_1", x: 1300, y: 1700, region: "forest", loot: { gold: 25, equipId: "eq_helm_health" } },
  { id: "ch_shrine_1", x: 500,  y: 1000, region: "shrine", loot: { gold: 30, equipId: "eq_weapon_atk" } },
  { id: "ch_mine_1",   x: 1350, y: 800,  region: "mine",   loot: { gold: 35, equipId: "eq_chest_armor" } },
  { id: "ch_tower_1",  x: 2150, y: 1400, region: "tower",  loot: { gold: 40, equipId: "eq_boots_speed" } },
  { id: "ch_lab_1",    x: 2300, y: 500,  region: "lab",    loot: { gold: 45, equipId: "eq_ring_gold" } },
  { id: "ch_vault_1",  x: 2900, y: 900,  region: "vault",  loot: { gold: 60, equipId: "eq_ring_xp" } },
];

/* ── Equipment DB ────────────────────────────────────────────────────── */
const EQUIPMENT = [
  { id: "eq_helm_health",    name: "Debugger's Helm",         desc: "+5 starting HP",                 slot: "helm",   stat: { hp: 5 },               icon: "\u{1F6E1}" },
  { id: "eq_helm_draw",      name: "Analyst's Cap",           desc: "Draw 1 extra card turn 1",       slot: "helm",   stat: { extraDraw: 1 },        icon: "\u{1F393}" },
  { id: "eq_chest_armor",    name: "Contributor's Plate",     desc: "+3 armor at match start",        slot: "chest",  stat: { armor: 3 },            icon: "\u{1F6E1}" },
  { id: "eq_chest_mana",     name: "Maintainer's Robe",       desc: "+1 starting mana",               slot: "chest",  stat: { bonusMana: 1 },        icon: "\u{1F52E}" },
  { id: "eq_weapon_atk",     name: "Forked Blade",            desc: "Hero power deals +1 damage",     slot: "weapon", stat: { heroPowerBonus: 1 },   icon: "\u{2694}" },
  { id: "eq_weapon_sweep",   name: "Merge Hammer",            desc: "Hero power hits 2 targets",      slot: "weapon", stat: { heroPowerMulti: true }, icon: "\u{1F528}" },
  { id: "eq_boots_speed",    name: "Sprint Boots",            desc: "Minions get +1 atk on summon",   slot: "boots",  stat: { rushBuff: 1 },         icon: "\u{1F45F}" },
  { id: "eq_boots_dodge",    name: "Dodge Sandals",           desc: "25% avoid first hit",            slot: "boots",  stat: { dodgeChance: 0.25 },   icon: "\u{1F4A8}" },
  { id: "eq_ring_gold",      name: "Prospector's Ring",       desc: "+10 gold per victory",           slot: "ring",   stat: { bonusGold: 10 },       icon: "\u{1F48D}" },
  { id: "eq_ring_xp",        name: "Scholar's Band",          desc: "+15 XP per encounter",           slot: "ring",   stat: { bonusXp: 15 },         icon: "\u{1F4D6}" },
];

/* ── Synth Sound Helpers ─────────────────────────────────────────────── */
let _actx = null;
function _snd(type, freq, dur, shape, vol, detune, sweepTo) {
  try {
    if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
    const now = _actx.currentTime;
    const osc = _actx.createOscillator();
    const gain = _actx.createGain();
    const filter = _actx.createBiquadFilter();
    osc.type = shape || "sine";
    filter.type = type || "lowpass";
    filter.frequency.value = 2000;
    osc.frequency.setValueAtTime(freq, now);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, now + dur);
    if (detune) osc.detune.value = detune;
    gain.gain.setValueAtTime(vol || 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(filter); filter.connect(gain); gain.connect(_actx.destination);
    osc.start(now); osc.stop(now + dur);
  } catch {}
}
const SFX = {
  step:    () => _snd("highpass", 200, 0.06, "square", 0.04),
  jump:    () => _snd("lowpass", 280, 0.15, "triangle", 0.10, 0, 560),
  land:    () => _snd("lowpass", 120, 0.08, "sawtooth", 0.08),
  pickup:  () => _snd("lowpass", 520, 0.18, "sine", 0.12, 0, 910),
  chest:   () => _snd("lowpass", 440, 0.3, "triangle", 0.14, 0, 880),
  hit:     () => _snd("bandpass", 200, 0.12, "sawtooth", 0.10),
  heal:    () => _snd("lowpass", 330, 0.25, "sine", 0.10, 0, 660),
  encounter: () => { _snd("bandpass", 330, 0.2, "triangle", 0.12); setTimeout(() => _snd("bandpass", 660, 0.25, "triangle", 0.10), 200); },
  victory: () => { _snd("lowpass", 440, 0.15, "sine", 0.10); setTimeout(() => _snd("lowpass", 554, 0.15, "sine", 0.10), 150); setTimeout(() => _snd("lowpass", 660, 0.3, "sine", 0.12), 300); },
  defeat:  () => { _snd("lowpass", 330, 0.2, "sawtooth", 0.08); setTimeout(() => _snd("lowpass", 220, 0.3, "sawtooth", 0.10), 200); },
  boss:    () => { _snd("lowpass", 110, 0.4, "sawtooth", 0.14); setTimeout(() => _snd("bandpass", 220, 0.3, "square", 0.08), 400); },
  equip:   () => _snd("highpass", 600, 0.12, "triangle", 0.08, 0, 1200),
  dialog:  () => _snd("lowpass", 400, 0.05, "square", 0.04),
  perspective: () => _snd("bandpass", 500, 0.15, "sine", 0.08, 0, 800),
};

/* ═══════════════════════════════════════════════════════════════════════════
   Particle System
   ═══════════════════════════════════════════════════════════════════════════ */
const MAX_PARTICLES = 600;
function createParticlePool() {
  const pool = [];
  for (let i = 0; i < MAX_PARTICLES; i++) pool.push({ alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, r: 2, color: "#fff", alpha: 1, type: "circle" });
  return {
    pool,
    emit(x, y, count, opts = {}) {
      let emitted = 0;
      for (const p of pool) {
        if (p.alive || emitted >= count) continue;
        p.alive = true;
        p.x = x + (Math.random() - 0.5) * (opts.spread || 10);
        p.y = y + (Math.random() - 0.5) * (opts.spread || 10);
        p.vx = (Math.random() - 0.5) * (opts.speed || 80);
        p.vy = (Math.random() - 0.5) * (opts.speed || 80) + (opts.vy || 0);
        p.life = 0;
        p.maxLife = (opts.life || 0.6) + Math.random() * (opts.lifeVar || 0.3);
        p.r = (opts.r || 2) + Math.random() * (opts.rVar || 1);
        p.color = opts.color || "#fff";
        p.alpha = 1;
        p.type = opts.type || "circle";
        emitted++;
      }
    },
    update(dt) {
      for (const p of pool) {
        if (!p.alive) continue;
        p.life += dt;
        if (p.life >= p.maxLife) { p.alive = false; continue; }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 60 * dt; // slight gravity
        p.alpha = 1 - (p.life / p.maxLife);
      }
    },
    draw(ctx, camX, camY) {
      for (const p of pool) {
        if (!p.alive) continue;
        const sx = p.x - camX, sy = p.y - camY;
        if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Adventure State Factory
   ═══════════════════════════════════════════════════════════════════════════ */
function createAdventureState() {
  return {
    phase: "explore",         // "explore" | "dialog" | "encounter" | "battle" | "shop" | "equip" | "chest" | "victory" | "gameover" | "paused"
    player: {
      x: 400, y: 1950,       // world coords — start in Haven
      vx: 0, vy: 0,
      jumpZ: 0, jumpVz: 0,   // vertical for jump anim
      facing: 1,              // 1 right, -1 left
      hp: 30, maxHp: 30,
      gold: 50,
      xp: 0,
      level: 1,
      sprinting: false,
      grounded: true,
      interiorId: null,
    },
    camera: { x: 0, y: 0, zoom: 1 },
    perspective: "topdown",   // "topdown" | "side" | "firstperson"
    defeatedEncounters: [],
    openedChests: [],
    collectedEquipment: [],
    equippedItems: {},        // slot → equipId
    currentEncounter: null,   // active encounter data
    currentNpc: null,         // active NPC dialog
    currentChest: null,       // active chest
    dialogIndex: 0,
    battleResult: null,       // "won" | "lost" | null
    totalPlayTime: 0,
    notifications: [],        // { text, time, color }
    discoveredRegions: ["haven"],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: createAdventureMode()
   ═══════════════════════════════════════════════════════════════════════════ */
export function createAdventureMode(container, profile, callbacks = {}) {
  /* ── DOM setup ─────────────────────────────────────────────────────── */
  const wrapper = document.createElement("div");
  wrapper.className = "cg-adv-wrapper";
  wrapper.style.cssText = "position:relative;width:100%;aspect-ratio:8/5;max-width:800px;margin:0 auto;border-radius:10px;overflow:hidden;background:#050814;";

  const cvs = document.createElement("canvas");
  cvs.width = W; cvs.height = H;
  cvs.style.cssText = "width:100%;height:100%;display:block;image-rendering:pixelated;";
  const ctx = cvs.getContext("2d");
  wrapper.appendChild(cvs);

  /* HUD overlay */
  const hud = document.createElement("div");
  hud.className = "cg-adv-hud";
  hud.style.cssText = "position:absolute;inset:0;pointer-events:none;font-family:'Segoe UI',system-ui,sans-serif;";
  wrapper.appendChild(hud);

  /* Dialog overlay */
  const dialogEl = document.createElement("div");
  dialogEl.className = "cg-adv-dialog";
  dialogEl.style.cssText = "display:none;position:absolute;bottom:8px;left:8px;right:8px;background:rgba(10,15,30,0.94);border:1px solid rgba(110,231,255,0.3);border-radius:8px;padding:12px 16px;pointer-events:auto;cursor:pointer;z-index:10;";
  wrapper.appendChild(dialogEl);

  /* Notification area */
  const notifEl = document.createElement("div");
  notifEl.className = "cg-adv-notifs";
  notifEl.style.cssText = "position:absolute;top:8px;right:8px;pointer-events:none;z-index:12;display:flex;flex-direction:column;gap:4px;align-items:flex-end;";
  wrapper.appendChild(notifEl);

  container.innerHTML = "";
  container.appendChild(wrapper);

  /* ── State ─────────────────────────────────────────────────────────── */
  const S = loadAdventureState(profile);
  const particles = createParticlePool();
  const keys = {};
  let running = true;
  let lastTime = 0;
  let stepTimer = 0;
  let ambientTimer = 0;
  let interactTarget = null;  // nearest interactable (NPC/chest/encounter/building)

  /* ── Mascot runtime (loaded async) ─────────────────────────────────── */
  let runtime = null;           // loaded pack runtime with drawActor
  let runtimeError = "";        // error message if pack load fails
  let playerAnimator = null;    // player mascot animator
  let npcAnimators = new Map(); // npc.id → animator (each NPC gets a unique pack)
  let markerPulse = 0;          // for animated elements (windows, signs, etc.)

  /* ── Weather State ─────────────────────────────────────────────────── */
  const weather = {
    rainPhase: 0,
    lightningTimer: 0,
    lightningFlash: 0,
    fogAlpha: 0.05,
  };

  /* ── Vehicles (ambient world traffic) ──────────────────────────────── */
  const vehicles = [];
  function seedVehicles() {
    const models = Object.keys(VEHICLE_SPECS);
    for (let i = 0; i < 8; i++) {
      const road = ROADS[i % ROADS.length];
      const t = 0.2 + Math.random() * 0.6;
      vehicles.push({
        x: road.x1 + (road.x2 - road.x1) * t,
        y: road.y1 + (road.y2 - road.y1) * t,
        angle: Math.atan2(road.y2 - road.y1, road.x2 - road.x1),
        speed: 20 + Math.random() * 40,
        model: models[i % models.length],
        roadIdx: i % ROADS.length,
        highlight: 0,
      });
    }
  }
  seedVehicles();

  /* ── Load saved state from profile ─────────────────────────────────── */
  function loadAdventureState(prof) {
    const saved = prof?.adventureRun;
    if (saved && saved.worldState) {
      return { ...createAdventureState(), ...saved.worldState };
    }
    return createAdventureState();
  }

  /* ── Save to profile ──────────────────────────────────────────────── */
  function saveState() {
    if (!callbacks.onSave) return;
    callbacks.onSave({
      worldState: {
        phase: S.phase,
        player: { ...S.player },
        perspective: S.perspective,
        defeatedEncounters: [...S.defeatedEncounters],
        openedChests: [...S.openedChests],
        collectedEquipment: [...S.collectedEquipment],
        equippedItems: { ...S.equippedItems },
        totalPlayTime: S.totalPlayTime,
        discoveredRegions: [...S.discoveredRegions],
      },
    });
  }

  /* ── Notifications ─────────────────────────────────────────────────── */
  function notify(text, color = "#6ee7ff") {
    S.notifications.push({ text, time: 3, color });
  }

  /* ── Input ─────────────────────────────────────────────────────────── */
  function onKeyDown(e) {
    keys[e.key.toLowerCase()] = true;
    if (e.key === "e" || e.key === "E") handleInteract();
    if (e.key === "p" || e.key === "P" || e.key === "Escape") togglePause();
    if (e.key === "v" || e.key === "V") cyclePerspective();
    if (e.key === "m" || e.key === "M") toggleMinimap();
    if (e.key === "i" || e.key === "I") toggleInventory();
    if (e.key === " ") handleJump();
  }
  function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }

  cvs.setAttribute("tabindex", "0");
  cvs.addEventListener("keydown", onKeyDown);
  cvs.addEventListener("keyup", onKeyUp);
  cvs.addEventListener("click", () => {
    cvs.focus();
    if (S.phase === "dialog") advanceDialog();
  });
  dialogEl.addEventListener("click", () => advanceDialog());
  cvs.focus();

  let showMinimap = true;
  let showInventory = false;

  function togglePause() {
    if (S.phase === "explore") { S.phase = "paused"; }
    else if (S.phase === "paused") { S.phase = "explore"; }
  }
  function cyclePerspective() {
    const modes = ["topdown", "side", "firstperson"];
    const idx = modes.indexOf(S.perspective);
    S.perspective = modes[(idx + 1) % modes.length];
    SFX.perspective();
    notify(`Perspective: ${S.perspective === "topdown" ? "Top-Down" : S.perspective === "side" ? "Side-Scroll" : "First-Person"}`);
  }
  function toggleMinimap() { showMinimap = !showMinimap; }
  function toggleInventory() { showInventory = !showInventory; }

  /* ── Interaction ───────────────────────────────────────────────────── */
  function handleInteract() {
    if (S.phase === "dialog") { advanceDialog(); return; }
    if (S.phase !== "explore" || !interactTarget) return;

    const t = interactTarget;
    if (t._type === "npc") {
      S.phase = "dialog";
      S.currentNpc = t;
      S.dialogIndex = 0;
      showDialog(t.name, t.dialog[0]);
      SFX.dialog();
    } else if (t._type === "encounter") {
      if (S.defeatedEncounters.includes(t.id)) {
        notify("Already cleared!", "#fbbf24");
        return;
      }
      S.phase = "encounter";
      S.currentEncounter = t;
      SFX.encounter();
    } else if (t._type === "chest") {
      if (S.openedChests.includes(t.id)) {
        notify("Already opened!", "#fbbf24");
        return;
      }
      openChest(t);
    } else if (t._type === "building") {
      if (t.type === "rest") { healPlayer(); }
      else if (t.type === "shop") { openShop(); }
      else if (t.type === "equip") { openEquipment(); }
      else if (t.type === "encounter") {
        const enc = ENCOUNTERS.find(e => e.region === t.region);
        if (enc && !S.defeatedEncounters.includes(enc.id)) {
          S.phase = "encounter";
          S.currentEncounter = enc;
          SFX.encounter();
        }
      }
    }
  }

  /* ── Dialog ────────────────────────────────────────────────────────── */
  function showDialog(name, text) {
    dialogEl.style.display = "block";
    dialogEl.innerHTML = `<div style="color:#6ee7ff;font-weight:700;font-size:13px;margin-bottom:4px;">${escHtml(name)}</div><div style="color:#e2e8f0;font-size:12px;line-height:1.5;">${escHtml(text)}</div><div style="color:rgba(255,255,255,0.3);font-size:10px;margin-top:6px;">Click or press E to continue</div>`;
  }
  function advanceDialog() {
    if (S.phase !== "dialog" || !S.currentNpc) return;
    S.dialogIndex++;
    SFX.dialog();
    if (S.dialogIndex >= S.currentNpc.dialog.length) {
      // Dialog done — execute NPC type action
      dialogEl.style.display = "none";
      const npcType = S.currentNpc.type;
      S.currentNpc = null;
      S.dialogIndex = 0;
      if (npcType === "shop") { openShop(); }
      else if (npcType === "equip") { openEquipment(); }
      else if (npcType === "rest") { healPlayer(); }
      else { S.phase = "explore"; }
    } else {
      showDialog(S.currentNpc.name, S.currentNpc.dialog[S.dialogIndex]);
    }
  }

  /* ── Chest ─────────────────────────────────────────────────────────── */
  function openChest(chest) {
    S.openedChests.push(chest.id);
    S.player.gold += chest.loot.gold || 0;
    SFX.chest();
    particles.emit(chest.x, chest.y, 30, { color: "#ffd700", speed: 120, life: 0.8 });
    notify(`+${chest.loot.gold} Gold!`, "#ffd700");
    if (chest.loot.equipId) {
      const eq = EQUIPMENT.find(e => e.id === chest.loot.equipId);
      if (eq && !S.collectedEquipment.includes(eq.id)) {
        S.collectedEquipment.push(eq.id);
        notify(`Found: ${eq.name}!`, "#c084fc");
      }
    }
    saveState();
  }

  /* ── Heal ──────────────────────────────────────────────────────────── */
  function healPlayer() {
    S.player.hp = S.player.maxHp;
    SFX.heal();
    particles.emit(S.player.x, S.player.y - 16, 20, { color: "#4ade80", speed: 60, vy: -40, life: 0.6 });
    notify("HP restored!", "#4ade80");
    S.phase = "explore";
    saveState();
  }

  /* ── Shop ──────────────────────────────────────────────────────────── */
  function openShop() {
    S.phase = "shop";
    // Shop handled via HUD overlay
  }

  /* ── Equipment ─────────────────────────────────────────────────────── */
  function openEquipment() {
    S.phase = "equip";
    // Equipment screen handled via HUD overlay
  }

  /* ── Jump ──────────────────────────────────────────────────────────── */
  function handleJump() {
    if (S.phase !== "explore") return;
    if (S.player.grounded) {
      S.player.jumpVz = JUMP_VEL;
      S.player.grounded = false;
      SFX.jump();
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Encounter → Card Battle Bridge
     ═══════════════════════════════════════════════════════════════════════ */
  function startBattle() {
    if (!S.currentEncounter) return;
    const enc = S.currentEncounter;
    S.phase = "battle";

    // Apply equipment bonuses
    const bonuses = computeEquipmentBonuses();

    // Call back to card game to start a match with this encounter's parameters
    callbacks.onStartBattle?.({
      encounterId: enc.id,
      encounterName: enc.name,
      encounterDesc: enc.desc,
      bossHp: enc.bossHp + (enc.tier * 2),
      bossAtk: enc.bossAtk,
      difficulty: enc.difficulty,
      tier: enc.tier,
      bonuses, // { hp, armor, extraDraw, bonusMana, heroPowerBonus, rushBuff, dodgeChance }
      onBattleEnd: (result) => {
        S.battleResult = result;
        if (result === "won") {
          S.defeatedEncounters.push(enc.id);
          S.player.gold += enc.reward.gold + (bonuses.bonusGold || 0);
          S.player.xp += enc.reward.xp + (bonuses.bonusXp || 0);
          checkLevelUp();
          SFX.victory();
          particles.emit(S.player.x, S.player.y - 20, 50, { color: "#ffd700", speed: 140, life: 1.2, spread: 30 });
          notify(`Victory! +${enc.reward.gold} Gold, +${enc.reward.xp} XP`, "#4ade80");

          // Discover adjacent regions
          const region = REGIONS.find(r => r.id === enc.region);
          if (region) discoverAdjacentRegions(region);

          // Check for game completion
          if (enc.id === "enc_apex") {
            S.phase = "victory";
            notify("Adventure Complete! You defeated the Apex Debugger!", "#ffd700");
            callbacks.onAdventureComplete?.();
          } else {
            S.phase = "explore";
          }
        } else {
          S.player.hp = Math.max(1, Math.floor(S.player.maxHp * 0.5));
          SFX.defeat();
          notify("Defeated! You retreat to recover...", "#f87171");
          // Teleport back to haven
          S.player.x = 400; S.player.y = 1950;
          S.phase = "explore";
        }
        S.currentEncounter = null;
        saveState();
      },
    });
  }

  function computeEquipmentBonuses() {
    const b = { hp: 0, armor: 0, extraDraw: 0, bonusMana: 0, heroPowerBonus: 0, heroPowerMulti: false, rushBuff: 0, dodgeChance: 0, bonusGold: 0, bonusXp: 0 };
    for (const slot of Object.keys(S.equippedItems)) {
      const eqId = S.equippedItems[slot];
      const eq = EQUIPMENT.find(e => e.id === eqId);
      if (!eq) continue;
      for (const [k, v] of Object.entries(eq.stat)) {
        if (typeof v === "boolean") b[k] = v;
        else b[k] = (b[k] || 0) + v;
      }
    }
    return b;
  }

  function checkLevelUp() {
    const needed = S.player.level * 40;
    while (S.player.xp >= needed) {
      S.player.xp -= needed;
      S.player.level++;
      S.player.maxHp += 3;
      S.player.hp = S.player.maxHp;
      notify(`Level Up! Now level ${S.player.level}!`, "#fbbf24");
      particles.emit(S.player.x, S.player.y, 40, { color: "#fbbf24", speed: 100, life: 0.8 });
    }
  }

  function discoverAdjacentRegions(currentRegion) {
    for (const r of REGIONS) {
      if (S.discoveredRegions.includes(r.id)) continue;
      const dx = (r.x + r.w / 2) - (currentRegion.x + currentRegion.w / 2);
      const dy = (r.y + r.h / 2) - (currentRegion.y + currentRegion.h / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1200) {
        S.discoveredRegions.push(r.id);
        notify(`Discovered: ${r.name}!`, r.glow.replace("0.1", "1").replace("0.12", "1").replace("0.14", "1"));
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Game Loop
     ═══════════════════════════════════════════════════════════════════════ */
  function tick(ts) {
    if (!running) return;
    const dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    // Global timers
    markerPulse += dt;
    ScreenFX.update(dt);

    // Weather
    weather.rainPhase += dt * 0.5;
    if (weather.lightningTimer > 0) {
      weather.lightningTimer -= dt;
    } else if (Math.random() < 0.001) {
      weather.lightningTimer = 0.15;
      weather.lightningFlash = 0.3;
      ScreenFX.flash("rgba(200,220,255,0.15)", 0.12);
    }
    if (weather.lightningFlash > 0) weather.lightningFlash -= dt;

    // Vehicles
    for (const v of vehicles) {
      const road = ROADS[v.roadIdx];
      const dx = road.x2 - road.x1, dy = road.y2 - road.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      v.x += (dx / len) * v.speed * dt;
      v.y += (dy / len) * v.speed * dt;
      // Loop vehicle when it reaches road end
      const t = ((v.x - road.x1) * dx + (v.y - road.y1) * dy) / (len * len);
      if (t > 1 || t < 0) {
        v.roadIdx = Math.floor(Math.random() * ROADS.length);
        const nr = ROADS[v.roadIdx];
        v.x = nr.x1 + (nr.x2 - nr.x1) * 0.1;
        v.y = nr.y1 + (nr.y2 - nr.y1) * 0.1;
        v.angle = Math.atan2(nr.y2 - nr.y1, nr.x2 - nr.x1);
      }
      // Distance to player for highlight
      const pdx = S.player.x - v.x, pdy = S.player.y - v.y;
      v.highlight = Math.sqrt(pdx * pdx + pdy * pdy) < 80 ? 1 : Math.max(0, v.highlight - dt * 3);
    }

    // Update mascot animators
    if (playerAnimator) {
      const p = S.player;
      const isMoving = Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10;
      const isSprinting = p.sprinting && isMoving;
      const isJumping = !p.grounded && p.jumpVz < 0;
      const isFalling = !p.grounded && p.jumpVz >= 0;
      if (isJumping) playerAnimator.setAction("jump");
      else if (isFalling) playerAnimator.setAction("fall");
      else if (isSprinting) playerAnimator.setAction("run");
      else if (isMoving) playerAnimator.setAction("walk");
      else playerAnimator.setAction("idle");
      playerAnimator.facing = p.facing;
      playerAnimator.update(dt);
    }
    for (const [npcId, anim] of npcAnimators) {
      // NPCs idle or sit
      const npc = NPCS.find(n => n.id === npcId);
      if (npc) {
        const nearPlayer = Math.abs(S.player.x - npc.x) < 80 && Math.abs(S.player.y - npc.y) < 80;
        anim.setAction(nearPlayer ? "idle" : "sit");
      }
      anim.update(dt);
    }

    if (S.phase === "explore" || S.phase === "dialog") {
      updateExplore(dt);
    }
    if (S.phase !== "battle") {
      updateCamera(dt);
      particles.update(dt);
      updateNotifications(dt);
      render(ctx);
      renderHUD();
    }
    S.totalPlayTime += dt;
    requestAnimationFrame(tick);
  }

  /* ── Update: Exploration ───────────────────────────────────────────── */
  function updateExplore(dt) {
    const p = S.player;
    const moving = S.phase === "explore";

    // Movement
    let mx = 0, my = 0;
    if (moving) {
      if (keys["a"] || keys["arrowleft"])  mx -= 1;
      if (keys["d"] || keys["arrowright"]) mx += 1;
      if (keys["w"] || keys["arrowup"])    my -= 1;
      if (keys["s"] || keys["arrowdown"])  my += 1;
    }

    p.sprinting = !!(keys["shift"]);
    const speed = PLAYER_SPEED * (p.sprinting ? SPRINT_MULT : 1);

    if (mx || my) {
      const len = Math.sqrt(mx * mx + my * my);
      mx /= len; my /= len;
      p.vx = mx * speed;
      p.vy = my * speed;
      if (mx !== 0) p.facing = mx > 0 ? 1 : -1;

      // Footstep particles
      stepTimer += dt;
      if (stepTimer > (p.sprinting ? 0.15 : 0.25)) {
        stepTimer = 0;
        particles.emit(p.x - p.facing * 4, p.y + 8, 2, { color: "#ffffff20", speed: 15, life: 0.3, r: 1.5, rVar: 0.5 });
        SFX.step();
      }
    } else {
      p.vx *= 0.8;
      p.vy *= 0.8;
      if (Math.abs(p.vx) < 1) p.vx = 0;
      if (Math.abs(p.vy) < 1) p.vy = 0;
    }

    // Apply velocity + collision
    const nx = p.x + p.vx * dt;
    const ny = p.y + p.vy * dt;

    // Building collision
    let blocked = false;
    for (const b of BUILDINGS) {
      if (nx > b.x && nx < b.x + b.w && ny > b.y && ny < b.y + b.h) {
        blocked = true; break;
      }
    }
    if (!blocked) {
      p.x = Math.max(20, Math.min(WORLD_W - 20, nx));
      p.y = Math.max(20, Math.min(WORLD_H - 20, ny));
    }

    // Jump physics
    if (!p.grounded) {
      p.jumpVz += GRAVITY * dt;
      p.jumpZ += p.jumpVz * dt;
      if (p.jumpZ >= 0) {
        p.jumpZ = 0;
        p.jumpVz = 0;
        p.grounded = true;
        SFX.land();
        particles.emit(p.x, p.y + 8, 5, { color: "rgba(255,255,255,0.15)", speed: 30, life: 0.2 });
      }
    }

    // Discover regions
    for (const r of REGIONS) {
      if (S.discoveredRegions.includes(r.id)) continue;
      if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) {
        S.discoveredRegions.push(r.id);
        notify(`Discovered: ${r.name}`, "#6ee7ff");
      }
    }

    // Find nearest interactable
    interactTarget = findNearestInteractable();

    // Ambient particles
    ambientTimer += dt;
    if (ambientTimer > 0.4) {
      ambientTimer = 0;
      const region = getCurrentRegion();
      if (region) {
        const rx = S.camera.x + Math.random() * W;
        const ry = S.camera.y + Math.random() * H;
        const c = region.glow.replace(/[\d.]+\)/, "0.5)");
        particles.emit(rx, ry, 1, { color: c, speed: 8, vy: -15, life: 2, r: 1.5, rVar: 1 });
      }
    }
  }

  function getCurrentRegion() {
    const p = S.player;
    return REGIONS.find(r => p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) || REGIONS[0];
  }

  function findNearestInteractable() {
    const p = S.player;
    let best = null, bestDist = INTERACT_DIST;

    // NPCs
    for (const npc of NPCS) {
      const dx = p.x - npc.x, dy = p.y - npc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; best = { ...npc, _type: "npc" }; }
    }
    // Encounters
    for (const enc of ENCOUNTERS) {
      if (S.defeatedEncounters.includes(enc.id)) continue;
      const dx = p.x - enc.x, dy = p.y - enc.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; best = { ...enc, _type: "encounter" }; }
    }
    // Chests
    for (const ch of CHESTS) {
      if (S.openedChests.includes(ch.id)) continue;
      const dx = p.x - ch.x, dy = p.y - ch.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) { bestDist = dist; best = { ...ch, _type: "chest" }; }
    }
    // Buildings
    for (const b of BUILDINGS) {
      if (!b.interactable) continue;
      const bx = b.x + b.w / 2, by = b.y + b.h;
      const dx = p.x - bx, dy = p.y - by;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist + 30) { bestDist = dist; best = { ...b, _type: "building" }; }
    }
    return best;
  }

  /* ── Camera ────────────────────────────────────────────────────────── */
  function updateCamera(dt) {
    const targetX = S.player.x - W / 2;
    const targetY = S.player.y - H / 2;
    S.camera.x += (targetX - S.camera.x) * CAM_LERP * 60 * dt;
    S.camera.y += (targetY - S.camera.y) * CAM_LERP * 60 * dt;
    S.camera.x = Math.max(0, Math.min(WORLD_W - W, S.camera.x));
    S.camera.y = Math.max(0, Math.min(WORLD_H - H, S.camera.y));
  }

  function updateNotifications(dt) {
    for (let i = S.notifications.length - 1; i >= 0; i--) {
      S.notifications[i].time -= dt;
      if (S.notifications[i].time <= 0) S.notifications.splice(i, 1);
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Rendering
     ═══════════════════════════════════════════════════════════════════════ */
  function render(ctx) {
    const cx = S.camera.x, cy = S.camera.y;
    ctx.clearRect(0, 0, W, H);

    if (S.perspective === "topdown") {
      renderTopDown(ctx, cx, cy);
    } else if (S.perspective === "side") {
      renderSideScroll(ctx, cx, cy);
    } else {
      renderFirstPerson(ctx, cx, cy);
    }

    // ── Vignette overlay (all perspectives) ──
    const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.18, W * 0.5, H * 0.46, W * 0.72);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.42)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    // ── Screen flash (damage, lightning etc) ──
    ScreenFX.renderFlash(ctx, W, H);
  }

  /* ── TOP-DOWN VIEW (GTA-quality rendering) ──────────────────────────── */
  function renderTopDown(ctx, cx, cy) {
    // ── Sky / Backdrop ──
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#02040b");
    bg.addColorStop(0.24, "#0b1430");
    bg.addColorStop(0.64, "#101a34");
    bg.addColorStop(1, "#040813");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Moon / haze glow
    const haze = ctx.createRadialGradient(W * 0.78, H * 0.16, 20, W * 0.78, H * 0.16, 260);
    haze.addColorStop(0, "rgba(137, 200, 255, 0.26)");
    haze.addColorStop(0.28, "rgba(111, 150, 255, 0.14)");
    haze.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, W, H);

    // Parallax skyline silhouettes (4 layers)
    for (let layer = 0; layer < 4; layer++) {
      const baseY = 140 + layer * 44;
      ctx.fillStyle = layer === 0 ? "rgba(8, 16, 34, 0.94)" : layer === 1 ? "rgba(10, 18, 38, 0.72)" : "rgba(13, 22, 43, 0.58)";
      for (let i = 0; i < 10; i++) {
        const width = 64 + ((i * 37 + layer * 19) % 120);
        const height = 54 + ((i * 53 + layer * 23) % 120);
        const x = -20 + i * 118 + layer * 18;
        const y = baseY - height;
        Draw.roundRect(ctx, x, y, width, height + 18, 10, ctx.fillStyle);
        if (layer < 2) {
          ctx.fillStyle = "rgba(121, 178, 255, 0.05)";
          for (let wy = y + 18; wy < baseY - 12; wy += 12) {
            for (let wx = x + 10; wx < x + width - 10; wx += 18) {
              ctx.fillRect(wx, wy, 6, 3);
            }
          }
          ctx.fillStyle = layer === 0 ? "rgba(8, 16, 34, 0.94)" : "rgba(10, 18, 38, 0.72)";
        }
      }
    }

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 28; i++) {
      const x = (i * 71 + 28) % W;
      const y = 24 + ((i * 47) % 110);
      ctx.beginPath();
      ctx.arc(x, y, (i % 3) + 1, 0, TAU);
      ctx.fill();
    }

    // Rain streaks (backdrop)
    for (let i = 0; i < 30; i++) {
      const x = (i * 97 + (weather.rainPhase * 120)) % W;
      const y = (i * 61 + weather.rainPhase * 180) % H;
      ctx.fillStyle = "rgba(120,180,255,0.12)";
      ctx.fillRect(x, y, 2, 16);
    }

    // ── World content (camera-translated) ──
    ctx.save();
    ScreenFX.applyShake(ctx);
    ctx.translate(-cx, -cy);

    // ── Districts (gradient fills) ──
    for (const r of REGIONS) {
      if (!S.discoveredRegions.includes(r.id)) continue;
      const grad = ctx.createLinearGradient(r.x, r.y, r.x + r.w, r.y + r.h);
      grad.addColorStop(0, r.base);
      grad.addColorStop(1, "#050814");
      ctx.fillStyle = grad;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = r.glow;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      // Region name
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(r.name, r.x + r.w / 2, r.y + 16);
    }

    // ── Roads with lane markings ──
    ctx.lineWidth = 74;
    ctx.lineCap = "round";
    for (const road of ROADS) {
      // Road body
      ctx.strokeStyle = "rgba(22,27,46,0.95)";
      ctx.lineWidth = 74;
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
      // Center lane markings
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 4;
      ctx.setLineDash([18, 18]);
      ctx.beginPath();
      ctx.moveTo(road.x1, road.y1);
      ctx.lineTo(road.x2, road.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Streetlamps at road endpoints
    const lampNodes = new Set();
    for (const road of ROADS) {
      lampNodes.add(road.x1 + "," + road.y1);
      lampNodes.add(road.x2 + "," + road.y2);
    }
    for (const key of lampNodes) {
      const [nx, ny] = key.split(",").map(Number);
      const sx = nx - cx, sy = ny - cy;
      if (sx < -100 || sx > W + 100 || sy < -100 || sy > H + 100) continue;
      // Light pool
      const pool = ctx.createRadialGradient(nx, ny, 4, nx, ny, 96);
      pool.addColorStop(0, "rgba(255, 216, 124, 0.18)");
      pool.addColorStop(0.45, "rgba(255, 206, 118, 0.08)");
      pool.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pool;
      ctx.fillRect(nx - 96, ny - 96, 192, 192);
      // Lamp post
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.fillRect(nx - 2, ny - 86, 4, 44);
      // Lamp globe
      ctx.fillStyle = "rgba(255, 240, 184, 0.8)";
      ctx.beginPath();
      ctx.arc(nx, ny - 88, 4, 0, TAU);
      ctx.fill();
    }

    // ── Buildings (detailed with shadows, windows, signs, glows) ──
    for (const b of BUILDINGS) {
      if (b.x + b.w < cx - 50 || b.x > cx + W + 50 || b.y + b.h < cy - 50 || b.y > cy + H + 50) continue;
      const signText = BUILDING_SIGN_TEXT[b.id] || "";

      // Shadow
      Draw.roundRect(ctx, b.x + 14, b.y + 22, b.w, b.h, 24, "rgba(2, 6, 18, 0.42)");
      // Main structure
      Draw.roundRect(ctx, b.x, b.y, b.w, b.h, 22, b.fill);
      // Facade glow gradient
      const facadeGlow = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.h);
      facadeGlow.addColorStop(0, "rgba(255,255,255,0.08)");
      facadeGlow.addColorStop(0.34, "rgba(255,255,255,0.03)");
      facadeGlow.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.fillStyle = facadeGlow;
      Draw.roundRect(ctx, b.x, b.y, b.w, b.h, 22, facadeGlow);
      // Roof
      Draw.roundRect(ctx, b.x + 14, b.y + 14, b.w - 28, 54, 18, b.roof);
      // Door
      ctx.fillStyle = "rgba(8, 12, 24, 0.6)";
      Draw.roundRect(ctx, b.x + b.w * 0.5 - 24, b.y + b.h - 56, 48, 42, 10, "rgba(8, 12, 24, 0.6)");
      ctx.fillStyle = "rgba(255, 243, 204, 0.18)";
      ctx.fillRect(b.x + b.w * 0.5 - 14, b.y + b.h - 44, 28, 30);
      // Interactable door glow
      if (b.interactable) {
        ctx.fillStyle = "rgba(110,231,255,0.2)";
        ctx.fillRect(b.x + b.w * 0.5 - 16, b.y + b.h - 8, 32, 8);
      }
      // Windows (animated lit/unlit)
      for (let wy = b.y + 92; wy < b.y + b.h - 34; wy += 34) {
        for (let wx = b.x + 28; wx < b.x + b.w - 32; wx += 42) {
          const lit = ((wx + wy + b.x) / 6 + markerPulse * 14) % 7 < 3.4;
          ctx.fillStyle = lit ? "rgba(168, 224, 255, 0.16)" : "rgba(158, 208, 255, 0.05)";
          Draw.roundRect(ctx, wx, wy, 18, 14, 4, ctx.fillStyle);
        }
      }
      // Rooftop details
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(b.x + 26, b.y + 28, b.w - 52, 4);
      for (let unit = 0; unit < 2; unit++) {
        const rx = b.x + 34 + unit * 44;
        const ry = b.y + 18 + (unit % 2) * 16;
        Draw.roundRect(ctx, rx, ry, 26, 18, 5, "rgba(8, 14, 28, 0.55)");
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(rx + 4, ry + 4, 18, 2);
      }
      // Neon signs
      if (signText) {
        const signW = Math.min(126, 16 + signText.length * 8);
        const signX = b.x + b.w - signW - 24;
        const signY = b.y + 76;
        const region = getCurrentRegion();
        const themeColor = region ? region.glow : "rgba(110,231,255,0.3)";
        const signGlow = ctx.createLinearGradient(signX, signY, signX + signW, signY + 20);
        signGlow.addColorStop(0, _rgba(themeColor.includes("rgba") ? "#6ee7ff" : themeColor, 0.16));
        signGlow.addColorStop(1, "rgba(0,0,0,0.18)");
        Draw.roundRect(ctx, signX, signY, signW, 22, 8, "rgba(8, 12, 24, 0.75)");
        Draw.roundRect(ctx, signX, signY, signW, 22, 8, signGlow);
        ctx.fillStyle = "#f8fbff";
        ctx.font = "700 11px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(signText, signX + signW * 0.5, signY + 15);
      }
      // Label
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "bold 9px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 3);
    }

    // ── Vehicles ──
    for (const vehicle of vehicles) {
      const vsx = vehicle.x - cx, vsy = vehicle.y - cy;
      if (vsx < -80 || vsx > W + 80 || vsy < -80 || vsy > H + 80) continue;
      const spec = VEHICLE_SPECS[vehicle.model];
      const halfW = spec.width * 0.5, halfH = spec.height * 0.5;
      ctx.save();
      ctx.translate(vehicle.x, vehicle.y);
      ctx.rotate(vehicle.angle);
      // Shadow
      ctx.fillStyle = "rgba(2, 7, 18, 0.32)";
      ctx.beginPath();
      ctx.ellipse(0, 10, halfW * 0.92, halfH * 0.82, 0, 0, TAU);
      ctx.fill();
      // Highlight ring
      if (vehicle.highlight > 0) {
        ctx.strokeStyle = "rgba(255,255,255,0.78)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.ellipse(0, 8, halfW + 16, halfH + 12, 0, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      // Wheels
      for (const wheelX of [-spec.wheelX, spec.wheelX]) {
        for (const wheelY of [-spec.wheelY, spec.wheelY]) {
          Draw.roundRect(ctx, wheelX - 6, wheelY - 4, 12, 8, 4, "#0b1020");
        }
      }
      // Body paint gradient
      const bodyPaint = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
      bodyPaint.addColorStop(0, _rgba(spec.body, 0.96));
      bodyPaint.addColorStop(0.5, spec.body);
      bodyPaint.addColorStop(1, _rgba(spec.body, 0.74));
      Draw.roundRect(ctx, -halfW + 4, -halfH + 3, spec.width - 8, spec.height - 6, 12, bodyPaint);
      // Roof
      if (spec.truckBed) {
        Draw.roundRect(ctx, -halfW + 14, -halfH + 8, spec.width * 0.4, spec.height - 16, 10, spec.accent);
      } else {
        const roofWidth = Math.max(18, spec.width * (spec.roofScale || 0.58));
        Draw.roundRect(ctx, -roofWidth * 0.5, -halfH + 8, roofWidth, spec.height - 16, 10, spec.accent);
      }
      // Headlights + taillights
      ctx.fillStyle = vehicle.model === "cruiser" && Math.sin(markerPulse * 8) > 0 ? "#ef4444" : "rgba(255, 244, 160, 0.9)";
      ctx.fillRect(halfW - 8, -halfH + 9, 5, 8);
      ctx.fillRect(halfW - 8, halfH - 17, 5, 8);
      ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
      ctx.fillRect(-halfW + 3, -halfH + 9, 4, 8);
      ctx.fillRect(-halfW + 3, halfH - 17, 4, 8);
      // Police lightbar
      if (vehicle.model === "cruiser") {
        Draw.roundRect(ctx, -12, -halfH + 5, 24, 5, 3, Math.sin(markerPulse * 8) > 0 ? "#60a5fa" : "#ef4444");
      }
      ctx.restore();
    }

    // ── Chests ──
    for (const ch of CHESTS) {
      if (S.openedChests.includes(ch.id)) continue;
      if (ch.x < cx - 20 || ch.x > cx + W + 20 || ch.y < cy - 20 || ch.y > cy + H + 20) continue;
      // Chest body
      ctx.fillStyle = "#8B6914";
      ctx.fillRect(ch.x - 8, ch.y - 6, 16, 12);
      ctx.fillStyle = "#D4A017";
      ctx.fillRect(ch.x - 6, ch.y - 4, 12, 3);
      // Glow
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(ch.x - 2, ch.y - 2, 4, 3);
      ctx.shadowBlur = 0;
    }

    // ── Encounters ──
    for (const enc of ENCOUNTERS) {
      if (S.defeatedEncounters.includes(enc.id)) continue;
      if (enc.x < cx - 20 || enc.x > cx + W + 20 || enc.y < cy - 20 || enc.y > cy + H + 20) continue;
      const pulse = 0.8 + 0.2 * Math.sin(markerPulse * 4);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = enc.difficulty === "boss" ? "#f87171" : enc.difficulty === "elite" ? "#c084fc" : "#fb923c";
      ctx.beginPath();
      ctx.arc(enc.x, enc.y, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(enc.difficulty === "boss" ? "\u2620" : "\u2694", enc.x, enc.y + 4);
      ctx.globalAlpha = 1;
      // Tier label
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "8px sans-serif";
      ctx.fillText("T" + enc.tier, enc.x, enc.y - 14);
    }

    // ── Y-sorted actors (NPCs + Player) with mascot sprites ──
    const sortedActors = [];
    // NPCs
    for (const npc of NPCS) {
      if (!S.discoveredRegions.includes(npc.region)) continue;
      if (npc.x < cx - 40 || npc.x > cx + W + 40 || npc.y < cy - 40 || npc.y > cy + H + 40) continue;
      sortedActors.push({ type: "npc", y: npc.y, data: npc });
    }
    // Player
    sortedActors.push({ type: "player", y: S.player.y, data: S.player });
    // Sort by Y for depth ordering
    sortedActors.sort((a, b) => a.y - b.y);

    for (const entry of sortedActors) {
      if (entry.type === "player") {
        const p = entry.data;
        if (runtime && playerAnimator) {
          runtime.drawActor(ctx, playerAnimator, p.x, p.y + p.jumpZ * 0.07, {
            height: 92, facing: -(p.facing || 1), glow: p.sprinting ? "rgba(110,231,255,0.4)" : null,
            shadowScale: 1 - Math.min(0.55, Math.abs(p.jumpZ) / 120)
          });
        } else {
          drawPlayer(ctx, p.x - cx, p.y - cy);
        }
        // Health bar above head
        const hpPct = p.hp / p.maxHp;
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(p.x - 12, p.y - 52, 24, 3);
        ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
        ctx.fillRect(p.x - 12, p.y - 52, 24 * hpPct, 3);
      } else {
        const npc = entry.data;
        const anim = npcAnimators.get(npc.id);
        if (runtime && anim) {
          const glowColor = npc.type === "shop" ? "#22c55e" : npc.type === "equip" ? "#f59e0b" : npc.type === "rest" ? "#6ee7ff" : "#a78bfa";
          runtime.drawActor(ctx, anim, npc.x, npc.y, {
            height: 84, facing: -1, glow: glowColor
          });
        } else {
          drawNpc(ctx, npc.x - cx, npc.y - cy, npc);
        }
        // NPC name
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(npc.name, npc.x, npc.y - 50);
      }
    }

    // ── Interaction prompt ──
    if (interactTarget && S.phase === "explore") {
      const tx = (interactTarget.x || (interactTarget._type === "building" ? interactTarget.x + interactTarget.w / 2 : interactTarget.x));
      const ty = (interactTarget.y || interactTarget.y) - 24;
      const promptText = interactTarget._type === "chest" ? "[E] Open" : interactTarget._type === "encounter" ? "[E] Challenge" : interactTarget._type === "npc" ? "[E] Talk" : "[E] Enter";
      ctx.fillStyle = "rgba(10,15,30,0.85)";
      ctx.strokeStyle = "rgba(110,231,255,0.5)";
      ctx.lineWidth = 1;
      const tw = ctx.measureText(promptText).width + 12;
      roundRect(ctx, tx - tw / 2, ty - 10, tw, 20, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#6ee7ff";
      ctx.font = "bold 10px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(promptText, tx, ty + 4);
    }

    // Particles (world-space)
    particles.draw(ctx, cx, cy);

    ctx.restore(); // end camera transform

    // ── Rain streaks (foreground, screen-space) ──
    ctx.fillStyle = "rgba(120,180,255,0.08)";
    for (let i = 0; i < 50; i++) {
      const rx = (i * 79 + weather.rainPhase * 200) % W;
      const ry = (i * 53 + weather.rainPhase * 320) % H;
      ctx.fillRect(rx, ry, 1, 12 + (i % 8));
    }

    // Lightning flash
    if (weather.lightningFlash > 0) {
      ctx.globalAlpha = weather.lightningFlash * 0.5;
      ctx.fillStyle = "rgba(200,220,255,0.3)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Fog overlay
    if (weather.fogAlpha > 0) {
      ctx.globalAlpha = weather.fogAlpha;
      const fogGrad = ctx.createLinearGradient(0, H * 0.6, 0, H);
      fogGrad.addColorStop(0, "rgba(120,140,180,0)");
      fogGrad.addColorStop(1, "rgba(120,140,180,0.4)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Minimap
    if (showMinimap) drawMinimap(ctx);

    // Fog on undiscovered (screen-space)
    ctx.save();
    ctx.translate(-cx, -cy);
    for (const r of REGIONS) {
      if (S.discoveredRegions.includes(r.id)) continue;
      ctx.fillStyle = "rgba(5,8,20,0.85)";
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("???", r.x + r.w / 2, r.y + r.h / 2);
    }
    ctx.restore();
  }

  /* ── SIDE-SCROLL VIEW (GTA-quality) ──────────────────────────────────── */
  function renderSideScroll(ctx, cx, cy) {
    // Parallax sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, "#02040b");
    skyGrad.addColorStop(0.24, "#0b1430");
    skyGrad.addColorStop(0.64, "#101a34");
    skyGrad.addColorStop(1, "#040813");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Moon glow
    const moonGlow = ctx.createRadialGradient(W * 0.82, H * 0.12, 10, W * 0.82, H * 0.12, 140);
    moonGlow.addColorStop(0, "rgba(137, 200, 255, 0.3)");
    moonGlow.addColorStop(0.4, "rgba(111, 150, 255, 0.1)");
    moonGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(0, 0, W, H);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    for (let i = 0; i < 60; i++) {
      const sx = ((i * 137 + 47) % W + cx * 0.05) % W;
      const sy = ((i * 89 + 13) % (H * 0.5));
      ctx.fillRect(sx, sy, 1 + (i % 2), 1);
    }

    // Rain streaks (parallax)
    ctx.fillStyle = "rgba(120,180,255,0.1)";
    for (let i = 0; i < 40; i++) {
      const rx = (i * 79 + weather.rainPhase * 160) % W;
      const ry = (i * 53 + weather.rainPhase * 280) % H;
      ctx.fillRect(rx, ry, 1, 14);
    }

    // Distant cityscape (parallax 0.1)
    ctx.fillStyle = "rgba(8, 16, 34, 0.94)";
    for (let i = 0; i < 12; i++) {
      const bw = 40 + ((i * 31) % 80);
      const bh = 60 + ((i * 47) % 140);
      const bx = -10 + i * 78 + (cx * 0.1) % 80 - 40;
      const by = H * 0.55 - bh;
      Draw.roundRect(ctx, bx, by, bw, bh + 18, 6, ctx.fillStyle);
      // Windows
      ctx.fillStyle = "rgba(121, 178, 255, 0.05)";
      for (let wy = by + 12; wy < by + bh - 8; wy += 10) {
        for (let wx = bx + 6; wx < bx + bw - 6; wx += 14) {
          ctx.fillRect(wx, wy, 5, 3);
        }
      }
      ctx.fillStyle = "rgba(8, 16, 34, 0.94)";
    }

    // Mid-ground hills (parallax 0.3)
    ctx.fillStyle = "rgba(10, 18, 38, 0.72)";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.7);
    for (let x = 0; x <= W; x += 40) {
      const wx = x + cx * 0.3;
      const h = 20 + Math.sin(wx * 0.005) * 25 + Math.cos(wx * 0.009) * 12;
      ctx.lineTo(x, H * 0.7 - h);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

    // Distant mountains (parallax 0.2)
    ctx.fillStyle = "#0e1528";
    ctx.beginPath();
    ctx.moveTo(0, H * 0.65);
    for (let x = 0; x <= W; x += 60) {
      const wx = x + cx * 0.2;
      const h = 40 + Math.sin(wx * 0.003) * 30 + Math.cos(wx * 0.007) * 20;
      ctx.lineTo(x, H * 0.65 - h);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

    // Ground plane
    const groundY = H * 0.78;
    const groundGrad = ctx.createLinearGradient(0, groundY, 0, H);
    groundGrad.addColorStop(0, "#0a1020");
    groundGrad.addColorStop(1, "#060c16");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.strokeStyle = "rgba(110,231,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(W, groundY); ctx.stroke();

    // Road surface on ground
    ctx.fillStyle = "rgba(22,27,46,0.6)";
    ctx.fillRect(0, groundY, W, 20);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.beginPath();
    ctx.moveTo((-cx * 0.8) % 32, groundY + 10);
    ctx.lineTo(W, groundY + 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Grid lines on ground
    ctx.strokeStyle = "rgba(110,231,255,0.04)";
    ctx.lineWidth = 1;
    for (let gx = -cx % 64; gx < W; gx += 64) {
      ctx.beginPath(); ctx.moveTo(gx, groundY); ctx.lineTo(gx, H); ctx.stroke();
    }

    // Buildings as side-view structures
    for (const b of BUILDINGS) {
      const bsx = (b.x + b.w / 2) - cx;
      if (bsx < -100 || bsx > W + 100) continue;
      const bh = b.h * 0.6;
      const bw = b.w * 0.5;
      const by = groundY - bh;
      const signText = BUILDING_SIGN_TEXT[b.id] || "";

      // Shadow
      Draw.roundRect(ctx, bsx - bw / 2 + 6, by + 8, bw, bh, 8, "rgba(2, 6, 18, 0.3)");
      // Body
      Draw.roundRect(ctx, bsx - bw / 2, by, bw, bh, 8, b.fill);
      // Facade glow
      const fGlow = ctx.createLinearGradient(bsx - bw / 2, by, bsx - bw / 2, by + bh);
      fGlow.addColorStop(0, "rgba(255,255,255,0.06)");
      fGlow.addColorStop(1, "rgba(0,0,0,0.12)");
      Draw.roundRect(ctx, bsx - bw / 2, by, bw, bh, 8, fGlow);
      // Roof
      ctx.fillStyle = b.roof;
      ctx.beginPath();
      ctx.moveTo(bsx - bw / 2 - 6, by);
      ctx.lineTo(bsx, by - 16);
      ctx.lineTo(bsx + bw / 2 + 6, by);
      ctx.closePath();
      ctx.fill();
      // Windows
      for (let wy = by + 16; wy < by + bh - 20; wy += 22) {
        for (let wx = bsx - bw / 2 + 10; wx < bsx + bw / 2 - 10; wx += 24) {
          const lit = ((wx + wy + b.x) / 5 + markerPulse * 12) % 6 < 2.8;
          ctx.fillStyle = lit ? "rgba(168, 224, 255, 0.14)" : "rgba(158, 208, 255, 0.04)";
          ctx.fillRect(wx, wy, 12, 8);
        }
      }
      // Door
      if (b.interactable) {
        ctx.fillStyle = "rgba(110,231,255,0.25)";
        ctx.fillRect(bsx - 6, by + bh - 18, 12, 18);
      }
      // Sign
      if (signText) {
        ctx.fillStyle = "rgba(8, 12, 24, 0.75)";
        const sw = Math.min(80, 10 + signText.length * 6);
        Draw.roundRect(ctx, bsx - sw / 2, by - 30, sw, 16, 4, "rgba(8, 12, 24, 0.75)");
        ctx.fillStyle = "#f8fbff";
        ctx.font = "700 9px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(signText, bsx, by - 18);
      }

      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = "8px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.label, bsx, by - 34);
    }

    // Encounters as side-view markers
    for (const enc of ENCOUNTERS) {
      if (S.defeatedEncounters.includes(enc.id)) continue;
      const esx = enc.x - cx;
      if (esx < -20 || esx > W + 20) continue;
      const pulse = 0.8 + 0.2 * Math.sin(markerPulse * 4);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = enc.difficulty === "boss" ? "#f87171" : "#fb923c";
      ctx.beginPath();
      ctx.arc(esx, groundY - 16, 10, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(enc.difficulty === "boss" ? "\u2620" : "\u2694", esx, groundY - 12);
      ctx.globalAlpha = 1;
    }

    // Y-sorted actors on ground level
    const sideActors = [];
    for (const npc of NPCS) {
      if (!S.discoveredRegions.includes(npc.region)) continue;
      const nsx = npc.x - cx;
      if (nsx < -40 || nsx > W + 40) continue;
      sideActors.push({ type: "npc", x: nsx, data: npc });
    }
    sideActors.push({ type: "player", x: S.player.x - cx, data: S.player });
    sideActors.sort((a, b) => a.x - b.x);

    for (const entry of sideActors) {
      if (entry.type === "player") {
        const psx = entry.x;
        const psy = groundY - 22 + S.player.jumpZ * 0.07;
        if (runtime && playerAnimator) {
          runtime.drawActor(ctx, playerAnimator, psx, psy, {
            height: 72, facing: -(S.player.facing || 1), shadow: true,
            shadowScale: 1 - Math.min(0.55, Math.abs(S.player.jumpZ) / 120)
          });
        } else {
          drawPlayer(ctx, psx, psy);
        }
        // Jump shadow
        if (!S.player.grounded) {
          ctx.globalAlpha = 0.2;
          ctx.fillStyle = "#000";
          ctx.beginPath();
          ctx.ellipse(psx, groundY, 8, 3, 0, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      } else {
        const npc = entry.data;
        const ny = groundY - 20;
        const anim = npcAnimators.get(npc.id);
        if (runtime && anim) {
          runtime.drawActor(ctx, anim, entry.x, ny, {
            height: 68, facing: -1,
            glow: npc.type === "shop" ? "#22c55e" : npc.type === "equip" ? "#f59e0b" : npc.type === "rest" ? "#6ee7ff" : "#a78bfa"
          });
        } else {
          drawNpc(ctx, entry.x, ny, npc);
        }
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(npc.name, entry.x, ny - 40);
      }
    }

    // Chests
    for (const ch of CHESTS) {
      if (S.openedChests.includes(ch.id)) continue;
      const csx = ch.x - cx;
      if (csx < -20 || csx > W + 20) continue;
      ctx.fillStyle = "#D4A017";
      ctx.fillRect(csx - 7, groundY - 10, 14, 10);
      ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 6;
      ctx.fillStyle = "#ffd700";
      ctx.fillRect(csx - 2, groundY - 8, 4, 3);
      ctx.shadowBlur = 0;
    }

    // Particles
    particles.draw(ctx, cx, cy);

    // Interact prompt
    if (interactTarget && S.phase === "explore") {
      const tx = (interactTarget.x || (interactTarget.x + (interactTarget.w || 0) / 2)) - cx;
      ctx.fillStyle = "rgba(10,15,30,0.85)";
      ctx.strokeStyle = "rgba(110,231,255,0.5)";
      ctx.lineWidth = 1;
      const label = interactTarget._type === "chest" ? "[E] Open" : interactTarget._type === "encounter" ? "[E] Challenge" : "[E] Talk";
      const tw = ctx.measureText(label).width + 12;
      roundRect(ctx, tx - tw / 2, groundY - 48, tw, 18, 4);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#6ee7ff";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, tx, groundY - 36);
    }

    // Lightning flash
    if (weather.lightningFlash > 0) {
      ctx.globalAlpha = weather.lightningFlash * 0.4;
      ctx.fillStyle = "rgba(200,220,255,0.3)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    if (showMinimap) drawMinimap(ctx);
  }

  /* ── FIRST-PERSON VIEW ─────────────────────────────────────────────── */
  /* ── FIRST-PERSON VIEW (GTA-quality) ─────────────────────────────────── */
  function renderFirstPerson(ctx, cx, cy) {
    const p = S.player;
    const horizon = H * 0.46;
    const vanishX = W / 2;

    // ── Sky ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizon);
    skyGrad.addColorStop(0, "#02040b");
    skyGrad.addColorStop(0.35, "#0b1430");
    skyGrad.addColorStop(0.7, "#101a34");
    skyGrad.addColorStop(1, "#18253e");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizon);

    // Stars
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 80; i++) {
      const sx = ((i * 137 + 47) % W);
      const sy = ((i * 89 + 13) % (horizon * 0.8));
      ctx.fillRect(sx, sy, 1 + (i % 3 === 0 ? 1 : 0), 1);
    }

    // Moon
    const moonX = W * 0.78, moonY = horizon * 0.2;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 8, moonX, moonY, 120);
    moonGlow.addColorStop(0, "rgba(180, 220, 255, 0.35)");
    moonGlow.addColorStop(0.3, "rgba(137, 200, 255, 0.12)");
    moonGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = moonGlow;
    ctx.fillRect(moonX - 120, moonY - 120, 240, 240);
    ctx.fillStyle = "rgba(220, 240, 255, 0.9)";
    ctx.beginPath(); ctx.arc(moonX, moonY, 10, 0, TAU); ctx.fill();

    // Distant cityscape silhouettes at horizon
    ctx.fillStyle = "rgba(6, 12, 28, 0.92)";
    for (let i = 0; i < 20; i++) {
      const bw = 18 + ((i * 37) % 40);
      const bh = 10 + ((i * 53) % 60);
      const bx = ((i * 49) % W);
      ctx.fillRect(bx, horizon - bh, bw, bh + 4);
    }

    // ── Floor ──
    const floorGrad = ctx.createLinearGradient(0, horizon, 0, H);
    floorGrad.addColorStop(0, "#0c1424");
    floorGrad.addColorStop(0.6, "#080e1a");
    floorGrad.addColorStop(1, "#040810");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, horizon, W, H - horizon);

    // Perspective grid lines on floor
    ctx.lineWidth = 1;
    for (let d = 1; d <= 24; d++) {
      const t = d / 24;
      const y = horizon + (H - horizon) * t;
      ctx.globalAlpha = 0.08 * (1 - t * 0.7);
      ctx.strokeStyle = "rgba(110,231,255,0.08)";
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Convergence lines
    for (let i = -14; i <= 14; i++) {
      const ox = i * 70;
      ctx.strokeStyle = "rgba(110,231,255,0.03)";
      ctx.beginPath();
      ctx.moveTo(vanishX + ox * 0.08, horizon);
      ctx.lineTo(vanishX + ox * 3.2, H);
      ctx.stroke();
    }

    // Region glow
    const region = getCurrentRegion();
    if (region) {
      ctx.fillStyle = region.glow;
      ctx.fillRect(0, 0, W, H);
    }

    // ── 3D billboard objects ──
    const viewAngle = p.facing > 0 ? 0 : Math.PI;
    const objects = [];

    // Collect visible objects with distance
    for (const b of BUILDINGS) {
      const dx = (b.x + b.w / 2) - p.x, dy = (b.y + b.h / 2) - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 600 || dist < 20) continue;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - viewAngle);
      if (Math.abs(relAngle) > Math.PI * 0.6) continue;
      objects.push({ type: "building", data: b, dist, relAngle });
    }
    for (const v of vehicles) {
      const dx = v.x - p.x, dy = v.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 400 || dist < 10) continue;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - viewAngle);
      if (Math.abs(relAngle) > Math.PI * 0.6) continue;
      objects.push({ type: "vehicle", data: v, dist, relAngle });
    }
    for (const enc of ENCOUNTERS) {
      if (S.defeatedEncounters.includes(enc.id)) continue;
      const dx = enc.x - p.x, dy = enc.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 400 || dist < 10) continue;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - viewAngle);
      if (Math.abs(relAngle) > Math.PI * 0.6) continue;
      objects.push({ type: "encounter", data: enc, dist, relAngle });
    }
    for (const npc of NPCS) {
      if (!S.discoveredRegions.includes(npc.region)) continue;
      const dx = npc.x - p.x, dy = npc.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 350 || dist < 10) continue;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - viewAngle);
      if (Math.abs(relAngle) > Math.PI * 0.6) continue;
      objects.push({ type: "npc", data: npc, dist, relAngle });
    }
    for (const ch of CHESTS) {
      if (S.openedChests.includes(ch.id)) continue;
      const dx = ch.x - p.x, dy = ch.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 300 || dist < 10) continue;
      const angle = Math.atan2(dy, dx);
      const relAngle = normalizeAngle(angle - viewAngle);
      if (Math.abs(relAngle) > Math.PI * 0.6) continue;
      objects.push({ type: "chest", data: ch, dist, relAngle });
    }

    objects.sort((a, b) => b.dist - a.dist);

    for (const obj of objects) {
      const screenX = vanishX + (obj.relAngle / (Math.PI * 0.6)) * (W / 2);
      const scale = Math.max(0.1, 200 / obj.dist);
      const screenY = horizon + 24 * scale;
      const fogMix = Math.min(0.6, obj.dist / 700);

      if (obj.type === "building") {
        const b = obj.data;
        const bw = b.w * scale * 0.45;
        const bh = b.h * scale * 0.55;
        const signText = BUILDING_SIGN_TEXT[b.id] || "";
        // Shadow
        ctx.globalAlpha = 0.3 * (1 - fogMix);
        Draw.roundRect(ctx, screenX - bw / 2 + 4, screenY - bh + 4, bw, bh, 4, "rgba(2,6,18,0.3)");
        ctx.globalAlpha = 1 - fogMix * 0.4;
        // Body
        Draw.roundRect(ctx, screenX - bw / 2, screenY - bh, bw, bh, 4, b.fill);
        // Facade glow
        const fGlow = ctx.createLinearGradient(screenX - bw / 2, screenY - bh, screenX - bw / 2, screenY);
        fGlow.addColorStop(0, "rgba(255,255,255,0.06)");
        fGlow.addColorStop(1, "rgba(0,0,0,0.1)");
        Draw.roundRect(ctx, screenX - bw / 2, screenY - bh, bw, bh, 4, fGlow);
        // Roof
        ctx.fillStyle = b.roof;
        ctx.beginPath();
        ctx.moveTo(screenX - bw / 2 - 4, screenY - bh);
        ctx.lineTo(screenX, screenY - bh - 12 * scale);
        ctx.lineTo(screenX + bw / 2 + 4, screenY - bh);
        ctx.closePath();
        ctx.fill();
        // Windows
        if (scale > 0.2) {
          for (let wy = screenY - bh + 10 * scale; wy < screenY - 10 * scale; wy += 14 * scale) {
            for (let wx = screenX - bw / 2 + 6 * scale; wx < screenX + bw / 2 - 6 * scale; wx += 16 * scale) {
              const lit = ((wx + wy + b.x) / 5 + markerPulse * 12) % 6 < 2.8;
              ctx.fillStyle = lit ? "rgba(168, 224, 255, 0.14)" : "rgba(158, 208, 255, 0.03)";
              ctx.fillRect(wx, wy, 8 * scale, 5 * scale);
            }
          }
        }
        // Door glow
        if (b.interactable && scale > 0.25) {
          ctx.fillStyle = "rgba(110,231,255,0.25)";
          ctx.fillRect(screenX - 4 * scale, screenY - 14 * scale, 8 * scale, 14 * scale);
        }
        // Neon sign
        if (signText && scale > 0.3) {
          ctx.fillStyle = "#f8fbff";
          ctx.font = `700 ${Math.max(7, 9 * scale)}px Segoe UI`;
          ctx.textAlign = "center";
          ctx.fillText(signText, screenX, screenY - bh - 14 * scale);
        }
        // Label
        if (scale > 0.3) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.font = `${Math.max(8, 10 * scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(b.label, screenX, screenY - bh - 22 * scale);
        }
        ctx.globalAlpha = 1;
      } else if (obj.type === "vehicle") {
        const v = obj.data;
        const vw = 40 * scale, vh = 16 * scale;
        ctx.globalAlpha = 1 - fogMix * 0.5;
        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath(); ctx.ellipse(screenX, screenY + 2, vw * 0.5, 3 * scale, 0, 0, TAU); ctx.fill();
        // Body
        Draw.roundRect(ctx, screenX - vw / 2, screenY - vh, vw, vh, 3 * scale, v.color);
        // Headlights
        ctx.fillStyle = "rgba(255,255,200,0.6)";
        ctx.fillRect(screenX - vw / 2, screenY - vh + 2 * scale, 3 * scale, 3 * scale);
        ctx.fillRect(screenX + vw / 2 - 3 * scale, screenY - vh + 2 * scale, 3 * scale, 3 * scale);
        ctx.globalAlpha = 1;
      } else if (obj.type === "encounter") {
        const size = 12 * scale;
        const pulse = 0.8 + 0.2 * Math.sin(markerPulse * 4);
        ctx.globalAlpha = pulse * (1 - fogMix * 0.3);
        ctx.fillStyle = obj.data.difficulty === "boss" ? "#f87171" : "#fb923c";
        ctx.beginPath();
        ctx.arc(screenX, screenY - size, size, 0, TAU);
        ctx.fill();
        // Glow ring
        ctx.strokeStyle = obj.data.difficulty === "boss" ? "rgba(248,113,113,0.3)" : "rgba(251,146,60,0.3)";
        ctx.lineWidth = 2 * scale;
        ctx.beginPath(); ctx.arc(screenX, screenY - size, size + 4 * scale, 0, TAU); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(8, 12 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(obj.data.difficulty === "boss" ? "\u2620" : "\u2694", screenX, screenY - size + 4 * scale);
        ctx.globalAlpha = 1;
      } else if (obj.type === "npc") {
        const nh = 28 * scale;
        ctx.globalAlpha = 1 - fogMix * 0.3;
        const anim = npcAnimators.get(obj.data.id);
        if (runtime && anim) {
          runtime.drawActor(ctx, anim, screenX, screenY - nh, {
            height: nh * 2.5,
            facing: -1,
            glow: obj.data.type === "shop" ? "#22c55e" : obj.data.type === "equip" ? "#f59e0b" : obj.data.type === "rest" ? "#6ee7ff" : "#a78bfa"
          });
        } else {
          drawNpcFP(ctx, screenX, screenY, nh, obj.data);
        }
        // Name label
        if (scale > 0.25) {
          ctx.fillStyle = "rgba(255,255,255,0.5)";
          ctx.font = `bold ${Math.max(7, 8 * scale)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.fillText(obj.data.name, screenX, screenY - nh * 2 - 6 * scale);
        }
        ctx.globalAlpha = 1;
      } else if (obj.type === "chest") {
        const cs = 10 * scale;
        ctx.globalAlpha = 1 - fogMix * 0.3;
        ctx.fillStyle = "#D4A017";
        Draw.roundRect(ctx, screenX - cs, screenY - cs, cs * 2, cs, 2 * scale, "#D4A017");
        ctx.shadowColor = "#ffd700"; ctx.shadowBlur = 4 * scale;
        ctx.fillStyle = "#ffd700";
        ctx.fillRect(screenX - 2 * scale, screenY - cs + 2 * scale, 4 * scale, 3 * scale);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    }

    // Rain streaks (screen-space)
    if (weather.rainPhase > 0) {
      ctx.fillStyle = "rgba(120,180,255,0.08)";
      for (let i = 0; i < 50; i++) {
        const rx = (i * 79 + weather.rainPhase * 200) % W;
        const ry = (i * 53 + weather.rainPhase * 350) % H;
        ctx.fillRect(rx, ry, 1, 18);
      }
    }

    // ── Weapon/hands at bottom (first-person arms) ──
    const bobY = Math.sin(markerPulse * 3) * 3;
    ctx.fillStyle = "rgba(10,18,34,0.85)";
    Draw.roundRect(ctx, W / 2 - 34, H - 64 + bobY, 68, 64, 8, "rgba(10,18,34,0.85)");
    ctx.strokeStyle = "rgba(110,231,255,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 34, H - 64 + bobY, 68, 64);
    // Weapon glow
    const wGlow = ctx.createRadialGradient(W / 2, H - 32 + bobY, 4, W / 2, H - 32 + bobY, 30);
    wGlow.addColorStop(0, "rgba(110,231,255,0.2)");
    wGlow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = wGlow;
    ctx.fillRect(W / 2 - 34, H - 64 + bobY, 68, 64);
    ctx.fillStyle = "rgba(110,231,255,0.6)";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("\u2694", W / 2, H - 26 + bobY);

    // ── Crosshair ──
    ctx.strokeStyle = "rgba(110,231,255,0.4)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(W / 2 - 12, horizon); ctx.lineTo(W / 2 - 4, horizon); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2 + 4, horizon); ctx.lineTo(W / 2 + 12, horizon); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, horizon - 12); ctx.lineTo(W / 2, horizon - 4); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2, horizon + 4); ctx.lineTo(W / 2, horizon + 12); ctx.stroke();
    // Center dot
    ctx.fillStyle = "rgba(110,231,255,0.6)";
    ctx.beginPath(); ctx.arc(W / 2, horizon, 1.5, 0, TAU); ctx.fill();

    // ── Interact prompt ──
    if (interactTarget && S.phase === "explore") {
      const label = interactTarget._type === "chest" ? "[E] Open" : interactTarget._type === "encounter" ? "[E] Challenge" : interactTarget._type === "npc" ? `[E] Talk to ${interactTarget.name}` : "[E] Enter";
      ctx.fillStyle = "rgba(10,15,30,0.88)";
      ctx.strokeStyle = "rgba(110,231,255,0.5)";
      ctx.lineWidth = 1;
      const tw = ctx.measureText(label).width + 16;
      roundRect(ctx, W / 2 - tw / 2, horizon + 32, tw, 22, 5);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#6ee7ff";
      ctx.font = "bold 11px 'Segoe UI', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, W / 2, horizon + 46);
    }

    // Lightning flash
    if (weather.lightningFlash > 0) {
      ctx.globalAlpha = weather.lightningFlash * 0.35;
      ctx.fillStyle = "rgba(200,220,255,0.3)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }

    // Fog
    if (weather.fogAlpha > 0.01) {
      const fog = ctx.createLinearGradient(0, horizon, 0, H);
      fog.addColorStop(0, `rgba(10,18,36,${weather.fogAlpha * 0.5})`);
      fog.addColorStop(1, `rgba(6,10,20,${weather.fogAlpha * 0.2})`);
      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
    }

    if (showMinimap) drawMinimap(ctx);
  }

  /* ── Drawing Helpers ───────────────────────────────────────────────── */
  function drawPlayer(ctx, sx, sy) {
    const p = S.player;
    const jumpOffset = p.jumpZ * 0.07;
    const time = Date.now() / 1000;

    // Shadow
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 10, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Body
    const bobY = (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10) ? Math.sin(time * 10) * 2 : 0;
    const y = sy + jumpOffset + bobY;

    // Legs
    if (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10) {
      const legSwing = Math.sin(time * 12) * 4;
      ctx.fillStyle = "#1a3050";
      ctx.fillRect(sx - 4 + legSwing, y + 2, 3, 8);
      ctx.fillRect(sx + 1 - legSwing, y + 2, 3, 8);
    } else {
      ctx.fillStyle = "#1a3050";
      ctx.fillRect(sx - 4, y + 2, 3, 7);
      ctx.fillRect(sx + 1, y + 2, 3, 7);
    }

    // Torso
    ctx.fillStyle = "#2563eb";
    ctx.fillRect(sx - 5, y - 8, 10, 12);

    // Head
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(sx, y - 13, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(sx + p.facing * 2 - 1, y - 14, 2, 2);
    ctx.fillRect(sx + p.facing * 4 - 1, y - 14, 2, 2);

    // Sprint trail
    if (p.sprinting && (Math.abs(p.vx) > 10 || Math.abs(p.vy) > 10)) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = "#6ee7ff";
      ctx.beginPath();
      ctx.arc(sx - p.facing * 8, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Health bar above head
    const hpPct = p.hp / p.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(sx - 12, y - 24, 24, 3);
    ctx.fillStyle = hpPct > 0.5 ? "#4ade80" : hpPct > 0.25 ? "#fbbf24" : "#f87171";
    ctx.fillRect(sx - 12, y - 24, 24 * hpPct, 3);
  }

  function drawNpc(ctx, sx, sy, npc) {
    // Body
    ctx.fillStyle = npc.type === "shop" ? "#22c55e" : npc.type === "equip" ? "#f59e0b" : npc.type === "rest" ? "#6ee7ff" : "#a78bfa";
    ctx.fillRect(sx - 4, sy - 6, 8, 10);

    // Head
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(sx, sy - 11, 5, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "bold 8px 'Segoe UI', system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(npc.name, sx, sy - 20);

    // Type indicator
    const icon = npc.type === "shop" ? "\uD83D\uDCB0" : npc.type === "equip" ? "\u2692" : npc.type === "rest" ? "\u2764" : "\u2139";
    ctx.font = "10px sans-serif";
    ctx.fillText(icon, sx, sy - 27);
  }

  function drawNpcFP(ctx, sx, sy, h, npc) {
    // Billboard NPC in first person
    const bw = h * 0.5;
    ctx.fillStyle = npc.type === "shop" ? "#22c55e" : npc.type === "equip" ? "#f59e0b" : npc.type === "rest" ? "#6ee7ff" : "#a78bfa";
    ctx.fillRect(sx - bw / 2, sy - h, bw, h * 0.7);
    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.arc(sx, sy - h - 2, h * 0.25, 0, Math.PI * 2);
    ctx.fill();
    if (h > 8) {
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.font = `${Math.max(7, h * 0.35)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(npc.name, sx, sy - h - h * 0.3);
    }
  }

  function drawMinimap(ctx) {
    const mx = W - MINIMAP_SIZE - 8, my = 8;
    const scale = MINIMAP_SIZE / WORLD_W;

    ctx.fillStyle = "rgba(5,8,20,0.85)";
    ctx.strokeStyle = "rgba(110,231,255,0.3)";
    ctx.lineWidth = 1;
    ctx.fillRect(mx, my, MINIMAP_SIZE, MINIMAP_SIZE * (WORLD_H / WORLD_W));
    ctx.strokeRect(mx, my, MINIMAP_SIZE, MINIMAP_SIZE * (WORLD_H / WORLD_W));

    // Regions
    for (const r of REGIONS) {
      if (!S.discoveredRegions.includes(r.id)) continue;
      ctx.fillStyle = r.glow;
      ctx.fillRect(mx + r.x * scale, my + r.y * scale, r.w * scale, r.h * scale);
    }

    // Roads
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    for (const road of ROADS) {
      ctx.beginPath();
      ctx.moveTo(mx + road.x1 * scale, my + road.y1 * scale);
      ctx.lineTo(mx + road.x2 * scale, my + road.y2 * scale);
      ctx.stroke();
    }

    // Encounters
    for (const enc of ENCOUNTERS) {
      if (S.defeatedEncounters.includes(enc.id)) continue;
      ctx.fillStyle = enc.difficulty === "boss" ? "#f87171" : "#fb923c";
      ctx.fillRect(mx + enc.x * scale - 1.5, my + enc.y * scale - 1.5, 3, 3);
    }

    // Player dot
    ctx.fillStyle = "#6ee7ff";
    ctx.beginPath();
    ctx.arc(mx + S.player.x * scale, my + S.player.y * scale, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Camera viewport
    ctx.strokeStyle = "rgba(110,231,255,0.4)";
    ctx.strokeRect(mx + S.camera.x * scale, my + S.camera.y * scale, W * scale, H * scale);
  }

  /* ── Utility ───────────────────────────────────────────────────────── */
  function roundRect(ctx, x, y, w, h, r) {
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
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }

  function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  /* ═══════════════════════════════════════════════════════════════════════
     HUD Rendering (DOM overlay)
     ═══════════════════════════════════════════════════════════════════════ */
  function renderHUD() {
    // Top-left: HP + Gold + Level
    let hudHtml = `
      <div style="position:absolute;top:8px;left:8px;display:flex;gap:10px;align-items:center;">
        <div style="background:rgba(10,15,30,0.85);border:1px solid rgba(110,231,255,0.25);border-radius:6px;padding:4px 10px;display:flex;gap:8px;align-items:center;">
          <span style="color:#f87171;font-weight:700;font-size:12px;">\u2764 ${S.player.hp}/${S.player.maxHp}</span>
          <span style="color:#ffd700;font-weight:700;font-size:12px;">\uD83D\uDCB0 ${S.player.gold}</span>
          <span style="color:#6ee7ff;font-weight:700;font-size:12px;">Lv.${S.player.level}</span>
        </div>
      </div>
    `;

    // Top-center: Region name
    const region = getCurrentRegion();
    if (region) {
      hudHtml += `<div style="position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(10,15,30,0.8);border:1px solid ${region.glow};border-radius:6px;padding:3px 14px;color:rgba(255,255,255,0.7);font-size:11px;font-weight:600;">${escHtml(region.name)}</div>`;
    }

    // Bottom-left: Controls
    hudHtml += `<div style="position:absolute;bottom:8px;left:8px;color:rgba(255,255,255,0.25);font-size:9px;line-height:1.6;">WASD Move \u2022 Shift Sprint \u2022 Space Jump \u2022 E Interact \u2022 V Perspective \u2022 P Pause \u2022 M Map \u2022 I Inventory</div>`;

    // Bottom-right: Perspective label
    hudHtml += `<div style="position:absolute;bottom:8px;right:8px;background:rgba(10,15,30,0.8);border:1px solid rgba(110,231,255,0.2);border-radius:4px;padding:2px 8px;color:rgba(110,231,255,0.6);font-size:10px;">${S.perspective === "topdown" ? "Top-Down" : S.perspective === "side" ? "Side-Scroll" : "First-Person"} [V]</div>`;

    // Phase-specific overlays
    if (S.phase === "encounter" && S.currentEncounter) {
      hudHtml += renderEncounterUI();
    } else if (S.phase === "shop") {
      hudHtml += renderShopUI();
    } else if (S.phase === "equip") {
      hudHtml += renderEquipUI();
    } else if (S.phase === "paused") {
      hudHtml += renderPauseUI();
    } else if (S.phase === "victory") {
      hudHtml += renderVictoryUI();
    }

    // Inventory overlay
    if (showInventory && S.phase === "explore") {
      hudHtml += renderInventoryUI();
    }

    // Notifications
    let notifHtml = "";
    for (const n of S.notifications) {
      const opacity = Math.min(1, n.time);
      notifHtml += `<div style="background:rgba(10,15,30,0.9);border:1px solid ${n.color};border-radius:5px;padding:3px 10px;color:${n.color};font-size:11px;font-weight:600;opacity:${opacity};transform:translateY(${(1 - opacity) * -10}px);">${escHtml(n.text)}</div>`;
    }
    notifEl.innerHTML = notifHtml;

    hud.innerHTML = hudHtml;

    // Bind interactive buttons
    bindHUDButtons();
  }

  function renderEncounterUI() {
    const enc = S.currentEncounter;
    return `
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.9);pointer-events:auto;z-index:20;">
        <div style="background:linear-gradient(135deg,#0a1628,#141e30);border:2px solid ${enc.difficulty === "boss" ? "#f87171" : "#fb923c"};border-radius:12px;padding:24px 32px;max-width:360px;text-align:center;">
          <div style="font-size:28px;margin-bottom:8px;">${enc.difficulty === "boss" ? "\u2620" : "\u2694"}</div>
          <div style="color:#fff;font-weight:800;font-size:18px;margin-bottom:4px;">${escHtml(enc.name)}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-bottom:12px;">${escHtml(enc.desc)}</div>
          <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;">
            <div style="color:#f87171;font-size:13px;">HP: ${enc.bossHp + enc.tier * 2}</div>
            <div style="color:#fb923c;font-size:13px;">ATK: ${enc.bossAtk}</div>
            <div style="color:#c084fc;font-size:13px;">Tier ${enc.tier}</div>
          </div>
          <div style="color:#ffd700;font-size:11px;margin-bottom:12px;">Reward: ${enc.reward.gold} Gold + ${enc.reward.xp} XP</div>
          <div style="display:flex;gap:8px;justify-content:center;">
            <button class="cg-adv-btn" data-action="fight" style="background:linear-gradient(135deg,#dc2626,#991b1b);color:#fff;border:none;border-radius:6px;padding:8px 20px;font-weight:700;font-size:13px;cursor:pointer;">Fight!</button>
            <button class="cg-adv-btn" data-action="flee" style="background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:8px 20px;font-weight:600;font-size:13px;cursor:pointer;">Flee</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderShopUI() {
    const items = [
      { name: "Health Potion", desc: "Restore 10 HP", cost: 10, action: "shop_heal" },
      { name: "Card Pack", desc: "3 random cards for your deck", cost: 25, action: "shop_pack" },
      { name: "Max HP +5", desc: "Permanently increase max HP", cost: 40, action: "shop_maxhp" },
    ];
    let html = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.9);pointer-events:auto;z-index:20;">
      <div style="background:linear-gradient(135deg,#0a1628,#141e30);border:2px solid rgba(34,197,94,0.5);border-radius:12px;padding:20px 28px;max-width:340px;">
        <div style="color:#22c55e;font-weight:800;font-size:16px;margin-bottom:12px;text-align:center;">\uD83D\uDCB0 Merchant — Gold: ${S.player.gold}</div>`;
    for (const item of items) {
      const canBuy = S.player.gold >= item.cost;
      html += `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div><div style="color:#fff;font-weight:600;font-size:12px;">${item.name}</div><div style="color:rgba(255,255,255,0.4);font-size:10px;">${item.desc}</div></div>
        <button class="cg-adv-btn" data-action="${item.action}" style="background:${canBuy ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.05)"};color:${canBuy ? "#4ade80" : "rgba(255,255,255,0.3)"};border:1px solid ${canBuy ? "rgba(34,197,94,0.4)" : "rgba(255,255,255,0.1)"};border-radius:4px;padding:4px 10px;font-size:11px;font-weight:600;cursor:${canBuy ? "pointer" : "not-allowed"};">${item.cost}g</button>
      </div>`;
    }
    html += `<button class="cg-adv-btn" data-action="close_shop" style="margin-top:12px;width:100%;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:6px;font-size:12px;cursor:pointer;">Close</button>
      </div></div>`;
    return html;
  }

  function renderEquipUI() {
    const slots = ["helm", "chest", "weapon", "boots", "ring"];
    let html = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.9);pointer-events:auto;z-index:20;">
      <div style="background:linear-gradient(135deg,#0a1628,#141e30);border:2px solid rgba(245,158,11,0.5);border-radius:12px;padding:20px 28px;max-width:380px;">
        <div style="color:#f59e0b;font-weight:800;font-size:16px;margin-bottom:12px;text-align:center;">\u2692 Equipment</div>`;
    for (const slot of slots) {
      const equipped = S.equippedItems[slot];
      const equippedItem = EQUIPMENT.find(e => e.id === equipped);
      const available = S.collectedEquipment.filter(eqId => EQUIPMENT.find(e => e.id === eqId && e.slot === slot));
      html += `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
        <div style="color:rgba(255,255,255,0.5);font-size:10px;font-weight:600;text-transform:uppercase;">${slot}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <div style="color:#fff;font-size:12px;">${equippedItem ? `${equippedItem.icon} ${equippedItem.name}` : "— Empty —"}</div>`;
      if (available.length > 0) {
        for (const eqId of available) {
          if (eqId === equipped) continue;
          const eq = EQUIPMENT.find(e => e.id === eqId);
          if (!eq) continue;
          html += `<button class="cg-adv-btn" data-action="equip_${eq.id}" style="background:rgba(245,158,11,0.2);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);border-radius:4px;padding:2px 8px;font-size:10px;cursor:pointer;">${eq.icon} ${eq.name}</button>`;
        }
      }
      html += `</div></div>`;
    }
    html += `<button class="cg-adv-btn" data-action="close_equip" style="margin-top:12px;width:100%;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.6);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:6px;font-size:12px;cursor:pointer;">Close</button>
      </div></div>`;
    return html;
  }

  function renderPauseUI() {
    return `
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.85);pointer-events:auto;z-index:20;">
        <div style="background:linear-gradient(135deg,#0a1628,#141e30);border:2px solid rgba(110,231,255,0.3);border-radius:12px;padding:24px 36px;text-align:center;">
          <div style="color:#6ee7ff;font-weight:800;font-size:20px;margin-bottom:8px;">Paused</div>
          <div style="color:rgba(255,255,255,0.4);font-size:12px;margin-bottom:16px;">Play Time: ${Math.floor(S.totalPlayTime / 60)}m ${Math.floor(S.totalPlayTime % 60)}s</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <button class="cg-adv-btn" data-action="resume" style="background:rgba(110,231,255,0.15);color:#6ee7ff;border:1px solid rgba(110,231,255,0.3);border-radius:6px;padding:8px 24px;font-weight:700;cursor:pointer;">Resume [P]</button>
            <button class="cg-adv-btn" data-action="save_quit" style="background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:8px 24px;font-weight:600;cursor:pointer;">Save &amp; Quit</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderVictoryUI() {
    return `
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,0.9);pointer-events:auto;z-index:20;">
        <div style="background:linear-gradient(135deg,#1a1000,#2a1800);border:2px solid #ffd700;border-radius:12px;padding:28px 40px;text-align:center;">
          <div style="font-size:48px;margin-bottom:8px;">\uD83C\uDFC6</div>
          <div style="color:#ffd700;font-weight:800;font-size:22px;margin-bottom:8px;">Adventure Complete!</div>
          <div style="color:rgba(255,255,255,0.6);font-size:13px;margin-bottom:16px;">You defeated the Apex Debugger and restored order.</div>
          <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;">
            <div style="color:#ffd700;font-size:14px;">Gold: ${S.player.gold}</div>
            <div style="color:#6ee7ff;font-size:14px;">Level: ${S.player.level}</div>
            <div style="color:#4ade80;font-size:14px;">Encounters: ${S.defeatedEncounters.length}/9</div>
          </div>
          <button class="cg-adv-btn" data-action="finish" style="background:linear-gradient(135deg,#ca8a04,#a16207);color:#fff;border:none;border-radius:6px;padding:10px 28px;font-weight:700;font-size:14px;cursor:pointer;">Return to Menu</button>
        </div>
      </div>
    `;
  }

  function renderInventoryUI() {
    const slots = ["helm", "chest", "weapon", "boots", "ring"];
    let html = `<div style="position:absolute;top:40px;left:8px;background:rgba(10,15,30,0.92);border:1px solid rgba(110,231,255,0.2);border-radius:8px;padding:10px 14px;pointer-events:auto;z-index:15;min-width:180px;">
      <div style="color:#6ee7ff;font-weight:700;font-size:11px;margin-bottom:6px;">Inventory [I]</div>`;
    for (const slot of slots) {
      const eqId = S.equippedItems[slot];
      const eq = EQUIPMENT.find(e => e.id === eqId);
      html += `<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
        <span style="color:rgba(255,255,255,0.4);font-size:10px;">${slot}</span>
        <span style="color:${eq ? "#fbbf24" : "rgba(255,255,255,0.2)"};font-size:10px;">${eq ? `${eq.icon} ${eq.name}` : "—"}</span>
      </div>`;
    }
    html += `<div style="margin-top:6px;color:rgba(255,255,255,0.25);font-size:9px;">Items: ${S.collectedEquipment.length}/${EQUIPMENT.length}</div></div>`;
    return html;
  }

  function bindHUDButtons() {
    const btns = hud.querySelectorAll(".cg-adv-btn");
    for (const btn of btns) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        handleHUDAction(action);
      });
    }
  }

  function handleHUDAction(action) {
    if (action === "fight") {
      startBattle();
    } else if (action === "flee") {
      S.phase = "explore";
      S.currentEncounter = null;
      notify("You fled!", "#fbbf24");
    } else if (action === "resume") {
      S.phase = "explore";
    } else if (action === "save_quit") {
      saveState();
      destroy();
      callbacks.onQuit?.();
    } else if (action === "finish") {
      saveState();
      destroy();
      callbacks.onQuit?.();
    } else if (action === "close_shop" || action === "close_equip") {
      S.phase = "explore";
    } else if (action === "shop_heal") {
      if (S.player.gold >= 10) {
        S.player.gold -= 10;
        S.player.hp = Math.min(S.player.maxHp, S.player.hp + 10);
        SFX.heal();
        notify("+10 HP!", "#4ade80");
      }
    } else if (action === "shop_pack") {
      if (S.player.gold >= 25) {
        S.player.gold -= 25;
        SFX.pickup();
        notify("Card pack acquired!", "#6ee7ff");
        callbacks.onBuyPack?.();
      }
    } else if (action === "shop_maxhp") {
      if (S.player.gold >= 40) {
        S.player.gold -= 40;
        S.player.maxHp += 5;
        S.player.hp = S.player.maxHp;
        SFX.equip();
        notify("Max HP +5!", "#f87171");
      }
    } else if (action?.startsWith("equip_")) {
      const eqId = action.replace("equip_", "");
      const eq = EQUIPMENT.find(e => e.id === eqId);
      if (eq) {
        S.equippedItems[eq.slot] = eq.id;
        SFX.equip();
        notify(`Equipped: ${eq.name}`, "#fbbf24");
        saveState();
      }
    }
  }

  /* ═══════════════════════════════════════════════════════════════════════
     Lifecycle
     ═══════════════════════════════════════════════════════════════════════ */
  function destroy() {
    running = false;
    cvs.removeEventListener("keydown", onKeyDown);
    cvs.removeEventListener("keyup", onKeyUp);
    saveState();
  }

  /* ── Mascot Pack Boot (async, non-blocking) ─────────────────────────── */
  async function bootMascotRuntime() {
    try {
      const packs = await _discoverOwnedShimejiPacks();
      const spec = packs[0] || _findLocalPackSpec(DEFAULT_PACK_ID);
      if (spec) {
        runtime = await _loadPackRuntime(spec);
        if (runtime) {
          playerAnimator = runtime.createAnimator("idle");
          // Create NPC animators with varied actions
          for (const npc of NPCS) {
            const anim = runtime.createAnimator("idle");
            npcAnimators.set(npc.id, anim);
          }
          console.log("[adventure] Mascot pack loaded:", spec.name || spec.packId);
        }
      }
    } catch (err) {
      runtimeError = err && err.message ? err.message : String(err);
      console.warn("[adventure] Mascot pack load failed:", runtimeError);
    }
  }
  bootMascotRuntime();

  // Start
  lastTime = performance.now();
  requestAnimationFrame(tick);

  return {
    destroy,
    getState: () => S,
    saveState,
    notifyBattleResult(result) {
      // Called when card battle finishes
      if (S.currentEncounter) {
        const enc = S.currentEncounter;
        const bonuses = computeEquipmentBonuses();
        if (result === "won") {
          S.defeatedEncounters.push(enc.id);
          S.player.gold += enc.reward.gold + (bonuses.bonusGold || 0);
          S.player.xp += enc.reward.xp + (bonuses.bonusXp || 0);
          checkLevelUp();
          SFX.victory();
          particles.emit(S.player.x, S.player.y - 20, 50, { color: "#ffd700", speed: 140, life: 1.2, spread: 30 });
          notify(`Victory! +${enc.reward.gold} Gold, +${enc.reward.xp} XP`, "#4ade80");
          const region = REGIONS.find(r => r.id === enc.region);
          if (region) discoverAdjacentRegions(region);
          if (enc.id === "enc_apex") {
            S.phase = "victory";
            notify("Adventure Complete!", "#ffd700");
            callbacks.onAdventureComplete?.();
          } else {
            S.phase = "explore";
          }
        } else {
          S.player.hp = Math.max(1, Math.floor(S.player.maxHp * 0.5));
          SFX.defeat();
          notify("Defeated! Retreating...", "#f87171");
          S.player.x = 400; S.player.y = 1950;
          S.phase = "explore";
        }
        S.currentEncounter = null;
        saveState();
      }
    },
  };
}

export { ENCOUNTERS, EQUIPMENT, REGIONS, NPCS, CHESTS };
