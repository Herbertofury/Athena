/**
 * @module cardgame/screens
 * @description Screen router — manages navigation between card game screens.
 * Front Door → Mode Hub → Collection / Deckbuilder / Packs / Journal /
 * Practice / Battlefield / Post-Match.
 * morphdom-compatible: returns keyed DOM, never replaces shell root.
 */
import {
  ICON_COLLECTION, ICON_DECKS, ICON_PACKS, ICON_JOURNAL,
  ICON_BACK, ICON_PRACTICE, ICON_DRAFT, ICON_BOSS_RUN, ICON_BRAWL,
  ICON_PLAY, ICON_SHOP, ICON_SETTINGS, ICON_DECK_WORKSHOP,
  ICON_ADVENTURE, ICON_SEALED, ICON_GAUNTLET, ICON_PUZZLE,
  ICON_SINGLETON, ICON_CARD_FORGE, ICON_WARBAND,
  iconEl,
} from "./icons.js";
import { cardEl } from "./board.js";
/* ═══════════════════════════════════════════════════════════════════════════
   Screen IDs
   ═══════════════════════════════════════════════════════════════════════════ */

export const SCREENS = {
  FRONT_DOOR:  "front-door",
  MODE_HUB:    "mode-hub",
  COLLECTION:  "collection",
  DECKBUILDER: "deckbuilder",
  PACKS:       "packs",
  JOURNAL:     "journal",
  HERO_SELECT: "hero-select",
  DECK_SELECT: "deck-select",
  MATCH:       "match",
  MULLIGAN:    "mulligan",
  POST_MATCH:  "post-match",
  SHOP:        "shop",
  SETTINGS:    "settings",
  CARD_FORGE:  "card-forge",
  ADVENTURE:   "adventure",
  SEALED:      "sealed",
  GAUNTLET:    "gauntlet",
  PUZZLE:      "puzzle",
  SINGLETON:   "singleton",
};

/* ═══════════════════════════════════════════════════════════════════════════
   Router
   ═══════════════════════════════════════════════════════════════════════════ */

