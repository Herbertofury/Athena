/**
 * @module cardgame/deck-select
 * @description Deck Select screen — pick a deck before entering a match.
 * §8.1: Hero shown large, deck list with archetype, curve preview,
 * legality status, card count, last-played, win rate.
 * Actions: Play, Edit, Copy Code, Import, Duplicate, Rename, Delete, Favorite.
 */

import { isDeckValid, deckCardCount, manaCurveStats } from "./state.js";
import { RARITY_ORDER } from "./cards.js";
import { computeDeckMetrics } from "./deckbuilder.js";
import { POWER_ICONS, iconEl, ICON_DECKS } from "./icons.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Render Deck Select
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderDeckSelect(decks, hero, profile, cardLookup, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-deck-select";

  /* ─── Header ─── */
  const header = document.createElement("div");
  header.className = "cg-deck-select-header";

  // Hero display (large)
  const heroPane = document.createElement("div");
  heroPane.className = "cg-deck-select-hero";
  if (hero) {
    const portrait = document.createElement("div");
    portrait.className = "cg-deck-select-hero-portrait";
    portrait.textContent = hero.name?.charAt(0)?.toUpperCase() || "?";
    if (hero.palette?.primary) portrait.style.color = hero.palette.primary;
    heroPane.appendChild(portrait);

    const heroInfo = document.createElement("div");
    heroInfo.className = "cg-deck-select-hero-info";
    const heroName = document.createElement("div");
    heroName.className = "cg-deck-select-hero-name";
    heroName.textContent = hero.name || hero.id;
    heroInfo.appendChild(heroName);

    const heroPower = document.createElement("div");
    heroPower.className = "cg-deck-select-hero-power";
    const pwrSvg = POWER_ICONS[hero.powerIconKey || hero.powerKey];
    if (pwrSvg) heroPower.appendChild(iconEl(pwrSvg, "cg-power-icon"));
    heroPower.appendChild(document.createTextNode(hero.powerName || ""));
    heroInfo.appendChild(heroPower);
    heroPane.appendChild(heroInfo);
  }
  header.appendChild(heroPane);

  // Actions row
  const actionsRow = document.createElement("div");
  actionsRow.className = "cg-deck-select-actions";
  const newDeckBtn = document.createElement("button");
  newDeckBtn.className = "cg-btn cg-btn-primary";
  newDeckBtn.textContent = "New Deck";
  newDeckBtn.addEventListener("click", () => callbacks.onNewDeck?.());
  actionsRow.appendChild(newDeckBtn);

  const importBtn = document.createElement("button");
  importBtn.className = "cg-btn";
  importBtn.textContent = "Import Code";
  importBtn.addEventListener("click", () => callbacks.onImport?.());
  actionsRow.appendChild(importBtn);

  // Quick Play — auto-build a random deck and jump straight into a match
  const quickPlayBtn = document.createElement("button");
  quickPlayBtn.className = "cg-btn cg-btn-accent cg-quick-play-btn";
  quickPlayBtn.textContent = "\u26A1 Quick Play";
  quickPlayBtn.addEventListener("click", () => callbacks.onQuickPlay?.());
  actionsRow.appendChild(quickPlayBtn);

  header.appendChild(actionsRow);

  root.appendChild(header);

  /* ─── Deck List ─── */
  const listWrap = document.createElement("div");
  listWrap.className = "cg-deck-select-list";

  if (!decks?.length) {
    const empty = document.createElement("div");
    empty.className = "cg-empty-msg";
    empty.textContent = "No decks yet. Create one or use Quick Play!";
    listWrap.appendChild(empty);
  } else {
    for (const deck of decks) {
      const row = buildDeckRow(deck, hero, profile, cardLookup, callbacks);
      listWrap.appendChild(row);
    }
  }

  root.appendChild(listWrap);
  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Row
   ═══════════════════════════════════════════════════════════════════════════ */

function buildDeckRow(deck, hero, profile, cardLookup, callbacks) {
  const row = document.createElement("div");
  row.className = "cg-deck-row";

  const count = deckCardCount(deck);
  const valid = isDeckValid(deck);
  const metrics = computeDeckMetrics(deck, cardLookup, hero);

  /* ─── Left: Deck identity ─── */
  const identity = document.createElement("div");
  identity.className = "cg-deck-row-identity";

  const nameEl = document.createElement("div");
  nameEl.className = "cg-deck-row-name";
  nameEl.textContent = deck.name || "Unnamed Deck";
  if (deck.favorite) nameEl.classList.add("cg-deck-favorite");
  identity.appendChild(nameEl);

  const meta = document.createElement("div");
  meta.className = "cg-deck-row-meta";
  const statusClass = valid ? "valid" : "invalid";
  meta.innerHTML = `<span class="cg-deck-count ${statusClass}">${count}/30</span>`;
  if (metrics.avgCost > 0) {
    meta.innerHTML += ` · Avg ${metrics.avgCost}`;
  }
  identity.appendChild(meta);

  /* ─── Mode legality badge ─── */
  const legalBadge = document.createElement("span");
  legalBadge.className = "cg-deck-legality";
  if (valid) {
    legalBadge.textContent = "Legal";
    legalBadge.classList.add("legal");
  } else {
    legalBadge.textContent = count < 30 ? `Need ${30 - count} more` : "Over limit";
    legalBadge.classList.add("illegal");
  }
  identity.appendChild(legalBadge);

  /* ─── Synergy + record summary ─── */
  const summaryRow = document.createElement("div");
  summaryRow.className = "cg-deck-row-summary";
  if (metrics.topKeywords?.length) {
    const synEl = document.createElement("span");
    synEl.className = "cg-deck-synergy";
    synEl.textContent = metrics.topKeywords.slice(0, 3).join(" · ");
    summaryRow.appendChild(synEl);
  }
  if (deck.stats?.gamesPlayed) {
    const recEl = document.createElement("span");
    recEl.className = "cg-deck-record";
    const wins = deck.stats.wins || 0;
    const games = deck.stats.gamesPlayed;
    const wr = Math.round((wins / games) * 100);
    recEl.textContent = `${wins}W-${games - wins}L (${wr}%)`;
    summaryRow.appendChild(recEl);
  }
  if (deck.lastPlayed) {
    const lpEl = document.createElement("span");
    lpEl.className = "cg-deck-last-played";
    lpEl.textContent = `Last: ${new Date(deck.lastPlayed).toLocaleDateString()}`;
    summaryRow.appendChild(lpEl);
  }
  if (summaryRow.childElementCount) identity.appendChild(summaryRow);

  /* ─── Deck warnings ─── */
  const warnings = buildDeckWarnings(metrics, deck, cardLookup);
  if (warnings.length) {
    const warnRow = document.createElement("div");
    warnRow.className = "cg-deck-warnings";
    for (const w of warnings) {
      const wEl = document.createElement("span");
      wEl.className = "cg-deck-warn";
      wEl.textContent = w;
      warnRow.appendChild(wEl);
    }
    identity.appendChild(warnRow);
  }

  row.appendChild(identity);

  /* ─── Center: Mini mana curve ─── */
  const curve = document.createElement("div");
  curve.className = "cg-deck-row-curve";
  const maxC = Math.max(1, ...Object.values(metrics.curve));
  for (let i = 0; i <= 7; i++) {
    const c = metrics.curve[i] || 0;
    const bar = document.createElement("div");
    bar.className = "cg-deck-row-curve-bar";
    bar.style.height = `${Math.max(2, (c / maxC) * 100)}%`;
    curve.appendChild(bar);
  }
  row.appendChild(curve);

  /* ─── Right: Actions ─── */
  const actions = document.createElement("div");
  actions.className = "cg-deck-row-actions";

  const playBtn = document.createElement("button");
  playBtn.className = "cg-btn cg-btn-primary cg-deck-row-play";
  playBtn.textContent = "Play";
  playBtn.disabled = !valid;
  playBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onPlay?.(deck);
  });
  actions.appendChild(playBtn);

  const editBtn = document.createElement("button");
  editBtn.className = "cg-btn";
  editBtn.textContent = "Edit";
  editBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    callbacks.onEdit?.(deck);
  });
  actions.appendChild(editBtn);

  const moreBtn = document.createElement("button");
  moreBtn.className = "cg-btn cg-deck-row-more";
  moreBtn.textContent = "···";
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    showDeckMenu(row, deck, callbacks);
  });
  actions.appendChild(moreBtn);

  row.appendChild(actions);

  // Row click → select deck
  row.addEventListener("click", () => callbacks.onSelect?.(deck));

  return row;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Context Menu
   ═══════════════════════════════════════════════════════════════════════════ */

