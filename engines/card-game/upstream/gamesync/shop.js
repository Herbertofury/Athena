/**
 * @module cardgame/shop
 * @description Shop screen — buy packs, cosmetics, bundles.
 * §22 / §95: The Emporium — featured deals, pack wall, cosmetic showcase,
 * gold/dust balance. Premium but inline with the dark-panel UI.
 */

import { PACK_ICONS, iconEl, ICON_PACKS } from "./icons.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Pack Shop Data
   ═══════════════════════════════════════════════════════════════════════════ */

const SHOP_PACKS = [
  { id: "core",       name: "Core Pack",       price: 100, icon: "core",      desc: "5 cards from the core set." },
  { id: "mod",        name: "Mod Pack",        price: 100, icon: "mod",       desc: "5 cards themed around mods." },
  { id: "platform",   name: "Platform Pack",   price: 100, icon: "platform",  desc: "5 cards from a random platform." },
  { id: "genre",      name: "Genre Pack",      price: 100, icon: "genre",     desc: "5 cards of a single genre." },
  { id: "expansion",  name: "Expansion Pack",  price: 150, icon: "expansion", desc: "5 premium expansion cards." },
  { id: "hero",       name: "Hero Pack",       price: 200, icon: "hero",      desc: "5 hero-affinity cards." },
];

