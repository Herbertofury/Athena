/**
 * @module cardgame/cosmetics
 * @description Card Forge — card theme customization, board skins, card backs,
 * animations, and visual presets. Includes built-in "Hearthstone" premium theme.
 *
 * Reference: REFERENCE_STUDY.md §D1–D9
 * Instead of 79 arena cards, the Hearthstone theme applies a cosmetic overlay
 * to existing game/mod cards — golden frames, gem stats, HS-style layout.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Card Themes — visual presets that change how cards look
   ═══════════════════════════════════════════════════════════════════════════ */

export const CARD_THEMES = {
  default: {
    id: "default",
    name: "GameSync Classic",
    description: "The default dark-fantasy card frame with rarity gem accents.",
    preview: "default",
    unlocked: true,
    frameStyle: "classic",
    statStyle: "gem",        // gem | circle | bar | none
    fontFamily: "inherit",
    artMask: "rounded",      // rounded | oval | full | hex
    rarityGlow: true,
    foilEffect: false,
    animIdle: "none",
    animPlay: "slide-up",
    animDeath: "shatter",
    animAttack: "lunge",
    colors: {
      frameBg: "rgba(18,14,28,0.95)",
      frameBorder: "rgba(80,70,100,0.6)",
      nameplate: "rgba(30,25,45,0.9)",
      textBg: "rgba(20,16,32,0.85)",
      manaBg: "rgba(40,80,200,0.9)",
      atkBg: "rgba(200,160,40,0.9)",
      hpBg: "rgba(180,40,40,0.9)",
    },
  },

  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone",
    description: "Premium Hearthstone-inspired card frames with golden borders, mana crystals, and attack/health shields.",
    preview: "hearthstone",
    unlocked: false,
    cost: { gold: 500 },
    frameStyle: "hearthstone",
    statStyle: "shield",      // HS-style shield/crystal overlays
    fontFamily: "'BelWeb Bold', 'Cinzel', serif",
    artMask: "oval",
    rarityGlow: true,
    foilEffect: true,
    animIdle: "shimmer",
    animPlay: "slam-glow",
    animDeath: "dust-scatter",
    animAttack: "lunge-trail",
    colors: {
      frameBg: "linear-gradient(180deg, rgba(62,48,28,0.97) 0%, rgba(38,30,18,0.97) 100%)",
      frameBorder: "rgba(180,150,80,0.8)",
      nameplate: "linear-gradient(90deg, rgba(60,45,20,0.95) 0%, rgba(90,70,30,0.95) 50%, rgba(60,45,20,0.95) 100%)",
      textBg: "rgba(245,230,200,0.92)",
      manaBg: "radial-gradient(circle, rgba(60,120,220,1) 0%, rgba(30,60,140,1) 100%)",
      atkBg: "radial-gradient(circle, rgba(220,180,50,1) 0%, rgba(160,120,20,1) 100%)",
      hpBg: "radial-gradient(circle, rgba(200,40,40,1) 0%, rgba(140,20,20,1) 100%)",
    },
  },

  neon: {
    id: "neon",
    name: "Neon Cyber",
    description: "Cyberpunk-inspired cards with neon glow borders and holographic effects.",
    preview: "neon",
    unlocked: false,
    cost: { gold: 350 },
    frameStyle: "neon",
    statStyle: "circle",
    fontFamily: "'Orbitron', monospace",
    artMask: "hex",
    rarityGlow: true,
    foilEffect: true,
    animIdle: "pulse-glow",
    animPlay: "glitch-in",
    animDeath: "pixelate",
    animAttack: "dash-trail",
    colors: {
      frameBg: "rgba(8,8,20,0.95)",
      frameBorder: "rgba(0,255,200,0.7)",
      nameplate: "rgba(10,10,30,0.9)",
      textBg: "rgba(15,15,35,0.85)",
      manaBg: "rgba(0,150,255,0.9)",
      atkBg: "rgba(255,50,100,0.9)",
      hpBg: "rgba(0,255,150,0.9)",
    },
  },

  minimal: {
    id: "minimal",
    name: "Clean Minimal",
    description: "Clean white card frames with subtle shadows. Modern and readable.",
    preview: "minimal",
    unlocked: false,
    cost: { gold: 200 },
    frameStyle: "minimal",
    statStyle: "circle",
    fontFamily: "'Inter', sans-serif",
    artMask: "rounded",
    rarityGlow: false,
    foilEffect: false,
    animIdle: "none",
    animPlay: "fade-up",
    animDeath: "fade-out",
    animAttack: "nudge",
    colors: {
      frameBg: "rgba(250,248,245,0.97)",
      frameBorder: "rgba(200,195,185,0.6)",
      nameplate: "rgba(240,236,228,0.95)",
      textBg: "rgba(255,253,250,0.9)",
      manaBg: "rgba(70,130,220,0.9)",
      atkBg: "rgba(220,170,40,0.9)",
      hpBg: "rgba(200,60,60,0.9)",
    },
  },

  retro: {
    id: "retro",
    name: "Pixel Retro",
    description: "8-bit pixel art style cards with chunky borders and retro color palette.",
    preview: "retro",
    unlocked: false,
    cost: { gold: 300 },
    frameStyle: "retro",
    statStyle: "bar",
    fontFamily: "'Press Start 2P', monospace",
    artMask: "full",
    rarityGlow: false,
    foilEffect: false,
    animIdle: "bob",
    animPlay: "bounce-in",
    animDeath: "explode-8bit",
    animAttack: "shake-hit",
    colors: {
      frameBg: "rgba(40,40,60,0.95)",
      frameBorder: "rgba(120,120,160,0.8)",
      nameplate: "rgba(50,50,75,0.95)",
      textBg: "rgba(35,35,55,0.9)",
      manaBg: "rgba(80,80,220,0.95)",
      atkBg: "rgba(220,180,40,0.95)",
      hpBg: "rgba(220,60,60,0.95)",
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Board Skins — background + layout presets for the battlefield
   ═══════════════════════════════════════════════════════════════════════════ */

export const BOARD_SKINS = {
  default: {
    id: "default",
    name: "Dark Sanctum",
    description: "The default dark battlefield with subtle purple ambient glow.",
    unlocked: true,
    bgStyle: "radial-gradient(ellipse at 50% 30%, rgba(30,20,50,1) 0%, rgba(12,10,20,1) 100%)",
    boardTexture: "none",
    dividerStyle: "solid",
    ambientParticles: "dust",
    ambientColor: "rgba(120,80,200,0.15)",
  },
  hearthstone_tavern: {
    id: "hearthstone_tavern",
    name: "Hearthstone Tavern",
    description: "Warm tavern board with wooden planks and candle-lit atmosphere.",
    unlocked: false,
    cost: { gold: 400 },
    bgStyle: "radial-gradient(ellipse at 50% 40%, rgba(80,55,30,1) 0%, rgba(35,22,10,1) 100%)",
    boardTexture: "wood-grain",
    dividerStyle: "rope",
    ambientParticles: "embers",
    ambientColor: "rgba(255,160,50,0.12)",
  },
  hearthstone_arena: {
    id: "hearthstone_arena",
    name: "Hearthstone Arena",
    description: "Grand stone arena with torch-lit columns and epic battle atmosphere.",
    unlocked: false,
    cost: { gold: 400 },
    bgStyle: "radial-gradient(ellipse at 50% 30%, rgba(50,45,60,1) 0%, rgba(20,18,28,1) 100%)",
    boardTexture: "stone-tile",
    dividerStyle: "chain",
    ambientParticles: "sparks",
    ambientColor: "rgba(200,180,100,0.1)",
  },
  cyber_grid: {
    id: "cyber_grid",
    name: "Cyber Grid",
    description: "Neon grid battlefield with holographic projections.",
    unlocked: false,
    cost: { gold: 350 },
    bgStyle: "linear-gradient(180deg, rgba(5,5,15,1) 0%, rgba(10,8,25,1) 100%)",
    boardTexture: "grid",
    dividerStyle: "laser",
    ambientParticles: "data-rain",
    ambientColor: "rgba(0,255,200,0.08)",
  },
  void: {
    id: "void",
    name: "The Void",
    description: "Deep cosmic void with distant stars and nebula drifts.",
    unlocked: false,
    cost: { gold: 500 },
    bgStyle: "radial-gradient(ellipse at 50% 50%, rgba(15,10,30,1) 0%, rgba(2,2,8,1) 100%)",
    boardTexture: "stars",
    dividerStyle: "glow",
    ambientParticles: "nebula",
    ambientColor: "rgba(100,50,200,0.06)",
  },
  nature: {
    id: "nature",
    name: "Enchanted Grove",
    description: "Lush forest clearing with floating leaves and firefly lights.",
    unlocked: false,
    cost: { gold: 300 },
    bgStyle: "radial-gradient(ellipse at 50% 60%, rgba(20,45,20,1) 0%, rgba(8,18,8,1) 100%)",
    boardTexture: "moss",
    dividerStyle: "vine",
    ambientParticles: "fireflies",
    ambientColor: "rgba(100,200,80,0.1)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Card Backs — the reverse side cosmetic
   ═══════════════════════════════════════════════════════════════════════════ */

export const CARD_BACKS = {
  default: {
    id: "default",
    name: "GameSync Standard",
    description: "Classic swirl pattern in deep purple.",
    unlocked: true,
    bgColor: "rgba(30,20,50,1)",
    patternType: "swirl",
    accentColor: "rgba(120,80,200,0.6)",
    borderColor: "rgba(80,60,120,0.8)",
  },
  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone Classic",
    description: "Ornate golden swirl on warm brown leather.",
    unlocked: false,
    cost: { gold: 200 },
    bgColor: "rgba(60,40,20,1)",
    patternType: "hs-swirl",
    accentColor: "rgba(200,160,60,0.7)",
    borderColor: "rgba(160,120,40,0.9)",
  },
  golden: {
    id: "golden",
    name: "Golden Legendary",
    description: "Animated golden card back with legendary gem centerpiece.",
    unlocked: false,
    cost: { gold: 800 },
    bgColor: "linear-gradient(135deg, rgba(180,140,40,1) 0%, rgba(120,90,20,1) 100%)",
    patternType: "legendary-gem",
    accentColor: "rgba(255,220,100,0.8)",
    borderColor: "rgba(200,160,50,1)",
  },
  neon: {
    id: "neon",
    name: "Neon Circuit",
    description: "Cyberpunk circuit board pattern with pulsing neon lines.",
    unlocked: false,
    cost: { gold: 300 },
    bgColor: "rgba(8,8,20,1)",
    patternType: "circuit",
    accentColor: "rgba(0,255,200,0.6)",
    borderColor: "rgba(0,200,150,0.8)",
  },
  fire: {
    id: "fire",
    name: "Inferno",
    description: "Flames licking up from the bottom edge.",
    unlocked: false,
    cost: { gold: 250 },
    bgColor: "rgba(40,10,5,1)",
    patternType: "flames",
    accentColor: "rgba(255,120,20,0.7)",
    borderColor: "rgba(200,80,10,0.9)",
  },
  frost: {
    id: "frost",
    name: "Frost Crystal",
    description: "Ice crystal lattice with frosted glass effect.",
    unlocked: false,
    cost: { gold: 250 },
    bgColor: "rgba(15,25,45,1)",
    patternType: "ice-crystal",
    accentColor: "rgba(120,180,255,0.6)",
    borderColor: "rgba(80,140,220,0.8)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Animation Presets — per-action animation overrides
   ═══════════════════════════════════════════════════════════════════════════ */

export const ANIMATION_PRESETS = {
  default: {
    id: "default",
    name: "Standard",
    description: "Default smooth animations.",
    unlocked: true,
    cardPlay: { type: "slide-up", duration: 300, easing: "ease-out" },
    cardAttack: { type: "lunge", duration: 250, easing: "ease-in-out" },
    cardDeath: { type: "shatter", duration: 400, easing: "ease-in" },
    heroPower: { type: "pulse", duration: 350, easing: "ease-out" },
    turnStart: { type: "banner-slide", duration: 500, easing: "ease-out" },
    damage: { type: "shake", intensity: 4, duration: 200 },
    heal: { type: "glow-pulse", duration: 400, easing: "ease-out" },
    draw: { type: "fan-in", duration: 250, easing: "ease-out" },
    discover: { type: "flip-reveal", duration: 400, easing: "ease-in-out" },
    summon: { type: "pop-in", duration: 300, easing: "back-out" },
  },
  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone Epic",
    description: "Dramatic Hearthstone-style animations with screen shake and particle bursts.",
    unlocked: false,
    cost: { gold: 300 },
    cardPlay: { type: "slam-glow", duration: 350, easing: "ease-out", particles: true },
    cardAttack: { type: "lunge-trail", duration: 300, easing: "ease-in-out", particles: true },
    cardDeath: { type: "dust-scatter", duration: 500, easing: "ease-in", particles: true },
    heroPower: { type: "radial-burst", duration: 400, easing: "ease-out", particles: true },
    turnStart: { type: "epic-banner", duration: 600, easing: "ease-out", sound: true },
    damage: { type: "heavy-shake", intensity: 8, duration: 300, particles: true },
    heal: { type: "holy-light", duration: 450, easing: "ease-out", particles: true },
    draw: { type: "whoosh-in", duration: 200, easing: "ease-out" },
    discover: { type: "golden-flip", duration: 500, easing: "ease-in-out", particles: true },
    summon: { type: "portal-emerge", duration: 400, easing: "back-out", particles: true },
  },
  snappy: {
    id: "snappy",
    name: "Quick & Snappy",
    description: "Fast, responsive animations for competitive play.",
    unlocked: false,
    cost: { gold: 150 },
    cardPlay: { type: "pop-in", duration: 150, easing: "ease-out" },
    cardAttack: { type: "nudge", duration: 120, easing: "ease-in-out" },
    cardDeath: { type: "fade-out", duration: 200, easing: "ease-in" },
    heroPower: { type: "flash", duration: 150, easing: "ease-out" },
    turnStart: { type: "fade-slide", duration: 250, easing: "ease-out" },
    damage: { type: "shake", intensity: 3, duration: 100 },
    heal: { type: "glow-quick", duration: 200, easing: "ease-out" },
    draw: { type: "slide-in", duration: 120, easing: "ease-out" },
    discover: { type: "flip-fast", duration: 200, easing: "ease-in-out" },
    summon: { type: "scale-in", duration: 150, easing: "ease-out" },
  },
  cinematic: {
    id: "cinematic",
    name: "Cinematic",
    description: "Slow, dramatic animations with camera effects.",
    unlocked: false,
    cost: { gold: 400 },
    cardPlay: { type: "zoom-slam", duration: 500, easing: "ease-out", particles: true },
    cardAttack: { type: "slow-lunge", duration: 450, easing: "ease-in-out", particles: true },
    cardDeath: { type: "dramatic-shatter", duration: 700, easing: "ease-in", particles: true },
    heroPower: { type: "screen-flash", duration: 500, easing: "ease-out", particles: true },
    turnStart: { type: "cinematic-wipe", duration: 800, easing: "ease-out", sound: true },
    damage: { type: "screen-crack", intensity: 12, duration: 400, particles: true },
    heal: { type: "divine-radiance", duration: 600, easing: "ease-out", particles: true },
    draw: { type: "mystical-pull", duration: 350, easing: "ease-out", particles: true },
    discover: { type: "golden-reveal", duration: 600, easing: "ease-in-out", particles: true },
    summon: { type: "heroic-entrance", duration: 500, easing: "back-out", particles: true },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Turn Indicator Styles
   ═══════════════════════════════════════════════════════════════════════════ */

export const TURN_INDICATORS = {
  default: {
    id: "default",
    name: "Standard Banner",
    unlocked: true,
    style: "banner",
    yourTurnText: "Your Turn",
    enemyTurnText: "Enemy Turn",
    colors: { bg: "rgba(80,60,160,0.9)", text: "rgba(255,255,255,1)" },
  },
  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone Shield",
    unlocked: false,
    cost: { gold: 150 },
    style: "shield-banner",
    yourTurnText: "Your Turn",
    enemyTurnText: "Enemy Turn",
    colors: { bg: "rgba(160,120,40,0.95)", text: "rgba(255,245,200,1)", border: "rgba(200,160,60,1)" },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Mana Crystal Styles
   ═══════════════════════════════════════════════════════════════════════════ */

export const MANA_STYLES = {
  default: {
    id: "default",
    name: "Gem Orbs",
    unlocked: true,
    filledColor: "rgba(60,120,220,1)",
    emptyColor: "rgba(40,40,60,0.5)",
    shape: "circle",
    glow: true,
  },
  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone Crystals",
    unlocked: false,
    cost: { gold: 200 },
    filledColor: "rgba(80,140,255,1)",
    emptyColor: "rgba(30,30,50,0.6)",
    shape: "diamond",
    glow: true,
    shimmer: true,
  },
  fire: {
    id: "fire",
    name: "Flame Mana",
    unlocked: false,
    cost: { gold: 200 },
    filledColor: "rgba(255,120,30,1)",
    emptyColor: "rgba(50,20,10,0.5)",
    shape: "flame",
    glow: true,
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Health / Armor Display Styles
   ═══════════════════════════════════════════════════════════════════════════ */

export const HEALTH_STYLES = {
  default: {
    id: "default",
    name: "Standard Heart",
    unlocked: true,
    hpColor: "rgba(200,40,40,1)",
    armorColor: "rgba(100,140,200,1)",
    shape: "heart",
  },
  hearthstone: {
    id: "hearthstone",
    name: "Hearthstone Shield",
    unlocked: false,
    cost: { gold: 150 },
    hpColor: "rgba(200,30,30,1)",
    armorColor: "rgba(150,170,200,1)",
    shape: "shield-drop",
    border: "rgba(160,120,40,0.8)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Cosmetics Profile State — what the user has unlocked / equipped
   ═══════════════════════════════════════════════════════════════════════════ */

export function blankCosmeticsState() {
  return {
    activeTheme: "default",
    activeBoardSkin: "default",
    activeCardBack: "default",
    activeAnimPreset: "default",
    activeTurnIndicator: "default",
    activeManaStyle: "default",
    activeHealthStyle: "default",
    unlockedThemes: ["default"],
    unlockedBoardSkins: ["default"],
    unlockedCardBacks: ["default"],
    unlockedAnimPresets: ["default"],
    unlockedTurnIndicators: ["default"],
    unlockedManaStyles: ["default"],
    unlockedHealthStyles: ["default"],
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cosmetics API — purchase, equip, query
   ═══════════════════════════════════════════════════════════════════════════ */

export function getCosmeticsState(profile) {
  if (!profile) return blankCosmeticsState();
  if (!profile.cosmetics) profile.cosmetics = blankCosmeticsState();
  return profile.cosmetics;
}

export function getActiveTheme(profile) {
  const cs = getCosmeticsState(profile);
  return CARD_THEMES[cs.activeTheme] || CARD_THEMES.default;
}

export function getActiveBoardSkin(profile) {
  const cs = getCosmeticsState(profile);
  return BOARD_SKINS[cs.activeBoardSkin] || BOARD_SKINS.default;
}

export function getActiveCardBack(profile) {
  const cs = getCosmeticsState(profile);
  return CARD_BACKS[cs.activeCardBack] || CARD_BACKS.default;
}

export function getActiveAnimPreset(profile) {
  const cs = getCosmeticsState(profile);
  return ANIMATION_PRESETS[cs.activeAnimPreset] || ANIMATION_PRESETS.default;
}

export function getActiveTurnIndicator(profile) {
  const cs = getCosmeticsState(profile);
  return TURN_INDICATORS[cs.activeTurnIndicator] || TURN_INDICATORS.default;
}

export function getActiveManaStyle(profile) {
  const cs = getCosmeticsState(profile);
  return MANA_STYLES[cs.activeManaStyle] || MANA_STYLES.default;
}

export function getActiveHealthStyle(profile) {
  const cs = getCosmeticsState(profile);
  return HEALTH_STYLES[cs.activeHealthStyle] || HEALTH_STYLES.default;
}

/**
 * Purchase a cosmetic item. Returns {success, reason}.
 */
export function purchaseCosmetic(profile, category, itemId) {
  const cs = getCosmeticsState(profile);
  const registry = _registryFor(category);
  if (!registry) return { success: false, reason: "Unknown category" };

  const item = registry[itemId];
  if (!item) return { success: false, reason: "Item not found" };
  if (item.unlocked) return { success: false, reason: "Already free" };

  const unlockKey = _unlockKeyFor(category);
  if (cs[unlockKey]?.includes(itemId)) return { success: false, reason: "Already owned" };

  const cost = item.cost?.gold || 0;
  if (!profile.collection) profile.collection = {};
  const gold = profile.collection.gold || 0;

  if (gold < cost) return { success: false, reason: "Not enough gold" };

  profile.collection.gold = gold - cost;
  if (!cs[unlockKey]) cs[unlockKey] = [];
  cs[unlockKey].push(itemId);

  return { success: true };
}

/**
 * Equip a cosmetic item. Returns {success, reason}.
 */
export function equipCosmetic(profile, category, itemId) {
  const cs = getCosmeticsState(profile);
  const registry = _registryFor(category);
  if (!registry) return { success: false, reason: "Unknown category" };

  const item = registry[itemId];
  if (!item) return { success: false, reason: "Item not found" };

  const unlockKey = _unlockKeyFor(category);
  const isOwned = item.unlocked || cs[unlockKey]?.includes(itemId);
  if (!isOwned) return { success: false, reason: "Not owned" };

  const activeKey = _activeKeyFor(category);
  cs[activeKey] = itemId;
  return { success: true };
}

/* helpers */
function _registryFor(cat) {
  switch (cat) {
    case "theme": return CARD_THEMES;
    case "boardSkin": return BOARD_SKINS;
    case "cardBack": return CARD_BACKS;
    case "animPreset": return ANIMATION_PRESETS;
    case "turnIndicator": return TURN_INDICATORS;
    case "manaStyle": return MANA_STYLES;
    case "healthStyle": return HEALTH_STYLES;
    default: return null;
  }
}
function _unlockKeyFor(cat) {
  switch (cat) {
    case "theme": return "unlockedThemes";
    case "boardSkin": return "unlockedBoardSkins";
    case "cardBack": return "unlockedCardBacks";
    case "animPreset": return "unlockedAnimPresets";
    case "turnIndicator": return "unlockedTurnIndicators";
    case "manaStyle": return "unlockedManaStyles";
    case "healthStyle": return "unlockedHealthStyles";
    default: return "";
  }
}
function _activeKeyFor(cat) {
  switch (cat) {
    case "theme": return "activeTheme";
    case "boardSkin": return "activeBoardSkin";
    case "cardBack": return "activeCardBack";
    case "animPreset": return "activeAnimPreset";
    case "turnIndicator": return "activeTurnIndicator";
    case "manaStyle": return "activeManaStyle";
    case "healthStyle": return "activeHealthStyle";
    default: return "";
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Forge UI — renders the full customization screen
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderCardForge(profile, callbacks = {}) {
  const cs = getCosmeticsState(profile);
  const root = document.createElement("div");
  root.className = "cg-card-forge";
  root.dataset.screen = "card-forge";

  /* ─── Header ─── */
  const header = document.createElement("div");
  header.className = "cg-cf-header";
  header.innerHTML = `
    <div class="cg-cf-title">Card Forge</div>
    <div class="cg-cf-subtitle">Customize your cards, board, animations, and more</div>
  `;
  root.appendChild(header);

  /* ─── Tab Bar ─── */
  const tabs = [
    { id: "themes",     label: "Card Themes",     icon: "\u2726" },
    { id: "boards",     label: "Board Skins",     icon: "\u25A3" },
    { id: "cardbacks",  label: "Card Backs",      icon: "\u2660" },
    { id: "animations", label: "Animations",      icon: "\u2604" },
    { id: "indicators", label: "Turn & UI",       icon: "\u27A4" },
  ];

  const tabBar = document.createElement("div");
  tabBar.className = "cg-cf-tabs";
  let activeTab = "themes";

  for (const tab of tabs) {
    const btn = document.createElement("button");
    btn.className = `cg-cf-tab${tab.id === activeTab ? " active" : ""}`;
    btn.dataset.tab = tab.id;
    btn.innerHTML = `<span class="cg-cf-tab-icon">${tab.icon}</span> ${escHtml(tab.label)}`;
    btn.addEventListener("click", () => {
      activeTab = tab.id;
      tabBar.querySelectorAll(".cg-cf-tab").forEach(t => t.classList.toggle("active", t.dataset.tab === tab.id));
      renderTabContent(tab.id);
    });
    tabBar.appendChild(btn);
  }
  root.appendChild(tabBar);

  /* ─── Content area ─── */
  const content = document.createElement("div");
  content.className = "cg-cf-content";
  root.appendChild(content);

  function renderTabContent(tabId) {
    content.innerHTML = "";
    switch (tabId) {
      case "themes":
        renderItemGrid(content, CARD_THEMES, "theme", cs.activeTheme, cs.unlockedThemes);
        break;
      case "boards":
        renderItemGrid(content, BOARD_SKINS, "boardSkin", cs.activeBoardSkin, cs.unlockedBoardSkins);
        break;
      case "cardbacks":
        renderItemGrid(content, CARD_BACKS, "cardBack", cs.activeCardBack, cs.unlockedCardBacks);
        break;
      case "animations":
        renderItemGrid(content, ANIMATION_PRESETS, "animPreset", cs.activeAnimPreset, cs.unlockedAnimPresets);
        break;
      case "indicators":
        renderIndicatorsTab(content, cs);
        break;
    }
  }

  function renderItemGrid(container, registry, category, activeId, unlockedIds) {
    const grid = document.createElement("div");
    grid.className = "cg-cf-grid";

    for (const [id, item] of Object.entries(registry)) {
      const isOwned = item.unlocked || (unlockedIds || []).includes(id);
      const isActive = id === activeId;
      const card = document.createElement("div");
      card.className = `cg-cf-item${isActive ? " equipped" : ""}${!isOwned ? " locked" : ""}`;
      card.dataset.itemId = id;

      /* Preview swatch */
      const preview = document.createElement("div");
      preview.className = "cg-cf-preview";
      const colors = item.colors || {};
      const bgVal = colors.frameBg || colors.bgColor || item.bgStyle || item.bgColor || "rgba(30,25,45,0.9)";
      preview.style.background = bgVal;
      if (colors.frameBorder || item.borderColor) {
        preview.style.borderColor = colors.frameBorder || item.borderColor;
      }
      if (item.foilEffect) preview.classList.add("foil");
      card.appendChild(preview);

      /* Info */
      const info = document.createElement("div");
      info.className = "cg-cf-item-info";
      info.innerHTML = `
        <div class="cg-cf-item-name">${escHtml(item.name)}</div>
        <div class="cg-cf-item-desc">${escHtml(item.description)}</div>
      `;
      card.appendChild(info);

      /* Action */
      const actionWrap = document.createElement("div");
      actionWrap.className = "cg-cf-item-action";

      if (isActive) {
        actionWrap.innerHTML = `<span class="cg-cf-equipped-badge">Equipped</span>`;
      } else if (isOwned) {
        const eqBtn = document.createElement("button");
        eqBtn.className = "cg-btn cg-btn-primary cg-btn-sm";
        eqBtn.textContent = "Equip";
        eqBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const result = equipCosmetic(profile, category, id);
          if (result.success) {
            callbacks.onChanged?.();
            renderTabContent(activeTab);
          }
        });
        actionWrap.appendChild(eqBtn);
      } else {
        const cost = item.cost?.gold || 0;
        const buyBtn = document.createElement("button");
        buyBtn.className = "cg-btn cg-btn-gold cg-btn-sm";
        buyBtn.innerHTML = `<span class="cg-cf-cost">${cost}</span> Gold`;
        buyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const result = purchaseCosmetic(profile, category, id);
          if (result.success) {
            callbacks.onChanged?.();
            renderTabContent(activeTab);
          } else {
            callbacks.onError?.(result.reason);
          }
        });
        actionWrap.appendChild(buyBtn);
      }

      card.appendChild(actionWrap);
      grid.appendChild(card);
    }

    container.appendChild(grid);
  }

  function renderIndicatorsTab(container, cosState) {
    /* Turn indicators */
    const turnSection = document.createElement("div");
    turnSection.className = "cg-cf-section";
    turnSection.innerHTML = `<div class="cg-cf-section-title">Turn Indicators</div>`;
    const turnGrid = document.createElement("div");
    turnGrid.className = "cg-cf-grid cg-cf-grid-sm";
    for (const [id, item] of Object.entries(TURN_INDICATORS)) {
      const isOwned = item.unlocked || (cosState.unlockedTurnIndicators || []).includes(id);
      const isActive = id === cosState.activeTurnIndicator;
      const el = _buildSmallItem(id, item, isOwned, isActive, "turnIndicator");
      turnGrid.appendChild(el);
    }
    turnSection.appendChild(turnGrid);
    container.appendChild(turnSection);

    /* Mana styles */
    const manaSection = document.createElement("div");
    manaSection.className = "cg-cf-section";
    manaSection.innerHTML = `<div class="cg-cf-section-title">Mana Crystals</div>`;
    const manaGrid = document.createElement("div");
    manaGrid.className = "cg-cf-grid cg-cf-grid-sm";
    for (const [id, item] of Object.entries(MANA_STYLES)) {
      const isOwned = item.unlocked || (cosState.unlockedManaStyles || []).includes(id);
      const isActive = id === cosState.activeManaStyle;
      const el = _buildSmallItem(id, item, isOwned, isActive, "manaStyle");
      manaGrid.appendChild(el);
    }
    manaSection.appendChild(manaGrid);
    container.appendChild(manaSection);

    /* Health styles */
    const hpSection = document.createElement("div");
    hpSection.className = "cg-cf-section";
    hpSection.innerHTML = `<div class="cg-cf-section-title">Health Display</div>`;
    const hpGrid = document.createElement("div");
    hpGrid.className = "cg-cf-grid cg-cf-grid-sm";
    for (const [id, item] of Object.entries(HEALTH_STYLES)) {
      const isOwned = item.unlocked || (cosState.unlockedHealthStyles || []).includes(id);
      const isActive = id === cosState.activeHealthStyle;
      const el = _buildSmallItem(id, item, isOwned, isActive, "healthStyle");
      hpGrid.appendChild(el);
    }
    hpSection.appendChild(hpGrid);
    container.appendChild(hpSection);
  }

  function _buildSmallItem(id, item, isOwned, isActive, category) {
    const el = document.createElement("div");
    el.className = `cg-cf-item cg-cf-item-sm${isActive ? " equipped" : ""}${!isOwned ? " locked" : ""}`;
    el.innerHTML = `
      <div class="cg-cf-item-name">${escHtml(item.name)}</div>
      <div class="cg-cf-item-desc">${escHtml(item.description || "")}</div>
    `;
    if (isActive) {
      el.innerHTML += `<span class="cg-cf-equipped-badge">Equipped</span>`;
    } else if (isOwned) {
      const btn = document.createElement("button");
      btn.className = "cg-btn cg-btn-primary cg-btn-sm";
      btn.textContent = "Equip";
      btn.addEventListener("click", () => {
        equipCosmetic(profile, category, id);
        callbacks.onChanged?.();
        renderTabContent(activeTab);
      });
      el.appendChild(btn);
    } else {
      const cost = item.cost?.gold || 0;
      const btn = document.createElement("button");
      btn.className = "cg-btn cg-btn-gold cg-btn-sm";
      btn.innerHTML = `${cost} Gold`;
      btn.addEventListener("click", () => {
        const r = purchaseCosmetic(profile, category, id);
        if (r.success) { callbacks.onChanged?.(); renderTabContent(activeTab); }
        else callbacks.onError?.(r.reason);
      });
      el.appendChild(btn);
    }
    return el;
  }

  /* Initial render */
  renderTabContent(activeTab);

  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Theme CSS Application — applies the active theme to card DOM elements
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Apply active theme CSS variables to a shell element so all cards
 * and UI elements inside inherit the theme.
 */
export function applyThemeToShell(shellEl, profile) {
  if (!shellEl) return;
  const theme = getActiveTheme(profile);
  const boardSkin = getActiveBoardSkin(profile);
  const mana = getActiveManaStyle(profile);
  const hp = getActiveHealthStyle(profile);

  shellEl.dataset.cardTheme = theme.id;
  shellEl.dataset.boardSkin = boardSkin.id;

  const s = shellEl.style;
  /* Card theme vars */
  s.setProperty("--cg-theme-frame-bg", theme.colors.frameBg);
  s.setProperty("--cg-theme-frame-border", theme.colors.frameBorder);
  s.setProperty("--cg-theme-nameplate", theme.colors.nameplate);
  s.setProperty("--cg-theme-text-bg", theme.colors.textBg);
  s.setProperty("--cg-theme-mana-bg", theme.colors.manaBg);
  s.setProperty("--cg-theme-atk-bg", theme.colors.atkBg);
  s.setProperty("--cg-theme-hp-bg", theme.colors.hpBg);
  s.setProperty("--cg-theme-font", theme.fontFamily);
  s.setProperty("--cg-theme-art-mask", theme.artMask === "oval" ? "ellipse(48% 48%)" :
    theme.artMask === "hex" ? "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" :
    theme.artMask === "full" ? "none" : "inset(4% round 6px)");

  /* Board skin vars */
  s.setProperty("--cg-board-bg", boardSkin.bgStyle);
  s.setProperty("--cg-board-ambient", boardSkin.ambientColor);

  /* Mana vars */
  s.setProperty("--cg-mana-filled", mana.filledColor);
  s.setProperty("--cg-mana-empty", mana.emptyColor);
  s.setProperty("--cg-mana-glow", mana.glow ? "0 0 6px " + mana.filledColor : "none");

  /* Health vars */
  s.setProperty("--cg-hp-color", hp.hpColor);
  s.setProperty("--cg-armor-color", hp.armorColor);

  /* Foil class */
  shellEl.classList.toggle("cg-theme-foil", !!theme.foilEffect);
  shellEl.classList.toggle("cg-theme-rarity-glow", !!theme.rarityGlow);
}

/* helper */
function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