function showDeckMenu(anchor, deck, callbacks) {
  // Remove any existing menu
  anchor.querySelector(".cg-deck-menu")?.remove();

  const menu = document.createElement("div");
  menu.className = "cg-deck-menu";

  const items = [
    { label: "Copy Code", action: () => callbacks.onCopyCode?.(deck) },
    { label: "Duplicate", action: () => callbacks.onDuplicate?.(deck) },
    { label: "Rename", action: () => callbacks.onRename?.(deck) },
    { label: "Favorite", action: () => callbacks.onFavorite?.(deck) },
    { label: "Delete", action: () => callbacks.onDelete?.(deck), danger: true },
  ];

  for (const item of items) {
    const btn = document.createElement("button");
    btn.className = `cg-deck-menu-item${item.danger ? " danger" : ""}`;
    btn.textContent = item.label;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.remove();
      item.action();
    });
    menu.appendChild(btn);
  }

  // Close on outside click
  const closeHandler = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 0);

  anchor.style.position = "relative";
  menu.style.position = "absolute";
  menu.style.right = "0";
  menu.style.top = "100%";
  menu.style.zIndex = "10";
  anchor.appendChild(menu);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Warnings (§8.1 better-than)
   ═══════════════════════════════════════════════════════════════════════════ */

function buildDeckWarnings(metrics, deck, cardLookup) {
  const w = [];
  if (metrics.avgCost > 5)      w.push("Weak curve — too expensive");
  if (metrics.avgCost > 0 && metrics.avgCost < 1.8) w.push("Weak curve — too cheap");

  // Count volatile (unstable) cards
  // Support both deck.cardKeys (legacy) and deck.cards [{id,count}] (deckbuilder)
  const rawIds = Array.isArray(deck.cardKeys) && deck.cardKeys.length
    ? deck.cardKeys
    : (Array.isArray(deck.cards) ? deck.cards.flatMap(e => typeof e === 'string' ? [e] : Array(e.count || 1).fill(e.id)) : []);
  const cards = rawIds.map(k => cardLookup?.get?.(k) || cardLookup?.[k]);
  const volatileCount = cards.filter(c => c?.keywords?.includes("volatile")).length;
  if (volatileCount > 8) w.push(`${volatileCount} volatile cards — risky`);

  // Check install targets
  const installTargets = cards.filter(c => c?.type === "minion").length;
  if (installTargets < 8 && cards.length >= 20) w.push("Few install targets");

  // Check patch coverage
  const patchCards = cards.filter(c => c?.type === "spell" || c?.subtype === "patch").length;
  if (patchCards < 3 && cards.length >= 20) w.push("Missing patch coverage");

  // Check framework consistency
  const frameworks = cards.filter(c => c?.type === "framework");
  if (frameworks.length > 0) {
    const fwNames = new Set(frameworks.map(f => f.name));
    if (fwNames.size > 3) w.push("Too many frameworks — unfocused");
  }

  return w;
}