const SHOP_BUNDLES = [
  { id: "starter",   name: "Starter Bundle",   price: 500, packs: 6,  bonus: "1 Guaranteed Legendary", featured: true },
  { id: "value",     name: "Value Bundle",     price: 1000, packs: 12, bonus: "2 Guaranteed Epics" },
  { id: "mega",      name: "Mega Bundle",      price: 2500, packs: 30, bonus: "3 Guaranteed Legendaries + Card Back" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Cosmetic Shop Data  (§13.2)
   ═══════════════════════════════════════════════════════════════════════════ */

const SHOP_COSMETICS = [
  { id: "board_steam",   category: "board",    name: "Steam Forge Board",    price: 400, currency: "gold", preview: "board_steam" },
  { id: "board_neon",    category: "board",    name: "Neon Cyber Board",     price: 400, currency: "gold", preview: "board_neon" },
  { id: "back_galaxy",   category: "cardBack", name: "Galaxy Card Back",     price: 200, currency: "gold", preview: "back_galaxy" },
  { id: "back_pixel",    category: "cardBack", name: "Pixel Art Card Back",  price: 200, currency: "gold", preview: "back_pixel" },
  { id: "coin_obsidian", category: "coin",     name: "Obsidian Coin",        price: 150, currency: "gold", preview: "coin_obsidian" },
  { id: "skin_cyber_0",  category: "heroSkin", name: "Cyber Hero Skin",      price: 600, currency: "gold", preview: "skin_cyber_0" },
];

const SHOP_TICKETS = [
  { id: "draft_ticket",  name: "Draft Ticket",  price: 150, currency: "gold", desc: "Enter one draft run." },
  { id: "brawl_ticket",  name: "Brawl Ticket",  price: 100, currency: "gold", desc: "Enter one weekly brawl." },
  { id: "event_ticket",  name: "Event Ticket",   price: 200, currency: "gold", desc: "Enter the current event." },
];

const SHOP_EVENT_BUNDLES = [
  { id: "event_starter", name: "Event Starter",  price: 300,  packs: 3, bonus: "1 Event Legendary", event: true },
  { id: "event_mega",    name: "Event Mega",     price: 1200, packs: 10, bonus: "2 Event Legendaries + Board", event: true },
];

const FREE_CLAIM = { id: "free_weekly", name: "Free Weekly Pack", available: true, desc: "Claim one free core pack each week." };

/* ═══════════════════════════════════════════════════════════════════════════
   Render Shop
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderShop(profile, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-shop";

  const gold = profile?.collection?.gold || 0;
  const dust = profile?.collection?.dust || 0;
  const tickets = profile?.currency?.tickets || 0;

  /* ─── Balance Header ─── */
  const balanceBar = document.createElement("div");
  balanceBar.className = "cg-shop-balance";
  balanceBar.innerHTML = `
    <span class="cg-shop-gold">${gold} Gold</span>
    <span class="cg-shop-dust">${dust} Dust</span>
    <span class="cg-shop-tickets">${tickets} Tickets</span>
  `;
  root.appendChild(balanceBar);

  /* ─── Tab Bar ─── */
  const tabNames = ["Featured", "Packs", "Bundles", "Cosmetics", "Tickets", "Events", "Free"];
  const tabBar = document.createElement("div");
  tabBar.className = "cg-shop-tabs";
  let activeTab = "Featured";

  const contentArea = document.createElement("div");
  contentArea.className = "cg-shop-content";

  function renderTabBar() {
    tabBar.innerHTML = "";
    for (const t of tabNames) {
      const btn = document.createElement("button");
      btn.className = `cg-tab${t === activeTab ? " active" : ""}`;
      btn.textContent = t;
      btn.addEventListener("click", () => { activeTab = t; renderTabBar(); renderContent(); });
      tabBar.appendChild(btn);
    }
  }

  function renderContent() {
    contentArea.innerHTML = "";
    switch (activeTab) {
      case "Featured": renderFeaturedTab(contentArea, profile, gold, callbacks); break;
      case "Packs":    renderPacksTab(contentArea, gold, callbacks); break;
      case "Bundles":  renderBundlesTab(contentArea, gold, callbacks); break;
      case "Cosmetics": renderCosmeticsTab(contentArea, profile, gold, callbacks); break;
      case "Tickets":  renderTicketsTab(contentArea, gold, callbacks); break;
      case "Events":   renderEventsShopTab(contentArea, gold, callbacks); break;
      case "Free":     renderFreeTab(contentArea, profile, callbacks); break;
    }
  }

  root.appendChild(tabBar);
  root.appendChild(contentArea);
  renderTabBar();
  renderContent();
  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Purchase Confirmation (§13.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function confirmPurchase(itemName, price, currency, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "cg-shop-confirm-overlay";
  overlay.innerHTML = `
    <div class="cg-shop-confirm">
      <div class="cg-shop-confirm-title">Confirm Purchase</div>
      <div class="cg-shop-confirm-desc">Buy <strong>${escHtml(itemName)}</strong> for <strong>${price} ${escHtml(currency)}</strong>?</div>
      <div class="cg-shop-confirm-actions">
        <button class="cg-btn cg-btn-secondary cg-confirm-cancel">Cancel</button>
        <button class="cg-btn cg-btn-gold cg-confirm-buy">Buy Now</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector(".cg-confirm-cancel").addEventListener("click", () => overlay.remove());
  overlay.querySelector(".cg-confirm-buy").addEventListener("click", () => { overlay.remove(); onConfirm(); });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Featured Tab (§13.1 — featured offers, value insight)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderFeaturedTab(container, profile, gold, callbacks) {
  const featured = SHOP_BUNDLES.find(b => b.featured);
  if (featured) {
    const el = document.createElement("div");
    el.className = "cg-shop-featured";
    el.innerHTML = `
      <div class="cg-shop-featured-tag">Featured</div>
      <div class="cg-shop-featured-name">${escHtml(featured.name)}</div>
      <div class="cg-shop-featured-desc">${featured.packs} Packs \u00B7 ${escHtml(featured.bonus)}</div>
      <div class="cg-shop-featured-price">${featured.price} Gold</div>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.className = "cg-btn cg-btn-gold";
    buyBtn.textContent = "Purchase";
    buyBtn.disabled = gold < featured.price;
    buyBtn.addEventListener("click", () => confirmPurchase(featured.name, featured.price, "Gold", () => callbacks.onBuyBundle?.(featured)));
    el.appendChild(buyBtn);
    container.appendChild(el);
  }

  /* §13.3: show best value for current missing archetype */
  const owned = Object.keys(profile?.collection?.ownedCards || {}).length;
  if (owned > 0) {
    const hint = document.createElement("div");
    hint.className = "cg-shop-value-hint";
    hint.innerHTML = `<span style="color:#ffd700;">\u2605</span> Best value: <strong>Mod Pack</strong> — fills gaps in your current ecosystems.`;
    container.appendChild(hint);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Packs Tab (§13.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderPacksTab(container, gold, callbacks) {
  const packGrid = document.createElement("div");
  packGrid.className = "cg-shop-pack-grid";
  for (const pack of SHOP_PACKS) {
    const card = document.createElement("div");
    card.className = "cg-shop-pack-card";
    const iconWrap = document.createElement("div");
    iconWrap.className = "cg-shop-pack-icon";
    const svg = PACK_ICONS[pack.icon];
    if (svg) iconWrap.appendChild(iconEl(svg, "cg-pack-icon"));
    card.appendChild(iconWrap);
    card.insertAdjacentHTML("beforeend", `
      <div class="cg-shop-pack-name">${escHtml(pack.name)}</div>
      <div class="cg-shop-pack-desc">${escHtml(pack.desc)}</div>
      <div class="cg-shop-pack-price">${pack.price} Gold</div>
    `);
    const buyBtn = document.createElement("button");
    buyBtn.className = "cg-btn cg-btn-primary";
    buyBtn.textContent = "Buy";
    buyBtn.disabled = gold < pack.price;
    buyBtn.addEventListener("click", () => confirmPurchase(pack.name, pack.price, "Gold", () => callbacks.onBuyPack?.(pack)));
    card.appendChild(buyBtn);
    packGrid.appendChild(card);
  }
  container.appendChild(packGrid);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Bundles Tab (§13.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderBundlesTab(container, gold, callbacks) {
  const bundleGrid = document.createElement("div");
  bundleGrid.className = "cg-shop-bundle-grid";
  for (const bundle of SHOP_BUNDLES) {
    const card = document.createElement("div");
    card.className = `cg-shop-bundle-card${bundle.featured ? " featured" : ""}`;
    card.innerHTML = `
      <div class="cg-shop-bundle-name">${escHtml(bundle.name)}</div>
      <div class="cg-shop-bundle-contents">${bundle.packs} Packs</div>
      <div class="cg-shop-bundle-bonus">${escHtml(bundle.bonus)}</div>
      <div class="cg-shop-bundle-price">${bundle.price} Gold</div>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.className = "cg-btn cg-btn-gold";
    buyBtn.textContent = "Purchase";
    buyBtn.disabled = gold < bundle.price;
    buyBtn.addEventListener("click", () => confirmPurchase(bundle.name, bundle.price, "Gold", () => callbacks.onBuyBundle?.(bundle)));
    card.appendChild(buyBtn);
    bundleGrid.appendChild(card);
  }
  container.appendChild(bundleGrid);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Cosmetics Tab (§13.1 / §13.2 — hero skins, boards, card backs, coins)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderCosmeticsTab(container, profile, gold, callbacks) {
  const owned = profile?.cosmetics || {};
  const grid = document.createElement("div");
  grid.className = "cg-shop-pack-grid";
  for (const item of SHOP_COSMETICS) {
    const isOwned = (owned[item.category] || []).includes(item.id);
    const card = document.createElement("div");
    card.className = "cg-shop-pack-card";
    card.innerHTML = `
      <div class="cg-shop-pack-name">${escHtml(item.name)}</div>
      <div class="cg-shop-pack-desc">${escHtml(item.category)}</div>
      <div class="cg-shop-pack-price">${item.price} ${escHtml(item.currency)}</div>
    `;
    if (isOwned) {
      const tag = document.createElement("div");
      tag.className = "cg-shop-owned-tag";
      tag.textContent = "Owned";
      card.appendChild(tag);
    } else {
      const previewBtn = document.createElement("button");
      previewBtn.className = "cg-btn cg-btn-secondary";
      previewBtn.textContent = "Preview";
      previewBtn.style.marginRight = "4px";
      previewBtn.addEventListener("click", () => callbacks.onPreviewCosmetic?.(item));
      card.appendChild(previewBtn);

      const buyBtn = document.createElement("button");
      buyBtn.className = "cg-btn cg-btn-gold";
      buyBtn.textContent = "Buy";
      buyBtn.disabled = gold < item.price;
      buyBtn.addEventListener("click", () => confirmPurchase(item.name, item.price, item.currency, () => callbacks.onBuyCosmetic?.(item)));
      card.appendChild(buyBtn);
    }
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Tickets Tab (§13.2 — draft/brawl/event tickets)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderTicketsTab(container, gold, callbacks) {
  const grid = document.createElement("div");
  grid.className = "cg-shop-pack-grid";
  for (const ticket of SHOP_TICKETS) {
    const card = document.createElement("div");
    card.className = "cg-shop-pack-card";
    card.innerHTML = `
      <div class="cg-shop-pack-name">${escHtml(ticket.name)}</div>
      <div class="cg-shop-pack-desc">${escHtml(ticket.desc)}</div>
      <div class="cg-shop-pack-price">${ticket.price} ${escHtml(ticket.currency)}</div>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.className = "cg-btn cg-btn-primary";
    buyBtn.textContent = "Buy";
    buyBtn.disabled = gold < ticket.price;
    buyBtn.addEventListener("click", () => confirmPurchase(ticket.name, ticket.price, ticket.currency, () => callbacks.onBuyTicket?.(ticket)));
    card.appendChild(buyBtn);
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Events Shop Tab (§13.2 — event bundles)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderEventsShopTab(container, gold, callbacks) {
  if (SHOP_EVENT_BUNDLES.length === 0) {
    container.innerHTML = `<div style="color:rgba(255,255,255,.40);padding:20px;text-align:center;">No event offers right now.</div>`;
    return;
  }
  const grid = document.createElement("div");
  grid.className = "cg-shop-bundle-grid";
  for (const bundle of SHOP_EVENT_BUNDLES) {
    const card = document.createElement("div");
    card.className = "cg-shop-bundle-card";
    card.innerHTML = `
      <div class="cg-shop-bundle-name">${escHtml(bundle.name)}</div>
      <div class="cg-shop-bundle-contents">${bundle.packs} Event Packs</div>
      <div class="cg-shop-bundle-bonus">${escHtml(bundle.bonus)}</div>
      <div class="cg-shop-bundle-price">${bundle.price} Gold</div>
    `;
    const buyBtn = document.createElement("button");
    buyBtn.className = "cg-btn cg-btn-gold";
    buyBtn.textContent = "Purchase";
    buyBtn.disabled = gold < bundle.price;
    buyBtn.addEventListener("click", () => confirmPurchase(bundle.name, bundle.price, "Gold", () => callbacks.onBuyBundle?.(bundle)));
    card.appendChild(buyBtn);
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Free Claim Tab (§13.1 — free claim surface)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderFreeTab(container, profile, callbacks) {
  const claimed = profile?.shop?.freeClaimedThisWeek || false;
  const el = document.createElement("div");
  el.className = "cg-shop-featured";
  el.innerHTML = `
    <div class="cg-shop-featured-tag">Free</div>
    <div class="cg-shop-featured-name">${escHtml(FREE_CLAIM.name)}</div>
    <div class="cg-shop-featured-desc">${escHtml(FREE_CLAIM.desc)}</div>
  `;
  if (claimed) {
    el.insertAdjacentHTML("beforeend", `<div style="color:#5eff5e;font-weight:700;margin-top:6px;">Already claimed this week!</div>`);
  } else {
    const claimBtn = document.createElement("button");
    claimBtn.className = "cg-btn cg-btn-gold";
    claimBtn.textContent = "Claim";
    claimBtn.addEventListener("click", () => callbacks.onClaimFree?.());
    el.appendChild(claimBtn);
  }
  container.appendChild(el);
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ═══════════════════════════════════════════════════════════════════════════
   F1: Dual Currency — Shards (§15.F1)
   Shards are the premium craft currency alongside Gold.
   Gold buys packs/tickets. Shards craft specific cards.
   ═══════════════════════════════════════════════════════════════════════════ */

const SHARD_COSTS = {
  common:    40,
  uncommon:  100,
  rare:      400,
  epic:      1600,
  legendary: 3200,
};

const DISENCHANT_YIELDS = {
  common:    5,
  uncommon:  20,
  rare:      100,
  epic:      400,
  legendary: 1600,
};

export function craftCard(profile, cardId, rarity) {
  const cost = SHARD_COSTS[rarity] || 0;
  if ((profile.collection.shards || 0) < cost) return { success: false, reason: "Not enough shards" };
  profile.collection.shards -= cost;
  profile.collection.ownedCards[cardId] = profile.collection.ownedCards[cardId] || { count: 0, premium: false };
  profile.collection.ownedCards[cardId].count++;
  profile.collection.totalCards++;
  return { success: true, spent: cost };
}

export function disenchantCard(profile, cardId, rarity) {
  const owned = profile.collection.ownedCards[cardId];
  if (!owned || owned.count <= 0) return { success: false, reason: "Card not owned" };
  const yield_ = DISENCHANT_YIELDS[rarity] || 0;
  owned.count--;
  if (owned.count <= 0) delete profile.collection.ownedCards[cardId];
  profile.collection.totalCards--;
  profile.collection.shards = (profile.collection.shards || 0) + yield_;
  return { success: true, gained: yield_ };
}

export { SHARD_COSTS, DISENCHANT_YIELDS };

/* ═══════════════════════════════════════════════════════════════════════════
   F2: Equipment System (§15.F2) — persistent gear for adventure/gauntlet
   ═══════════════════════════════════════════════════════════════════════════ */

const EQUIPMENT_RARITY = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };

export function equipItem(profile, slotId, itemId) {
  if (!profile.equipment) profile.equipment = {};
  profile.equipment[slotId] = itemId;
  return profile;
}

export function unequipItem(profile, slotId) {
  if (!profile.equipment) profile.equipment = {};
  delete profile.equipment[slotId];
  return profile;
}

export function getEquipmentBonuses(profile) {
  const eq = profile.equipment || {};
  const bonuses = { hp: 0, armor: 0, extraDraw: 0, bonusMana: 0, heroPowerBonus: 0, bonusGold: 0, bonusXp: 0 };
  // Import equipment definitions would come from modes.js ADVENTURE_EQUIPMENT
  // Here we provide the aggregation logic
  for (const [slot, itemId] of Object.entries(eq)) {
    // stats are stored in the item definition; this function aggregates
    // The caller should pass resolved items or look them up
    if (typeof itemId === "object" && itemId?.stat) {
      for (const [k, v] of Object.entries(itemId.stat)) {
        if (typeof v === "number") bonuses[k] = (bonuses[k] || 0) + v;
        else bonuses[k] = v;
      }
    }
  }
  return bonuses;
}

/* ═══════════════════════════════════════════════════════════════════════════
   F3: Filtered Rewards (§15.F3) — reward cards biased toward gaps
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateFilteredReward(profile, allCards, count = 1) {
  if (!allCards?.length) return [];
  const owned = profile?.collection?.ownedCards || {};
  // Score cards by gap: prefer cards the player doesn't own or owns fewer of
  const scored = allCards.map(c => {
    const ownCount = owned[c.id]?.count || 0;
    const gapScore = Math.max(0, 3 - ownCount); // 3 = max useful copies
    const rarityBonus = { common: 0, uncommon: 0.5, rare: 1, epic: 1.5, legendary: 2 }[c.rarity] || 0;
    return { card: c, score: gapScore * 3 + rarityBonus + Math.random() * 0.5 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map(s => s.card);
}

/* ═══════════════════════════════════════════════════════════════════════════
   F4: Loot Nodes (§15.F4) — random loot between encounters
   ═══════════════════════════════════════════════════════════════════════════ */

const LOOT_TABLE = [
  { type: "gold",   weight: 30, min: 10, max: 50 },
  { type: "shards", weight: 15, min: 5,  max: 25 },
  { type: "pack",   weight: 10, packId: "core" },
  { type: "card",   weight: 20 },            // random filtered card
  { type: "equipment", weight: 5 },          // random equipment piece
  { type: "heal",   weight: 20, min: 3, max: 8 },
];

export function rollLootNode(profile, allCards) {
  const totalWeight = LOOT_TABLE.reduce((s, l) => s + l.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const loot of LOOT_TABLE) {
    roll -= loot.weight;
    if (roll <= 0) {
      switch (loot.type) {
        case "gold": {
          const amount = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
          return { type: "gold", amount, label: `${amount} Gold` };
        }
        case "shards": {
          const amount = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
          return { type: "shards", amount, label: `${amount} Shards` };
        }
        case "pack":
          return { type: "pack", packId: loot.packId, label: "Core Pack" };
        case "card": {
          const rewards = generateFilteredReward(profile, allCards, 1);
          return { type: "card", card: rewards[0] || null, label: rewards[0]?.name || "Random Card" };
        }
        case "equipment":
          return { type: "equipment", label: "Random Equipment" };
        case "heal": {
          const amount = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
          return { type: "heal", amount, label: `Heal ${amount} HP` };
        }
      }
    }
  }
  return { type: "gold", amount: 10, label: "10 Gold" };
}

export { LOOT_TABLE };

/* ═══════════════════════════════════════════════════════════════════════════
   F5: Choice Rewards (§15.F5) — pick 1 of 3 rewards after a match
   ═══════════════════════════════════════════════════════════════════════════ */

export function generateChoiceRewards(profile, allCards, count = 3) {
  const choices = [];
  for (let i = 0; i < count; i++) {
    choices.push(rollLootNode(profile, allCards));
  }
  return choices;
}

export function renderChoiceRewardOverlay(choices, onPick) {
  const overlay = document.createElement("div");
  overlay.className = "cg-shop-confirm-overlay";
  const inner = document.createElement("div");
  inner.className = "cg-choice-reward";
  inner.innerHTML = `<div class="cg-choice-reward-title">Choose Your Reward</div>`;
  const grid = document.createElement("div");
  grid.className = "cg-choice-reward-grid";
  for (let i = 0; i < choices.length; i++) {
    const ch = choices[i];
    const el = document.createElement("div");
    el.className = "cg-choice-reward-item";
    el.innerHTML = `
      <div class="cg-choice-reward-type">${escHtml(ch.type)}</div>
      <div class="cg-choice-reward-label">${escHtml(ch.label)}</div>
    `;
    el.addEventListener("click", () => { overlay.remove(); onPick?.(ch, i); });
    grid.appendChild(el);
  }
  inner.appendChild(grid);
  overlay.appendChild(inner);
  document.body.appendChild(overlay);
  return overlay;
}
