/**
 * @module cardgame/engine
 * @description Core rules engine — turn flow, combat resolution, effect processing,
 * zone management, targeting, keyword mechanics, and game-over detection.
 *
 * This is a pure state machine. Every action takes the current state and returns
 * a new state plus a list of events for the UI to animate.
 */

import { blankMatchState, blankMinionState } from "./state.js";
import { KEYWORDS, CARD_TYPES } from "./cards.js";
import { getHeroPowerAction } from "./heroes.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

export const MAX_BOARD_SIZE = 7;
export const MAX_HAND_SIZE = 10;
export const MAX_DECK_SIZE = 30;
export const STARTING_HAND_SIZE = 3;  // going first
export const STARTING_HAND_COIN = 4;  // going second (gets The Coin)
export const MAX_MANA = 10;
export const HERO_POWER_COST = 2;

/* ═══════════════════════════════════════════════════════════════════════════
   Action types — every possible game action
   ═══════════════════════════════════════════════════════════════════════════ */

export const ACTION = {
  START_MATCH: "START_MATCH",
  START_TURN: "START_TURN",
  END_TURN: "END_TURN",
  DRAW_CARD: "DRAW_CARD",
  PLAY_CARD: "PLAY_CARD",
  ATTACK_MINION: "ATTACK_MINION",
  ATTACK_HERO: "ATTACK_HERO",
  USE_HERO_POWER: "USE_HERO_POWER",
  MULLIGAN_DONE: "MULLIGAN_DONE",
  CONCEDE: "CONCEDE",
  SUMMON_MINION: "SUMMON_MINION",
  DESTROY_MINION: "DESTROY_MINION",
  DEAL_DAMAGE: "DEAL_DAMAGE",
  HEAL: "HEAL",
  BUFF_MINION: "BUFF_MINION",
  TRIGGER_DEATHRATTLE: "TRIGGER_DEATHRATTLE",
  TRIGGER_BATTLECRY: "TRIGGER_BATTLECRY",
  DISCOVER_OFFER: "DISCOVER_OFFER",
  DISCOVER_PICK: "DISCOVER_PICK",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Event types — emitted for UI animation
   ═══════════════════════════════════════════════════════════════════════════ */

export const EVENT = {
  MATCH_STARTED: "MATCH_STARTED",
  TURN_STARTED: "TURN_STARTED",
  CARD_DRAWN: "CARD_DRAWN",
  CARD_PLAYED: "CARD_PLAYED",
  CARD_BURNED: "CARD_BURNED",
  MINION_SUMMONED: "MINION_SUMMONED",
  MINION_ATTACKED: "MINION_ATTACKED",
  MINION_DAMAGED: "MINION_DAMAGED",
  MINION_HEALED: "MINION_HEALED",
  MINION_DIED: "MINION_DIED",
  MINION_BUFFED: "MINION_BUFFED",
  HERO_DAMAGED: "HERO_DAMAGED",
  HERO_HEALED: "HERO_HEALED",
  HERO_ARMOR_GAINED: "HERO_ARMOR_GAINED",
  HERO_POWER_USED: "HERO_POWER_USED",
  SHIELD_POPPED: "SHIELD_POPPED",
  MULLIGAN_STARTED: "MULLIGAN_STARTED",
  MULLIGAN_COMPLETED: "MULLIGAN_COMPLETED",
  MATCH_ENDED: "MATCH_ENDED",
  MANA_SPENT: "MANA_SPENT",
  MANA_GAINED: "MANA_GAINED",
  DEATHRATTLE_TRIGGERED: "DEATHRATTLE_TRIGGERED",
  BATTLECRY_TRIGGERED: "BATTLECRY_TRIGGERED",
  VOLATILE_TRIGGERED: "VOLATILE_TRIGGERED",
  FRAMEWORK_APPLIED: "FRAMEWORK_APPLIED",
  DISCOVER_OFFERED: "DISCOVER_OFFERED",
  DISCOVER_CHOSEN: "DISCOVER_CHOSEN",
  FATIGUE_DAMAGE: "FATIGUE_DAMAGE",
  WEAPON_EQUIPPED: "WEAPON_EQUIPPED",
  WEAPON_DURABILITY_LOST: "WEAPON_DURABILITY_LOST",
  WEAPON_DESTROYED: "WEAPON_DESTROYED",
  COMBO_TRIGGERED: "COMBO_TRIGGERED",
  GAME_OVER: "GAME_OVER",
  /* New events (REFERENCE_STUDY §A1–A5, §B1–B10) */
  REBORN_TRIGGERED: "REBORN_TRIGGERED",
  FREEZE_APPLIED: "FREEZE_APPLIED",
  FREEZE_THAWED: "FREEZE_THAWED",
  OVERLOAD_APPLIED: "OVERLOAD_APPLIED",
  OVERLOAD_UNLOCKED: "OVERLOAD_UNLOCKED",
  DORMANT_PLACED: "DORMANT_PLACED",
  DORMANT_AWAKENED: "DORMANT_AWAKENED",
  RETURN_TO_HAND: "RETURN_TO_HAND",
  HAND_SCALING: "HAND_SCALING",
  HEAL_ALL_FRIENDLY: "HEAL_ALL_FRIENDLY",
  UNIVERSAL_AOE: "UNIVERSAL_AOE",
  AURA_TICK: "AURA_TICK",
  EFFECT_QUEUED: "EFFECT_QUEUED",
  EFFECT_RESOLVED: "EFFECT_RESOLVED",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Engine — pure reducer + event emitter
   ═══════════════════════════════════════════════════════════════════════════ */

export function createEngine(cardLookup, heroLookup) {
  const events = [];

  /* ─── A1: Action queue with depth tracking (from fireplace) ─── */
  let _queueDepth = 0;
  const _effectQueue = [];

  function queueEffect(effectFn) {
    _effectQueue.push(effectFn);
    emit(EVENT.EFFECT_QUEUED, { queueSize: _effectQueue.length });
  }

  function drainEffectQueue(s) {
    _queueDepth++;
    while (_effectQueue.length > 0) {
      const fn = _effectQueue.shift();
      s = fn(s);
    }
    _queueDepth--;
    if (_queueDepth === 0) {
      emit(EVENT.EFFECT_RESOLVED, { remaining: 0 });
    }
    return s;
  }

  /* ─── A5: Aura / buff registry for tick-based lifecycle ─── */
  const _activeAuras = [];  // { ownerId, buffType, targets, turnsLeft }

  function registerAura(ownerId, buffType, targetFilter, duration) {
    _activeAuras.push({ ownerId, buffType, targetFilter, turnsLeft: duration });
  }

  function tickAuras(s) {
    for (let i = _activeAuras.length - 1; i >= 0; i--) {
      _activeAuras[i].turnsLeft--;
      if (_activeAuras[i].turnsLeft <= 0) {
        emit(EVENT.AURA_TICK, { ownerId: _activeAuras[i].ownerId, expired: true });
        _activeAuras.splice(i, 1);
      } else {
        emit(EVENT.AURA_TICK, { ownerId: _activeAuras[i].ownerId, turnsLeft: _activeAuras[i].turnsLeft });
      }
    }
    return s;
  }

  function emit(type, data = {}) {
    events.push({ type, ...data, timestamp: Date.now() });
  }

  function drainEvents() {
    const copy = [...events];
    events.length = 0;
    return copy;
  }

  /* ─── Start match ─── */
  function startMatch(state, opts = {}) {
    const s = { ...blankMatchState() };
    s.matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    s.matchMode = opts.mode || "casual";
    s.matchStartedAt = Date.now();
    s.heroMode = opts.heroMode || "developer";
    s.yourHeroId = opts.yourHeroId || "";
    s.enemyHeroId = opts.enemyHeroId || "";

    const yourHero = heroLookup(s.yourHeroId);
    const enemyHero = heroLookup(s.enemyHeroId);

    s.yourMaxHp = yourHero?.hpMax || 30;
    s.yourHp = s.yourMaxHp;
    s.enemyMaxHp = enemyHero?.hpMax || 30;
    s.enemyHp = s.enemyMaxHp;

    // Shuffle deck
    s.deckCards = shuffleArray([...(opts.deckCards || [])]);
    // Enemy gets a random deck from pool
    s.enemyDeckCards = shuffleArray([...(opts.enemyDeckCards || [])]);

    // Draw starting hands
    s.phase = "mulligan";
    const handSize = STARTING_HAND_SIZE;
    for (let i = 0; i < handSize && s.deckCards.length; i++) {
      s.handCards.push(s.deckCards.shift());
    }
    for (let i = 0; i < handSize && s.enemyDeckCards.length; i++) {
      s.enemyHandCards.push(s.enemyDeckCards.shift());
    }
    s.mulliganOffered = [...s.handCards];

    emit(EVENT.MATCH_STARTED, { matchId: s.matchId, mode: s.matchMode });
    emit(EVENT.MULLIGAN_STARTED, { cards: s.mulliganOffered });

    return s;
  }

  /* ─── Mulligan ─── */
  function completeMulligan(state, keptIndices = []) {
    const s = { ...state };
    const kept = new Set(keptIndices);
    const returned = [];
    const newHand = [];

    for (let i = 0; i < s.handCards.length; i++) {
      if (kept.has(i)) {
        newHand.push(s.handCards[i]);
      } else {
        returned.push(s.handCards[i]);
      }
    }

    // Put returned cards back in deck and shuffle
    s.deckCards.push(...returned);
    s.deckCards = shuffleArray(s.deckCards);

    // Draw replacements
    const toDraw = returned.length;
    for (let i = 0; i < toDraw && s.deckCards.length; i++) {
      newHand.push(s.deckCards.shift());
    }

    s.handCards = newHand;
    s.mulliganOffered = [];
    s.mulliganKept = keptIndices;

    emit(EVENT.MULLIGAN_COMPLETED, { hand: s.handCards });

    // Start turn 1
    return startTurn(s);
  }

  /* ─── Skip mulligan (auto-complete for practice) ─── */
  function skipMulligan(state) {
    return completeMulligan(state, state.handCards.map((_, i) => i));
  }

  /* ─── Start turn ─── */
  function startTurn(state) {
    const s = { ...state };
    s.turn++;
    s.phase = "playing";

    // Mana ramp
    s.maxMana = Math.min(MAX_MANA, s.turn);
    s.mana = s.maxMana;

    // Overload unlock (B10): deduct locked mana from this turn
    if (s.overloadedCurrent > 0) {
      s.mana = Math.max(0, s.mana - s.overloadedCurrent);
      emit(EVENT.OVERLOAD_UNLOCKED, { amount: s.overloadedCurrent });
      s.overloadedCurrent = 0;
    }
    // Shift next-turn overload to current
    s.overloadedCurrent = s.overloadedNext || 0;
    s.overloadedNext = 0;

    // Reset attack flags and combo counter
    s.yourPowerUsedThisTurn = false;
    s.cardsPlayedThisTurn = 0;
    s.yourBoard = s.yourBoard.map(m => {
      const copy = { ...m, attackedThisTurn: false };

      // Freeze thaw (B9): frozen minions thaw at start of owner's turn
      if (copy.frozen) {
        copy.frozen = false;
        emit(EVENT.FREEZE_THAWED, { who: "player", instanceId: copy.instanceId });
      }

      // Dormant countdown (B7): decrement turns, awaken if done
      if (copy.dormant && copy.dormantTurnsLeft > 0) {
        copy.dormantTurnsLeft--;
        if (copy.dormantTurnsLeft <= 0) {
          copy.dormant = false;
          copy.canAttack = false; // summoning sickness
          emit(EVENT.DORMANT_AWAKENED, { who: "player", instanceId: copy.instanceId });
        }
      }

      return copy;
    });
    s.selectedHandIdx = -1;
    s.selectedAttackerIdx = -1;

    // Tick auras (A5)
    tickAuras(s);

    // Draw a card
    drawCard(s, "player");

    emit(EVENT.TURN_STARTED, { turn: s.turn, mana: s.mana });
    emit(EVENT.MANA_GAINED, { amount: s.mana });

    // Drain any queued effects (A1)
    drainEffectQueue(s);

    return s;
  }

  /* ─── Draw card ─── */
  function drawCard(s, who) {
    const deck = who === "player" ? s.deckCards : s.enemyDeckCards;
    const hand = who === "player" ? s.handCards : s.enemyHandCards;

    if (!deck.length) {
      // Fatigue damage
      const fatigueDmg = who === "player"
        ? Math.max(1, s.turn - MAX_DECK_SIZE + hand.length)
        : Math.max(1, s.turn - MAX_DECK_SIZE + hand.length);
      if (who === "player") {
        s.yourHp -= fatigueDmg;
        emit(EVENT.FATIGUE_DAMAGE, { who: "player", damage: fatigueDmg });
      } else {
        s.enemyHp -= fatigueDmg;
        emit(EVENT.FATIGUE_DAMAGE, { who: "enemy", damage: fatigueDmg });
      }
      return;
    }

    const cardId = deck.shift();
    if (hand.length >= MAX_HAND_SIZE) {
      // Card is burned (overdraw)
      if (who === "player") s.graveyard.push(cardId);
      else s.enemyGraveyard.push(cardId);
      emit(EVENT.CARD_BURNED, { who, cardId });
      return;
    }

    hand.push(cardId);
    emit(EVENT.CARD_DRAWN, { who, cardId });
  }

  /* ─── Play card from hand ─── */
  function playCard(state, handIdx) {
    const s = { ...state };
    if (s.phase !== "playing" || s.activePlayer !== "player") return s;
    if (handIdx < 0 || handIdx >= s.handCards.length) return s;

    const cardId = s.handCards[handIdx];
    const card = cardLookup(cardId);
    if (!card) return s;
    if (s.mana < card.cost) return s;

    // Remove from hand
    s.handCards = [...s.handCards];
    s.handCards.splice(handIdx, 1);

    // Pay mana
    s.mana -= card.cost;
    emit(EVENT.MANA_SPENT, { amount: card.cost });

    // Track combo: was a card played before this one this turn?
    const previousCardsThisTurn = s.cardsPlayedThisTurn || 0;
    s.cardsPlayedThisTurn = previousCardsThisTurn + 1;

    // Handle by card type
    if (card.type === CARD_TYPES.SPELL) {
      return resolveSpell(s, card);
    } else if (card.type === CARD_TYPES.FRAMEWORK) {
      return resolveFramework(s, card);
    } else if (card.type === CARD_TYPES.WEAPON) {
      return resolveWeapon(s, card);
    } else {
      // Minion — check for combo keyword
      if ((card.keywords || []).includes("combo") && previousCardsThisTurn > 0) {
        return summonMinion(s, card, "player", true);
      }
      return summonMinion(s, card, "player", false);
    }
  }

  /* ─── Summon minion ─── */
  function summonMinion(s, card, who, comboActive = false) {
    const board = who === "player" ? s.yourBoard : s.enemyBoard;
    if (board.length >= MAX_BOARD_SIZE) return s;

    const minion = blankMinionState(card.id, s.turn);
    minion.hp = card.health;
    minion.maxHp = card.health;
    minion.attack = card.attack;
    minion.shieldActive = (card.keywords || []).includes("shield");

    // Combo bonus: +1/+1 when combo is active
    if (comboActive) {
      minion.attack += 1;
      minion.hp += 1;
      minion.maxHp += 1;
    }

    // Charge: can attack immediately
    if ((card.keywords || []).includes("charge")) {
      minion.canAttack = true;
    }
    // Rush: can attack minions immediately
    if ((card.keywords || []).includes("rush")) {
      minion.canAttack = true; // UI restricts to minion targets only
    }

    // Dormant: cannot attack or be targeted for N turns (B7)
    if ((card.keywords || []).includes("dormant")) {
      minion.dormant = true;
      minion.dormantTurnsLeft = card.dormantTurns || 2;
      minion.canAttack = false;
    }

    // Reborn flag (B8)
    if ((card.keywords || []).includes("reborn")) {
      minion.rebornActive = true;
    }

    // Overload tracking (B10)
    if ((card.keywords || []).includes("overload") && (card.overloadCost || 0) > 0) {
      if (who === "player") {
        s.overloadedNext = (s.overloadedNext || 0) + card.overloadCost;
        emit(EVENT.OVERLOAD_APPLIED, { who: "player", amount: card.overloadCost });
      }
    }

    if (who === "player") {
      s.yourBoard = [...s.yourBoard, minion];
    } else {
      s.enemyBoard = [...s.enemyBoard, minion];
    }

    emit(EVENT.MINION_SUMMONED, { who, minion: { ...minion }, card });

    // Battlecry
    if ((card.keywords || []).includes("battlecry")) {
      return triggerBattlecry(s, minion, card, who);
    }

    return s;
  }

  /* ─── Attack minion ─── */
  function attackMinion(state, attackerIdx, defenderIdx) {
    let s = { ...state };
    if (s.phase !== "playing") return s;

    const attacker = s.yourBoard[attackerIdx];
    const defender = s.enemyBoard[defenderIdx];
    if (!attacker || !defender) return s;

    // Check taunt
    if (hasTaunt(s.enemyBoard) && !(cardLookup(defender.id)?.keywords || []).includes("taunt")) {
      return s; // Must attack taunt minion
    }

    // Check can attack
    if (!canMinionAttack(attacker, s.turn)) return s;

    emit(EVENT.MINION_ATTACKED, {
      attackerIdx, defenderIdx,
      attackerId: attacker.instanceId,
      defenderId: defender.instanceId,
    });

    // Resolve combat
    s.yourBoard = [...s.yourBoard];
    s.enemyBoard = [...s.enemyBoard];

    const aCopy = { ...s.yourBoard[attackerIdx] };
    const dCopy = { ...s.enemyBoard[defenderIdx] };

    // Apply damage (considering shields)
    const aDmg = dCopy.attack;
    const dDmg = aCopy.attack;

    resolveDamage(aCopy, aDmg, "attacker");
    resolveDamage(dCopy, dDmg, "defender");

    aCopy.attackedThisTurn = true;

    // Lifesteal check
    const attackerCard = cardLookup(aCopy.id);
    if ((attackerCard?.keywords || []).includes("lifesteal") && dDmg > 0) {
      s.yourHp = Math.min(s.yourMaxHp, s.yourHp + dDmg);
      emit(EVENT.HERO_HEALED, { who: "player", amount: dDmg });
    }

    // Poisonous check
    if ((attackerCard?.keywords || []).includes("poisonous") && dDmg > 0 && dCopy.hp > 0) {
      dCopy.hp = 0;
    }
    const defenderCard = cardLookup(dCopy.id);
    if ((defenderCard?.keywords || []).includes("poisonous") && aDmg > 0 && aCopy.hp > 0) {
      aCopy.hp = 0;
    }

    s.yourBoard[attackerIdx] = aCopy;
    s.enemyBoard[defenderIdx] = dCopy;

    // Process deaths
    s = processDeaths(s);

    s.selectedAttackerIdx = -1;
    return s;
  }

  /* ─── Attack hero ─── */
  function attackHero(state, attackerIdx) {
    let s = { ...state };
    if (s.phase !== "playing") return s;

    const attacker = s.yourBoard[attackerIdx];
    if (!attacker) return s;
    if (!canMinionAttack(attacker, s.turn)) return s;
    if (hasTaunt(s.enemyBoard)) return s; // Must attack taunt first

    const dmg = attacker.attack;

    // Armor absorbs first
    if (s.enemyArmor > 0) {
      const armorAbsorb = Math.min(s.enemyArmor, dmg);
      s.enemyArmor -= armorAbsorb;
      const remaining = dmg - armorAbsorb;
      if (remaining > 0) {
        s.enemyHp -= remaining;
      }
    } else {
      s.enemyHp -= dmg;
    }

    emit(EVENT.HERO_DAMAGED, { who: "enemy", damage: dmg, attackerIdx });

    // Lifesteal
    const attackerCard = cardLookup(attacker.id);
    if ((attackerCard?.keywords || []).includes("lifesteal") && dmg > 0) {
      s.yourHp = Math.min(s.yourMaxHp, s.yourHp + dmg);
      emit(EVENT.HERO_HEALED, { who: "player", amount: dmg });
    }

    s.yourBoard = [...s.yourBoard];
    s.yourBoard[attackerIdx] = { ...s.yourBoard[attackerIdx], attackedThisTurn: true };
    s.selectedAttackerIdx = -1;

    // Check game over
    s = checkGameOver(s);
    return s;
  }

  /* ─── Use hero power ─── */
  function useHeroPower(state, hero) {
    let s = { ...state };
    if (s.phase !== "playing") return s;
    if (s.yourPowerUsedThisTurn) return s;
    if (s.mana < HERO_POWER_COST) return s;

    s.mana -= HERO_POWER_COST;
    s.yourPowerUsedThisTurn = true;

    const action = getHeroPowerAction(hero, s);
    if (!action) return s;

    emit(EVENT.HERO_POWER_USED, { hero, action });
    emit(EVENT.MANA_SPENT, { amount: HERO_POWER_COST });

    switch (action.type) {
      case "HERO_POWER_DAMAGE":
        if (s.enemyArmor > 0) {
          const armorAbsorb = Math.min(s.enemyArmor, action.damage);
          s.enemyArmor -= armorAbsorb;
          s.enemyHp -= Math.max(0, action.damage - armorAbsorb);
        } else {
          s.enemyHp -= action.damage;
        }
        emit(EVENT.HERO_DAMAGED, { who: "enemy", damage: action.damage });
        break;

      case "HERO_POWER_HEAL":
        s.yourHp = Math.min(s.yourMaxHp, s.yourHp + action.amount);
        emit(EVENT.HERO_HEALED, { who: "player", amount: action.amount });
        break;

      case "HERO_POWER_ARMOR":
        s.yourArmor += action.amount;
        emit(EVENT.HERO_ARMOR_GAINED, { amount: action.amount });
        break;

      case "HERO_POWER_SUMMON":
        if (s.yourBoard.length < MAX_BOARD_SIZE) {
          const token = blankMinionState("hero_token", s.turn);
          token.attack = action.attack;
          token.hp = action.health;
          token.maxHp = action.health;
          s.yourBoard = [...s.yourBoard, token];
          emit(EVENT.MINION_SUMMONED, {
            who: "player",
            minion: token,
            card: { title: "Recruit", cost: 0, attack: action.attack, health: action.health, type: "minion", keywords: [], rarity: "common" },
          });
        }
        break;

      case "HERO_POWER_DRAW":
        drawCard(s, "player");
        break;

      case "HERO_POWER_BUFF":
        if (s.yourBoard.length > 0) {
          const idx = Math.floor(Math.random() * s.yourBoard.length);
          s.yourBoard = [...s.yourBoard];
          const m = { ...s.yourBoard[idx] };
          m.attack += action.attack;
          m.hp += action.health;
          m.maxHp += action.health;
          s.yourBoard[idx] = m;
          emit(EVENT.MINION_BUFFED, { who: "player", idx, attack: action.attack, health: action.health });
        }
        break;

      case "HERO_POWER_PING":
        // For simplicity, ping enemy hero. Could be targeted later.
        s.enemyHp -= action.damage;
        emit(EVENT.HERO_DAMAGED, { who: "enemy", damage: action.damage });
        break;
    }

    s = checkGameOver(s);
    return s;
  }

  /* ─── End turn ─── */
  function endTurn(state, enemyAI) {
    let s = { ...state };
    if (s.phase !== "playing") return s;

    // Process end-of-turn effects
    s = processEndOfTurnEffects(s);

    // Enemy turn
    s = executeEnemyTurn(s, enemyAI);

    // Start player's next turn
    s = startTurn(s);

    // Check game over
    s = checkGameOver(s);

    return s;
  }

  /* ─── Concede ─── */
  function concede(state) {
    const s = { ...state };
    s.phase = "ended";
    s.matchResult = "loss";
    emit(EVENT.MATCH_ENDED, { result: "loss", reason: "concede" });
    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     Internal helpers
     ═══════════════════════════════════════════════════════════════ */

  function canMinionAttack(minion, currentTurn) {
    if (minion.attackedThisTurn) return false;
    if (minion.frozen) return false;
    if (minion.dormant) return false; // Dormant minions cannot act (B7)
    if (minion.attack <= 0) return false;

    const card = cardLookup(minion.id);
    const hasCharge = (card?.keywords || []).includes("charge");
    const hasRush = (card?.keywords || []).includes("rush");

    // Summoning sickness
    if (minion.summonedTurn === currentTurn && !hasCharge && !hasRush) {
      return false;
    }

    return true;
  }

  function hasTaunt(board) {
    return board.some(m => {
      const card = cardLookup(m.id);
      return (card?.keywords || []).includes("taunt") && !m.stealth;
    });
  }

  function resolveDamage(minion, damage, role) {
    if (damage <= 0) return;
    if (minion.shieldActive) {
      minion.shieldActive = false;
      emit(EVENT.SHIELD_POPPED, { instanceId: minion.instanceId, role });
      return;
    }
    minion.hp -= damage;
    emit(EVENT.MINION_DAMAGED, { instanceId: minion.instanceId, damage, role });
  }

  const MAX_DEATH_DEPTH = 8;
  function processDeaths(s, _depth = 0) {
    if (_depth >= MAX_DEATH_DEPTH) return s;
    // Check for deaths on both boards
    const deadYours = s.yourBoard.filter(m => m.hp <= 0);
    const deadEnemy = s.enemyBoard.filter(m => m.hp <= 0);
    if (deadYours.length === 0 && deadEnemy.length === 0) return s;

    // Collect reborn resummons
    const rebornYours = [];
    const rebornEnemy = [];

    for (const m of deadYours) {
      emit(EVENT.MINION_DIED, { who: "player", instanceId: m.instanceId, cardId: m.id });
      s.graveyard.push(m.id);
      // Deathrattle
      const card = cardLookup(m.id);
      if ((card?.keywords || []).includes("deathrattle")) {
        s = triggerDeathrattle(s, m, card, "player", _depth);
      }
      // Reborn: resummon with 1 HP (B8)
      if (m.rebornActive) {
        rebornYours.push({ ...m, hp: 1, maxHp: m.maxHp, rebornActive: false, canAttack: false });
        emit(EVENT.REBORN_TRIGGERED, { who: "player", instanceId: m.instanceId, cardId: m.id });
      }
    }
    for (const m of deadEnemy) {
      emit(EVENT.MINION_DIED, { who: "enemy", instanceId: m.instanceId, cardId: m.id });
      s.enemyGraveyard.push(m.id);
      const card = cardLookup(m.id);
      if ((card?.keywords || []).includes("deathrattle")) {
        s = triggerDeathrattle(s, m, card, "enemy", _depth);
      }
      // Reborn: resummon with 1 HP (B8)
      if (m.rebornActive) {
        rebornEnemy.push({ ...m, hp: 1, maxHp: m.maxHp, rebornActive: false, canAttack: false });
        emit(EVENT.REBORN_TRIGGERED, { who: "enemy", instanceId: m.instanceId, cardId: m.id });
      }
    }

    s.yourBoard = s.yourBoard.filter(m => m.hp > 0);
    s.enemyBoard = s.enemyBoard.filter(m => m.hp > 0);

    // Place reborn minions back on board (up to board limit of 7)
    for (const rm of rebornYours) {
      if (s.yourBoard.length < 7) {
        rm.instanceId = ++s._nextInstanceId;
        s.yourBoard = [...s.yourBoard, rm];
      }
    }
    for (const rm of rebornEnemy) {
      if (s.enemyBoard.length < 7) {
        rm.instanceId = ++s._nextInstanceId;
        s.enemyBoard = [...s.enemyBoard, rm];
      }
    }

    return s;
  }

  function triggerBattlecry(s, minion, card, who) {
    emit(EVENT.BATTLECRY_TRIGGERED, { who, instanceId: minion.instanceId, cardId: card.id });

    // Default battlecry: deal 1 damage to a random enemy minion
    const targets = who === "player" ? s.enemyBoard : s.yourBoard;
    if (targets.length > 0) {
      const idx = Math.floor(Math.random() * targets.length);
      const board = who === "player" ? "enemyBoard" : "yourBoard";
      s[board] = [...s[board]];
      const target = { ...s[board][idx] };
      resolveDamage(target, 1, "battlecry_target");
      s[board][idx] = target;
      s = processDeaths(s, 1);
    }

    return s;
  }

  function triggerDeathrattle(s, minion, card, who, _depth = 0) {
    emit(EVENT.DEATHRATTLE_TRIGGERED, { who, instanceId: minion.instanceId, cardId: card.id });

    // Default deathrattle: deal 1 damage to all enemy minions
    const targetBoard = who === "player" ? "enemyBoard" : "yourBoard";
    s[targetBoard] = s[targetBoard].map(m => {
      const copy = { ...m };
      resolveDamage(copy, 1, "deathrattle");
      return copy;
    });
    s = processDeaths(s, _depth + 1);

    return s;
  }

  function resolveSpell(s, card) {
    emit(EVENT.CARD_PLAYED, { cardId: card.id, type: "spell" });

    const kws = card.keywords || [];

    if (kws.includes("patch")) {
      // Heal all friendly minions for effectPower
      const heal = card.effectPower || card.attack || 2;
      s.yourBoard = s.yourBoard.map(m => {
        const copy = { ...m };
        copy.hp = Math.min(copy.maxHp, copy.hp + heal);
        return copy;
      });
      emit(EVENT.HERO_HEALED, { who: "player_board", amount: heal });
    } else if (kws.includes("overhaul")) {
      // Transform a random enemy minion to 1/1
      if (s.enemyBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.enemyBoard.length);
        s.enemyBoard = [...s.enemyBoard];
        s.enemyBoard[idx] = { ...s.enemyBoard[idx], attack: 1, hp: 1, maxHp: 1 };
        emit(EVENT.MINION_BUFFED, { who: "enemy", idx, attack: -99, health: -99 });
      }
    } else if (kws.includes("install")) {
      // Buff a random friendly minion
      const buff = card.effectPower || 2;
      if (s.yourBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.yourBoard.length);
        s.yourBoard = [...s.yourBoard];
        const m = { ...s.yourBoard[idx] };
        m.attack += buff;
        m.hp += buff;
        m.maxHp += buff;
        s.yourBoard[idx] = m;
        emit(EVENT.MINION_BUFFED, { who: "player", idx, attack: buff, health: buff });
      }
    } else if (kws.includes("freeze")) {
      // Freeze: freeze a random enemy minion (B9)
      if (s.enemyBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.enemyBoard.length);
        s.enemyBoard = [...s.enemyBoard];
        s.enemyBoard[idx] = { ...s.enemyBoard[idx], frozen: true };
        emit(EVENT.FREEZE_APPLIED, { who: "enemy", instanceId: s.enemyBoard[idx].instanceId });
      }
    } else if (kws.includes("returnToHand")) {
      // Return to hand: bounce a random enemy minion (B3)
      if (s.enemyBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.enemyBoard.length);
        const bounced = s.enemyBoard[idx];
        s.enemyBoard = s.enemyBoard.filter((_, i) => i !== idx);
        if (s.enemyHandCards.length < MAX_HAND_SIZE) {
          s.enemyHandCards.push(bounced.id);
        }
        emit(EVENT.RETURN_TO_HAND, { who: "enemy", cardId: bounced.id });
      }
    } else if (kws.includes("healAll")) {
      // Heal all friendly minions + hero (B3)
      const heal = card.effectPower || card.attack || 3;
      s.yourBoard = s.yourBoard.map(m => {
        const copy = { ...m };
        copy.hp = Math.min(copy.maxHp, copy.hp + heal);
        return copy;
      });
      s.yourHp = Math.min(30, s.yourHp + heal);
      emit(EVENT.HEAL_ALL_FRIENDLY, { amount: heal });
    } else if (kws.includes("universalAoe")) {
      // Universal AOE: damage ALL minions (B4)
      const dmg = card.effectPower || card.attack || 2;
      s.yourBoard = s.yourBoard.map(m => {
        const copy = { ...m };
        resolveDamage(copy, dmg, "aoe_spell");
        return copy;
      });
      s.enemyBoard = s.enemyBoard.map(m => {
        const copy = { ...m };
        resolveDamage(copy, dmg, "aoe_spell");
        return copy;
      });
      emit(EVENT.UNIVERSAL_AOE, { damage: dmg });
    } else if (kws.includes("handScaling")) {
      // Hand scaling: buff a friendly minion by hand size (B3)
      const bonus = s.handCards.length;
      if (s.yourBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.yourBoard.length);
        s.yourBoard = [...s.yourBoard];
        const m = { ...s.yourBoard[idx] };
        m.attack += bonus;
        m.hp += bonus;
        m.maxHp += bonus;
        s.yourBoard[idx] = m;
        emit(EVENT.HAND_SCALING, { idx, bonus });
      }
    } else {
      // Generic spell: deal damage to random enemy
      const dmg = card.effectPower || card.attack || 3;
      if (s.enemyBoard.length > 0) {
        const idx = Math.floor(Math.random() * s.enemyBoard.length);
        s.enemyBoard = [...s.enemyBoard];
        const target = { ...s.enemyBoard[idx] };
        resolveDamage(target, dmg, "spell");
        s.enemyBoard[idx] = target;
      } else {
        s.enemyHp -= dmg;
        emit(EVENT.HERO_DAMAGED, { who: "enemy", damage: dmg });
      }
    }

    s.graveyard.push(card.id);
    s = processDeaths(s);
    return s;
  }

  function resolveFramework(s, card) {
    emit(EVENT.CARD_PLAYED, { cardId: card.id, type: "framework" });
    emit(EVENT.FRAMEWORK_APPLIED, { cardId: card.id });

    // Framework: buff all friendly minions +1/+1 and stays as a persistent aura
    s.yourBoard = s.yourBoard.map(m => {
      const copy = { ...m };
      copy.attack += 1;
      copy.hp += 1;
      copy.maxHp += 1;
      return copy;
    });

    // Also summon it as a 0/durability minion if board has room
    if (s.yourBoard.length < MAX_BOARD_SIZE) {
      const fwMinion = blankMinionState(card.id, s.turn);
      fwMinion.attack = 0;
      fwMinion.hp = card.health || 3;
      fwMinion.maxHp = card.health || 3;
      s.yourBoard = [...s.yourBoard, fwMinion];
      emit(EVENT.MINION_SUMMONED, { who: "player", minion: fwMinion, card });
    }

    return s;
  }

  function processEndOfTurnEffects(s) {
    // Volatile minions: chance to damage adjacent
    s.yourBoard = [...s.yourBoard];
    for (let i = 0; i < s.yourBoard.length; i++) {
      const card = cardLookup(s.yourBoard[i].id);
      if ((card?.keywords || []).includes("volatile")) {
        if (Math.random() < 0.25) {
          // Damage self by 1
          s.yourBoard[i] = { ...s.yourBoard[i] };
          s.yourBoard[i].hp -= 1;
          emit(EVENT.VOLATILE_TRIGGERED, { who: "player", idx: i });
        }
      }
    }

    s.enemyBoard = [...s.enemyBoard];
    for (let i = 0; i < s.enemyBoard.length; i++) {
      const card = cardLookup(s.enemyBoard[i].id);
      if ((card?.keywords || []).includes("volatile")) {
        if (Math.random() < 0.25) {
          s.enemyBoard[i] = { ...s.enemyBoard[i] };
          s.enemyBoard[i].hp -= 1;
          emit(EVENT.VOLATILE_TRIGGERED, { who: "enemy", idx: i });
        }
      }
    }

    // Windfury reset
    s.yourBoard = s.yourBoard.map(m => {
      const card = cardLookup(m.id);
      if ((card?.keywords || []).includes("windfury") && m.attackedThisTurn) {
        // Already handled during attack — windfury allows 2 attacks
      }
      return m;
    });

    s = processDeaths(s);

    // Tick auras & drain queued effects at end of turn (A1, A5)
    tickAuras(s);
    drainEffectQueue(s);

    return s;
  }

  function executeEnemyTurn(s, enemyAI) {
    if (!enemyAI) return defaultEnemyTurn(s);
    return enemyAI(s, { cardLookup, heroLookup, emit, summonMinion, drawCard });
  }

  function defaultEnemyTurn(s) {
    // Simple enemy AI: draw, maybe play cards, attack with minions
    drawCard(s, "enemy");

    // Enemy mana for this "turn"
    const enemyMana = Math.min(MAX_MANA, s.turn);
    let manaLeft = enemyMana;

    // Play cards from hand
    const enemyHand = [...s.enemyHandCards];
    const toPlay = [];
    for (let i = 0; i < enemyHand.length; i++) {
      const card = cardLookup(enemyHand[i]);
      if (!card) continue;
      if (card.cost <= manaLeft && s.enemyBoard.length < MAX_BOARD_SIZE) {
        toPlay.push(i);
        manaLeft -= card.cost;
      }
    }

    // Play in reverse index order so splicing works
    toPlay.sort((a, b) => b - a);
    for (const idx of toPlay) {
      const cardId = s.enemyHandCards[idx];
      const card = cardLookup(cardId);
      if (!card) continue;
      s.enemyHandCards = [...s.enemyHandCards];
      s.enemyHandCards.splice(idx, 1);

      if (card.type === CARD_TYPES.SPELL || card.type === CARD_TYPES.FRAMEWORK) {
        // Enemy spells damage player
        const dmg = card.effectPower || card.attack || 2;
        s.yourHp -= dmg;
        emit(EVENT.HERO_DAMAGED, { who: "player", damage: dmg });
        s.enemyGraveyard.push(card.id);
      } else {
        s = summonMinion(s, card, "enemy");
      }
    }

    // Enemy hero power (35% chance)
    const enemyHero = heroLookup(s.enemyHeroId);
    if (enemyHero && !s.enemyPowerUsedThisTurn && manaLeft >= HERO_POWER_COST && Math.random() < 0.35) {
      const action = getHeroPowerAction(enemyHero, s);
      if (action) {
        switch (action.type) {
          case "HERO_POWER_DAMAGE":
            s.yourHp -= action.damage;
            emit(EVENT.HERO_DAMAGED, { who: "player", damage: action.damage });
            break;
          case "HERO_POWER_HEAL":
            s.enemyHp = Math.min(s.enemyMaxHp, s.enemyHp + action.amount);
            break;
          case "HERO_POWER_ARMOR":
            s.enemyArmor += action.amount;
            break;
          case "HERO_POWER_SUMMON":
            if (s.enemyBoard.length < MAX_BOARD_SIZE) {
              const token = blankMinionState("enemy_token", s.turn);
              token.attack = action.attack;
              token.hp = action.health;
              token.maxHp = action.health;
              s.enemyBoard = [...s.enemyBoard, token];
            }
            break;
          case "HERO_POWER_DRAW":
            drawCard(s, "enemy");
            break;
          case "HERO_POWER_BUFF":
            if (s.enemyBoard.length > 0) {
              s.enemyBoard = [...s.enemyBoard];
              const idx = Math.floor(Math.random() * s.enemyBoard.length);
              const m = { ...s.enemyBoard[idx] };
              m.attack += action.attack;
              m.hp += action.health;
              m.maxHp += action.health;
              s.enemyBoard[idx] = m;
            }
            break;
        }
        s.enemyPowerUsedThisTurn = true;
        emit(EVENT.HERO_POWER_USED, { who: "enemy", hero: enemyHero, action });
      }
    }

    // All enemy minions attack
    for (let i = 0; i < s.enemyBoard.length; i++) {
      const minion = s.enemyBoard[i];
      if (minion.attack <= 0) continue;
      if (minion.summonedTurn === s.turn) {
        const card = cardLookup(minion.id);
        if (!(card?.keywords || []).includes("charge")) continue;
      }

      // Smart targeting: attack taunt first, then lowest-hp minion, then hero
      if (hasTaunt(s.yourBoard)) {
        const tauntIdx = s.yourBoard.findIndex(m => {
          const c = cardLookup(m.id);
          return (c?.keywords || []).includes("taunt");
        });
        if (tauntIdx >= 0) {
          s.yourBoard = [...s.yourBoard];
          const defender = { ...s.yourBoard[tauntIdx] };
          const attacker = { ...s.enemyBoard[i] };
          resolveDamage(defender, attacker.attack, "enemy_attack_def");
          resolveDamage(attacker, defender.attack, "enemy_attack_atk");
          s.yourBoard[tauntIdx] = defender;
          s.enemyBoard = [...s.enemyBoard];
          s.enemyBoard[i] = attacker;
          s = processDeaths(s);
          continue;
        }
      }

      // 60% chance to attack a minion, 40% to go face
      if (s.yourBoard.length > 0 && Math.random() < 0.6) {
        // Attack weakest minion
        let targetIdx = 0;
        let lowestHp = Infinity;
        for (let j = 0; j < s.yourBoard.length; j++) {
          if (s.yourBoard[j].hp < lowestHp) {
            lowestHp = s.yourBoard[j].hp;
            targetIdx = j;
          }
        }
        s.yourBoard = [...s.yourBoard];
        const defender = { ...s.yourBoard[targetIdx] };
        const attacker = { ...s.enemyBoard[i] };
        resolveDamage(defender, attacker.attack, "enemy_attack_def");
        resolveDamage(attacker, defender.attack, "enemy_attack_atk");
        s.yourBoard[targetIdx] = defender;
        s.enemyBoard = [...s.enemyBoard];
        s.enemyBoard[i] = attacker;
        s = processDeaths(s);
      } else {
        // Go face
        const dmg = minion.attack;
        if (s.yourArmor > 0) {
          const armorAbsorb = Math.min(s.yourArmor, dmg);
          s.yourArmor -= armorAbsorb;
          s.yourHp -= Math.max(0, dmg - armorAbsorb);
        } else {
          s.yourHp -= dmg;
        }
        emit(EVENT.HERO_DAMAGED, { who: "player", damage: dmg });
      }
    }

    s = checkGameOver(s);
    return s;
  }

  function checkGameOver(s) {
    if (s.phase === "ended") return s;

    if (s.enemyHp <= 0 && s.yourHp <= 0) {
      s.phase = "ended";
      s.matchResult = "draw";
      emit(EVENT.GAME_OVER, { result: "draw" });
    } else if (s.enemyHp <= 0) {
      s.phase = "ended";
      s.matchResult = "win";
      emit(EVENT.GAME_OVER, { result: "win" });
    } else if (s.yourHp <= 0) {
      s.phase = "ended";
      s.matchResult = "loss";
      emit(EVENT.GAME_OVER, { result: "loss" });
    }

    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     Weapon Resolution
     ═══════════════════════════════════════════════════════════════ */

  function resolveWeapon(s, card) {
    emit(EVENT.CARD_PLAYED, { cardId: card.id, type: "weapon" });

    // If player already has a weapon, destroy the old one
    if (s.playerWeapon) {
      emit(EVENT.WEAPON_DESTROYED, { cardId: s.playerWeapon.cardId });
    }

    s.playerWeapon = {
      cardId: card.id,
      attack: card.attack || 2,
      durability: card.health || card.durability || 2,
      maxDurability: card.health || card.durability || 2,
    };

    emit(EVENT.WEAPON_EQUIPPED, { weapon: { ...s.playerWeapon } });
    return s;
  }

  function loseWeaponDurability(s) {
    if (!s.playerWeapon) return s;
    s.playerWeapon = { ...s.playerWeapon };
    s.playerWeapon.durability -= 1;
    emit(EVENT.WEAPON_DURABILITY_LOST, { remaining: s.playerWeapon.durability });
    if (s.playerWeapon.durability <= 0) {
      emit(EVENT.WEAPON_DESTROYED, { cardId: s.playerWeapon.cardId });
      s.playerWeapon = null;
    }
    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     Discover — offer 3 random cards, player picks 1
     ═══════════════════════════════════════════════════════════════ */

  function offerDiscover(state, poolFilter) {
    const s = { ...state };
    // Build a pool of 3 random distinct cards
    const allIds = Object.keys(typeof cardLookup === "function" ? {} : cardLookup);
    // If cardLookup is a function, we can't enumerate — use deck + graveyard as source
    let candidates = [...(s.deckCards || []), ...(s.graveyard || [])];
    if (poolFilter) candidates = candidates.filter(poolFilter);

    // Shuffle and pick 3 unique
    const shuffled = [...new Set(candidates)].sort(() => Math.random() - 0.5);
    const offered = shuffled.slice(0, 3);
    s.discoverOffered = offered;
    s.phase = "discover";
    emit(EVENT.DISCOVER_OFFERED, { cards: offered });
    return s;
  }

  function pickDiscover(state, chosenIdx) {
    const s = { ...state };
    if (!s.discoverOffered || chosenIdx < 0 || chosenIdx >= s.discoverOffered.length) return s;
    const chosenId = s.discoverOffered[chosenIdx];

    // Add chosen card to hand (if room)
    if (s.handCards.length < MAX_HAND_SIZE) {
      s.handCards = [...s.handCards, chosenId];
    }
    emit(EVENT.DISCOVER_CHOSEN, { cardId: chosenId });

    s.discoverOffered = null;
    s.phase = "playing";
    return s;
  }

  /* ═══════════════════════════════════════════════════════════════
     Stepped enemy turn — individual actions for animated playback
     ═══════════════════════════════════════════════════════════════ */

  /** Run only end-of-turn effects (volatile, auras) and flip turn owner. */
  function endPlayerTurn(state) {
    const s = processEndOfTurnEffects({ ...state });
    s.activePlayer = "enemy";
    return s;
  }

  /** Enemy draws a card. */
  function enemyDrawCard(state) {
    const s = { ...state, enemyDeckCards: [...state.enemyDeckCards], enemyHandCards: [...state.enemyHandCards] };
    drawCard(s, "enemy");
    return s;
  }

  /** Enemy plays a card from hand at handIdx. */
  function enemyPlayCardAtIdx(state, handIdx) {
    let s = { ...state };
    if (handIdx < 0 || handIdx >= s.enemyHandCards.length) return s;
    const cardId = s.enemyHandCards[handIdx];
    const card = cardLookup(cardId);
    if (!card) return s;

    s.enemyHandCards = [...s.enemyHandCards];
    s.enemyHandCards.splice(handIdx, 1);

    if (card.type === CARD_TYPES.SPELL || card.type === CARD_TYPES.FRAMEWORK) {
      const dmg = card.effectPower || card.attack || 2;
      s.yourHp -= dmg;
      emit(EVENT.HERO_DAMAGED, { who: "player", damage: dmg });
      s.enemyGraveyard = [...(s.enemyGraveyard || []), card.id];
    } else {
      s = summonMinion(s, card, "enemy");
    }
    return s;
  }

  /** Enemy minion at atkIdx attacks player minion at defIdx. */
  function enemyMinionAttack(state, atkIdx, defIdx) {
    let s = { ...state };
    if (atkIdx >= s.enemyBoard.length || defIdx >= s.yourBoard.length) return s;
    s.yourBoard = [...s.yourBoard];
    s.enemyBoard = [...s.enemyBoard];
    const defender = { ...s.yourBoard[defIdx] };
    const attacker = { ...s.enemyBoard[atkIdx] };
    resolveDamage(defender, attacker.attack, "enemy_attack_def");
    resolveDamage(attacker, defender.attack, "enemy_attack_atk");
    s.yourBoard[defIdx] = defender;
    s.enemyBoard[atkIdx] = attacker;
    return processDeaths(s);
  }

  /** Enemy minion at atkIdx goes face (attacks player hero). */
  function enemyAttackPlayerHero(state, atkIdx) {
    const s = { ...state };
    if (atkIdx >= s.enemyBoard.length) return s;
    const minion = s.enemyBoard[atkIdx];
    const dmg = minion.attack;
    if (s.yourArmor > 0) {
      const armorAbsorb = Math.min(s.yourArmor, dmg);
      s.yourArmor -= armorAbsorb;
      s.yourHp -= Math.max(0, dmg - armorAbsorb);
    } else {
      s.yourHp -= dmg;
    }
    emit(EVENT.HERO_DAMAGED, { who: "player", damage: dmg });
    return s;
  }

  /** Enemy uses hero power. */
  function enemyUseHeroPower(state) {
    let s = { ...state };
    const enemyHero = heroLookup(s.enemyHeroId);
    if (!enemyHero || s.enemyPowerUsedThisTurn) return s;
    const action = getHeroPowerAction(enemyHero, s);
    if (!action) return s;
    switch (action.type) {
      case "HERO_POWER_DAMAGE":  s.yourHp -= action.damage; emit(EVENT.HERO_DAMAGED, { who: "player", damage: action.damage }); break;
      case "HERO_POWER_HEAL":    s.enemyHp = Math.min(s.enemyMaxHp || 30, s.enemyHp + action.amount); break;
      case "HERO_POWER_ARMOR":   s.enemyArmor = (s.enemyArmor || 0) + action.amount; break;
      case "HERO_POWER_SUMMON":
        if (s.enemyBoard.length < MAX_BOARD_SIZE) {
          const token = blankMinionState("enemy_token", s.turn);
          token.attack = action.attack; token.hp = action.health; token.maxHp = action.health;
          s.enemyBoard = [...s.enemyBoard, token];
        }
        break;
      case "HERO_POWER_DRAW":    s = enemyDrawCard(s); break;
      case "HERO_POWER_BUFF":
        if (s.enemyBoard.length > 0) {
          s.enemyBoard = [...s.enemyBoard];
          const idx = Math.floor(Math.random() * s.enemyBoard.length);
          const m = { ...s.enemyBoard[idx] };
          m.attack += action.attack; m.hp += action.health; m.maxHp += action.health;
          s.enemyBoard[idx] = m;
        }
        break;
    }
    s.enemyPowerUsedThisTurn = true;
    emit(EVENT.HERO_POWER_USED, { who: "enemy", hero: enemyHero, action });
    return s;
  }

  /** Start the player's next turn (mana, draw, reset). */
  function beginPlayerTurn(state) {
    let s = startTurn({ ...state });
    s.activePlayer = "player";
    return checkGameOver(s);
  }

  /** Check if enemy minion can attack this turn. */
  function canEnemyMinionAttack(minion, state) {
    if (!minion || minion.attack <= 0) return false;
    if (minion.frozen || minion.dormant) return false;
    if (minion.summonedTurn === state.turn) {
      const card = cardLookup(minion.id);
      if (!(card?.keywords || []).includes("charge")) return false;
    }
    return true;
  }

  /* ═══════════════════════════════════════════════════════════════
     Public API
     ═══════════════════════════════════════════════════════════════ */

  return {
    startMatch,
    completeMulligan,
    skipMulligan,
    playCard,
    attackMinion,
    attackHero,
    useHeroPower,
    endTurn,
    concede,
    drawCard: (s) => { drawCard(s, "player"); return s; },
    canMinionAttack,
    hasTaunt,
    drainEvents,
    checkGameOver,
    offerDiscover,
    pickDiscover,
    loseWeaponDurability,
    /* Stepped enemy turn API */
    endPlayerTurn,
    enemyDrawCard,
    enemyPlayCardAtIdx,
    enemyMinionAttack,
    enemyAttackPlayerHero,
    enemyUseHeroPower,
    beginPlayerTurn,
    canEnemyMinionAttack,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Utility — array shuffle (Fisher-Yates)
   ═══════════════════════════════════════════════════════════════════════════ */

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
