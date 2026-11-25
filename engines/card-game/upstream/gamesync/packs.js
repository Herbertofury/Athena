/**
 * @module cardgame/packs
 * @description Pack opening ceremony — vault room, pack stacks, open ritual,
 * card reveal animation, rarity telegraphing, mass-open support.
 *
 * §11: 5 cards per pack, 10 pack families, up to 40 mass-open.
 */

import { cardEl } from "./board.js";
import { PACK_ICONS, iconEl } from "./icons.js";

/* ═══════════════════════════════════════════════════════════════════════════
   Pack Families (§11.2)
   ═══════════════════════════════════════════════════════════════════════════ */

export const PACK_FAMILIES = {
  core:       { id: "core",       label: "Core Library",    iconKey: "core",       desc: "Standard game cards." },
  mod:        { id: "mod",        label: "Mod Ecosystem",   iconKey: "mod",        desc: "Mod-derived cards." },
  platform:   { id: "platform",   label: "Platform",        iconKey: "platform",   desc: "Platform-themed cards." },
  genre:      { id: "genre",      label: "Genre",           iconKey: "genre",      desc: "Genre-focused cards." },
  expansion:  { id: "expansion",  label: "Expansion",       iconKey: "expansion",  desc: "Expansion & event cards." },
  hero:       { id: "hero",       label: "Hero",            iconKey: "hero",       desc: "Hero-themed cards." },
  cosmetic:   { id: "cosmetic",   label: "Cosmetic",        iconKey: "cosmetic",   desc: "Visual upgrades." },
  draft:      { id: "draft",      label: "Draft Reward",    iconKey: "draft",      desc: "Earned from draft runs." },
  achievement:{ id: "achievement",label: "Achievement",     iconKey: "achievement",desc: "Achievement rewards." },
  catchup:    { id: "catchup",    label: "Catch-Up",        iconKey: "catchup",    desc: "Recovery & starter packs." },
};

/**
 * Build dynamic developer-based pack families from the card pool.
 * Each developer with 2+ games gets their own pack family.
 */
