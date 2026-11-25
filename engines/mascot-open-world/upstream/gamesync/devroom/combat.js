/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — Combat
   Health, damage, weapons, knockback, invulnerability, combo tracking.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.Combat) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const DEFAULTS = Object.freeze({
    /* Max HP */
    maxHp: 100,
    /* Max armor */
    maxArmor: 0,
    /* Armor damage reduction (0..1, 0.5 = armor absorbs 50% of damage) */
    armorAbsorb: 1.0,
    /* Invulnerability duration after taking damage (seconds) */
    invulnDuration: 0.5,
    /* Respawn invulnerability */
    respawnInvuln: 2.0,
    /* Combo window — time (s) from last hit before combo resets */
    comboWindow: 1.5,
    /* Whether entities can have shields (separate HP pool) */
    enableShields: false,
    /* Shield max */
    shieldMax: 0,
    /* Regen rate (HP per second, 0 = no regen) */
    hpRegen: 0,
    /* Armor regen rate */
    armorRegen: 0,
    /* Kill streak tracking */
    enableStreaks: true,
  });

  /** Weapon template structure */
  const WEAPON_TEMPLATE = Object.freeze({
    id: "",
    name: "",
    damage: 10,
    cooldown: 0.25,
    speed: 500,
    range: 0,       // 0 = projectile, >0 = melee range
    knockback: 1.0,
    pierce: 0,       // 0 = single hit, >0 = pass through N enemies
    aoe: 0,         // 0 = single target, >0 = splash radius
    ammoMax: -1,    // -1 = infinite
    reloadTime: 0,
    type: "projectile", // projectile | melee | hitscan | area
  });

  /** Attack template structure */
  const ATTACK_TEMPLATE = Object.freeze({
    id: "",
    name: "",
    damage: 4,
    knockback: 0.6,
    duration: 0.15,
    cooldown: 0.3,
    type: "melee", // melee | projectile | special
    hitbox: { offsetX: 0, offsetY: 0, width: 30, height: 30 },
  });

  const Combat = {
    DEFAULTS,
    WEAPON_TEMPLATE,
    ATTACK_TEMPLATE,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };

      return {
        config: cfg,

        /**
         * Create a health component for an entity.
         * @param {Object} overrides
         * @returns {Object} health state
         */
        createHealth(overrides = {}) {
          return {
            hp: overrides.hp ?? cfg.maxHp,
            maxHp: overrides.maxHp ?? cfg.maxHp,
            armor: overrides.armor ?? cfg.maxArmor,
            maxArmor: overrides.maxArmor ?? cfg.maxArmor,
            shield: cfg.enableShields ? (overrides.shield ?? cfg.shieldMax) : 0,
            maxShield: cfg.enableShields ? (overrides.maxShield ?? cfg.shieldMax) : 0,
            invuln: 0,
            dead: false,
            lastDamageAt: 0,
            lastDamageSource: "",
            damage: 0, // accumulated damage (for knockback scaling like Smash)
          };
        },

        /**
         * Apply damage to an entity's health.
         * Returns { actualDamage, killed, overkill, blocked }.
         */
        applyDamage(health, amount, source, now) {
          if (health.dead || health.invuln > 0) {
            return { actualDamage: 0, killed: false, overkill: 0, blocked: true };
          }

          let remaining = amount;
          let absorbed = 0;

          /* Shield absorbs first */
          if (health.shield > 0) {
            absorbed = Math.min(health.shield, remaining);
            health.shield -= absorbed;
            remaining -= absorbed;
          }

          /* Armor absorbs next */
          if (health.armor > 0 && remaining > 0) {
            const armorDmg = remaining * cfg.armorAbsorb;
            const actualArmorDmg = Math.min(health.armor, armorDmg);
            health.armor -= actualArmorDmg;
            remaining -= actualArmorDmg;
          }

          /* HP takes the rest */
          const actualDamage = Math.min(health.hp, remaining);
          health.hp -= actualDamage;
          health.damage += amount;
          health.lastDamageAt = now || performance.now() / 1000;
          health.lastDamageSource = source || "";
          health.invuln = cfg.invulnDuration;

          const killed = health.hp <= 0;
          if (killed) health.dead = true;

          return {
            actualDamage,
            killed,
            overkill: Math.max(0, remaining - actualDamage),
            blocked: false,
          };
        },

        /** Heal an entity */
        heal(health, amount) {
          if (health.dead) return 0;
          const before = health.hp;
          health.hp = Math.min(health.maxHp, health.hp + amount);
          return health.hp - before;
        },

        /** Repair armor */
        repairArmor(health, amount) {
          const before = health.armor;
          health.armor = Math.min(health.maxArmor, health.armor + amount);
          return health.armor - before;
        },

        /** Update invulnerability timer */
        updateInvuln(health, dt) {
          if (health.invuln > 0) {
            health.invuln = Math.max(0, health.invuln - dt);
          }
        },

        /** Update HP/armor regen */
        updateRegen(health, dt) {
          if (cfg.hpRegen > 0 && !health.dead && health.hp < health.maxHp) {
            health.hp = Math.min(health.maxHp, health.hp + cfg.hpRegen * dt);
          }
          if (cfg.armorRegen > 0 && health.armor < health.maxArmor) {
            health.armor = Math.min(health.maxArmor, health.armor + cfg.armorRegen * dt);
          }
        },

        /** Reset health to full */
        reset(health) {
          health.hp = health.maxHp;
          health.armor = health.maxArmor;
          health.shield = health.maxShield;
          health.invuln = cfg.respawnInvuln;
          health.dead = false;
          health.damage = 0;
        },

        /**
         * Create a weapon instance from a template.
         * @param {Object} template — based on WEAPON_TEMPLATE
         * @returns {Object} weapon state
         */
        createWeapon(template) {
          const base = { ...WEAPON_TEMPLATE, ...template };
          return {
            ...base,
            ammo: base.ammoMax === -1 ? Infinity : base.ammoMax,
            cooldownTimer: 0,
            reloadTimer: 0,
            reloading: false,
          };
        },

        /** Update weapon cooldowns */
        updateWeapon(weapon, dt) {
          if (weapon.cooldownTimer > 0) weapon.cooldownTimer -= dt;
          if (weapon.reloading) {
            weapon.reloadTimer -= dt;
            if (weapon.reloadTimer <= 0) {
              weapon.reloading = false;
              weapon.ammo = weapon.ammoMax === -1 ? Infinity : weapon.ammoMax;
            }
          }
        },

        /** Attempt to fire a weapon. Returns true if fire succeeded. */
        tryFire(weapon) {
          if (weapon.cooldownTimer > 0 || weapon.reloading || weapon.ammo <= 0) return false;
          weapon.cooldownTimer = weapon.cooldown;
          if (weapon.ammo !== Infinity) weapon.ammo--;
          if (weapon.ammo <= 0 && weapon.ammoMax > 0) {
            weapon.reloading = true;
            weapon.reloadTimer = weapon.reloadTime;
          }
          return true;
        },

        /**
         * Create a combo tracker.
         * @returns {Object} combo state
         */
        createComboTracker() {
          return {
            count: 0,
            best: 0,
            timer: 0,
            streak: 0,    // kill streak
            bestStreak: 0,
          };
        },

        /** Register a hit in the combo */
        registerHit(combo) {
          combo.count++;
          combo.timer = cfg.comboWindow;
          if (combo.count > combo.best) combo.best = combo.count;
        },

        /** Register a kill */
        registerKill(combo) {
          if (!cfg.enableStreaks) return;
          combo.streak++;
          if (combo.streak > combo.bestStreak) combo.bestStreak = combo.streak;
        },

        /** Update combo timer — call every frame */
        updateCombo(combo, dt) {
          if (combo.timer > 0) {
            combo.timer -= dt;
            if (combo.timer <= 0) combo.count = 0;
          }
        },

        /** Reset streak on player death */
        resetStreak(combo) {
          combo.streak = 0;
        },

        /**
         * Check if a melee attack hits a target.
         * @param {Object} attacker — { x, y, dir }
         * @param {Object} attack — from ATTACK_TEMPLATE
         * @param {Object} target — { x, y, w, h } or { x, y, radius }
         */
        meleeHitTest(attacker, attack, target) {
          const hb = attack.hitbox || { offsetX: 0, offsetY: 0, width: 30, height: 30 };
          const ax = attacker.x + hb.offsetX * (attacker.dir || 1);
          const ay = attacker.y + hb.offsetY;
          const aw = hb.width;
          const ah = hb.height;

          if (target.radius !== undefined) {
            /* Circle target */
            const cx = clamp(target.x, ax - aw / 2, ax + aw / 2);
            const cy = clamp(target.y, ay - ah / 2, ay + ah / 2);
            const dx = target.x - cx, dy = target.y - cy;
            return dx * dx + dy * dy < target.radius * target.radius;
          }

          /* Rect target */
          const tw = target.w || 0, th = target.h || 0;
          return ax - aw / 2 < target.x + tw &&
                 ax + aw / 2 > target.x &&
                 ay - ah / 2 < target.y + th &&
                 ay + ah / 2 > target.y;
        },

        /**
         * Define an attack catalog from templates.
         * @param {Object} attacks — { jab: {...}, strong: {...}, ... }
         * @returns {Object} frozen catalog
         */
        defineAttacks(attacks) {
          const catalog = {};
          for (const [id, def] of Object.entries(attacks)) {
            catalog[id] = Object.freeze({ ...ATTACK_TEMPLATE, id, ...def });
          }
          return Object.freeze(catalog);
        },

        /**
         * Define a weapon catalog from templates.
         * @param {Object} weapons — { pistol: {...}, smg: {...}, ... }
         * @returns {Object} frozen catalog
         */
        defineWeapons(weapons) {
          const catalog = {};
          for (const [id, def] of Object.entries(weapons)) {
            catalog[id] = Object.freeze({ ...WEAPON_TEMPLATE, id, ...def });
          }
          return Object.freeze(catalog);
        },
      };
    }
  };

  DR.Combat = Combat;
})();
