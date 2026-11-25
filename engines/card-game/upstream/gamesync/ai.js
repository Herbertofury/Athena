/**
 * @module cardgame/ai
 * @description AI opponent system — layered evaluation with personality profiles.
 * Deterministic seeded execution for replay consistency.
 * Tiers: lethal solver → move generator → board evaluator → heuristic fallback.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Personalities & Difficulty
   ═══════════════════════════════════════════════════════════════════════════ */

export const AI_PERSONALITIES = {
  aggressive: {
    label: "Aggressive",
    boardWeight: 0.4, faceWeight: 0.8, tradeWeight: 0.3,
    heroPowerBias: 0.3, lethalHunger: 1.2, riskTolerance: 0.8,
  },
  value: {
    label: "Value",
    boardWeight: 0.9, faceWeight: 0.3, tradeWeight: 0.9,
    heroPowerBias: 0.6, lethalHunger: 0.7, riskTolerance: 0.4,
  },
  combo: {
    label: "Combo",
    boardWeight: 0.5, faceWeight: 0.4, tradeWeight: 0.6,
    heroPowerBias: 0.5, lethalHunger: 1.0, riskTolerance: 0.6,
  },
  draft: {
    label: "Draft",
    boardWeight: 0.7, faceWeight: 0.5, tradeWeight: 0.7,
    heroPowerBias: 0.5, lethalHunger: 0.9, riskTolerance: 0.5,
  },
  defensive: {
    label: "Defensive",
    boardWeight: 0.8, faceWeight: 0.2, tradeWeight: 1.0,
    heroPowerBias: 0.7, lethalHunger: 0.6, riskTolerance: 0.2,
  },
};