export function buildDeveloperPacks(poolArray) {
  const devMap = new Map();
  for (const entry of poolArray) {
    const card = entry.card;
    if (!card || card.source !== "game") continue;
    const dev = (card.developer || "").trim();
    if (!dev) continue;
    if (!devMap.has(dev)) devMap.set(dev, []);
    devMap.get(dev).push(card);
  }
  // Sort by game count descending
  return Array.from(devMap.entries())
    .filter(([, cards]) => cards.length >= 1)
    .sort((a, b) => b[1].length - a[1].length)
    .map(([dev, cards]) => ({
      id: `dev:${dev.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
      label: dev,
      iconKey: "core",
      desc: `${cards.length} game${cards.length > 1 ? "s" : ""} from ${dev}.`,
      developer: dev,
      cards,
    }));
}

const CARDS_PER_PACK = 5;
const MAX_MASS_OPEN = 40;

/* ═══════════════════════════════════════════════════════════════════════════
   Pack Generation (determine contents)
   ═══════════════════════════════════════════════════════════════════════════ */

export function generatePackContents(poolArray, familyId, rng, profile, devPacks) {
  if (!poolArray || poolArray.length === 0) return [];
  const rand = rng || (() => Math.random());
  const owned = profile?.collection?.ownedCards || {};

  // Normalize poolArray entries → flat cards array
  const allCards = poolArray.map(e => e.card || e).filter(Boolean);

  // Filter pool by family affinity
  let eligible = allCards;
  if (familyId === "mod") {
    eligible = allCards.filter(c => c.source === "mod");
  } else if (familyId === "core") {
    eligible = allCards.filter(c => c.source === "game");
  } else if (familyId.startsWith("dev:") && devPacks) {
    // Developer-specific pack: only cards from that developer
    const devPack = devPacks.find(dp => dp.id === familyId);
    if (devPack?.cards?.length) eligible = devPack.cards;
  }
  if (eligible.length < CARDS_PER_PACK) eligible = allCards;

  // Packs now give UPGRADED versions of cards the user already owns.
  // Each card in the pack is an upgrade tier: rare → epic → legendary.
  const UPGRADE_ORDER = ["common", "rare", "epic", "legendary"];
  const result = [];
  const usedIds = new Set(); // no duplicates within one pack

  function upgradeCard(card) {
    const currentOwned = owned[card.id] || 0;
    // Determine upgrade tier based on ownership count:
    // owned 1 = common (base), pack gives rare upgrade
    // owned 2 = has rare, pack gives epic upgrade
    // owned 3+ = has epic, pack gives legendary upgrade
    const baseIdx = UPGRADE_ORDER.indexOf((card.rarity || "common").toLowerCase());
    let upgradeIdx = Math.min(baseIdx + 1, UPGRADE_ORDER.length - 1);
    if (currentOwned >= 3) upgradeIdx = 3; // legendary
    else if (currentOwned >= 2) upgradeIdx = Math.min(baseIdx + 2, 3); // epic
    else upgradeIdx = Math.min(baseIdx + 1, 3); // rare
    return {
      ...card,
      upgradedRarity: UPGRADE_ORDER[upgradeIdx],
      isUpgrade: upgradeIdx > baseIdx,
    };
  }

  function pickUnique(pool, preferRarity) {
    // Try to pick a card we haven't used yet
    const candidates = pool.filter(c => !usedIds.has(c.id));
    const bucket = candidates.length ? candidates : pool;
    if (preferRarity) {
      const rarityFiltered = bucket.filter(c => (c.rarity || "common") === preferRarity);
      if (rarityFiltered.length) {
        const pick = rarityFiltered[Math.floor(rand() * rarityFiltered.length)];
        usedIds.add(pick.id);
        return pick;
      }
    }
    const pick = bucket[Math.floor(rand() * bucket.length)];
    usedIds.add(pick.id);
    return pick;
  }

  // First 4 cards: weighted random with upgrades
  for (let i = 0; i < CARDS_PER_PACK - 1; i++) {
    const roll = rand();
    let rarity;
    if (roll < 0.55) rarity = null; // any — will become upgrade
    else if (roll < 0.80) rarity = "rare";
    else if (roll < 0.95) rarity = "epic";
    else rarity = "legendary";
    const card = pickUnique(eligible, rarity);
    const upgraded = upgradeCard(card);
    const isNew = !(owned[card.id] > 0);
    const isDuplicate = false; // upgrades are never duplicates
    const isPremium = rand() < 0.05;
    result.push({ ...upgraded, isNew, isDuplicate, isPremium, rarity: upgraded.upgradedRarity || card.rarity });
  }

  // 5th card: guaranteed epic+
  const rareRoll = rand();
  let fifthRarity;
  if (rareRoll < 0.60) fifthRarity = "epic";
  else fifthRarity = "legendary";
  const rareCard = pickUnique(eligible, fifthRarity);
  const upgradedRare = upgradeCard(rareCard);
  const isNew5 = !(owned[rareCard.id] > 0);
  const isPrem5 = rand() < 0.08;
  result.push({ ...upgradedRare, isNew: isNew5, isDuplicate: false, isPremium: isPrem5, rarity: upgradedRare.upgradedRarity || rareCard.rarity });

  // Bonus awards by pack family
  const bonuses = [];
  if (familyId === "hero" && rand() < 0.15) bonuses.push({ type: "hero", id: `hero_${Math.floor(rand() * 100)}`, label: "Hero Fragment" });
  if (familyId === "cosmetic" && rand() < 0.25) bonuses.push({ type: "cosmetic", id: `cos_${Math.floor(rand() * 100)}`, label: "Cosmetic Item" });
  if (rand() < 0.10) bonuses.push({ type: "dust", amount: [10, 20, 40, 100][Math.floor(rand() * 4)], label: "Crafting Dust" });
  if (familyId === "draft" && rand() < 0.20) bonuses.push({ type: "ticket", id: "draft_ticket", label: "Draft Ticket" });
  if (familyId === "expansion" && rand() < 0.12) bonuses.push({ type: "token", id: "event_token", amount: 1, label: "Event Token" });

  for (const bonus of bonuses) result.push(bonus);

  return result;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Apply Pack to Profile
   ═══════════════════════════════════════════════════════════════════════════ */

export function applyPackToProfile(profile, cards) {
  if (!profile || !cards) return;
  const DUST_REFUND = { common: 5, rare: 20, epic: 100, legendary: 400 };

  for (const item of cards) {
    // Handle bonus awards (non-card items)
    if (item.type === "dust") {
      profile.currency = profile.currency || {};
      profile.currency.dust = (profile.currency.dust || 0) + (item.amount || 0);
      continue;
    }
    if (item.type === "ticket") {
      profile.currency = profile.currency || {};
      profile.currency.tickets = (profile.currency.tickets || 0) + 1;
      continue;
    }
    if (item.type === "token") {
      profile.currency = profile.currency || {};
      profile.currency.eventTokens = (profile.currency.eventTokens || 0) + (item.amount || 1);
      continue;
    }
    if (item.type === "hero") {
      profile.unlockedHeroes = profile.unlockedHeroes || {};
      profile.unlockedHeroes[item.id] = true;
      continue;
    }
    if (item.type === "cosmetic") {
      profile.cosmetics = profile.cosmetics || [];
      profile.cosmetics.push(item.id);
      continue;
    }

    // Normal card handling
    if (!item.id) continue;
    const prevOwned = profile.collection.ownedCards[item.id] || 0;
    profile.collection.ownedCards[item.id] = prevOwned + 1;
    profile.collection.newCards = profile.collection.newCards || {};
    profile.collection.newCards[item.id] = true;

    // Duplicate → auto-dust refund
    if (item.isDuplicate) {
      const dustGain = DUST_REFUND[item.rarity] || 5;
      profile.currency = profile.currency || {};
      profile.currency.dust = (profile.currency.dust || 0) + dustGain;
      item.dustRefund = dustGain;
    }
  }

  // Record in pack history
  profile.packs.history.push({
    ts: Date.now(),
    cards: cards.filter(c => c.id).map(c => ({
      id: c.id,
      rarity: c.rarity,
      isNew: c.isNew,
      isDuplicate: c.isDuplicate,
      isPremium: c.isPremium,
    })),
    bonuses: cards.filter(c => c.type && !c.id).map(c => ({ type: c.type, label: c.label, amount: c.amount })),
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   Render Pack Room
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderPackRoom(profile, poolArray, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-pack-room";

  const title = document.createElement("div");
  title.className = "cg-pack-vault-title";
  title.textContent = "Pack Vault";
  root.appendChild(title);

  const subtitle = document.createElement("div");
  subtitle.className = "cg-pack-vault-subtitle";
  subtitle.textContent = "Open packs to upgrade your cards to higher rarities.";
  root.appendChild(subtitle);

  // Build developer packs from the pool
  const devPacks = buildDeveloperPacks(poolArray);

  // === Developer Packs Section ===
  if (devPacks.length > 0) {
    const devSection = document.createElement("div");
    devSection.className = "cg-pack-section";
    const devHeading = document.createElement("div");
    devHeading.className = "cg-pack-section-heading";
    devHeading.textContent = "Developer Packs";
    devSection.appendChild(devHeading);

    const devStacks = document.createElement("div");
    devStacks.className = "cg-pack-stacks";

    const unopened = profile?.packs?.unopened || {};

    for (const dp of devPacks) {
      const count = unopened[dp.id] || 0;
      const stack = document.createElement("div");
      stack.className = `cg-pack-stack${count <= 0 ? " cg-pack-stack-empty" : ""}`;
      stack.dataset.family = dp.id;

      const stackIconWrap = document.createElement("div");
      stackIconWrap.className = "cg-pack-stack-icon";
      // Use the developer's first letter as icon
      const devInitial = document.createElement("div");
      devInitial.className = "cg-pack-dev-initial";
      devInitial.textContent = dp.label.charAt(0).toUpperCase();
      stackIconWrap.appendChild(devInitial);
      stack.appendChild(stackIconWrap);

      const stackName = document.createElement("div");
      stackName.className = "cg-pack-stack-name";
      stackName.textContent = dp.label;
      stack.appendChild(stackName);

      const stackCount = document.createElement("div");
      stackCount.className = "cg-pack-stack-count";
      stackCount.textContent = count;
      stack.appendChild(stackCount);

      const stackDesc = document.createElement("div");
      stackDesc.className = "cg-pack-stack-desc";
      stackDesc.textContent = dp.desc;
      stack.appendChild(stackDesc);

      if (count > 0) {
        stack.addEventListener("click", () => {
          openPackCeremony(root, dp.id, poolArray, profile, callbacks, devPacks);
        });
      }
      devStacks.appendChild(stack);
    }
    devSection.appendChild(devStacks);
    root.appendChild(devSection);
  }

  // === Standard Pack Families ===
  const stdSection = document.createElement("div");
  stdSection.className = "cg-pack-section";
  const stdHeading = document.createElement("div");
  stdHeading.className = "cg-pack-section-heading";
  stdHeading.textContent = "Standard Packs";
  stdSection.appendChild(stdHeading);

  const stacks = document.createElement("div");
  stacks.className = "cg-pack-stacks";

  const unopened = profile?.packs?.unopened || {};

  for (const [famId, fam] of Object.entries(PACK_FAMILIES)) {
    const count = unopened[famId] || 0;
    const stack = document.createElement("div");
    stack.className = `cg-pack-stack${count <= 0 ? " cg-pack-stack-empty" : ""}`;
    stack.dataset.family = famId;
    const stackIconWrap = document.createElement("div");
    stackIconWrap.className = "cg-pack-stack-icon";
    const packSvg = PACK_ICONS[famId];
    if (packSvg) stackIconWrap.appendChild(iconEl(packSvg, "cg-pack-icon"));
    stack.appendChild(stackIconWrap);

    const stackName = document.createElement("div");
    stackName.className = "cg-pack-stack-name";
    stackName.textContent = fam.label;
    stack.appendChild(stackName);

    const stackCount = document.createElement("div");
    stackCount.className = "cg-pack-stack-count";
    stackCount.textContent = count;
    stack.appendChild(stackCount);

    if (count > 0) {
      stack.addEventListener("click", () => {
        openPackCeremony(root, famId, poolArray, profile, callbacks);
      });
    }
    stacks.appendChild(stack);
  }

  root.appendChild(stacks);

  // Action bar: mass open + history
  const actionBar = document.createElement("div");
  actionBar.style.cssText = "display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;";

  const massBtn = document.createElement("button");
  massBtn.className = "cg-btn cg-btn-gold";
  massBtn.textContent = "Mass Open All";
  massBtn.addEventListener("click", () => {
    if (callbacks.onMassOpen) callbacks.onMassOpen();
  });
  actionBar.appendChild(massBtn);

  const historyBtn = document.createElement("button");
  historyBtn.className = "cg-btn";
  historyBtn.textContent = "Pack History";
  historyBtn.addEventListener("click", () => {
    renderPackHistory(root, profile);
  });
  actionBar.appendChild(historyBtn);

  root.appendChild(actionBar);

  return root;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Single Pack Opening Ceremony
   ═══════════════════════════════════════════════════════════════════════════ */

export function openPackCeremony(container, familyId, poolArray, profile, callbacks, devPacks) {
  const unopened = profile?.packs?.unopened || {};
  if ((unopened[familyId] || 0) <= 0) return;

  // Decrement pack count
  unopened[familyId]--;

  // Generate contents with profile context for new/dupe detection
  const cards = generatePackContents(poolArray, familyId, null, profile, devPacks);
  const cardItems = cards.filter(c => c.id); // Actual cards (not bonus awards)
  const bonusItems = cards.filter(c => c.type && !c.id);

  // Apply to profile
  applyPackToProfile(profile, cards);

  // Render ceremony overlay
  const ceremonyEl = document.createElement("div");
  ceremonyEl.className = "cg-overlay";
  ceremonyEl.style.flexDirection = "column";
  ceremonyEl.style.gap = "24px";

  const fam = PACK_FAMILIES[familyId] || (devPacks || []).find(dp => dp.id === familyId) || {};
  const stageTitle = document.createElement("div");
  stageTitle.className = "cg-ceremony-title";
  const titleIcon = PACK_ICONS[familyId] || PACK_ICONS["core"];
  if (titleIcon) stageTitle.appendChild(iconEl(titleIcon, "cg-ceremony-title-icon"));
  const titleText = document.createTextNode(` ${fam.label || "Pack"} Opening`);
  stageTitle.appendChild(titleText);
  ceremonyEl.appendChild(stageTitle);

  // Sealed pack from visible stack (§11.4: pack selected from visible stack → center stage)
  const stage = document.createElement("div");
  stage.className = "cg-pack-stage";
  const sealed = document.createElement("div");
  sealed.className = "cg-pack-sealed";
  const sealedIcon = PACK_ICONS[familyId];
  if (sealedIcon) sealed.appendChild(iconEl(sealedIcon, "cg-pack-sealed-icon"));
  stage.appendChild(sealed);
  ceremonyEl.appendChild(stage);

  let skipMode = false;

  sealed.addEventListener("click", () => {
    sealed.classList.add("opening");
    setTimeout(() => {
      stage.remove();

      // Reveal container
      const reveal = document.createElement("div");
      reveal.className = "cg-pack-reveal";
      ceremonyEl.insertBefore(reveal, ceremonyEl.lastElementChild);

      // Sort by rarity (legendary last) for dramatic build-up
      const raritySort = { common: 0, rare: 1, epic: 2, legendary: 3 };
      const sorted = [...cardItems].sort((a, b) => (raritySort[a.rarity] || 0) - (raritySort[b.rarity] || 0));

      // Staggered reveal with rarity telegraphing
      let revealIndex = 0;
      function revealNext() {
        if (revealIndex >= sorted.length) {
          // All cards revealed — show summary
          showPackSummary();
          return;
        }
        const card = sorted[revealIndex];
        const cardWrap = document.createElement("div");
        cardWrap.className = `cg-pack-card-wrap cg-pack-rarity-${card.rarity || "common"}`;
        cardWrap.style.flex = "0 0 130px";

        // Rarity telegraphing glow (§11.1: before full reveal)
        const rarityGlow = document.createElement("div");
        rarityGlow.className = `cg-rarity-telegraph cg-rarity-glow-${card.rarity || "common"}`;
        cardWrap.appendChild(rarityGlow);

        // Card element
        const el = cardEl(card, { mode: "collection" });
        el.style.opacity = "0";
        el.style.transition = "opacity 0.3s ease";
        cardWrap.appendChild(el);

        // New badge
        if (card.isNew) {
          const newBadge = document.createElement("div");
          newBadge.className = "cg-pack-new-badge";
          newBadge.textContent = "NEW!";
          cardWrap.appendChild(newBadge);
        }

        // Duplicate dust refund
        if (card.isDuplicate && card.dustRefund) {
          const dustBadge = document.createElement("div");
          dustBadge.className = "cg-pack-dust-badge";
          dustBadge.textContent = `+${card.dustRefund} dust`;
          cardWrap.appendChild(dustBadge);
        }

        // Premium shimmer
        if (card.isPremium) {
          cardWrap.classList.add("cg-premium-shimmer");
          const premTag = document.createElement("div");
          premTag.className = "cg-pack-premium-tag";
          premTag.textContent = "\u2728 PREMIUM";
          cardWrap.appendChild(premTag);
        }

        reveal.appendChild(cardWrap);

        // After short delay, fade in the card (telegraphing → reveal)
        const delay = skipMode ? 50 : (card.rarity === "legendary" ? 600 : card.rarity === "epic" ? 400 : 200);
        setTimeout(() => {
          el.style.opacity = "1";
          rarityGlow.style.opacity = "0";
          revealIndex++;
          const nextDelay = skipMode ? 50 : (card.rarity === "legendary" ? 800 : 300);
          setTimeout(revealNext, nextDelay);
        }, delay);
      }

      revealNext();
      callbacks.onReveal?.(cards);
    }, 500);
  });

  // Summary screen (§11.4, §11.5)
  function showPackSummary() {
    const summary = document.createElement("div");
    summary.className = "cg-pack-summary";

    // Bonus awards
    if (bonusItems.length) {
      const bonusDiv = document.createElement("div");
      bonusDiv.className = "cg-pack-bonus";
      bonusDiv.innerHTML = bonusItems.map(b => `<span class="cg-pack-bonus-item">${b.label}${b.amount ? ` \u00D7${b.amount}` : ""}</span>`).join("");
      summary.appendChild(bonusDiv);
    }

    // Strong pull recommendation (§11.5)
    const bestCard = cardItems.reduce((best, c) => {
      const rVal = { common: 0, rare: 1, epic: 2, legendary: 3 };
      return (rVal[c.rarity] || 0) > (rVal[best.rarity] || 0) ? c : best;
    }, cardItems[0]);
    if (bestCard && (bestCard.rarity === "epic" || bestCard.rarity === "legendary")) {
      const rec = document.createElement("div");
      rec.className = "cg-pack-recommendation";
      rec.textContent = `\u2B50 ${bestCard.name} is a strong pull! Check recommended decks.`;
      summary.appendChild(rec);
    }

    // New cards notice
    const newCount = cardItems.filter(c => c.isNew).length;
    if (newCount > 0) {
      const newNotice = document.createElement("div");
      newNotice.className = "cg-pack-new-notice";
      newNotice.textContent = `${newCount} new card${newCount > 1 ? "s" : ""} added to your collection!`;
      summary.appendChild(newNotice);
    }

    // Action buttons (§11.4 next actions)
    const summaryActions = document.createElement("div");
    summaryActions.className = "cg-pack-summary-actions";
    summaryActions.innerHTML = `
      <button class="cg-btn cg-pack-act-deck">Add to Deck</button>
      <button class="cg-btn cg-pack-act-build">Build Around</button>
      <button class="cg-btn cg-btn-gold cg-pack-act-next">Open Next</button>
      <button class="cg-btn cg-pack-act-collection">Go to Collection</button>
    `;
    summary.appendChild(summaryActions);

    ceremonyEl.insertBefore(summary, ceremonyEl.lastElementChild);

    summaryActions.querySelector(".cg-pack-act-deck")?.addEventListener("click", () => {
      callbacks.onAddToDeck?.(cardItems);
    });
    summaryActions.querySelector(".cg-pack-act-build")?.addEventListener("click", () => {
      callbacks.onBuildAround?.(bestCard);
    });
    summaryActions.querySelector(".cg-pack-act-next")?.addEventListener("click", () => {
      ceremonyEl.remove();
      openPackCeremony(container, familyId, poolArray, profile, callbacks);
    });
    summaryActions.querySelector(".cg-pack-act-collection")?.addEventListener("click", () => {
      ceremonyEl.remove();
      callbacks.onGoToCollection?.();
    });
  }

  // Skip animations button (§11.5)
  const skipBtn = document.createElement("button");
  skipBtn.className = "cg-btn cg-pack-skip";
  skipBtn.textContent = "Skip to Reveal";
  skipBtn.style.cssText = "position:absolute;top:12px;right:12px;font-size:10px;opacity:0.5;z-index:10;";
  skipBtn.addEventListener("click", () => { skipMode = true; });
  ceremonyEl.appendChild(skipBtn);

  // Close / Done button
  const closeBtn = document.createElement("button");
  closeBtn.className = "cg-btn";
  closeBtn.textContent = "Done";
  closeBtn.addEventListener("click", () => {
    ceremonyEl.remove();
    callbacks.onPackOpened?.(cards, familyId);
  });
  ceremonyEl.appendChild(closeBtn);

  container.appendChild(ceremonyEl);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Pack History Log (§11.5)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderPackHistory(container, profile) {
  const history = profile?.packs?.history || [];
  const overlay = document.createElement("div");
  overlay.className = "cg-overlay";
  overlay.style.flexDirection = "column";
  overlay.style.gap = "8px";
  overlay.style.overflowY = "auto";

  const title = document.createElement("div");
  title.style.cssText = "font-size:18px;font-weight:900;";
  title.textContent = "Pack History";
  overlay.appendChild(title);

  if (history.length === 0) {
    const empty = document.createElement("div");
    empty.style.cssText = "color:rgba(255,255,255,.40);font-size:13px;";
    empty.textContent = "No packs opened yet.";
    overlay.appendChild(empty);
  } else {
    const recent = history.slice(-20).reverse();
    for (const entry of recent) {
      const row = document.createElement("div");
      row.className = "cg-pack-history-row";
      const d = new Date(entry.ts);
      const ts = d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const cardNames = (entry.cards || []).map(c => typeof c === "string" ? c : (c.id || "?")).join(", ");
      row.innerHTML = `<span style="color:rgba(255,255,255,.40);font-size:10px;">${ts}</span> <span style="font-size:11px;">${cardNames}</span>`;
      overlay.appendChild(row);
    }
  }

  const closeBtn = document.createElement("button");
  closeBtn.className = "cg-btn";
  closeBtn.textContent = "Close";
  closeBtn.addEventListener("click", () => overlay.remove());
  overlay.appendChild(closeBtn);
  container.appendChild(overlay);
}