export function createRouter(shellEl) {
  let current = null;
  let history = [];
  const listeners = new Set();

  function getScreen() { return current; }

  function go(screenId, pushHistory = true) {
    if (screenId === current) return;
    if (pushHistory && current) history.push(current);
    const prev = current;
    current = screenId;

    // Toggle active class on screen containers
    const screens = shellEl.querySelectorAll(".cg-screen");
    for (const s of screens) {
      const isTarget = s.dataset.screen === screenId;
      s.classList.toggle("active", isTarget);
      if (isTarget) s.setAttribute("data-enter", "");
      else s.removeAttribute("data-enter");
    }

    for (const fn of listeners) {
      try { fn(current, prev); } catch (_) {}
    }
  }

  function back() {
    if (history.length > 0) {
      go(history.pop(), false);
    } else {
      go(SCREENS.FRONT_DOOR, false);
    }
  }

  function onNavigate(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function resetHistory() { history = []; }

  return { getScreen, go, back, onNavigate, resetHistory, SCREENS };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Shell Builder — creates the screen containers in the shell root
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildShell() {
  const shell = document.createElement("div");
  shell.className = "cg-shell";

  // Top bar
  const topbar = document.createElement("div");
  topbar.className = "cg-topbar";

  const backBtn = document.createElement("button");
  backBtn.className = "cg-btn cg-topbar-back";
  backBtn.dataset.action = "back";
  backBtn.title = "Back";
  backBtn.appendChild(iconEl(ICON_BACK, "cg-topbar-icon"));
  topbar.appendChild(backBtn);

  const titleSpan = document.createElement("span");
  titleSpan.className = "cg-topbar-title";
  titleSpan.textContent = "Card Game";
  topbar.appendChild(titleSpan);

  const navDiv = document.createElement("div");
  navDiv.className = "cg-topbar-nav";
  const navItems = [
    { screen: SCREENS.COLLECTION, icon: ICON_COLLECTION, title: "Collection" },
    { screen: SCREENS.DECKBUILDER, icon: ICON_DECKS, title: "Decks" },
    { screen: SCREENS.PACKS, icon: ICON_PACKS, title: "Packs" },
    { screen: SCREENS.JOURNAL, icon: ICON_JOURNAL, title: "Journal" },
  ];
  for (const nav of navItems) {
    const btn = document.createElement("button");
    btn.className = "cg-btn";
    btn.dataset.nav = nav.screen;
    btn.title = nav.title;
    btn.appendChild(iconEl(nav.icon, "cg-topbar-icon"));
    navDiv.appendChild(btn);
  }
  topbar.appendChild(navDiv);

  shell.appendChild(topbar);

  // Create screen containers
  for (const id of Object.values(SCREENS)) {
    const screen = document.createElement("div");
    screen.className = "cg-screen";
    screen.dataset.screen = id;
    if (id === SCREENS.FRONT_DOOR) screen.classList.add("active");
    shell.appendChild(screen);
  }

  return shell;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Front Door Content
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderFrontDoor(callbacks = {}, context = {}) {
  const el = document.createElement("div");
  el.className = "cg-front-door";

  /* ─── Scene backdrop with animated particles ─── */
  const scene = document.createElement("div");
  scene.className = "cg-fd-scene";
  // Ambient idle particles
  for (let i = 0; i < 18; i++) {
    const p = document.createElement("div");
    p.className = "cg-fd-particle";
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDelay = `${Math.random() * 8}s`;
    p.style.animationDuration = `${6 + Math.random() * 8}s`;
    p.style.opacity = `${0.15 + Math.random() * 0.35}`;
    scene.appendChild(p);
  }
  el.appendChild(scene);

  /* ─── Center-stage portal / launcher ─── */
  const portal = document.createElement("div");
  portal.className = "cg-fd-portal";

  const portalGlow = document.createElement("div");
  portalGlow.className = "cg-fd-portal-glow";
  portal.appendChild(portalGlow);

  const portalTitle = document.createElement("div");
  portalTitle.className = "cg-fd-portal-title";
  portalTitle.textContent = "GameSync Card Game";
  portal.appendChild(portalTitle);

  const portalSubtitle = document.createElement("div");
  portalSubtitle.className = "cg-fd-portal-subtitle";
  portalSubtitle.textContent = "Your game library and mods become cards.";
  portal.appendChild(portalSubtitle);

  /* ─── Primary Play button ─── */
  const playBtn = document.createElement("button");
  playBtn.className = "cg-fd-play-btn";
  const playIconEl = iconEl(ICON_PLAY, "cg-fd-play-icon");
  playBtn.appendChild(playIconEl);
  const playLabel = document.createElement("span");
  playLabel.textContent = "Play";
  playBtn.appendChild(playLabel);
  if (callbacks.onPlay) playBtn.addEventListener("click", callbacks.onPlay);
  portal.appendChild(playBtn);

  el.appendChild(portal);

  /* ─── Recent deck + selected hero panel ─── */
  const recentDeck = context.recentDeck;
  const selectedHero = context.selectedHero;
  if (recentDeck || selectedHero) {
    const deckHeroPanel = document.createElement("div");
    deckHeroPanel.className = "cg-fd-deck-hero-panel";

    if (selectedHero) {
      const heroChip = document.createElement("div");
      heroChip.className = "cg-fd-hero-chip";
      const heroDot = document.createElement("div");
      heroDot.className = "cg-fd-hero-dot";
      heroDot.style.background = selectedHero.palette?.[0] || "#8b5cf6";
      heroChip.appendChild(heroDot);
      const heroName = document.createElement("span");
      heroName.className = "cg-fd-hero-name";
      heroName.textContent = selectedHero.name || "Unknown Hero";
      heroChip.appendChild(heroName);
      deckHeroPanel.appendChild(heroChip);
    }

    if (recentDeck) {
      const deckChip = document.createElement("div");
      deckChip.className = "cg-fd-deck-chip";
      const deckIcon = iconEl(ICON_DECKS, "cg-fd-deck-chip-icon");
      deckChip.appendChild(deckIcon);
      const deckName = document.createElement("span");
      deckName.textContent = recentDeck.name || "Last Deck";
      deckChip.appendChild(deckName);
      if (callbacks.onDeckBuilder) deckChip.addEventListener("click", callbacks.onDeckBuilder);
      deckHeroPanel.appendChild(deckChip);
    }

    el.appendChild(deckHeroPanel);
  }

  /* ─── Quest / reward / notification cluster ─── */
  const quests = context.activeQuests || [];
  const unopenedPacks = context.unopenedPacks || 0;
  const unclaimedRewards = context.unclaimedRewards || 0;
  if (quests.length > 0 || unopenedPacks > 0 || unclaimedRewards > 0) {
    const notifCluster = document.createElement("div");
    notifCluster.className = "cg-fd-notif-cluster";

    if (unopenedPacks > 0) {
      const packNotif = document.createElement("div");
      packNotif.className = "cg-fd-notif cg-fd-notif-packs";
      packNotif.appendChild(iconEl(ICON_PACKS, "cg-fd-notif-icon"));
      const packText = document.createElement("span");
      packText.textContent = `${unopenedPacks} pack${unopenedPacks > 1 ? "s" : ""} to open`;
      packNotif.appendChild(packText);
      if (callbacks.onPacks) packNotif.addEventListener("click", callbacks.onPacks);
      notifCluster.appendChild(packNotif);
    }

    if (unclaimedRewards > 0) {
      const rewardNotif = document.createElement("div");
      rewardNotif.className = "cg-fd-notif cg-fd-notif-rewards";
      rewardNotif.appendChild(iconEl(ICON_JOURNAL, "cg-fd-notif-icon"));
      const rewardText = document.createElement("span");
      rewardText.textContent = `${unclaimedRewards} reward${unclaimedRewards > 1 ? "s" : ""} to claim`;
      rewardNotif.appendChild(rewardText);
      if (callbacks.onJournal) rewardNotif.addEventListener("click", callbacks.onJournal);
      notifCluster.appendChild(rewardNotif);
    }

    for (const q of quests.slice(0, 2)) {
      const questNotif = document.createElement("div");
      questNotif.className = "cg-fd-notif cg-fd-notif-quest";
      const qText = document.createElement("span");
      qText.className = "cg-fd-quest-text";
      qText.textContent = q.title || q.description || "Active Quest";
      questNotif.appendChild(qText);
      const qProg = document.createElement("div");
      qProg.className = "cg-fd-quest-progress";
      const filled = q.max ? Math.min((q.progress || 0) / q.max, 1) : 0;
      qProg.innerHTML = `<div class="cg-fd-quest-bar" style="width:${Math.round(filled * 100)}%"></div>`;
      questNotif.appendChild(qProg);
      if (callbacks.onJournal) questNotif.addEventListener("click", callbacks.onJournal);
      notifCluster.appendChild(questNotif);
    }

    el.appendChild(notifCluster);
  }

  /* ─── Recommended action tile ─── */
  const recommendation = context.recommendation; // { type, label, detail }
  if (recommendation) {
    const recTile = document.createElement("div");
    recTile.className = "cg-fd-rec-tile";
    const recLabel = document.createElement("div");
    recLabel.className = "cg-fd-rec-label";
    recLabel.textContent = recommendation.label || "Recommended";
    recTile.appendChild(recLabel);
    if (recommendation.detail) {
      const recDetail = document.createElement("div");
      recDetail.className = "cg-fd-rec-detail";
      recDetail.textContent = recommendation.detail;
      recTile.appendChild(recDetail);
    }
    const recAction = document.createElement("button");
    recAction.className = "cg-btn cg-btn-sm";
    recAction.textContent = "Go";
    if (recommendation.action) recAction.addEventListener("click", recommendation.action);
    recTile.appendChild(recAction);
    el.appendChild(recTile);
  }

  /* ─── Navigation ring: 6 anchor points around the portal ─── */
  const navRing = document.createElement("div");
  navRing.className = "cg-fd-nav-ring";

  const navItems = [
    { icon: ICON_COLLECTION,     label: "Collection", key: "collection", cb: callbacks.onCollection },
    { icon: ICON_DECK_WORKSHOP,  label: "Decks",      key: "decks",      cb: callbacks.onDeckBuilder },
    { icon: ICON_PACKS,          label: "Open Packs",  key: "packs",      cb: callbacks.onPacks },
    { icon: ICON_JOURNAL,        label: "Journal",     key: "journal",    cb: callbacks.onJournal },
    { icon: ICON_SHOP,           label: "Shop",        key: "shop",       cb: callbacks.onShop },
    { icon: ICON_SETTINGS,       label: "Settings",    key: "settings",   cb: callbacks.onSettings },
  ];

  for (const item of navItems) {
    const anchor = document.createElement("button");
    anchor.className = "cg-fd-anchor";
    anchor.dataset.key = item.key;

    const aIcon = iconEl(item.icon, "cg-fd-anchor-icon");
    anchor.appendChild(aIcon);

    const aLabel = document.createElement("span");
    aLabel.className = "cg-fd-anchor-label";
    aLabel.textContent = item.label;
    anchor.appendChild(aLabel);

    if (item.cb) anchor.addEventListener("click", item.cb);
    navRing.appendChild(anchor);
  }

  el.appendChild(navRing);

  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mode Hub Content
   ═══════════════════════════════════════════════════════════════════════════ */

const NAV_ICONS = {
  "library-duel": ICON_PLAY,
  practice:   ICON_PRACTICE,
  collection: ICON_COLLECTION,
  deckbuilder: ICON_DECKS,
  packs:      ICON_PACKS,
  journal:    ICON_JOURNAL,
  draft:      ICON_DRAFT,
  blacksite:  ICON_DRAFT,
  bossrun:    ICON_BOSS_RUN,
  brawl:      ICON_BRAWL,
  warband:    ICON_WARBAND,
  replay:     ICON_SETTINGS,
  adventure:  ICON_ADVENTURE,
  sealed:     ICON_SEALED,
  gauntlet:   ICON_GAUNTLET,
  puzzle:     ICON_PUZZLE,
  singleton:  ICON_SINGLETON,
  cardforge:  ICON_CARD_FORGE,
};

const MODES = [
  { id: "library-duel", title: "Library Duel", desc: "1v1 battles using your collection.",
    sub: [{ id: "casual", label: "Casual" }, { id: "ranked", label: "Ranked" }],
    accent: "#6366f1" },
  { id: "practice", title: "Practice Table", desc: "Test strategies against the AI.",
    accent: "#22c55e" },
  { id: "draft", title: "Mod Forge", desc: "Draft a deck from random offerings and compete.",
    accent: "#f59e0b" },
  { id: "blacksite", title: "Blacksite Forge", desc: "Hardcore draft with deeper runs and rarer rewards.",
    accent: "#ef4444" },
  { id: "brawl", title: "Patch Chaos", desc: "Weekly special rules with wild modifiers.",
    accent: "#ec4899" },
  { id: "bossrun", title: "Boss Runs", desc: "Solo PvE adventure with escalating bosses.",
    accent: "#f97316" },
  { id: "warband", title: "Warband Workshop", desc: "Auto-battler mode — recruit, synergize, dominate.",
    accent: "#14b8a6" },
  { id: "adventure", title: "Mascot Adventure", desc: "PvE map journey with equipment and escalating encounters.",
    accent: "#d946ef" },
  { id: "sealed", title: "Sealed Forge", desc: "Open packs, build a deck, compete for rewards.",
    accent: "#eab308" },
  { id: "gauntlet", title: "Gauntlet Run", desc: "Climb to 12 wins before 3 losses — escalating difficulty.",
    accent: "#dc2626" },
  { id: "puzzle", title: "Puzzle Mode", desc: "Pre-set board states — find lethal, survive, outplay.",
    accent: "#0ea5e9" },
  { id: "singleton", title: "Singleton", desc: "Highlander: no duplicates. Powerful bonus rewards.",
    accent: "#84cc16" },
  { id: "cardforge", title: "Card Forge", desc: "Customize card themes, animations, board skins, and more.",
    accent: "#f472b6" },
  { id: "collection", title: "Collection", desc: "Browse and manage your cards.",
    accent: "#8b5cf6" },
  { id: "deckbuilder", title: "Deck Builder", desc: "Craft and optimize your decks.",
    accent: "#3b82f6" },
  { id: "packs", title: "Open Packs", desc: "Reveal new cards from sealed packs.",
    accent: "#a855f7" },
  { id: "journal", title: "Journal", desc: "Quests, rewards, achievements.",
    accent: "#06b6d4" },
  { id: "replay", title: "Replay Log", desc: "Recent matches, puzzle states, challenges.",
    accent: "#64748b" },
];

export function renderModeHub(callbacks = {}, context = {}) {
  const el = document.createElement("div");
  el.className = "cg-mode-hub";

  for (const mode of MODES) {
    const card = document.createElement("div");
    card.className = "cg-mode-card";
    card.dataset.mode = mode.id;
    card.style.setProperty("--mode-accent", mode.accent || "#8b5cf6");

    /* ─── Idle shimmer particle ─── */
    const shimmer = document.createElement("div");
    shimmer.className = "cg-mode-shimmer";
    card.appendChild(shimmer);

    /* ─── Icon ─── */
    const iconWrap = document.createElement("div");
    iconWrap.className = "cg-mode-card-icon";
    const modeSvg = NAV_ICONS[mode.id];
    if (modeSvg) iconWrap.appendChild(iconEl(modeSvg, "cg-mode-icon"));
    card.appendChild(iconWrap);

    /* ─── Title ─── */
    const titleEl = document.createElement("div");
    titleEl.className = "cg-mode-card-title";
    titleEl.textContent = mode.title;
    card.appendChild(titleEl);

    /* ─── Description / mode promise ─── */
    const descEl = document.createElement("div");
    descEl.className = "cg-mode-card-desc";
    descEl.textContent = mode.desc;
    card.appendChild(descEl);

    /* ─── Sub-modes (e.g. Casual / Ranked for Library Duel) ─── */
    if (mode.sub?.length) {
      const subRow = document.createElement("div");
      subRow.className = "cg-mode-sub-row";
      for (const sub of mode.sub) {
        const subBtn = document.createElement("button");
        subBtn.className = "cg-mode-sub-btn";
        subBtn.textContent = sub.label;
        subBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          callbacks.onMode?.(mode.id, sub.id);
        });
        subRow.appendChild(subBtn);
      }
      card.appendChild(subRow);
    }

    /* ─── Status / run state / eligibility badges ─── */
    const statusCtx = context.modeStatus?.[mode.id];
    if (statusCtx) {
      const statusRow = document.createElement("div");
      statusRow.className = "cg-mode-status-row";

      if (statusCtx.runActive) {
        const runBadge = document.createElement("span");
        runBadge.className = "cg-mode-badge cg-mode-badge-run";
        runBadge.textContent = "Run in progress";
        statusRow.appendChild(runBadge);
      }
      if (statusCtx.rewards) {
        const rwBadge = document.createElement("span");
        rwBadge.className = "cg-mode-badge cg-mode-badge-reward";
        rwBadge.textContent = statusCtx.rewards;
        statusRow.appendChild(rwBadge);
      }
      if (statusCtx.deckReady === false) {
        const deckWarn = document.createElement("span");
        deckWarn.className = "cg-mode-badge cg-mode-badge-warn";
        deckWarn.textContent = "No valid deck";
        statusRow.appendChild(deckWarn);
      }
      if (statusRow.childElementCount) card.appendChild(statusRow);
    }

    /* ─── Click handler ─── */
    if (callbacks.onMode && !mode.sub?.length) {
      card.addEventListener("click", () => callbacks.onMode(mode.id));
    } else if (callbacks.onMode && mode.sub?.length) {
      // Top-level click on a sub-mode card defaults to first sub
      card.addEventListener("click", () => callbacks.onMode(mode.id, mode.sub[0].id));
    }

    el.appendChild(card);
  }
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Post-Match Content
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderPostMatch(result, stats = {}, callbacks = {}) {
  const el = document.createElement("div");
  el.className = "cg-post-match";

  const resultClass = result === "victory" ? "victory" : result === "defeat" ? "defeat" : "draw";
  const resultText = result === "victory" ? "VICTORY" : result === "defeat" ? "DEFEAT" : "DRAW";

  /* ─── Result banner ─── */
  const banner = document.createElement("div");
  banner.className = `cg-pm-banner ${resultClass}`;
  banner.textContent = resultText;
  el.appendChild(banner);

  /* ─── Hero matchup summary ─── */
  if (stats.yourHero || stats.enemyHero) {
    const matchup = document.createElement("div");
    matchup.className = "cg-pm-matchup";
    matchup.innerHTML = `
      <span class="cg-pm-hero-name">${escHtml(stats.yourHero || "You")}</span>
      <span class="cg-pm-vs">vs</span>
      <span class="cg-pm-hero-name">${escHtml(stats.enemyHero || "Enemy")}</span>
    `;
    el.appendChild(matchup);
  }

  /* ─── Stat grid ─── */
  const statGrid = document.createElement("div");
  statGrid.className = "cg-pm-stats";

  const statItems = [
    { value: stats.turns || 0,       label: "Turns" },
    { value: stats.cardsPlayed || 0, label: "Cards Played" },
    { value: stats.damageDealt || 0, label: "Damage" },
    { value: stats.minionsKilled || 0, label: "Kills" },
    { value: stats.heroPowerUses || 0, label: "Hero Power" },
  ];
  for (const item of statItems) {
    const cell = document.createElement("div");
    cell.className = "cg-pm-stat";
    cell.innerHTML = `
      <div class="cg-pm-stat-value">${item.value}</div>
      <div class="cg-pm-stat-label">${item.label}</div>
    `;
    statGrid.appendChild(cell);
  }
  el.appendChild(statGrid);

  /* ─── Rewards earned ─── */
  const rewards = stats.rewards || {};
  if (rewards.xp || rewards.gold || rewards.dust) {
    const rewardSection = document.createElement("div");
    rewardSection.className = "cg-pm-rewards";

    const rTitle = document.createElement("div");
    rTitle.className = "cg-pm-rewards-title";
    rTitle.textContent = "Rewards Earned";
    rewardSection.appendChild(rTitle);

    const rGrid = document.createElement("div");
    rGrid.className = "cg-pm-rewards-grid";
    if (rewards.xp) rGrid.innerHTML += `<div class="cg-pm-reward"><span class="cg-pm-reward-val">+${rewards.xp}</span> XP</div>`;
    if (rewards.gold) rGrid.innerHTML += `<div class="cg-pm-reward cg-pm-reward-gold"><span class="cg-pm-reward-val">+${rewards.gold}</span> Gold</div>`;
    if (rewards.dust) rGrid.innerHTML += `<div class="cg-pm-reward cg-pm-reward-dust"><span class="cg-pm-reward-val">+${rewards.dust}</span> Dust</div>`;
    rewardSection.appendChild(rGrid);
    el.appendChild(rewardSection);
  }

  /* ─── Action buttons ─── */
  const actions = document.createElement("div");
  actions.className = "cg-pm-actions";

  const againBtn = document.createElement("button");
  againBtn.className = "cg-btn cg-btn-primary";
  againBtn.textContent = "Play Again";
  if (callbacks.onPlayAgain) againBtn.addEventListener("click", callbacks.onPlayAgain);
  actions.appendChild(againBtn);

  const hubBtn = document.createElement("button");
  hubBtn.className = "cg-btn";
  hubBtn.textContent = "Mode Hub";
  if (callbacks.onModeHub) hubBtn.addEventListener("click", callbacks.onModeHub);
  actions.appendChild(hubBtn);

  const homeBtn = document.createElement("button");
  homeBtn.className = "cg-btn";
  homeBtn.textContent = "Main Menu";
  if (callbacks.onHome) homeBtn.addEventListener("click", callbacks.onHome);
  actions.appendChild(homeBtn);

  el.appendChild(actions);
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mulligan Overlay
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderMulligan(handCards, cardLookup, callbacks = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cg-overlay";

  const inner = document.createElement("div");
  inner.className = "cg-mulligan";

  const title = document.createElement("div");
  title.className = "cg-mulligan-title";
  title.textContent = "Choose Cards to Replace";
  inner.appendChild(title);

  const cardsWrap = document.createElement("div");
  cardsWrap.className = "cg-mulligan-cards";

  const swapIndices = new Set();

  for (let i = 0; i < handCards.length; i++) {
    const c = handCards[i];
    const card = typeof c === "string" ? cardLookup(c) : c;
    if (!card) continue;

    const cEl = buildMulliganCard(card, i, swapIndices, cardsWrap);
    cardsWrap.appendChild(cEl);
  }
  inner.appendChild(cardsWrap);

  const actions = document.createElement("div");
  actions.className = "cg-front-door-actions";
  actions.innerHTML = `
    <button class="cg-btn cg-btn-primary cg-mull-confirm">Confirm</button>
    <button class="cg-btn cg-mull-skip">Keep All</button>
  `;
  const confirmBtn = actions.querySelector(".cg-mull-confirm");
  const skipBtn = actions.querySelector(".cg-mull-skip");
  if (confirmBtn && callbacks.onConfirm) {
    confirmBtn.addEventListener("click", () => callbacks.onConfirm([...swapIndices]));
  }
  if (skipBtn && callbacks.onSkip) {
    skipBtn.addEventListener("click", callbacks.onSkip);
  }
  inner.appendChild(actions);

  overlay.appendChild(inner);
  return overlay;
}

function buildMulliganCard(card, idx, swapSet, parent) {
  // Use the full card renderer so mulligan cards show art, stats & text
  const el = cardEl(card, {
    mode: "hand",
    onClick: () => {
      if (swapSet.has(idx)) {
        swapSet.delete(idx);
        el.classList.remove("mulligan-swap");
      } else {
        swapSet.add(idx);
        el.classList.add("mulligan-swap");
      }
    },
  });
  el.dataset.handIdx = idx;
  return el;
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
