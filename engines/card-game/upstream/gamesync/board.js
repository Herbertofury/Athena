/**
 * @module cardgame/board
 * @description Battlefield DOM construction — hero portraits, board slots,
 * hand fan, mana bar, targeting, and morphdom-compatible keyed rendering.
 *
 * Pure render functions: state in → DOM out. No mutation of game state.
 */

import { KEYWORDS } from "./cards.js";
import { KEYWORD_ICONS, POWER_ICONS, iconEl } from "./icons.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Card Element Builder
   ═══════════════════════════════════════════════════════════════════════════ */

export function cardEl(card, opts = {}) {
  const mode = opts.mode || "";
  const rarity = (card.rarity || "common").toLowerCase();
  const selected = opts.selected || false;
  const exhausted = opts.exhausted || false;
  const sleeping = opts.sleeping || false;
  const onClick = opts.onClick || null;
  const onDragStart = opts.onDragStart || null;

  const el = document.createElement("div");
  el.className = `cg-card rarity-${rarity}`;
  if (mode) el.classList.add(`mode-${mode}`);
  if (selected) el.classList.add("selected");
  if (exhausted) el.classList.add("exhausted");
  if (sleeping) el.classList.add("sleeping");
  el.dataset.cardId = card.id || "";
  if (opts.key) el.dataset.key = opts.key;
  if (opts.boardIdx != null) el.dataset.boardIdx = opts.boardIdx;

  // Cover area
  const cover = document.createElement("div");
  cover.className = "cg-card-cover";

  // Parchment paper with art
  const paper = document.createElement("div");
  paper.className = "cg-card-paper";
  // Prefer portrait (600x900) art for cards — best fit for card frame
  const imgSrc = card.portraitUrl || card.image || card.coverUrl;
  if (imgSrc) {
    const img = document.createElement("img");
    img.src = imgSrc;
    img.alt = card.title || card.name || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => {
      // Replace broken image with stylish gradient placeholder
      img.remove();
      _applyArtFallback(paper, card, rarity);
    };
    paper.appendChild(img);
  } else {
    _applyArtFallback(paper, card, rarity);
  }
  cover.appendChild(paper);

  // Mana badge
  const manaBadge = document.createElement("div");
  manaBadge.className = "cg-badge cg-mana";
  manaBadge.innerHTML = `<span>${card.cost ?? 0}</span>`;
  cover.appendChild(manaBadge);

  // Attack badge (minions and weapons)
  if (card.type !== "spell" || card.attack > 0) {
    const atkBadge = document.createElement("div");
    atkBadge.className = "cg-badge cg-atk";
    atkBadge.innerHTML = `<span>${card.attack ?? 0}</span>`;
    cover.appendChild(atkBadge);
  }

  // Health badge
  if (card.type !== "spell") {
    const hpBadge = document.createElement("div");
    hpBadge.className = "cg-badge cg-hp";
    hpBadge.innerHTML = `<span>${opts.currentHp ?? card.health ?? 0}</span>`;
    if (opts.damaged) hpBadge.classList.add("damaged");
    if (opts.buffed) hpBadge.classList.add("buffed");
    cover.appendChild(hpBadge);
  }

  // Card type tag
  if (card.type && card.type !== "minion") {
    const typeTag = document.createElement("div");
    typeTag.className = "cg-card-type";
    typeTag.textContent = card.type;
    cover.appendChild(typeTag);
  }

  el.appendChild(cover);

  // Meta area
  const meta = document.createElement("div");
  meta.className = "cg-card-meta";

  const nameEl = document.createElement("div");
  nameEl.className = "cg-card-name";
  nameEl.textContent = card.title || card.name || "Unknown";
  meta.appendChild(nameEl);

  if (card.description || card.flavor) {
    const desc = document.createElement("div");
    desc.className = "cg-card-desc";
    desc.textContent = card.description || card.flavor || "";
    meta.appendChild(desc);
  }

  el.appendChild(meta);

  // Keywords
  const kws = card.keywords || [];
  if (kws.length > 0) {
    const kwsWrap = document.createElement("div");
    kwsWrap.className = "cg-keywords";
    for (const kw of kws) {
      const kwEl = document.createElement("span");
      kwEl.className = `cg-kw cg-kw-${kw}`;
      const kwDef = KEYWORDS[kw];
      const kwSvg = KEYWORD_ICONS[kw];
      if (kwSvg) {
        kwEl.appendChild(iconEl(kwSvg, "cg-kw-icon"));
      }
      const kwLabel = document.createTextNode(kwDef ? kwDef.name : kw);
      kwEl.appendChild(kwLabel);
      kwEl.title = kwDef ? kwDef.description : kw;
      kwsWrap.appendChild(kwEl);
    }
    el.appendChild(kwsWrap);
  }

  if (onClick) el.addEventListener("click", () => onClick(card, opts));
  if (onDragStart) {
    el.draggable = true;
    el.addEventListener("dragstart", (e) => onDragStart(e, card, opts));
  }

  return el;
}

