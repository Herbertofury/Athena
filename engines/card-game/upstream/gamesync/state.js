/**
 * @module cardgame/state
 * @description Game state management, persistence, migrations, and selectors.
 * Single source of truth for all card-game state. Versioned schema with
 * forward migrations so existing saves always upgrade cleanly.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Schema version — bump when state shape changes
   ═══════════════════════════════════════════════════════════════════════════ */
export const STATE_VERSION = 3;

/* ═══════════════════════════════════════════════════════════════════════════
   Blank / default state factory
   ═══════════════════════════════════════════════════════════════════════════ */
export function blankMatchState() {
  return {
    phase: "idle",           // idle | mulligan | playing | ended
    turn: 0,
    activePlayer: "player",  // player | enemy
    mana: 0,
    maxMana: 0,
    yourHp: 30,
    yourMaxHp: 30,
    yourArmor: 0,
    enemyHp: 30,
    enemyMaxHp: 30,
    enemyArmor: 0,
    yourHeroId: "",
    enemyHeroId: "",
    heroMode: "developer",
    yourPowerUsedThisTurn: false,
    enemyPowerUsedThisTurn: false,
    deckCards: [],            // array of card IDs in deck (order = draw order)
    handCards: [],            // array of card IDs in hand
    yourBoard: [],            // array of MinionState objects
    enemyBoard: [],           // array of MinionState objects
    enemyDeckCards: [],
    enemyHandCards: [],
    graveyard: [],
    enemyGraveyard: [],
    selectedHandIdx: -1,
    selectedAttackerIdx: -1,
    mulliganOffered: [],      // cards offered for mulligan swap
    mulliganKept: [],         // indices the player chose to keep
    turnHistory: [],          // array of action records for replay
    matchResult: null,        // null | "win" | "loss" | "draw"
    matchId: "",
    matchMode: "casual",      // casual | ranked | practice | draft | brawl | boss
    matchStartedAt: 0,
    overloadedCurrent: 0,     // mana locked this turn from previous overload
    overloadedNext: 0,        // mana to lock next turn
    _nextInstanceId: 0,       // monotonic counter for minion instance IDs
  };
}

export function blankMinionState(cardId, turn) {
  return {
    id: cardId,
    instanceId: `${cardId}_${turn}_${Math.random().toString(36).slice(2, 8)}`,
    hp: 0,                    // set from card.health on summon
    maxHp: 0,
    attack: 0,               // set from card.attack on summon
    summonedTurn: turn,
    attackedThisTurn: false,
    shieldActive: false,
    frozen: false,
    silenced: false,
    enchantments: [],         // array of { source, stat, delta }
    canAttack: false,
    dormant: false,           // dormant minions cannot attack or be targeted
    dormantTurnsLeft: 0,
    rebornActive: false,      // resummon with 1 HP on death
  };
}

