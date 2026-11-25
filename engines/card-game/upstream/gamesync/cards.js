/**
 * @module cardgame/cards
 * @description Card derivation from games and mods. Card types, rarities,
 * keyword definitions, and the card-data registry.
 *
 * Cards are derived deterministically from the user's game library data.
 * Every game becomes a minion card. Mods become spell/attachment/support cards.
 * The same game always produces the same card stats (idempotent).
 */

import { lookupDeveloperByGameTitle } from './developer-db.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

export const CARD_TYPES = {
  MINION: "minion",
  SPELL: "spell",
  WEAPON: "weapon",
  FRAMEWORK: "framework",   // special persistent attachment
};

export const RARITIES = {
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
};

export const RARITY_DUST_COST = {
  common: 40,
  rare: 100,
  epic: 400,
  legendary: 1600,
};

export const RARITY_DUST_REFUND = {
  common: 5,
  rare: 20,
  epic: 100,
  legendary: 400,
};

export const RARITY_ORDER = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
};

export const RARITY_COLORS = {
  common: "rgba(180,180,180,1)",
  rare: "rgba(93,159,255,1)",
  epic: "rgba(199,107,255,1)",
  legendary: "rgba(255,197,66,1)",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Keywords — the mechanical vocabulary of the game
   ═══════════════════════════════════════════════════════════════════════════ */

export const KEYWORDS = {
  taunt: {
    id: "taunt",
    name: "Taunt",
    description: "Enemies must attack this minion first.",
    color: "rgba(120,180,255,0.9)",
  },
  charge: {
    id: "charge",
    name: "Charge",
    description: "Can attack immediately when played.",
    color: "rgba(255,220,80,0.9)",
  },
  shield: {
    id: "shield",
    name: "Divine Shield",
    description: "The first time this takes damage, prevent it instead.",
    color: "rgba(255,230,140,0.9)",
  },
  rush: {
    id: "rush",
    name: "Rush",
    description: "Can attack minions immediately when played.",
    color: "rgba(180,255,180,0.9)",
  },
  stealth: {
    id: "stealth",
    name: "Stealth",
    description: "Cannot be targeted until it attacks.",
    color: "rgba(160,140,200,0.9)",
  },
  lifesteal: {
    id: "lifesteal",
    name: "Lifesteal",
    description: "Damage dealt by this also heals your hero.",
    color: "rgba(210,100,255,0.9)",
  },
  poisonous: {
    id: "poisonous",
    name: "Poisonous",
    description: "Destroy any minion damaged by this.",
    color: "rgba(120,255,100,0.9)",
  },
  windfury: {
    id: "windfury",
    name: "Windfury",
    description: "Can attack twice each turn.",
    color: "rgba(140,220,255,0.9)",
  },
  battlecry: {
    id: "battlecry",
    name: "Battlecry",
    description: "Does something when played from hand.",
    color: "rgba(255,180,80,0.9)",
  },
  deathrattle: {
    id: "deathrattle",
    name: "Deathrattle",
    description: "Does something when this dies.",
    color: "rgba(140,200,140,0.9)",
  },
  discover: {
    id: "discover",
    name: "Discover",
    description: "Choose one of three cards to add to your hand.",
    color: "rgba(100,200,255,0.9)",
  },
  install: {
    id: "install",
    name: "Install",
    description: "Attach this mod to a valid target game card. Grants the target a buff.",
    color: "rgba(80,200,180,0.9)",
  },
  patch: {
    id: "patch",
    name: "Patch",
    description: "Restore health to a friendly minion or hero.",
    color: "rgba(160,200,80,0.9)",
  },
  overhaul: {
    id: "overhaul",
    name: "Overhaul",
    description: "Completely replace a target minion's stats. Powerful but risky.",
    color: "rgba(255,160,80,0.9)",
  },
  volatile: {
    id: "volatile",
    name: "Volatile",
    description: "Has a chance to break or damage adjacent minions at end of turn.",
    color: "rgba(255,100,100,0.9)",
  },
  stable: {
    id: "stable",
    name: "Stable",
    description: "Cannot be affected by Volatile effects. Immune to random damage.",
    color: "rgba(100,180,255,0.9)",
  },
  framework: {
    id: "framework",
    name: "Framework",
    description: "Remains in play permanently. Buffs all compatible mods.",
    color: "rgba(255,200,120,0.9)",
  },
  combo: {
    id: "combo",
    name: "Combo",
    description: "Bonus effect if you already played a card this turn.",
    color: "rgba(255,180,200,0.9)",
  },

  /* ── New keywords (REFERENCE_STUDY §B1–B10) ── */
  reborn: {
    id: "reborn",
    name: "Reborn",
    description: "The first time this minion dies, resummon it with 1 Health.",
    color: "rgba(220,200,120,0.9)",
  },
  freeze: {
    id: "freeze",
    name: "Freeze",
    description: "Frozen characters lose their next attack.",
    color: "rgba(140,200,255,0.9)",
  },
  overload: {
    id: "overload",
    name: "Overload",
    description: "Playing this locks some of your Mana Crystals next turn.",
    color: "rgba(80,100,200,0.9)",
  },
  dormant: {
    id: "dormant",
    name: "Dormant",
    description: "Sleeps for 2 turns, then awakens with full power. Cannot be targeted or attacked while dormant.",
    color: "rgba(100,80,140,0.9)",
  },
  returnToHand: {
    id: "returnToHand",
    name: "Return",
    description: "Return a friendly minion to your hand and give it +1/+1.",
    color: "rgba(160,220,255,0.9)",
  },
  handScaling: {
    id: "handScaling",
    name: "Hand Surge",
    description: "Gains stats equal to the number of cards in your hand.",
    color: "rgba(200,160,255,0.9)",
  },
  healAll: {
    id: "healAll",
    name: "Mass Mend",
    description: "Restore Health to all friendly minions.",
    color: "rgba(120,255,160,0.9)",
  },
  universalAoe: {
    id: "universalAoe",
    name: "Cataclysm",
    description: "Deal damage to ALL characters — minions and heroes on both sides.",
    color: "rgba(255,80,60,0.9)",
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Tribes / Races (REFERENCE_STUDY §B5 — from hsdata 41 tribes)
   ═══════════════════════════════════════════════════════════════════════════ */

export const TRIBES = {
  beast: { id: "beast", name: "Beast", color: "rgba(140,180,80,0.9)" },
  dragon: { id: "dragon", name: "Dragon", color: "rgba(200,120,40,0.9)" },
  mech: { id: "mech", name: "Mech", color: "rgba(160,160,180,0.9)" },
  elemental: { id: "elemental", name: "Elemental", color: "rgba(80,200,220,0.9)" },
  demon: { id: "demon", name: "Demon", color: "rgba(180,60,180,0.9)" },
  murloc: { id: "murloc", name: "Murloc", color: "rgba(60,180,140,0.9)" },
  pirate: { id: "pirate", name: "Pirate", color: "rgba(200,80,80,0.9)" },
  undead: { id: "undead", name: "Undead", color: "rgba(100,140,120,0.9)" },
  totem: { id: "totem", name: "Totem", color: "rgba(180,140,100,0.9)" },
  naga: { id: "naga", name: "Naga", color: "rgba(60,100,200,0.9)" },
  all: { id: "all", name: "All", color: "rgba(220,200,100,0.9)" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Spell Schools (REFERENCE_STUDY §B6 — from hsdata)
   ═══════════════════════════════════════════════════════════════════════════ */

export const SPELL_SCHOOLS = {
  fire: { id: "fire", name: "Fire", color: "rgba(255,100,30,0.9)" },
  frost: { id: "frost", name: "Frost", color: "rgba(100,180,255,0.9)" },
  arcane: { id: "arcane", name: "Arcane", color: "rgba(180,100,255,0.9)" },
  nature: { id: "nature", name: "Nature", color: "rgba(80,200,80,0.9)" },
  shadow: { id: "shadow", name: "Shadow", color: "rgba(140,60,200,0.9)" },
  holy: { id: "holy", name: "Holy", color: "rgba(255,230,120,0.9)" },
  fel: { id: "fel", name: "Fel", color: "rgba(120,200,60,0.9)" },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Deterministic hash helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function fnv1aHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hashFloat(str) {
  return (fnv1aHash(String(str)) % 10000) / 10000;
}

function hashInt(str, min, max) {
  const f = hashFloat(str);
  return Math.floor(min + f * (max - min + 1));
}

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card derivation — Games → Minion cards
   ═══════════════════════════════════════════════════════════════════════════ */

export function deriveCardFromGame(game) {
  if (!game?.key) return null;
  const key = String(game.key);
  const title = String(game.title || game.name || "Unknown Game");
  const h = hashFloat(key);

  // === Mana cost ===
  // Based on playtime hours + hash variance. More hours → higher cost (more epic).
  const hours = Number(game.hoursPlayed) || Number(game.hours) || Number(game.playtimeHours) || 0;
  const baseCost = Math.floor(hours / 12) + hashInt(`${key}:cost`, 0, 2);
  const cost = clampInt(baseCost, 1, 10);

  // === Attack ===
  // Based on metacritic / review score + hash variance
  const metaScore = Number(game.rawg?.metacritic) || Number(game.metaScore) || Number(game.metacritic) || 70;
  const baseAtk = Math.floor((metaScore - 40) / 9) + hashInt(`${key}:atk`, 0, 1);
  const attack = clampInt(baseAtk, 1, 12);

  // === Health ===
  // Based on achievements + hash variance for depth/replayability feel
  const achievements = Number(game.achievements) || Number(game.rawg?.achievements_count) || 0;
  const baseHp = 2 + Math.floor(achievements / 20) + hashInt(`${key}:hp`, 0, 3);
  const health = clampInt(baseHp, 1, 16);

  // === Rarity ===
  // Based on review count (popularity + recognition), with hoursPlayed fallback
  const reviews = Number(game.reviewCount) || Number(game.reviews) || Number(game.rawg?.ratings_count) || 0;
  let rarity;
  if (reviews > 0) {
    // Review-count based rarity (ideal data)
    if (reviews >= 100000) rarity = RARITIES.LEGENDARY;
    else if (reviews >= 30000) rarity = RARITIES.EPIC;
    else if (reviews >= 5000) rarity = RARITIES.RARE;
    else rarity = RARITIES.COMMON;
  } else {
    // Fallback: use hoursPlayed + deterministic hash for natural distribution
    const hp = Number(game.hoursPlayed) || 0;
    const rarityRoll = hashFloat(`${key}:rarity`);
    if (hp >= 200 && rarityRoll < 0.25) rarity = RARITIES.LEGENDARY;
    else if (hp >= 50 && rarityRoll < 0.35) rarity = RARITIES.EPIC;
    else if (hp >= 10 && rarityRoll < 0.45) rarity = RARITIES.RARE;
    else if (rarityRoll < 0.08) rarity = RARITIES.LEGENDARY;
    else if (rarityRoll < 0.22) rarity = RARITIES.EPIC;
    else if (rarityRoll < 0.42) rarity = RARITIES.RARE;
    else rarity = RARITIES.COMMON;
  }

  // === Keywords ===
  const keywords = [];
  const kwHash = hashFloat(`${key}:kw`);
  const kwHash2 = hashFloat(`${key}:kw2`);
  const kwHash3 = hashFloat(`${key}:kw3`);

  // Heavier minions more likely to be tanks
  if (cost >= 5 && kwHash < 0.35) keywords.push("taunt");
  else if (kwHash < 0.12) keywords.push("taunt");

  // Cheap aggro minions: charge or rush
  if (cost <= 3 && kwHash2 < 0.18) keywords.push("charge");
  else if (cost <= 4 && kwHash2 >= 0.18 && kwHash2 < 0.32) keywords.push("rush");

  // Shield for rarer cards
  if (rarity === RARITIES.LEGENDARY && kwHash3 < 0.5) keywords.push("shield");
  else if (rarity === RARITIES.EPIC && kwHash3 < 0.25) keywords.push("shield");

  // Battlecry for medium-cost popular cards
  if (cost >= 3 && cost <= 6 && hashFloat(`${key}:bcry`) < 0.2) keywords.push("battlecry");

  // Deathrattle for darker/edgier games
  if (hashFloat(`${key}:dr`) < 0.12) keywords.push("deathrattle");

  // Lifesteal for high-cost epic/legendary
  if (cost >= 6 && rarity !== RARITIES.COMMON && hashFloat(`${key}:ls`) < 0.15) keywords.push("lifesteal");

  // Windfury — very rare
  if (hashFloat(`${key}:wf`) < 0.06) keywords.push("windfury");

  // Discover — mid-range cards
  if (cost >= 3 && cost <= 5 && hashFloat(`${key}:disc`) < 0.1) keywords.push("discover");

  // === New keywords (B1-B10) ===
  // Reborn — rare/epic minions, medium probability
  if (rarity !== RARITIES.COMMON && hashFloat(`${key}:reborn`) < 0.1) keywords.push("reborn");

  // Freeze — for cold/puzzle-type games
  if (cost >= 2 && hashFloat(`${key}:freeze`) < 0.06) keywords.push("freeze");

  // Overload — powerful cheap minions trade future mana
  if (cost <= 3 && attack >= 3 && hashFloat(`${key}:overload`) < 0.08) keywords.push("overload");

  // Dormant — legendary mechanic, very rare
  if (rarity === RARITIES.LEGENDARY && hashFloat(`${key}:dormant`) < 0.15) keywords.push("dormant");

  // === Tribe assignment (B5) ===
  const tribeHash = hashFloat(`${key}:tribe`);
  let tribe = null;
  if (tribeHash < 0.12) tribe = "beast";
  else if (tribeHash < 0.22) tribe = "dragon";
  else if (tribeHash < 0.32) tribe = "mech";
  else if (tribeHash < 0.40) tribe = "elemental";
  else if (tribeHash < 0.46) tribe = "demon";
  else if (tribeHash < 0.50) tribe = "pirate";
  else if (tribeHash < 0.53) tribe = "undead";
  // else no tribe (~47% are tribeeless)

  // === Card type ===
  const type = CARD_TYPES.MINION;

  // === Flavor text ===
  const genres = extractGenres(game);
  const platforms = extractPlatforms(game);
  const developer = extractDeveloper(game);
  const flavorParts = [];
  if (developer) flavorParts.push(`Crafted by ${developer}`);
  if (genres.length) flavorParts.push(genres.slice(0, 2).join(" / "));
  if (platforms.length) flavorParts.push(`Available on ${platforms.slice(0, 2).join(", ")}`);
  const flavor = flavorParts.join(". ") + (flavorParts.length ? "." : "");

  return {
    id: key,
    gameKey: key,
    type,
    title,
    cost,
    attack,
    health,
    rarity,
    keywords,
    tribe: tribe || null,
    spellSchool: null,
    overloadCost: keywords.includes("overload") ? clampInt(hashInt(`${key}:olcost`, 1, 3), 1, 3) : 0,
    dormantTurns: keywords.includes("dormant") ? 2 : 0,
    flavor,
    developer: developer || "",
    genres,
    platforms,
    coverUrl: String(game.coverUrl || ""),
    portraitUrl: String(
      game.images?.library_600x900_2x || game.images?.library_600x900_2x_cf ||
      game.images?.library_600x900 || ""
    ),
    platform: String(game.platform || ""),
    source: "game",
    set: "core",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card derivation — Mods → Spell / Attachment cards
   ═══════════════════════════════════════════════════════════════════════════ */

export function deriveCardFromMod(mod, targetGame) {
  if (!mod?.key && !mod?.id) return null;
  const key = String(mod.key || mod.id);
  const title = String(mod.name || mod.title || "Unknown Mod");
  const h = hashFloat(`mod:${key}`);

  // Mods are generally cheaper (utility / support)
  const cost = clampInt(hashInt(`mod:${key}:cost`, 1, 6), 1, 8);

  // Spell or attachment based on mod type
  const isFramework = !!(mod.tags || []).some(t =>
    /framework|engine|loader|api|library/i.test(String(t)));
  const isOverhaul = !!(mod.tags || []).some(t =>
    /overhaul|total.?conversion|remake/i.test(String(t)));
  const isPatch = !!(mod.tags || []).some(t =>
    /fix|patch|bugfix|stability|performance/i.test(String(t)));

  let type = CARD_TYPES.SPELL;
  const keywords = [];

  if (isFramework) {
    type = CARD_TYPES.FRAMEWORK;
    keywords.push("framework");
  } else if (isOverhaul) {
    keywords.push("overhaul");
  } else if (isPatch) {
    keywords.push("patch");
  } else {
    keywords.push("install");
  }

  // Spell stats: effect strength instead of attack/health
  const effectPower = clampInt(hashInt(`mod:${key}:pow`, 1, 8), 1, 8);
  const durability = isFramework ? clampInt(hashInt(`mod:${key}:dur`, 2, 5), 2, 5) : 0;

  // Stability / volatility
  const isVolatile = !!(mod.conflicts || []).length > 2 || h < 0.08;
  if (isVolatile) keywords.push("volatile");
  if (!isVolatile && isPatch) keywords.push("stable");

  // Rarity based on endorsements / downloads
  const endorsements = Number(mod.endorsements || mod.downloads || 0);
  let rarity;
  if (endorsements >= 50000) rarity = RARITIES.LEGENDARY;
  else if (endorsements >= 10000) rarity = RARITIES.EPIC;
  else if (endorsements >= 1000) rarity = RARITIES.RARE;
  else rarity = RARITIES.COMMON;

  // Battlecry for impactful mods
  if (hashFloat(`mod:${key}:bcry`) < 0.25) keywords.push("battlecry");

  // Discover for utility mods
  if (cost >= 2 && cost <= 4 && hashFloat(`mod:${key}:disc`) < 0.15) keywords.push("discover");

  // === Spell school assignment (B6) ===
  const ssHash = hashFloat(`mod:${key}:ss`);
  let spellSchool = null;
  if (type === CARD_TYPES.SPELL) {
    if (ssHash < 0.15) spellSchool = "fire";
    else if (ssHash < 0.28) spellSchool = "frost";
    else if (ssHash < 0.40) spellSchool = "arcane";
    else if (ssHash < 0.52) spellSchool = "nature";
    else if (ssHash < 0.62) spellSchool = "shadow";
    else if (ssHash < 0.70) spellSchool = "holy";
    // else no spell school
  }

  const flavor = targetGame
    ? `A mod for ${String(targetGame.title || targetGame.name || "your game")}.`
    : "A mod from the workshop.";

  return {
    id: `mod:${key}`,
    modKey: key,
    type,
    title,
    cost,
    attack: type === CARD_TYPES.SPELL ? 0 : effectPower,
    health: type === CARD_TYPES.FRAMEWORK ? durability : 0,
    effectPower,
    rarity,
    keywords,
    tribe: null,
    spellSchool: spellSchool || null,
    overloadCost: 0,
    dormantTurns: 0,
    flavor,
    targetGameKey: targetGame?.key || "",
    coverUrl: String(mod.imageUrl || mod.coverUrl || ""),
    platform: String(mod.source || ""),
    source: "mod",
    set: "mods",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card pool builder — builds the complete card registry from library data
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildCardPool(games, modsList) {
  const pool = new Map();

  // Game cards
  if (Array.isArray(games)) {
    for (const g of games) {
      if (!g?.key) continue;
      if (g.status === "wishlist") continue;
      const card = deriveCardFromGame(g);
      if (card) pool.set(card.id, { game: g, mod: null, card });
    }
  }

  // Mod cards
  if (Array.isArray(modsList)) {
    for (const mod of modsList) {
      const card = deriveCardFromMod(mod, null);
      if (card) pool.set(card.id, { game: null, mod, card });
    }
  }

  return pool;
}

export function getPoolAsArray(pool) {
  return Array.from(pool.values())
    .sort((a, b) => a.card.cost - b.card.cost || a.card.title.localeCompare(b.card.title));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Search & filter
   ═══════════════════════════════════════════════════════════════════════════ */

export function searchCards(poolArray, query) {
  if (!query || !query.trim()) return poolArray;

  const filters = parseSearchQuery(query);
  return poolArray.filter(entry => matchesFilters(entry.card, filters));
}

function parseSearchQuery(raw) {
  const filters = [];
  const str = String(raw).trim();
  // Match key:value pairs and bare text
  const regex = /(\w+):("([^"]+)"|(\S+))|"([^"]+)"|(\S+)/g;
  let m;
  while ((m = regex.exec(str)) !== null) {
    if (m[1]) {
      // key:value filter
      const key = m[1].toLowerCase();
      const val = (m[3] || m[4] || "").toLowerCase();
      filters.push({ type: "field", key, val });
    } else {
      // bare text search
      const text = (m[5] || m[6] || "").toLowerCase();
      if (text) filters.push({ type: "text", val: text });
    }
  }
  return filters;
}

function matchesFilters(card, filters) {
  for (const f of filters) {
    if (f.type === "text") {
      const haystack = `${card.title} ${card.flavor || ""} ${(card.keywords || []).join(" ")} ${card.developer || ""}`.toLowerCase();
      if (!haystack.includes(f.val)) return false;
    } else if (f.type === "field") {
      if (!matchField(card, f.key, f.val)) return false;
    }
  }
  return true;
}

function matchField(card, key, val) {
  const numVal = parseFloat(val);
  const isOp = /^([<>]=?|=)(.+)/.exec(val);
  const compare = (actual, op, target) => {
    const a = Number(actual);
    const t = Number(target);
    if (!isFinite(a) || !isFinite(t)) return false;
    switch (op) {
      case "<=": return a <= t;
      case ">=": return a >= t;
      case "<": return a < t;
      case ">": return a > t;
      case "=": return a === t;
      default: return a === t;
    }
  };

  switch (key) {
    case "cost":
    case "mana":
      if (isOp) return compare(card.cost, isOp[1], isOp[2]);
      return card.cost === Math.round(numVal);
    case "atk":
    case "attack":
      if (isOp) return compare(card.attack, isOp[1], isOp[2]);
      return card.attack === Math.round(numVal);
    case "hp":
    case "health":
      if (isOp) return compare(card.health, isOp[1], isOp[2]);
      return card.health === Math.round(numVal);
    case "rarity":
      return card.rarity === val;
    case "type":
      return card.type === val || card.source === val;
    case "keyword":
      return (card.keywords || []).some(k => k.toLowerCase() === val);
    case "hero":
    case "developer":
      return (card.developer || "").toLowerCase().includes(val);
    case "platform":
      return (card.platform || "").toLowerCase().includes(val) ||
        (card.platforms || []).some(p => p.toLowerCase().includes(val));
    case "genre":
      return (card.genres || []).some(g => g.toLowerCase().includes(val));
    case "set":
    case "pack":
      return (card.set || "").toLowerCase() === val;
    case "source":
      return card.source === val;
    case "owned":
      return true; // context-dependent: pool already filtered to owned
    case "premium":
      return !!card.premium;
    case "target":
      return (card.targetGame || "").toLowerCase().includes(val) ||
        (card.target || "").toLowerCase().includes(val);
    case "conflict":
      if (val === "yes" || val === "true") return !!(card.conflictsWith?.length);
      if (val === "no" || val === "false") return !(card.conflictsWith?.length);
      return (card.conflictsWith || []).some(c => c.toLowerCase().includes(val));
    case "requires":
      return (card.requires || []).some(r => r.toLowerCase().includes(val));
    case "supports":
      return (card.supports || []).some(s => s.toLowerCase().includes(val));
    case "framework":
      if (val === "true" || val === "yes") return card.type === "framework";
      if (val === "false" || val === "no") return card.type !== "framework";
      return card.type === "framework";
    case "volatile":
      if (val === "true" || val === "yes") return (card.keywords || []).includes("volatile");
      return !(card.keywords || []).includes("volatile");
    case "stable":
      if (val === "true" || val === "yes") return (card.keywords || []).includes("stable");
      return !(card.keywords || []).includes("stable");
    case "tribe":
    case "race":
      return (card.tribe || "").toLowerCase() === val;
    case "school":
    case "spellschool":
      return (card.spellSchool || "").toLowerCase() === val;
    case "new":
      return true; // filtering handled at collection level
    default:
      return true;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Metadata extraction helpers (game objects vary in shape)
   ═══════════════════════════════════════════════════════════════════════════ */

function extractGenres(g) {
  const list = [];
  if (Array.isArray(g?.genres)) list.push(...g.genres);
  if (Array.isArray(g?.steamGenres)) list.push(...g.steamGenres);
  if (Array.isArray(g?.rawg?.genres)) list.push(...g.rawg.genres.map(x => (typeof x === 'object' && x?.name) ? x.name : x));
  if (Array.isArray(g?.meta?.genres)) list.push(...g.meta.genres);
  const unique = [...new Set(list.map(x => String(x).trim()).filter(x => x && x !== '[object Object]'))];
  return unique.slice(0, 5);
}

function extractPlatforms(g) {
  const list = [];
  if (Array.isArray(g?.platforms)) list.push(...g.platforms);
  if (Array.isArray(g?.rawg?.platforms)) list.push(...g.rawg.platforms.map(x => (typeof x === 'object' && (x?.platform?.name || x?.name)) ? (x.platform?.name || x.name) : x));
  if (Array.isArray(g?.meta?.platforms)) list.push(...g.meta.platforms);
  if (Array.isArray(g?.playnite?.platforms)) list.push(...g.playnite.platforms);
  const unique = [...new Set(list.map(x => String(x).trim().toUpperCase()).filter(x => x && x !== '[OBJECT OBJECT]'))];
  return unique.slice(0, 4);
}

function extractDeveloper(g) {
  const devs = [];
  if (Array.isArray(g?.developers)) devs.push(...g.developers);
  if (Array.isArray(g?.rawg?.developers)) devs.push(...g.rawg.developers);
  if (Array.isArray(g?.meta?.developers)) devs.push(...g.meta.developers);
  if (Array.isArray(g?.playnite?.developers)) devs.push(...g.playnite.developers);
  const unique = [...new Set(devs.map(x => String(x).trim()).filter(Boolean))];
  if (unique.length) return unique[0];

  // Fallback: match game title against developer-db notable games
  const title = g?.title || g?.name || "";
  if (title) {
    const match = lookupDeveloperByGameTitle(title);
    if (match) return match.name;
  }
  return "";
}
