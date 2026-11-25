/* ═══════════════════════════════════════════════════════════════════════════
   Dev Room — World
   Buildings, interiors, districts, zones, collision, spatial queries.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const DR = window.__gsDevRoom = window.__gsDevRoom || {};
  if (DR.World) return;

  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;

  const DEFAULTS = Object.freeze({
    worldWidth: 3200,
    worldHeight: 2200,
    tileSize: 40,
    /* Spatial hash cell size (for fast lookups) */
    cellSize: 200,
  });

  const World = {
    DEFAULTS,

    create(userConfig = {}) {
      const cfg = { ...DEFAULTS, ...userConfig };
      const cellSize = cfg.cellSize;

      /* Spatial hash for fast entity/zone lookups */
      const spatialHash = new Map();

      function cellKey(cx, cy) { return `${cx},${cy}`; }
      function getCells(x, y, w, h) {
        const cells = [];
        const x0 = Math.floor(x / cellSize);
        const y0 = Math.floor(y / cellSize);
        const x1 = Math.floor((x + w) / cellSize);
        const y1 = Math.floor((y + h) / cellSize);
        for (let cx = x0; cx <= x1; cx++) {
          for (let cy = y0; cy <= y1; cy++) {
            cells.push(cellKey(cx, cy));
          }
        }
        return cells;
      }

      /* Zone storage */
      const buildings = [];
      const interiors = [];
      const districts = [];
      const zones = [];       // generic trigger zones
      const colliders = [];   // static collision rects
      const spawnPoints = [];

      return {
        config: cfg,

        /* ── Building management ─────────────────────────────────── */

        /**
         * Define a building.
         * @param {Object} def — { id, x, y, w, h, label, color, floors, rooftop, ... }
         */
        addBuilding(def) {
          const b = {
            id: def.id || `bldg_${buildings.length}`,
            x: def.x, y: def.y, w: def.w, h: def.h,
            label: def.label || "",
            color: def.color || "#2a2a4a",
            floors: def.floors || 1,
            rooftop: def.rooftop !== false,
            interiorId: def.interiorId || "",
            entryZone: def.entryZone || null,
            climbRoutes: def.climbRoutes || [],
            ...def,
          };
          buildings.push(b);
          /* Register in spatial hash */
          for (const key of getCells(b.x, b.y, b.w, b.h)) {
            if (!spatialHash.has(key)) spatialHash.set(key, []);
            spatialHash.get(key).push({ type: "building", ref: b });
          }
          return b;
        },

        /** Get all buildings */
        getBuildings() { return buildings; },

        /** Find building by ID */
        getBuilding(id) { return buildings.find(b => b.id === id); },

        /** Check if a point is inside any building footprint */
        getBuildingAt(x, y) {
          const key = cellKey(Math.floor(x / cellSize), Math.floor(y / cellSize));
          const bucket = spatialHash.get(key) || [];
          for (const entry of bucket) {
            if (entry.type === "building") {
              const b = entry.ref;
              if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
            }
          }
          return null;
        },

        /* ── Interior management ─────────────────────────────────── */

        /**
         * Define an interior space.
         * @param {Object} def — { id, label, w, h, colliders, exitZone, spawns, ... }
         */
        addInterior(def) {
          const interior = {
            id: def.id || `int_${interiors.length}`,
            label: def.label || "",
            w: def.w || 500,
            h: def.h || 350,
            colliders: def.colliders || [],
            exitZone: def.exitZone || { x: 240, y: 310, w: 50, h: 40 },
            spawns: def.spawns || [{ x: 250, y: 280 }],
            bgColor: def.bgColor || "#0f0f22",
            ...def,
          };
          interiors.push(interior);
          return interior;
        },

        getInteriors() { return interiors; },
        getInterior(id) { return interiors.find(i => i.id === id); },

        /* ── District / zone management ──────────────────────────── */

        addDistrict(def) {
          const d = { id: def.id, label: def.label || "", x: def.x, y: def.y, w: def.w, h: def.h, ...def };
          districts.push(d);
          return d;
        },

        getDistricts() { return districts; },

        /** Get which district a point falls in */
        getDistrictAt(x, y) {
          for (const d of districts) {
            if (x >= d.x && x <= d.x + d.w && y >= d.y && y <= d.y + d.h) return d;
          }
          return null;
        },

        /**
         * Add a generic trigger zone.
         * @param {Object} def — { id, type, x, y, w, h, radius, data }
         */
        addZone(def) {
          const z = {
            id: def.id || `zone_${zones.length}`,
            type: def.type || "trigger",
            x: def.x, y: def.y,
            w: def.w || 0, h: def.h || 0,
            radius: def.radius || 0,
            data: def.data || {},
            active: def.active !== false,
            ...def,
          };
          zones.push(z);
          return z;
        },

        getZones(type) { return type ? zones.filter(z => z.type === type) : zones; },

        /** Check if a point is inside a zone (rect or circle) */
        isInZone(zone, x, y) {
          if (!zone.active) return false;
          if (zone.radius > 0) {
            const dx = x - zone.x, dy = y - zone.y;
            return dx * dx + dy * dy < zone.radius * zone.radius;
          }
          return x >= zone.x && x <= zone.x + (zone.w || 0) &&
                 y >= zone.y && y <= zone.y + (zone.h || 0);
        },

        /** Find all zones a point is inside */
        getZonesAt(x, y, type) {
          const candidates = type ? zones.filter(z => z.type === type) : zones;
          return candidates.filter(z => this.isInZone(z, x, y));
        },

        /* ── Static colliders ────────────────────────────────────── */

        addCollider(rect) {
          const c = { x: rect.x, y: rect.y, w: rect.w, h: rect.h, ...rect };
          colliders.push(c);
          for (const key of getCells(c.x, c.y, c.w, c.h)) {
            if (!spatialHash.has(key)) spatialHash.set(key, []);
            spatialHash.get(key).push({ type: "collider", ref: c });
          }
          return c;
        },

        /** Check rect collision with static world colliders */
        collidesStatic(x, y, w, h) {
          const cells = getCells(x, y, w, h);
          for (const key of cells) {
            const bucket = spatialHash.get(key) || [];
            for (const entry of bucket) {
              if (entry.type === "collider") {
                const c = entry.ref;
                if (x < c.x + c.w && x + w > c.x && y < c.y + c.h && y + h > c.y) {
                  return c;
                }
              }
            }
          }
          return null;
        },

        /* ── Spawn points ────────────────────────────────────────── */

        addSpawnPoint(def) {
          const sp = { id: def.id || `spawn_${spawnPoints.length}`, x: def.x, y: def.y, type: def.type || "player", ...def };
          spawnPoints.push(sp);
          return sp;
        },

        getSpawnPoints(type) { return type ? spawnPoints.filter(s => s.type === type) : spawnPoints; },

        /* ── Utility ─────────────────────────────────────────────── */

        /** Distance between two points */
        distance(x1, y1, x2, y2) {
          const dx = x2 - x1, dy = y2 - y1;
          return Math.sqrt(dx * dx + dy * dy);
        },

        /** Find nearest entity from a list to a point */
        findNearest(x, y, entities, maxDist) {
          let best = null, bestDist = maxDist ?? Infinity;
          for (const e of entities) {
            if (e.hidden || e.dead) continue;
            const d = this.distance(x, y, e.x, e.y);
            if (d < bestDist) { bestDist = d; best = e; }
          }
          return best;
        },

        /** Clear all world data (for level reset) */
        clear() {
          buildings.length = 0;
          interiors.length = 0;
          districts.length = 0;
          zones.length = 0;
          colliders.length = 0;
          spawnPoints.length = 0;
          spatialHash.clear();
        },
      };
    }
  };

  DR.World = World;
})();