export function blankProfileState() {
  return {
    version: STATE_VERSION,
    match: blankMatchState(),
    collection: {
      ownedCards: {},         // cardId → { count, premium }
      totalCards: 0,
      dust: 0,
      gold: 100,
      shards: 0,              // F1: premium crafting currency
      tickets: { draft: 0, brawl: 0, event: 0 },
    },
    decks: [],                // array of DeckState
    activeDeckIdx: 0,
    heroes: {
      unlocked: [],           // hero IDs
      selected: "",
      loadouts: {},           // heroId → { skin, board, coin, cardBack, strike }
    },
    packs: {
      unopened: {},            // packFamily → count
      history: [],             // array of { family, cards, openedAt }
    },
    progression: {
      xp: 0,
      level: 1,
      rewardsTrackClaimed: [],
      season: 1,
      seasonXp: 0,
    },
    quests: {
      daily: [],
      weekly: [],
      event: [],
      completed: [],
    },
    achievements: {
      unlocked: [],
      progress: {},           // achievementId → { current, target }
    },
    stats: {
      wins: 0,
      losses: 0,
      draws: 0,
      winsByMode: {},
      lossesByMode: {},
      bestDraftWins: 0,
      gamesPlayed: 0,
      cardsPlayed: 0,
      packsOpened: 0,
      totalDamageDealt: 0,
    },
    cosmetics: {
      boards: ["default"],
      coins: ["default"],
      cardBacks: ["default"],
      strikes: ["default"],
      activeBoard: "default",
      activeCoin: "default",
      activeCardBack: "default",
      activeStrike: "default",
    },
    settings: {
      autoEndTurn: false,
      soundVolume: 0.7,
      musicVolume: 0.4,
      reducedMotion: false,
      cardSize: "normal",     // small | normal | large
      showKeywordTooltips: true,
    },
    draftRuns: [],             // array of DraftRunState
    bossRuns: [],              // array of BossRunState
    replays: [],               // array of condensed match records

    /* F2: Equipment system */
    equipment: {},             // slotId → itemId

    /* C1: Mascot Adventure */
    adventureRun: null,        // { bossIndex, wins, losses, equipment, defeatedEncounters, completed }

    /* C2: Sealed Forge */
    sealedRun: null,           // { wins, losses, pool, deck, completed }

    /* C3: Gauntlet Run */
    gauntletRun: null,         // { wins, losses, completed }

    /* C4: Puzzles */
    puzzlesSolved: [],         // array of puzzle IDs

    /* C5: Singleton */
    singletonStats: { wins: 0, losses: 0, bestStreak: 0 },

    /* Card Forge cosmetics (D1) */
    cardForge: null,           // managed by cosmetics.js getCosmeticsState()
  };
}

