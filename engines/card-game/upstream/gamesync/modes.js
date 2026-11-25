/**
 * @module cardgame/modes
 * @description Practice, Tutorial, Solo Adventure / Boss Run, Weekly Brawl.
 * §14: All supplementary game modes beyond standard library-duel.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Tutorial / Practice (§14.1)
   ═══════════════════════════════════════════════════════════════════════════ */

const TUTORIAL_STEPS = [
  { id: "onboarding",     title: "Welcome to GameSync",     desc: "Meet the card game that turns your game library into a collectible universe." },
  { id: "rules",          title: "Rules & Flow",            desc: "Learn how turns, mana, and card play work." },
  { id: "hero_basics",    title: "Hero Basics",             desc: "Choose a hero, learn hero powers and passives." },
  { id: "install_patch",  title: "Install & Patch",         desc: "Understand how mod cards install onto game cards — and how patches stabilize them." },
  { id: "target_valid",   title: "Target Validity",         desc: "Which mods fit which games? Compatibility matters." },
  { id: "mulligan_intro", title: "Mulligan",                desc: "Swap your opening hand to find the right start." },
  { id: "deckbuilder_101",title: "Deckbuilder",             desc: "Build and tune your first deck." },
  { id: "pack_opening",   title: "Opening Packs",           desc: "Crack packs, discover cards, build your collection." },
  { id: "sandbox",        title: "Practice vs AI",          desc: "Play a free practice match against an AI opponent. No stakes, full rules." },
];

