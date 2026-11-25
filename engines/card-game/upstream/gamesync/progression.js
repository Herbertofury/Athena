/**
 * @module cardgame/progression
 * @description Progression system — XP, quests, rewards track, achievements.
 * §12: daily/weekly/event quests, XP from matches, claimable reward nodes.
 */

import {
  QUEST_TYPE_ICONS, REWARD_TYPE_ICONS, ICON_ACHIEVEMENT, iconEl,
} from "./icons.js";

/* ═══════════════════════════════════════════════════════════════════════════
   XP & Leveling
   ═══════════════════════════════════════════════════════════════════════════ */

const XP_PER_LEVEL = 100; // XP needed per level
const XP_SCALING = 1.12;   // Each level needs 12% more

export function xpForLevel(level) {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_SCALING, Math.max(0, level - 1)));
}

export function addXp(profile, amount) {
  if (!profile?.progression) return;
  profile.progression.xp += Math.max(0, Math.floor(amount));

  // Level up loop
  while (true) {
    const needed = xpForLevel(profile.progression.level);
    if (profile.progression.xp >= needed) {
      profile.progression.xp -= needed;
      profile.progression.level++;
    } else {
      break;
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Match Rewards
   ═══════════════════════════════════════════════════════════════════════════ */

export function computeMatchRewards(result, turnCount) {
  const rewards = { xp: 0, gold: 0 };

  // Base XP
  if (result === "victory") {
    rewards.xp = 50 + Math.min(turnCount * 3, 30);
    rewards.gold = 10;
  } else if (result === "defeat") {
    rewards.xp = 20 + Math.min(turnCount * 2, 20);
    rewards.gold = 3;
  } else {
    rewards.xp = 30;
    rewards.gold = 5;
  }

  return rewards;
}

export function applyMatchRewards(profile, result, turnCount) {
  const rewards = computeMatchRewards(result, turnCount);
  addXp(profile, rewards.xp);
  profile.collection.gold = (profile.collection.gold || 0) + rewards.gold;

  // Update stats
  const stats = profile.stats;
  stats.totalMatches = (stats.totalMatches || 0) + 1;
  if (result === "victory") stats.wins = (stats.wins || 0) + 1;
  else if (result === "defeat") stats.losses = (stats.losses || 0) + 1;
  else stats.draws = (stats.draws || 0) + 1;

  return rewards;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Quests (§12.2)
   ═══════════════════════════════════════════════════════════════════════════ */

export const QUEST_TEMPLATES = [
  // Daily
  { id: "play3",       type: "daily",  title: "Play 3 Matches",           target: 3,  rewardXp: 40, rewardGold: 10, track: "matchesPlayed" },
  { id: "win1",        type: "daily",  title: "Win a Match",              target: 1,  rewardXp: 50, rewardGold: 15, track: "wins" },
  { id: "play5mods",   type: "daily",  title: "Play 5 Mod Cards",         target: 5,  rewardXp: 35, rewardGold: 10, track: "modCardsPlayed" },
  { id: "summon10",    type: "daily",  title: "Summon 10 Minions",        target: 10, rewardXp: 30, rewardGold: 8,  track: "minionsSummoned" },
  { id: "useHeroPower3",type: "daily", title: "Use Hero Power 3 Times",   target: 3,  rewardXp: 25, rewardGold: 8,  track: "heroPowersUsed" },
  { id: "destroy8",    type: "daily",  title: "Destroy 8 Enemy Minions",  target: 8,  rewardXp: 40, rewardGold: 10, track: "minionsDestroyed" },

  // Weekly
  { id: "win5",        type: "weekly", title: "Win 5 Matches",            target: 5,  rewardXp: 150, rewardGold: 50, track: "wins" },
  { id: "play20cards", type: "weekly", title: "Play 20 Cards",            target: 20, rewardXp: 100, rewardGold: 30, track: "cardsPlayed" },
  { id: "deal100dmg",  type: "weekly", title: "Deal 100 Total Damage",    target: 100,rewardXp: 120, rewardGold: 40, track: "damageDealt" },

  // Event
  { id: "openPack3",   type: "event",  title: "Open 3 Packs",            target: 3,  rewardXp: 80, rewardGold: 20, track: "packsOpened" },
  { id: "buildDeck",   type: "event",  title: "Build a New Deck",         target: 1,  rewardXp: 60, rewardGold: 15, track: "decksBuilt" },

  // Mode-specific (§12.2)
  { id: "draftWin",    type: "daily",  title: "Win a Draft Match",        target: 1,  rewardXp: 60, rewardGold: 20, track: "draftWins", mode: "draft" },
  { id: "brawlPlay",   type: "weekly", title: "Play 3 Brawl Matches",    target: 3,  rewardXp: 80, rewardGold: 25, track: "brawlPlayed", mode: "brawl" },
  { id: "rankedWin3",  type: "weekly", title: "Win 3 Ranked Matches",    target: 3,  rewardXp: 120, rewardGold: 40, track: "rankedWins", mode: "ranked" },

  // Hero-specific (§12.2)
  { id: "heroWin",     type: "daily",  title: "Win with a Specific Hero", target: 1,  rewardXp: 50, rewardGold: 15, track: "heroWins", heroRequired: true },
  { id: "heroPower5",  type: "weekly", title: "Use Hero Power 5 Times",  target: 5,  rewardXp: 60, rewardGold: 15, track: "heroPowersUsed", heroRequired: true },

  // Ecosystem-specific (§12.2)
  { id: "ecoInstall5", type: "daily",  title: "Install 5 Mods on Valid Targets",  target: 5,  rewardXp: 45, rewardGold: 12, track: "modsInstalled" },
  { id: "ecoStab3",    type: "daily",  title: "Stabilize 3 Volatile Cards",       target: 3,  rewardXp: 40, rewardGold: 12, track: "volatileStabilized" },
  { id: "ecoPlatHero", type: "daily",  title: "Win with a Platform Hero",         target: 1,  rewardXp: 50, rewardGold: 15, track: "platformHeroWins" },
  { id: "ecoPatch8",   type: "weekly", title: "Play 8 Patch Cards",               target: 8,  rewardXp: 70, rewardGold: 20, track: "patchCardsPlayed" },
  { id: "ecoDiscover3",type: "daily",  title: "Discover from 3 Ecosystems",       target: 3,  rewardXp: 45, rewardGold: 12, track: "ecosystemsDiscovered" },
  { id: "ecoDraft1",   type: "weekly", title: "Complete a Draft Run",             target: 1,  rewardXp: 100, rewardGold: 30, track: "draftRunsCompleted" },
  { id: "ecoRisky1",   type: "event",  title: "Win with Only High-Risk Mod Cards",target: 1,  rewardXp: 80, rewardGold: 25, track: "riskyModWins" },
  { id: "ecoFrame3",   type: "event",  title: "Finish a Game with 3 Frameworks",  target: 1,  rewardXp: 70, rewardGold: 20, track: "frameworkFinishes" },

  // Progressive quest chains (§12.2)
  { id: "chain_novice1", type: "daily", title: "Novice I: Play Your First Match",  target: 1,  rewardXp: 30, rewardGold: 10, track: "matchesPlayed", chain: "novice", chainStep: 1 },
  { id: "chain_novice2", type: "daily", title: "Novice II: Win Your First Match",  target: 1,  rewardXp: 50, rewardGold: 20, track: "wins", chain: "novice", chainStep: 2, requires: "chain_novice1" },
  { id: "chain_novice3", type: "daily", title: "Novice III: Build Your First Deck",target: 1,  rewardXp: 60, rewardGold: 25, track: "decksBuilt", chain: "novice", chainStep: 3, requires: "chain_novice2" },
  { id: "chain_collector1",type: "weekly",title: "Collector I: Own 20 Unique Cards",target: 20, rewardXp: 80, rewardGold: 30, track: "uniqueCardsOwned", chain: "collector", chainStep: 1 },
  { id: "chain_collector2",type: "weekly",title: "Collector II: Own 50 Unique Cards",target: 50,rewardXp: 120,rewardGold: 50, track: "uniqueCardsOwned", chain: "collector", chainStep: 2, requires: "chain_collector1" },
];

export function assignDailyQuests(profile) {
  const daily = QUEST_TEMPLATES.filter(q => q.type === "daily");
  if (!profile.quests) profile.quests = { daily: [], weekly: [], event: [], completed: [] };

  // Assign up to 3 daily if empty
  if (profile.quests.daily.length < 3) {
    const shuffled = [...daily].sort(() => Math.random() - 0.5);
    while (profile.quests.daily.length < 3 && shuffled.length > 0) {
      const template = shuffled.pop();
      if (profile.quests.daily.some(q => q.id === template.id)) continue;
      profile.quests.daily.push({
        ...template,
        progress: 0,
        assignedAt: Date.now(),
      });
    }
  }
}

export function assignWeeklyQuests(profile) {
  const weekly = QUEST_TEMPLATES.filter(q => q.type === "weekly");
  if (!profile.quests) profile.quests = { daily: [], weekly: [], event: [], completed: [] };

  if (profile.quests.weekly.length < 2) {
    const shuffled = [...weekly].sort(() => Math.random() - 0.5);
    while (profile.quests.weekly.length < 2 && shuffled.length > 0) {
      const template = shuffled.pop();
      if (profile.quests.weekly.some(q => q.id === template.id)) continue;
      profile.quests.weekly.push({
        ...template,
        progress: 0,
        assignedAt: Date.now(),
      });
    }
  }
}

export function updateQuestProgress(profile, trackKey, increment = 1) {
  if (!profile?.quests) return [];
  const completed = [];

  for (const questList of [profile.quests.daily, profile.quests.weekly, profile.quests.event]) {
    if (!questList) continue;
    for (let i = questList.length - 1; i >= 0; i--) {
      const q = questList[i];
      if (q.track !== trackKey) continue;
      q.progress = Math.min((q.progress || 0) + increment, q.target);
      if (q.progress >= q.target) {
        // Complete quest
        completed.push(q);
        addXp(profile, q.rewardXp || 0);
        profile.collection.gold = (profile.collection.gold || 0) + (q.rewardGold || 0);
        profile.quests.completed.push({ ...q, completedAt: Date.now() });
        questList.splice(i, 1);
      }
    }
  }

  return completed;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Rewards Track (§12.3)
   ═══════════════════════════════════════════════════════════════════════════ */

export const REWARDS_TRACK = [
  // Free track (§12.3)
  { level: 1,  reward: { type: "pack", family: "core", count: 1 }, track: "free" },
  { level: 2,  reward: { type: "gold", amount: 25 }, track: "free" },
  { level: 3,  reward: { type: "pack", family: "core", count: 1 }, track: "free" },
  { level: 4,  reward: { type: "coin", id: "basic_coin" }, track: "free" },
  { level: 5,  reward: { type: "pack", family: "mod", count: 1 }, track: "free" },
  { level: 7,  reward: { type: "gold", amount: 50 }, track: "free" },
  { level: 8,  reward: { type: "cardBack", id: "starter_back" }, track: "free" },
  { level: 10, reward: { type: "pack", family: "core", count: 2 }, track: "free" },
  { level: 12, reward: { type: "ticket", count: 1 }, track: "free" },
  { level: 14, reward: { type: "board", id: "basic_board" }, track: "free" },
  { level: 15, reward: { type: "pack", family: "expansion", count: 1 }, track: "free" },
  { level: 18, reward: { type: "gold", amount: 75 }, track: "free" },
  { level: 20, reward: { type: "pack", family: "hero", count: 1 }, track: "free" },
  { level: 22, reward: { type: "heroSkin", id: "alt_skin_1", hero: "any" }, track: "free" },
  { level: 25, reward: { type: "pack", family: "core", count: 3 }, track: "free" },
  { level: 28, reward: { type: "strike", id: "lightning_strike" }, track: "free" },
  { level: 30, reward: { type: "cosmetic", item: "cardBack" }, track: "free" },
  { level: 33, reward: { type: "coin", id: "silver_coin" }, track: "free" },
  { level: 35, reward: { type: "pack", family: "expansion", count: 2 }, track: "free" },
  { level: 38, reward: { type: "specialCard", cardId: "event_rare_1" }, track: "free" },
  { level: 40, reward: { type: "gold", amount: 150 }, track: "free" },
  { level: 45, reward: { type: "board", id: "forge_board" }, track: "free" },
  { level: 50, reward: { type: "pack", family: "legendary", count: 1 }, track: "free" },

  // Premium track milestones (§12.3 — premium support)
  { level: 5,  reward: { type: "heroSkin", id: "premium_skin_1", hero: "any" }, track: "premium" },
  { level: 10, reward: { type: "cardBack", id: "gold_back" }, track: "premium" },
  { level: 15, reward: { type: "coin", id: "gold_coin" }, track: "premium" },
  { level: 20, reward: { type: "board", id: "neon_board" }, track: "premium" },
  { level: 25, reward: { type: "pack", family: "cosmetic", count: 2 }, track: "premium" },
  { level: 30, reward: { type: "strike", id: "fire_strike" }, track: "premium" },
  { level: 35, reward: { type: "heroSkin", id: "premium_skin_2", hero: "any" }, track: "premium" },
  { level: 40, reward: { type: "specialCard", cardId: "premium_legendary_1" }, track: "premium" },
  { level: 50, reward: { type: "board", id: "galaxy_board" }, track: "premium" },
];

export function claimRewardsTrack(profile, trackFilter) {
  if (!profile?.progression) return [];
  const claimed = profile.progression.rewardsTrackClaimed || [];
  const newClaims = [];
  const hasPremium = profile?.subscription?.premium === true;
  const filter = trackFilter || "free";

  for (const node of REWARDS_TRACK) {
    // Only claim free track, or premium if player has premium
    if (node.track === "premium" && !hasPremium && filter !== "premium") continue;
    if (filter && node.track !== filter) continue;

    const claimKey = `${node.track}_${node.level}`;
    if (profile.progression.level >= node.level && !claimed.includes(claimKey)) {
      claimed.push(claimKey);
      newClaims.push(node);

      // Apply reward
      const r = node.reward;
      switch (r.type) {
        case "pack":
          profile.packs.unopened[r.family] = (profile.packs.unopened[r.family] || 0) + (r.count || 1);
          break;
        case "gold":
          profile.collection.gold = (profile.collection.gold || 0) + (r.amount || 0);
          break;
        case "ticket":
          profile.collection.tickets = (profile.collection.tickets || 0) + (r.count || 1);
          break;
        case "cosmetic":
          if (!profile.cosmetics.unlocked) profile.cosmetics.unlocked = [];
          profile.cosmetics.unlocked.push(r.item);
          break;
        case "heroSkin":
          profile.cosmetics = profile.cosmetics || {};
          if (!profile.cosmetics.heroSkins) profile.cosmetics.heroSkins = [];
          profile.cosmetics.heroSkins.push(r.id);
          break;
        case "cardBack":
          profile.cosmetics = profile.cosmetics || {};
          if (!profile.cosmetics.cardBacks) profile.cosmetics.cardBacks = [];
          profile.cosmetics.cardBacks.push(r.id);
          break;
        case "coin":
          profile.cosmetics = profile.cosmetics || {};
          if (!profile.cosmetics.coins) profile.cosmetics.coins = [];
          profile.cosmetics.coins.push(r.id);
          break;
        case "board":
          profile.cosmetics = profile.cosmetics || {};
          if (!profile.cosmetics.boards) profile.cosmetics.boards = [];
          profile.cosmetics.boards.push(r.id);
          break;
        case "strike":
          profile.cosmetics = profile.cosmetics || {};
          if (!profile.cosmetics.strikes) profile.cosmetics.strikes = [];
          profile.cosmetics.strikes.push(r.id);
          break;
        case "specialCard":
          if (r.cardId) {
            profile.collection.ownedCards[r.cardId] = (profile.collection.ownedCards[r.cardId] || 0) + 1;
          }
          break;
      }
    }
  }

  profile.progression.rewardsTrackClaimed = claimed;
  return newClaims;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Achievement Definitions & Checker (§12.4)
   ═══════════════════════════════════════════════════════════════════════════ */

export const ACHIEVEMENT_DEFS = [
  // Gameplay achievements
  { id: "first_win",     category: "gameplay",   title: "First Blood",              desc: "Win your first match.",                check: p => (p.stats?.wins || 0) >= 1 },
  { id: "win10",         category: "gameplay",   title: "Veteran Victor",           desc: "Win 10 matches.",                     check: p => (p.stats?.wins || 0) >= 10 },
  { id: "win50",         category: "gameplay",   title: "Battle Hardened",          desc: "Win 50 matches.",                     check: p => (p.stats?.wins || 0) >= 50 },
  { id: "play100",       category: "gameplay",   title: "Century Player",           desc: "Play 100 matches.",                   check: p => (p.stats?.totalMatches || 0) >= 100 },

  // Collection achievements
  { id: "collect20",     category: "collection", title: "Card Collector",           desc: "Own 20 unique cards.",                check: p => Object.keys(p.collection?.ownedCards || {}).length >= 20 },
  { id: "collect100",    category: "collection", title: "Librarian",               desc: "Own 100 unique cards.",               check: p => Object.keys(p.collection?.ownedCards || {}).length >= 100 },
  { id: "collect_all_common", category: "collection", title: "Common Sense",       desc: "Own all common cards.",               check: () => false /* evaluated externally with pool */ },

  // Hero mastery
  { id: "hero_master5",  category: "hero",       title: "Hero Devotee",            desc: "Win 5 games with the same hero.",     check: p => Object.values(p.stats?.heroWins || {}).some(w => w >= 5) },
  { id: "hero_all3",     category: "hero",       title: "Versatile",               desc: "Win with 3 different heroes.",        check: p => Object.keys(p.stats?.heroWins || {}).length >= 3 },

  // Mode achievements
  { id: "draft_complete",category: "mode",       title: "Draft Finisher",           desc: "Complete a draft run.",               check: p => (p.stats?.draftRunsCompleted || 0) >= 1 },
  { id: "brawl_win",     category: "mode",       title: "Brawl Star",              desc: "Win a brawl match.",                  check: p => (p.stats?.brawlWins || 0) >= 1 },

  // Event achievements
  { id: "event_quest3",  category: "event",      title: "Event Enthusiast",         desc: "Complete 3 event quests.",            check: p => (p.stats?.eventQuestsCompleted || 0) >= 3 },

  // Challenge achievements
  { id: "no_loss_run",   category: "challenge",  title: "Undefeated",              desc: "Win 5 matches in a row.",             check: p => (p.stats?.bestWinStreak || 0) >= 5 },
  { id: "budget_win",    category: "challenge",  title: "Budget Champion",          desc: "Win with a deck of only commons.",    check: p => (p.stats?.budgetWins || 0) >= 1 },

  // Pack-opening achievements
  { id: "open10packs",   category: "collection", title: "Pack Rat",                desc: "Open 10 packs.",                      check: p => (p.packs?.history?.length || 0) >= 10 },
  { id: "open50packs",   category: "collection", title: "Pack Fiend",              desc: "Open 50 packs.",                      check: p => (p.packs?.history?.length || 0) >= 50 },

  // Undefeated run
  { id: "perfect_draft", category: "challenge",  title: "Perfect Draft",           desc: "Finish a draft run with 0 losses.",   check: p => (p.stats?.perfectDrafts || 0) >= 1 },
];

export function checkAchievements(profile) {
  if (!profile) return [];
  const earned = profile.achievements || [];
  const earnedIds = new Set(earned.map(a => a.id));
  const newAchievements = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (earnedIds.has(def.id)) continue;
    try {
      if (def.check(profile)) {
        const ach = { id: def.id, category: def.category, title: def.title, desc: def.desc, earnedAt: Date.now() };
        earned.push(ach);
        newAchievements.push(ach);
      }
    } catch (_) { /* skip if check fails */ }
  }

  profile.achievements = earned;
  return newAchievements;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Render Journal Screen
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderJournal(profile, callbacks = {}) {
  const root = document.createElement("div");
  root.className = "cg-journal";

  // Tabs (§12.1 — expanded with Events, Season, Milestones, Runs, Inbox)
  const tabNames = ["Quests", "Rewards", "Achievements", "Profile", "Events", "Season", "Milestones", "Runs", "Inbox"];
  const tabs = document.createElement("div");
  tabs.className = "cg-journal-tabs";
  let activeTab = "Quests";

  for (const name of tabNames) {
    const tab = document.createElement("button");
    tab.className = `cg-journal-tab${name === activeTab ? " active" : ""}`;
    tab.textContent = name;
    tab.addEventListener("click", () => {
      activeTab = name;
      tabs.querySelectorAll(".cg-journal-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderTabContent();
    });
    tabs.appendChild(tab);
  }
  root.appendChild(tabs);

  // XP bar
  const xpSection = document.createElement("div");
  xpSection.style.cssText = "padding:8px 0;";
  const lvl = profile?.progression?.level || 1;
  const xp = profile?.progression?.xp || 0;
  const needed = xpForLevel(lvl);
  const pct = needed > 0 ? Math.min(100, (xp / needed) * 100) : 0;
  xpSection.innerHTML = `
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
      <span style="font-weight:750;">Level ${lvl}</span>
      <span style="color:rgba(255,255,255,.50);">${xp} / ${needed} XP</span>
    </div>
    <div class="cg-xp-bar"><div class="cg-xp-fill" style="width:${pct}%;"></div></div>
  `;
  root.appendChild(xpSection);

  // Content area
  const content = document.createElement("div");
  content.style.cssText = "flex:1;overflow:auto;";
  root.appendChild(content);

  function renderTabContent() {
    content.innerHTML = "";
    switch (activeTab) {
      case "Quests": renderQuestsTab(content, profile); break;
      case "Rewards": renderRewardsTab(content, profile, callbacks); break;
      case "Achievements": renderAchievementsTab(content, profile); break;
      case "Profile": renderProfileTab(content, profile); break;
      case "Events": renderEventsTab(content, profile); break;
      case "Season": renderSeasonTab(content, profile); break;
      case "Milestones": renderMilestonesTab(content, profile); break;
      case "Runs": renderRunsTab(content, profile); break;
      case "Inbox": renderInboxTab(content, profile, callbacks); break;
    }
  }

  renderTabContent();
  return root;
}

function renderQuestsTab(container, profile) {
  const allQuests = [
    ...(profile?.quests?.daily || []).map(q => ({ ...q, category: "Daily" })),
    ...(profile?.quests?.weekly || []).map(q => ({ ...q, category: "Weekly" })),
    ...(profile?.quests?.event || []).map(q => ({ ...q, category: "Event" })),
  ];

  if (allQuests.length === 0) {
    container.innerHTML = `<div style="color:rgba(255,255,255,.40);padding:20px;text-align:center;">No active quests. Check back tomorrow!</div>`;
    return;
  }

  for (const q of allQuests) {
    const el = document.createElement("div");
    el.className = "cg-quest";
    const pct = q.target > 0 ? Math.min(100, (q.progress / q.target) * 100) : 0;
    const questIconWrap = document.createElement("div");
    questIconWrap.className = "cg-quest-icon";
    const qTypeLower = (q.category || "").toLowerCase();
    const qSvg = QUEST_TYPE_ICONS[qTypeLower];
    if (qSvg) questIconWrap.appendChild(iconEl(qSvg, "cg-quest-type-icon"));

    el.appendChild(questIconWrap);
    el.innerHTML += `
      <div class="cg-quest-info">
        <div class="cg-quest-title">${escHtml(q.title || "")}</div>
        <div class="cg-quest-desc">${q.category} · ${q.progress || 0}/${q.target}</div>
        <div class="cg-quest-progress"><div class="cg-quest-progress-fill" style="width:${pct}%;"></div></div>
      </div>
      <div class="cg-quest-reward">+${q.rewardXp || 0} XP · +${q.rewardGold || 0}g</div>
    `;
    container.appendChild(el);
  }
}

function renderRewardsTab(container, profile, callbacks) {
  const track = document.createElement("div");
  track.className = "cg-rewards-track";

  const claimed = profile?.progression?.rewardsTrackClaimed || [];
  const level = profile?.progression?.level || 1;

  for (const node of REWARDS_TRACK) {
    const el = document.createElement("div");
    el.className = "cg-reward-node";
    if (claimed.includes(node.level)) el.classList.add("claimed");
    if (level >= node.level && !claimed.includes(node.level)) el.classList.add("current");

    const r = node.reward;
    const rSvg = REWARD_TYPE_ICONS[r.type];

    const rewardIconWrap = document.createElement("div");
    rewardIconWrap.className = "cg-reward-node-icon";
    if (rSvg) rewardIconWrap.appendChild(iconEl(rSvg, "cg-reward-type-icon"));
    el.appendChild(rewardIconWrap);

    const rewardLevel = document.createElement("div");
    rewardLevel.className = "cg-reward-node-level";
    rewardLevel.textContent = `Lv.${node.level}`;
    el.appendChild(rewardLevel);

    if (el.classList.contains("current")) {
      el.addEventListener("click", () => {
        callbacks.onClaimReward?.(node);
      });
    }

    track.appendChild(el);
  }
  container.appendChild(track);
}

function renderAchievementsTab(container, profile) {
  const earned = profile?.achievements || [];
  const earnedIds = new Set(earned.map(a => a.id));

  // Group by category
  const categories = ["gameplay", "collection", "hero", "mode", "event", "challenge"];
  const categoryLabels = { gameplay: "Gameplay", collection: "Collection", hero: "Hero Mastery", mode: "Mode", event: "Event", challenge: "Challenge" };

  for (const cat of categories) {
    const defs = ACHIEVEMENT_DEFS.filter(d => d.category === cat);
    if (defs.length === 0) continue;

    const header = document.createElement("div");
    header.style.cssText = "font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:rgba(255,255,255,.50);margin:10px 0 4px;";
    header.textContent = categoryLabels[cat] || cat;
    container.appendChild(header);

    for (const def of defs) {
      const isEarned = earnedIds.has(def.id);
      const achEl = document.createElement("div");
      achEl.className = `cg-quest${isEarned ? "" : " cg-ach-locked"}`;

      const achIconWrap = document.createElement("div");
      achIconWrap.className = "cg-quest-icon";
      achIconWrap.appendChild(iconEl(ICON_ACHIEVEMENT, "cg-achievement-icon"));
      achEl.appendChild(achIconWrap);

      achEl.innerHTML += `
        <div class="cg-quest-info">
          <div class="cg-quest-title">${escHtml(def.title)}</div>
          <div class="cg-quest-desc">${escHtml(def.desc)}</div>
        </div>
        <div style="font-size:10px;color:${isEarned ? "#7affc4" : "rgba(255,255,255,.25)"};">${isEarned ? "\u2713 Earned" : "Locked"}</div>
      `;
      container.appendChild(achEl);
    }
  }
}

function renderProfileTab(container, profile) {
  const stats = profile?.stats || {};
  const progression = profile?.progression || {};
  const heroWins = stats.heroWins || {};
  const modeStats = stats.modeStats || {};
  const achievements = profile?.achievements || [];
  const cosmetics = profile?.cosmetics || {};

  // Favorite hero (most wins)
  const favoriteHero = Object.entries(heroWins).sort((a, b) => b[1] - a[1])[0];
  // Favorite deck (most played)
  const deckStats = stats.deckStats || {};
  const favoriteDeck = Object.entries(deckStats).sort((a, b) => b[1] - a[1])[0];
  // Favorite ecosystems
  const ecoPlayed = stats.ecosystemsPlayed || {};
  const topEcos = Object.entries(ecoPlayed).sort((a, b) => b[1] - a[1]).slice(0, 3);
  // Most played cards
  const cardUsage = stats.cardUsage || {};
  const topCards = Object.entries(cardUsage).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // Recent performance (last 10 matches)
  const recentMatches = stats.recentResults || [];
  const recentWins = recentMatches.filter(r => r === "victory").length;
  const recentTotal = recentMatches.length;

  // Stat grid
  container.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;padding:8px 0;">
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">${stats.totalMatches || 0}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Total Matches</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">${stats.wins || 0}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Wins</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">${stats.losses || 0}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Losses</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">Lv.${progression.level || 1}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Level</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">${profile?.collection?.gold || 0}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Gold</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:22px;font-weight:900;">${Object.keys(profile?.collection?.ownedCards || {}).length}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Unique Cards</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:16px;font-weight:900;">${favoriteHero ? escHtml(favoriteHero[0]) : "\u2014"}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Favorite Hero</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:16px;font-weight:900;">${favoriteDeck ? escHtml(favoriteDeck[0]) : "\u2014"}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Favorite Deck</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:16px;font-weight:900;">${stats.bestDraftRun || 0}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Best Draft Run</div>
      </div>
      <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
        <div style="font-size:16px;font-weight:900;">${stats.seasonalRank || "Unranked"}</div>
        <div style="font-size:11px;color:rgba(255,255,255,.50);">Seasonal Rank</div>
      </div>
    </div>

    ${topEcos.length > 0 ? `<div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Favorite Ecosystems</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;">${topEcos.map(([eco, cnt]) => `<span style="background:rgba(255,255,255,.06);padding:4px 8px;border-radius:4px;font-size:11px;">${escHtml(eco)} (${cnt})</span>`).join("")}</div>` : ""}

    ${topCards.length > 0 ? `<div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Most Played Cards</div>
    <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;">${topCards.map(([id, cnt]) => `${escHtml(id)} (${cnt})`).join(" \u00B7 ")}</div>` : ""}

    ${recentTotal > 0 ? `<div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Recent Performance</div>
    <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;">${recentWins}W / ${recentTotal - recentWins}L (last ${recentTotal})</div>` : ""}

    <div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Achievements</div>
    <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;">${achievements.length} / ${ACHIEVEMENT_DEFS.length} earned</div>

    ${Object.keys(modeStats).length > 0 ? `<div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Win/Loss by Mode</div>
    <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;">${Object.entries(modeStats).map(([mode, s]) => `${escHtml(mode)}: ${s.wins || 0}W / ${s.losses || 0}L`).join(" \u00B7 ")}</div>` : ""}

    <div style="margin-top:12px;font-size:12px;font-weight:700;color:rgba(255,255,255,.50);">Cosmetic Identity</div>
    <div style="font-size:11px;color:rgba(255,255,255,.45);margin-top:4px;">
      Card Backs: ${(cosmetics.cardBacks || []).length} \u00B7
      Boards: ${(cosmetics.boards || []).length} \u00B7
      Skins: ${(cosmetics.heroSkins || []).length} \u00B7
      Coins: ${(cosmetics.coins || []).length}
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Events Tab (§12.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderEventsTab(container, profile) {
  const events = profile?.events || [];
  if (events.length === 0) {
    container.innerHTML = `<div style="color:rgba(255,255,255,.40);padding:20px;text-align:center;">No active events. Check back during seasonal events!</div>`;
    return;
  }
  for (const ev of events) {
    const el = document.createElement("div");
    el.className = "cg-quest";
    el.innerHTML = `
      <div class="cg-quest-info">
        <div class="cg-quest-title">${escHtml(ev.name || "Event")}</div>
        <div class="cg-quest-desc">${escHtml(ev.description || "")}</div>
        <div style="font-size:10px;color:rgba(255,255,255,.35);margin-top:2px;">
          ${ev.endsAt ? "Ends: " + new Date(ev.endsAt).toLocaleDateString() : "Ongoing"}
        </div>
      </div>
    `;
    container.appendChild(el);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Season Summary Tab (§12.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderSeasonTab(container, profile) {
  const season = profile?.season || {};
  const stats = profile?.stats || {};
  container.innerHTML = `
    <div style="padding:8px 0;">
      <div style="font-size:16px;font-weight:900;margin-bottom:8px;">${escHtml(season.name || "Current Season")}</div>
      <div style="font-size:12px;color:rgba(255,255,255,.50);margin-bottom:12px;">${escHtml(season.description || "Compete, collect, and climb the ranks.")}</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;">
        <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
          <div style="font-size:20px;font-weight:900;">${stats.seasonalRank || "Unranked"}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.50);">Current Rank</div>
        </div>
        <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
          <div style="font-size:20px;font-weight:900;">${stats.seasonWins || 0}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.50);">Season Wins</div>
        </div>
        <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
          <div style="font-size:20px;font-weight:900;">${stats.bestWinStreak || 0}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.50);">Best Streak</div>
        </div>
        <div class="cg-quest" style="flex-direction:column;align-items:center;text-align:center;">
          <div style="font-size:20px;font-weight:900;">${season.daysRemaining || "\u2014"}</div>
          <div style="font-size:10px;color:rgba(255,255,255,.50);">Days Left</div>
        </div>
      </div>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Collection Milestones Tab (§12.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderMilestonesTab(container, profile) {
  const owned = Object.keys(profile?.collection?.ownedCards || {}).length;
  const milestones = [10, 25, 50, 100, 150, 200, 300, 500];

  container.innerHTML = `<div style="font-size:14px;font-weight:800;margin-bottom:8px;">Collection Milestones</div>`;
  for (const m of milestones) {
    const reached = owned >= m;
    const el = document.createElement("div");
    el.className = "cg-quest";
    el.innerHTML = `
      <div class="cg-quest-icon" style="font-size:16px;">${reached ? "\u2713" : "\u25CB"}</div>
      <div class="cg-quest-info">
        <div class="cg-quest-title">${m} Unique Cards</div>
        <div class="cg-quest-desc">${reached ? "Reached!" : `${owned}/${m}`}</div>
      </div>
    `;
    if (reached) el.style.opacity = "0.6";
    container.appendChild(el);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Run History Tab (§12.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderRunsTab(container, profile) {
  const runs = profile?.stats?.runHistory || [];
  if (runs.length === 0) {
    container.innerHTML = `<div style="color:rgba(255,255,255,.40);padding:20px;text-align:center;">No completed runs yet. Try Draft or Solo Adventure!</div>`;
    return;
  }
  container.innerHTML = `<div style="font-size:14px;font-weight:800;margin-bottom:8px;">Run History</div>`;
  const recent = runs.slice(-15).reverse();
  for (const run of recent) {
    const el = document.createElement("div");
    el.className = "cg-quest";
    const d = new Date(run.completedAt || run.ts);
    el.innerHTML = `
      <div class="cg-quest-info">
        <div class="cg-quest-title">${escHtml(run.mode || "Run")} \u2014 ${run.wins || 0}W / ${run.losses || 0}L</div>
        <div class="cg-quest-desc">${escHtml(run.hero || "")} \u00B7 ${d.toLocaleDateString()}</div>
      </div>
    `;
    container.appendChild(el);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Inbox / Claimables Tab (§12.1)
   ═══════════════════════════════════════════════════════════════════════════ */

function renderInboxTab(container, profile, callbacks) {
  const inbox = profile?.inbox || [];
  if (inbox.length === 0) {
    container.innerHTML = `<div style="color:rgba(255,255,255,.40);padding:20px;text-align:center;">No claimable items. Complete quests and events to earn rewards!</div>`;
    return;
  }
  container.innerHTML = `<div style="font-size:14px;font-weight:800;margin-bottom:8px;">Inbox</div>`;
  for (let i = 0; i < inbox.length; i++) {
    const item = inbox[i];
    const el = document.createElement("div");
    el.className = "cg-quest";
    el.innerHTML = `
      <div class="cg-quest-info">
        <div class="cg-quest-title">${escHtml(item.label || "Reward")}</div>
        <div class="cg-quest-desc">${escHtml(item.desc || "Tap to claim.")}</div>
      </div>
      <button class="cg-btn cg-btn-primary" style="font-size:10px;">Claim</button>
    `;
    const claimBtn = el.querySelector("button");
    const idx = i;
    claimBtn.addEventListener("click", () => {
      callbacks.onClaimInbox?.(item, idx);
      inbox.splice(idx, 1);
      renderInboxTab(container, profile, callbacks);
    });
    container.appendChild(el);
  }
}

function escHtml(s) {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
