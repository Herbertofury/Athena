/**
 * @module cardgame/index
 * @description Mount API — single entry point that wires all card-game modules
 * together and exposes `GameSyncCardGame.mount(rootEl, opts)` for main-app.js.
 *
 * Usage from main-app.js:
 *   import { mountCardGame, unmountCardGame } from "../cardgame/index.js";
 *   // on tab switch:
 *   mountCardGame(detailRoot, { games, modsList });
 */

import { loadProfile, saveProfile, getProfile, getMatch, updateMatch, updateProfile,
         isMatchActive, canPlayCard, canUseHeroPower, isDeckValid, blankMatchState } from "./state.js";
import { deriveCardFromGame, deriveCardFromMod, buildCardPool, getPoolAsArray, searchCards, KEYWORDS } from "./cards.js";
import { buildHeroRoster, pickEnemyHero, heroDeckAffinity, HERO_MODES } from "./heroes.js";
import { createEngine } from "./engine.js";
import { createVfxEngine } from "./vfx.js";
import { createAI } from "./ai.js";
import { createAudioEngine } from "./audio.js";
import { cardEl, cardBackEl, heroPortraitEl, buildManaBar, boardSlotsEl, handEl, renderBattlefield, initDragSystem } from "./board.js";
import { SCREENS, createRouter, buildShell, renderFrontDoor, renderModeHub, renderPostMatch, renderMulligan } from "./screens.js";
import { renderCollection } from "./collection.js";
import { renderDeckBuilder, autoBuildDeck } from "./deckbuilder.js";
import { renderPackRoom, openPackCeremony, generatePackContents, applyPackToProfile, buildDeveloperPacks } from "./packs.js";
import { POWER_ICONS, iconEl } from "./icons.js";
import { renderDeckSelect } from "./deck-select.js";
import { renderShop } from "./shop.js";
import { renderSettings, DEFAULT_SETTINGS } from "./settings.js";
import { addXp, computeMatchRewards, applyMatchRewards, assignDailyQuests, assignWeeklyQuests,
         updateQuestProgress, claimRewardsTrack, renderJournal } from "./progression.js";
import { renderCardForge, applyThemeToShell } from "./cosmetics.js";
import { renderMascotAdventure, renderSealedForge, renderGauntletRun,
         renderPuzzleMode, renderSingletonMode } from "./modes.js";
import { createAdventureMode } from "./adventure.js";
import { craftCard, disenchantCard } from "./shop.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Private refs
   ═══════════════════════════════════════════════════════════════════════════ */

let _mounted = false;
let _rootEl = null;
let _shellEl = null;
let _router = null;
let _engine = null;
let _vfx = null;
let _ai = null;
let _audio = null;
let _cardPoolMap = null;   // Map from buildCardPool
let _poolArray = [];       // getPoolAsArray result: {card, game, mod}[]
let _games = [];
let _modsList = [];
let _matchState = null;    // engine state (pure — passed into / out of engine)
let _myHero = null;
let _enemyHero = null;
let _heroRoster = [];
let _dragSystem = null;    // premium drag system instance
let _editingDeck = null;   // deck being edited in deckbuilder
let _adventureInstance = null; // active adventure mode world
let _adventureBattleCallback = null; // callback when adventure battle ends
let _lastScreenId = null;    // track current screen for session restore

/* card & hero lookup functions for the engine */
function _cardLookup(cardId) {
  if (!_cardPoolMap) return null;
  const entry = _cardPoolMap.get(cardId);
  return entry?.card || null;
}
function _heroLookup(heroId) {
  return _heroRoster.find(h => h.id === heroId) || null;
}

/**
 * Extract flat array of card IDs from a deck, handling both formats:
 *  - deck.cardKeys: [id, id, id, ...]  (legacy/quickmatch)
 *  - deck.cards: [{id, count}, ...]      (deckbuilder format)
 */