export function renderTutorial(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-tutorial";
  wrap.innerHTML = `<div class="cg-tutorial-title">Tutorial</div>`;

  const completed = profile?.tutorial?.completed || [];

  for (const step of TUTORIAL_STEPS) {
    const done = completed.includes(step.id);
    const row = document.createElement("div");
    row.className = `cg-tutorial-step${done ? " done" : ""}`;
    row.innerHTML = `
      <div class="cg-tutorial-step-icon">${done ? "\u2713" : "\u25B6"}</div>
      <div class="cg-tutorial-step-info">
        <div class="cg-tutorial-step-title">${escHtml(step.title)}</div>
        <div class="cg-tutorial-step-desc">${escHtml(step.desc)}</div>
      </div>
    `;
    if (step.id === "sandbox") {
      const playBtn = document.createElement("button");
      playBtn.className = "cg-btn cg-btn-primary";
      playBtn.textContent = "Practice";
      playBtn.addEventListener("click", () => callbacks.onSandbox?.());
      row.appendChild(playBtn);
    } else {
      row.addEventListener("click", () => {
        callbacks.onTutorialStep?.(step.id);
      });
    }
    wrap.appendChild(row);
  }
  container.appendChild(wrap);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Solo Adventures / Boss Runs (§14.2)
   ═══════════════════════════════════════════════════════════════════════════ */

const BOSS_ENCOUNTERS = [
  { id: "corruption_flood",  name: "Corruption Flood",      desc: "Boss floods the board with corrupted mods. Survive the onslaught.",    tier: 1, hp: 30 },
  { id: "patch_denial",      name: "Patch Denial",          desc: "Boss prevents all patches. Stabilize another way — or die trying.",     tier: 2, hp: 35 },
  { id: "volatility_storm",  name: "Volatility Storm",      desc: "Every card played triggers a random volatility event.",                  tier: 2, hp: 35 },
  { id: "framework_engine",  name: "Framework Engine",      desc: "Boss starts with 3 frameworks in play. Dismantle the engine.",           tier: 3, hp: 40 },
  { id: "platform_king",     name: "Platform King",         desc: "Boss uses a mono-platform deck with powerful synergies.",                tier: 3, hp: 40 },
  { id: "mod_flood",         name: "Mod Flood",             desc: "Boss installs mods on every minion every turn. Overwhelm before it locks.", tier: 4, hp: 45 },
  { id: "broken_loadorder",  name: "Broken Load Order",     desc: "Chaos boss. Random card effects each turn. Adapt or perish.",            tier: 5, hp: 50 },
];

const SOLO_TREASURES = [
  { id: "extra_mana",     name: "Bonus Crystal",    desc: "Start each game with 1 extra mana." },
  { id: "double_draw",    name: "Double Draw",       desc: "Draw 2 cards on your first turn." },
  { id: "armor_up",       name: "Iron Plating",      desc: "Start with 5 armor." },
  { id: "free_patch",     name: "Free Patch",        desc: "The first patch you play each game costs 0." },
  { id: "stable_mods",    name: "Stable Load Order", desc: "Your mods cannot become volatile." },
  { id: "boss_bounty",    name: "Boss Bounty",       desc: "Earn double gold from boss victories." },
];

export function renderSoloAdventure(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-solo";
  wrap.innerHTML = `<div class="cg-solo-title">Solo Adventure — Boss Run</div>`;

  const run = profile?.soloRun || null;

  /* Active run resume */
  if (run && !run.completed) {
    const resumeEl = document.createElement("div");
    resumeEl.className = "cg-solo-resume";
    resumeEl.innerHTML = `
      <div style="font-weight:800;">Active Run</div>
      <div style="font-size:12px;color:rgba(255,255,255,.50);">
        ${run.wins || 0}W / ${run.losses || 0}L \u2014 Next: ${escHtml((BOSS_ENCOUNTERS[run.bossIndex] || BOSS_ENCOUNTERS[0]).name)}
      </div>
    `;
    const resumeBtn = document.createElement("button");
    resumeBtn.className = "cg-btn cg-btn-primary";
    resumeBtn.textContent = "Resume";
    resumeBtn.addEventListener("click", () => callbacks.onResumeBossRun?.(run));
    resumeEl.appendChild(resumeBtn);

    const retireBtn = document.createElement("button");
    retireBtn.className = "cg-btn cg-btn-secondary";
    retireBtn.textContent = "Retire";
    retireBtn.addEventListener("click", () => callbacks.onRetireBossRun?.(run));
    resumeEl.appendChild(retireBtn);

    wrap.appendChild(resumeEl);
  }

  /* Boss encounter map */
  const mapTitle = document.createElement("div");
  mapTitle.style.cssText = "font-weight:700;margin:12px 0 6px;";
  mapTitle.textContent = "Encounter Map";
  wrap.appendChild(mapTitle);

  for (const boss of BOSS_ENCOUNTERS) {
    const el = document.createElement("div");
    el.className = "cg-solo-boss";

    const defeated = (profile?.soloRun?.defeatedBosses || []).includes(boss.id);
    el.innerHTML = `
      <div class="cg-solo-boss-tier">T${boss.tier}</div>
      <div class="cg-solo-boss-info">
        <div class="cg-solo-boss-name">${escHtml(boss.name)}${defeated ? " \u2713" : ""}</div>
        <div class="cg-solo-boss-desc">${escHtml(boss.desc)}</div>
      </div>
      <div class="cg-solo-boss-hp">${boss.hp} HP</div>
    `;
    if (defeated) el.style.opacity = "0.5";
    wrap.appendChild(el);
  }

  /* Treasure selection */
  const treasureTitle = document.createElement("div");
  treasureTitle.style.cssText = "font-weight:700;margin:12px 0 6px;";
  treasureTitle.textContent = "Treasures";
  wrap.appendChild(treasureTitle);

  for (const t of SOLO_TREASURES) {
    const el = document.createElement("div");
    el.className = "cg-solo-treasure";
    el.innerHTML = `
      <div class="cg-solo-treasure-name">${escHtml(t.name)}</div>
      <div class="cg-solo-treasure-desc">${escHtml(t.desc)}</div>
    `;
    wrap.appendChild(el);
  }

  /* New run button */
  if (!run || run.completed) {
    const newBtn = document.createElement("button");
    newBtn.className = "cg-btn cg-btn-primary";
    newBtn.textContent = "Start New Run";
    newBtn.style.marginTop = "12px";
    newBtn.addEventListener("click", () => callbacks.onStartBossRun?.());
    wrap.appendChild(newBtn);
  }

  container.appendChild(wrap);
}

export { BOSS_ENCOUNTERS, SOLO_TREASURES };

/* ═══════════════════════════════════════════════════════════════════════════
   Weekly Brawl / Patch Chaos (§14.3)
   ═══════════════════════════════════════════════════════════════════════════ */

const BRAWL_RULES = [
  { id: "mods_cost_1",       name: "Mod Mayhem",          desc: "All mod cards cost 1 mana." },
  { id: "frameworks_start",  name: "Framework Frenzy",    desc: "Both players start with all frameworks in play." },
  { id: "single_eco",        name: "Ecosystem Lock",      desc: "Only one target ecosystem allowed this week." },
  { id: "all_premium",       name: "Premium Showdown",    desc: "Every card in every deck is premium." },
  { id: "patch_hand",        name: "Patch in Hand",       desc: "Every deck starts with a patch card in hand." },
  { id: "discover_mod",      name: "Discover a Mod",      desc: "Discover a mod card at the start of every turn." },
  { id: "overhauls_only",    name: "Overhaul Only",       desc: "Only overhaul cards can be played." },
  { id: "low_cost_swarm",    name: "Swarm Mode",          desc: "Only cards costing 3 or less." },
  { id: "game_taunt",        name: "Fortress",            desc: "Every game card has taunt." },
  { id: "dual_hero",         name: "Dual Hero",           desc: "Pick two heroes — use both hero powers." },
  { id: "platform_crossover",name: "Platform Crossover",  desc: "Mix cards from two different platforms freely." },
];

export function getCurrentBrawl() {
  /* Deterministic weekly rotation based on epoch week */
  const weekIndex = Math.floor(Date.now() / (7 * 24 * 3_600_000));
  return BRAWL_RULES[weekIndex % BRAWL_RULES.length];
}

export function renderBrawl(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const brawl = getCurrentBrawl();
  const wrap = document.createElement("div");
  wrap.className = "cg-brawl";

  /* Header */
  wrap.innerHTML = `
    <div class="cg-brawl-header">
      <div class="cg-brawl-tag">Weekly Brawl</div>
      <div class="cg-brawl-name">${escHtml(brawl.name)}</div>
      <div class="cg-brawl-desc">${escHtml(brawl.desc)}</div>
    </div>
  `;

  /* Rules */
  const rulesEl = document.createElement("div");
  rulesEl.className = "cg-brawl-rules";
  rulesEl.innerHTML = `<div style="font-weight:700;margin-bottom:4px;">Special Rules</div>
    <div style="font-size:12px;color:rgba(255,255,255,.50);">${escHtml(brawl.desc)}</div>`;
  wrap.appendChild(rulesEl);

  /* Reward */
  const brawlReward = profile?.brawl?.rewardClaimed ? null : { gold: 50, xp: 30 };
  if (brawlReward) {
    const rewardEl = document.createElement("div");
    rewardEl.className = "cg-brawl-reward";
    rewardEl.innerHTML = `<span style="color:#ffd700;">\u2605</span> First win reward: ${brawlReward.gold} Gold + ${brawlReward.xp} XP`;
    wrap.appendChild(rewardEl);
  }

  /* Actions */
  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;margin-top:12px;";

  const playBtn = document.createElement("button");
  playBtn.className = "cg-btn cg-btn-primary";
  playBtn.textContent = "Play Brawl";
  playBtn.addEventListener("click", () => callbacks.onPlayBrawl?.(brawl));
  actions.appendChild(playBtn);

  const prebuiltBtn = document.createElement("button");
  prebuiltBtn.className = "cg-btn cg-btn-secondary";
  prebuiltBtn.textContent = "Use Prebuilt Deck";
  prebuiltBtn.addEventListener("click", () => callbacks.onPrebuiltDeck?.(brawl));
  actions.appendChild(prebuiltBtn);

  wrap.appendChild(actions);

  /* All brawl rules list */
  const allTitle = document.createElement("div");
  allTitle.style.cssText = "font-weight:700;margin:16px 0 6px;font-size:12px;color:rgba(255,255,255,.45);";
  allTitle.textContent = "All Brawl Rules (Rotating Weekly)";
  wrap.appendChild(allTitle);

  for (const rule of BRAWL_RULES) {
    const el = document.createElement("div");
    el.className = `cg-brawl-rule-row${rule.id === brawl.id ? " active" : ""}`;
    el.innerHTML = `
      <div style="font-weight:600;font-size:12px;">${escHtml(rule.name)}</div>
      <div style="font-size:11px;color:rgba(255,255,255,.40);">${escHtml(rule.desc)}</div>
    `;
    wrap.appendChild(el);
  }

  container.appendChild(wrap);
}

export { BRAWL_RULES };

/* ═══════════════════════════════════════════════════════════════════════════
   Warband Workshop Architecture Shell (§15)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderWarbandShell(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-warband";

  wrap.innerHTML = `
    <div class="cg-warband-header">
      <div class="cg-warband-tag">Warband Workshop</div>
      <div class="cg-warband-name">Auto-Battler Mode</div>
      <div class="cg-warband-desc">
        Recruit game cards, support with mods, arrange your board,
        and enter auto-combat rounds. Build synergies by platform,
        genre, developer, ecosystem, and framework.
      </div>
    </div>
  `;

  /* Mode slot reserved */
  const phases = [
    "Choose a hero",
    "Recruit game cards from the shop",
    "Buy / support with mod cards",
    "Arrange board order",
    "Build synergies by platform / genre / ecosystem / framework",
    "Enter auto-combat rounds",
    "Level up workshop / tier / shop",
    "Chase powerful synergies and treasures",
  ];

  const phaseList = document.createElement("div");
  phaseList.className = "cg-warband-phases";
  phaseList.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Gameplay Loop</div>`;
  for (const p of phases) {
    phaseList.innerHTML += `<div class="cg-warband-phase">\u25B8 ${escHtml(p)}</div>`;
  }
  wrap.appendChild(phaseList);

  /* Architecture flags */
  const archEl = document.createElement("div");
  archEl.style.cssText = "margin-top:12px;font-size:11px;color:rgba(255,255,255,.35);";
  archEl.innerHTML = `
    <div>\u2713 Top-level mode slot reserved</div>
    <div>\u2713 Shell architecture is mode-agnostic</div>
    <div>\u2713 Progression system is mode-aware</div>
    <div>\u2713 Cosmetics system is mode-aware</div>
    <div>\u2713 Hero data model supports alternate modes</div>
    <div>\u2713 Collection schema is flexible for mode-only pieces</div>
    <div>\u2713 Platform is not hardcoded for duel mode only</div>
  `;
  wrap.appendChild(archEl);

  const playBtn = document.createElement("button");
  playBtn.className = "cg-btn cg-btn-secondary";
  playBtn.textContent = "Coming Soon";
  playBtn.disabled = true;
  playBtn.style.marginTop = "12px";
  wrap.appendChild(playBtn);

  container.appendChild(wrap);
}

/* ═══════════════════════════════════════════════════════════════════════════
   C1: Mascot Adventure (§14.4) — Map-based PvE encounters with equipment
   ═══════════════════════════════════════════════════════════════════════════ */

const ADVENTURE_ENCOUNTERS = [
  { id: "ad_intro",       name: "The Tutorial Trail",     desc: "A gentle warm-up against a basic AI deck.",             tier: 1, hp: 20, reward: { gold: 15, xp: 10 } },
  { id: "ad_forest",      name: "Haunted Repository",     desc: "Face corrupted clones in the deep file tree.",          tier: 1, hp: 25, reward: { gold: 20, xp: 15 } },
  { id: "ad_shrine",      name: "Shrine of Patches",      desc: "A spirit that only takes damage from patch cards.",     tier: 2, hp: 30, reward: { gold: 25, xp: 20 } },
  { id: "ad_mine",        name: "Data Mine",              desc: "Boss summons 1/1 tokens every turn. Clear them fast.",  tier: 2, hp: 30, reward: { gold: 25, xp: 20 } },
  { id: "ad_tower",       name: "Framework Tower",        desc: "The boss starts with 2 frameworks. Tear them down.",    tier: 3, hp: 35, reward: { gold: 35, xp: 25 } },
  { id: "ad_lab",         name: "The Mod Lab",            desc: "Random mods get installed on both boards each turn.",   tier: 3, hp: 35, reward: { gold: 35, xp: 25 } },
  { id: "ad_vault",       name: "Platform Vault",         desc: "Boss immune to cards outside its platform.",            tier: 4, hp: 40, reward: { gold: 45, xp: 30 } },
  { id: "ad_apex",        name: "Apex Debugger",          desc: "Final boss. Full board, full hand, hero power every turn.", tier: 5, hp: 50, reward: { gold: 75, xp: 50 } },
];

const ADVENTURE_EQUIPMENT = [
  { id: "eq_helm_health",    name: "Debugger's Helm",       desc: "+5 starting HP.",                 slot: "helm",     stat: { hp: 5 } },
  { id: "eq_helm_draw",      name: "Analyst's Cap",         desc: "Draw 1 extra card on turn 1.",    slot: "helm",     stat: { extraDraw: 1 } },
  { id: "eq_chest_armor",    name: "Contributor's Chestplate", desc: "+3 Armor at match start.",     slot: "chest",    stat: { armor: 3 } },
  { id: "eq_chest_mana",     name: "Maintainer's Robe",     desc: "+1 starting mana.",               slot: "chest",    stat: { bonusMana: 1 } },
  { id: "eq_weapon_atk",     name: "Forked Blade",          desc: "Hero power deals +1 damage.",     slot: "weapon",   stat: { heroPowerBonus: 1 } },
  { id: "eq_weapon_sweep",   name: "Merge Hammer",          desc: "Hero power hits 2 targets.",      slot: "weapon",   stat: { heroPowerMulti: true } },
  { id: "eq_boots_speed",    name: "Sprint Boots",          desc: "All minions have +1 attack on summon turn.", slot: "boots", stat: { rushBuff: 1 } },
  { id: "eq_boots_dodge",    name: "Dodge Sandals",         desc: "25% chance to avoid the first hit.", slot: "boots", stat: { dodgeChance: 0.25 } },
  { id: "eq_ring_gold",      name: "Prospector's Ring",     desc: "+10 bonus gold per victory.",     slot: "ring",     stat: { bonusGold: 10 } },
  { id: "eq_ring_xp",        name: "Scholar's Band",        desc: "+15 bonus XP per encounter.",     slot: "ring",     stat: { bonusXp: 15 } },
];

export function renderMascotAdventure(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-adventure";
  wrap.innerHTML = `<div class="cg-mode-title">Mascot Adventure</div>
    <div class="cg-mode-subtitle">Embark on a PvE journey through 8 encounters. Earn equipment, upgrade your hero, and defeat the Apex Debugger.</div>`;

  const run = profile?.adventureRun || null;

  /* Equipment loadout */
  const eqWrap = document.createElement("div");
  eqWrap.className = "cg-adventure-equip";
  eqWrap.innerHTML = `<div class="cg-adventure-equip-title">Equipment Loadout</div>`;
  const equipped = run?.equipment || {};
  const slots = ["helm", "chest", "weapon", "boots", "ring"];
  for (const slot of slots) {
    const eqId = equipped[slot];
    const item = ADVENTURE_EQUIPMENT.find(e => e.id === eqId);
    const el = document.createElement("div");
    el.className = "cg-adventure-slot";
    el.innerHTML = `
      <div class="cg-adventure-slot-label">${slot.charAt(0).toUpperCase() + slot.slice(1)}</div>
      <div class="cg-adventure-slot-item">${item ? escHtml(item.name) : "— Empty —"}</div>
    `;
    if (item) {
      el.title = item.desc;
    }
    el.addEventListener("click", () => callbacks.onEquipSlot?.(slot));
    eqWrap.appendChild(el);
  }
  wrap.appendChild(eqWrap);

  /* Encounter map */
  const mapWrap = document.createElement("div");
  mapWrap.className = "cg-adventure-map";
  mapWrap.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Encounter Map</div>`;
  const defeated = run?.defeatedEncounters || [];
  for (const enc of ADVENTURE_ENCOUNTERS) {
    const done = defeated.includes(enc.id);
    const el = document.createElement("div");
    el.className = `cg-adventure-enc${done ? " done" : ""}`;
    el.innerHTML = `
      <div class="cg-adventure-enc-tier">T${enc.tier}</div>
      <div class="cg-adventure-enc-info">
        <div class="cg-adventure-enc-name">${escHtml(enc.name)}${done ? " \u2713" : ""}</div>
        <div class="cg-adventure-enc-desc">${escHtml(enc.desc)}</div>
      </div>
      <div class="cg-adventure-enc-hp">${enc.hp} HP</div>
    `;
    if (!done) {
      el.addEventListener("click", () => callbacks.onStartEncounter?.(enc));
    }
    mapWrap.appendChild(el);
  }
  wrap.appendChild(mapWrap);

  /* Actions */
  if (!run || run.completed) {
    const startBtn = document.createElement("button");
    startBtn.className = "cg-btn cg-btn-primary";
    startBtn.textContent = "Start Adventure";
    startBtn.style.marginTop = "12px";
    startBtn.addEventListener("click", () => callbacks.onStartAdventure?.());
    wrap.appendChild(startBtn);
  }

  container.appendChild(wrap);
}

