/**
 * @module cardgame/deckbuilder
 * @description Deck Builder — create, edit, optimize decks.
 * §10: mana curve, hero affinity, 14 computed metrics, auto-build,
 * deck codes, validation, one-click optimization.
 */

import { searchCards, RARITY_ORDER } from "./cards.js";
import { isDeckValid, deckCardCount, manaCurveStats, blankDeckState } from "./state.js";
import { cardEl } from "./board.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const MAX_DECK_SIZE = 30;
const MAX_COPY_STANDARD = 2;
const MAX_COPY_LEGENDARY = 1;

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Metrics (§10.2 — 14 computed metrics)
   ═══════════════════════════════════════════════════════════════════════════ */

export function computeDeckMetrics(deck, cardLookup, hero) {
  const cards = (deck.cards || []).map(e => {
    const c = cardLookup(e.id);
    return c ? { ...c, count: e.count } : null;
  }).filter(Boolean);

  const totalCards = cards.reduce((s, c) => s + c.count, 0);
  const cardIds = (Array.isArray(deck.cards) ? deck.cards : []).flatMap(e => Array(e.count || 1).fill(e.id));
  const curve = manaCurveStats(cardIds, cardLookup);

  // 1. Mana curve quality (penalize too many high-cost or too few low-cost)
  const idealCurve = [0, 4, 6, 6, 4, 3, 3, 2, 1, 1, 0];
  let curveDeviation = 0;
  for (let i = 0; i <= 10; i++) {
    curveDeviation += Math.abs((curve[i] || 0) - (idealCurve[i] || 0));
  }
  const curveQuality = Math.max(0, 100 - curveDeviation * 4);

  // 2. Hero affinity
  let heroAffinity = 0;
  if (hero) {
    for (const c of cards) {
      if (c.heroId === hero.id) heroAffinity += 10 * c.count;
      if (c.developer === (hero.name || hero.label) || c.platform === (hero.name || hero.label)) heroAffinity += 5 * c.count;
    }
    heroAffinity = Math.min(100, heroAffinity);
  }

  // 3. Type breakdown
  const types = { MINION: 0, SPELL: 0, WEAPON: 0, FRAMEWORK: 0 };
  for (const c of cards) types[c.type] = (types[c.type] || 0) + c.count;

  // 4. Rarity breakdown
  const rarities = { common: 0, rare: 0, epic: 0, legendary: 0 };
  for (const c of cards) rarities[c.rarity] = (rarities[c.rarity] || 0) + c.count;

  // 5. Keyword density
  const kwCount = {};
  for (const c of cards) {
    for (const kw of (c.keywords || [])) {
      kwCount[kw] = (kwCount[kw] || 0) + c.count;
    }
  }

  // 6. Framework/Patch coverage
  const frameworks = cards.filter(c => c.type === "FRAMEWORK").reduce((s, c) => s + c.count, 0);
  const patches = cards.filter(c => c.keywords?.includes("patch") || c.subType === "patch").reduce((s, c) => s + c.count, 0);

  // 7. Stability risk (volatile vs stable)
  const volatiles = cards.filter(c => c.keywords?.includes("volatile")).reduce((s, c) => s + c.count, 0);
  const stables = cards.filter(c => c.keywords?.includes("stable")).reduce((s, c) => s + c.count, 0);
  const stabilityRisk = totalCards > 0 ? Math.round((volatiles / totalCards) * 100) : 0;

  // 8. Card draw density
  const drawCards = cards.filter(c => c.keywords?.includes("discover") || c.keywords?.includes("battlecry")).reduce((s, c) => s + c.count, 0);

  // 9. Average cost
  const avgCost = totalCards > 0 ? cards.reduce((s, c) => s + (c.cost || 0) * c.count, 0) / totalCards : 0;

  // 10. Early / mid / late game split
  const early = cards.filter(c => (c.cost || 0) <= 2).reduce((s, c) => s + c.count, 0);
  const mid = cards.filter(c => (c.cost || 0) >= 3 && (c.cost || 0) <= 5).reduce((s, c) => s + c.count, 0);
  const late = cards.filter(c => (c.cost || 0) >= 6).reduce((s, c) => s + c.count, 0);

  // 11. Interaction/removal density — cards that deal damage or destroy
  const interactionCards = cards.filter(c =>
    c.keywords?.includes("poisonous") || c.keywords?.includes("rush") || c.keywords?.includes("charge") ||
    (c.description || "").toLowerCase().match(/deal|destroy|remove|damage|silence|transform/)
  ).reduce((s, c) => s + c.count, 0);

  // 12. Finisher density — high-cost impactful cards
  const finishers = cards.filter(c => (c.cost || 0) >= 7 && ((c.attack || 0) >= 5 || c.rarity === "legendary")).reduce((s, c) => s + c.count, 0);

  // 13. Overhaul/attachment saturation
  const overhauls = cards.filter(c => c.keywords?.includes("overhaul") || c.subType === "overhaul").reduce((s, c) => s + c.count, 0);
  const attachments = cards.filter(c => c.keywords?.includes("attachment") || c.subType === "attachment").reduce((s, c) => s + c.count, 0);

  // 14. Dead-card risk (high-cost cards with no supporting early game)
  const highCostCount = cards.filter(c => (c.cost || 0) >= 6).reduce((s, c) => s + c.count, 0);
  const lowCostCount = cards.filter(c => (c.cost || 0) <= 2).reduce((s, c) => s + c.count, 0);
  const deadCardRisk = totalCards > 0
    ? Math.max(0, Math.min(100, Math.round((highCostCount / totalCards) * 100 - lowCostCount * 3)))
    : 0;

  // 15. Deck identity confidence
  const topKeywords = Object.entries(kwCount).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const keywordConcentration = topKeywords.reduce((s, [, v]) => s + v, 0);
  const identityConfidence = totalCards > 0
    ? Math.min(100, Math.round((keywordConcentration / totalCards) * 60 + heroAffinity * 0.4))
    : 0;

  // Game-to-mod coverage
  const gameCards = cards.filter(c => c.source === "game").reduce((s, c) => s + c.count, 0);
  const modCards = cards.filter(c => c.source === "mod").reduce((s, c) => s + c.count, 0);
  const gameModBalance = totalCards > 0
    ? Math.round(Math.min(gameCards, modCards) / Math.max(gameCards, modCards, 1) * 100)
    : 0;

  // Ecosystem breakdown
  const ecosystems = {};
  for (const c of cards) {
    const eco = c.targetGame || c.developer || "unknown";
    ecosystems[eco] = (ecosystems[eco] || 0) + c.count;
  }

  return {
    totalCards,
    isValid: totalCards === MAX_DECK_SIZE,
    curveQuality,
    heroAffinity,
    types,
    rarities,
    keywords: kwCount,
    frameworks,
    patches,
    stabilityRisk,
    drawCards,
    avgCost: Math.round(avgCost * 10) / 10,
    early,
    mid,
    late,
    curve,
    interactionCards,
    finishers,
    overhauls,
    attachments,
    deadCardRisk,
    identityConfidence,
    gameModBalance,
    ecosystems,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Auto-Build (§10.4)
   ═══════════════════════════════════════════════════════════════════════════ */

export function autoBuildDeck(poolArray, hero, profile) {
  const owned = profile?.collection?.ownedCards || {};
  const deck = blankDeckState();
  deck.heroId = hero?.id || "";
  deck.name = hero ? `${hero.name || hero.label || "Hero"} Deck` : "Auto Deck";

  // Unwrap pool entries to plain cards, then filter to owned
  const heroName = hero?.name || hero?.label || "";
  let candidates = poolArray
    .map(e => e.card || e)
    .filter(c => (owned[c.id] || 0) > 0)
    .map(c => ({
      ...c,
      affinity: (c.heroId === hero?.id ? 10 : 0) +
                (c.developer === heroName ? 5 : 0) +
                (c.platform === heroName ? 3 : 0),
    }))
    .sort((a, b) => b.affinity - a.affinity || (a.cost || 0) - (b.cost || 0));

  const deckMap = new Map();
  let total = 0;

  // Curve-aware filling
  const targetCurve = { 0: 1, 1: 3, 2: 5, 3: 5, 4: 4, 5: 3, 6: 3, 7: 2, 8: 2, 9: 1, 10: 1 };
  const curveFill = {};

  for (const c of candidates) {
    if (total >= MAX_DECK_SIZE) break;
    const costBucket = Math.min(10, c.cost || 0);
    const maxForCurve = targetCurve[costBucket] || 1;
    if ((curveFill[costBucket] || 0) >= maxForCurve) continue;

    const maxCopies = (c.rarity === "legendary") ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
    const currentCount = deckMap.get(c.id) || 0;
    const ownedCount = owned[c.id] || 0;
    const canAdd = Math.min(maxCopies - currentCount, ownedCount - currentCount);
    if (canAdd <= 0) continue;

    deckMap.set(c.id, currentCount + 1);
    curveFill[costBucket] = (curveFill[costBucket] || 0) + 1;
    total++;
  }

  // Fill remaining slots if curve didn't complete
  if (total < MAX_DECK_SIZE) {
    for (const c of candidates) {
      if (total >= MAX_DECK_SIZE) break;
      const maxCopies = (c.rarity === "legendary") ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
      const currentCount = deckMap.get(c.id) || 0;
      const ownedCount = owned[c.id] || 0;
      const canAdd = Math.min(maxCopies - currentCount, ownedCount - currentCount);
      if (canAdd <= 0) continue;
      deckMap.set(c.id, currentCount + 1);
      total++;
    }
  }

  deck.cards = [...deckMap.entries()].map(([id, count]) => ({ id, count }));
  return deck;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Code Encode/Decode (§10.6)
   ═══════════════════════════════════════════════════════════════════════════ */

export function encodeDeckCode(deck) {
  const parts = [
    "GS1", // schema version
    deck.heroId || "",
    deck.mode || "standard",
    ...(deck.cosmeticLoadout || []).length ? [`cos:${deck.cosmeticLoadout.join(",")}`] : [],
    ...deck.cards.map(e => `${e.id}:${e.count}`),
  ];
  const raw = parts.join("|");
  // Append checksum (simple hash mod 65536)
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  const checksum = (hash >>> 0) % 65536;
  const withChecksum = raw + "|chk:" + checksum;
  try {
    return btoa(withChecksum);
  } catch (_) {
    return withChecksum;
  }
}

export function decodeDeckCode(code, cardLookup) {
  let raw;
  try { raw = atob(code); } catch (_) { raw = code; }
  const parts = raw.split("|");
  if (parts[0] !== "GS1") return null;

  // Verify checksum if present
  const lastPart = parts[parts.length - 1];
  if (lastPart.startsWith("chk:")) {
    const expectedChecksum = parseInt(lastPart.slice(4), 10);
    const withoutChecksum = parts.slice(0, -1).join("|");
    let hash = 0;
    for (let i = 0; i < withoutChecksum.length; i++) hash = ((hash << 5) - hash + withoutChecksum.charCodeAt(i)) | 0;
    const actualChecksum = (hash >>> 0) % 65536;
    if (actualChecksum !== expectedChecksum) return null;
    parts.pop(); // remove checksum for normal processing
  }

  const deck = blankDeckState();
  deck.heroId = parts[1] || "";
  deck.mode = parts[2] || "standard";
  deck.cards = [];
  deck.cosmeticLoadout = [];

  for (let i = 3; i < parts.length; i++) {
    if (parts[i].startsWith("cos:")) {
      deck.cosmeticLoadout = parts[i].slice(4).split(",").filter(Boolean);
      continue;
    }
    const [id, countStr] = parts[i].split(":");
    const count = parseInt(countStr, 10) || 1;
    if (id && cardLookup(id)) {
      deck.cards.push({ id, count });
    }
  }
  return deck;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Render Deck Builder
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderDeckBuilder(poolArray, profile, hero, cardLookup, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-deckbuilder";

  // Current deck (starts from existing or blank)
  let currentDeck = callbacks.initialDeck || blankDeckState();
  if (hero) currentDeck.heroId = hero.id;

  // Left: card pool
  const pool = document.createElement("div");
  pool.className = "cg-deckbuilder-pool";

  const searchInput = document.createElement("input");
  searchInput.className = "cg-collection-search";
  searchInput.type = "text";
  searchInput.placeholder = "Search available cards…";
  pool.appendChild(searchInput);

  const poolGrid = document.createElement("div");
  poolGrid.className = "cg-collection-grid";
  pool.appendChild(poolGrid);
  root.appendChild(pool);

  // Right: deck sidebar
  const sidebar = document.createElement("div");
  sidebar.className = "cg-deckbuilder-sidebar";

  const deckHeader = document.createElement("div");
  deckHeader.className = "cg-db-header";
  deckHeader.innerHTML = `
    <input class="cg-collection-search cg-deck-name-input" value="${escHtml(currentDeck.name || "New Deck")}" style="max-width:160px;font-weight:750;">
    <span class="cg-deck-count"></span>
  `;
  sidebar.appendChild(deckHeader);

  // Mana curve
  const curveWrap = document.createElement("div");
  curveWrap.className = "cg-mana-curve";
  sidebar.appendChild(curveWrap);

  // Metrics dashboard (§10.3)
  const metricsWrap = document.createElement("div");
  metricsWrap.className = "cg-db-metrics";
  sidebar.appendChild(metricsWrap);

  // "Why / What's missing" panel
  const insightWrap = document.createElement("div");
  insightWrap.className = "cg-db-insights";
  sidebar.appendChild(insightWrap);

  // Deck list
  const deckList = document.createElement("div");
  deckList.className = "cg-deck-list";
  sidebar.appendChild(deckList);

  // Deck code import area
  const importWrap = document.createElement("div");
  importWrap.className = "cg-db-import";
  importWrap.innerHTML = `
    <input class="cg-collection-search cg-db-import-input" type="text" placeholder="Paste deck code to import…" style="font-size:10px;">
  `;
  sidebar.appendChild(importWrap);

  // Actions
  const actionsBar = document.createElement("div");
  actionsBar.className = "cg-db-actions";
  actionsBar.innerHTML = `
    <button class="cg-btn cg-btn-primary cg-db-save">Save</button>
    <button class="cg-btn cg-db-auto">Auto-Build</button>
    <button class="cg-btn cg-db-code">Export Code</button>
    <button class="cg-btn cg-db-duplicate">Duplicate</button>
    <button class="cg-btn cg-db-repair">Repair</button>
    <button class="cg-btn cg-db-compare">Compare</button>
    <button class="cg-btn cg-db-history">History</button>
    <button class="cg-btn cg-db-restore">Restore</button>
    <button class="cg-btn cg-btn-danger cg-db-clear">Clear</button>
  `;
  sidebar.appendChild(actionsBar);
  root.appendChild(sidebar);

  // ─── Deck manipulation ───
  function addCard(card) {
    const maxCopies = card.rarity === "legendary" ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
    const existing = currentDeck.cards.find(e => e.id === card.id);
    if (existing) {
      if (existing.count >= maxCopies) return;
      existing.count++;
    } else {
      if (deckCardCount(currentDeck) >= MAX_DECK_SIZE) return;
      currentDeck.cards.push({ id: card.id, count: 1 });
    }
    refreshSidebar();
  }

  function removeCard(cardId) {
    const idx = currentDeck.cards.findIndex(e => e.id === cardId);
    if (idx < 0) return;
    currentDeck.cards[idx].count--;
    if (currentDeck.cards[idx].count <= 0) currentDeck.cards.splice(idx, 1);
    refreshSidebar();
  }

  // ─── Renders ───
  function refreshPool() {
    const query = searchInput.value.trim();
    let entries = query ? searchCards(poolArray, query) : poolArray;
    const owned = profile?.collection?.ownedCards || {};
    // Unwrap pool entries to plain cards
    let cards = entries.map(e => e.card || e);
    cards = cards.filter(c => (owned[c.id] || 0) > 0);
    cards.sort((a, b) => (a.cost || 0) - (b.cost || 0));

    poolGrid.innerHTML = "";
    for (const card of cards) {
      const el = cardEl(card, {
        mode: "collection",
        onClick: () => addCard(card),
      });
      poolGrid.appendChild(el);
    }
  }

  function refreshSidebar() {
    const count = deckCardCount(currentDeck);
    const countEl = deckHeader.querySelector(".cg-deck-count");
    if (countEl) {
      countEl.textContent = `${count}/${MAX_DECK_SIZE}`;
      countEl.className = `cg-deck-count ${count === MAX_DECK_SIZE ? "valid" : "invalid"}`;
    }

    // Full metrics
    const metrics = computeDeckMetrics(currentDeck, cardLookup, hero);

    // Mana curve histogram
    curveWrap.innerHTML = "";
    const maxCount = Math.max(1, ...Object.values(metrics.curve));
    for (let i = 0; i <= 10; i++) {
      const c = metrics.curve[i] || 0;
      const col = document.createElement("div");
      col.className = "cg-mana-curve-col";
      const bar = document.createElement("div");
      bar.className = "cg-mana-curve-bar";
      bar.style.height = `${(c / maxCount) * 100}%`;
      bar.dataset.count = c;
      col.appendChild(bar);
      const label = document.createElement("div");
      label.className = "cg-mana-curve-label";
      label.textContent = i >= 10 ? "10+" : i;
      col.appendChild(label);
      curveWrap.appendChild(col);
    }

    // Metrics dashboard
    metricsWrap.innerHTML = "";
    const meterData = [
      { label: "Curve Quality", value: metrics.curveQuality, color: metrics.curveQuality >= 70 ? "#7affc4" : metrics.curveQuality >= 40 ? "#ffb84c" : "#ff6b6b" },
      { label: "Hero Affinity", value: metrics.heroAffinity, color: "#69a0ff" },
      { label: "Stability Risk", value: metrics.stabilityRisk, color: metrics.stabilityRisk <= 20 ? "#7affc4" : metrics.stabilityRisk <= 50 ? "#ffb84c" : "#ff6b6b" },
      { label: "Dead-Card Risk", value: metrics.deadCardRisk, color: metrics.deadCardRisk <= 15 ? "#7affc4" : metrics.deadCardRisk <= 35 ? "#ffb84c" : "#ff6b6b" },
      { label: "Identity", value: metrics.identityConfidence, color: "#c76bff" },
    ];
    for (const m of meterData) {
      const row = document.createElement("div");
      row.className = "cg-db-meter";
      row.innerHTML = `
        <div class="cg-db-meter-label">${m.label}</div>
        <div class="cg-db-meter-track"><div class="cg-db-meter-fill" style="width:${m.value}%;background:${m.color};"></div></div>
        <div class="cg-db-meter-value">${m.value}%</div>
      `;
      metricsWrap.appendChild(row);
    }

    // Type / rarity / early-mid-late breakdown
    const breakdownHtml = `
      <div class="cg-db-breakdown">
        <span title="Minions">${metrics.types.MINION || 0}M</span>
        <span title="Spells">${metrics.types.SPELL || 0}S</span>
        <span title="Weapons">${metrics.types.WEAPON || 0}W</span>
        <span title="Frameworks">${metrics.types.FRAMEWORK || 0}F</span>
        <span class="cg-db-sep">|</span>
        <span title="Early (0-2)">E:${metrics.early}</span>
        <span title="Mid (3-5)">M:${metrics.mid}</span>
        <span title="Late (6+)">L:${metrics.late}</span>
        <span class="cg-db-sep">|</span>
        <span title="Avg Cost">\u00D8${metrics.avgCost}</span>
      </div>
    `;
    const bdEl = document.createElement("div");
    bdEl.innerHTML = breakdownHtml;
    metricsWrap.appendChild(bdEl.firstElementChild);

    // Insights: "Why this deck works" / "What's missing"
    insightWrap.innerHTML = "";
    const insights = [];
    const missing = [];

    if (metrics.curveQuality >= 70) insights.push("Strong mana curve distribution.");
    else missing.push("Unbalanced mana curve — adjust early/late game cards.");

    if (metrics.heroAffinity >= 40) insights.push("Good synergy with chosen hero.");
    else if (hero) missing.push("Low hero affinity — add hero-themed cards.");

    if (metrics.interactionCards >= 5) insights.push("Solid removal/interaction package.");
    else missing.push("Missing removal — add interaction cards.");

    if (metrics.finishers >= 2) insights.push("Has strong finisher threats.");
    else missing.push("No win conditions — add high-impact finishers.");

    if (metrics.frameworks >= 2) insights.push("Framework engine provides value.");

    if (metrics.drawCards >= 4) insights.push("Good card draw to maintain hand.");
    else missing.push("Low card draw — risk running out of steam.");

    if (metrics.stabilityRisk > 40) missing.push("High volatility — add stable cards.");

    if (metrics.deadCardRisk > 30) missing.push("Too many expensive cards — add early game.");

    if (insights.length || missing.length) {
      if (insights.length) {
        const whyHeader = document.createElement("div");
        whyHeader.className = "cg-db-insight-header cg-db-insight-good";
        whyHeader.textContent = "Why this deck works";
        insightWrap.appendChild(whyHeader);
        for (const i of insights) {
          const el = document.createElement("div");
          el.className = "cg-db-insight-item cg-db-insight-good";
          el.textContent = i;
          insightWrap.appendChild(el);
        }
      }
      if (missing.length) {
        const missHeader = document.createElement("div");
        missHeader.className = "cg-db-insight-header cg-db-insight-bad";
        missHeader.textContent = "What's missing";
        insightWrap.appendChild(missHeader);
        for (const m of missing) {
          const el = document.createElement("div");
          el.className = "cg-db-insight-item cg-db-insight-bad";
          el.textContent = m;
          insightWrap.appendChild(el);
        }
      }
    }

    // Deck list
    deckList.innerHTML = "";
    const sortedEntries = [...currentDeck.cards].sort((a, b) => {
      const ca = cardLookup(a.id);
      const cb = cardLookup(b.id);
      return (ca?.cost || 0) - (cb?.cost || 0);
    });
    for (const entry of sortedEntries) {
      const card = cardLookup(entry.id);
      if (!card) continue;
      const row = document.createElement("div");
      row.className = "cg-deck-entry";
      row.innerHTML = `
        <div class="cg-deck-entry-cost"><span style="font-size:10px;color:#fff;">${card.cost ?? 0}</span></div>
        <div class="cg-deck-entry-name">${escHtml(card.name || "")}</div>
        <div class="cg-deck-entry-count">\u00D7${entry.count}</div>
      `;
      row.addEventListener("click", () => removeCard(entry.id));
      row.title = "Click to remove";
      deckList.appendChild(row);
    }
  }

  // Wire events
  searchInput.addEventListener("input", debounce(refreshPool, 200));

  const saveBtn = actionsBar.querySelector(".cg-db-save");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    const nameInput = deckHeader.querySelector(".cg-deck-name-input");
    if (nameInput) currentDeck.name = nameInput.value.trim() || "Unnamed Deck";
    snapshotDeck(currentDeck);
    callbacks.onSave?.(currentDeck);
  });

  const autoBtn = actionsBar.querySelector(".cg-db-auto");
  if (autoBtn) autoBtn.addEventListener("click", () => {
    currentDeck = autoBuildDeck(poolArray, hero, profile);
    refreshPool();
    refreshSidebar();
  });

  const codeBtn = actionsBar.querySelector(".cg-db-code");
  if (codeBtn) codeBtn.addEventListener("click", () => {
    const code = encodeDeckCode(currentDeck);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    callbacks.onExportCode?.(code);
  });

  const clearBtn = actionsBar.querySelector(".cg-db-clear");
  if (clearBtn) clearBtn.addEventListener("click", () => {
    currentDeck.cards = [];
    refreshSidebar();
  });

  // Import deck code
  const importInput = importWrap.querySelector(".cg-db-import-input");
  if (importInput) importInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const code = importInput.value.trim();
      if (!code) return;
      const imported = decodeDeckCode(code, cardLookup);
      if (imported) {
        currentDeck = imported;
        const nameInput = deckHeader.querySelector(".cg-deck-name-input");
        if (nameInput) nameInput.value = currentDeck.name || "Imported Deck";
        refreshPool();
        refreshSidebar();
        importInput.value = "";
      }
    }
  });

  // Duplicate deck
  const dupBtn = actionsBar.querySelector(".cg-db-duplicate");
  if (dupBtn) dupBtn.addEventListener("click", () => {
    const clone = JSON.parse(JSON.stringify(currentDeck));
    clone.name = (clone.name || "Deck") + " (Copy)";
    clone.id = undefined;
    callbacks.onSave?.(clone);
  });

  // Repair deck (one-click fix)
  const repairBtn = actionsBar.querySelector(".cg-db-repair");
  if (repairBtn) repairBtn.addEventListener("click", () => {
    repairDeck(currentDeck, poolArray, profile, cardLookup, hero);
    refreshPool();
    refreshSidebar();
  });

  // Compare decks side by side
  const compareBtn = actionsBar.querySelector(".cg-db-compare");
  if (compareBtn) compareBtn.addEventListener("click", () => {
    // Compare current deck vs last saved revision (if available)
    const history = getDeckHistory(currentDeck);
    if (history.length > 0) {
      const lastSaved = { cards: history[history.length - 1].cards, name: currentDeck.name + " (saved)" };
      const diffEl = renderDeckComparison(currentDeck, lastSaved, cardLookup);
      // Show in insight area
      insightWrap.innerHTML = "";
      insightWrap.appendChild(diffEl);
    }
    callbacks.onCompare?.(currentDeck);
  });

  // Show revision history
  const historyBtn = actionsBar.querySelector(".cg-db-history");
  if (historyBtn) historyBtn.addEventListener("click", () => {
    const history = getDeckHistory(currentDeck);
    insightWrap.innerHTML = "";
    if (history.length === 0) {
      insightWrap.innerHTML = `<div class="cg-db-insight-item cg-db-insight-bad">No saved revisions yet.</div>`;
      return;
    }
    const header = document.createElement("div");
    header.className = "cg-db-insight-header cg-db-insight-good";
    header.textContent = `Revision History (${history.length})`;
    insightWrap.appendChild(header);
    for (let i = history.length - 1; i >= 0; i--) {
      const rev = history[i];
      const row = document.createElement("div");
      row.className = "cg-db-insight-item cg-db-insight-good cg-db-history-row";
      row.style.cursor = "pointer";
      const d = new Date(rev.timestamp);
      const ts = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      row.textContent = `#${i + 1} — ${ts} — ${rev.cards.length} unique, ${rev.cards.reduce((s, e) => s + e.count, 0)} cards`;
      row.addEventListener("click", () => {
        restoreDeckRevision(currentDeck, i);
        const nameInput = deckHeader.querySelector(".cg-deck-name-input");
        if (nameInput) nameInput.value = currentDeck.name || "Restored Deck";
        refreshPool();
        refreshSidebar();
      });
      insightWrap.appendChild(row);
    }
  });

  // Restore last saved version
  const restoreBtn = actionsBar.querySelector(".cg-db-restore");
  if (restoreBtn) restoreBtn.addEventListener("click", () => {
    if (restoreLastSaved(currentDeck)) {
      const nameInput = deckHeader.querySelector(".cg-deck-name-input");
      if (nameInput) nameInput.value = currentDeck.name || "Restored Deck";
      refreshPool();
      refreshSidebar();
    }
  });

  // Initial render
  refreshPool();
  refreshSidebar();

  return root;
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function debounce(fn, ms) {
  let t = 0;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ═══════════════════════════════════════════════════════════════════════════
   One-Click Repair Deck (§10.7)
   ═══════════════════════════════════════════════════════════════════════════ */

export function repairDeck(deck, poolArray, profile, cardLookup, hero) {
  const owned = profile?.collection?.ownedCards || {};
  const current = deckCardCount(deck);

  // Remove cards no longer in pool or unowned
  deck.cards = deck.cards.filter(e => {
    const c = cardLookup(e.id);
    if (!c) return false;
    if ((owned[c.id] || 0) <= 0) return false;
    return true;
  });

  // Cap copies
  for (const entry of deck.cards) {
    const c = cardLookup(entry.id);
    const maxCopies = c?.rarity === "legendary" ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
    entry.count = Math.min(entry.count, maxCopies, owned[entry.id] || 0);
  }
  deck.cards = deck.cards.filter(e => e.count > 0);

  // Fill to 30 if short
  const afterCount = deck.cards.reduce((s, e) => s + e.count, 0);
  if (afterCount < MAX_DECK_SIZE) {
    const inDeck = new Set(deck.cards.map(e => e.id));
    const candidates = poolArray
      .map(e => e.card || e)
      .filter(c => (owned[c.id] || 0) > 0 && !inDeck.has(c.id))
      .sort((a, b) => {
        const aff = (a.heroId === hero?.id ? 10 : 0) - (b.heroId === hero?.id ? 10 : 0);
        return -aff || (a.cost || 0) - (b.cost || 0);
      });

    let needed = MAX_DECK_SIZE - afterCount;
    for (const c of candidates) {
      if (needed <= 0) break;
      const maxCopies = c.rarity === "legendary" ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
      const toAdd = Math.min(maxCopies, needed);
      deck.cards.push({ id: c.id, count: toAdd });
      needed -= toAdd;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Starter Deck Recipes (§10.5)
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateRecipeDeck(poolArray, profile, hero, strategy) {
  const owned = profile?.collection?.ownedCards || {};
  const deck = blankDeckState();
  deck.heroId = hero?.id || "";
  deck.name = hero ? `${hero.name || hero.label || "Hero"} ${strategy}` : `${strategy} Deck`;

  let candidates = poolArray
    .map(e => e.card || e)
    .filter(c => (owned[c.id] || 0) > 0);

  // Strategy-specific scoring
  const scored = candidates.map(c => {
    let score = 0;
    if (c.heroId === hero?.id) score += 20;
    if (c.developer === (hero?.name || hero?.label)) score += 10;

    switch (strategy) {
      case "aggro":
        if ((c.cost || 0) <= 3) score += 15;
        if (c.keywords?.includes("charge") || c.keywords?.includes("rush")) score += 10;
        if ((c.attack || 0) >= 3) score += 5;
        break;
      case "control":
        if (c.keywords?.includes("taunt")) score += 10;
        if (c.keywords?.includes("lifesteal")) score += 8;
        if ((c.cost || 0) >= 5) score += 5;
        if (c.type === "framework") score += 8;
        break;
      case "midrange":
        if ((c.cost || 0) >= 3 && (c.cost || 0) <= 5) score += 10;
        score += (c.attack || 0) + (c.health || 0);
        break;
      case "budget":
        if (c.rarity === "common") score += 15;
        if (c.rarity === "rare") score += 5;
        break;
      default:
        score += Math.random() * 10;
    }
    return { card: c, score };
  }).sort((a, b) => b.score - a.score);

  const deckMap = new Map();
  let total = 0;
  for (const { card } of scored) {
    if (total >= MAX_DECK_SIZE) break;
    const maxCopies = card.rarity === "legendary" ? MAX_COPY_LEGENDARY : MAX_COPY_STANDARD;
    const currentCount = deckMap.get(card.id) || 0;
    if (currentCount >= maxCopies) continue;
    deckMap.set(card.id, currentCount + 1);
    total++;
  }

  deck.cards = [...deckMap.entries()].map(([id, count]) => ({ id, count }));
  return deck;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Compare Two Decks Side by Side (§10.7)
   ═══════════════════════════════════════════════════════════════════════════ */

export function compareDecks(deckA, deckB, cardLookup) {
  const mapA = new Map(deckA.cards.map(e => [e.id, e.count]));
  const mapB = new Map(deckB.cards.map(e => [e.id, e.count]));
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);

  const onlyA = [], onlyB = [], shared = [], countDiffs = [];
  for (const id of allIds) {
    const cA = mapA.get(id) || 0;
    const cB = mapB.get(id) || 0;
    const card = cardLookup(id);
    if (!card) continue;
    if (cA > 0 && cB === 0) onlyA.push({ card, count: cA });
    else if (cB > 0 && cA === 0) onlyB.push({ card, count: cB });
    else {
      shared.push({ card, countA: cA, countB: cB });
      if (cA !== cB) countDiffs.push({ card, countA: cA, countB: cB });
    }
  }

  return { onlyA, onlyB, shared, countDiffs };
}

export function renderDeckComparison(deckA, deckB, cardLookup) {
  const diff = compareDecks(deckA, deckB, cardLookup);
  const el = document.createElement("div");
  el.className = "cg-deck-compare";
  const nameA = escHtml(deckA.name || "Deck A");
  const nameB = escHtml(deckB.name || "Deck B");

  let html = `<div class="cg-deck-compare-header">
    <span class="cg-compare-name-a">${nameA}</span><span class="cg-compare-vs">vs</span><span class="cg-compare-name-b">${nameB}</span>
  </div>`;

  if (diff.onlyA.length) {
    html += `<div class="cg-compare-section"><div class="cg-compare-section-label">Only in ${nameA}</div>`;
    for (const { card, count } of diff.onlyA) html += `<div class="cg-compare-row cg-compare-only-a">${card.cost ?? 0} \u00B7 ${escHtml(card.name)} \u00D7${count}</div>`;
    html += `</div>`;
  }
  if (diff.onlyB.length) {
    html += `<div class="cg-compare-section"><div class="cg-compare-section-label">Only in ${nameB}</div>`;
    for (const { card, count } of diff.onlyB) html += `<div class="cg-compare-row cg-compare-only-b">${card.cost ?? 0} \u00B7 ${escHtml(card.name)} \u00D7${count}</div>`;
    html += `</div>`;
  }
  if (diff.countDiffs.length) {
    html += `<div class="cg-compare-section"><div class="cg-compare-section-label">Count differences</div>`;
    for (const { card, countA, countB } of diff.countDiffs) html += `<div class="cg-compare-row cg-compare-diff">${card.cost ?? 0} \u00B7 ${escHtml(card.name)} ${countA} \u2192 ${countB}</div>`;
    html += `</div>`;
  }
  html += `<div class="cg-compare-shared">Shared cards: ${diff.shared.length}</div>`;

  el.innerHTML = html;
  return el;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Deck Revision History (§10.7)
   ═══════════════════════════════════════════════════════════════════════════ */

const _deckHistoryStore = new Map(); // deckId -> snapshot[]

export function snapshotDeck(deck) {
  const id = deck.id || deck.name || "__default";
  if (!_deckHistoryStore.has(id)) _deckHistoryStore.set(id, []);
  const history = _deckHistoryStore.get(id);
  const snapshot = {
    timestamp: Date.now(),
    name: deck.name,
    heroId: deck.heroId,
    mode: deck.mode,
    cards: JSON.parse(JSON.stringify(deck.cards)),
  };
  history.push(snapshot);
  // Keep last 20 revisions
  if (history.length > 20) history.shift();
}

export function getDeckHistory(deck) {
  const id = deck.id || deck.name || "__default";
  return _deckHistoryStore.get(id) || [];
}

export function restoreDeckRevision(deck, revisionIndex) {
  const id = deck.id || deck.name || "__default";
  const history = _deckHistoryStore.get(id) || [];
  const revision = history[revisionIndex];
  if (!revision) return false;
  deck.cards = JSON.parse(JSON.stringify(revision.cards));
  deck.name = revision.name;
  deck.heroId = revision.heroId;
  deck.mode = revision.mode;
  return true;
}

export function restoreLastSaved(deck) {
  const history = getDeckHistory(deck);
  if (history.length === 0) return false;
  return restoreDeckRevision(deck, history.length - 1);
}
