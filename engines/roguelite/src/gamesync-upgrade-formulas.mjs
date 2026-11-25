// SPDX-License-Identifier: GPL-3.0-or-later
// Extracted exact legacy GameSync upgrade formulas; do not place in a renderer.
// Original commit bce6c1bcb31c63d31c64185fef143a53d9c4d35f / SHA-256 1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7.
  const WEAPONS = {
    orb:      { name: "Magic Orb",     color: "#a855f7", dmg: 8,  rate: 0.8,  range: 120, projSpeed: 250, projSize: 5 },
    whip:     { name: "Whip",          color: "#f5a623", dmg: 12, rate: 1.2,  range: 80,  area: true },
    bible:    { name: "Bible",         color: "#ffd700", dmg: 6,  rate: 0.1,  range: 60,  orbit: true, orbitR: 55, count: 2 },
    lightning:{ name: "Lightning",     color: "#06b6d4", dmg: 20, rate: 2.0,  range: 150, instant: true },
    fire:     { name: "Fire Nova",     color: "#ef4444", dmg: 15, rate: 3.0,  range: 100, nova: true },
    knife:    { name: "Throwing Knife",color: "#94a3b8", dmg: 5,  rate: 0.4,  range: 200, projSpeed: 350, projSize: 3, pierce: 2 },
  };
  const UPGRADES = [
    { id: "hp",      name: "+20 Max HP",      icon: "❤️",  apply: (p) => { p.maxHp += 20; p.hp = Math.min(p.hp + 20, p.maxHp); } },
    { id: "speed",   name: "+15% Speed",       icon: "💨",  apply: (p) => { p.speed *= 1.15; } },
    { id: "dmg",     name: "+25% Damage",       icon: "⚔️",  apply: (p) => { p.dmgMult *= 1.25; } },
    { id: "area",    name: "+20% Area",         icon: "🔮",  apply: (p) => { p.areaMult *= 1.2; } },
    { id: "magnet",  name: "+30% Pickup Range", icon: "🧲",  apply: (p) => { p.magnetRange *= 1.3; } },
    { id: "regen",   name: "HP Regen +1/s",     icon: "💚",  apply: (p) => { p.regen += 1; } },
  ];

export function generateLegacyUpgradeOffers(player,random) {
  const pick  = (arr) => arr[Math.floor(random() * arr.length)];
    let levelUpChoices;
      // Pick 3 random upgrades
      const pool = [...UPGRADES];
      // Maybe offer a new weapon
      const ownedIds = new Set(player.weapons.map(w => w.name));
      const available = Object.values(WEAPONS).filter(w => !ownedIds.has(w.name));
      if (available.length > 0 && random() < 0.4) {
        const w = pick(available);
        pool.push({ id: "weapon_" + w.name, name: "New: " + w.name, icon: "🗡️", weapon: w });
      }

      const shuffled = pool.sort(() => random() - 0.5);
      levelUpChoices = shuffled.slice(0, 3);
    return levelUpChoices;
}

export function applyLegacyUpgradeChoice(player,choice) {
                if (choice.weapon) {
                  player.weapons.push({ ...choice.weapon, timer: 0 });
                } else {
                  choice.apply(player);
                }
}