export { ADVENTURE_ENCOUNTERS, ADVENTURE_EQUIPMENT };

/* ═══════════════════════════════════════════════════════════════════════════
   C2: Sealed Forge (§14.5) — Draft from limited packs, build on the fly
   ═══════════════════════════════════════════════════════════════════════════ */

const SEALED_CONFIG = {
  packsToOpen: 6,
  cardsPerPack: 5,
  deckSize: 20,
  maxWins: 7,
  maxLosses: 3,
  entryFee: { gold: 150 },
  rewardTable: [
    { wins: 0, reward: { gold: 20,  packs: 1 } },
    { wins: 1, reward: { gold: 35,  packs: 1 } },
    { wins: 2, reward: { gold: 50,  packs: 1 } },
    { wins: 3, reward: { gold: 75,  packs: 1 } },
    { wins: 4, reward: { gold: 100, packs: 2 } },
    { wins: 5, reward: { gold: 150, packs: 2 } },
    { wins: 6, reward: { gold: 200, packs: 2 } },
    { wins: 7, reward: { gold: 300, packs: 3 } },
  ],
};

export function renderSealedForge(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-sealed";
  wrap.innerHTML = `<div class="cg-mode-title">Sealed Forge</div>
    <div class="cg-mode-subtitle">Open ${SEALED_CONFIG.packsToOpen} packs of ${SEALED_CONFIG.cardsPerPack} cards each. Build a ${SEALED_CONFIG.deckSize}-card deck from what you pull. Win up to ${SEALED_CONFIG.maxWins} before ${SEALED_CONFIG.maxLosses} losses!</div>`;

  const run = profile?.sealedRun || null;

  if (run && !run.completed) {
    const resumeEl = document.createElement("div");
    resumeEl.className = "cg-sealed-resume";
    resumeEl.innerHTML = `
      <div style="font-weight:700;">Active Sealed Run</div>
      <div style="font-size:12px;color:rgba(255,255,255,.50);">${run.wins || 0}W / ${run.losses || 0}L</div>
    `;
    const resumeBtn = document.createElement("button");
    resumeBtn.className = "cg-btn cg-btn-primary";
    resumeBtn.textContent = "Resume";
    resumeBtn.addEventListener("click", () => callbacks.onResumeSealedRun?.(run));
    resumeEl.appendChild(resumeBtn);
    wrap.appendChild(resumeEl);
  }

  /* Reward table */
  const tableEl = document.createElement("div");
  tableEl.className = "cg-sealed-rewards";
  tableEl.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Reward Table</div>`;
  for (const row of SEALED_CONFIG.rewardTable) {
    const el = document.createElement("div");
    el.className = "cg-sealed-reward-row";
    el.innerHTML = `<span class="cg-sealed-wins">${row.wins}W</span> <span class="cg-sealed-reward">${row.reward.gold}g + ${row.reward.packs} pack${row.reward.packs > 1 ? "s" : ""}</span>`;
    tableEl.appendChild(el);
  }
  wrap.appendChild(tableEl);

  if (!run || run.completed) {
    const cost = SEALED_CONFIG.entryFee.gold;
    const canAfford = (profile?.collection?.gold || 0) >= cost;
    const btn = document.createElement("button");
    btn.className = "cg-btn cg-btn-primary";
    btn.textContent = `Enter Sealed (${cost}g)`;
    btn.disabled = !canAfford;
    if (!canAfford) btn.title = "Not enough gold";
    btn.style.marginTop = "12px";
    btn.addEventListener("click", () => callbacks.onStartSealedRun?.());
    wrap.appendChild(btn);
  }

  container.appendChild(wrap);
}

export { SEALED_CONFIG };

/* ═══════════════════════════════════════════════════════════════════════════
   C3: Gauntlet Run (§14.6) — Escalating opponents, one life
   ═══════════════════════════════════════════════════════════════════════════ */

const GAUNTLET_CONFIG = {
  maxWins: 12,
  maxLosses: 3,
  entryFee: { gold: 100 },
  rewardTable: [
    { wins: 0,  reward: { gold: 10,  packs: 0 } },
    { wins: 3,  reward: { gold: 50,  packs: 1 } },
    { wins: 6,  reward: { gold: 100, packs: 1 } },
    { wins: 9,  reward: { gold: 200, packs: 2 } },
    { wins: 12, reward: { gold: 350, packs: 3, ticket: 1 } },
  ],
  milestones: [
    { wins: 3,  label: "Iron" },
    { wins: 6,  label: "Silver" },
    { wins: 9,  label: "Gold" },
    { wins: 12, label: "Legend" },
  ],
};

export function renderGauntletRun(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-gauntlet";
  wrap.innerHTML = `<div class="cg-mode-title">Gauntlet Run</div>
    <div class="cg-mode-subtitle">Climb to ${GAUNTLET_CONFIG.maxWins} wins before ${GAUNTLET_CONFIG.maxLosses} losses. Each opponent is tougher than the last!</div>`;

  const run = profile?.gauntletRun || null;

  if (run && !run.completed) {
    const el = document.createElement("div");
    el.className = "cg-gauntlet-resume";
    el.innerHTML = `
      <div style="font-weight:700;">Active Gauntlet</div>
      <div style="font-size:12px;color:rgba(255,255,255,.50);">${run.wins || 0}W / ${run.losses || 0}L</div>
    `;
    const btn = document.createElement("button");
    btn.className = "cg-btn cg-btn-primary";
    btn.textContent = "Resume";
    btn.addEventListener("click", () => callbacks.onResumeGauntletRun?.(run));
    el.appendChild(btn);
    wrap.appendChild(el);
  }

  /* Milestone display */
  const milestoneWrap = document.createElement("div");
  milestoneWrap.className = "cg-gauntlet-milestones";
  milestoneWrap.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Milestones</div>`;
  for (const ms of GAUNTLET_CONFIG.milestones) {
    const reached = run ? run.wins >= ms.wins : false;
    const el = document.createElement("div");
    el.className = `cg-gauntlet-ms${reached ? " reached" : ""}`;
    el.innerHTML = `<span class="cg-gauntlet-ms-wins">${ms.wins}W</span> <span class="cg-gauntlet-ms-label">${ms.label}</span>`;
    milestoneWrap.appendChild(el);
  }
  wrap.appendChild(milestoneWrap);

  /* Reward tiers */
  const rewardWrap = document.createElement("div");
  rewardWrap.className = "cg-gauntlet-rewards";
  rewardWrap.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Rewards</div>`;
  for (const row of GAUNTLET_CONFIG.rewardTable) {
    const el = document.createElement("div");
    el.className = "cg-gauntlet-reward-row";
    let txt = `${row.reward.gold}g + ${row.reward.packs} pack${row.reward.packs !== 1 ? "s" : ""}`;
    if (row.reward.ticket) txt += " + Free Ticket";
    el.innerHTML = `<span class="cg-gauntlet-rw">${row.wins}W</span> <span>${txt}</span>`;
    rewardWrap.appendChild(el);
  }
  wrap.appendChild(rewardWrap);

  if (!run || run.completed) {
    const cost = GAUNTLET_CONFIG.entryFee.gold;
    const canAfford = (profile?.collection?.gold || 0) >= cost;
    const btn = document.createElement("button");
    btn.className = "cg-btn cg-btn-primary";
    btn.textContent = `Enter Gauntlet (${cost}g)`;
    btn.disabled = !canAfford;
    if (!canAfford) btn.title = "Not enough gold";
    btn.style.marginTop = "12px";
    btn.addEventListener("click", () => callbacks.onStartGauntletRun?.());
    wrap.appendChild(btn);
  }

  container.appendChild(wrap);
}

export { GAUNTLET_CONFIG };

/* ═══════════════════════════════════════════════════════════════════════════
   C4: Puzzle Mode (§14.7) — Pre-set boards, solve in 1 turn
   ═══════════════════════════════════════════════════════════════════════════ */

const PUZZLE_SETS = [
  {
    id: "pz_lethal_basic", name: "Basic Lethal", desc: "Find the exact sequence to defeat the opponent this turn.",
    puzzles: [
      { id: "pz1", name: "First Blood",        difficulty: 1, hint: "Use your charge minion wisely." },
      { id: "pz2", name: "Taunt Breaker",      difficulty: 1, hint: "Clear the taunt, then go face." },
      { id: "pz3", name: "Spell Combo",        difficulty: 2, hint: "Your spells set up the kill." },
      { id: "pz4", name: "Board Clear Setup",  difficulty: 2, hint: "AOE first, then push damage." },
      { id: "pz5", name: "Exact Lethal",       difficulty: 3, hint: "Every point of damage counts." },
    ]
  },
  {
    id: "pz_survival", name: "Survival Puzzles", desc: "Stay alive with the tools you're given.",
    puzzles: [
      { id: "ps1", name: "Just Enough",        difficulty: 1, hint: "Heal and trade efficiently." },
      { id: "ps2", name: "Taunt Wall",         difficulty: 2, hint: "Set up taunts to absorb the hit." },
      { id: "ps3", name: "Freeze Stall",       difficulty: 2, hint: "Freeze the biggest threats." },
      { id: "ps4", name: "Armor Stack",        difficulty: 3, hint: "Maximize your armor gain." },
    ]
  },
  {
    id: "pz_mirror", name: "Mirror Match", desc: "Both sides have the same cards. Find the edge.",
    puzzles: [
      { id: "pm1", name: "Even Ground",        difficulty: 2, hint: "Positioning and order matter." },
      { id: "pm2", name: "Tempo Race",         difficulty: 3, hint: "Who gains tempo first wins." },
    ]
  },
];

export function renderPuzzleMode(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-puzzle";
  wrap.innerHTML = `<div class="cg-mode-title">Puzzle Mode</div>
    <div class="cg-mode-subtitle">Solve pre-set board states. Find lethal, survive, or outplay in one turn.</div>`;

  const solved = profile?.puzzlesSolved || [];

  for (const set of PUZZLE_SETS) {
    const setEl = document.createElement("div");
    setEl.className = "cg-puzzle-set";
    setEl.innerHTML = `
      <div class="cg-puzzle-set-name">${escHtml(set.name)}</div>
      <div class="cg-puzzle-set-desc">${escHtml(set.desc)}</div>
    `;

    for (const pz of set.puzzles) {
      const done = solved.includes(pz.id);
      const el = document.createElement("div");
      el.className = `cg-puzzle-item${done ? " solved" : ""}`;
      const stars = "\u2605".repeat(pz.difficulty) + "\u2606".repeat(3 - pz.difficulty);
      el.innerHTML = `
        <div class="cg-puzzle-stars">${stars}</div>
        <div class="cg-puzzle-name">${escHtml(pz.name)}${done ? " \u2713" : ""}</div>
      `;
      el.addEventListener("click", () => callbacks.onStartPuzzle?.(pz, set));
      setEl.appendChild(el);
    }
    wrap.appendChild(setEl);
  }

  container.appendChild(wrap);
}

export { PUZZLE_SETS };

/* ═══════════════════════════════════════════════════════════════════════════
   C5: Singleton Mode (§14.8) — Highlander: no duplicate cards
   ═══════════════════════════════════════════════════════════════════════════ */

const SINGLETON_CONFIG = {
  label: "Singleton (Highlander)",
  description: "Build a deck with exactly one copy of each card. Powerful rewards for uniqueness.",
  deckSize: 30,
  maxDuplicates: 1,
  bonuses: [
    { id: "sing_hero_power",  desc: "Hero power costs 1 less." },
    { id: "sing_draw",        desc: "Draw an extra card on turn 1." },
    { id: "sing_discover",    desc: "Discover a card every 5 turns." },
  ],
};

export function renderSingletonMode(container, profile, callbacks = {}) {
  container.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "cg-singleton";
  wrap.innerHTML = `<div class="cg-mode-title">${escHtml(SINGLETON_CONFIG.label)}</div>
    <div class="cg-mode-subtitle">${escHtml(SINGLETON_CONFIG.description)}</div>`;

  /* Bonuses */
  const bonusWrap = document.createElement("div");
  bonusWrap.className = "cg-singleton-bonuses";
  bonusWrap.innerHTML = `<div style="font-weight:700;margin-bottom:6px;">Singleton Bonuses</div>`;
  for (const b of SINGLETON_CONFIG.bonuses) {
    const el = document.createElement("div");
    el.className = "cg-singleton-bonus";
    el.innerHTML = `<span style="color:#ffd700;">\u2726</span> ${escHtml(b.desc)}`;
    bonusWrap.appendChild(el);
  }
  wrap.appendChild(bonusWrap);

  /* Stats */
  const singletonStats = profile?.singletonStats || { wins: 0, losses: 0, bestStreak: 0 };
  const statsEl = document.createElement("div");
  statsEl.className = "cg-singleton-stats";
  statsEl.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px;">Your Record</div>
    <div style="font-size:12px;color:rgba(255,255,255,.50);">
      ${singletonStats.wins}W / ${singletonStats.losses}L — Best streak: ${singletonStats.bestStreak}
    </div>
  `;
  wrap.appendChild(statsEl);

  /* Play button */
  const btn = document.createElement("button");
  btn.className = "cg-btn cg-btn-primary";
  btn.textContent = "Play Singleton";
  btn.style.marginTop = "12px";
  btn.addEventListener("click", () => callbacks.onPlaySingleton?.());
  wrap.appendChild(btn);

  container.appendChild(wrap);
}

export { SINGLETON_CONFIG };

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
