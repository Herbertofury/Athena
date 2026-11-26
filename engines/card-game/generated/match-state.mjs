// SPDX-License-Identifier: GPL-3.0-or-later
// Derived from pinned GameSync bce6c1bcb31c63d31c64185fef143a53d9c4d35f.
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

export function blankMinionState(cardId, turn, random) {
  return {
    id: cardId,
    instanceId: `${cardId}_${turn}_${random().toString(36).slice(2, 8)}`,
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