export function blankDeckState(heroId, name) {
  return {
    id: `deck_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: name || "New Deck",
    heroId: heroId || "",
    cards: [],                 // array of cardId (max 30, max 2 copies except legendary=1)
    format: "standard",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    wins: 0,
    losses: 0,
    favorite: false,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Storage key
   ═══════════════════════════════════════════════════════════════════════════ */
const STORAGE_KEY = "gsCardGameState";
const PROFILE_KEY = "gsCardGameProfile";

/* ═══════════════════════════════════════════════════════════════════════════
   Migration from legacy prototype (version 2 → 3)
   ═══════════════════════════════════════════════════════════════════════════ */
function migrateLegacy(raw) {
  if (!raw || typeof raw !== "object") return null;
  const profile = blankProfileState();

  // Migrate match state
  const m = profile.match;
  m.turn = Number(raw.turn) || 0;
  m.mana = Number(raw.mana) || 0;
  m.maxMana = Number(raw.maxMana) || 0;
  m.yourHp = Number(raw.yourHp) || 30;
  m.yourMaxHp = Number(raw.yourMaxHp) || 30;
  m.enemyHp = Number(raw.enemyHp) || 30;
  m.enemyMaxHp = Number(raw.enemyMaxHp) || 30;
  m.yourHeroId = String(raw.yourHeroId || "");
  m.enemyHeroId = String(raw.enemyHeroId || "");
  m.heroMode = raw.heroMode === "platform" ? "platform" : "developer";
  m.phase = m.turn > 0 ? "playing" : "idle";

  if (Array.isArray(raw.deckKeys)) m.deckCards = raw.deckKeys.map(String);
  if (Array.isArray(raw.handKeys)) m.handCards = raw.handKeys.map(String);

  // Migrate board
  if (Array.isArray(raw.yourBoard)) {
    m.yourBoard = raw.yourBoard.map(rec => ({
      ...blankMinionState(String(rec?.key || ""), Number(rec?.summonedTurn) || m.turn),
      hp: Number(rec?.hp) || 1,
      shieldActive: !!rec?.shieldActive,
    }));
  }
  if (Array.isArray(raw.enemyBoard)) {
    m.enemyBoard = raw.enemyBoard.map(rec => ({
      ...blankMinionState(String(rec?.key || ""), Number(rec?.summonedTurn) || m.turn),
      hp: Number(rec?.hp) || 1,
      shieldActive: !!rec?.shieldActive,
    }));
  }

  return profile;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Load / Save
   ═══════════════════════════════════════════════════════════════════════════ */
let _cachedProfile = null;

export function loadProfile() {
  if (_cachedProfile) return _cachedProfile;

  // Try new format first
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.version === STATE_VERSION) {
        _cachedProfile = parsed;
        return _cachedProfile;
      }
    }
  } catch (_e) { /* corrupt data, fall through */ }

  // Try legacy format
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const migrated = migrateLegacy(parsed);
      if (migrated) {
        _cachedProfile = migrated;
        saveProfile();
        return _cachedProfile;
      }
    }
  } catch (_e) { /* corrupt data, fall through */ }

  // Fresh start
  _cachedProfile = blankProfileState();
  return _cachedProfile;
}

export function saveProfile() {
  if (!_cachedProfile) return;
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(_cachedProfile));
  } catch (_e) { /* quota exceeded */ }
}

export function resetProfile() {
  _cachedProfile = blankProfileState();
  try { localStorage.removeItem(PROFILE_KEY); } catch (_e) {}
  try { localStorage.removeItem(STORAGE_KEY); } catch (_e) {}
  saveProfile();
  return _cachedProfile;
}

export function getProfile() {
  return _cachedProfile || loadProfile();
}

export function getMatch() {
  return getProfile().match;
}

export function updateMatch(patch) {
  const p = getProfile();
  Object.assign(p.match, patch);
  saveProfile();
}

export function updateProfile(patch) {
  const p = getProfile();
  Object.assign(p, patch);
  saveProfile();
}

/* ═══════════════════════════════════════════════════════════════════════════
   Selectors — derived data from state
   ═══════════════════════════════════════════════════════════════════════════ */
export function isMatchActive() {
  const m = getMatch();
  return m.phase === "playing" || m.phase === "mulligan";
}

export function canPlayCard(cardCost) {
  const m = getMatch();
  return m.phase === "playing" &&
    m.activePlayer === "player" &&
    m.mana >= cardCost &&
    m.yourBoard.length < 7;
}

export function canUseHeroPower() {
  const m = getMatch();
  return m.phase === "playing" &&
    m.activePlayer === "player" &&
    !m.yourPowerUsedThisTurn &&
    m.mana >= 2;
}

export function isDeckValid(deckOrCards, maxCards = 30) {
  // Accept a deck object ({cards:[{id,count}]}), {id,count}[] array, or flat ID array
  let arr = Array.isArray(deckOrCards) ? deckOrCards
    : Array.isArray(deckOrCards?.cards) ? deckOrCards.cards
    : null;
  if (!arr) return false;
  // If entries are {id, count} objects, expand to flat array of IDs for validation
  if (arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null && "count" in arr[0]) {
    const flat = [];
    for (const e of arr) for (let i = 0; i < (e.count || 0); i++) flat.push(e.id);
    arr = flat;
  }
  if (arr.length !== maxCards) return false;
  const counts = {};
  for (const id of arr) {
    counts[id] = (counts[id] || 0) + 1;
    if (counts[id] > 2) return false;
  }
  return true;
}

export function deckCardCount(deckOrCards) {
  // Accept a deck object ({cards:[{id,count}]}) or a flat array of card IDs
  const arr = Array.isArray(deckOrCards) ? deckOrCards
    : Array.isArray(deckOrCards?.cards) ? deckOrCards.cards
    : null;
  if (!arr) return 0;
  // If entries are {id, count} objects, sum the counts
  if (arr.length > 0 && typeof arr[0] === "object" && arr[0] !== null && "count" in arr[0]) {
    return arr.reduce((s, e) => s + (e.count || 0), 0);
  }
  return arr.length;
}

export function manaCurveStats(cards, cardLookup) {
  const curve = [0, 0, 0, 0, 0, 0, 0, 0]; // 0, 1, 2, 3, 4, 5, 6, 7+
  if (!cards || typeof cards[Symbol.iterator] !== "function") return curve;
  for (const id of cards) {
    const card = cardLookup(id);
    if (!card) continue;
    const bucket = Math.min(7, card.cost);
    curve[bucket]++;
  }
  return curve;
}
