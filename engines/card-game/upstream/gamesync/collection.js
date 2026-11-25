/**
 * @module cardgame/collection
 * @description Collection manager — browse, search, filter, inspect cards.
 * Reads from profile.collection.ownedCards, renders into .cg-collection.
 *
 * §9: 15 browse dimensions, 22+ search tokens, card detail panel.
 */

import { searchCards, CARD_TYPES, RARITY_ORDER, RARITY_DUST_COST, RARITY_DUST_REFUND, KEYWORDS } from "./cards.js";
import { cardEl } from "./board.js";
import { computeDeckMetrics } from "./deckbuilder.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Filter Chips — 15+ browse dimensions (§9.1 / §9.2)
   ═══════════════════════════════════════════════════════════════════════════ */

const FILTER_CHIPS = [
  // Core type/source
  { id: "all",        label: "All",          group: "browse" },
  { id: "games",      label: "Games",        group: "source" },
  { id: "mods",       label: "Mods",         group: "source" },
  { id: "heroes",     label: "Heroes",       group: "source" },
  // Card types
  { id: "minion",     label: "Minions",      group: "type" },
  { id: "spell",      label: "Spells",       group: "type" },
  { id: "framework",  label: "Frameworks",   group: "type" },
  { id: "weapon",     label: "Weapons",      group: "type" },
  // Rarities
  { id: "common",     label: "Common",       group: "rarity" },
  { id: "rare",       label: "Rare",         group: "rarity" },
  { id: "epic",       label: "Epic",         group: "rarity" },
  { id: "legendary",  label: "Legendary",    group: "rarity" },
  // State / ownership
  { id: "new",        label: "New",          group: "state" },
  { id: "owned",      label: "Owned",        group: "state" },
  { id: "unowned",    label: "Missing",      group: "state" },
  { id: "favorite",   label: "Favorites",    group: "state" },
  { id: "craftable",  label: "Craftable",    group: "state" },
  { id: "premium",    label: "Premium",      group: "state" },
  // Keywords
  { id: "kw_taunt",   label: "Taunt",        group: "keyword" },
  { id: "kw_charge",  label: "Charge",       group: "keyword" },
  { id: "kw_shield",  label: "Shield",       group: "keyword" },
  { id: "kw_rush",    label: "Rush",         group: "keyword" },
  { id: "kw_stealth", label: "Stealth",      group: "keyword" },
  { id: "kw_lifesteal", label: "Lifesteal",  group: "keyword" },
  { id: "kw_volatile", label: "Volatile",    group: "keyword" },
  { id: "kw_stable",  label: "Stable",       group: "keyword" },
  { id: "kw_patch",   label: "Patch",        group: "keyword" },
  { id: "kw_discover", label: "Discover",    group: "keyword" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Render Collection Screen
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderCollection(poolArray, profile, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-collection";

  const owned = profile?.collection?.ownedCards || {};
  const newCards = profile?.collection?.newCards || {};
  const favorites = profile?.collection?.favorites || {};

  /* ─── Toolbar ─── */
  const toolbar = document.createElement("div");
  toolbar.className = "cg-collection-toolbar";

  const searchInput = document.createElement("input");
  searchInput.className = "cg-collection-search";
  searchInput.type = "text";
  searchInput.placeholder = "Search… cost:<=3 rarity:epic keyword:taunt hero:steam genre:rpg";
  toolbar.appendChild(searchInput);

  // Sort dropdown
  const sortSel = document.createElement("select");
  sortSel.className = "cg-btn";
  sortSel.innerHTML = `
    <option value="cost">Cost</option>
    <option value="name">Name</option>
    <option value="rarity">Rarity</option>
    <option value="atk">Attack</option>
    <option value="hp">Health</option>
    <option value="owned-count">Owned Count</option>
    <option value="newest">Newest First</option>
  `;
  toolbar.appendChild(sortSel);

  root.appendChild(toolbar);

  /* ─── Filter chips, grouped ─── */
  const filtersWrap = document.createElement("div");
  filtersWrap.className = "cg-collection-filters";
  let activeFilter = "all";

  const chipGroups = {};
  for (const chip of FILTER_CHIPS) {
    if (!chipGroups[chip.group]) chipGroups[chip.group] = [];
    chipGroups[chip.group].push(chip);
  }
  for (const [groupName, chips] of Object.entries(chipGroups)) {
    if (groupName !== "browse") {
      const sep = document.createElement("span");
      sep.className = "cg-filter-sep";
      sep.textContent = "|";
      filtersWrap.appendChild(sep);
    }
    for (const chip of chips) {
      const btn = document.createElement("button");
      btn.className = `cg-filter-chip${chip.id === "all" ? " active" : ""}`;
      btn.textContent = chip.label;
      btn.dataset.filter = chip.id;
      btn.addEventListener("click", () => {
        activeFilter = chip.id;
        filtersWrap.querySelectorAll(".cg-filter-chip").forEach(c => c.classList.remove("active"));
        btn.classList.add("active");
        refresh();
      });
      filtersWrap.appendChild(btn);
    }
  }
  root.appendChild(filtersWrap);

  /* ─── Status bar: card count + completion ─── */
  const statusBar = document.createElement("div");
  statusBar.className = "cg-collection-status";
  const countEl = document.createElement("span");
  countEl.className = "cg-collection-count";
  statusBar.appendChild(countEl);
  const completionEl = document.createElement("span");
  completionEl.className = "cg-collection-completion";
  statusBar.appendChild(completionEl);
  root.appendChild(statusBar);

  /* ─── Deck slots quick-access ─── */
  const deckSlotsWrap = document.createElement("div");
  deckSlotsWrap.className = "cg-collection-decks";
  const decks = profile?.decks || [];
  if (decks.length > 0) {
    const slotsLabel = document.createElement("span");
    slotsLabel.className = "cg-collection-decks-label";
    slotsLabel.textContent = "Decks:";
    deckSlotsWrap.appendChild(slotsLabel);
    for (const dk of decks.slice(0, 9)) {
      const slot = document.createElement("button");
      slot.className = "cg-btn cg-deck-slot-btn";
      slot.textContent = dk.name || "Unnamed";
      slot.title = `${dk.cards?.length || 0} unique cards`;
      slot.addEventListener("click", () => callbacks.onDeckClick?.(dk));
      deckSlotsWrap.appendChild(slot);
    }
  }
  root.appendChild(deckSlotsWrap);

  /* ─── Grid ─── */
  const grid = document.createElement("div");
  grid.className = "cg-collection-grid";
  root.appendChild(grid);

  /* ─── Filtering (15+ browse dimensions) ─── */
  function filterCards(entries) {
    let result = entries;
    const f = activeFilter;

    // Source filters
    if (f === "games")     return result.filter(e => e.card?.source === "game");
    if (f === "mods")      return result.filter(e => e.card?.source === "mod");
    if (f === "heroes")    return result.filter(e => e.card?.heroId);
    // Type filters
    if (f === "minion")    return result.filter(e => e.card?.type === "minion");
    if (f === "spell")     return result.filter(e => e.card?.type === "spell");
    if (f === "framework") return result.filter(e => e.card?.type === "framework");
    if (f === "weapon")    return result.filter(e => e.card?.type === "weapon");
    // Rarity filters
    if (f === "common")    return result.filter(e => e.card?.rarity === "common");
    if (f === "rare")      return result.filter(e => e.card?.rarity === "rare");
    if (f === "epic")      return result.filter(e => e.card?.rarity === "epic");
    if (f === "legendary") return result.filter(e => e.card?.rarity === "legendary");
    // State filters
    if (f === "new")       return result.filter(e => newCards[e.card?.id]);
    if (f === "owned")     return result.filter(e => (owned[e.card?.id] || 0) > 0);
    if (f === "unowned")   return result.filter(e => !(owned[e.card?.id] > 0));
    if (f === "favorite")  return result.filter(e => favorites[e.card?.id]);
    if (f === "craftable") return result.filter(e => !(owned[e.card?.id] > 0) && RARITY_DUST_COST[e.card?.rarity]);
    if (f === "premium")   return result.filter(e => e.card?.premium);
    // Keyword filters
    if (f.startsWith("kw_")) {
      const kw = f.slice(3);
      return result.filter(e => (e.card?.keywords || []).includes(kw));
    }

    return result;
  }

  function sortCards(entries) {
    const sk = sortSel.value;
    return [...entries].sort((a, b) => {
      const ac = a.card || a;
      const bc = b.card || b;
      switch (sk) {
        case "cost": return (ac.cost || 0) - (bc.cost || 0);
        case "name": return (ac.title || ac.name || "").localeCompare(bc.title || bc.name || "");
        case "rarity": return (RARITY_ORDER[ac.rarity] || 0) - (RARITY_ORDER[bc.rarity] || 0);
        case "atk": return (bc.attack || 0) - (ac.attack || 0);
        case "hp": return (bc.health || 0) - (ac.health || 0);
        case "owned-count": return (owned[bc.id] || 0) - (owned[ac.id] || 0);
        case "newest": return (newCards[bc.id] ? 1 : 0) - (newCards[ac.id] ? 1 : 0);
        default: return 0;
      }
    });
  }

  /* ─── Refresh ─── */
  function refresh() {
    const query = searchInput.value.trim();
    let entries = query ? searchCards(poolArray, query) : poolArray;
    entries = filterCards(entries);
    entries = sortCards(entries);

    countEl.textContent = `${entries.length} card${entries.length !== 1 ? "s" : ""}`;

    // Collection completion
    const totalUnique = poolArray.length;
    const ownedUnique = poolArray.filter(e => (owned[e.card?.id || e.id] || 0) > 0).length;
    const pct = totalUnique > 0 ? Math.round((ownedUnique / totalUnique) * 100) : 0;
    completionEl.textContent = `${ownedUnique}/${totalUnique} unique (${pct}%)`;

    // Render all cards synchronously (Rule 0: no scroll gating)
    grid.innerHTML = "";
    for (const entry of entries) {
      const card = entry.card || entry;
      const count = owned[card.id] || 0;
      const isNew = !!newCards[card.id];
      const isFav = !!favorites[card.id];
      const el = cardEl(card, {
        mode: "collection",
        onClick: (c) => {
          // Open detail panel on click
          const detailPane = renderCardDetail(c, profile, poolArray, {
            onAddToDeck: callbacks.onAddToDeck,
            onCraft: callbacks.onCraft,
            onDisenchant: callbacks.onDisenchant,
            onFavorite: (crd) => {
              profile.collection.favorites = profile.collection.favorites || {};
              profile.collection.favorites[crd.id] = !profile.collection.favorites[crd.id];
              refresh();
            },
            onBuildAround: callbacks.onBuildAround,
          });
          root.appendChild(detailPane);
        },
      });
      if (count === 0) el.classList.add("unowned");
      if (isNew) el.classList.add("is-new");
      if (isFav) el.classList.add("is-favorite");
      grid.appendChild(el);
    }
  }

  // Events
  searchInput.addEventListener("input", debounce(refresh, 200));
  sortSel.addEventListener("change", refresh);

  // Initial render
  refresh();

  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Card Detail Panel — Premium Inspection (§9.4 + §9.5)
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderCardDetail(card, profile, poolArray, callbacks = {}) {
  const overlay = document.createElement("div");
  overlay.className = "cg-overlay";

  const modal = document.createElement("div");
  modal.className = "cg-modal cg-card-detail-modal";

  const owned = profile?.collection?.ownedCards?.[card.id] || 0;
  const favorites = profile?.collection?.favorites || {};
  const isFav = !!favorites[card.id];
  const dustCost = RARITY_DUST_COST[card.rarity] || 0;
  const dustRefund = RARITY_DUST_REFUND[card.rarity] || 0;
  const playerDust = profile?.collection?.dust || 0;

  // Deck usage count
  const decks = profile?.decks || [];
  const deckUsage = decks.filter(d => (d.cards || []).some(c => c.id === card.id)).length;

  // Find related cards (same keywords, same heroId, same developer)
  const relatedCards = (poolArray || [])
    .filter(e => {
      const c = e.card || e;
      if (c.id === card.id) return false;
      const sharedKw = (c.keywords || []).filter(k => (card.keywords || []).includes(k));
      return sharedKw.length > 0 || c.heroId === card.heroId || c.developer === card.developer;
    })
    .slice(0, 6);

  // Find best decks using this card
  const usingDecks = decks.filter(d => (d.cards || []).some(c => c.id === card.id));

  // Synergy tag hints
  const synergyTags = [];
  if (card.keywords?.includes("taunt")) synergyTags.push("Defensive");
  if (card.keywords?.includes("charge") || card.keywords?.includes("rush")) synergyTags.push("Aggressive");
  if (card.keywords?.includes("discover")) synergyTags.push("Value");
  if (card.keywords?.includes("lifesteal")) synergyTags.push("Sustain");
  if (card.keywords?.includes("volatile")) synergyTags.push("High Risk");
  if (card.keywords?.includes("stable")) synergyTags.push("Reliable");
  if (card.type === "framework") synergyTags.push("Engine");
  if (card.keywords?.includes("patch")) synergyTags.push("Support");

  // Warnings
  const warnings = [];
  if (card.keywords?.includes("volatile")) warnings.push("High volatility — pair with stable frameworks.");
  if ((card.cost || 0) >= 8) warnings.push("Very expensive — ensure enough early game.");
  if (card.keywords?.includes("poisonous") && card.keywords?.includes("stealth")) warnings.push("Powerful combo piece.");

  // "Why this card is good" analysis (§9.5)
  const whyGood = [];
  if (card.rarity === "legendary") whyGood.push("Legendary rarity — powerful unique effect.");
  if (card.keywords?.includes("taunt") && card.health >= 5) whyGood.push("Strong defensive presence.");
  if (card.keywords?.includes("charge") && card.attack >= 4) whyGood.push("Immediate high damage impact.");
  if (card.type === "framework") whyGood.push("Frameworks provide persistent value every turn.");
  if ((card.cost || 0) <= 2 && (card.attack || 0) >= 2) whyGood.push("Efficient early-game tempo play.");

  // Best targets for mod cards
  const bestTargets = [];
  if (card.source === "mod" && card.targetGame) bestTargets.push(card.targetGame);
  if (card.platforms?.length) bestTargets.push(...card.platforms);

  /* ─── Build modal content ─── */
  const left = document.createElement("div");
  left.className = "cg-detail-left";
  const preview = cardEl(card, { mode: "collection" });
  preview.style.maxWidth = "180px";
  preview.style.pointerEvents = "none";
  if (card.premium) preview.classList.add("cg-premium-shimmer");
  left.appendChild(preview);

  const right = document.createElement("div");
  right.className = "cg-detail-right";

  // Title + rarity
  right.innerHTML = `
    <div class="cg-detail-title">${escHtml(card.name || "")}</div>
    <div class="cg-detail-subtitle">
      ${card.type || "minion"} · ${card.rarity || "common"} · Cost ${card.cost ?? 0}
      ${card.attack != null ? ` · ${card.attack} ATK` : ""}
      ${card.health != null ? ` · ${card.health} HP` : ""}
    </div>
  `;

  // Rules text
  if (card.description) {
    const rules = document.createElement("div");
    rules.className = "cg-detail-rules";
    rules.textContent = card.description;
    right.appendChild(rules);
  }

  // Flavor text
  if (card.flavor) {
    const flavor = document.createElement("div");
    flavor.className = "cg-detail-flavor";
    flavor.textContent = card.flavor;
    right.appendChild(flavor);
  }

  // Source / set / hero affinity
  const meta = document.createElement("div");
  meta.className = "cg-detail-meta";
  const metaParts = [];
  if (card.set) metaParts.push(`Set: ${card.set}`);
  if (card.developer) metaParts.push(`From: ${card.developer}`);
  if (card.heroId) metaParts.push(`Hero: ${card.heroId}`);
  metaParts.push(`Owned: ${owned}`);
  metaParts.push(`In ${deckUsage} deck${deckUsage !== 1 ? "s" : ""}`);
  meta.textContent = metaParts.join(" · ");
  right.appendChild(meta);

  // Keywords
  if (card.keywords?.length) {
    const kwRow = document.createElement("div");
    kwRow.className = "cg-detail-keywords";
    for (const kw of card.keywords) {
      const badge = document.createElement("span");
      badge.className = `cg-kw cg-kw-${kw}`;
      badge.textContent = kw;
      badge.title = KEYWORDS[kw]?.description || "";
      kwRow.appendChild(badge);
    }
    right.appendChild(kwRow);
  }

  // Synergy tags
  if (synergyTags.length) {
    const synRow = document.createElement("div");
    synRow.className = "cg-detail-synergy";
    synRow.innerHTML = `<span class="cg-detail-synergy-label">Synergy:</span> `;
    for (const tag of synergyTags) {
      const badge = document.createElement("span");
      badge.className = "cg-synergy-badge";
      badge.textContent = tag;
      synRow.appendChild(badge);
    }
    right.appendChild(synRow);
  }

  // Why this card is good (§9.5)
  if (whyGood.length) {
    const whySection = document.createElement("div");
    whySection.className = "cg-detail-why";
    whySection.innerHTML = `<div class="cg-detail-section-label">Why this card is good</div>`;
    for (const reason of whyGood) {
      const r = document.createElement("div");
      r.className = "cg-detail-why-item";
      r.textContent = reason;
      whySection.appendChild(r);
    }
    right.appendChild(whySection);
  }

  // Best targets for mod cards
  if (bestTargets.length) {
    const targetSection = document.createElement("div");
    targetSection.className = "cg-detail-targets";
    targetSection.innerHTML = `<div class="cg-detail-section-label">Best targets</div>`;
    targetSection.innerHTML += bestTargets.map(t => `<span class="cg-synergy-badge">${escHtml(t)}</span>`).join(" ");
    right.appendChild(targetSection);
  }

  // Warnings
  if (warnings.length) {
    const warnSection = document.createElement("div");
    warnSection.className = "cg-detail-warnings";
    for (const w of warnings) {
      const we = document.createElement("div");
      we.className = "cg-detail-warning-item";
      we.textContent = w;
      warnSection.appendChild(we);
    }
    right.appendChild(warnSection);
  }

  // Recommended decks using this card
  if (usingDecks.length) {
    const recSection = document.createElement("div");
    recSection.className = "cg-detail-rec-decks";
    recSection.innerHTML = `<div class="cg-detail-section-label">Decks using this card</div>`;
    for (const dk of usingDecks.slice(0, 3)) {
      const de = document.createElement("div");
      de.className = "cg-detail-rec-deck";
      de.textContent = dk.name || "Unnamed";
      recSection.appendChild(de);
    }
    right.appendChild(recSection);
  }

  // Related cards
  if (relatedCards.length) {
    const relSection = document.createElement("div");
    relSection.className = "cg-detail-related";
    relSection.innerHTML = `<div class="cg-detail-section-label">Related cards</div>`;
    const relGrid = document.createElement("div");
    relGrid.className = "cg-detail-related-grid";
    for (const re of relatedCards) {
      const rc = re.card || re;
      const rEl = cardEl(rc, { mode: "collection" });
      rEl.style.maxWidth = "90px";
      rEl.style.fontSize = "9px";
      rEl.addEventListener("click", () => {
        overlay.remove();
        const next = renderCardDetail(rc, profile, poolArray, callbacks);
        document.querySelector(".cg-collection")?.appendChild(next);
      });
      relGrid.appendChild(rEl);
    }
    relSection.appendChild(relGrid);
    right.appendChild(relSection);
  }

  /* ─── Action buttons ─── */
  const actions = document.createElement("div");
  actions.className = "cg-detail-actions";

  const closeBtn = document.createElement("button");
  closeBtn.className = "cg-btn";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => overlay.remove());
  actions.appendChild(closeBtn);

  // Favorite toggle
  const favBtn = document.createElement("button");
  favBtn.className = `cg-btn${isFav ? " cg-btn-active" : ""}`;
  favBtn.textContent = isFav ? "Unfavorite" : "Favorite";
  favBtn.addEventListener("click", () => {
    callbacks.onFavorite?.(card);
    overlay.remove();
  });
  actions.appendChild(favBtn);

  // Add to deck
  if (callbacks.onAddToDeck) {
    const addBtn = document.createElement("button");
    addBtn.className = "cg-btn cg-btn-primary";
    addBtn.textContent = "Add to Deck";
    addBtn.addEventListener("click", () => {
      callbacks.onAddToDeck(card);
      overlay.remove();
    });
    actions.appendChild(addBtn);
  }

  // Build around (§9.5)
  if (callbacks.onBuildAround) {
    const buildBtn = document.createElement("button");
    buildBtn.className = "cg-btn cg-btn-gold";
    buildBtn.textContent = "Build Around";
    buildBtn.addEventListener("click", () => {
      callbacks.onBuildAround(card);
      overlay.remove();
    });
    actions.appendChild(buildBtn);
  }

  // Craft / Disenchant
  if (owned === 0 && dustCost > 0) {
    const craftBtn = document.createElement("button");
    craftBtn.className = "cg-btn cg-btn-primary";
    craftBtn.textContent = `Craft (${dustCost} Dust)`;
    craftBtn.disabled = playerDust < dustCost;
    craftBtn.addEventListener("click", () => {
      callbacks.onCraft?.(card);
      overlay.remove();
    });
    actions.appendChild(craftBtn);
  } else if (owned > 0 && dustRefund > 0) {
    const deBtn = document.createElement("button");
    deBtn.className = "cg-btn cg-btn-danger";
    deBtn.textContent = `Disenchant (+${dustRefund} Dust)`;
    deBtn.addEventListener("click", () => {
      callbacks.onDisenchant?.(card);
      overlay.remove();
    });
    actions.appendChild(deBtn);
  }

  right.appendChild(actions);

  /* ─── Assemble modal ─── */
  const layout = document.createElement("div");
  layout.className = "cg-detail-layout";
  layout.appendChild(left);
  layout.appendChild(right);
  modal.appendChild(layout);

  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
  overlay.appendChild(modal);
  return overlay;
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function debounce(fn, ms) {
  let t = 0;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
