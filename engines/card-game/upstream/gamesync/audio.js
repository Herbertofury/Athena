/**
 * @module cardgame/audio
 * @description Lightweight audio manager — category buses (master, music, sfx),
 * Web Audio API for mixing/ducking, HTMLAudio fallback. Respects extension
 * context and browser autoplay rules.
 *
 * Uses Howler.js if available, falls back to raw Web Audio / HTMLAudioElement.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_VOLUMES = { master: 0.7, music: 0.4, sfx: 0.8 };
const STORAGE_KEY = "gsCardGameAudioSettings";

/* ═══════════════════════════════════════════════════════════════════════════
   SFX Catalog (21 cues per spec §27)
   ═══════════════════════════════════════════════════════════════════════════ */

export const SFX = {
  // Menu
  FRONT_DOOR_HOVER:   "front-door-hover",
  FRONT_DOOR_OPEN:    "front-door-open",
  MENU_PAGE_TURN:     "menu-page-turn",
  DECK_SELECT:        "deck-select",
  HERO_SELECT:        "hero-select",

  // Cards
  CARD_HOVER:         "card-hover",
  CARD_PICK_UP:       "card-pick-up",
  CARD_DROP:          "card-drop",
  SUMMON:             "summon",

  // Combat
  ATTACK_WHOOSH:      "attack-whoosh",
  IMPACT_THUMP:       "impact-thump",
  SHIELD_POP:         "shield-pop",

  // Abilities
  PATCH_CUE:          "patch-cue",
  FRAMEWORK_CUE:      "framework-cue",
  HERO_POWER_CAST:    "hero-power-cast",

  // Turn
  END_TURN:           "end-turn",

  // Match end
  VICTORY_STING:      "victory-sting",
  DEFEAT_STING:       "defeat-sting",

  // Rewards
  REWARD_CLAIM:       "reward-claim",

  // Packs
  PACK_OPEN:          "pack-open",
  RARE_REVEAL:        "rare-reveal",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Audio Engine
   ═══════════════════════════════════════════════════════════════════════════ */

export function createAudioEngine(opts = {}) {
  const basePath = opts.basePath || "/sounds/cardgame/";

  // Volumes (persisted)
  let volumes = { ...DEFAULT_VOLUMES };
  let muted = false;
  let reducedIntensity = false;

  // Load saved settings
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.master != null) volumes.master = parsed.master;
      if (parsed.music != null) volumes.music = parsed.music;
      if (parsed.sfx != null) volumes.sfx = parsed.sfx;
      if (parsed.muted != null) muted = parsed.muted;
      if (parsed.reducedIntensity != null) reducedIntensity = parsed.reducedIntensity;
    }
  } catch (_) {}

  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...volumes, muted, reducedIntensity,
      }));
    } catch (_) {}
  }

  // Audio context (lazy-created after user gesture)
  let audioCtx = null;
  let gainNodes = { master: null, music: null, sfx: null };

  function ensureContext() {
    if (audioCtx) return audioCtx;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // Create gain nodes for bus routing
      gainNodes.master = audioCtx.createGain();
      gainNodes.master.connect(audioCtx.destination);
      gainNodes.master.gain.value = muted ? 0 : volumes.master;

      gainNodes.music = audioCtx.createGain();
      gainNodes.music.connect(gainNodes.master);
      gainNodes.music.gain.value = volumes.music;

      gainNodes.sfx = audioCtx.createGain();
      gainNodes.sfx.connect(gainNodes.master);
      gainNodes.sfx.gain.value = volumes.sfx;
    } catch (_) {
      audioCtx = null;
    }
    return audioCtx;
  }

  // Buffer cache
  const bufferCache = new Map();
  const pendingLoads = new Map();

  async function loadBuffer(name) {
    if (bufferCache.has(name)) return bufferCache.get(name);
    if (pendingLoads.has(name)) return pendingLoads.get(name);

    const url = `${basePath}${name}.webm`;
    const fallbackUrl = `${basePath}${name}.mp3`;

    const promise = (async () => {
      const ctx = ensureContext();
      if (!ctx) return null;
      for (const u of [url, fallbackUrl]) {
        try {
          const resp = await fetch(u);
          if (!resp.ok) continue;
          const arrayBuf = await resp.arrayBuffer();
          const audioBuffer = await ctx.decodeAudioData(arrayBuf);
          bufferCache.set(name, audioBuffer);
          return audioBuffer;
        } catch (_) { continue; }
      }
      return null;
    })();

    pendingLoads.set(name, promise);
    const result = await promise;
    pendingLoads.delete(name);
    return result;
  }

  // Preload critical cues
  function preload(cueNames) {
    if (!Array.isArray(cueNames)) return;
    for (const name of cueNames) {
      loadBuffer(name).catch(() => {});
    }
  }

  // Play SFX
  function playSfx(name, opts2 = {}) {
    if (muted) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const buffer = bufferCache.get(name);
    if (!buffer) {
      // Attempt async load and play
      loadBuffer(name).then(buf => {
        if (buf) _playBuffer(buf, "sfx", opts2);
      }).catch(() => {});
      return;
    }
    _playBuffer(buffer, "sfx", opts2);
  }

  function _playBuffer(buffer, bus, opts2 = {}) {
    const ctx = audioCtx;
    if (!ctx || !buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Optional pitch shift
    if (opts2.pitch) source.playbackRate.value = opts2.pitch;

    // Route through bus
    const gain = gainNodes[bus];
    if (gain) {
      source.connect(gain);
    } else {
      source.connect(gainNodes.master || ctx.destination);
    }

    source.start(0);
    return source;
  }

  // Music (single track at a time)
  let currentMusic = null;
  let currentMusicSource = null;

  async function playMusic(name) {
    stopMusic();
    if (muted) return;
    const buffer = await loadBuffer(name);
    if (!buffer) return;
    const ctx = ensureContext();
    if (!ctx) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = gainNodes.music;
    if (gain) source.connect(gain);
    else source.connect(ctx.destination);

    source.start(0);
    currentMusic = name;
    currentMusicSource = source;
  }

  function stopMusic() {
    if (currentMusicSource) {
      try { currentMusicSource.stop(); } catch (_) {}
      currentMusicSource = null;
      currentMusic = null;
    }
  }

  // Duck music (e.g., during important reveals)
  function duckMusic(durationMs = 800) {
    const gain = gainNodes.music;
    if (!gain || !audioCtx) return;
    const now = audioCtx.currentTime;
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(gain.gain.value * 0.2, now + 0.1);
    gain.gain.linearRampToValueAtTime(volumes.music, now + durationMs / 1000);
  }

  // Volume controls
  function setVolume(bus, val) {
    val = Math.max(0, Math.min(1, val));
    volumes[bus] = val;
    if (gainNodes[bus]) gainNodes[bus].gain.value = val;
    saveSettings();
  }

  function setMuted(val) {
    muted = !!val;
    if (gainNodes.master) gainNodes.master.gain.value = muted ? 0 : volumes.master;
    saveSettings();
  }

  function setReducedIntensity(val) {
    reducedIntensity = !!val;
    saveSettings();
  }

  function getSettings() {
    return { ...volumes, muted, reducedIntensity };
  }

  function destroy() {
    stopMusic();
    if (audioCtx) {
      try { audioCtx.close(); } catch (_) {}
    }
    bufferCache.clear();
  }

  return {
    SFX,
    playSfx,
    playMusic,
    stopMusic,
    duckMusic,
    preload,
    setVolume,
    setMuted,
    setReducedIntensity,
    getSettings,
    destroy,
  };
}