function _deckToCardIds(deck) {
  if (!deck) return [];
  // Prefer cardKeys if already flat
  if (Array.isArray(deck.cardKeys) && deck.cardKeys.length) return deck.cardKeys;
  // Expand {id, count} entries
  if (Array.isArray(deck.cards) && deck.cards.length) {
    const ids = [];
    for (const e of deck.cards) {
      if (typeof e === "string") { ids.push(e); continue; }
      for (let i = 0; i < (e.count || 1); i++) ids.push(e.id);
    }
    return ids;
  }
  return [];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Pool
   ═══════════════════════════════════════════════════════════════════════════ */

function rebuildPool() {
  _cardPoolMap = buildCardPool(_games, _modsList);
  _poolArray = getPoolAsArray(_cardPoolMap);
  return _poolArray;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Auto-seed collection — all owned games/mods become cards instantly
   ═══════════════════════════════════════════════════════════════════════════ */

function seedCollectionFromPool(profile, poolArray) {
  if (!profile || !poolArray?.length) return;
  if (!profile.collection) profile.collection = {};
  if (!profile.collection.ownedCards) profile.collection.ownedCards = {};

  let seeded = 0;
  for (const entry of poolArray) {
    const cardId = entry.card?.id;
    if (!cardId) continue;
    // Only seed if the user doesn't already own this card
    if (!profile.collection.ownedCards[cardId]) {
      profile.collection.ownedCards[cardId] = 1;
      seeded++;
    }
  }
  if (seeded > 0) {
    profile.collection.totalCards = Object.keys(profile.collection.ownedCards).length;
  }

  // Auto-build a starter deck if the player has no valid deck yet
  if (!profile.decks) profile.decks = [];
  const hasValid = profile.decks.some(d => isDeckValid(d));
  if (!hasValid && Object.keys(profile.collection.ownedCards).length >= 30) {
    const hero = _heroRoster?.[0] || null;
    const starterDeck = autoBuildDeck(poolArray, hero, profile);
    starterDeck.name = "Starter Deck";
    // Replace the first deck if it exists and is empty, otherwise add
    const emptyIdx = profile.decks.findIndex(d => {
      const c = Array.isArray(d.cards) ? d.cards.length : 0;
      return c === 0;
    });
    if (emptyIdx >= 0) profile.decks[emptyIdx] = starterDeck;
    else profile.decks.push(starterDeck);
  }
}

/**
 * Seed one free pack per developer so users have something to open.
 * Only runs on first launch (checks if devPacks were already seeded).
 */
function seedDeveloperPacks(profile, poolArray) {
  if (!profile || !poolArray?.length) return;
  if (profile._devPacksSeeded) return; // already seeded
  if (!profile.packs) profile.packs = {};
  if (!profile.packs.unopened) profile.packs.unopened = {};
  if (!profile.packs.history) profile.packs.history = [];

  const devPacks = buildDeveloperPacks(poolArray);
  for (const dp of devPacks) {
    // Give 1 free pack per developer
    profile.packs.unopened[dp.id] = (profile.packs.unopened[dp.id] || 0) + 1;
  }
  // Also seed 3 core packs and 2 mod packs
  profile.packs.unopened["core"] = (profile.packs.unopened["core"] || 0) + 3;
  profile.packs.unopened["mod"] = (profile.packs.unopened["mod"] || 0) + 2;
  profile._devPacksSeeded = true;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Match Lifecycle
   ═══════════════════════════════════════════════════════════════════════════ */

function startNewMatch(heroMode, myHeroId, deckCardKeys, difficulty = "normal") {
  const profile = getProfile();
  _heroRoster = buildHeroRoster(_games, heroMode);

  _myHero = _heroRoster.find(h => h.id === myHeroId) || _heroRoster[0];
  _enemyHero = pickEnemyHero(_heroRoster, myHeroId);

  // Build deck of card IDs from keys
  const deckCardIds = [];
  for (const key of deckCardKeys) {
    const entry = _cardPoolMap?.get(key);
    if (entry) deckCardIds.push(entry.card.id);
  }

  // Build enemy deck from random pool cards
  const allCards = _poolArray.map(e => e.card);
  const enemyDeck = [...allCards].sort(() => Math.random() - 0.5).slice(0, 30).map(c => c.id);

  // Create engine with lookup functions
  _engine = createEngine(_cardLookup, _heroLookup);

  // Create AI
  _ai = createAI({ difficulty });

  // Start the match — engine.startMatch returns new state
  _matchState = _engine.startMatch(null, {
    mode: "practice",
    heroMode,
    yourHeroId: _myHero.id,
    enemyHeroId: _enemyHero.id,
    deckCards: deckCardIds,
    enemyDeckCards: enemyDeck,
  });

  // Engine starts in "mulligan" phase — do NOT skip; let UI handle it
  // Save state
  updateMatch(_matchState);
  saveProfile();

  // Track quest progress
  updateQuestProgress(profile, "matchesPlayed", 1);
  saveProfile();

  return { myHero: _myHero, enemyHero: _enemyHero };
}

function processAiTurn() {
  if (!_engine || !_ai || !_matchState) return;

  if (_matchState.phase === "ended") return;

  // AI thinks based on current state
  const actions = _ai.think(_matchState);
  if (!actions?.length) {
    _matchState = _engine.endTurn(_matchState);
    return;
  }

  for (const action of actions) {
    try {
      switch (action.type) {
        case "playCard":
          _matchState = _engine.playCard(_matchState, action.handIdx);
          break;
        case "attack":
          _matchState = _engine.attackMinion(_matchState, action.attackerIdx, action.defenderIdx);
          break;
        case "attackHero":
          _matchState = _engine.attackHero(_matchState, action.attackerIdx);
          break;
        case "heroPower":
          _matchState = _engine.useHeroPower(_matchState, _enemyHero);
          break;
      }
    } catch (_e) {
      // AI tried invalid action, skip
    }
  }

  _matchState = _engine.endTurn(_matchState);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Screen Renderers
   ═══════════════════════════════════════════════════════════════════════════ */

function renderScreen(screenId) {
  const profile = getProfile();
  const container = _shellEl?.querySelector(`[data-screen="${screenId}"]`);
  if (!container) return;
  container.innerHTML = "";

  switch (screenId) {
    case SCREENS.FRONT_DOOR: {
      // Build context for the front door
      const recentDeck = profile.decks?.length ? profile.decks[profile.decks.length - 1] : null;
      const selectedHero = _myHero || null;
      const activeQuests = (Array.isArray(profile.quests) ? profile.quests : []).filter(q => !q.completed).slice(0, 2).map(q => ({
        title: q.title || q.description || "Quest",
        progress: q.progress || 0,
        max: q.max || 1,
      }));
      const unopenedPacks = (Array.isArray(profile.packs) ? profile.packs : []).reduce((s, p) => s + (p.count || 0), 0) || 0;
      const unclaimedRewards = (profile.rewardsTrackClaimed || 0) < (profile.level || 1) ? 1 : 0;

      // Build recommendation
      let recommendation = null;
      if (unopenedPacks > 0) {
        recommendation = { type: "packs", label: "Open Packs", detail: `${unopenedPacks} packs waiting`, action: () => _router.go(SCREENS.PACKS) };
      } else if (!profile.decks?.length) {
        recommendation = { type: "deck", label: "Build a Deck", detail: "Create your first deck to start playing", action: () => _router.go(SCREENS.DECKBUILDER) };
      } else if (activeQuests.length > 0) {
        recommendation = { type: "quest", label: "Complete a Quest", detail: activeQuests[0].title, action: () => _router.go(SCREENS.JOURNAL) };
      }

      container.appendChild(renderFrontDoor({
        onPlay: () => _router.go(SCREENS.MODE_HUB),
        onCollection: () => _router.go(SCREENS.COLLECTION),
        onDeckBuilder: () => _router.go(SCREENS.DECKBUILDER),
        onJournal: () => _router.go(SCREENS.JOURNAL),
        onPacks: () => _router.go(SCREENS.PACKS),
        onShop: () => _router.go(SCREENS.SHOP),
        onSettings: () => _router.go(SCREENS.SETTINGS),
      }, {
        recentDeck,
        selectedHero,
        activeQuests,
        unopenedPacks,
        unclaimedRewards,
        recommendation,
      }));
      _audio?.play?.("front-door-hover");
      break;
    }

    case SCREENS.MODE_HUB: {
      /* Build mode status context from profile */
      const modeStatus = {};
      const hasValidDeck = profile?.decks?.some(d => {
        if (d.cardKeys?.length >= 30) return true;
        if (Array.isArray(d.cards)) {
          let n = 0;
          for (const e of d.cards) n += (typeof e === 'string' ? 1 : (e.count || 1));
          if (n >= 30) return true;
        }
        return false;
      });
      /* Modes that require a deck to play */
      for (const mId of ["library-duel", "practice", "brawl"]) {
        modeStatus[mId] = { deckReady: hasValidDeck };
      }
      /* Active run tracking */
      if (profile?.runs?.draft?.active)    modeStatus.draft    = { ...modeStatus.draft, runActive: true };
      if (profile?.runs?.blacksite?.active) modeStatus.blacksite = { ...modeStatus.blacksite, runActive: true };
      if (profile?.runs?.bossrun?.active)  modeStatus.bossrun  = { ...modeStatus.bossrun, runActive: true };
      /* Pending rewards */
      const unclaimedRw = profile?.rewardsTrack?.nodes?.filter(n => !n.claimed && n.unlocked)?.length || 0;
      if (unclaimedRw) modeStatus.journal = { rewards: `${unclaimedRw} rewards` };

      container.appendChild(renderModeHub({
        onMode: (mode, subMode) => {
          switch (mode) {
            case "collection":   _router.go(SCREENS.COLLECTION);  break;
            case "deckbuilder":  _router.go(SCREENS.DECKBUILDER); break;
            case "packs":        _router.go(SCREENS.PACKS);       break;
            case "journal":      _router.go(SCREENS.JOURNAL);     break;
            case "adventure":    _router.go(SCREENS.ADVENTURE);   break;
            case "sealed":       _router.go(SCREENS.SEALED);      break;
            case "gauntlet":     _router.go(SCREENS.GAUNTLET);    break;
            case "puzzle":       _router.go(SCREENS.PUZZLE);      break;
            case "singleton":    _router.go(SCREENS.SINGLETON);   break;
            case "cardforge":    _router.go(SCREENS.CARD_FORGE);  break;
            default:             _router.go(SCREENS.HERO_SELECT); break;
          }
        },
      }, { modeStatus }));
      break;
    }

    case SCREENS.COLLECTION:
      container.appendChild(renderCollection(
        _poolArray,
        profile,
        {
          onCardClick: (card) => {
            _audio?.play?.("card-hover");
          },
        }
      ));
      break;

    case SCREENS.DECKBUILDER:
      container.appendChild(renderDeckBuilder(
        _poolArray,
        profile,
        _myHero || _heroRoster[0] || null,
        _cardLookup,
        {
          initialDeck: _editingDeck || undefined,
          onSave: (deck) => {
            if (!profile.decks) profile.decks = [];
            const existing = profile.decks.findIndex(d => d.name === deck.name);
            if (existing >= 0) profile.decks[existing] = deck;
            else profile.decks.push(deck);
            saveProfile();
            _audio?.play?.("card-place");
            _editingDeck = null;
          },
        }
      ));
      break;

    case SCREENS.PACKS:
      container.appendChild(renderPackRoom(
        profile,
        _poolArray.map(e => e.card),
        {
          onPackOpened: (cards, familyId) => {
            saveProfile();
            updateQuestProgress(profile, "packsOpened", 1);
            saveProfile();
            renderScreen(SCREENS.PACKS);
          },
          onMassOpen: () => {
            const unopened = profile?.packs?.unopened || {};
            const poolCards = _poolArray.map(e => e.card);
            let totalOpened = 0;
            const allNewCards = [];
            for (const [fam, count] of Object.entries(unopened)) {
              for (let i = 0; i < count; i++) {
                const cards = generatePackContents(poolCards, fam);
                applyPackToProfile(profile, cards);
                allNewCards.push(...cards);
                totalOpened++;
              }
            }
            // Clear all unopened
            if (profile.packs) profile.packs.unopened = {};
            updateQuestProgress(profile, "packsOpened", totalOpened);
            saveProfile();
            _audio?.play?.("reward-claim");
            renderScreen(SCREENS.PACKS);
          },
        }
      ));
      break;

    case SCREENS.JOURNAL:
      container.appendChild(renderJournal(profile, {
        onClaimReward: (node) => {
          claimRewardsTrack(profile);
          saveProfile();
          renderScreen(SCREENS.JOURNAL);
          _audio?.play?.("reward-claim");
        },
      }));
      break;

    case SCREENS.HERO_SELECT:
      renderHeroSelect(container, profile);
      break;

    case SCREENS.MULLIGAN:
      renderMulliganScreen(container, profile);
      break;

    case SCREENS.MATCH:
      renderMatchView(container, profile);
      break;

    case SCREENS.POST_MATCH:
      renderPostMatchView(container, profile);
      break;

    case SCREENS.DECK_SELECT:
      renderDeckSelectScreen(container, profile);
      break;

    case SCREENS.SHOP:
      renderShopScreen(container, profile);
      break;

    case SCREENS.SETTINGS:
      renderSettingsScreen(container, profile);
      break;

    case SCREENS.CARD_FORGE:
      renderCardForgeScreen(container, profile);
      break;

    case SCREENS.ADVENTURE:
      renderAdventureScreen(container, profile);
      break;

    case SCREENS.SEALED:
      renderSealedScreen(container, profile);
      break;

    case SCREENS.GAUNTLET:
      renderGauntletScreen(container, profile);
      break;

    case SCREENS.PUZZLE:
      renderPuzzleScreen(container, profile);
      break;

    case SCREENS.SINGLETON:
      renderSingletonScreen(container, profile);
      break;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Select
   ═══════════════════════════════════════════════════════════════════════════ */

function renderHeroSelect(container, profile) {
  const mode = profile?.settings?.heroMode || "developer";
  const roster = buildHeroRoster(_games, mode);
  _heroRoster = roster;

  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-hero-select";

  const title = document.createElement("h2");
  title.textContent = "Choose Your Hero";
  title.className = "cg-hero-select-title";
  wrap.appendChild(title);

  // Mode toggle
  const modeRow = document.createElement("div");
  modeRow.className = "cg-hero-mode-row";
  for (const m of Object.values(HERO_MODES)) {
    const btn = document.createElement("button");
    btn.className = `cg-btn${m === mode ? " cg-btn-primary" : ""}`;
    btn.textContent = m.charAt(0).toUpperCase() + m.slice(1);
    btn.addEventListener("click", () => {
      profile.settings.heroMode = m;
      saveProfile();
      renderHeroSelect(container, profile);
    });
    modeRow.appendChild(btn);
  }
  wrap.appendChild(modeRow);

  // Hero grid
  const grid = document.createElement("div");
  grid.className = "cg-hero-grid";

  const selectedHeroId = _myHero?.id || profile?.selectedHeroId;

  for (const hero of roster) {
    const card = document.createElement("div");
    card.className = "cg-hero-card";
    const isActive = hero.id === selectedHeroId;
    if (isActive) card.classList.add("cg-hero-active");
    const accentColor = hero.palette?.[0] || hero.palette?.primary || "#8b5cf6";
    card.style.setProperty("--hero-accent", accentColor);

    // Large portrait with initial
    const portrait = document.createElement("div");
    portrait.className = "cg-hero-card-portrait";
    portrait.textContent = hero.name?.charAt(0)?.toUpperCase() || "?";
    portrait.style.color = accentColor;
    card.appendChild(portrait);

    // Active indicator
    if (isActive) {
      const activeBadge = document.createElement("div");
      activeBadge.className = "cg-hero-active-badge";
      activeBadge.textContent = "Active";
      card.appendChild(activeBadge);
    }

    const nameEl = document.createElement("div");
    nameEl.className = "cg-hero-card-name";
    nameEl.textContent = hero.name || hero.id;
    card.appendChild(nameEl);

    // Archetype tag
    if (hero.archetype) {
      const archTag = document.createElement("div");
      archTag.className = "cg-hero-card-archetype";
      archTag.textContent = hero.archetype;
      card.appendChild(archTag);
    }

    // Hero power with SVG icon + description
    const powerRow = document.createElement("div");
    powerRow.className = "cg-hero-card-power";
    const pwrSvg = POWER_ICONS[hero.powerIconKey || hero.powerKey];
    if (pwrSvg) powerRow.appendChild(iconEl(pwrSvg, "cg-hero-card-power-icon"));
    const pwrLabel = document.createElement("span");
    pwrLabel.className = "cg-hero-card-power-name";
    pwrLabel.textContent = hero.powerName || "";
    powerRow.appendChild(pwrLabel);
    card.appendChild(powerRow);

    if (hero.powerDesc) {
      const powerDesc = document.createElement("div");
      powerDesc.className = "cg-hero-card-power-desc";
      powerDesc.textContent = hero.powerDesc;
      card.appendChild(powerDesc);
    }

    // Passive ability (§8.2)
    if (hero.passive) {
      const passiveRow = document.createElement("div");
      passiveRow.className = "cg-hero-card-passive";
      passiveRow.textContent = `Passive: ${hero.passive}`;
      card.appendChild(passiveRow);
    }

    // HP badge
    const hpBadge = document.createElement("div");
    hpBadge.className = "cg-hero-card-hp";
    hpBadge.textContent = `${hero.hpMax || 30} HP`;
    card.appendChild(hpBadge);

    // Voice/SFX identity indicator
    if (hero.voiceSet || hero.sfxSet) {
      const voiceBadge = document.createElement("div");
      voiceBadge.className = "cg-hero-card-voice";
      voiceBadge.textContent = hero.voiceSet ? "Voice" : "SFX";
      card.appendChild(voiceBadge);
    }

    card.addEventListener("mouseenter", () => {
      card.classList.add("hovered");
      _audio?.play?.("card-hover");
    });
    card.addEventListener("mouseleave", () => {
      card.classList.remove("hovered");
    });
    card.addEventListener("click", () => {
      _myHero = hero;
      _router.go(SCREENS.DECK_SELECT);
    });
    grid.appendChild(card);
  }
  wrap.appendChild(grid);
  container.appendChild(wrap);
}

function startQuickMatch(hero) {
  const profile = getProfile();
  // Use default deck or auto-build one
  let deck = profile?.decks?.[0];
  let cardIds = _deckToCardIds(deck);
  if (!cardIds.length) {
    // Auto-build a simple deck from pool
    const deckCards = _poolArray
      .map(e => e.card)
      .sort(() => Math.random() - 0.5)
      .slice(0, 30);
    cardIds = deckCards.map(c => c.id);
  }

  const { myHero, enemyHero } = startNewMatch(
    profile?.settings?.heroMode || "developer",
    hero.id,
    cardIds,
    profile?.settings?.difficulty || "normal"
  );

  // Go to mulligan screen (match starts after mulligan choices)
  _router.go(SCREENS.MULLIGAN);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mulligan Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMulliganScreen(container, profile) {
  container.innerHTML = "";

  if (!_engine || !_matchState || _matchState.phase !== "mulligan") {
    // No mulligan needed — skip directly to match
    _router.go(SCREENS.MATCH);
    return;
  }

  const handCardIds = _matchState.handCards || [];
  const overlay = renderMulligan(handCardIds, _cardLookup, {
    onConfirm: (swapIndices) => {
      // Build the kept indices (all indices NOT in swapIndices)
      const keptIndices = [];
      for (let i = 0; i < handCardIds.length; i++) {
        if (!swapIndices.includes(i)) keptIndices.push(i);
      }
      _matchState = _engine.completeMulligan(_matchState, keptIndices);
      updateMatch(_matchState);
      saveProfile();
      _audio?.play?.("card-place");
      _router.go(SCREENS.MATCH);
    },
    onSkip: () => {
      _matchState = _engine.skipMulligan(_matchState);
      updateMatch(_matchState);
      saveProfile();
      _router.go(SCREENS.MATCH);
    },
  });
  container.appendChild(overlay);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Select Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderDeckSelectScreen(container, profile) {
  container.innerHTML = "";
  const hero = _myHero || _heroRoster?.[0] || null;
  const decks = profile?.decks || [];
  container.appendChild(renderDeckSelect(decks, hero, profile, _cardLookup, {
    onPlay: (deck) => {
      // Start match with selected deck
      const deckCards = _deckToCardIds(deck);
      if (!hero) { _router.go(SCREENS.HERO_SELECT); return; }
      startNewMatch(
        profile?.settings?.heroMode || "developer",
        hero.id,
        deckCards,
        profile?.settings?.difficulty || "normal"
      );
      _router.go(SCREENS.MULLIGAN);
    },
    onQuickPlay: () => {
      // Auto-build a deck from the card pool and start immediately
      if (!hero) { _router.go(SCREENS.HERO_SELECT); return; }
      startQuickMatch(hero);
    },
    onEdit: (deck) => {
      _editingDeck = deck;
      _router.go(SCREENS.DECKBUILDER);
    },
    onNewDeck: () => {
      _editingDeck = null;
      _router.go(SCREENS.DECKBUILDER);
    },
    onImportCode: (code) => {
      // Future: decode a deck code string into a deck object
    },
    onBack: () => {
      _router.go(SCREENS.HERO_SELECT);
    },
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shop Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderShopScreen(container, profile) {
  container.innerHTML = "";
  container.appendChild(renderShop(profile, {
    onBuyPack: (pack) => {
      const gold = profile?.collection?.gold || 0;
      if (gold < pack.price) return;
      profile.collection.gold = gold - pack.price;
      if (!profile.packs) profile.packs = { unopened: {} };
      if (!profile.packs.unopened) profile.packs.unopened = {};
      profile.packs.unopened[pack.id] = (profile.packs.unopened[pack.id] || 0) + 1;
      saveProfile();
      _audio?.play?.("reward-claim");
      renderScreen(SCREENS.SHOP);
    },
    onBuyBundle: (bundle) => {
      const gold = profile?.collection?.gold || 0;
      if (gold < bundle.price) return;
      profile.collection.gold = gold - bundle.price;
      if (!profile.packs) profile.packs = { unopened: {} };
      if (!profile.packs.unopened) profile.packs.unopened = {};
      profile.packs.unopened["core"] = (profile.packs.unopened["core"] || 0) + (bundle.packs || 0);
      saveProfile();
      _audio?.play?.("reward-claim");
      renderScreen(SCREENS.SHOP);
    },
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Settings Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSettingsScreen(container, profile) {
  container.innerHTML = "";
  if (!profile.settings) profile.settings = { ...DEFAULT_SETTINGS };
  container.appendChild(renderSettings(profile.settings, {
    onChange: (key, value) => {
      profile.settings[key] = value;
      saveProfile();
    },
    onReset: (defaults) => {
      profile.settings = { ...defaults };
      saveProfile();
      renderScreen(SCREENS.SETTINGS);
    },
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Match View — helpers
   ═══════════════════════════════════════════════════════════════════════════ */

const _delay = (ms) => new Promise((r) => setTimeout(r, ms));

let _enemyTurnActive = false; // guards re-entrant calls

/** Show a cinematic "Enemy Turn" / "Your Turn" banner for ~1.4 s. */
function _showTurnBanner(container, side) {
  const existing = container.querySelector(".cg-turn-banner");
  if (existing) existing.remove();
  const wrap = document.createElement("div");
  wrap.className = `cg-turn-banner ${side}`;
  const inner = document.createElement("div");
  inner.className = "cg-turn-banner-inner";
  inner.textContent = side === "enemy" ? "Enemy Turn" : "Your Turn";
  wrap.appendChild(inner);
  container.appendChild(wrap);
  setTimeout(() => wrap.remove(), 1500);
}

/** Animated enemy turn — steps through AI actions one-by-one with VFX. */
async function _animateEnemyTurn(container, profile) {
  if (_enemyTurnActive || !_engine || !_matchState) return;
  _enemyTurnActive = true;

  const MAX_MANA = 10, MAX_BOARD = 7, HERO_POWER_COST = 2;
  const bf = container.querySelector(".cg-battlefield") || container;

  /** Render and re-lock board for enemy turn */
  function rerender() {
    renderMatchView(container, profile);
    const b = container.querySelector(".cg-battlefield");
    if (b) b.classList.add("enemy-turn");
  }

  // Lock the board during enemy turn
  bf.classList.add("enemy-turn");

  // === 1. End-of-turn effects ===
  _matchState = _engine.endPlayerTurn(_matchState);
  rerender();
  await _delay(300);

  // === 2. Banner ===
  _showTurnBanner(container, "enemy");
  await _delay(900);

  // === 3. Enemy draws a card ===
  _matchState = _engine.enemyDrawCard(_matchState);
  rerender();
  _audio?.play?.("card-draw");
  await _delay(450);

  // === 4. Play cards one-by-one ===
  const enemyMana = Math.min(MAX_MANA, _matchState.turn);
  let manaLeft = enemyMana;
  let cardPlayed = true;
  while (cardPlayed) {
    cardPlayed = false;
    // Scan hand for a playable card (highest cost first for smarter play)
    let bestIdx = -1, bestCost = -1;
    for (let i = 0; i < _matchState.enemyHandCards.length; i++) {
      const card = _cardLookup(_matchState.enemyHandCards[i]);
      if (!card) continue;
      const isMinion = card.type !== "spell" && card.type !== "framework";
      if (card.cost <= manaLeft && (!isMinion || _matchState.enemyBoard.length < MAX_BOARD)) {
        if (card.cost > bestCost) { bestCost = card.cost; bestIdx = i; }
      }
    }
    if (bestIdx >= 0) {
      const cardId = _matchState.enemyHandCards[bestIdx];
      const card = _cardLookup(cardId);
      _matchState = _engine.enemyPlayCardAtIdx(_matchState, bestIdx);
      manaLeft -= (card?.cost || 0);
      rerender();

      // VFX: enemy summon / spell
      if (_vfx) {
        const bfresh = container.querySelector(".cg-battlefield") || container;
        if (card && (card.type === "spell" || card.type === "framework")) {
          const heroEl = bfresh.querySelector('.cg-hero-area[data-side="player"] .cg-hero-portrait');
          if (heroEl) {
            const pos = _vfx.centerOf(heroEl);
            _vfx.impactBurst(pos, { color: "rgba(168,85,247,1)" });
            _vfx.damageNumber(heroEl, card.effectPower || card.attack || 2);
          }
          _audio?.play?.("spell-cast");
        } else {
          const boardArea = bfresh.querySelector('.cg-board-slots[data-side="enemy"]');
          if (boardArea) {
            const pos = _vfx.centerOf(boardArea);
            _vfx.burst(pos, { count: 14, speed: 100, spread: 160, color: "rgba(255,80,80,.9)" });
            _vfx.glow(pos, { radius: 35, duration: 0.35, color: "rgba(255,80,80,.35)" });
          }
          _audio?.play?.("card-place");
        }
      }
      await _delay(650);
      cardPlayed = true;
    }
  }

  // === 5. Hero power (35% chance) ===
  if (!_matchState.enemyPowerUsedThisTurn && manaLeft >= HERO_POWER_COST && Math.random() < 0.35) {
    _matchState = _engine.enemyUseHeroPower(_matchState);
    rerender();
    if (_vfx) {
      const bfresh = container.querySelector(".cg-battlefield") || container;
      const heroEl = bfresh.querySelector('.cg-hero-area[data-side="enemy"] .cg-hero-portrait');
      if (heroEl) {
        const pos = _vfx.centerOf(heroEl);
        _vfx.heroPowerBurst(pos, "rgba(255,80,80,1)");
      }
    }
    _audio?.play?.("hero-power");
    await _delay(550);
  }

  // === 6. Minion attacks one-by-one ===
  for (let i = 0; i < _matchState.enemyBoard.length; i++) {
    const minion = _matchState.enemyBoard[i];
    if (!_engine.canEnemyMinionAttack(minion, _matchState)) continue;

    const bfresh = container.querySelector(".cg-battlefield") || container;
    const atkEl = bfresh.querySelector(`.cg-board-slots[data-side="enemy"] .cg-card[data-board-idx="${i}"]`);

    // Determine target (same logic as defaultEnemyTurn)
    let targetType = "hero";
    let defIdx = -1;
    if (_engine.hasTaunt(_matchState.yourBoard)) {
      for (let j = 0; j < _matchState.yourBoard.length; j++) {
        const c = _cardLookup(_matchState.yourBoard[j].id);
        if ((c?.keywords || []).includes("taunt")) { defIdx = j; break; }
      }
      if (defIdx >= 0) targetType = "minion";
    }
    if (targetType === "hero" && _matchState.yourBoard.length > 0 && Math.random() < 0.6) {
      // Pick weakest minion
      let lowestHp = Infinity;
      for (let j = 0; j < _matchState.yourBoard.length; j++) {
        if (_matchState.yourBoard[j].hp < lowestHp) { lowestHp = _matchState.yourBoard[j].hp; defIdx = j; }
      }
      targetType = "minion";
    }

    // --- Animate the attack ---
    if (atkEl) atkEl.classList.add("attacking-lunge");

    if (targetType === "minion" && defIdx >= 0) {
      const defEl = bfresh.querySelector(`.cg-board-slots[data-side="player"] .cg-card[data-board-idx="${defIdx}"]`);

      // Snapshot pre-attack
      const preDefHp = _matchState.yourBoard[defIdx]?.hp;
      const preAtkHp = _matchState.enemyBoard[i]?.hp;
      const prePBoard = _matchState.yourBoard.length;
      const preEBoard = _matchState.enemyBoard.length;

      await _delay(200);
      // VFX arc + impact
      if (_vfx && atkEl && defEl) _vfx.attackArc(atkEl, defEl);
      if (_vfx && defEl) { const p = _vfx.centerOf(defEl); _vfx.impactBurst(p, { color: "rgba(255,100,60,1)" }); }
      if (defEl) defEl.classList.add("impact");

      await _delay(180);
      _matchState = _engine.enemyMinionAttack(_matchState, i, defIdx);

      // Damage numbers
      const defDmg = preDefHp - (_matchState.yourBoard[defIdx]?.hp ?? 0);
      const atkDmg = preAtkHp - (_matchState.enemyBoard[i]?.hp ?? 0);
      if (_vfx && defEl && defDmg > 0) _vfx.damageNumber(defEl, defDmg);
      if (_vfx && atkEl && atkDmg > 0) _vfx.damageNumber(atkEl, atkDmg);

      // Death VFX
      const defDied = _matchState.yourBoard.length < prePBoard;
      const atkDied = _matchState.enemyBoard.length < preEBoard;
      if (defDied && defEl && _vfx) { defEl.classList.add("death-shatter"); _vfx.deathBurst(_vfx.centerOf(defEl)); }
      if (atkDied && atkEl && _vfx) { atkEl.classList.add("death-shatter"); _vfx.deathBurst(_vfx.centerOf(atkEl)); }

      _audio?.play?.("attack-hit");
      await _delay(defDied || atkDied ? 400 : 200);
      rerender();
      await _delay(250);

      // If attacker died, adjust loop index
      if (atkDied) { i--; continue; }
    } else {
      // Go face
      const heroEl = bfresh.querySelector('.cg-hero-area[data-side="player"] .cg-hero-portrait');
      const preHp = _matchState.yourHp;
      await _delay(200);
      if (_vfx && atkEl && heroEl) _vfx.attackArc(atkEl, heroEl, { color: "rgba(255,60,60,1)" });
      if (_vfx && heroEl) { const p = _vfx.centerOf(heroEl); _vfx.impactBurst(p, { color: "rgba(255,60,60,1)" }); }
      if (heroEl) heroEl.classList.add("hero-hit");
      _vfx?.shake?.(200, 5);

      await _delay(180);
      _matchState = _engine.enemyAttackPlayerHero(_matchState, i);
      const dmg = preHp - _matchState.yourHp;
      if (_vfx && heroEl && dmg > 0) _vfx.damageNumber(heroEl, dmg);
      _audio?.play?.("attack-hero");
      await _delay(350);
      rerender();
      await _delay(200);
    }
  }

  // === 7. Start player turn ===
  _matchState = _engine.beginPlayerTurn(_matchState);
  renderMatchView(container, profile);
  _showTurnBanner(container, "player");
  _audio?.play?.("your-turn");

  _enemyTurnActive = false;

  // Check game over
  updateMatch(_matchState);
  saveProfile();
  if (_matchState.phase === "ended") {
    const result = _matchState.matchResult === "win" ? "victory"
      : _matchState.matchResult === "draw" ? "draw" : "defeat";
    const rewards = applyMatchRewards(profile, result, _matchState.turn || 1);
    assignDailyQuests(profile);
    claimRewardsTrack(profile);
    saveProfile();
    _vfx?.destroy?.();
    _vfx = null;
    setTimeout(() => _router.go(SCREENS.POST_MATCH), 1200);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Match View
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMatchView(container, profile) {
  /* Suppress CSS transitions during full DOM rebuild so cards don't
     "bounce" from their initial state — only explicit VFX classes
     should trigger animations.                                       */
  container.classList.add("cg-rebuilding");
  container.innerHTML = "";

  if (!_engine || !_matchState) {
    const msg = document.createElement("div");
    msg.className = "cg-empty-msg";
    msg.textContent = "No match in progress.";
    container.appendChild(msg);
    return;
  }

  // VFX layer
  if (!_vfx) _vfx = createVfxEngine(container);

  // Build match-like object from state for renderBattlefield
  const match = {
    player: {
      hp: _matchState.yourHp,
      armor: _matchState.yourArmor,
      mana: _matchState.mana,
      maxMana: _matchState.maxMana,
      board: _matchState.yourBoard,
      deck: _matchState.deckCards,
      hand: _matchState.handCards,
      heroPowerUsed: _matchState.yourPowerUsedThisTurn,
    },
    enemy: {
      hp: _matchState.enemyHp,
      armor: _matchState.enemyArmor,
      board: _matchState.enemyBoard,
      deck: _matchState.enemyDeckCards,
      hand: _matchState.enemyHandCards,
    },
    turn: _matchState.activePlayer,
    turn_number: _matchState.turn || 0,
    selectedAttackerIdx: _matchState.selectedAttackerIdx ?? -1,
  };

  const heroes = {
    player: _myHero,
    enemy: _enemyHero,
  };

  // Build battlefield
  const battlefield = renderBattlefield(match, heroes, _cardLookup, {
    onPlayerMinionClick: (card, opts) => {
      // Select attacker — show targeting arrow
      if (_matchState.activePlayer !== "player") return;
      _matchState.selectedAttackerIdx = opts.boardIdx;
      renderMatchView(container, profile);
      // Show targeting arrow from attacker
      const atkEl = container.querySelector(`.cg-board-slots[data-side="player"] .cg-card[data-board-idx="${opts.boardIdx}"]`);
      if (_vfx && atkEl) _vfx.showTargetArrow(atkEl);
    },
    onEnemyMinionClick: (card, opts) => {
      // Attack selected minion — full VFX sequence
      if (_matchState.activePlayer !== "player") return;
      if (_matchState.selectedAttackerIdx >= 0) {
        const atkIdx = _matchState.selectedAttackerIdx;
        const defIdx = opts.boardIdx;

        // Capture DOM elements BEFORE state change
        const atkEl = container.querySelector(`.cg-board-slots[data-side="player"] .cg-card[data-board-idx="${atkIdx}"]`);
        const defEl = container.querySelector(`.cg-board-slots[data-side="enemy"] .cg-card[data-board-idx="${defIdx}"]`);

        // Snapshot HP before attack
        const preState = {
          atkHp: _matchState.yourBoard[atkIdx]?.hp,
          defHp: _matchState.enemyBoard[defIdx]?.hp,
          defAtk: _matchState.enemyBoard[defIdx]?.attack || 0,
          atkAtk: _matchState.yourBoard[atkIdx]?.attack || 0,
          eBoard: _matchState.enemyBoard.length,
          pBoard: _matchState.yourBoard.length,
          atkShield: _matchState.yourBoard[atkIdx]?.shieldActive,
          defShield: _matchState.enemyBoard[defIdx]?.shieldActive,
        };

        // Hide targeting arrow
        _vfx?.hideTargetArrow?.();

        // 1. Play attack lunge animation on attacker
        if (atkEl) atkEl.classList.add("attacking-lunge");

        // 2. After lunge peaks (~200ms), fire VFX
        setTimeout(() => {
          // Attack beam from attacker to defender
          if (_vfx && atkEl && defEl) _vfx.attackArc(atkEl, defEl);

          // Impact burst at defender position
          if (_vfx && defEl) {
            const pos = _vfx.centerOf(defEl);
            _vfx.impactBurst(pos, { color: "rgba(255,100,60,1)" });
          }

          // Impact animation on defender
          if (defEl) defEl.classList.add("impact");
        }, 180);

        // 3. After impact (~350ms), apply game state and show damage numbers
        setTimeout(() => {
          // Apply the actual game state change
          _matchState = _engine.attackMinion(_matchState, atkIdx, defIdx);

          // Calculate damage dealt
          const atkDmgTaken = preState.atkShield ? 0 : preState.defAtk;
          const defDmgTaken = preState.defShield ? 0 : preState.atkAtk;

          // Show floating damage numbers
          if (_vfx) {
            if (defDmgTaken > 0 && defEl) _vfx.damageNumber(defEl, defDmgTaken);
            if (atkDmgTaken > 0 && atkEl) _vfx.damageNumber(atkEl, atkDmgTaken);

            // Shield break VFX
            if (preState.defShield && !_matchState.enemyBoard[defIdx]?.shieldActive) {
              if (defEl) {
                defEl.classList.add("shield-break");
                const pos = _vfx.centerOf(defEl);
                _vfx.shieldPopBurst(pos);
              }
            }
            if (preState.atkShield && !_matchState.yourBoard[atkIdx]?.shieldActive) {
              if (atkEl) {
                atkEl.classList.add("shield-break");
                const pos = _vfx.centerOf(atkEl);
                _vfx.shieldPopBurst(pos);
              }
            }
          }

          // Check for deaths — show death VFX
          const defDied = !_matchState.enemyBoard[defIdx] || _matchState.enemyBoard.length < preState.eBoard;
          const atkDied = !_matchState.yourBoard[atkIdx] || _matchState.yourBoard.length < preState.pBoard;

          if (defDied && defEl && _vfx) {
            defEl.classList.add("death-shatter");
            const pos = _vfx.centerOf(defEl);
            _vfx.deathBurst(pos);
          }
          if (atkDied && atkEl && _vfx) {
            atkEl.classList.add("death-shatter");
            const pos = _vfx.centerOf(atkEl);
            _vfx.deathBurst(pos);
          }

          _audio?.play?.("attack-hit");
          updateQuestProgress(profile, "minionsDestroyed", 1);

          // Delay re-render slightly so death animation is visible
          setTimeout(() => afterPlayerAction(), defDied || atkDied ? 350 : 80);
        }, 350);
      }
    },
    onEnemyHeroClick: (side) => {
      if (_matchState.selectedAttackerIdx >= 0) {
        const atkIdx = _matchState.selectedAttackerIdx;
        const atkEl = container.querySelector(`.cg-board-slots[data-side="player"] .cg-card[data-board-idx="${atkIdx}"]`);
        const heroEl = container.querySelector('.cg-hero-area[data-side="enemy"] .cg-hero-portrait');

        // Snapshot HP
        const preEHp = _matchState.enemyHp;

        // Hide targeting arrow
        _vfx?.hideTargetArrow?.();

        // 1. Lunge attacker
        if (atkEl) atkEl.classList.add("attacking-lunge");

        // 2. Attack beam + impact at hero
        setTimeout(() => {
          if (_vfx && atkEl && heroEl) _vfx.attackArc(atkEl, heroEl, { color: "rgba(255,60,60,1)" });
          if (_vfx && heroEl) {
            const pos = _vfx.centerOf(heroEl);
            _vfx.impactBurst(pos, { color: "rgba(255,60,60,1)" });
          }
          if (heroEl) heroEl.classList.add("hero-hit");
          _vfx?.shake?.(200, 5);
        }, 180);

        // 3. Apply state + show damage
        setTimeout(() => {
          _matchState = _engine.attackHero(_matchState, atkIdx);
          const dmg = preEHp - _matchState.enemyHp;
          if (_vfx && heroEl && dmg > 0) _vfx.damageNumber(heroEl, dmg);
          _audio?.play?.("attack-hero");
          setTimeout(() => afterPlayerAction(), 100);
        }, 350);
      }
    },
    onHandCardClick: (card, opts) => {
      const handIdx = opts?.handIdx ?? -1;
      if (handIdx < 0) return;
      if (_matchState.activePlayer !== "player") return;
      const cardId = card?.id || card;
      const c = _cardLookup(cardId);
      if (!c || _matchState.mana < c.cost) return;

      // Clear targeting arrow if we're playing a card instead
      _vfx?.hideTargetArrow?.();

      // Find the hand card DOM for play animation
      const handCardEl = container.querySelector(`.cg-hand:not(.cg-hand-enemy) .cg-card[data-hand-idx="${handIdx}"]`);
      if (handCardEl) handCardEl.classList.add("playing-card");

      // Mana spent floating text
      if (_vfx && handCardEl && c.cost > 0) {
        const pos = _vfx.centerOf(handCardEl);
        _vfx.floatingText(pos, `-${c.cost}`, { type: "mana" });
      }

      _matchState = _engine.playCard(_matchState, handIdx);
      _audio?.play?.("card-place");

      // Summon VFX at board area
      if (_vfx && c.type !== "spell") {
        const boardArea = container.querySelector('.cg-board-slots[data-side="player"]');
        if (boardArea) {
          const pos = _vfx.centerOf(boardArea);
          const rarityColors = {
            common: "rgba(180,180,180,1)",
            rare: "rgba(74,144,255,1)",
            epic: "rgba(168,85,247,1)",
            legendary: "rgba(245,158,11,1)",
          };
          const color = rarityColors[(c.rarity || "common").toLowerCase()] || rarityColors.common;
          _vfx.burst(pos, { count: 16, speed: 120, spread: 180, color });
          _vfx.glow(pos, { radius: 40, duration: 0.4, color: color.replace(",1)", ",.4)") });
        }
      } else if (_vfx && c.type === "spell") {
        // Spell cast VFX — purple burst
        const boardArea = container.querySelector('.cg-board-slots[data-side="player"]');
        if (boardArea) {
          const pos = _vfx.centerOf(boardArea);
          _vfx.burst(pos, { count: 20, speed: 150, spread: 240, color: "rgba(168,85,247,1)", glow: 12 });
          _vfx.glow(pos, { radius: 50, duration: 0.5, color: "rgba(168,85,247,.5)" });
        }
      }

      updateQuestProgress(profile, "cardsPlayed", 1);
      if (c.type === "minion") updateQuestProgress(profile, "minionsSummoned", 1);
      afterPlayerAction();
    },
    canPlayCard: (card) => {
      if (!card) return false;
      const c = typeof card === "string" ? _cardLookup(card) : card;
      return c && _matchState.mana >= (c.cost ?? 0) && _matchState.activePlayer === "player";
    },
    onHeroPower: () => {
      if (_matchState.yourPowerUsedThisTurn) return;
      if (_matchState.mana < 2) return;
      // Hero power VFX
      if (_vfx) {
        const heroArea = container.querySelector('.cg-hero-area[data-side="player"] .cg-hero-portrait');
        if (heroArea) {
          const pos = _vfx.centerOf(heroArea);
          _vfx.heroPowerBurst(pos, _myHero?.powerColor);
        }
      }
      _matchState = _engine.useHeroPower(_matchState, _myHero);
      _audio?.play?.("hero-power");
      updateQuestProgress(profile, "heroPowersUsed", 1);
      afterPlayerAction();
    },
    onEndTurn: () => {
      if (_enemyTurnActive) return; // prevent double-click
      _vfx?.hideTargetArrow?.();
      _audio?.play?.("end-turn");
      _animateEnemyTurn(container, profile);
    },
    onConcede: () => {
      _engine = null;
      _matchState = null;
      _vfx?.destroy?.();
      _vfx = null;
      _router.go(SCREENS.FRONT_DOOR);
    },
    onSlotDrop: (idx, e) => {
      // Drag & drop card play - extract hand index from dataTransfer
      const raw = e.dataTransfer?.getData("text/plain");
      const handIdx = parseInt(raw, 10);
      if (Number.isNaN(handIdx) || handIdx < 0 || handIdx >= _matchState.handCards.length) return;
      const cardId = _matchState.handCards[handIdx];
      const c = _cardLookup(cardId);
      if (!c || _matchState.mana < c.cost) return;
      _matchState = _engine.playCard(_matchState, handIdx);
      _audio?.play?.("card-place");
      _vfx?.burst?.(0.5, 0.5, c.rarity || "common");
      updateQuestProgress(profile, "cardsPlayed", 1);
      if (c.type === "minion") updateQuestProgress(profile, "minionsSummoned", 1);
      afterPlayerAction();
    },
    onHandCardDrag: (e, card, opts) => {
      const hi = opts?.handIdx ?? -1;
      e.dataTransfer?.setData("text/plain", String(hi));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    },
  });
  container.appendChild(battlefield);

  /* Re-enable transitions on the next frame so layout is computed
     with final positions first (prevents "pop-in" bounce). */
  requestAnimationFrame(() => container.classList.remove("cg-rebuilding"));

  // Right-click anywhere on battlefield deselects attacker
  battlefield.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (_matchState.selectedAttackerIdx >= 0) {
      _matchState.selectedAttackerIdx = -1;
      _vfx?.hideTargetArrow?.();
      renderMatchView(container, profile);
    }
  });

  // Click on empty battlefield area deselects
  battlefield.addEventListener("click", (e) => {
    if (_matchState.selectedAttackerIdx < 0) return;
    const clickedCard = e.target.closest(".cg-card");
    const clickedHero = e.target.closest(".cg-hero-portrait");
    const clickedBtn = e.target.closest("button");
    if (!clickedCard && !clickedHero && !clickedBtn) {
      _matchState.selectedAttackerIdx = -1;
      _vfx?.hideTargetArrow?.();
      renderMatchView(container, profile);
    }
  });

  // Initialize premium drag system
  if (_dragSystem) _dragSystem.destroy();
  _dragSystem = initDragSystem(battlefield, {
    onCardDropped: (handIdx, slotIdx) => {
      if (handIdx < 0 || handIdx >= _matchState.handCards.length) return;
      const cardId = _matchState.handCards[handIdx];
      const c = _cardLookup(cardId);
      if (!c || _matchState.mana < c.cost) return;
      _matchState = _engine.playCard(_matchState, handIdx);
      _audio?.play?.("card-place");
      _vfx?.burst?.(0.5, 0.5, c.rarity || "common");
      updateQuestProgress(profile, "cardsPlayed", 1);
      if (c.type === "minion") updateQuestProgress(profile, "minionsSummoned", 1);
      afterPlayerAction();
    },
  });

  function afterPlayerAction() {
    updateMatch(_matchState);
    saveProfile();

    // Check for game over
    if (_matchState.phase === "ended") {
      const result = _matchState.matchResult === "win" ? "victory"
        : _matchState.matchResult === "draw" ? "draw" : "defeat";
      const rewards = applyMatchRewards(profile, result, _matchState.turn || 1);
      assignDailyQuests(profile);
      claimRewardsTrack(profile);
      saveProfile();

      _vfx?.destroy?.();
      _vfx = null;

      setTimeout(() => {
        _router.go(SCREENS.POST_MATCH);
      }, 1200);
      return;
    }

    // Re-render
    renderMatchView(container, profile);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Post-Match
   ═══════════════════════════════════════════════════════════════════════════ */

function renderPostMatchView(container, profile) {
  container.innerHTML = "";

  const result = _matchState?.matchResult === "win" ? "victory"
    : _matchState?.matchResult === "draw" ? "draw" : "defeat";

  // Apply rewards to profile (returns { xp, gold })
  const rewards = applyMatchRewards(profile, result, _matchState?.turn || 1);

  const myHeroName = _myHero?.name || "You";
  const enemyHeroName = _matchState?.enemyHeroId
    ? (_heroRoster?.find(h => h.id === _matchState.enemyHeroId)?.name || "Enemy")
    : "Enemy";

  container.appendChild(renderPostMatch(result, {
    turns: _matchState?.turn || 0,
    cardsPlayed: _matchState?.cardsPlayedThisTurn || 0,
    damageDealt: 0,
    minionsKilled: (_matchState?.graveyard || []).length,
    heroPowerUses: 0,
    yourHero: myHeroName,
    enemyHero: enemyHeroName,
    rewards: {
      xp: rewards?.xp || 0,
      gold: rewards?.gold || 0,
      dust: rewards?.dust || 0,
    },
  }, {
    onPlayAgain: () => {
      _engine = null;
      _ai = null;
      _matchState = null;
      if (_adventureBattleCallback) {
        // Return to adventure world
        const cb = _adventureBattleCallback;
        _adventureBattleCallback = null;
        _router.go(SCREENS.ADVENTURE);
        // Notify adventure instance of result after re-render
        setTimeout(() => {
          if (_adventureInstance) _adventureInstance.notifyBattleResult(result === "victory" ? "won" : "lost");
          else cb(result === "victory" ? "won" : "lost");
        }, 100);
        return;
      }
      _router.go(SCREENS.HERO_SELECT);
    },
    onModeHub: () => {
      _engine = null;
      _ai = null;
      _matchState = null;
      if (_adventureBattleCallback) {
        const cb = _adventureBattleCallback;
        _adventureBattleCallback = null;
        _router.go(SCREENS.ADVENTURE);
        setTimeout(() => {
          if (_adventureInstance) _adventureInstance.notifyBattleResult(result === "victory" ? "won" : "lost");
          else cb(result === "victory" ? "won" : "lost");
        }, 100);
        return;
      }
      _router.go(SCREENS.MODE_HUB);
    },
    onHome: () => {
      _engine = null;
      _ai = null;
      _matchState = null;
      if (_adventureBattleCallback) {
        const cb = _adventureBattleCallback;
        _adventureBattleCallback = null;
        _router.go(SCREENS.ADVENTURE);
        setTimeout(() => {
          if (_adventureInstance) _adventureInstance.notifyBattleResult(result === "victory" ? "won" : "lost");
          else cb(result === "victory" ? "won" : "lost");
        }, 100);
        return;
      }
      _router.go(SCREENS.FRONT_DOOR);
    },
  }));

  if (result === "victory") {
    _audio?.play?.("victory-sting");
    updateQuestProgress(profile, "wins", 1);
  } else {
    _audio?.play?.("defeat-sting");
  }
  saveProfile();
}

/* ═══════════════════════════════════════════════════════════════════════════
   Public Mount / Unmount API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Try to resume an in-progress match/mulligan session.
 * Rebuilds _engine, _ai, _matchState, _myHero, _enemyHero from the persisted
 * profile.match so the player lands right back on the battlefield.
 * Returns the screen ID to navigate to, or SCREENS.FRONT_DOOR if nothing to resume.
 */
function _tryResumeSession(profile) {
  const match = profile?.match;
  if (!match) return SCREENS.FRONT_DOOR;

  const phase = match.phase;
  if (phase !== "playing" && phase !== "mulligan") return SCREENS.FRONT_DOOR;

  try {
    // Rebuild hero roster + heroes
    const heroMode = match.heroMode || profile?.settings?.heroMode || "developer";
    _heroRoster = buildHeroRoster(_games, heroMode);
    _myHero = _heroRoster.find(h => h.id === match.yourHeroId) || _heroRoster[0] || null;
    _enemyHero = _heroRoster.find(h => h.id === match.enemyHeroId) || pickEnemyHero(_heroRoster, _myHero?.id);

    // Rebuild engine + AI
    _engine = createEngine(_cardLookup, _heroLookup);
    _ai = createAI({ difficulty: "normal" });

    // Restore match state from profile
    _matchState = { ...blankMatchState(), ...match };

    if (phase === "mulligan") return SCREENS.MULLIGAN;
    return SCREENS.MATCH;
  } catch (err) {
    console.warn("[CardGame] Session resume failed, starting fresh:", err);
    return SCREENS.FRONT_DOOR;
  }
}

/**
 * Mount the card game into a DOM element.
 * @param {HTMLElement} rootEl - Container element
 * @param {Object} opts
 * @param {Array} opts.games - Current game list from main-app
 * @param {Array} [opts.modsList] - Current mods list
 */
export function mountCardGame(rootEl, opts = {}) {
  if (_mounted) unmountCardGame();

  _rootEl = rootEl;
  _games = opts.games || [];
  _modsList = opts.modsList || [];

  // Load profile and ensure quests
  loadProfile();
  const profile = getProfile();
  assignDailyQuests(profile);
  assignWeeklyQuests(profile);
  claimRewardsTrack(profile);

  // Build card pool
  rebuildPool();

  // Auto-seed collection: every game/mod the user owns becomes a card
  // at count=1 (Common baseline) immediately — no pack opening needed.
  seedCollectionFromPool(profile, _poolArray);

  // Seed one free developer pack per developer (first-time only)
  seedDeveloperPacks(profile, _poolArray);
  saveProfile();

  // Audio
  _audio = createAudioEngine();

  // Build shell & router
  const shell = buildShell();
  _shellEl = shell;
  _rootEl.innerHTML = "";
  _rootEl.appendChild(shell);

  _router = createRouter(shell);
  _router.onNavigate((screenId) => {
    _lastScreenId = screenId;
    try { renderScreen(screenId); }
    catch (err) { console.error("[CardGame] renderScreen error:", err); }
  });

  // Wire topbar buttons via event delegation
  shell.addEventListener("click", (e) => {
    const backBtn = e.target.closest("[data-action='back']");
    if (backBtn) { _router.back(); return; }
    const navBtn = e.target.closest("[data-nav]");
    if (navBtn) { _router.go(navBtn.dataset.nav); return; }
  });

  // Apply cosmetic theme to shell
  applyThemeToShell(_shellEl, profile);

  // Resume active match/mulligan or start at front door
  const resumeScreen = _tryResumeSession(profile);
  _router.go(resumeScreen);

  _mounted = true;
}

/**
 * Update the card pool if games/mods list changed externally.
 */
export function updateCardGameData(games, modsList) {
  _games = games || [];
  _modsList = modsList || [];
  rebuildPool();
}

/**
 * Unmount and clean up.
 */
export function unmountCardGame() {
  // Persist match state before teardown so it survives tab-away
  if (_matchState && (_matchState.phase === "playing" || _matchState.phase === "mulligan")) {
    try { updateMatch(_matchState); saveProfile(); } catch (_e) {}
  }

  try { _vfx?.destroy?.(); } catch (_e) {}
  try { _audio?.destroy?.(); } catch (_e) {}
  try { _dragSystem?.destroy?.(); } catch (_e) {}

  _vfx = null;
  _audio = null;
  _dragSystem = null;
  _engine = null;
  _ai = null;
  _router = null;
  _shellEl = null;
  _cardPoolMap = null;
  _poolArray = [];
  _games = [];
  _modsList = [];
  _matchState = null;
  _myHero = null;
  _enemyHero = null;
  _heroRoster = [];
  _lastScreenId = null;

  if (_rootEl) {
    _rootEl.innerHTML = "";
    _rootEl = null;
  }

  _mounted = false;
}

export function isCardGameMounted() {
  return _mounted;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Forge Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderCardForgeScreen(container, profile) {
  container.innerHTML = "";
  container.appendChild(renderCardForge(profile, {
    onEquip: (category, itemId) => {
      saveProfile();
      applyThemeToShell(_shellEl, profile);
      renderScreen(SCREENS.CARD_FORGE);
      _audio?.play?.("card-place");
    },
    onPurchase: (category, itemId) => {
      saveProfile();
      renderScreen(SCREENS.CARD_FORGE);
      _audio?.play?.("reward-claim");
    },
  }));
}

/* ═══════════════════════════════════════════════════════════════════════════
   Adventure Mode Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderAdventureScreen(container, profile) {
  container.innerHTML = "";

  // Destroy previous adventure instance if any
  if (_adventureInstance) {
    _adventureInstance.destroy();
    _adventureInstance = null;
  }

  _adventureInstance = createAdventureMode(container, profile, {
    onSave: (worldState) => {
      const p = getProfile();
      p.adventureRun = { worldState };
      updateProfile(p);
      saveProfile();
    },
    onStartBattle: (battleInfo) => {
      // Bridge: start a card battle with the encounter parameters
      const p = getProfile();
      let deck = p?.decks?.[0];
      let cardIds = _deckToCardIds(deck);
      if (!cardIds.length) {
        const deckCards = _poolArray.map(e => e.card).sort(() => Math.random() - 0.5).slice(0, 30);
        cardIds = deckCards.map(c => c.id);
      }

      // Pick hero for adventure
      const heroMode = p?.settings?.heroMode || "developer";
      _heroRoster = buildHeroRoster(_games, heroMode);
      _myHero = _heroRoster[0];
      _enemyHero = pickEnemyHero(_heroRoster, _myHero?.id);

      _engine = createEngine(_cardLookup, _heroLookup);
      _ai = createAI({ difficulty: battleInfo.difficulty === "boss" ? "hard" : battleInfo.difficulty === "elite" ? "hard" : battleInfo.difficulty });

      // Apply equipment bonuses to starting HP
      const startHp = 30 + (battleInfo.bonuses?.hp || 0);

      _matchState = _engine.startMatch(null, {
        mode: "adventure",
        heroMode,
        yourHeroId: _myHero?.id,
        enemyHeroId: _enemyHero?.id,
        deckCards: cardIds,
        enemyDeckCards: _poolArray.map(e => e.card).sort(() => Math.random() - 0.5).slice(0, 30).map(c => c.id),
        yourHp: startHp,
        yourArmor: battleInfo.bonuses?.armor || 0,
        enemyHp: battleInfo.bossHp,
      });

      updateMatch(_matchState);
      saveProfile();

      // Store callback for when battle ends
      _adventureBattleCallback = battleInfo.onBattleEnd;

      // Navigate to match (skip mulligan for adventure)
      _matchState = _engine.completeMulligan?.(_matchState, [0, 1, 2]) || _matchState;
      updateMatch(_matchState);
      saveProfile();
      _router.go(SCREENS.MATCH);
    },
    onQuit: () => {
      _router.go(SCREENS.MODE_HUB);
    },
    onAdventureComplete: () => {
      const p = getProfile();
      updateQuestProgress(p, "adventureComplete", 1);
      saveProfile();
    },
    onBuyPack: () => {
      const p = getProfile();
      if (!p.packs) p.packs = [];
      p.packs.push({ type: "basic", count: 1 });
      updateProfile(p);
      saveProfile();
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Sealed Forge Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSealedScreen(container, profile) {
  container.innerHTML = "";
  renderSealedForge(container, profile, {
    onStart: () => {
      saveProfile();
      renderScreen(SCREENS.SEALED);
      _audio?.play?.("card-place");
    },
    onResume: () => {
      _router.go(SCREENS.HERO_SELECT);
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Gauntlet Run Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderGauntletScreen(container, profile) {
  container.innerHTML = "";
  renderGauntletRun(container, profile, {
    onStart: () => {
      saveProfile();
      renderScreen(SCREENS.GAUNTLET);
      _audio?.play?.("card-place");
    },
    onResume: () => {
      _router.go(SCREENS.HERO_SELECT);
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Puzzle Mode Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderPuzzleScreen(container, profile) {
  container.innerHTML = "";
  renderPuzzleMode(container, profile, {
    onPuzzle: (puzzle) => {
      _audio?.play?.("card-place");
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Singleton Mode Screen
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSingletonScreen(container, profile) {
  container.innerHTML = "";
  renderSingletonMode(container, profile, {
    onPlay: () => {
      _router.go(SCREENS.HERO_SELECT);
    },
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utilities
   ═══════════════════════════════════════════════════════════════════════════ */

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