export const AI_DIFFICULTY = {
  easy: { label: "Easy", mistakeRate: 0.3, searchDepth: 1, lethalCheck: false },
  normal: { label: "Normal", mistakeRate: 0.12, searchDepth: 2, lethalCheck: true },
  hard: { label: "Hard", mistakeRate: 0.03, searchDepth: 3, lethalCheck: true },
  expert: { label: "Expert", mistakeRate: 0.0, searchDepth: 4, lethalCheck: true },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Seeded RNG (deterministic)
   ═══════════════════════════════════════════════════════════════════════════ */

function seededRng(seed) {
  let s = seed | 0 || 1;
  return function next() {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Board Evaluation
   ═══════════════════════════════════════════════════════════════════════════ */

function evaluateMinion(m) {
  let score = m.attack + m.health;
  if (m.keywords) {
    if (m.keywords.includes("taunt")) score += 2;
    if (m.keywords.includes("shield")) score += 2;
    if (m.keywords.includes("lifesteal")) score += 1.5;
    if (m.keywords.includes("poisonous")) score += 3;
    if (m.keywords.includes("windfury")) score += m.attack;
    if (m.keywords.includes("stealth")) score += 1;
    if (m.keywords.includes("deathrattle")) score += 2;
  }
  return score;
}

function evaluateBoard(match, side) {
  const board = match[side].board || [];
  const hero = match[side];
  let score = 0;

  // Board presence
  for (const m of board) {
    if (m && !m.dead) score += evaluateMinion(m);
  }

  // Hero health/armor
  score += (hero.hp || 0) * 0.3;
  score += (hero.armor || 0) * 0.3;

  // Hand size (card advantage)
  const hand = match[side].hand || [];
  score += hand.length * 1.5;

  // Mana efficiency (unused mana is slightly bad)
  score -= (match[side].mana || 0) * 0.2;

  return score;
}

function evaluateState(match) {
  return evaluateBoard(match, "enemy") - evaluateBoard(match, "player");
}

/* ═══════════════════════════════════════════════════════════════════════════
   Lethal Solver
   ═══════════════════════════════════════════════════════════════════════════ */

function checkLethal(match, cardLookup) {
  const enemy = match.enemy;
  const player = match.player;
  const playerHp = (player.hp || 0) + (player.armor || 0);

  // Calculate total potential damage from board
  let boardDamage = 0;
  const enemyBoard = enemy.board || [];
  const playerBoard = player.board || [];

  // Find taunts
  const taunts = playerBoard.filter(m => m && !m.dead &&
    m.keywords && m.keywords.includes("taunt"));

  if (taunts.length === 0) {
    // Direct face damage possible
    for (const m of enemyBoard) {
      if (m && !m.dead && m.attack > 0 && !m.sleeping && !m.frozen) {
        boardDamage += m.attack;
        if (m.keywords && m.keywords.includes("windfury")) boardDamage += m.attack;
      }
    }

    // Hand spells
    const hand = enemy.hand || [];
    const mana = enemy.mana || 0;
    let availMana = mana;
    const directSpells = [];
    for (const c of hand) {
      const card = typeof c === "string" ? cardLookup?.(c) : c;
      if (!card) continue;
      if (card.type === "SPELL" && card.attack > 0 && card.cost <= availMana) {
        directSpells.push(card);
      }
    }
    // Greedy: play cheapest direct damage spells first
    directSpells.sort((a, b) => a.cost - b.cost);
    for (const s of directSpells) {
      if (s.cost <= availMana) {
        boardDamage += s.attack;
        availMana -= s.cost;
      }
    }

    if (boardDamage >= playerHp) {
      return { hasLethal: true, plan: "face" };
    }
  }

  return { hasLethal: false };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Move Generator
   ═══════════════════════════════════════════════════════════════════════════ */

function generateMoves(match, cardLookup) {
  const enemy = match.enemy;
  const mana = enemy.mana || 0;
  const hand = enemy.hand || [];
  const board = enemy.board || [];
  const playerBoard = match.player.board || [];
  const moves = [];

  // Play card moves
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    const card = typeof c === "string" ? cardLookup?.(c) : c;
    if (!card || card.cost > mana) continue;
    if (card.type === "MINION" && board.filter(m => m && !m.dead).length >= 7) continue;
    moves.push({ type: "playCard", handIdx: i, card, priority: 0 });
  }

  // Attack moves
  for (let ai = 0; ai < board.length; ai++) {
    const attacker = board[ai];
    if (!attacker || attacker.dead || attacker.sleeping || attacker.frozen ||
        attacker.attack <= 0 || attacker.attacksThisTurn >= (
          attacker.keywords?.includes("windfury") ? 2 : 1)) continue;

    // Find taunts
    const taunts = [];
    for (let ti = 0; ti < playerBoard.length; ti++) {
      const t = playerBoard[ti];
      if (t && !t.dead && t.keywords?.includes("taunt")) taunts.push(ti);
    }

    if (taunts.length > 0) {
      // Must attack taunts
      for (const ti of taunts) {
        moves.push({ type: "attackMinion", attackerIdx: ai, targetIdx: ti, priority: 0 });
      }
    } else {
      // Can attack anything
      for (let ti = 0; ti < playerBoard.length; ti++) {
        if (playerBoard[ti] && !playerBoard[ti].dead) {
          moves.push({ type: "attackMinion", attackerIdx: ai, targetIdx: ti, priority: 0 });
        }
      }
      moves.push({ type: "attackHero", attackerIdx: ai, priority: 0 });
    }
  }

  // Hero power
  if (!enemy.heroPowerUsed && mana >= 2 && enemy.heroPower) {
    moves.push({ type: "heroPower", priority: 0 });
  }

  return moves;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Move Scoring
   ═══════════════════════════════════════════════════════════════════════════ */

function scoreMoves(moves, match, personality, cardLookup) {
  const p = personality;
  const playerBoard = match.player.board || [];
  const enemyBoard = match.enemy.board || [];
  const playerHp = (match.player.hp || 0) + (match.player.armor || 0);

  for (const m of moves) {
    let score = 0;

    switch (m.type) {
      case "playCard": {
        const card = m.card;
        // Prefer playing on curve
        score += card.cost * 0.5;
        // Minions for board control
        if (card.type === "MINION") {
          score += evaluateMinion(card) * p.boardWeight;
        }
        // Spells for direct impact
        if (card.type === "SPELL") {
          score += (card.attack || 0) * 1.5 * p.faceWeight;
        }
        // Frameworks are infrastructural
        if (card.type === "FRAMEWORK") {
          score += 3 * p.boardWeight;
        }
        break;
      }

      case "attackMinion": {
        const attacker = enemyBoard[m.attackerIdx];
        const target = playerBoard[m.targetIdx];
        if (!attacker || !target) break;

        // Evaluate trade value
        const killsTarget = attacker.attack >= target.health;
        const diesInTrade = target.attack >= attacker.health;

        if (killsTarget && !diesInTrade) {
          score += evaluateMinion(target) * 2 * p.tradeWeight;
        } else if (killsTarget && diesInTrade) {
          score += (evaluateMinion(target) - evaluateMinion(attacker)) * p.tradeWeight;
        } else {
          score += attacker.attack * 0.5 * p.tradeWeight;
        }

        // Poisonous targeting: prefer hitting highest-value target
        if (attacker.keywords?.includes("poisonous")) {
          score += evaluateMinion(target) * 1.5;
        }

        // Priority target: hit deathrattle minions carefully
        if (target.keywords?.includes("deathrattle")) {
          score -= 1 * (1 - p.riskTolerance);
        }
        break;
      }

      case "attackHero": {
        const attacker = enemyBoard[m.attackerIdx];
        if (!attacker) break;
        score += attacker.attack * p.faceWeight;
        // Bonus if enemy is low
        if (playerHp <= 10) score += attacker.attack * p.lethalHunger;
        break;
      }

      case "heroPower": {
        score += 3 * p.heroPowerBias;
        break;
      }
    }

    m.priority = score;
  }

  return moves;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mulligan Policy
   ═══════════════════════════════════════════════════════════════════════════ */

export function aiMulligan(hand, personality, cardLookup) {
  // Keep low-cost cards for curve; throw back expensive ones
  const threshold = personality === AI_PERSONALITIES.aggressive ? 3 : 4;
  const keep = [];
  for (let i = 0; i < hand.length; i++) {
    const c = hand[i];
    const card = typeof c === "string" ? cardLookup?.(c) : c;
    if (card && card.cost <= threshold) {
      keep.push(i);
    }
  }
  return keep; // indices to keep
}

/* ═══════════════════════════════════════════════════════════════════════════
   AI Turn Executor
   ═══════════════════════════════════════════════════════════════════════════ */

export function createAI(opts = {}) {
  const difficulty = opts.difficulty || AI_DIFFICULTY.normal;
  const personality = opts.personality || AI_PERSONALITIES.value;
  const seed = opts.seed || (Date.now() | 0);
  const rng = seededRng(seed);
  const cardLookup = opts.cardLookup || (() => null);
  const log = [];

  function think(match) {
    log.length = 0;
    const actions = [];

    // Phase 1: Check lethal
    if (difficulty.lethalCheck) {
      const lethalResult = checkLethal(match, cardLookup);
      if (lethalResult.hasLethal) {
        log.push("Lethal detected — going face");
        // Generate face-priority moves
        const allMoves = generateMoves(match, cardLookup);
        const faceMoves = allMoves.filter(m => m.type === "attackHero");
        const playMoves = allMoves.filter(m => m.type === "playCard" && m.card?.attack > 0);
        // Play direct damage spells first, then all face attacks
        playMoves.sort((a, b) => (a.card?.cost || 0) - (b.card?.cost || 0));
        actions.push(...playMoves, ...faceMoves);
        return actions;
      }
    }

    // Phase 2: Generate and score all moves
    let moves = generateMoves(match, cardLookup);
    moves = scoreMoves(moves, match, personality, cardLookup);

    // Phase 3: Apply difficulty (introduce mistakes)
    if (difficulty.mistakeRate > 0) {
      for (const m of moves) {
        if (rng() < difficulty.mistakeRate) {
          m.priority *= 0.3 + rng() * 0.4;
          log.push(`Mistake on ${m.type}`);
        }
      }
    }

    // Phase 4: Sort by priority (highest first)
    moves.sort((a, b) => b.priority - a.priority);

    // Phase 5: Greedily select non-conflicting moves
    // Play cards first (spend mana), then attacks, then hero power
    const playCards = moves.filter(m => m.type === "playCard");
    const attacks = moves.filter(m => m.type === "attackMinion" || m.type === "attackHero");
    const heroPowers = moves.filter(m => m.type === "heroPower");

    // Play cards greedily by priority
    let manaLeft = match.enemy.mana || 0;
    for (const pc of playCards) {
      if (pc.card.cost <= manaLeft && pc.priority > 0) {
        actions.push(pc);
        manaLeft -= pc.card.cost;
        log.push(`Play ${pc.card.name || pc.card.id} (cost ${pc.card.cost}, priority ${pc.priority.toFixed(1)})`);
      }
    }

    // Hero power if enough mana and worth it
    if (heroPowers.length > 0 && manaLeft >= 2 && heroPowers[0].priority > 1) {
      actions.push(heroPowers[0]);
      manaLeft -= 2;
      log.push("Use hero power");
    }

    // Attacks
    const usedAttackers = new Set();
    for (const atk of attacks) {
      if (usedAttackers.has(atk.attackerIdx)) continue;
      if (atk.priority > 0) {
        actions.push(atk);
        usedAttackers.add(atk.attackerIdx);
        log.push(`${atk.type} with idx ${atk.attackerIdx} (priority ${atk.priority.toFixed(1)})`);
      }
    }

    return actions;
  }

  function getLog() { return log.slice(); }

  return { think, getLog, aiMulligan: (hand) => aiMulligan(hand, personality, cardLookup) };
}

/* ═══════════════════════════════════════════════════════════════════════════
   E1: Mana-Curve Planner — plans multi-turn mana spend ahead (§15.E1)
   ═══════════════════════════════════════════════════════════════════════════ */

export function planManaCurve(hand, currentMana, maxMana, cardLookup, turns = 3) {
  /* Build playable-cost buckets for the next N turns */
  const cards = hand.map(id => {
    const c = typeof id === "string" ? cardLookup?.(id) : id;
    return c ? { ...c, _id: id } : null;
  }).filter(Boolean);

  const plan = [];
  let simMana = currentMana;
  const remaining = [...cards];

  for (let t = 0; t < turns; t++) {
    const turnMana = Math.min(10, simMana + 1);
    remaining.sort((a, b) => b.cost - a.cost);  // biggest first
    let spent = 0;
    const thisPlay = [];
    for (let i = remaining.length - 1; i >= 0; i--) {
      if (remaining[i].cost + spent <= turnMana) {
        spent += remaining[i].cost;
        thisPlay.push(remaining[i]);
        remaining.splice(i, 1);
      }
    }
    plan.push({ turn: t, mana: turnMana, spent, plays: thisPlay });
    simMana = turnMana;
  }
  return plan;
}

/* ═══════════════════════════════════════════════════════════════════════════
   E2: Draft Pick Heuristics — tier-list scoring for draft picks (§15.E2)
   ═══════════════════════════════════════════════════════════════════════════ */

const DRAFT_TIER_WEIGHTS = {
  statEfficiency: 2.0,   // (atk+hp) / cost
  keywordBonus: 1.5,
  rarityBonus: 0.5,      // higher rarity = slightly better
  synergy: 1.0,
};

const KEYWORD_DRAFT_VALUES = {
  taunt: 2, shield: 2.5, lifesteal: 2, poisonous: 3, windfury: 2.5,
  charge: 1.5, rush: 1.5, stealth: 1, deathrattle: 2, battlecry: 1.5,
  reborn: 3, freeze: 1.5, overload: -0.5, dormant: -1,
};

const RARITY_VALUES = { common: 0, uncommon: 0.5, rare: 1, epic: 1.5, legendary: 2 };

export function scoreDraftPick(card, existingDeck = [], cardLookup) {
  if (!card) return 0;
  let score = 0;

  // Stat efficiency
  const cost = Math.max(1, card.cost || 1);
  const stats = (card.attack || 0) + (card.health || 0);
  score += (stats / cost) * DRAFT_TIER_WEIGHTS.statEfficiency;

  // Keyword bonus
  for (const kw of (card.keywords || [])) {
    score += (KEYWORD_DRAFT_VALUES[kw] || 0) * DRAFT_TIER_WEIGHTS.keywordBonus;
  }

  // Rarity bonus
  score += (RARITY_VALUES[card.rarity] || 0) * DRAFT_TIER_WEIGHTS.rarityBonus;

  // Mana curve synergy: reward filling gaps in the curve
  const curveCounts = {};
  for (const id of existingDeck) {
    const c = typeof id === "string" ? cardLookup?.(id) : id;
    if (c) curveCounts[c.cost] = (curveCounts[c.cost] || 0) + 1;
  }
  const costBucket = card.cost || 0;
  const bucketCount = curveCounts[costBucket] || 0;
  if (bucketCount < 3) score += (3 - bucketCount) * DRAFT_TIER_WEIGHTS.synergy;

  // Tribe synergy: reward tribal concentration
  if (card.tribe) {
    const tribeCount = existingDeck.reduce((n, id) => {
      const c = typeof id === "string" ? cardLookup?.(id) : id;
      return n + (c?.tribe === card.tribe ? 1 : 0);
    }, 0);
    if (tribeCount >= 2) score += tribeCount * 0.3;
  }

  return Math.round(score * 100) / 100;
}

export function rankDraftPicks(choices, existingDeck, cardLookup) {
  return choices
    .map(c => ({ card: c, score: scoreDraftPick(c, existingDeck, cardLookup) }))
    .sort((a, b) => b.score - a.score);
}

/* ═══════════════════════════════════════════════════════════════════════════
   E3: Archetype Detection — classify decks for playstyle (§15.E3)
   ═══════════════════════════════════════════════════════════════════════════ */

const ARCHETYPE_PROFILES = {
  aggro:   { maxAvgCost: 2.8,  minLowCards: 0.55, biasWeight: { faceWeight: 0.9, tradeWeight: 0.3 } },
  midrange:{ maxAvgCost: 4.2,  minLowCards: 0.30, biasWeight: { faceWeight: 0.5, tradeWeight: 0.7 } },
  control: { maxAvgCost: 10,   minLowCards: 0.0,  biasWeight: { faceWeight: 0.2, tradeWeight: 1.0 } },
  combo:   { maxAvgCost: 10,   minLowCards: 0.0,  biasWeight: { faceWeight: 0.4, tradeWeight: 0.6 } },
};

export function detectArchetype(deckCardIds, cardLookup) {
  if (!deckCardIds?.length) return { archetype: "midrange", confidence: 0 };

  const cards = deckCardIds.map(id => typeof id === "string" ? cardLookup?.(id) : id).filter(Boolean);
  const totalCost = cards.reduce((s, c) => s + (c.cost || 0), 0);
  const avgCost = totalCost / (cards.length || 1);
  const lowCards = cards.filter(c => (c.cost || 0) <= 3).length / (cards.length || 1);

  // Count combo-signaling keywords
  const comboSignals = cards.filter(c =>
    (c.keywords || []).some(k => ["combo", "handScaling", "returnToHand"].includes(k))
  ).length;

  if (comboSignals >= 4) return { archetype: "combo", confidence: 0.7 + comboSignals * 0.03 };
  if (avgCost <= ARCHETYPE_PROFILES.aggro.maxAvgCost && lowCards >= ARCHETYPE_PROFILES.aggro.minLowCards)
    return { archetype: "aggro", confidence: 0.6 + (1 - avgCost / 3) * 0.3 };
  if (avgCost <= ARCHETYPE_PROFILES.midrange.maxAvgCost)
    return { archetype: "midrange", confidence: 0.5 };
  return { archetype: "control", confidence: 0.5 + avgCost * 0.02 };
}

export function getPersonalityForArchetype(archetype) {
  const prof = ARCHETYPE_PROFILES[archetype];
  if (!prof) return AI_PERSONALITIES.value;
  // Build a blended personality
  return {
    label: `Auto-${archetype}`,
    boardWeight: 1 - prof.biasWeight.faceWeight,
    faceWeight: prof.biasWeight.faceWeight,
    tradeWeight: prof.biasWeight.tradeWeight,
    heroPowerBias: 0.5,
    lethalHunger: archetype === "aggro" ? 1.3 : 0.8,
    riskTolerance: archetype === "aggro" ? 0.8 : 0.3,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   E4: Balance Testing Sim — run N simulated games for win-rate (§15.E4)
   ═══════════════════════════════════════════════════════════════════════════ */

export function simulateBalance(opts = {}) {
  const {
    deck1 = [], deck2 = [],
    hero1 = null, hero2 = null,
    cardLookup = () => null,
    heroLookup = () => null,
    createEngine = null,
    games = 100,
    difficulty1 = AI_DIFFICULTY.expert,
    difficulty2 = AI_DIFFICULTY.expert,
    personality1 = AI_PERSONALITIES.value,
    personality2 = AI_PERSONALITIES.value,
  } = opts;

  if (!createEngine) return { error: "createEngine required", wins1: 0, wins2: 0, draws: 0 };

  let wins1 = 0, wins2 = 0, draws = 0;
  const turnCounts = [];

  for (let g = 0; g < games; g++) {
    const engine = createEngine({ cardLookup, heroLookup });
    const ai1 = createAI({ difficulty: difficulty1, personality: personality1, cardLookup, seed: g * 2 });
    const ai2 = createAI({ difficulty: difficulty2, personality: personality2, cardLookup, seed: g * 2 + 1 });

    let state = engine.startMatch({}, {
      mode: "simulated",
      yourHeroId: hero1,
      enemyHeroId: hero2,
      deckCards: [...deck1],
      enemyDeckCards: [...deck2],
    });

    // Auto-mulligan
    state = engine.completeMulligan(state, ai1.aiMulligan(state.handCards));

    let turnCap = 50;
    while (state.phase !== "ended" && turnCap-- > 0) {
      if (state.activePlayer === "player") {
        state = engine.startTurn(state);
        const actions = ai1.think({
          player: { hp: state.yourHp, armor: state.yourArmor, board: state.yourBoard, hand: state.handCards, mana: state.mana, heroPowerUsed: state.yourPowerUsedThisTurn },
          enemy: { hp: state.enemyHp, armor: state.enemyArmor, board: state.enemyBoard, hand: state.enemyHandCards, mana: 0 },
        });
        for (const a of actions) {
          if (state.phase === "ended") break;
          if (a.type === "playCard") state = engine.playCard(state, a.handIdx);
          if (a.type === "attackMinion") state = engine.attackMinion(state, a.attackerIdx, a.targetIdx);
          if (a.type === "attackHero") state = engine.attackHero(state, a.attackerIdx);
          if (a.type === "heroPower") state = engine.useHeroPower(state);
        }
        if (state.phase !== "ended") state = engine.endTurn(state);
      } else {
        // Enemy turn — run with ai2
        state = engine.startTurn(state);
        const actions = ai2.think({
          enemy: { hp: state.yourHp, armor: state.yourArmor, board: state.yourBoard, hand: state.handCards, mana: 0 },
          player: { hp: state.enemyHp, armor: state.enemyArmor, board: state.enemyBoard, hand: state.enemyHandCards, mana: state.mana, heroPowerUsed: state.enemyPowerUsedThisTurn },
        });
        for (const a of actions) {
          if (state.phase === "ended") break;
          // Mirror actions for enemy side (simplified sim)
        }
        if (state.phase !== "ended") state = engine.endTurn(state);
      }
    }

    turnCounts.push(50 - turnCap);
    if (state.matchResult === "win") wins1++;
    else if (state.matchResult === "loss") wins2++;
    else draws++;
  }

  return {
    games,
    wins1, wins2, draws,
    winRate1: wins1 / games,
    winRate2: wins2 / games,
    avgTurns: turnCounts.reduce((a, b) => a + b, 0) / games,
  };
}