/* ── Art fallback: stylish gradient + initial when image fails ── */
const _RARITY_GRADIENT = {
  common:    ["#4a4a52", "#2a2a30"],
  rare:      ["#1a3a6e", "#0e1e3a"],
  epic:      ["#4a1a6e", "#2a0e3a"],
  legendary: ["#6e4a0a", "#3a2a06"],
};
function _applyArtFallback(paper, card, rarity) {
  const [c1, c2] = _RARITY_GRADIENT[rarity] || _RARITY_GRADIENT.common;
  const initial = (card.title || card.name || "?").charAt(0).toUpperCase();
  paper.style.background = `linear-gradient(135deg, ${c1}, ${c2})`;
  paper.style.display = "flex";
  paper.style.alignItems = "center";
  paper.style.justifyContent = "center";
  const span = document.createElement("span");
  span.textContent = initial;
  span.style.cssText = `font-size:2.4em;font-weight:900;color:rgba(255,255,255,.35);text-shadow:0 2px 8px rgba(0,0,0,.5);pointer-events:none;`;
  paper.appendChild(span);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Back (Opponent Hand)
   ═══════════════════════════════════════════════════════════════════════════ */

export function cardBackEl() {
  const el = document.createElement("div");
  el.className = "cg-card-back";
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hero Portrait
   ═══════════════════════════════════════════════════════════════════════════ */

export function heroPortraitEl(hero, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = "cg-hero-area";
  wrap.dataset.side = opts.side || "player";

  const portrait = document.createElement("div");
  portrait.className = "cg-hero-portrait";
  portrait.dataset.side = opts.side || "player";
  if (hero?.palette?.primary) {
    portrait.style.borderColor = hero.palette.primary;
  }
  const heroInitial = hero?.name ? hero.name.charAt(0).toUpperCase() : "?";
  portrait.innerHTML = "";
  const initialSpan = document.createElement("span");
  initialSpan.className = "cg-hero-initial";
  initialSpan.textContent = heroInitial;
  if (hero?.palette?.primary) initialSpan.style.color = hero.palette.primary;
  portrait.appendChild(initialSpan);
  if (opts.targetable) portrait.classList.add("targetable");
  if (opts.onClick) portrait.addEventListener("click", () => opts.onClick(opts.side));

  // HP
  const hpEl = document.createElement("div");
  hpEl.className = "cg-hero-hp";
  hpEl.textContent = opts.hp ?? 30;
  portrait.appendChild(hpEl);

  // Armor
  if (opts.armor > 0) {
    const armorEl = document.createElement("div");
    armorEl.className = "cg-hero-armor";
    armorEl.textContent = opts.armor;
    portrait.appendChild(armorEl);
  }

  wrap.appendChild(portrait);

  // Hero power
  if (hero?.powerKey) {
    const powerBtn = document.createElement("button");
    powerBtn.className = "cg-hero-power";
    if (opts.heroPowerUsed) powerBtn.classList.add("used");
    powerBtn.title = `${hero.powerName || "Power"}: ${hero.powerDesc || ""}`;
    const pwrSvg = POWER_ICONS[hero.powerIconKey || hero.powerKey];
    if (pwrSvg) {
      powerBtn.appendChild(iconEl(pwrSvg, "cg-power-icon"));
    } else {
      powerBtn.textContent = hero.powerName?.charAt(0) || "P";
    }
    if (hero.powerColor) powerBtn.style.setProperty("--power-color", hero.powerColor);
    if (opts.onHeroPower) powerBtn.addEventListener("click", () => opts.onHeroPower());
    wrap.appendChild(powerBtn);
  }

  // Mana bar
  const manaBar = buildManaBar(opts.mana ?? 0, opts.maxMana ?? 0);
  wrap.appendChild(manaBar);

  // Deck pile
  if (opts.deckCount != null) {
    const deck = document.createElement("div");
    deck.className = "cg-deck-pile";
    deck.textContent = opts.deckCount;
    wrap.appendChild(deck);
  }

  return wrap;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Mana Bar
   ═══════════════════════════════════════════════════════════════════════════ */

export function buildManaBar(current, max) {
  const bar = document.createElement("div");
  bar.className = "cg-mana-bar";
  for (let i = 0; i < 10; i++) {
    const crystal = document.createElement("div");
    crystal.className = "cg-mana-crystal";
    if (i >= max) crystal.classList.add("locked");
    else if (i >= current) crystal.classList.add("empty");
    bar.appendChild(crystal);
  }
  const text = document.createElement("span");
  text.className = "cg-mana-text";
  text.textContent = `${current}/${max}`;
  bar.appendChild(text);
  return bar;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Board Slots
   ═══════════════════════════════════════════════════════════════════════════ */

export function boardSlotsEl(minions, cardLookup, opts = {}) {
  const el = document.createElement("div");
  el.className = "cg-board-slots";
  el.dataset.side = opts.side || "player";

  // Make entire player board a drop target as fallback
  if (opts.side === "player" && opts.onSlotDrop) {
    el.addEventListener("dragover", (e) => { e.preventDefault(); });
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      // Find first empty slot index
      const emptyIdx = minions.findIndex((m, i) => !m || m.dead) !== -1
        ? minions.findIndex((m) => !m || m.dead)
        : minions.length < 7 ? minions.length : -1;
      if (emptyIdx >= 0) opts.onSlotDrop(emptyIdx, e);
    });
  }

  for (let i = 0; i < 7; i++) {
    const minion = minions[i];
    if (minion && !minion.dead) {
      const card = typeof minion.id === "string" ? cardLookup(minion.id) : null;
      const merged = { ...(card || {}), ...minion };
      // Map minion state fields to card display fields
      if (merged.hp != null && merged.health == null) merged.health = merged.hp;
      if (merged.maxHp != null && merged.maxHealth == null) merged.maxHealth = merged.maxHp;
      const isSelectedAttacker = opts.side === "player" && i === opts.selectedAttackerIdx;
      const isEnemyTargetable = opts.side === "enemy" && opts.isTargeting;
      const mEl = cardEl(merged, {
        mode: "board",
        key: `b-${opts.side}-${i}`,
        boardIdx: i,
        currentHp: minion.hp,
        exhausted: !!(minion.attackedThisTurn || (minion.frozen)),
        sleeping: !!(minion.summonedTurn === opts.currentTurn && !minion.canAttack
          && !(card?.keywords || []).includes("charge") && !(card?.keywords || []).includes("rush")),
        damaged: minion.hp < (minion.maxHp ?? card?.health ?? minion.hp),
        buffed: minion.hp > (card?.health ?? minion.maxHp ?? minion.hp),
        onClick: opts.onMinionClick,
      });
      // Visual feedback for combat targeting
      if (isSelectedAttacker) mEl.classList.add("attacker-selected");
      if (isEnemyTargetable) mEl.classList.add("targetable-enemy");
      el.appendChild(mEl);
    } else {
      const empty = document.createElement("div");
      empty.className = "cg-board-slot-empty";
      empty.dataset.slotIdx = i;
      empty.dataset.side = opts.side || "player";
      if (opts.onSlotDrop) {
        empty.addEventListener("dragover", (e) => { e.preventDefault(); empty.classList.add("drop-target"); });
        empty.addEventListener("dragleave", () => empty.classList.remove("drop-target"));
        empty.addEventListener("drop", (e) => { e.preventDefault(); empty.classList.remove("drop-target"); opts.onSlotDrop(i, e); });
      }
      el.appendChild(empty);
    }
  }

  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Hand Zone
   ═══════════════════════════════════════════════════════════════════════════ */

export function handEl(handCards, cardLookup, opts = {}) {
  const el = document.createElement("div");
  el.className = "cg-hand";

  for (let i = 0; i < handCards.length; i++) {
    const c = handCards[i];
    const card = typeof c === "string" ? cardLookup(c) : c;
    if (!card) continue;
    const playable = opts.playable ? opts.playable(card, i) : false;
    const cEl = cardEl(card, {
      mode: "hand",
      key: `h-${i}`,
      handIdx: i,
      selected: playable,
      onClick: opts.onCardClick,
      onDragStart: opts.onCardDrag,
    });
    cEl.dataset.handIdx = i;
    el.appendChild(cEl);
  }

  // Apply Hearthstone-style hand fan arc
  const count = el.children.length;
  if (count > 0) {
    const maxAngle = Math.min(count * 3, 25); // total arc spread
    for (let i = 0; i < count; i++) {
      const child = el.children[i];
      const mid = (count - 1) / 2;
      const offset = i - mid;
      const angle = (offset / Math.max(mid, 1)) * (maxAngle / 2);
      const lift = -Math.abs(offset) * 3; // cards near edges sit lower
      child.style.transform = `rotate(${angle}deg) translateY(${lift}px)`;
      child.dataset.fanAngle = angle;
      child.dataset.fanLift = lift;
      // Restore fan position on mouse leave
      child.addEventListener("mouseleave", () => {
        child.style.transform = `rotate(${angle}deg) translateY(${lift}px)`;
      });
      // Lift card up and straighten on hover
      child.addEventListener("mouseenter", () => {
        child.style.transform = "rotate(0deg) translateY(-40px) scale(1.18)";
        child.style.zIndex = "200";
      });
      child.addEventListener("mouseleave", () => {
        child.style.zIndex = "";
      });
    }
  }

  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Full Battlefield Render
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderBattlefield(match, heroes, cardLookup, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-battlefield";
  if (match.boardTheme) root.dataset.theme = match.boardTheme;

  const isTargeting = (match.selectedAttackerIdx ?? -1) >= 0;

  /* ─── Target line SVG overlay ─── */
  const targetSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  targetSvg.classList.add("cg-target-line-svg");
  targetSvg.setAttribute("width", "100%");
  targetSvg.setAttribute("height", "100%");
  targetSvg.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:100;";
  root.appendChild(targetSvg);

  /* ─── Enemy hero ─── */
  root.appendChild(heroPortraitEl(heroes.enemy, {
    side: "enemy",
    hp: match.player ? undefined : match.enemy?.hp,
    ...spreadHeroOpts(match.enemy, "enemy", callbacks),
    targetable: isTargeting,
  }));

  /* ─── Enemy hand (card backs) ─── */
  const enemyHandCount = match.enemy?.handCount || match.enemy?.hand?.length || 0;
  if (enemyHandCount > 0) {
    const enemyHand = document.createElement("div");
    enemyHand.className = "cg-hand cg-hand-enemy";
    for (let i = 0; i < enemyHandCount; i++) enemyHand.appendChild(cardBackEl());
    root.appendChild(enemyHand);
  }

  /* ─── Status row: enemy (secrets, quests, frameworks, volatility) ─── */
  root.appendChild(buildStatusRow(match.enemy, "enemy"));

  /* ─── Enemy board ─── */
  root.appendChild(boardSlotsEl(match.enemy?.board || [], cardLookup, {
    side: "enemy",
    currentTurn: match.turn_number || 0,
    onMinionClick: callbacks.onEnemyMinionClick,
    isTargeting,
  }));

  /* ─── Divider ─── */
  const div = document.createElement("div");
  div.className = "cg-board-divider";
  root.appendChild(div);

  /* ─── Player board ─── */
  root.appendChild(boardSlotsEl(match.player?.board || [], cardLookup, {
    side: "player",
    currentTurn: match.turn_number || 0,
    selectedAttackerIdx: match.selectedAttackerIdx ?? -1,
    onMinionClick: callbacks.onPlayerMinionClick,
    onSlotDrop: callbacks.onSlotDrop,
  }));

  /* ─── Status row: player ─── */
  root.appendChild(buildStatusRow(match.player, "player"));

  /* ─── Player hero ─── */
  root.appendChild(heroPortraitEl(heroes.player, {
    side: "player",
    ...spreadHeroOpts(match.player, "player", callbacks),
  }));

  /* ─── Player hand ─── */
  root.appendChild(handEl(match.player?.hand || [], cardLookup, {
    playable: callbacks.canPlayCard,
    onCardClick: callbacks.onHandCardClick,
    onCardDrag: callbacks.onHandCardDrag,
  }));

  /* ─── Card hover enlargement ─── */
  const hoverPreview = document.createElement("div");
  hoverPreview.className = "cg-hover-preview";
  hoverPreview.style.display = "none";
  root.appendChild(hoverPreview);
  root.addEventListener("mouseover", (e) => {
    const cardNode = e.target.closest(".cg-card");
    if (cardNode && !cardNode.classList.contains("mode-board")) {
      const rect = cardNode.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      hoverPreview.innerHTML = cardNode.outerHTML;
      hoverPreview.style.display = "block";
      hoverPreview.style.left = `${rect.left - rootRect.left + rect.width + 8}px`;
      hoverPreview.style.top = `${rect.top - rootRect.top}px`;
    }
  });
  root.addEventListener("mouseout", (e) => {
    if (e.target.closest(".cg-card")) hoverPreview.style.display = "none";
  });

  /* ─── End turn button with animation ─── */
  const endTurn = document.createElement("button");
  endTurn.className = `cg-btn cg-btn-end-turn${match.turn === "player" ? " pulse" : " waiting"}`;
  endTurn.textContent = match.turn === "player" ? "End Turn" : "Enemy Turn\u2026";
  if (callbacks.onEndTurn && match.turn === "player") {
    endTurn.addEventListener("click", callbacks.onEndTurn);
  }
  root.appendChild(endTurn);

  /* ─── Turn timer / rope ─── */
  if (match.turnTimer != null) {
    const rope = document.createElement("div");
    rope.className = "cg-turn-timer";
    const fill = document.createElement("div");
    fill.className = "cg-turn-timer-fill";
    const pct = Math.max(0, Math.min(100, (match.turnTimer / (match.turnTimeMax || 75)) * 100));
    fill.style.width = `${pct}%`;
    if (pct < 25) fill.classList.add("critical");
    rope.appendChild(fill);
    root.appendChild(rope);
  }

  /* ─── Combat log ─── */
  const logEntries = match.combatLog || [];
  if (logEntries.length > 0) {
    const log = document.createElement("div");
    log.className = "cg-combat-log";
    const last8 = logEntries.slice(-8);
    for (const entry of last8) {
      const row = document.createElement("div");
      row.className = "cg-combat-log-entry";
      row.textContent = typeof entry === "string" ? entry : entry.text || "";
      log.appendChild(row);
    }
    root.appendChild(log);
  }

  /* ─── Board toys (click-reactive ambient) ─── */
  const toyWrap = document.createElement("div");
  toyWrap.className = "cg-board-toys";
  toyWrap.addEventListener("click", (e) => {
    if (e.target.classList.contains("cg-board-toy")) {
      e.target.classList.add("bounce");
      setTimeout(() => e.target.classList.remove("bounce"), 400);
    }
  });
  const toyCount = 3;
  for (let i = 0; i < toyCount; i++) {
    const toy = document.createElement("div");
    toy.className = "cg-board-toy";
    toy.dataset.toyIdx = i;
    toyWrap.appendChild(toy);
  }
  root.appendChild(toyWrap);

  /* ─── Concede / Menu button (top-left overlay) ─── */
  const menuBtn = document.createElement("button");
  menuBtn.className = "cg-btn cg-match-menu-btn";
  menuBtn.textContent = "\u2630";
  menuBtn.title = "Menu / Concede";
  if (callbacks.onConcede) {
    menuBtn.addEventListener("click", () => {
      if (confirm("Concede this match?")) callbacks.onConcede();
    });
  }
  root.appendChild(menuBtn);

  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Status Row (§16.2 — quests, secrets, frameworks, attachments, volatility)
   ═══════════════════════════════════════════════════════════════════════════ */

function buildStatusRow(side, label) {
  const row = document.createElement("div");
  row.className = `cg-status-row cg-status-${label}`;
  if (!side) return row;

  const items = [];
  if (side.secrets?.length)      items.push({ icon: "\uD83D\uDD12", text: `${side.secrets.length} Secret${side.secrets.length > 1 ? "s" : ""}` });
  if (side.quests?.length)       items.push({ icon: "\u2605",        text: `${side.quests.length} Quest${side.quests.length > 1 ? "s" : ""}` });
  if (side.frameworks?.length)   items.push({ icon: "\u2692",        text: `${side.frameworks.length} Framework${side.frameworks.length > 1 ? "s" : ""}` });
  if (side.attachments?.length)  items.push({ icon: "\uD83D\uDD17",  text: `${side.attachments.length} Attach.` });
  if (side.volatility > 0)       items.push({ icon: "\u26A0",        text: `Volatility ${side.volatility}` });

  for (const it of items) {
    const badge = document.createElement("span");
    badge.className = "cg-status-badge";
    badge.textContent = `${it.icon} ${it.text}`;
    row.appendChild(badge);
  }
  return row;
}

function spreadHeroOpts(side, name, callbacks) {
  if (!side) return {};
  return {
    hp: side.hp,
    armor: side.armor || 0,
    mana: side.mana,
    maxMana: side.maxMana,
    deckCount: side.deck?.length,
    heroPowerUsed: side.heroPowerUsed,
    targetable: name === "enemy" && callbacks.isTargetingHero,
    onClick: name === "enemy" ? callbacks.onEnemyHeroClick : undefined,
    onHeroPower: name === "player" ? callbacks.onHeroPower : undefined,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Premium Drag System — Hearthstone-grade card drag & placement
   Pointer-event driven for smooth custom rendering. No HTML5 drag ghosts.
   ═══════════════════════════════════════════════════════════════════════════ */

export function initDragSystem(battlefieldEl, callbacks) {
  let _dragging = false;
  let _dragCard = null;     // card data
  let _dragHandIdx = -1;
  let _dragGhost = null;    // floating clone DOM element
  let _dragArrow = null;    // SVG targeting arrow
  let _originX = 0;
  let _originY = 0;
  let _hoveredSlot = null;
  let _rafId = 0;

  const DRAG_THRESHOLD = 6; // px before drag activates
  let _startX = 0, _startY = 0, _dragActivated = false;

  // Listen on hand cards
  battlefieldEl.addEventListener("pointerdown", onPointerDown, { passive: false });

  function onPointerDown(e) {
    const handCard = e.target.closest(".cg-hand .cg-card");
    if (!handCard) return;
    const handIdx = parseInt(handCard.dataset.handIdx, 10);
    if (Number.isNaN(handIdx) || handIdx < 0) return;

    // Check if this card is playable (has 'selected' class = affordable)
    const cardId = handCard.dataset.cardId;
    if (!cardId) return;

    _dragHandIdx = handIdx;
    _dragCard = { id: cardId, el: handCard };
    _startX = e.clientX;
    _startY = e.clientY;
    _dragActivated = false;

    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("pointercancel", onPointerUp);
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!_dragCard) return;

    const dx = e.clientX - _startX;
    const dy = e.clientY - _startY;

    if (!_dragActivated) {
      if (Math.abs(dx) + Math.abs(dy) < DRAG_THRESHOLD) return;
      _dragActivated = true;
      _dragging = true;
      createDragGhost(e);
      _dragCard.el.classList.add("cg-drag-source");
      showDropZones(true);
    }

    if (!_dragGhost) return;

    // Position ghost centered on pointer
    const gw = _dragGhost.offsetWidth || 140;
    const gh = _dragGhost.offsetHeight || 180;
    _dragGhost.style.left = `${e.clientX - gw / 2}px`;
    _dragGhost.style.top = `${e.clientY - gh / 2}px`;

    // Draw targeting arrow from origin to current position
    updateTargetArrow(e.clientX, e.clientY);

    // Highlight hovered drop slot
    updateHoveredSlot(e.clientX, e.clientY);
  }

  function onPointerUp(e) {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("pointercancel", onPointerUp);

    if (!_dragActivated) {
      // Was a click, not a drag — let the click handler handle it
      cleanup();
      return;
    }

    // Determine drop target
    const slot = getSlotAt(e.clientX, e.clientY);
    if (slot != null && _dragHandIdx >= 0) {
      // Animate card snapping to board position
      animateSnapToSlot(slot, () => {
        callbacks.onCardDropped?.(_dragHandIdx, slot);
        cleanup();
      });
    } else {
      // Return to hand — bounce back animation
      animateReturnToHand(() => {
        cleanup();
      });
    }
  }

  function createDragGhost(e) {
    const sourceEl = _dragCard.el;
    _dragGhost = sourceEl.cloneNode(true);
    _dragGhost.className = "cg-drag-ghost";
    _dragGhost.style.cssText = `
      position: fixed;
      z-index: 9999;
      pointer-events: none;
      width: ${sourceEl.offsetWidth * 1.15}px;
      transform: rotate(-2deg) scale(1.15);
      transition: transform 80ms ease;
      filter: drop-shadow(0 12px 30px rgba(0,0,0,.6)) drop-shadow(0 0 20px rgba(122,255,196,.3));
    `;
    document.body.appendChild(_dragGhost);

    // Store origin for arrow
    const rect = sourceEl.getBoundingClientRect();
    _originX = rect.left + rect.width / 2;
    _originY = rect.top;

    // Create targeting arrow SVG overlay
    _dragArrow = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    _dragArrow.style.cssText = `
      position: fixed; inset: 0; width: 100vw; height: 100vh;
      pointer-events: none; z-index: 9998;
    `;
    _dragArrow.innerHTML = `
      <defs>
        <linearGradient id="cg-drag-arrow-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(122,255,196,.7)" />
          <stop offset="100%" stop-color="rgba(74,144,255,.5)" />
        </linearGradient>
        <filter id="cg-drag-glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <path class="cg-drag-arrow-path" fill="none" stroke="url(#cg-drag-arrow-grad)"
            stroke-width="3" stroke-linecap="round" filter="url(#cg-drag-glow)" d="M0,0"/>
    `;
    document.body.appendChild(_dragArrow);
  }

  function updateTargetArrow(mx, my) {
    if (!_dragArrow) return;
    const path = _dragArrow.querySelector(".cg-drag-arrow-path");
    if (!path) return;
    // Quadratic bezier from origin hand position to cursor
    const cpx = (mx + _originX) / 2;
    const cpy = Math.min(my, _originY) - 40;
    path.setAttribute("d", `M${_originX},${_originY} Q${cpx},${cpy} ${mx},${my}`);
  }

  function showDropZones(show) {
    const slots = battlefieldEl.querySelectorAll('.cg-board-slots[data-side="player"] .cg-board-slot-empty');
    const playerBoard = battlefieldEl.querySelector('.cg-board-slots[data-side="player"]');
    if (show) {
      slots.forEach(s => s.classList.add("cg-drop-ready"));
      if (playerBoard) playerBoard.classList.add("cg-board-drop-active");
    } else {
      slots.forEach(s => s.classList.remove("cg-drop-ready", "cg-drop-hover"));
      if (playerBoard) playerBoard.classList.remove("cg-board-drop-active");
    }
  }

  function updateHoveredSlot(mx, my) {
    const slots = battlefieldEl.querySelectorAll('.cg-board-slots[data-side="player"] .cg-board-slot-empty');
    let found = null;
    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        found = slot;
        break;
      }
    }
    if (_hoveredSlot && _hoveredSlot !== found) {
      _hoveredSlot.classList.remove("cg-drop-hover");
    }
    if (found) {
      found.classList.add("cg-drop-hover");
      if (_dragGhost) _dragGhost.style.transform = "rotate(0deg) scale(1.18)";
    } else {
      if (_dragGhost) _dragGhost.style.transform = "rotate(-2deg) scale(1.15)";
    }
    _hoveredSlot = found;
  }

  function getSlotAt(mx, my) {
    // Check player board slots
    const slots = battlefieldEl.querySelectorAll('.cg-board-slots[data-side="player"] .cg-board-slot-empty');
    for (const slot of slots) {
      const rect = slot.getBoundingClientRect();
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        return parseInt(slot.dataset.slotIdx, 10);
      }
    }
    // Also check if pointer is over the player board area generally
    const playerBoard = battlefieldEl.querySelector('.cg-board-slots[data-side="player"]');
    if (playerBoard) {
      const rect = playerBoard.getBoundingClientRect();
      if (mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom) {
        // Find next available slot
        const allSlots = playerBoard.querySelectorAll(".cg-board-slot-empty");
        if (allSlots.length > 0) {
          return parseInt(allSlots[0].dataset.slotIdx, 10);
        }
      }
    }
    return null;
  }

  function animateSnapToSlot(slotIdx, onDone) {
    if (!_dragGhost) { onDone(); return; }
    const slot = battlefieldEl.querySelector(`.cg-board-slots[data-side="player"] [data-slot-idx="${slotIdx}"]`);
    if (!slot) { onDone(); return; }

    const slotRect = slot.getBoundingClientRect();
    const tx = slotRect.left + slotRect.width / 2 - (_dragGhost.offsetWidth / 2);
    const ty = slotRect.top + slotRect.height / 2 - (_dragGhost.offsetHeight / 2);

    _dragGhost.style.transition = "all 150ms cubic-bezier(.17,.67,.32,1.2)";
    _dragGhost.style.left = `${tx}px`;
    _dragGhost.style.top = `${ty}px`;
    _dragGhost.style.transform = "rotate(0deg) scale(1)";
    _dragGhost.style.opacity = "0.8";

    // Flash impact glow on slot
    slot.classList.add("cg-drop-impact");
    setTimeout(() => slot.classList.remove("cg-drop-impact"), 400);

    setTimeout(onDone, 160);
  }

  function animateReturnToHand(onDone) {
    if (!_dragGhost || !_dragCard?.el) { onDone(); return; }
    const handRect = _dragCard.el.getBoundingClientRect();
    _dragGhost.style.transition = "all 200ms cubic-bezier(.25,.46,.45,.94)";
    _dragGhost.style.left = `${handRect.left}px`;
    _dragGhost.style.top = `${handRect.top}px`;
    _dragGhost.style.transform = "rotate(0deg) scale(1)";
    _dragGhost.style.opacity = "0.5";

    setTimeout(onDone, 210);
  }

  function cleanup() {
    if (_dragGhost) { _dragGhost.remove(); _dragGhost = null; }
    if (_dragArrow) { _dragArrow.remove(); _dragArrow = null; }
    if (_dragCard?.el) _dragCard.el.classList.remove("cg-drag-source");
    showDropZones(false);
    _dragging = false;
    _dragCard = null;
    _dragHandIdx = -1;
    _hoveredSlot = null;
    _dragActivated = false;
    cancelAnimationFrame(_rafId);
  }

  return {
    destroy() {
      cleanup();
      battlefieldEl.removeEventListener("pointerdown", onPointerDown);
    },
    get isDragging() { return _dragging; },
  };
}
