// SPDX-License-Identifier: GPL-3.0-or-later
// Derived from pinned GameSync bce6c1bcb31c63d31c64185fef143a53d9c4d35f.
export const CARD_TYPES = {
  MINION: "minion",
  SPELL: "spell",
  WEAPON: "weapon",
  FRAMEWORK: "framework",   // special persistent attachment
};
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
