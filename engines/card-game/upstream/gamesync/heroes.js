/**
 * @module cardgame/heroes
 * @description Hero roster derivation, hero powers, hero identities,
 * class archetypes, and hero-deck affinity scoring.
 *
 * Heroes are derived from the user's library — developers become hero identities,
 * platforms become hero identities. Genre heroes and ecosystem heroes
 * provide additional class diversity.
 */

import { POWER_ICONS } from './icons.js';
import { getHeroEnrichment, lookupDeveloperByGameTitle } from './developer-db.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Hero mode categories
   ═══════════════════════════════════════════════════════════════════════════ */

export const HERO_MODES = {
  DEVELOPER: "developer",
  PLATFORM: "platform",
  GENRE: "genre",
  ECOSYSTEM: "ecosystem",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Hero power templates
   ═══════════════════════════════════════════════════════════════════════════ */

const POWER_TEMPLATES = {
  damage: {
    name: "Smite",
    description: "Deal {n} damage to the enemy hero.",
    iconKey: "damage",
    color: "rgba(255,120,60,0.9)",
    execute: (state, hero) => {
      const dmg = hero.powerDamage;
      return { type: "HERO_POWER_DAMAGE", target: "enemyHero", damage: dmg };
    },
  },
  heal: {
    name: "Mend",
    description: "Restore {n} health to your hero.",
    iconKey: "heal",
    color: "rgba(100,255,140,0.9)",
    execute: (state, hero) => {
      const heal = hero.powerDamage;
      return { type: "HERO_POWER_HEAL", target: "yourHero", amount: heal };
    },
  },
  armor: {
    name: "Fortify",
    description: "Gain {n} armor.",
    iconKey: "armor",
    color: "rgba(160,160,200,0.9)",
    execute: (state, hero) => {
      const armor = Math.max(1, Math.floor(hero.powerDamage * 0.8));
      return { type: "HERO_POWER_ARMOR", amount: armor };
    },
  },
  summon: {
    name: "Recruit",
    description: "Summon a 1/{n} minion.",
    iconKey: "summon",
    color: "rgba(200,180,120,0.9)",
    execute: (state, hero) => {
      const hp = Math.max(1, hero.powerDamage);
      return { type: "HERO_POWER_SUMMON", attack: 1, health: hp };
    },
  },
  draw: {
    name: "Insight",
    description: "Draw a card.",
    iconKey: "draw",
    color: "rgba(140,200,255,0.9)",
    execute: () => {
      return { type: "HERO_POWER_DRAW", count: 1 };
    },
  },
  buff: {
    name: "Inspire",
    description: "Give a random friendly minion +1/+{n}.",
    iconKey: "buff",
    color: "rgba(255,230,100,0.9)",
    execute: (state, hero) => {
      const hp = Math.max(1, Math.floor(hero.powerDamage * 0.7));
      return { type: "HERO_POWER_BUFF", attack: 1, health: hp };
    },
  },
  ping: {
    name: "Spark",
    description: "Deal 1 damage to any target.",
    iconKey: "ping",
    color: "rgba(255,200,80,0.9)",
    execute: () => {
      return { type: "HERO_POWER_PING", damage: 1, targetType: "any" };
    },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Hash helper
   ═══════════════════════════════════════════════════════════════════════════ */

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hashChoice(str, choices) {
  return choices[fnv1a(str) % choices.length];
}

function clampInt(n, lo, hi) {
  return Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
}

function slugId(s) {
  return String(s || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 52);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero palettes — each hero gets a unique color identity
   ═══════════════════════════════════════════════════════════════════════════ */

const HERO_PALETTES = [
  { primary: "#4ca3ff", secondary: "#1a5ccc", accent: "#8fcfff", name: "Azure" },
  { primary: "#ff6b4a", secondary: "#cc2211", accent: "#ffb199", name: "Ember" },
  { primary: "#7aff96", secondary: "#229944", accent: "#b8ffc8", name: "Verdant" },
  { primary: "#c76bff", secondary: "#7722cc", accent: "#e0b8ff", name: "Arcane" },
  { primary: "#ffd24a", secondary: "#cc9922", accent: "#ffe599", name: "Golden" },
  { primary: "#ff4a8c", secondary: "#cc2266", accent: "#ff99c2", name: "Rose" },
  { primary: "#4affef", secondary: "#22ccbb", accent: "#99fff5", name: "Frost" },
  { primary: "#ff994a", secondary: "#cc6622", accent: "#ffc899", name: "Amber" },
  { primary: "#9e9eff", secondary: "#5555cc", accent: "#c8c8ff", name: "Mist" },
  { primary: "#80ff55", secondary: "#44cc22", accent: "#bbff99", name: "Lime" },
  { primary: "#ff5555", secondary: "#cc2222", accent: "#ff9999", name: "Crimson" },
  { primary: "#55d4ff", secondary: "#2299cc", accent: "#99e8ff", name: "Sky" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Build hero roster from library data
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildHeroRoster(games, mode) {
  const m = String(mode || "").toLowerCase();
  const validMode = Object.values(HERO_MODES).includes(m) ? m : HERO_MODES.DEVELOPER;
  const counts = new Map();

  for (const g of (games || [])) {
    if (!g?.key) continue;
    if (g.status === "wishlist") continue;
    const keys = extractHeroKeys(g, validMode);
    for (const k of keys) {
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }

  const heroes = Array.from(counts.entries())
    .map(([name, count], idx) => {
      const c = Math.max(0, count);
      const id = `${modePrefix(validMode)}:${slugId(name)}`;

      // HP scales logarithmically with library presence
      const hpMax = clampInt(26 + Math.floor(Math.log2(c + 1) * 6), 24, 60);

      // Power damage scales similarly
      const powerDamage = clampInt(1 + Math.floor(Math.log2(c + 1)), 1, 8);

      // Pick a power template based on hero identity hash
      const powerKey = hashChoice(id, Object.keys(POWER_TEMPLATES));
      const power = POWER_TEMPLATES[powerKey];

      // Pick a palette — developer DB override takes priority
      const enrichment = validMode === HERO_MODES.DEVELOPER ? getHeroEnrichment(name) : null;
      const palette = enrichment?.palette
        ? { ...HERO_PALETTES[fnv1a(id) % HERO_PALETTES.length], ...enrichment.palette }
        : HERO_PALETTES[fnv1a(id) % HERO_PALETTES.length];

      return {
        id,
        mode: validMode,
        name,
        count: c,
        hpMax,
        powerDamage,
        powerKey,
        powerName: power.name,
        powerDesc: power.description.replace("{n}", String(powerDamage)),
        powerIconKey: power.iconKey,
        powerColor: power.color,
        palette,
        archetype: deriveArchetype(name, count, validMode),
        // Enrichment from developer DB (developer mode only)
        tagline: enrichment?.tagline || "",
        country: enrichment?.country || "",
        tags: enrichment?.tags || [],
        founded: enrichment?.founded || 0,
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  // Always ensure at least one hero
  if (!heroes.length) {
    const fallbackName = validMode === HERO_MODES.PLATFORM ? "Custom" : "Indie Studio";
    const id = `${modePrefix(validMode)}:wanderer`;
    const palette = HERO_PALETTES[0];
    heroes.push({
      id,
      mode: validMode,
      name: fallbackName,
      count: 0,
      hpMax: 30,
      powerDamage: 1,
      powerKey: "damage",
      powerName: "Smite",
      powerDesc: "Deal 1 damage to the enemy hero.",
      powerIconKey: "damage",
      powerColor: POWER_TEMPLATES.damage.color,
      palette,
      archetype: "wanderer",
    });
  }

  return heroes;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pick enemy hero (different from player when possible)
   ═══════════════════════════════════════════════════════════════════════════ */

export function pickEnemyHero(roster, yourHeroId) {
  if (!roster || !roster.length) return null;
  const candidates = roster.filter(h => h.id !== yourHeroId);
  const pool = candidates.length ? candidates : roster;
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero-deck affinity scoring
   ═══════════════════════════════════════════════════════════════════════════ */

export function heroDeckAffinity(hero, deckCards, cardLookup) {
  if (!hero || !deckCards.length) return 0;

  let score = 0;
  let total = 0;

  for (const cardId of deckCards) {
    const card = cardLookup(cardId);
    if (!card) continue;
    total++;

    // Developer hero: cards from that developer score higher
    if (hero.mode === HERO_MODES.DEVELOPER) {
      if (card.developer && card.developer.toLowerCase().includes(hero.name.toLowerCase())) {
        score += 3;
      }
    }

    // Platform hero: cards from that platform score higher
    if (hero.mode === HERO_MODES.PLATFORM) {
      if ((card.platforms || []).some(p => p.toLowerCase().includes(hero.name.toLowerCase()))) {
        score += 3;
      }
    }

    // Genre hero: cards matching genre score higher
    if (hero.mode === HERO_MODES.GENRE) {
      if ((card.genres || []).some(g => g.toLowerCase().includes(hero.name.toLowerCase()))) {
        score += 3;
      }
    }
  }

  return total > 0 ? Math.round((score / (total * 3)) * 100) : 0;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero power execution
   ═══════════════════════════════════════════════════════════════════════════ */

export function getHeroPowerAction(hero, matchState) {
  const tmpl = POWER_TEMPLATES[hero.powerKey];
  if (!tmpl) return null;
  return tmpl.execute(matchState, hero);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Internal helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function modePrefix(mode) {
  switch (mode) {
    case HERO_MODES.PLATFORM: return "plat";
    case HERO_MODES.GENRE: return "genre";
    case HERO_MODES.ECOSYSTEM: return "eco";
    default: return "dev";
  }
}

function extractHeroKeys(game, mode) {
  const list = [];
  switch (mode) {
    case HERO_MODES.DEVELOPER:
      if (Array.isArray(game?.developers)) list.push(...game.developers);
      if (Array.isArray(game?.rawg?.developers)) list.push(...game.rawg.developers);
      if (Array.isArray(game?.meta?.developers)) list.push(...game.meta.developers);
      if (Array.isArray(game?.playnite?.developers)) list.push(...game.playnite.developers);
      // Fallback: match game title against developer-db notable games
      if (list.length === 0) {
        const title = game?.title || game?.name || "";
        if (title) {
          const match = lookupDeveloperByGameTitle(title);
          if (match) list.push(match.name);
        }
      }
      break;
    case HERO_MODES.PLATFORM:
      if (Array.isArray(game?.platforms)) list.push(...game.platforms);
      if (Array.isArray(game?.rawg?.platforms)) list.push(...game.rawg.platforms.map(x => (typeof x === 'object' && (x?.platform?.name || x?.name)) ? (x.platform?.name || x.name) : x));
      if (Array.isArray(game?.meta?.platforms)) list.push(...game.meta.platforms);
      if (Array.isArray(game?.playnite?.platforms)) list.push(...game.playnite.platforms);
      break;
    case HERO_MODES.GENRE:
      if (Array.isArray(game?.genres)) list.push(...game.genres);
      if (Array.isArray(game?.steamGenres)) list.push(...game.steamGenres);
      if (Array.isArray(game?.rawg?.genres)) list.push(...game.rawg.genres.map(x => (typeof x === 'object' && x?.name) ? x.name : x));
      break;
    case HERO_MODES.ECOSYSTEM:
      // Ecosystem = target game family (e.g. "Skyrim modding")
      if (game?.franchise) list.push(String(game.franchise));
      if (game?.series) list.push(String(game.series));
      break;
  }

  const seen = new Set();
  return list
    .map(x => String(x || "").trim())
    .filter(x => {
      if (!x) return false;
      const k = x.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
}

function deriveArchetype(name, count, mode) {
  if (count >= 20) return "master";
  if (count >= 10) return "veteran";
  if (count >= 5) return "adept";
  if (count >= 2) return "initiate";
  return "wanderer";
}
