(function () {
  "use strict";
  if (window.__gsMascotGameOpenWorld) return;

  const C = () => window.__gsMascotGameCore;
  const W = 960;
  const H = 540;
  const WORLD_W = 3200;
  const WORLD_H = 2200;
  const SAVE_KEY = "gsMascotOpenWorldSaveV1";
  const DEFAULT_PACK_ID = "five-nights-at-freddys-toy-bonnie-01";
  const ACTIONS_PER_PAGE = 10;
  const PACKS_PER_PAGE = 6;
  const SOURCE_BASE_URL = (() => {
    try {
      const script = document.currentScript;
      if (script && script.src) return new URL("../../", script.src).href;
      return new URL("../../", window.location.href).href;
    } catch (_) {
      return "";
    }
  })();
  const BRAND = Object.freeze({
    title: "Midnight Mascot Syndicate",
    subtitle: "The mascot crew takes the city back one mission at a time."
  });
  const MASCOT_MSG = Object.freeze({
    LIST_PACKS: "MASCOT_LIST_PACKS",
    ENSURE_BUNDLED_REFERENCE_SHIMEJIS: "MASCOT_ENSURE_BUNDLED_REFERENCE_SHIMEJIS",
    GET_ACTIVE_PACK_RUNTIME: "MASCOT_GET_ACTIVE_PACK_RUNTIME"
  });
  const LOCAL_SHIMEJI_PACKS = Object.freeze([
    { packId: "five-nights-at-freddys-toy-bonnie-01", name: "Toy Bonnie", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/five-nights-at-freddys-toy-bonnie-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/five-nights-at-freddys-toy-bonnie-01/spritesheet.png" },
    { packId: "five-nights-at-freddys-mangle-01", name: "Mangle", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/five-nights-at-freddys-mangle-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/five-nights-at-freddys-mangle-01/spritesheet.png" },
    { packId: "pochita-chainsaw-man-01", name: "Pochita", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/pochita-chainsaw-man-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/pochita-chainsaw-man-01/spritesheet.png" },
    { packId: "search-rover-xp-01", name: "Search Rover", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/search-rover-xp-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/search-rover-xp-01/spritesheet.png" },
    { packId: "bonzi-blobbuddy-01", name: "BlobBuddy", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/bonzi-blobbuddy-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/bonzi-blobbuddy-01/spritesheet.png" },
    { packId: "bonzi-maxalert-01", name: "MaxALERT", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/bonzi-maxalert-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/bonzi-maxalert-01/spritesheet.png" },
    { packId: "shijima-default-01", name: "Shijima", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/shijima-default-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/shijima-default-01/spritesheet.png" },
    { packId: "webmeji-default-shimeji-01", name: "Webmeji", origin: "Bundled Reference", configPath: "assets/mascot/shimejis/webmeji-default-shimeji-01/configuration.json", spritesheetPath: "assets/mascot/shimejis/webmeji-default-shimeji-01/spritesheet.png" }
  ]);
  const PACK_THEME_HINTS = Object.freeze({
    "five-nights-at-freddys-toy-bonnie-01": "#6ee7ff",
    "five-nights-at-freddys-mangle-01": "#fb7185",
    "pochita-chainsaw-man-01": "#f59e0b",
    "search-rover-xp-01": "#facc15",
    "bonzi-blobbuddy-01": "#60a5fa",
    "bonzi-maxalert-01": "#a78bfa",
    "shijima-default-01": "#34d399",
    "webmeji-default-shimeji-01": "#22d3ee"
  });

  function normalizeAngle(angle) {
    const tau = Math.PI * 2;
    let value = Number(angle) || 0;
    value = ((value % tau) + tau) % tau;
    return value;
  }

  function shortestAngleDelta(from, to) {
    return Math.atan2(Math.sin(to - from), Math.cos(to - from));
  }

  function clampAngleAround(base, angle, limit) {
    return base + Math.max(-limit, Math.min(limit, shortestAngleDelta(base, angle)));
  }

  const ROAD_NODES = [
    { x: 340, y: 1820 }, { x: 710, y: 1820 }, { x: 1180, y: 1820 }, { x: 1680, y: 1820 }, { x: 2160, y: 1820 }, { x: 2660, y: 1820 },
    { x: 340, y: 2000 }, { x: 710, y: 2000 }, { x: 1180, y: 2000 }, { x: 1680, y: 2000 }, { x: 2160, y: 2000 }, { x: 2660, y: 2000 },
    { x: 340, y: 1420 }, { x: 710, y: 1420 }, { x: 1180, y: 1420 }, { x: 1680, y: 1420 }, { x: 2160, y: 1420 }, { x: 2660, y: 1420 },
    { x: 340, y: 980 }, { x: 710, y: 980 }, { x: 1180, y: 980 }, { x: 1680, y: 980 }, { x: 2160, y: 980 }, { x: 2660, y: 980 },
    { x: 340, y: 560 }, { x: 710, y: 560 }, { x: 1180, y: 560 }, { x: 1680, y: 560 }, { x: 2160, y: 560 }, { x: 2660, y: 560 }
  ];

  const DISTRICTS = Object.freeze([
    { id: "safehouse", name: "Hideout Row", x: 0, y: 1500, w: 980, h: 700, base: "#0b1530", glow: "rgba(49, 97, 255, 0.20)" },
    { id: "midtown", name: "Midtown Mirage", x: 980, y: 1280, w: 1060, h: 920, base: "#111c38", glow: "rgba(255, 156, 55, 0.18)" },
    { id: "market", name: "Neon Market", x: 1900, y: 1180, w: 1300, h: 1020, base: "#191228", glow: "rgba(255, 71, 146, 0.16)" },
    { id: "docks", name: "Docklight", x: 1880, y: 0, w: 1320, h: 1260, base: "#0b202c", glow: "rgba(41, 209, 194, 0.14)" },
    { id: "archive", name: "Archive Heights", x: 720, y: 220, w: 1080, h: 1060, base: "#21172b", glow: "rgba(186, 92, 255, 0.16)" }
  ]);

  const BUILDINGS = Object.freeze([
    { id: "hideout", x: 140, y: 1680, w: 300, h: 260, fill: "#18244b", roof: "#243769" },
    { id: "garage", x: 520, y: 1660, w: 240, h: 240, fill: "#1d2646", roof: "#33457a" },
    { id: "club", x: 1000, y: 1570, w: 360, h: 280, fill: "#2a1e44", roof: "#4b3180" },
    { id: "casino", x: 1460, y: 1540, w: 420, h: 320, fill: "#2b2334", roof: "#5f4364" },
    { id: "foodcourt", x: 2200, y: 1540, w: 420, h: 300, fill: "#40212b", roof: "#76414f" },
    { id: "warehouse-a", x: 2080, y: 500, w: 410, h: 260, fill: "#163342", roof: "#27576f" },
    { id: "warehouse-b", x: 2520, y: 430, w: 420, h: 320, fill: "#13303b", roof: "#204d62" },
    { id: "archive-tower", x: 1100, y: 460, w: 270, h: 430, fill: "#372546", roof: "#68428a" },
    { id: "archive-east", x: 1440, y: 520, w: 280, h: 360, fill: "#2e243b", roof: "#54436c" },
    { id: "arcade", x: 2330, y: 1250, w: 330, h: 260, fill: "#421a31", roof: "#7e355d" }
  ]);

  const BUILDING_SIGN_TEXT = Object.freeze({
    hideout: "HIDEOUT",
    garage: "MOD GARAGE",
    club: "VELVET",
    casino: "HIGH ROLL",
    foodcourt: "NITE BITES",
    "warehouse-a": "DRY DOCK",
    "warehouse-b": "FREIGHT",
    "archive-tower": "ARCHIVE",
    "archive-east": "ANNEX",
    arcade: "PIXEL"
  });

  const SAFEHOUSES = Object.freeze([
    { id: "hideout", name: "Hideout Row", x: 430, y: 2000, radius: 88 },
    { id: "midtown", name: "Midtown Garage", x: 1180, y: 1730, radius: 76 }
  ]);

  const INTERIORS = Object.freeze([
    {
      id: "hideout",
      name: "Hideout Loft",
      outsideDoor: { x: 290, y: 1942, r: 48 },
      insideSpawn: { x: 320, y: 300 },
      exitZone: { x: 282, y: 376, w: 76, h: 20 },
      w: 640,
      h: 420,
      floor: "#0a1426",
      wall: "#17233e",
      accent: "#6ee7ff",
      prop: "#24416f",
      colliders: [
        { x: 92, y: 72, w: 164, h: 54 },
        { x: 396, y: 78, w: 158, h: 52 },
        { x: 438, y: 230, w: 110, h: 78 },
        { x: 118, y: 246, w: 136, h: 72 }
      ]
    },
    {
      id: "garage",
      name: "Midtown Garage",
      outsideDoor: { x: 640, y: 1886, r: 42 },
      insideSpawn: { x: 310, y: 312 },
      exitZone: { x: 286, y: 382, w: 72, h: 18 },
      w: 620,
      h: 430,
      floor: "#10141d",
      wall: "#252d3d",
      accent: "#f59e0b",
      prop: "#4b5563",
      colliders: [
        { x: 84, y: 72, w: 152, h: 52 },
        { x: 402, y: 70, w: 148, h: 54 },
        { x: 370, y: 222, w: 188, h: 84 },
        { x: 110, y: 248, w: 130, h: 94 }
      ]
    },
    {
      id: "club",
      name: "Velvet Backroom",
      outsideDoor: { x: 1180, y: 1850, r: 46 },
      insideSpawn: { x: 330, y: 318 },
      exitZone: { x: 306, y: 386, w: 70, h: 18 },
      w: 660,
      h: 440,
      floor: "#170b20",
      wall: "#311744",
      accent: "#fb7185",
      prop: "#5b2144",
      colliders: [
        { x: 92, y: 78, w: 156, h: 56 },
        { x: 408, y: 74, w: 168, h: 58 },
        { x: 268, y: 196, w: 118, h: 86 },
        { x: 120, y: 260, w: 150, h: 78 }
      ]
    },
    {
      id: "warehouse-a",
      name: "Docklight Interior",
      outsideDoor: { x: 2284, y: 766, r: 50 },
      insideSpawn: { x: 340, y: 344 },
      exitZone: { x: 312, y: 404, w: 80, h: 18 },
      w: 720,
      h: 460,
      floor: "#091723",
      wall: "#153042",
      accent: "#2dd4bf",
      prop: "#27576f",
      colliders: [
        { x: 106, y: 88, w: 170, h: 62 },
        { x: 430, y: 92, w: 188, h: 64 },
        { x: 202, y: 244, w: 116, h: 96 },
        { x: 454, y: 250, w: 136, h: 92 }
      ]
    }
  ]);

  const BENCHES = Object.freeze([
    { x: 210, y: 1890, w: 46, h: 14 },
    { x: 640, y: 1780, w: 46, h: 14 },
    { x: 1250, y: 1660, w: 46, h: 14 },
    { x: 2410, y: 1475, w: 46, h: 14 },
    { x: 1540, y: 960, w: 46, h: 14 }
  ]);

  const CLIMB_ROUTES = Object.freeze([
    {
      id: "archive-wall",
      label: "Archive Tower ladder",
      buildingId: "archive-tower",
      side: "south",
      faceAngle: Math.PI * 1.5,
      x: 1236,
      y1: 462,
      y2: 886,
      top: { x: 1236, y: 478, roofId: "archive-tower" },
      bottom: { x: 1236, y: 886 }
    },
    {
      id: "archive-east-wall",
      label: "Archive Annex ladder",
      buildingId: "archive-east",
      side: "west",
      faceAngle: 0,
      x: 1450,
      y1: 540,
      y2: 870,
      top: { x: 1450, y: 540, roofId: "archive-east" },
      bottom: { x: 1450, y: 870 }
    }
  ]);

  const CEILING_ROUTES = Object.freeze([
    { id: "billboard-span", label: "Billboard catwalk", x1: 1350, x2: 1525, y: 420, land: { x: 1525, y: 520, roofId: "archive-east" } },
    { id: "dock-gantry", label: "Dock gantry", x1: 2230, x2: 2540, y: 340, land: { x: 2540, y: 520, roofId: "warehouse-b" } }
  ]);

  const VEHICLE_SPECS = Object.freeze({
    coupe: {
      name: "Neon Coupe",
      maxSpeed: 360,
      accel: 220,
      turn: 2.9,
      hp: 120,
      body: "#2bb3ff",
      accent: "#101827",
      stripe: "#e0f2fe",
      width: 64,
      height: 34,
      wheelX: 22,
      wheelY: 16,
      wheelRadius: 0.28,
      roofScale: 0.58,
      shadow: "#06101f"
    },
    van: {
      name: "Signal Van",
      maxSpeed: 300,
      accel: 180,
      turn: 2.2,
      hp: 180,
      body: "#f97316",
      accent: "#1c1917",
      stripe: "#fdba74",
      width: 78,
      height: 40,
      wheelX: 28,
      wheelY: 18,
      wheelRadius: 0.32,
      roofScale: 0.72,
      shadow: "#130b07"
    },
    cruiser: {
      name: "Metro Cruiser",
      maxSpeed: 340,
      accel: 210,
      turn: 2.5,
      hp: 150,
      body: "#ecfeff",
      accent: "#0f172a",
      stripe: "#60a5fa",
      width: 68,
      height: 36,
      wheelX: 24,
      wheelY: 17,
      wheelRadius: 0.29,
      roofScale: 0.56,
      lightbar: true,
      shadow: "#071019"
    },
    streetfire: {
      name: "Streetfire GT",
      maxSpeed: 420,
      accel: 285,
      turn: 3.25,
      hp: 132,
      body: "#ff4d6d",
      accent: "#1a1121",
      stripe: "#ffd166",
      width: 70,
      height: 32,
      wheelX: 25,
      wheelY: 15,
      wheelRadius: 0.3,
      roofScale: 0.46,
      spoiler: true,
      shadow: "#180711"
    },
    midnight: {
      name: "Midnight GT",
      maxSpeed: 448,
      accel: 315,
      turn: 3.45,
      hp: 118,
      body: "#22c55e",
      accent: "#0b1220",
      stripe: "#bbf7d0",
      width: 72,
      height: 31,
      wheelX: 26,
      wheelY: 15,
      wheelRadius: 0.31,
      roofScale: 0.42,
      spoiler: true,
      shadow: "#07150d"
    },
    muscle: {
      name: "Thunderline Muscle",
      maxSpeed: 392,
      accel: 248,
      turn: 2.7,
      hp: 162,
      body: "#facc15",
      accent: "#241604",
      stripe: "#fff7cc",
      width: 76,
      height: 36,
      wheelX: 27,
      wheelY: 17,
      wheelRadius: 0.32,
      roofScale: 0.52,
      hoodScoop: true,
      shadow: "#181108"
    },
    pickup: {
      name: "Mascot Hauler",
      maxSpeed: 318,
      accel: 194,
      turn: 2.25,
      hp: 196,
      body: "#a78bfa",
      accent: "#151229",
      stripe: "#ddd6fe",
      width: 82,
      height: 40,
      wheelX: 29,
      wheelY: 18,
      wheelRadius: 0.33,
      roofScale: 0.5,
      truckBed: true,
      shadow: "#120d22"
    }
  });

  const WEAPONS = Object.freeze([
    { id: "pistol", name: "Pulse Pistol", damage: 16, cooldown: 0.23, bulletSpeed: 780, color: "#6ee7ff", spread: 0.04, ammoMax: 120, infiniteAmmo: true, kick: 0.95, muzzleScale: 1 },
    { id: "smg", name: "Sticker SMG", damage: 10, cooldown: 0.08, bulletSpeed: 900, color: "#ffd166", spread: 0.09, ammoMax: 220, kick: 0.74, muzzleScale: 1.05 },
    { id: "launcher", name: "Confetti Launcher", damage: 28, cooldown: 0.55, bulletSpeed: 560, color: "#f472b6", spread: 0.03, ammoMax: 30, ttl: 1.3, radius: 7, splashDamage: 18, splashRadius: 76, kick: 1.35, muzzleScale: 1.32 },
    { id: "vinyl", name: "Vinyl Shredder", damage: 11, cooldown: 0.46, bulletSpeed: 760, color: "#a78bfa", spread: 0.17, ammoMax: 64, pellets: 5, radius: 5, kick: 1.08, muzzleScale: 1.2 },
    { id: "beat_blaster", name: "Beat Blaster", damage: 12, cooldown: 0.12, bulletSpeed: 860, color: "#34d399", spread: 0.06, ammoMax: 180, burstCount: 3, burstSpread: 0.045, kick: 0.88, muzzleScale: 1.16 },
    { id: "mic_lancer", name: "Karaoke Lancer", damage: 24, cooldown: 0.28, bulletSpeed: 980, color: "#fb923c", spread: 0.02, ammoMax: 54, radius: 5, kick: 1.04, muzzleScale: 1.1 },
    { id: "dubstep_cannon", name: "Dubstep Cannon", damage: 34, cooldown: 0.72, bulletSpeed: 500, color: "#ec4899", spread: 0.04, ammoMax: 20, ttl: 1.05, radius: 8, splashDamage: 24, splashRadius: 92, kick: 1.5, muzzleScale: 1.48 },
    { id: "paint_sprayer", name: "Graffiti Sprayer", damage: 7, cooldown: 0.05, bulletSpeed: 620, color: "#60a5fa", spread: 0.18, ammoMax: 280, radius: 5, kick: 0.58, muzzleScale: 1.06 }
  ]);

  const MISSIONS = Object.freeze([
    { id: "courier_crash", title: "Courier Crash", theme: "#6ee7ff", brief: "Ambush the courier, steal the Neon Drive, and run it back to Hideout Row." },
    { id: "skyline_rescue", title: "Skyline Rescue", theme: "#c084fc", brief: "Scale the Archive Tower, shimmy the billboard span, and rescue Byte from the rooftop trap." },
    { id: "dockside_throwdown", title: "Dockside Throwdown", theme: "#2dd4bf", brief: "Hijack the Signal Van, raid the dock warehouse, and throw the cargo crate into the drop zone." },
    { id: "split_decision", title: "Split Decision", theme: "#fb7185", brief: "Storm Neon Bowl, split your swarm, and put Captain Static on the mat." }
  ]);

  const ACTION_KEY_HINTS = Object.freeze([
    "1-0 trigger the visible mascot actions while the action deck is open.",
    "[ and ] flip through the full authored action pages.",
    "Core traversal uses the mascot's native walk, run, sit, wall, ceiling, carry, throw, split, and pull-up aliases when available."
  ]);

  function s(v) {
    return v == null ? "" : String(v);
  }

  function rgba(color, alpha) {
    const value = s(color).trim();
    if (/^#([0-9a-f]{6})$/i.test(value)) {
      const hex = value.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }
    if (/^#([0-9a-f]{3})$/i.test(value)) {
      const hex = value.slice(1);
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
    }
    if (/^rgba?\(/i.test(value)) {
      const parts = value.replace(/^rgba?\(/i, "").replace(/\)\s*$/, "").split(",").map((part) => part.trim());
      if (parts.length >= 3) return "rgba(" + parts[0] + "," + parts[1] + "," + parts[2] + "," + alpha + ")";
    }
    return "rgba(118,215,255," + alpha + ")";
  }

  function normalizePackId(value) {
    return s(value).trim().toLowerCase();
  }

  function friendlyPackName(packId) {
    const exact = LOCAL_SHIMEJI_PACKS.find((entry) => entry.packId === packId);
    if (exact && exact.name) return exact.name;
    const label = s(packId).replace(/[-_]+/g, " ").trim();
    return label ? label.replace(/\b\w/g, (char) => char.toUpperCase()) : "Mascot";
  }

  function packTheme(packId, fallback) {
    return PACK_THEME_HINTS[normalizePackId(packId)] || fallback || "#6ee7ff";
  }

  function brandSubtitleFor(name) {
    return (name || "Mascot") + " takes the city back one mission at a time.";
  }

  function spriteKeyCandidates(value) {
    const raw = s(value).trim().replace(/\\/g, "/");
    if (!raw) return [];
    const out = new Set([raw]);
    out.add(raw.replace(/^\.\/+/, ""));
    out.add(raw.replace(/^\/+/, ""));
    out.add("/" + raw.replace(/^\/+/, ""));
    const base = raw.split("/").pop() || raw;
    out.add(base);
    out.add("/" + base);
    const lowered = raw.toLowerCase();
    out.add(lowered);
    out.add(lowered.replace(/^\/+/, ""));
    out.add("/" + lowered.replace(/^\/+/, ""));
    return Array.from(out).filter(Boolean);
  }

  function findLocalPackSpec(packId) {
    const id = normalizePackId(packId);
    return LOCAL_SHIMEJI_PACKS.find((entry) => normalizePackId(entry.packId) === id) || null;
  }

  function sortPackSpecs(rows) {
    return (rows || []).slice().sort((a, b) => {
      if (normalizePackId(a.packId) === DEFAULT_PACK_ID) return -1;
      if (normalizePackId(b.packId) === DEFAULT_PACK_ID) return 1;
      return s(a.name || a.packId).localeCompare(s(b.name || b.packId));
    });
  }

  function resolvePackUrl(path) {
    const raw = s(path).trim();
    if (!raw) return raw;
    if (/^(data:|blob:|https?:|chrome-extension:)/i.test(raw)) return raw;
    if (typeof chrome !== "undefined" && chrome.runtime && typeof chrome.runtime.getURL === "function") {
      return chrome.runtime.getURL(raw);
    }
    if (SOURCE_BASE_URL) return new URL(raw, SOURCE_BASE_URL).href;
    return raw;
  }

  function stripBom(text) {
    return s(text).replace(/^\uFEFF/, "").replace(/^ï»¿/, "");
  }

  function directChildElements(node) {
    return Array.from((node && node.children) || []);
  }

  function directChildrenByLocalName(node, name) {
    return directChildElements(node).filter((child) => s(child.localName).toLowerCase() === s(name).toLowerCase());
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image load failed: " + src));
      img.src = src;
    });
  }

  function parseFloatPair(text, fallbackA, fallbackB) {
    const parts = s(text).split(",").map((part) => Number(part.trim()));
    return {
      a: Number.isFinite(parts[0]) ? parts[0] : fallbackA,
      b: Number.isFinite(parts[1]) ? parts[1] : fallbackB
    };
  }

  function poseDurationMs(rawDuration, frameCount) {
    const n = Number(rawDuration);
    if (!Number.isFinite(n) || n <= 0) return frameCount > 1 ? 110 : 180;
    if (frameCount <= 1) return Math.max(140, Math.min(220, n * 2));
    return Math.max(60, Math.min(220, n * 34));
  }

  function actionCategory(name) {
    const lower = s(name).toLowerCase();
    if (/run|dash/.test(lower)) return "Sprint";
    if (/walk/.test(lower)) return "Walk";
    if (/sit|sprawl|lie|dangle/.test(lower)) return "Rest";
    if (/grab|hold/.test(lower)) return "Grab";
    if (/climb/.test(lower)) return "Climb";
    if (/jump|fall|bounce|trip/.test(lower)) return "Air";
    if (/withie|throwie|ie/.test(lower)) return "Carry";
    if (/split|divide|pullup/.test(lower)) return "Special";
    if (/drag|pinch|resist/.test(lower)) return "Drag";
    return "General";
  }

  function buildActionRuntime(config, options) {
    const opts = options || {};
    const parser = new DOMParser();
    const xml = parser.parseFromString(stripBom(config.actions), "application/xml");
    const spriteMap = config && config.sprites && typeof config.sprites === "object" ? config.sprites : {};
    const frameImages = opts.frameImages instanceof Map ? opts.frameImages : new Map();
    const allActionNodes = Array.from(xml.getElementsByTagNameNS("*", "Action"));
    const namedNodes = new Map();

    for (const node of allActionNodes) {
      const name = s(node.getAttribute("Name")).trim();
      if (name && !namedNodes.has(name)) namedNodes.set(name, node);
    }

    function collectPoseFrames(animationNode) {
      const poses = directChildrenByLocalName(animationNode, "Pose");
      return poses
        .map((pose) => {
          const spriteKey = s(pose.getAttribute("Image")).trim();
          const sprite = spriteMap[spriteKey] || spriteMap[spriteKey.replace(/^\/+/, "")] || null;
          let frameImage = null;
          for (const candidate of spriteKeyCandidates(spriteKey)) {
            if (frameImages.has(candidate)) {
              frameImage = frameImages.get(candidate);
              break;
            }
          }
          const width = Number(sprite && sprite.width) || Number(frameImage && (frameImage.naturalWidth || frameImage.width)) || 0;
          const height = Number(sprite && sprite.height) || Number(frameImage && (frameImage.naturalHeight || frameImage.height)) || 0;
          if (!width || !height) return null;
          const anchor = parseFloatPair(pose.getAttribute("ImageAnchor"), width * 0.5, height);
          const velocity = parseFloatPair(pose.getAttribute("Velocity"), 0, 0);
          return {
            spriteKey,
            image: frameImage,
            sx: Number(sprite && sprite.x) || 0,
            sy: Number(sprite && sprite.y) || 0,
            sw: width,
            sh: height,
            anchorX: anchor.a,
            anchorY: anchor.b,
            vx: velocity.a,
            vy: velocity.b,
            durationRaw: Number(pose.getAttribute("Duration")) || 4
          };
        })
        .filter(Boolean);
    }

    function collectFragments(node, visited) {
      const fragments = [];
      for (const child of directChildElements(node)) {
        const local = s(child.localName);
        if (local === "Animation") {
          const frames = collectPoseFrames(child);
          if (frames.length) fragments.push(...frames);
        } else if (local === "ActionReference") {
          const refName = s(child.getAttribute("Name")).trim();
          if (!refName || visited.has(refName)) continue;
          visited.add(refName);
          const refNode = namedNodes.get(refName);
          if (refNode) fragments.push(...collectFragments(refNode, visited));
          visited.delete(refName);
        } else if (local === "Action") {
          fragments.push(...collectFragments(child, visited));
        }
      }
      return fragments;
    }

    const actions = {};
    for (const [name, node] of namedNodes.entries()) {
      const frames = collectFragments(node, new Set([name]));
      const processed = frames.map((frame) => ({
        ...frame,
        durationMs: poseDurationMs(frame.durationRaw, frames.length)
      }));
      actions[name] = {
        name,
        type: s(node.getAttribute("Type")).trim(),
        borderType: s(node.getAttribute("BorderType")).trim(),
        className: s(node.getAttribute("Class")).trim(),
        category: actionCategory(name),
        frames: processed
      };
    }

    const actionNames = Object.keys(actions).sort((a, b) => {
      const ca = actions[a].category;
      const cb = actions[b].category;
      if (ca !== cb) return ca.localeCompare(cb);
      return a.localeCompare(b);
    });

    const aliasMap = Object.freeze({
      idle: ["Stand", "StandUp", "SitDown", "Look"],
      walk: ["Walk", "WalkAlongWorkAreaFloor", "WalkAlongFloor"],
      run: ["Run", "RunAlongWorkAreaFloor", "Dash"],
      dash: ["Dash", "Run"],
      sit: ["Sit", "SitWithLegsDown", "SitAndDangleLegs", "SitWhileDanglingLegs"],
      relax: ["Sprawl", "LieDown", "Sit"],
      creep: ["Creep", "CrawlAlongWorkAreaFloor", "Walk"],
      jump: ["Jumping", "Jump", "JumpFromBottomOfIE"],
      fall: ["Falling", "Fall", "FallFromWall", "FallFromCeiling"],
      land: ["Bouncing", "Tripping", "Stand"],
      hurt: ["Tripping", "Bouncing", "Resisting"],
      drag: ["Pinched", "Dragged", "Resisting"],
      split: ["SplitIntoTwo", "Divide1", "Divided"],
      carryWalk: ["WalkWithIe", "Walk"],
      carryRun: ["RunWithIe", "Dash", "Run"],
      throwCarry: ["ThrowIe", "WalkWithIe"],
      wallGrab: ["GrabWall", "HoldOntoWall", "GrabLeftWall", "GrabRightWall"],
      wallClimb: ["ClimbWall", "ClimbAlongWall", "ClimbHalfwayAlongWall"],
      ceilingGrab: ["GrabCeiling", "HoldOntoCeiling"],
      ceilingClimb: ["ClimbCeiling", "ClimbAlongCeiling", "WalkAlongIECeiling"],
      pullUp: ["PullUpShimeji", "PullUp"],
      lookUp: ["SitAndLookUp", "SitAndFaceMouse", "Look"],
      spin: ["SitAndSpinHead", "SitAndSpinHeadAction", "Look"],
      restCarry: ["WalkWithIe", "Sit"],
      resist: ["Resisting", "Pinched"]
    });

    function resolveAlias(name) {
      const key = s(name).trim();
      if (actions[key]) return key;
      const aliasList = aliasMap[key];
      if (!aliasList) return actionNames[0] || "";
      return aliasList.find((candidate) => actions[candidate] && actions[candidate].frames.length) || aliasList.find((candidate) => actions[candidate]) || actionNames[0] || "";
    }

    function createAnimator(defaultAction) {
      const animator = {
        action: resolveAlias(defaultAction || "idle"),
        frameIndex: 0,
        frameElapsed: 0,
        actionElapsed: 0,
        loop: true,
        queuedAction: "",
        queuedLoop: true,
        facing: 1,
        transient: false,
        speedScale: 1,
        setAction(name, options) {
          const next = resolveAlias(name);
          if (!next) return;
          const restart = !!(options && options.restart);
          const nextLoop = options && typeof options.loop === "boolean" ? options.loop : true;
          if (!restart && next === this.action && this.loop === nextLoop) return;
          this.action = next;
          this.loop = nextLoop;
          this.frameIndex = 0;
          this.frameElapsed = 0;
          this.actionElapsed = 0;
          this.queuedAction = s(options && options.afterAction).trim();
          this.queuedLoop = options && typeof options.afterLoop === "boolean" ? options.afterLoop : true;
          this.transient = !!(options && options.transient);
          this.speedScale = Math.max(0.25, Number(options && options.speedScale) || 1);
        },
        update(dt) {
          const action = actions[this.action];
          if (!action || !action.frames.length) return;
          this.actionElapsed += dt;
          if (action.frames.length <= 1) return;
          const frame = action.frames[this.frameIndex];
          this.frameElapsed += dt * 1000 * this.speedScale;
          while (this.frameElapsed >= frame.durationMs) {
            this.frameElapsed -= frame.durationMs;
            if (this.frameIndex < action.frames.length - 1) {
              this.frameIndex += 1;
            } else if (this.loop) {
              this.frameIndex = 0;
            } else if (this.queuedAction) {
              this.setAction(this.queuedAction, { loop: this.queuedLoop });
              return;
            } else {
              this.frameIndex = action.frames.length - 1;
              return;
            }
          }
        },
        currentFrame() {
          const action = actions[this.action];
          if (!action || !action.frames.length) return null;
          return action.frames[Math.max(0, Math.min(action.frames.length - 1, this.frameIndex))];
        }
      };
      animator.setAction(defaultAction || "idle", { restart: true });
      return animator;
    }

    const runtime = {
      packId: s(opts.packId || config.packId || DEFAULT_PACK_ID),
      packName: s(opts.packName || config.packName || friendlyPackName(opts.packId || config.packId || DEFAULT_PACK_ID)),
      actions,
      actionNames,
      resolveAlias,
      createAnimator,
      image: null,
      frameImages
    };

    runtime.sampleFrame = function sampleFrame(name, timeSeconds, speedScale) {
      const actionName = resolveAlias(name);
      const action = actions[actionName];
      if (!action || !action.frames.length) return null;
      if (action.frames.length === 1) return action.frames[0];
      const totalDuration = action.frames.reduce((sum, frame) => sum + Math.max(1, Number(frame.durationMs) || 0), 0);
      if (!totalDuration) return action.frames[0];
      let cursor = (((Number(timeSeconds) || 0) * 1000 * Math.max(0.2, Number(speedScale) || 1)) % totalDuration + totalDuration) % totalDuration;
      for (const frame of action.frames) {
        const frameDuration = Math.max(1, Number(frame.durationMs) || 0);
        if (cursor < frameDuration) return frame;
        cursor -= frameDuration;
      }
      return action.frames[action.frames.length - 1] || null;
    };

    runtime.drawActor = function drawActor(ctx, animator, x, y, options) {
      const frame = animator && animator.currentFrame ? animator.currentFrame() : null;
      const sourceImage = frame && frame.image ? frame.image : runtime.image;
      if (!frame || !sourceImage) return;
      const height = Math.max(68, Number(options && options.height) || 82);
      const scale = height / Math.max(1, frame.sh);
      const flip = Number(options && options.facing || animator.facing || 1) < 0;
      const offsetY = Number(options && options.offsetY) || 0;
      const shadowScale = Math.max(0.1, Number(options && options.shadowScale) || 1);
      ctx.save();
      ctx.translate(x, y + offsetY);
      if (flip) ctx.scale(-1, 1);
      if (!options || options.shadow !== false) {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = "rgba(6, 8, 16, 0.9)";
        ctx.beginPath();
        ctx.ellipse(0, 8, 18 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      ctx.imageSmoothingEnabled = false;
      if (frame.image) {
        ctx.drawImage(
          sourceImage,
          0,
          0,
          frame.sw,
          frame.sh,
          -frame.anchorX * scale,
          -frame.anchorY * scale,
          frame.sw * scale,
          frame.sh * scale
        );
      } else {
        ctx.drawImage(
          sourceImage,
          frame.sx,
          frame.sy,
          frame.sw,
          frame.sh,
          -frame.anchorX * scale,
          -frame.anchorY * scale,
          frame.sw * scale,
          frame.sh * scale
        );
      }
      if (options && options.glow) {
        const auraW = frame.sw * scale * 0.72;
        const auraH = frame.sh * scale * 0.92;
        const aura = ctx.createRadialGradient(0, -auraH * 0.46, 4, 0, -auraH * 0.46, Math.max(auraW, auraH));
        aura.addColorStop(0, rgba(options.glow, 0.58));
        aura.addColorStop(0.45, rgba(options.glow, 0.18));
        aura.addColorStop(1, "rgba(0,0,0,0)");
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.38;
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.ellipse(0, -auraH * 0.46, auraW * 0.7, auraH * 0.88, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    };

    return runtime;
  }

  async function runtimeMessage(payload) {
    if (typeof chrome === "undefined" || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
      throw new Error("Mascot runtime messaging unavailable.");
    }
    return await new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Mascot runtime message timed out" + (payload && payload.type ? ": " + payload.type : ".")));
      }, 3200);
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        fn(value);
      };
      try {
        chrome.runtime.sendMessage(payload, (response) => {
          const runtimeError = chrome.runtime && chrome.runtime.lastError ? chrome.runtime.lastError.message : "";
          if (runtimeError) {
            finish(reject, new Error(runtimeError));
            return;
          }
          finish(resolve, response || null);
        });
      } catch (error) {
        finish(reject, error);
      }
    });
  }

  async function loadFrameImages(assets) {
    const entries = Object.entries(assets || {});
    const pairs = await Promise.all(entries.map(async ([name, src]) => {
      try {
        const image = await loadImage(src);
        const keys = spriteKeyCandidates(name);
        return keys.map((key) => [key, image]);
      } catch (_error) {
        return [];
      }
    }));
    return new Map(pairs.flat());
  }

  async function buildRuntimeFromPackRuntime(packRuntime, fallbackPackId) {
    const runtimeData = packRuntime && typeof packRuntime === "object" ? packRuntime : null;
    const pack = runtimeData && runtimeData.pack && typeof runtimeData.pack === "object" ? runtimeData.pack : {};
    const original = pack.shimejiCompat && pack.shimejiCompat.shimejisXyzOriginal && typeof pack.shimejiCompat.shimejisXyzOriginal === "object"
      ? pack.shimejiCompat.shimejisXyzOriginal
      : null;
    if (!original || !s(original.actions).trim()) {
      throw new Error("Pack runtime is missing exact shimeji action data.");
    }
    const frameImages = await loadFrameImages(runtimeData.assets || {});
    const runtime = buildActionRuntime({
      actions: original.actions,
      behaviors: original.behaviors,
      sprites: original.sprites || {}
    }, {
      packId: pack.packId || fallbackPackId || DEFAULT_PACK_ID,
      packName: pack.name || friendlyPackName(pack.packId || fallbackPackId || DEFAULT_PACK_ID),
      frameImages
    });
    const sheetCandidates = [];
    for (const candidate of [original.spritesheet, "spritesheet.png", "/spritesheet.png"]) {
      const trimmed = s(candidate).trim();
      if (!trimmed) continue;
      if (runtimeData.assets && runtimeData.assets[trimmed]) sheetCandidates.push(runtimeData.assets[trimmed]);
      if (runtimeData.assets && runtimeData.assets[trimmed.replace(/^\/+/, "")]) sheetCandidates.push(runtimeData.assets[trimmed.replace(/^\/+/, "")]);
      sheetCandidates.push(trimmed);
    }
    for (const candidate of sheetCandidates) {
      try {
        runtime.image = await loadImage(resolvePackUrl(candidate));
        break;
      } catch (_error) {}
    }
    return runtime;
  }

  const packRuntimePromises = new Map();
  async function loadPackRuntime(packSpec) {
    const spec = packSpec || {};
    const packId = normalizePackId(spec.packId || DEFAULT_PACK_ID) || DEFAULT_PACK_ID;
    if (packRuntimePromises.has(packId)) return packRuntimePromises.get(packId);
    const pending = (async () => {
      if (spec.configPath) {
        const response = await fetch(resolvePackUrl(spec.configPath));
        if (!response.ok) throw new Error("Failed to load " + friendlyPackName(packId) + " config: HTTP " + response.status);
        const config = await response.json();
        const runtime = buildActionRuntime(config, {
          packId,
          packName: spec.name || friendlyPackName(packId)
        });
        const sheetPath = s(spec.spritesheetPath || config.spritesheet).trim();
        if (sheetPath) runtime.image = await loadImage(resolvePackUrl(sheetPath));
        return runtime;
      }
      const response = await runtimeMessage({ type: MASCOT_MSG.GET_ACTIVE_PACK_RUNTIME, packId });
      const packRuntime = response && response.ok && response.runtime ? response.runtime : response && response.runtime ? response.runtime : null;
      if (!packRuntime) throw new Error("Pack runtime unavailable for " + friendlyPackName(packId) + ".");
      return await buildRuntimeFromPackRuntime(packRuntime, packId);
    })()
      .finally(() => {
        packRuntimePromises.delete(packId);
      });
    packRuntimePromises.set(packId, pending);
    return pending;
  }

  async function discoverOwnedShimejiPacks() {
    const localFallback = sortPackSpecs(LOCAL_SHIMEJI_PACKS.map((entry) => ({
      packId: entry.packId,
      name: entry.name,
      origin: entry.origin,
      configPath: entry.configPath,
      spritesheetPath: entry.spritesheetPath,
      source: "local"
    })));
    if (typeof chrome === "undefined" || !chrome.runtime || typeof chrome.runtime.sendMessage !== "function") {
      return localFallback;
    }
    try {
      await runtimeMessage({ type: MASCOT_MSG.ENSURE_BUNDLED_REFERENCE_SHIMEJIS }).catch(() => null);
      const response = await runtimeMessage({ type: MASCOT_MSG.LIST_PACKS });
      const packs = Array.isArray(response && response.packs) ? response.packs : [];
      const normalized = [];
      for (const row of packs) {
        const packId = normalizePackId(row && row.packId);
        if (!packId) continue;
        const tags = Array.isArray(row && row.tags) ? row.tags.map((tag) => s(tag).toLowerCase()) : [];
        const looksShimeji = tags.includes("shimeji") || tags.includes("shimeji-ee") || s(row && row.importType).toLowerCase() === "shimeji-ee" || !!(row && row.shimejiCompat);
        if (!looksShimeji) continue;
        const localSpec = findLocalPackSpec(packId);
        normalized.push({
          packId,
          name: s(row && row.name || (localSpec && localSpec.name) || friendlyPackName(packId)),
          origin: s(row && row.origin || (localSpec && localSpec.origin) || "Owned Pack"),
          configPath: localSpec && localSpec.configPath,
          spritesheetPath: localSpec && localSpec.spritesheetPath,
          source: localSpec ? "local" : "background"
        });
      }
      if (normalized.length) return sortPackSpecs(normalized);
    } catch (_error) {}
    return localFallback;
  }

  async function loadBonniRuntime() {
    return await loadPackRuntime(findLocalPackSpec(DEFAULT_PACK_ID) || LOCAL_SHIMEJI_PACKS[0]);
  }

  function createSaveStore(core) {
    const hasChromeStorage = typeof chrome !== "undefined" && chrome && chrome.storage && chrome.storage.local;
    return {
      async get(key, fallback) {
        if (core && core.DB && typeof core.DB.get === "function" && hasChromeStorage) {
          const value = await core.DB.get(key, fallback);
          return value == null ? fallback : value;
        }
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : fallback;
        } catch (_error) {
          return fallback;
        }
      },
      async set(key, value) {
        if (core && core.DB && typeof core.DB.set === "function" && hasChromeStorage) {
          await core.DB.set(key, value);
          return;
        }
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (_error) {}
      }
    };
  }

  function createSynth() {
    let ctx = null;
    let enabled = false;

    function ensureCtx() {
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return null;
        ctx = new AudioCtx();
      }
      if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
      return ctx;
    }

    function blip(type, freq, duration, shape, gainValue, detune, sweepTo) {
      const actx = ensureCtx();
      if (!actx || !enabled) return;
      const now = actx.currentTime;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      const filter = actx.createBiquadFilter();
      filter.type = type || "lowpass";
      filter.frequency.setValueAtTime(Math.max(240, freq * 2), now);
      osc.type = shape || "square";
      osc.frequency.setValueAtTime(freq, now);
      if (Number.isFinite(detune)) osc.detune.setValueAtTime(detune, now);
      if (Number.isFinite(sweepTo)) osc.frequency.exponentialRampToValueAtTime(Math.max(40, sweepTo), now + duration);
      gain.gain.setValueAtTime(gainValue || 0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, (gainValue || 0.12) * 0.9), now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    }

    return {
      unlock() {
        enabled = true;
        ensureCtx();
      },
      play(name) {
        if (name === "shoot") {
          blip("bandpass", 640, 0.12, "square", 0.055, 0, 320);
        } else if (name === "pickup") {
          blip("lowpass", 520, 0.16, "triangle", 0.08, 0, 910);
        } else if (name === "explosion") {
          blip("lowpass", 90, 0.28, "sawtooth", 0.14, -120, 55);
        } else if (name === "siren") {
          blip("bandpass", 380 + Math.random() * 240, 0.20, "sine", 0.035, 0, 740);
        } else if (name === "mission") {
          blip("lowpass", 330, 0.22, "triangle", 0.08, 0, 660);
          setTimeout(() => blip("lowpass", 660, 0.18, "triangle", 0.07, 0, 980), 90);
        } else if (name === "damage") {
          blip("lowpass", 130, 0.15, "sawtooth", 0.08, -30, 85);
        } else if (name === "split") {
          blip("highpass", 240, 0.14, "triangle", 0.07, 0, 940);
        } else if (name === "save") {
          blip("lowpass", 420, 0.14, "triangle", 0.05, 0, 740);
        } else if (name === "drive") {
          blip("bandpass", 120 + Math.random() * 40, 0.08, "sawtooth", 0.015, 0, 170);
        }
      }
    };
  }

  function buildRoadGraph(nodes) {
    const graph = new Map();
    for (let i = 0; i < nodes.length; i++) graph.set(i, []);
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const sameRow = Math.abs(a.y - b.y) < 10 && Math.abs(a.x - b.x) < 560;
        const sameCol = Math.abs(a.x - b.x) < 10 && Math.abs(a.y - b.y) < 520;
        if (sameRow || sameCol) {
          graph.get(i).push(j);
          graph.get(j).push(i);
        }
      }
    }
    return graph;
  }

  function createOpenWorldGame(container, options) {
    const opts = options || {};
    const core = C();
    const { clamp, lerp, rand, randInt, pick, Draw } = core;
    const saveStore = createSaveStore(core);
    const synth = createSynth();
    const { cvs, ctx } = core.createCanvas(container, W, H, { bg: "#050814", radius: 10 });
    const stage = document.createElement("div");
    stage.className = "gs-openworld-stage";
    stage.style.position = "relative";
    stage.style.width = "100%";
    stage.style.maxWidth = W + "px";
    stage.style.margin = "0 auto";
    stage.style.aspectRatio = W + " / " + H;
    const sceneHost = document.createElement("div");
    sceneHost.className = "gs-openworld-3d-host";
    sceneHost.style.position = "absolute";
    sceneHost.style.inset = "0";
    sceneHost.style.zIndex = "1";
    sceneHost.style.display = "none";
    sceneHost.style.pointerEvents = "none";
    if (cvs.parentNode) {
      cvs.parentNode.insertBefore(stage, cvs);
      stage.appendChild(sceneHost);
      stage.appendChild(cvs);
    }
    cvs.style.position = "relative";
    cvs.style.zIndex = "2";
    cvs.style.background = "transparent";
    const input = core.createInput(cvs);
    const particles = core.createParticleSystem(1800);
    const roadGraph = buildRoadGraph(ROAD_NODES);
    const screenFx = core.ScreenFX;
    let runtime = null;
    let runtimeError = "";
    let saveLoaded = false;
    let savePending = false;
    let rafId = 0;
    let running = false;
    let lastTs = 0;
    let ambientTimer = 0;
    let trafficTimer = 0;
    let policeSirenTimer = 0;
    let pointerDownLast = false;
    let suppressPointerShot = false;
    let lookDeltaX = 0;
    let lookDeltaY = 0;
    let lookYawVelocity = 0;
    let lookPitchVelocity = 0;
    let lastLookInputAt = 0;
    let dragLookActive = false;
    let lastLookClientX = 0;
    let lastLookClientY = 0;
    const prevKeys = {};
    const camera = { x: 0, y: 0 };
    let scene3d = null;
    let scene3dPromise = null;
    let scene3dError = "";
    let packSelectPromise = null;

    const state = {
      mode: opts.autoStart ? "playing" : "title",
      titlePulse: 0,
      overlay: "",
      mapOpen: false,
      actionDeckOpen: false,
      actionPage: 0,
      message: "Enter to roll out.",
      messageTimer: 5,
      saveToast: 0,
      hintTimer: 10,
      rainPhase: 0,
      activeMission: 0,
      missionPhase: 0,
      completedMissions: [],
      missionTimer: 0,
      introGlitch: 0,
      lastSafehouseId: "hideout",
      cash: 850,
      notoriety: 0,
      bulletsFired: 0,
      totalPlaySeconds: 0,
      bestHeat: 0,
      pickupSeed: 1,
      worldFlags: {},
      parkedVehicleTag: "",
      dropZonePulse: 0,
      rescuedByte: false,
      player: null,
      npcs: [],
      vehicles: [],
      bullets: [],
      pickups: [],
      decoys: [],
      skyDrops: [],
      deliveryZones: [],
      markerPulse: 0,
      wantedFlash: 0,
      paused: false,
      gameOver: false,
      won: false,
      availableWeapons: ["pistol"],
      rooftopAccess: {},
      dimensionMode: "2d",
      cameraMode: "topdown",
      firstPersonRigStyle: "sprite",
      selectedPackId: DEFAULT_PACK_ID,
      selectedPackName: friendlyPackName(DEFAULT_PACK_ID),
      selectedPackOrigin: "Bundled Reference",
      availablePacks: [],
      characterSelectOpen: false,
      characterPage: 0,
      characterCursor: 0,
      characterCards: [],
      packLoadBusy: false,
      packLoadError: "",
      packLoadMessage: ""
    };

    const rootApi = {
      getState: () => state,
      step: (ms) => manualAdvance(ms),
      triggerAction: (name) => triggerDeckAction(name),
      save: () => saveGame(),
      load: () => loadGame(),
      listAvailablePacks: () => state.availablePacks.slice(),
      selectPack: (packId) => selectPack(packId),
      setFirstPersonRigStyle: (style) => setFirstPersonRigStyle(style),
      debugTeleport: (x, y, opts = {}) => {
        const px = Number(x);
        const py = Number(y);
        if (!Number.isFinite(px) || !Number.isFinite(py) || !state.player) return null;
        if (state.player.mode === "vehicle" && opts.keepVehicle !== true) exitVehicle();
        if (state.player.interiorId && opts.keepInterior !== true) {
          state.player.interiorId = null;
          state.player.outdoorRoofId = null;
        }
        state.player.x = px;
        state.player.y = py;
        state.player.vx = 0;
        state.player.vy = 0;
        state.player.jumpZ = 0;
        state.player.jumpVz = 0;
        state.player.airborneRoofId = "";
        state.player.interactCooldown = 0;
        state.player.outdoorX = px;
        state.player.outdoorY = py;
        state.player.mode = "ground";
        state.player.roofId = s(opts.roofId || "");
        state.player.outdoorRoofId = state.player.roofId;
        return {
          x: state.player.x,
          y: state.player.y,
          roofId: state.player.roofId || null,
          interiorId: state.player.interiorId || null,
          vehicleId: state.player.vehicleId || null
        };
      },
      debugInteract: () => useInteract(),
      debugLook: (yaw, pitch) => {
        if (!state.player) return null;
        if (Number.isFinite(yaw)) state.player.aimAngle = normalizeAngle(yaw);
        if (Number.isFinite(pitch)) state.player.lookPitch = clamp(pitch, -1.45, 1.45);
        return {
          aimAngle: state.player.aimAngle,
          lookPitch: state.player.lookPitch
        };
      },
      debugFire: () => firePlayerWeapon(),
      debugGiveWeapon: (weaponId, ammo) => {
        const weapon = weaponById(weaponId);
        if (!weapon) return null;
        giveWeapon(weapon.id, Number.isFinite(Number(ammo)) ? Number(ammo) : weapon.ammoMax);
        state.player.currentWeapon = weapon.id;
        return {
          id: weapon.id,
          ammo: state.player.ammo[weapon.id] || 0
        };
      },
      debugSelectPack: (packId) => selectPack(packId, { silent: false }),
      debugOpenCharacterSelect: () => {
        state.characterSelectOpen = true;
        return {
          selectedPackId: state.selectedPackId,
          total: state.availablePacks.length
        };
      }
    };

    function makeAnimator(defaultAction) {
      return runtime ? runtime.createAnimator(defaultAction) : null;
    }

    function currentPackLabel() {
      return s(state.selectedPackName || friendlyPackName(state.selectedPackId || DEFAULT_PACK_ID)) || "Mascot";
    }

    function currentPackAccent() {
      return packTheme(state.selectedPackId || DEFAULT_PACK_ID, "#6ee7ff");
    }

    function normalizeFirstPersonRigStyle(value) {
      return s(value).toLowerCase() === "mesh" ? "mesh" : "sprite";
    }

    function firstPersonRigStyleLabel() {
      return state.firstPersonRigStyle === "mesh" ? "3D hands" : "Mascot cutout";
    }

    function setFirstPersonRigStyle(style, silent) {
      const next = normalizeFirstPersonRigStyle(style);
      if (state.firstPersonRigStyle === next) return next;
      state.firstPersonRigStyle = next;
      if (!silent) setMessage("First-person rig: " + firstPersonRigStyleLabel(), 1.4);
      saveGame();
      return next;
    }

    function weaponById(id) {
      return WEAPONS.find((weapon) => weapon.id === id) || WEAPONS[0];
    }

    function currentActionHints() {
      const name = currentPackLabel();
      return [
        "1-0 trigger the visible " + name + " actions while the action deck is open.",
        "[ and ] flip through the full authored action pages.",
        "Traversal uses the mascot's native walk, run, jump, sit, wall, ceiling, carry, throw, split, and pull-up aliases when present.",
        "J swaps the first-person mascot cutout and 3D hand rigs without changing progress."
      ];
    }

    function resetRuntimeAnimators() {
      if (!runtime) return;
      if (state.player) state.player.animator = makeAnimator("idle");
      for (const npc of state.npcs) {
        npc.animator = makeAnimator(npc.kind === "civilian" ? "walk" : npc.kind === "ally" ? "sit" : "idle");
      }
      for (const decoy of state.decoys) decoy.animator = makeAnimator("split");
    }

    function findAvailablePack(packId) {
      const id = normalizePackId(packId);
      return state.availablePacks.find((entry) => normalizePackId(entry.packId) === id) || findLocalPackSpec(id);
    }

    function syncCharacterCursorToSelected() {
      const index = Math.max(0, state.availablePacks.findIndex((entry) => normalizePackId(entry.packId) === normalizePackId(state.selectedPackId)));
      state.characterCursor = index;
      state.characterPage = Math.floor(index / PACKS_PER_PAGE);
    }

    async function selectPack(packId, options) {
      const opts = options || {};
      const spec = findAvailablePack(packId) || findLocalPackSpec(packId) || findLocalPackSpec(DEFAULT_PACK_ID);
      if (!spec) return null;
      const targetPackId = normalizePackId(spec.packId);
      if (packSelectPromise) {
        try {
          await packSelectPromise;
        } catch (_error) {}
        if (normalizePackId(state.selectedPackId) === targetPackId) {
          return {
            packId: state.selectedPackId,
            name: state.selectedPackName,
            actionCount: runtime && runtime.actionNames ? runtime.actionNames.length : 0
          };
        }
      }
      packSelectPromise = (async () => {
        state.packLoadBusy = true;
        state.packLoadError = "";
        state.packLoadMessage = "Loading " + (spec.name || friendlyPackName(targetPackId)) + "...";
        try {
          runtime = await loadPackRuntime(spec);
          state.selectedPackId = normalizePackId(runtime && runtime.packId || targetPackId);
          state.selectedPackName = s(runtime && runtime.packName || spec.name || friendlyPackName(targetPackId));
          state.selectedPackOrigin = s(spec.origin || "");
          resetRuntimeAnimators();
          syncCharacterCursorToSelected();
          state.characterSelectOpen = false;
          if (!opts.silent) {
            setMessage(state.selectedPackName + " is on the street.", 1.8);
          }
          if (!opts.skipSave) saveGame();
          return {
            packId: state.selectedPackId,
            name: state.selectedPackName,
            actionCount: runtime && runtime.actionNames ? runtime.actionNames.length : 0
          };
        } catch (error) {
          const message = error && error.message ? error.message : String(error);
          state.packLoadError = message;
          if (!opts.silent) setMessage(message, 2.2);
          throw error;
        } finally {
          state.packLoadBusy = false;
          state.packLoadMessage = "";
          packSelectPromise = null;
        }
      })();
      return await packSelectPromise;
    }

    function createPlayer() {
      return {
        x: 418,
        y: 2000,
        vx: 0,
        vy: 0,
        aimAngle: 0,
        lookPitch: 0,
        lastShotAt: -99,
        shotKick: 0,
        jumpZ: 0,
        jumpVz: 0,
        jumpCooldown: 0,
        dir: 1,
        hp: 100,
        armor: 45,
        heat: 0,
        stamina: 100,
        speed: 180,
        sprintMul: 1.65,
        currentWeapon: "pistol",
        ammo: {
          pistol: 72,
          smg: 0,
          launcher: 0,
          vinyl: 0,
          beat_blaster: 0,
          mic_lancer: 0,
          dubstep_cannon: 0,
          paint_sprayer: 0
        },
        fireCooldown: 0,
        interactCooldown: 0,
        splitCooldown: 0,
        invuln: 0,
        carryItem: "",
        carryLabel: "",
        carryColor: "#ffffff",
        mode: "ground",
        wallRouteId: "",
        ceilingRouteId: "",
        roofId: "",
        airborneRoofId: "",
        interiorId: "",
        outdoorX: 418,
        outdoorY: 2000,
        outdoorRoofId: "",
        vehicleId: "",
        allyId: "",
        enteredVehicleAt: 0,
        actionOverride: "",
        overrideTimer: 0,
        animator: null,
        score: 0
      };
    }

    function pointerLocked() {
      return document.pointerLockElement === cvs;
    }

    function releasePointerLock() {
      if (pointerLocked() && document.exitPointerLock) {
        document.exitPointerLock();
      }
    }

    function smoothStepForRate(dt, rate) {
      return 1 - Math.exp(-Math.max(0, Number(dt) || 0) * rate);
    }

    function handleLookPointerMove(event) {
      if (state.dimensionMode !== "3d" || state.mode !== "playing" || state.paused) return;
      if (pointerLocked()) {
        const samples = typeof event.getCoalescedEvents === "function" ? event.getCoalescedEvents() : null;
        let movedX = 0;
        let movedY = 0;
        if (samples && samples.length) {
          for (const sample of samples) {
            movedX += Number(sample.movementX) || 0;
            movedY += Number(sample.movementY) || 0;
          }
        }
        if (!movedX && !movedY) {
          movedX = Number(event.movementX) || 0;
          movedY = Number(event.movementY) || 0;
        }
        lookDeltaX += movedX;
        lookDeltaY += movedY;
        if (Math.abs(movedX) > 0.001 || Math.abs(movedY) > 0.001) {
          lastLookInputAt = state.totalPlaySeconds || performance.now() / 1000;
        }
        return;
      }
      const clientX = Number(event.clientX) || 0;
      const clientY = Number(event.clientY) || 0;
      if (!dragLookActive) {
        lastLookClientX = clientX;
        lastLookClientY = clientY;
        return;
      }
      const movedX = clientX - lastLookClientX;
      const movedY = clientY - lastLookClientY;
      lookDeltaX += movedX;
      lookDeltaY += movedY;
      if (Math.abs(movedX) > 0.001 || Math.abs(movedY) > 0.001) {
        lastLookInputAt = state.totalPlaySeconds || performance.now() / 1000;
      }
      lastLookClientX = clientX;
      lastLookClientY = clientY;
    }

    function handleLookPointerDown(event) {
      dragLookActive = true;
      lastLookClientX = Number(event.clientX) || 0;
      lastLookClientY = Number(event.clientY) || 0;
    }

    function handleLookPointerUp() {
      dragLookActive = false;
    }

    function handleViewportClick() {
      if (state.dimensionMode !== "3d" || state.mode !== "playing" || state.paused) return;
      if (!pointerLocked() && typeof cvs.requestPointerLock === "function") {
        suppressPointerShot = true;
        try {
          const lock = cvs.requestPointerLock({ unadjustedMovement: true });
          if (lock && typeof lock.catch === "function") {
            lock.catch(() => {
              try {
                const fallback = cvs.requestPointerLock();
                if (fallback && typeof fallback.catch === "function") fallback.catch(() => {});
              } catch (_) {}
            });
          }
        } catch (_) {
          try {
            const fallback = cvs.requestPointerLock();
            if (fallback && typeof fallback.catch === "function") fallback.catch(() => {});
          } catch (_) {}
        }
      }
    }

    document.addEventListener("mousemove", handleLookPointerMove);
    cvs.addEventListener("mousedown", handleLookPointerDown);
    document.addEventListener("mouseup", handleLookPointerUp);
    cvs.addEventListener("click", handleViewportClick);

    function nearestNodeIndex(x, y) {
      let best = 0;
      let bestDist = Infinity;
      for (let i = 0; i < ROAD_NODES.length; i++) {
        const node = ROAD_NODES[i];
        const dx = node.x - x;
        const dy = node.y - y;
        const dist = dx * dx + dy * dy;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
      return best;
    }

    function nextGraphNode(current, previous) {
      const neighbors = roadGraph.get(current) || [];
      const filtered = neighbors.filter((node) => node !== previous);
      return pick((filtered.length ? filtered : neighbors).length ? (filtered.length ? filtered : neighbors) : [current]);
    }

    function createNpc(id, kind, x, y, extra) {
      const base = {
        id,
        kind,
        x,
        y,
        vx: 0,
        vy: 0,
        jumpZ: 0,
        jumpVz: 0,
        dir: 1,
        hp: kind === "boss" ? 260 : kind === "police" ? 90 : kind === "gang" ? 78 : kind === "ally" ? 100 : 42,
        maxHp: kind === "boss" ? 260 : kind === "police" ? 90 : kind === "gang" ? 78 : kind === "ally" ? 100 : 42,
        state: kind === "civilian" ? "roam" : kind === "ally" ? "follow" : "guard",
        targetNode: nearestNodeIndex(x, y),
        prevNode: -1,
        aiTimer: rand(0.4, 1.6),
        fireCooldown: rand(0.15, 0.7),
        alertTimer: 0,
        benchTimer: rand(3, 8),
        sitTimer: 0,
        missionTag: "",
        hidden: false,
        roofId: "",
        airborneRoofId: "",
        color: kind === "police" ? "#e0fbff" : kind === "gang" ? "#ff968c" : kind === "boss" ? "#ff5aa9" : kind === "ally" ? "#8dfbd1" : "#ffc26b",
        animator: null
      };
      return Object.assign(base, extra || {});
    }

    function createVehicle(id, model, x, y, angle, extra) {
      const spec = VEHICLE_SPECS[model];
      return Object.assign({
        id,
        model,
        x,
        y,
        angle: angle || 0,
        speed: 0,
        hp: spec.hp,
        maxHp: spec.hp,
        width: spec.width,
        height: spec.height,
        occupantId: "",
        aiDriver: true,
        targetNode: nearestNodeIndex(x, y),
        prevNode: -1,
        siren: model === "cruiser",
        tag: "",
        highlight: 0
      }, extra || {});
    }

    function seedWorld() {
      state.player = createPlayer();
      state.npcs = [
        createNpc("civ_1", "civilian", 580, 1790),
        createNpc("civ_2", "civilian", 770, 1470),
        createNpc("civ_3", "civilian", 1040, 980),
        createNpc("civ_4", "civilian", 1470, 1550),
        createNpc("civ_5", "civilian", 2410, 1490),
        createNpc("civ_6", "civilian", 2280, 890),
        createNpc("byte", "ally", 1500, 500, { hidden: true, state: "captured", missionTag: "byte" })
      ];
      state.vehicles = [
        createVehicle("getaway", "coupe", 2220, 1680, 0, { tag: "getaway", aiDriver: false, highlight: 1 }),
        createVehicle("safehouse_van", "van", 468, 2000, 0, { tag: "safehouse", aiDriver: false }),
        createVehicle("safehouse_gt", "streetfire", 640, 2000, 0, { tag: "safehouse", aiDriver: false }),
        createVehicle("midtown_muscle", "muscle", 1340, 1820, 0, { aiDriver: false }),
        createVehicle("signal_van", "van", 2190, 640, Math.PI, { tag: "signal_van", aiDriver: false }),
        createVehicle("traffic_1", "coupe", 1120, 1420, 0),
        createVehicle("traffic_2", "midnight", 1660, 980, Math.PI / 2),
        createVehicle("traffic_3", "van", 2550, 980, Math.PI),
        createVehicle("traffic_4", "pickup", 470, 560, Math.PI / 2),
        createVehicle("traffic_5", "streetfire", 2660, 1820, Math.PI),
        createVehicle("traffic_6", "muscle", 710, 1420, 0)
      ];
      state.pickups = [
        createPickupEntry("pickup_weapon_vinyl", 552, 1916, "weapon", { weaponId: "vinyl", amount: 32, label: "Vinyl Shredder" }),
        createPickupEntry("pickup_weapon_beat", 610, 1916, "weapon", { weaponId: "beat_blaster", amount: 90, label: "Beat Blaster" }),
        createPickupEntry("pickup_weapon_mic", 668, 1916, "weapon", { weaponId: "mic_lancer", amount: 20, label: "Karaoke Lancer" }),
        createPickupEntry("pickup_weapon_paint", 726, 1916, "weapon", { weaponId: "paint_sprayer", amount: 120, label: "Graffiti Sprayer" }),
        createPickupEntry("pickup_weapon_dubstep", 1180, 1712, "weapon", { weaponId: "dubstep_cannon", amount: 8, label: "Dubstep Cannon" })
      ];
      state.bullets = [];
      state.decoys = [];
      state.deliveryZones = [
        { id: "hideout_drop", x: 430, y: 2000, r: 78, label: "Hideout garage", activeFor: "courier_crash" },
        { id: "dock_drop", x: 2770, y: 860, r: 76, label: "Dock drop zone", activeFor: "dockside_throwdown" }
      ];
      state.skyDrops = [
        { id: "archive_drop", x: 1535, y: 650, r: 60, land: { x: 1570, y: 980 } }
      ];
      state.activeMission = 0;
      state.missionPhase = 0;
      state.completedMissions = [];
      state.missionTimer = 0;
      state.cash = 850;
      state.notoriety = 0;
      state.bestHeat = 0;
      state.availableWeapons = ["pistol"];
      state.player.animator = makeAnimator("idle");
      for (const npc of state.npcs) npc.animator = makeAnimator(npc.kind === "ally" ? "sit" : "idle");
      initializeMission(0, true);
    }

    function currentMission() {
      return MISSIONS[state.activeMission] || MISSIONS[MISSIONS.length - 1];
    }

    function missionComplete(id) {
      return state.completedMissions.includes(id);
    }

    function givePickup(x, y, kind, payload) {
      state.pickups.push(createPickupEntry("", x, y, kind, payload));
    }

    function clearMissionActors(tag) {
      state.npcs = state.npcs.filter((npc) => npc.missionTag !== tag);
      state.pickups = state.pickups.filter((pickup) => pickup.payload !== tag && (!pickup.payload || pickup.payload.missionTag !== tag));
    }

    function initializeMission(index, initial) {
      state.activeMission = clamp(index, 0, MISSIONS.length - 1);
      state.missionPhase = 0;
      state.missionTimer = 0;
      state.worldFlags = {};
      state.deliveryZones = [];
      state.rescuedByte = false;
      state.message = currentMission().title + ": " + currentMission().brief;
      state.messageTimer = 7;
      if (!initial) {
        synth.play("mission");
        screenFx.flash("rgba(255,255,255,0.18)", 0.15);
      }
      clearMissionActors("courier_crash");
      clearMissionActors("skyline_rescue");
      clearMissionActors("dockside_throwdown");
      clearMissionActors("split_decision");

      if (currentMission().id === "courier_crash") {
        state.npcs.push(
          createNpc("courier_guard_1", "gang", 2440, 1430, { missionTag: "courier_crash" }),
          createNpc("courier_guard_2", "gang", 2510, 1490, { missionTag: "courier_crash" }),
          createNpc("courier_guard_3", "gang", 2370, 1510, { missionTag: "courier_crash" }),
          createNpc("courier_runner", "gang", 2460, 1450, { missionTag: "courier_crash", hp: 60, maxHp: 60, state: "guard", lootCarrier: true })
        );
        for (const npc of state.npcs) if (!npc.animator) npc.animator = makeAnimator("idle");
        state.vehicles.find((v) => v.id === "getaway").highlight = 1;
      } else if (currentMission().id === "skyline_rescue") {
        const byte = state.npcs.find((npc) => npc.id === "byte");
        if (byte) {
          byte.x = 1505;
          byte.y = 505;
          byte.hidden = false;
          byte.state = "captured";
          byte.hp = byte.maxHp;
          byte.missionTag = "skyline_rescue";
          byte.roofId = "archive-east";
          byte.airborneRoofId = "";
        }
        state.npcs.push(
          createNpc("archive_guard_1", "gang", 1210, 760, { missionTag: "skyline_rescue", roofId: "archive-tower" }),
          createNpc("archive_guard_2", "gang", 1490, 590, { missionTag: "skyline_rescue", roofId: "archive-east" })
        );
        for (const npc of state.npcs) if (!npc.animator) npc.animator = makeAnimator("idle");
      } else if (currentMission().id === "dockside_throwdown") {
        state.npcs.push(
          createNpc("dock_guard_1", "gang", 2250, 610, { missionTag: "dockside_throwdown" }),
          createNpc("dock_guard_2", "gang", 2340, 560, { missionTag: "dockside_throwdown" }),
          createNpc("dock_guard_3", "gang", 2510, 590, { missionTag: "dockside_throwdown" })
        );
        state.vehicles.find((v) => v.id === "signal_van").highlight = 1;
        for (const npc of state.npcs) if (!npc.animator) npc.animator = makeAnimator("idle");
      } else if (currentMission().id === "split_decision") {
        state.npcs.push(
          createNpc("captain_static", "boss", 2440, 1290, { missionTag: "split_decision", state: "guard" }),
          createNpc("final_guard_1", "gang", 2340, 1360, { missionTag: "split_decision" }),
          createNpc("final_guard_2", "gang", 2540, 1360, { missionTag: "split_decision" }),
          createNpc("final_guard_3", "gang", 2470, 1440, { missionTag: "split_decision" })
        );
        for (const npc of state.npcs) if (!npc.animator) npc.animator = makeAnimator("idle");
      }
    }

    function setMessage(text, seconds) {
      state.message = text;
      state.messageTimer = seconds || 3.2;
    }

    function currentWeapon() {
      return weaponById(state.player.currentWeapon);
    }

    function hasWeapon(id) {
      return state.availableWeapons.includes(id);
    }

    function giveWeapon(id, ammo) {
      if (!hasWeapon(id)) state.availableWeapons.push(id);
      const weapon = weaponById(id);
      state.player.ammo[id] = Math.min(weapon.ammoMax, Math.max(state.player.ammo[id] || 0, ammo || 0));
    }

    function createPickupEntry(id, x, y, kind, payload) {
      return {
        id: id || ("pickup_" + Date.now() + "_" + Math.floor(Math.random() * 9999)),
        x,
        y,
        r: 18,
        kind,
        payload,
        bob: rand(0, Math.PI * 2)
      };
    }

    function saveGame() {
      if (savePending || !state.player) return;
      savePending = true;
      const payload = {
        version: 3,
        selectedPackId: state.selectedPackId,
        selectedPackName: state.selectedPackName,
        activeMission: state.activeMission,
        missionPhase: state.missionPhase,
        completedMissions: state.completedMissions.slice(),
        cash: state.cash,
        bestHeat: state.bestHeat,
        availableWeapons: state.availableWeapons.slice(),
        presentation: {
          dimensionMode: state.dimensionMode,
          cameraMode: state.cameraMode,
          firstPersonRigStyle: state.firstPersonRigStyle
        },
        player: {
          x: state.player.x,
          y: state.player.y,
          hp: state.player.hp,
          armor: state.player.armor,
          ammo: { ...state.player.ammo },
          currentWeapon: state.player.currentWeapon,
          carryItem: state.player.carryItem,
          carryLabel: state.player.carryLabel,
          carryColor: state.player.carryColor,
          roofId: state.player.roofId,
          lastSafehouseId: state.lastSafehouseId,
          interiorId: state.player.interiorId,
          outdoorX: state.player.outdoorX,
          outdoorY: state.player.outdoorY,
          outdoorRoofId: state.player.outdoorRoofId,
          aimAngle: state.player.aimAngle
        }
      };
      saveStore.set(SAVE_KEY, payload).finally(() => {
        savePending = false;
      });
      state.saveToast = 2.2;
      synth.play("save");
    }

    async function applyLoadedGame(payload) {
      saveLoaded = true;
      if (!payload || !state.player) return;
      const savedPackId = s(payload.selectedPackId || "").trim();
      if (savedPackId && normalizePackId(savedPackId) !== normalizePackId(state.selectedPackId)) {
        try {
          await selectPack(savedPackId, { silent: true, skipSave: true });
        } catch (_error) {}
      }
      state.activeMission = clamp(Number(payload.activeMission) || 0, 0, MISSIONS.length - 1);
      const savedPhase = Math.max(0, Number(payload.missionPhase) || 0);
      state.completedMissions = Array.isArray(payload.completedMissions) ? payload.completedMissions.slice() : [];
      state.cash = Number(payload.cash) || state.cash;
      state.bestHeat = Number(payload.bestHeat) || 0;
      if (Array.isArray(payload.availableWeapons)) state.availableWeapons = payload.availableWeapons.slice();
      const presentation = payload.presentation || {};
      state.dimensionMode = s(presentation.dimensionMode || "2d") === "3d" ? "3d" : "2d";
      state.cameraMode = s(presentation.cameraMode || "topdown") === "first-person" ? "first-person" : (state.dimensionMode === "3d" ? "third-person" : "topdown");
      state.firstPersonRigStyle = normalizeFirstPersonRigStyle(presentation.firstPersonRigStyle || state.firstPersonRigStyle);
      const player = payload.player || {};
      state.player.x = Number(player.x) || state.player.x;
      state.player.y = Number(player.y) || state.player.y;
      state.player.hp = clamp(Number(player.hp) || 100, 1, 100);
      state.player.armor = clamp(Number(player.armor) || 0, 0, 100);
      state.player.currentWeapon = s(player.currentWeapon || "pistol");
      state.player.carryItem = s(player.carryItem || "");
      state.player.carryLabel = s(player.carryLabel || "");
      state.player.carryColor = s(player.carryColor || "#ffffff");
      state.player.roofId = s(player.roofId || "");
      state.player.interiorId = s(player.interiorId || "");
      state.player.outdoorX = Number(player.outdoorX);
      state.player.outdoorY = Number(player.outdoorY);
      state.player.outdoorRoofId = s(player.outdoorRoofId || "");
      state.player.aimAngle = Number(player.aimAngle) || 0;
      state.player.ammo = Object.assign({}, state.player.ammo, player.ammo || {});
      state.lastSafehouseId = s(player.lastSafehouseId || state.lastSafehouseId);
      initializeMission(state.activeMission, true);
      state.missionPhase = savedPhase;
      sanitizeLoadedState();
      if (state.activeMission === 1 && savedPhase >= 4) {
        const byte = state.npcs.find((npc) => npc.id === "byte");
        if (byte) {
          byte.hidden = false;
          byte.state = "follow";
          clearRoofState(byte);
        }
        state.rescuedByte = true;
      }
      if (state.activeMission === 2 && savedPhase >= 3) {
        state.deliveryZones = [{ id: "dock-drop", x: 2770, y: 860, r: 76, color: "#2dd4bf" }];
      }
    }

    async function loadGame(payloadOverride) {
      const payload = arguments.length ? payloadOverride : await saveStore.get(SAVE_KEY, null);
      await applyLoadedGame(payload);
    }

    function objectiveMarker() {
      const mission = currentMission();
      if (!mission) return null;
      const interior = currentInterior();
      if (interior) {
        return {
          x: interior.exitZone.x + interior.exitZone.w * 0.5,
          y: interior.exitZone.y + interior.exitZone.h * 0.5,
          label: "Exit " + interior.name
        };
      }
      if (mission.id === "courier_crash") {
        if (state.missionPhase === 0) return { x: 2460, y: 1460, label: "Meet the courier" };
        if (state.missionPhase === 1) return { x: 2460, y: 1460, label: "Drop the guards" };
        if (state.missionPhase === 2) return { x: 2460, y: 1460, label: "Take the Neon Drive" };
        if (state.missionPhase === 3) return { x: 2240, y: 1680, label: "Get in the coupe" };
        return { x: 430, y: 2000, label: "Drive home" };
      }
      if (mission.id === "skyline_rescue") {
        if (state.missionPhase <= 1) return { x: 1236, y: 886, label: "Climb Archive Tower" };
        if (state.missionPhase === 2) return { x: 1440, y: 420, label: "Shimmy the billboard span" };
        if (state.missionPhase === 3) return { x: 1505, y: 505, roofId: "archive-east", label: "Rescue Byte" };
        return { x: 468, y: 2000, label: "Escort Byte to the van" };
      }
      if (mission.id === "dockside_throwdown") {
        if (state.missionPhase === 0) return { x: 2190, y: 640, label: "Hijack the Signal Van" };
        if (state.missionPhase === 1) return { x: 2320, y: 620, label: "Clear the warehouse" };
        if (state.missionPhase === 2) return { x: 2320, y: 620, label: "Grab the crate" };
        return { x: 2770, y: 860, label: "Throw the crate in" };
      }
      if (state.missionPhase === 0) return { x: 2440, y: 1290, label: "Storm Neon Bowl" };
      return { x: 2440, y: 1290, label: "Defeat Captain Static" };
    }

    function objectiveText() {
      const mission = currentMission();
      if (!mission) return "";
      const interior = currentInterior();
      if (interior) return "Inside " + interior.name + ". Hit E at the roller door to head back outside.";
      if (mission.id === "courier_crash") {
        return [
          "Roll to Neon Market.",
          "Drop the courier guards.",
          "Pick up the Neon Drive.",
          "Get into the highlighted coupe.",
          "Drive the drive back to Hideout Row."
        ][Math.min(state.missionPhase, 4)];
      }
      if (mission.id === "skyline_rescue") {
        return [
          "Reach Archive Tower.",
          "Grab the ladder and climb.",
          "Grab the billboard ceiling route.",
          "Free Byte from the rooftop trap.",
          "Escort Byte to the safehouse van."
        ][Math.min(state.missionPhase, 4)];
      }
      if (mission.id === "dockside_throwdown") {
        return [
          "Enter the Signal Van.",
          "Clear the dock warehouse.",
          "Pick up the cargo crate.",
          "Throw the crate into the drop zone."
        ][Math.min(state.missionPhase, 3)];
      }
      return [
        "Head to Neon Bowl.",
        "Use split decoys and end the boss fight."
      ][Math.min(state.missionPhase, 1)];
    }

    function currentInterior() {
      return state.player && state.player.interiorId ? INTERIORS.find((entry) => entry.id === state.player.interiorId) || null : null;
    }

    function sceneBounds() {
      const interior = currentInterior();
      return interior ? { w: interior.w, h: interior.h } : { w: WORLD_W, h: WORLD_H };
    }

    function dimensionLabel() {
      return state.dimensionMode === "3d"
        ? (state.cameraMode === "first-person" ? "3D First Person" : "3D Third Person")
        : "2D City View";
    }

    function nearBench() {
      if (currentInterior()) return null;
      return BENCHES.find((bench) => Math.abs(state.player.x - bench.x) < 38 && Math.abs(state.player.y - bench.y) < 26);
    }

    function nearSafehouse() {
      if (currentInterior()) return null;
      return SAFEHOUSES.find((safehouse) => distance(state.player.x, state.player.y, safehouse.x, safehouse.y) <= safehouse.radius);
    }

    function nearInteriorDoor() {
      if (currentInterior()) return null;
      return INTERIORS.find((interior) => distance(state.player.x, state.player.y, interior.outsideDoor.x, interior.outsideDoor.y) <= interior.outsideDoor.r);
    }

    function nearInteriorExit() {
      const interior = currentInterior();
      if (!interior) return false;
      return pointInRect(state.player.x, state.player.y, interior.exitZone);
    }

    function distance(ax, ay, bx, by) {
      const dx = ax - bx;
      const dy = ay - by;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function distanceSq(ax, ay, bx, by) {
      const dx = ax - bx;
      const dy = ay - by;
      return dx * dx + dy * dy;
    }

    function pointInRect(x, y, rect) {
      return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    function buildingAtPoint(x, y) {
      if (currentInterior()) return null;
      return BUILDINGS.find((building) => pointInRect(x, y, building));
    }

    function roofById(id) {
      return id ? BUILDINGS.find((building) => building.id === id) || null : null;
    }

    function roofContainsPoint(roof, x, y, inset) {
      if (!roof) return false;
      const pad = Number.isFinite(inset) ? inset : 18;
      return x >= roof.x + pad && x <= roof.x + roof.w - pad && y >= roof.y + pad && y <= roof.y + roof.h - pad;
    }

    function roofAtPoint(x, y, inset) {
      return BUILDINGS.find((building) => roofContainsPoint(building, x, y, inset)) || null;
    }

    function roofHeightUnits(roofOrId) {
      const roof = typeof roofOrId === "string" ? roofById(roofOrId) : roofOrId;
      return roof ? clamp(roof.h * 0.09, 9, 28) : 0;
    }

    function roofHeightPx(roofOrId) {
      return roofHeightUnits(roofOrId) * 16;
    }

    function currentRoofBounds(entity) {
      const target = entity || state.player;
      return target && target.roofId ? roofById(target.roofId) : null;
    }

    function entitySupportRoofId(entity) {
      return entity ? s(entity.roofId || entity.airborneRoofId || "") : "";
    }

    function entityAbsoluteZ(entity) {
      if (!entity) return 0;
      const base = entity.roofId ? roofHeightPx(entity.roofId) : 0;
      return base + Math.max(0, Number(entity.jumpZ) || 0);
    }

    function clearRoofState(entity) {
      if (!entity) return;
      entity.roofId = "";
      entity.airborneRoofId = "";
    }

    function attachEntityToRoof(entity, roofId) {
      if (!entity) return null;
      const roof = roofById(s(roofId || ""));
      entity.roofId = roof ? roof.id : "";
      entity.airborneRoofId = "";
      return roof;
    }

    function detachEntityFromRoof(entity) {
      if (!entity || !entity.roofId) return null;
      const roof = roofById(entity.roofId);
      if (!roof) {
        clearRoofState(entity);
        return null;
      }
      entity.jumpZ = Math.max(0, entity.jumpZ) + roofHeightPx(roof);
      entity.roofId = "";
      entity.airborneRoofId = roof.id;
      return roof;
    }

    function nearestPointOutsideRect(x, y, rect, padding) {
      const pad = Number.isFinite(padding) ? padding : 24;
      const left = clamp(rect.x - pad, 24, WORLD_W - 24);
      const right = clamp(rect.x + rect.w + pad, 24, WORLD_W - 24);
      const top = clamp(rect.y - pad, 24, WORLD_H - 24);
      const bottom = clamp(rect.y + rect.h + pad, 24, WORLD_H - 24);
      const candidates = [
        { x: left, y, dist: Math.abs(x - left) },
        { x: right, y, dist: Math.abs(x - right) },
        { x, y: top, dist: Math.abs(y - top) },
        { x, y: bottom, dist: Math.abs(y - bottom) }
      ];
      let best = candidates[0];
      for (let i = 1; i < candidates.length; i++) {
        if (candidates[i].dist < best.dist) best = candidates[i];
      }
      return { x: best.x, y: best.y };
    }

    function interiorBlocksPoint(interior, x, y) {
      return (interior.colliders || []).some((rect) => pointInRect(x, y, rect));
    }

    function enterInterior(interiorId) {
      const interior = INTERIORS.find((entry) => entry.id === s(interiorId));
      if (!interior || state.player.mode === "vehicle") return false;
      state.player.outdoorX = state.player.x;
      state.player.outdoorY = state.player.y;
      state.player.outdoorRoofId = state.player.roofId;
      state.player.interiorId = interior.id;
      clearRoofState(state.player);
      state.player.x = interior.insideSpawn.x;
      state.player.y = interior.insideSpawn.y;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      state.player.mode = "ground";
      state.player.aimAngle = -Math.PI * 0.5;
      setMessage("Entered " + interior.name, 1.6);
      return true;
    }

    function exitInterior() {
      const interior = currentInterior();
      if (!interior) return false;
      state.player.interiorId = "";
      attachEntityToRoof(state.player, state.player.outdoorRoofId || "");
      state.player.x = Number.isFinite(state.player.outdoorX) ? state.player.outdoorX : interior.outsideDoor.x;
      state.player.y = Number.isFinite(state.player.outdoorY) ? state.player.outdoorY : interior.outsideDoor.y;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      state.player.mode = "ground";
      setMessage("Back outside in " + BRAND.title, 1.6);
      return true;
    }

    function moveWithBuildingCollision(entity, dx, dy) {
      if (entity.mode === "wall" || entity.mode === "ceiling") return;
      const airborne = (Number(entity.jumpZ) || 0) > 0 || (Number(entity.jumpVz) || 0) > 0;
      if (entity.interiorId) {
        const interior = currentInterior();
        if (interior) {
          let nextX = entity.x + dx;
          let nextY = entity.y + dy;
          for (const rect of interior.colliders || []) {
            if (pointInRect(nextX, entity.y, rect)) nextX = entity.x;
            if (pointInRect(entity.x, nextY, rect)) nextY = entity.y;
          }
          entity.x = clamp(nextX, 22, interior.w - 22);
          entity.y = clamp(nextY, 22, interior.h - 22);
          return;
        }
      }
      if (entity.roofId && !airborne) {
        const roof = roofById(entity.roofId);
        if (roof) {
          entity.x = clamp(entity.x + dx, roof.x + 18, roof.x + roof.w - 18);
          entity.y = clamp(entity.y + dy, roof.y + 18, roof.y + roof.h - 18);
          return;
        }
      }
      let nextX = entity.x + dx;
      let nextY = entity.y + dy;
      const absoluteZ = airborne ? entityAbsoluteZ(entity) : 0;
      const roofAirborne = airborne && !!entitySupportRoofId(entity);
      for (const building of BUILDINGS) {
        if (entity.roofId && entity.roofId === building.id) continue;
        if (roofAirborne) continue;
        if (airborne && absoluteZ >= roofHeightPx(building) - 18) continue;
        if (pointInRect(nextX, entity.y, building)) nextX = entity.x;
        if (pointInRect(entity.x, nextY, building)) nextY = entity.y;
      }
      entity.x = clamp(nextX, 24, WORLD_W - 24);
      entity.y = clamp(nextY, 24, WORLD_H - 24);
    }

    function vehicleSamplePoints(vehicle, x, y, angle) {
      const halfW = (vehicle.width || 64) * 0.5;
      const halfH = (vehicle.height || 34) * 0.5;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const locals = [
        { x: -halfW + 10, y: -halfH + 8 },
        { x: halfW - 10, y: -halfH + 8 },
        { x: -halfW + 10, y: halfH - 8 },
        { x: halfW - 10, y: halfH - 8 },
        { x: 0, y: 0 },
        { x: 0, y: -halfH + 8 },
        { x: 0, y: halfH - 8 }
      ];
      return locals.map((local) => ({
        x: x + local.x * cos - local.y * sin,
        y: y + local.x * sin + local.y * cos
      }));
    }

    function vehicleHitsBuilding(vehicle, x, y, angle) {
      const samples = vehicleSamplePoints(vehicle, x, y, angle);
      return BUILDINGS.some((building) => samples.some((sample) => pointInRect(sample.x, sample.y, building)));
    }

    function commitVehicleMotion(vehicle, nextX, nextY, nextAngle) {
      if (vehicleHitsBuilding(vehicle, nextX, nextY, nextAngle)) return false;
      vehicle.x = clamp(nextX, 28, WORLD_W - 28);
      vehicle.y = clamp(nextY, 28, WORLD_H - 28);
      vehicle.angle = nextAngle;
      return true;
    }

    function triggerJump(force, options) {
      const opts = options || {};
      if (state.player.mode !== "ground" || state.player.jumpCooldown > 0 || state.player.jumpZ > 0) return false;
      state.player.jumpVz = force || 310;
      state.player.jumpCooldown = Number.isFinite(opts.cooldown) ? opts.cooldown : 0.28;
      if (Number.isFinite(opts.horizontalVx)) state.player.vx = opts.horizontalVx;
      if (Number.isFinite(opts.horizontalVy)) state.player.vy = opts.horizontalVy;
      triggerPlayerAction(s(opts.action || "jump"), Number.isFinite(opts.duration) ? opts.duration : 0.28);
      return true;
    }

    function roofRunwayDistance(roof, x, y, dirX, dirY) {
      if (!roof) return Infinity;
      let best = Infinity;
      if (dirX > 0.001) best = Math.min(best, (roof.x + roof.w - 18 - x) / dirX);
      if (dirX < -0.001) best = Math.min(best, (roof.x + 18 - x) / dirX);
      if (dirY > 0.001) best = Math.min(best, (roof.y + roof.h - 18 - y) / dirY);
      if (dirY < -0.001) best = Math.min(best, (roof.y + 18 - y) / dirY);
      return Number.isFinite(best) && best >= 0 ? best : Infinity;
    }

    function jumpOffRoof() {
      if (!state.player.roofId || state.player.mode !== "ground" || state.player.jumpZ > 0) return false;
      const roof = roofById(state.player.roofId);
      if (!roof) return false;
      const intent = readPlayerMoveIntent();
      const jumpAngle = intent.moving ? Math.atan2(intent.worldMoveY, intent.worldMoveX) : playerAimAngle();
      const dirX = Math.cos(jumpAngle);
      const dirY = Math.sin(jumpAngle);
      const runway = intent.moving ? roofRunwayDistance(roof, state.player.x, state.player.y, dirX, dirY) : Infinity;
      const edgeLeap = intent.moving && runway < (intent.sprint ? 112 : 74);
      const carriedSpeed = Math.hypot(state.player.vx || 0, state.player.vy || 0);
      const launchSpeed = intent.moving
        ? Math.max(carriedSpeed, state.player.speed * (intent.sprint ? (edgeLeap ? 1.95 : 1.45) : (edgeLeap ? 1.62 : 1.08)))
        : carriedSpeed;
      const launched = triggerJump(edgeLeap ? (intent.sprint ? 455 : 405) : (intent.sprint ? 360 : 336), {
        cooldown: edgeLeap ? 0.42 : 0.3,
        duration: edgeLeap ? 0.34 : 0.26,
        action: edgeLeap ? "dash" : "jump",
        horizontalVx: intent.moving ? dirX * launchSpeed : state.player.vx,
        horizontalVy: intent.moving ? dirY * launchSpeed : state.player.vy
      });
      if (!launched) return false;
      state.player.dir = dirX >= 0 ? 1 : -1;
      if (edgeLeap) synth.play("pickup");
      return true;
    }

    function relocatePlayerToSafehouse(preferredId) {
      const safehouse = SAFEHOUSES.find((entry) => entry.id === s(preferredId || state.lastSafehouseId)) || SAFEHOUSES[0];
      state.lastSafehouseId = safehouse.id;
      state.player.x = safehouse.x;
      state.player.y = safehouse.y;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      state.player.vehicleId = "";
      state.player.mode = "ground";
      clearRoofState(state.player);
      state.player.interiorId = "";
      state.player.outdoorX = safehouse.x;
      state.player.outdoorY = safehouse.y;
    }

    function sanitizeLoadedState() {
      const safehouse = SAFEHOUSES.find((entry) => entry.id === state.lastSafehouseId) || SAFEHOUSES[0];
      state.lastSafehouseId = safehouse.id;
      state.player.vx = 0;
      state.player.vy = 0;
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      state.player.vehicleId = "";
      state.player.mode = "ground";
      state.player.airborneRoofId = "";
      if (state.player.interiorId) {
        const interior = currentInterior();
        if (!interior) {
          state.player.interiorId = "";
          relocatePlayerToSafehouse(safehouse.id);
          return;
        }
        const invalidInteriorPosition =
          !Number.isFinite(state.player.x) ||
          !Number.isFinite(state.player.y) ||
          interiorBlocksPoint(interior, state.player.x, state.player.y);
        state.player.x = clamp(invalidInteriorPosition ? interior.insideSpawn.x : state.player.x, 22, interior.w - 22);
        state.player.y = clamp(invalidInteriorPosition ? interior.insideSpawn.y : state.player.y, 22, interior.h - 22);
        return;
      }
      if (state.player.roofId) {
        const roof = roofById(state.player.roofId);
        if (!roof) {
          clearRoofState(state.player);
        } else {
          state.player.x = clamp(Number.isFinite(state.player.x) ? state.player.x : roof.x + roof.w * 0.5, roof.x + 18, roof.x + roof.w - 18);
          state.player.y = clamp(Number.isFinite(state.player.y) ? state.player.y : roof.y + roof.h * 0.5, roof.y + 18, roof.y + roof.h - 18);
          state.player.outdoorX = state.player.x;
          state.player.outdoorY = state.player.y;
          state.player.outdoorRoofId = roof.id;
          return;
        }
      }
      const invalidPosition =
        !Number.isFinite(state.player.x) ||
        !Number.isFinite(state.player.y) ||
        !!buildingAtPoint(state.player.x, state.player.y);
      if (invalidPosition) relocatePlayerToSafehouse(safehouse.id);
    }

    function finalizeLanding(player, impactSpeed, roof) {
      if (roof) attachEntityToRoof(player, roof.id);
      else clearRoofState(player);
      player.jumpZ = 0;
      player.jumpVz = 0;
      const hardLimit = roof ? 720 : 600;
      if (impactSpeed > hardLimit) {
        screenFx.shake(clamp(impactSpeed * (roof ? 0.009 : 0.012), roof ? 3 : 4, roof ? 10 : 14), roof ? 0.14 : 0.18);
        player.actionOverride = "land";
        player.overrideTimer = Math.max(player.overrideTimer, roof ? 0.38 : 0.55);
        const fallDmg = Math.floor(clamp((impactSpeed - hardLimit) * (roof ? 0.012 : 0.02), 0, roof ? 14 : 25));
        if (fallDmg > 0) {
          player.hp = Math.max(1, player.hp - fallDmg);
          setMessage("Hard landing! -" + fallDmg + " HP", 1.2);
        }
      } else {
        player.actionOverride = "land";
        player.overrideTimer = Math.max(player.overrideTimer, roof ? 0.18 : 0.2);
      }
    }

    function tryRoofLanding(player, previousAbsoluteZ, currentAbsoluteZ) {
      if (player.mode !== "ground" || player.jumpVz > 0 || currentInterior()) return false;
      const roof = roofAtPoint(player.x, player.y, 6);
      if (!roof) return false;
      const roofZ = roofHeightPx(roof);
      if (previousAbsoluteZ < roofZ - 6 || currentAbsoluteZ > roofZ + 14) return false;
      finalizeLanding(player, Math.abs(player.jumpVz), roof);
      return true;
    }

    function updateJumpState(player, dt) {
      player.jumpCooldown = Math.max(0, player.jumpCooldown - dt);
      if (player.jumpZ > 0 || player.jumpVz > 0) {
        const previousAbsoluteZ = entityAbsoluteZ(player);
        player.jumpVz -= 880 * dt;
        player.jumpZ = Math.max(0, player.jumpZ + player.jumpVz * dt);
        const currentAbsoluteZ = entityAbsoluteZ(player);
        if (tryRoofLanding(player, previousAbsoluteZ, currentAbsoluteZ)) return;
        if (currentAbsoluteZ <= 0) {
          const impactSpeed = Math.abs(player.jumpVz);
          const blocker = buildingAtPoint(player.x, player.y);
          if (blocker) {
            const safe = nearestPointOutsideRect(player.x, player.y, blocker, 28);
            player.x = safe.x;
            player.y = safe.y;
          }
          finalizeLanding(player, impactSpeed, null);
        }
      }
    }

    function triggerPlayerAction(name, seconds) {
      if (!state.player) return;
      state.player.actionOverride = s(name);
      state.player.overrideTimer = Math.max(state.player.overrideTimer, seconds || 0.6);
    }

    function activeVehicle() {
      return state.player && state.player.vehicleId ? state.vehicles.find((vehicle) => vehicle.id === state.player.vehicleId) || null : null;
    }

    function worldAnchor() {
      const vehicle = activeVehicle();
      return vehicle ? { x: vehicle.x, y: vehicle.y } : { x: state.player.x, y: state.player.y };
    }

    function findNearestVehicle(range) {
      if (currentInterior()) return null;
      let best = null;
      let bestDist = (range || 86) * (range || 86);
      for (const vehicle of state.vehicles) {
        const dist = distanceSq(state.player.x, state.player.y, vehicle.x, vehicle.y);
        if (dist < bestDist) {
          best = vehicle;
          bestDist = dist;
        }
      }
      return best;
    }

    function findNearbyPickup(range) {
      if (currentInterior()) return null;
      let best = null;
      let bestDist = (range || 46) * (range || 46);
      for (const pickup of state.pickups) {
        const dist = distanceSq(state.player.x, state.player.y, pickup.x, pickup.y);
        if (dist < bestDist) {
          best = pickup;
          bestDist = dist;
        }
      }
      return best;
    }

    function findNearbyNpc(range, predicate) {
      if (currentInterior()) return null;
      let best = null;
      let bestDist = (range || 58) * (range || 58);
      for (const npc of state.npcs) {
        if (npc.hidden) continue;
        if (predicate && !predicate(npc)) continue;
        const dist = distanceSq(state.player.x, state.player.y, npc.x, npc.y);
        if (dist < bestDist) {
          best = npc;
          bestDist = dist;
        }
      }
      return best;
    }

    function findClosestWallRoute() {
      let best = null;
      let bestDist = Infinity;
      for (const route of CLIMB_ROUTES) {
        if (state.player.y < route.y1 - 28 || state.player.y > route.y2 + 28) continue;
        const clampY = clamp(state.player.y, route.y1, route.y2);
        const dx = state.player.x - route.x;
        const dy = state.player.y - clampY;
        if (Math.abs(dx) > 34) continue;
        let dist = dx * dx + dy * dy;
        if (state.player.roofId && state.player.roofId === route.top.roofId) {
          dist *= 0.58;
        }
        if (dist < bestDist) {
          best = route;
          bestDist = dist;
        }
      }
      return best;
    }

    function wallRouteMountDirection(route) {
      if (!route || !state.player) return true;
      if (state.player.roofId && state.player.roofId === route.top.roofId) return false;
      const topDist = Math.hypot(state.player.x - route.top.x, state.player.y - route.top.y);
      const bottomDist = Math.hypot(state.player.x - route.bottom.x, state.player.y - route.bottom.y);
      if (topDist + 10 < bottomDist && topDist < 84) return false;
      return true;
    }

    function exitWallClimb(route, toTop) {
      const player = state.player;
      if (!player || !route) return false;
      player.mode = "ground";
      player.wallRouteId = "";
      player.vx = 0;
      player.vy = 0;
      if (toTop) {
        attachEntityToRoof(player, route.top.roofId);
        player.x = route.top.x;
        player.y = route.top.y;
        player.actionOverride = "pullUp";
        player.overrideTimer = 0.6;
      } else {
        clearRoofState(player);
        player.x = route.bottom.x;
        player.y = route.bottom.y;
        player.actionOverride = "";
        player.overrideTimer = 0;
      }
      return true;
    }

    function findClosestCeilingRoute() {
      return CEILING_ROUTES.find((route) => state.player.roofId && Math.abs(state.player.y - route.y) < 130 && state.player.x >= route.x1 - 24 && state.player.x <= route.x2 + 24) || null;
    }

    function bumpNotoriety(amount) {
      state.notoriety = clamp(state.notoriety + amount, 0, 5);
      state.bestHeat = Math.max(state.bestHeat, state.notoriety);
      state.wantedFlash = 0.6;
    }

    function spendAmmo(weaponId) {
      const weapon = weaponById(weaponId);
      if (weapon.infiniteAmmo) return true;
      const ammo = state.player.ammo[weaponId] || 0;
      const ammoCost = Math.max(1, Number(weapon.ammoCost) || 1);
      if (ammo < ammoCost) {
        setMessage("Out of ammo.", 1.4);
        return false;
      }
      state.player.ammo[weaponId] = Math.max(0, ammo - ammoCost);
      return true;
    }

    function spawnBurst(x, y, color, count, angle) {
      particles.emit(x, y, count || 14, {
        color: color || "#ffffff",
        life: 0.8,
        speedMin: 30,
        speedMax: 220,
        angle: angle,
        spread: angle == null ? Math.PI : 0.7,
        gravity: 50,
        shape: rand(0, 1) > 0.5 ? "circle" : "square"
      });
    }

    function spawnBullet(owner, x, y, angle, weapon, team) {
      state.bullets.push({
        id: "bullet_" + Date.now() + "_" + Math.floor(Math.random() * 9999),
        owner,
        team,
        weaponId: weapon.id,
        x,
        y,
        vx: Math.cos(angle) * weapon.bulletSpeed,
        vy: Math.sin(angle) * weapon.bulletSpeed,
        damage: weapon.damage,
        ttl: Number.isFinite(weapon.ttl) ? weapon.ttl : 0.95,
        radius: Number.isFinite(weapon.radius) ? weapon.radius : 4,
        splashDamage: Number(weapon.splashDamage) || 0,
        splashRadius: Number(weapon.splashRadius) || 0,
        color: weapon.color
      });
      state.bulletsFired += 1;
      synth.play("shoot");
    }

    function damageVehicle(vehicle, amount, impactAngle) {
      if (!vehicle) return false;
      vehicle.hp -= amount;
      spawnBurst(vehicle.x, vehicle.y, "#ffe08a", 10, impactAngle);
      if (vehicle.hp > 0) return false;
      screenFx.shake(8, 0.25);
      screenFx.flash("rgba(255,160,90,0.7)", 0.1);
      synth.play("explosion");
      particles.emit(vehicle.x, vehicle.y, 28, {
        color: "#ff8c61",
        life: 1.1,
        speedMin: 80,
        speedMax: 260,
        gravity: 90,
        shape: "square"
      });
      if (vehicle.occupantId === "player") {
        state.player.vehicleId = "";
        state.player.mode = "ground";
        state.player.invuln = 1.2;
        clearRoofState(state.player);
        state.player.x = clamp(vehicle.x + 38, 24, WORLD_W - 24);
        state.player.y = clamp(vehicle.y + 18, 24, WORLD_H - 24);
        damagePlayer(22);
      }
      givePickup(vehicle.x, vehicle.y, "cash", { amount: 140, label: "Insurance payout" });
      if (vehicle.id === "signal_van") {
        vehicle.hp = vehicle.maxHp;
        vehicle.x = 2190;
        vehicle.y = 640;
        vehicle.speed = 0;
        vehicle.highlight = 1;
      } else {
        state.vehicles = state.vehicles.filter((entry) => entry !== vehicle);
      }
      return true;
    }

    function removeNpc(npc) {
      state.npcs = state.npcs.filter((entry) => entry !== npc);
    }

    function damageNpc(npc, amount, sourceId) {
      if (!npc || npc.hidden) return false;
      npc.hp -= amount;
      npc.alertTimer = 4.6;
      npc.state = npc.kind === "civilian" ? "panic" : "chase";
      spawnBurst(npc.x, npc.y - 16, npc.color, npc.kind === "boss" ? 16 : 10);
      if (sourceId === "player" && npc.kind !== "civilian" && npc.kind !== "ally") bumpNotoriety(0.16);
      if (npc.hp > 0) {
        if (npc.kind === "boss") screenFx.shake(4, 0.12);
        return false;
      }
      npc.hidden = true;
      synth.play("damage");
      particles.emit(npc.x, npc.y, npc.kind === "boss" ? 36 : 20, {
        color: npc.kind === "boss" ? "#ff6bb3" : npc.color,
        life: 1.1,
        speedMin: 40,
        speedMax: 260,
        gravity: 120
      });
      if (npc.kind === "civilian") {
        givePickup(npc.x, npc.y, "cash", { amount: 25, label: "Dropped wallet" });
      } else if (npc.kind === "gang") {
        givePickup(npc.x, npc.y, "cash", { amount: 85, label: "Gang stash" });
        if (Math.random() > 0.5) {
          const dropWeapon = pick(["smg", "beat_blaster", "vinyl", "paint_sprayer"]);
          const dropData = weaponById(dropWeapon);
          givePickup(npc.x, npc.y - 10, "ammo", {
            weaponId: dropWeapon,
            amount: dropWeapon === "vinyl" ? 12 : dropWeapon === "paint_sprayer" ? 48 : 28,
            label: dropData.name + " ammo"
          });
        }
      } else if (npc.kind === "police") {
        givePickup(npc.x, npc.y, "armor", { amount: 18, label: "Armor plate" });
      } else if (npc.kind === "boss") {
        if (!missionComplete("split_decision")) state.completedMissions.push("split_decision");
        state.won = true;
        state.overlay = "victory";
        setMessage("Captain Static is down. The city is yours.", 8);
      }
      return true;
    }

    function damagePlayer(amount) {
      if (!state.player || state.player.invuln > 0 || state.gameOver || state.won) return;
      let remaining = amount;
      if (state.player.armor > 0) {
        const absorbed = Math.min(state.player.armor, remaining * 0.65);
        state.player.armor -= absorbed;
        remaining -= absorbed;
      }
      state.player.hp = Math.max(0, state.player.hp - remaining);
      state.player.invuln = 0.45;
      state.player.actionOverride = "hurt";
      state.player.overrideTimer = 0.42;
      state.wantedFlash = 0.35;
      synth.play("damage");
      screenFx.flash("rgba(255,80,120,0.8)", 0.08);
      if (state.player.hp <= 0) {
        state.gameOver = true;
        state.overlay = "gameOver";
        setMessage(currentPackLabel() + " wiped out. Restart from the last safehouse.", 8);
      }
    }

    function targetForEnemies() {
      const targets = [{ id: "player", x: state.player.x, y: state.player.y, weight: 1.2 }];
      for (const decoy of state.decoys) targets.push({ id: decoy.id, x: decoy.x, y: decoy.y, weight: 1 });
      return targets.sort((a, b) => distanceSq(a.x, a.y, state.player.x, state.player.y) - distanceSq(b.x, b.y, state.player.x, state.player.y))[0];
    }

    function interactPickup(pickup) {
      if (!pickup) return;
      const payload = pickup.payload || {};
      if (pickup.kind === "cash") {
        state.cash += Number(payload.amount) || 40;
        setMessage("Cash +" + (Number(payload.amount) || 40), 1.2);
      } else if (pickup.kind === "ammo") {
        const weaponId = s(payload.weaponId || "smg");
        const weapon = weaponById(weaponId);
        state.player.ammo[weaponId] = Math.min(weapon.ammoMax, (state.player.ammo[weaponId] || 0) + (Number(payload.amount) || 20));
        setMessage(s(payload.label || "Ammo refilled"), 1.2);
      } else if (pickup.kind === "armor") {
        state.player.armor = clamp(state.player.armor + (Number(payload.amount) || 15), 0, 100);
        setMessage(s(payload.label || "Armor up"), 1.2);
      } else if (pickup.kind === "weapon") {
        giveWeapon(s(payload.weaponId || "smg"), Number(payload.amount) || 40);
        setMessage("Picked up " + s(payload.label || payload.weaponId || "gear"), 1.2);
      } else if (pickup.kind === "mission") {
        state.player.carryItem = s(payload.id || "package");
        state.player.carryLabel = s(payload.label || "Package");
        state.player.carryColor = s(payload.color || "#ffffff");
        setMessage("Carrying " + state.player.carryLabel, 1.2);
      }
      particles.emit(pickup.x, pickup.y, 18, {
        color: pickup.kind === "cash" ? "#f6d365" : pickup.kind === "armor" ? "#7dd3fc" : "#ffffff",
        life: 0.6,
        speedMin: 20,
        speedMax: 160,
        gravity: 50
      });
      synth.play("pickup");
      state.pickups = state.pickups.filter((entry) => entry !== pickup);
    }

    function enterVehicle(vehicle) {
      if (!vehicle || vehicle.occupantId || state.player.jumpZ > 6 || currentInterior()) return;
      state.player.vehicleId = vehicle.id;
      state.player.mode = "vehicle";
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      clearRoofState(state.player);
      state.player.aimAngle = normalizeAngle(vehicle.angle);
      state.player.lookPitch = clamp(state.player.lookPitch || 0, -0.65, 0.55);
      vehicle.occupantId = "player";
      vehicle.aiDriver = false;
      vehicle.highlight = 0;
      state.player.x = vehicle.x;
      state.player.y = vehicle.y;
      state.player.enteredVehicleAt = performance.now();
      triggerPlayerAction("run", 0.2);
      setMessage("Driving " + VEHICLE_SPECS[vehicle.model].name, 1.5);
    }

    function exitVehicle() {
      const vehicle = activeVehicle();
      if (!vehicle) return;
      state.player.vehicleId = "";
      state.player.mode = "ground";
      vehicle.occupantId = "";
      vehicle.speed *= 0.45;
      state.player.jumpZ = 0;
      state.player.jumpVz = 0;
      clearRoofState(state.player);
      state.player.x = clamp(vehicle.x + Math.cos(vehicle.angle + Math.PI * 0.5) * 34, 24, WORLD_W - 24);
      state.player.y = clamp(vehicle.y + Math.sin(vehicle.angle + Math.PI * 0.5) * 34, 24, WORLD_H - 24);
      state.player.aimAngle = normalizeAngle(vehicle.angle);
      state.player.lookPitch = clamp(state.player.lookPitch || 0, -1.45, 1.45);
      state.player.dir = Math.cos(vehicle.angle) >= 0 ? 1 : -1;
      triggerPlayerAction("idle", 0.25);
    }

    function throwCarriedItem(force) {
      if (!state.player.carryItem) return false;
      const origin = worldAnchor();
      const dx = state.player.dir || 1;
      givePickup(origin.x + dx * 28, origin.y - 16, "mission", {
        id: state.player.carryItem,
        label: state.player.carryLabel,
        color: state.player.carryColor,
        force: force || 240
      });
      spawnBurst(origin.x, origin.y - 18, state.player.carryColor || "#ffffff", 12, dx > 0 ? 0 : Math.PI);
      state.player.carryItem = "";
      state.player.carryLabel = "";
      state.player.carryColor = "#ffffff";
      triggerPlayerAction("throwCarry", 0.55);
      synth.play("pickup");
      return true;
    }

    function deploySplitDecoys() {
      if (state.player.splitCooldown > 0) return false;
      const origin = worldAnchor();
      for (let i = 0; i < 2; i++) {
        state.decoys.push({
          id: "decoy_" + Date.now() + "_" + i,
          x: clamp(origin.x + (i === 0 ? -42 : 42), 24, WORLD_W - 24),
          y: origin.y - 4,
          vx: i === 0 ? -110 : 110,
          vy: -20,
          ttl: 8,
          dir: i === 0 ? -1 : 1,
          animator: makeAnimator("split")
        });
      }
      state.player.splitCooldown = 12;
      triggerPlayerAction("split", 0.75);
      synth.play("split");
      setMessage(currentPackLabel() + " split into decoys.", 1.2);
      return true;
    }

    function beginWallClimb(route, upward) {
      if (!route) return false;
      state.player.mode = "wall";
      state.player.wallRouteId = route.id;
      state.player.ceilingRouteId = "";
      clearRoofState(state.player);
      state.player.x = route.x;
      state.player.y = upward ? route.bottom.y : route.top.y;
      state.player.aimAngle = normalizeAngle(Number.isFinite(route.faceAngle) ? route.faceAngle : state.player.aimAngle || 0);
      state.player.lookPitch = clamp(
        upward
          ? Math.min(state.player.lookPitch || 0, 0.12)
          : Math.max(state.player.lookPitch || 0, -0.08),
        -0.45,
        0.55
      );
      triggerPlayerAction("wallGrab", 0.25);
      return true;
    }

    function beginCeilingRoute(route) {
      if (!route) return false;
      state.player.mode = "ceiling";
      state.player.ceilingRouteId = route.id;
      state.player.wallRouteId = "";
      clearRoofState(state.player);
      state.player.y = route.y;
      state.player.x = clamp(state.player.x, route.x1, route.x2);
      triggerPlayerAction("ceilingGrab", 0.25);
      return true;
    }

    function tryContextAction(actionName) {
      const action = s(actionName).toLowerCase();
      if (action.includes("split")) return deploySplitDecoys();
      if (action.includes("throw") && state.player.carryItem) return throwCarriedItem(260);
      if (action.includes("withie")) {
        if (!state.player.carryItem) {
          const pickup = findNearbyPickup(44);
          if (pickup && pickup.kind === "mission") interactPickup(pickup);
        }
        triggerPlayerAction(action.includes("run") ? "carryRun" : "carryWalk", 0.8);
        return !!state.player.carryItem;
      }
      if (action.includes("grabwall")) return beginWallClimb(findClosestWallRoute(), true);
      if (action.includes("climbwall")) return beginWallClimb(findClosestWallRoute(), true);
      if (action.includes("grabceiling")) return beginCeilingRoute(findClosestCeilingRoute());
      if (action.includes("climbceiling")) return beginCeilingRoute(findClosestCeilingRoute());
      if (action.includes("sit")) {
        const bench = nearBench();
        if (bench) {
          state.player.x = bench.x;
          state.player.y = bench.y - 10;
          triggerPlayerAction("sit", 1.2);
          state.message = currentPackLabel() + " catches a breather.";
          state.messageTimer = 1.2;
          return true;
        }
      }
      return false;
    }

    function triggerDeckAction(name) {
      if (!runtime || !name) return false;
      const action = runtime.actions[name];
      if (!action) return false;
      tryContextAction(name);
      triggerPlayerAction(name, Math.max(0.45, Math.min(1.6, (action.frames.length || 1) * 0.12)));
      return true;
    }

    function keyDown(code) {
      return !!input.keys[code];
    }

    function keyPressed(code) {
      const now = !!input.keys[code];
      const prev = !!prevKeys[code];
      prevKeys[code] = now;
      return now && !prev;
    }

    function mouseClicked() {
      const now = !!input.mouse.down;
      const clicked = now && !pointerDownLast;
      pointerDownLast = now;
      if (suppressPointerShot && (clicked || !!input.mouse.clicked)) {
        suppressPointerShot = false;
        input.clearClicked();
        return false;
      }
      return clicked || !!input.mouse.clicked;
    }

    function cycleWeapon(direction) {
      const list = state.availableWeapons.slice();
      if (!list.length) return;
      let index = list.indexOf(state.player.currentWeapon);
      if (index < 0) index = 0;
      index = (index + direction + list.length) % list.length;
      state.player.currentWeapon = list[index];
      setMessage("Equipped " + weaponById(state.player.currentWeapon).name, 1.1);
    }

    function setPresentationMode(dimensionMode, cameraMode) {
      const was3d = state.dimensionMode === "3d";
      const nextDimension = s(dimensionMode || state.dimensionMode).toLowerCase() === "3d" ? "3d" : "2d";
      state.dimensionMode = nextDimension;
      state.cameraMode = nextDimension === "3d"
        ? (s(cameraMode || state.cameraMode).toLowerCase() === "first-person" ? "first-person" : "third-person")
        : "topdown";
      if (!was3d && nextDimension === "3d" && state.player) {
        const vehicle = activeVehicle();
        state.player.aimAngle = normalizeAngle(vehicle ? vehicle.angle : state.player.aimAngle || (state.player.dir >= 0 ? 0 : Math.PI));
        state.player.lookPitch = clamp(state.player.lookPitch || 0, -1.45, 1.45);
      }
      if (nextDimension !== "3d") {
        releasePointerLock();
        lookDeltaX = 0;
        lookDeltaY = 0;
        lookYawVelocity = 0;
        lookPitchVelocity = 0;
        dragLookActive = false;
      }
      if (nextDimension === "3d") ensure3DRenderer();
      setMessage(dimensionLabel(), 1.25);
    }

    function toggleDimensionMode() {
      setPresentationMode(state.dimensionMode === "3d" ? "2d" : "3d", state.cameraMode);
    }

    function cycleCameraMode() {
      if (state.dimensionMode !== "3d") {
        setPresentationMode("3d", "third-person");
        return;
      }
      setPresentationMode("3d", state.cameraMode === "third-person" ? "first-person" : "third-person");
    }

    function characterPageCount() {
      return Math.max(1, Math.ceil(Math.max(1, state.availablePacks.length) / PACKS_PER_PAGE));
    }

    function currentCharacterPagePacks() {
      const safePage = clamp(state.characterPage, 0, characterPageCount() - 1);
      const start = safePage * PACKS_PER_PAGE;
      return state.availablePacks.slice(start, start + PACKS_PER_PAGE);
    }

    function openCharacterSelect() {
      syncCharacterCursorToSelected();
      state.characterSelectOpen = true;
      state.characterCards = [];
      setMessage("Choose a shimeji for the city run.", 1.8);
    }

    function closeCharacterSelect() {
      state.characterSelectOpen = false;
      state.characterCards = [];
    }

    function moveCharacterCursor(delta) {
      if (!state.availablePacks.length) return;
      const maxIndex = state.availablePacks.length - 1;
      state.characterCursor = clamp(state.characterCursor + delta, 0, maxIndex);
      state.characterPage = Math.floor(state.characterCursor / PACKS_PER_PAGE);
    }

    function updateCharacterSelectInput() {
      if (keyPressed("Escape") || keyPressed("KeyH")) {
        closeCharacterSelect();
        return;
      }
      if (!state.availablePacks.length || state.packLoadBusy) return;
      if (keyPressed("ArrowLeft") || keyPressed("KeyA")) moveCharacterCursor(-1);
      if (keyPressed("ArrowRight") || keyPressed("KeyD")) moveCharacterCursor(1);
      if (keyPressed("ArrowUp") || keyPressed("KeyW")) moveCharacterCursor(-3);
      if (keyPressed("ArrowDown") || keyPressed("KeyS")) moveCharacterCursor(3);
      if (keyPressed("PageUp") || keyPressed("BracketLeft")) {
        state.characterPage = Math.max(0, state.characterPage - 1);
        state.characterCursor = Math.max(state.characterPage * PACKS_PER_PAGE, 0);
      }
      if (keyPressed("PageDown") || keyPressed("BracketRight")) {
        state.characterPage = Math.min(characterPageCount() - 1, state.characterPage + 1);
        state.characterCursor = Math.min(state.availablePacks.length - 1, state.characterPage * PACKS_PER_PAGE);
      }
      const digits = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6"];
      const pagePacks = currentCharacterPagePacks();
      for (let i = 0; i < digits.length; i++) {
        if (keyPressed(digits[i]) && pagePacks[i]) {
          state.characterCursor = state.characterPage * PACKS_PER_PAGE + i;
          void selectPack(pagePacks[i].packId, { silent: false });
          return;
        }
      }
      if (keyPressed("Enter") || keyPressed("Space")) {
        const selected = state.availablePacks[state.characterCursor];
        if (selected) void selectPack(selected.packId, { silent: false });
        return;
      }
      if (mouseClicked()) {
        const hit = state.characterCards.find((card) => pointInRect(input.mouse.x, input.mouse.y, card.rect));
        if (hit) {
          state.characterCursor = hit.index;
          state.characterPage = Math.floor(hit.index / PACKS_PER_PAGE);
          void selectPack(hit.packId, { silent: false });
        }
      }
    }

    function update3DLook(dt) {
      if (state.dimensionMode !== "3d" || !state.player) {
        lookDeltaX = 0;
        lookDeltaY = 0;
        lookYawVelocity = 0;
        lookPitchVelocity = 0;
        return;
      }
      const safeDt = Math.max(1 / 240, Math.min(1 / 20, Number(dt) || 1 / 60));
      const movedX = lookDeltaX;
      const movedY = lookDeltaY;
      lookDeltaX = 0;
      lookDeltaY = 0;
      const yawScale = pointerLocked() ? 0.0034 : 0.005;
      const pitchScale = pointerLocked() ? 0.0032 : 0.0044;
      const yawImpulse = Math.abs(movedX) > 0.01 ? movedX * yawScale : 0;
      const pitchImpulse = Math.abs(movedY) > 0.01 ? -movedY * pitchScale : 0;
      const hasLookInput = !!(yawImpulse || pitchImpulse);
      if (!hasLookInput) {
        const decay = Math.exp(-safeDt * (pointerLocked() ? 18 : 14));
        lookYawVelocity *= decay;
        lookPitchVelocity *= decay;
        if (Math.abs(lookYawVelocity) < 0.0004) lookYawVelocity = 0;
        if (Math.abs(lookPitchVelocity) < 0.0004) lookPitchVelocity = 0;
        return;
      }
      const blend = smoothStepForRate(safeDt, pointerLocked() ? 46 : 34);
      lookYawVelocity = lerp(lookYawVelocity, yawImpulse / safeDt, blend);
      lookPitchVelocity = lerp(lookPitchVelocity, pitchImpulse / safeDt, blend);
      const yawStep = lerp(yawImpulse, lookYawVelocity * safeDt, 0.42);
      const pitchStep = lerp(pitchImpulse, lookPitchVelocity * safeDt, 0.42);
      state.player.aimAngle = normalizeAngle((Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : 0) + yawStep);
      state.player.lookPitch = clamp((state.player.lookPitch || 0) + pitchStep, -1.45, 1.45);
    }

    function playerAimAngle() {
      if (state.dimensionMode === "3d") {
        return Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : (state.player.dir >= 0 ? 0 : Math.PI);
      }
      const anchor = worldAnchor();
      const worldX = camera.x + input.mouse.x;
      const worldY = camera.y + input.mouse.y;
      if (Math.abs(worldX - anchor.x) > 6 || Math.abs(worldY - anchor.y) > 6) {
        return Math.atan2(worldY - anchor.y, worldX - anchor.x);
      }
      return Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : (state.player.dir >= 0 ? 0 : Math.PI);
    }

    function firePlayerWeapon() {
      if (state.player.fireCooldown > 0 || state.player.mode === "wall" || state.player.mode === "ceiling") return false;
      const weapon = currentWeapon();
      if (!spendAmmo(weapon.id)) return false;
      const anchor = worldAnchor();
      const firstPerson = state.dimensionMode === "3d" && state.cameraMode === "first-person";
      const forwardOffset = firstPerson ? (state.player.mode === "vehicle" ? 30 : 26) : 22;
      const sideOffset = firstPerson ? (state.player.mode === "vehicle" ? 16 : 10) : 0;
      const baseAngle = playerAimAngle();
      const shotCount = Math.max(1, Number(weapon.pellets) || Number(weapon.burstCount) || 1);
      const burstSpread = Number.isFinite(weapon.burstSpread) ? weapon.burstSpread : weapon.spread;
      let primaryAngle = null;
      state.player.dir = Math.cos(baseAngle) >= 0 ? 1 : -1;
      state.player.lastShotAt = state.totalPlaySeconds;
      state.player.shotKick = Math.max(state.player.shotKick || 0, Number(weapon.kick) || 0.95);
      for (let i = 0; i < shotCount; i++) {
        const angle =
          baseAngle
          + rand(-weapon.spread, weapon.spread)
          + (shotCount > 1 ? (i - (shotCount - 1) * 0.5) * burstSpread : 0);
        const rightAngle = angle + Math.PI * 0.5;
        if (primaryAngle == null) primaryAngle = angle;
        spawnBullet(
          "player",
          anchor.x + Math.cos(angle) * forwardOffset + Math.cos(rightAngle) * sideOffset,
          anchor.y - 22 + Math.sin(angle) * 8 + Math.sin(rightAngle) * sideOffset,
          angle,
          weapon,
          "player"
        );
      }
      state.player.aimAngle = normalizeAngle(primaryAngle == null ? baseAngle : primaryAngle);
      state.player.fireCooldown = weapon.cooldown;
      screenFx.shake(weapon.id === "launcher" || weapon.id === "dubstep_cannon" ? 6 : weapon.id === "vinyl" ? 4 : 2, 0.05);
      return true;
    }

    function useInteract() {
      if (state.player.interactCooldown > 0) return false;
      if (state.player.mode === "wall") {
        const route = CLIMB_ROUTES.find((entry) => entry.id === state.player.wallRouteId);
        if (!route) return false;
        if (state.player.y <= route.y1 + 26) {
          exitWallClimb(route, true);
          setMessage("Pulled up from " + route.label + ".", 1.2);
        } else if (state.player.y >= route.y2 - 26) {
          exitWallClimb(route, false);
          setMessage("Stepped off " + route.label + ".", 1.2);
        } else {
          setMessage("Climb to the top or bottom to step off the ladder.", 1.2);
        }
        state.player.interactCooldown = 0.22;
        return true;
      }
      if (currentInterior()) {
        if (nearInteriorExit()) {
          exitInterior();
          state.player.interactCooldown = 0.3;
          return true;
        }
        return false;
      }
      if (state.player.mode === "vehicle") {
        exitVehicle();
        state.player.interactCooldown = 0.35;
        return true;
      }
      const vehicle = findNearestVehicle(58);
      if (vehicle && !vehicle.occupantId) {
        enterVehicle(vehicle);
        state.player.interactCooldown = 0.3;
        return true;
      }
      const safehouse = nearSafehouse();
      if (safehouse) {
        state.lastSafehouseId = safehouse.id;
        state.player.hp = 100;
        state.player.armor = clamp(state.player.armor + 20, 0, 100);
        saveGame();
        setMessage("Saved at " + safehouse.name, 1.4);
        state.player.interactCooldown = 0.4;
        return true;
      }
      const bench = nearBench();
      if (bench) {
        state.player.x = bench.x;
        state.player.y = bench.y - 10;
        triggerPlayerAction("sit", 1.6);
        state.player.hp = clamp(state.player.hp + 8, 0, 100);
        state.player.stamina = 100;
        state.player.interactCooldown = 0.5;
        return true;
      }
      const interior = nearInteriorDoor();
      if (interior) {
        enterInterior(interior.id);
        state.player.interactCooldown = 0.35;
        return true;
      }
      const pickup = findNearbyPickup(42);
      if (pickup) {
        interactPickup(pickup);
        state.player.interactCooldown = 0.25;
        return true;
      }
      const ally = findNearbyNpc(40, (npc) => npc.id === "byte" && !npc.hidden);
      if (ally && currentMission().id === "skyline_rescue" && state.missionPhase >= 3) {
        ally.state = "follow";
        ally.missionTag = "skyline_rescue";
        clearRoofState(ally);
        state.rescuedByte = true;
        state.missionPhase = 4;
        setMessage("Byte is with you. Get back to the van.", 2.2);
        state.player.interactCooldown = 0.35;
        return true;
      }
      const route = findClosestWallRoute();
      if (route) {
        const upward = wallRouteMountDirection(route);
        beginWallClimb(route, upward);
        setMessage((upward ? "Climbing up " : "Climbing down ") + route.label + ".", 1.4);
        state.player.interactCooldown = 0.25;
        return true;
      }
      const ceilingRoute = findClosestCeilingRoute();
      if (ceilingRoute) {
        beginCeilingRoute(ceilingRoute);
        state.player.interactCooldown = 0.25;
        return true;
      }
      return false;
    }

    function readPlayerMoveIntent() {
      const player = state.player;
      const is3d = state.dimensionMode === "3d";
      const moveX = (keyDown("KeyD") || keyDown("ArrowRight") ? 1 : 0) - (keyDown("KeyA") || keyDown("ArrowLeft") ? 1 : 0);
      const moveY = (keyDown("KeyS") || keyDown("ArrowDown") ? 1 : 0) - (keyDown("KeyW") || keyDown("ArrowUp") ? 1 : 0);
      const forwardInput = (keyDown("KeyW") || keyDown("ArrowUp") ? 1 : 0) - (keyDown("KeyS") || keyDown("ArrowDown") ? 1 : 0);
      const yaw = Number.isFinite(player.aimAngle) ? player.aimAngle : (player.dir >= 0 ? 0 : Math.PI);
      const worldMoveX = is3d ? (Math.cos(yaw) * forwardInput + Math.cos(yaw + Math.PI * 0.5) * moveX) : moveX;
      const worldMoveY = is3d ? (Math.sin(yaw) * forwardInput + Math.sin(yaw + Math.PI * 0.5) * moveX) : moveY;
      const logicalMoveX = is3d ? worldMoveX : moveX;
      const logicalMoveY = is3d ? worldMoveY : moveY;
      const moving = Math.abs(logicalMoveX) > 0.001 || Math.abs(logicalMoveY) > 0.001;
      const sprint = (keyDown("ShiftLeft") || keyDown("ShiftRight")) && player.stamina > 6;
      const mul = sprint ? player.sprintMul : 1;
      const len = Math.hypot(logicalMoveX, logicalMoveY) || 1;
      return {
        is3d,
        moveX,
        moveY,
        worldMoveX,
        worldMoveY,
        logicalMoveX,
        logicalMoveY,
        moving,
        sprint,
        targetX: moving ? (logicalMoveX / len) * player.speed * mul : 0,
        targetY: moving ? (logicalMoveY / len) * player.speed * mul : 0
      };
    }

    function updateRoofTraversalAfterMove(player) {
      if (!player || !(player.jumpZ > 0 || player.jumpVz > 0) || !player.roofId) return;
      const roof = currentRoofBounds(player);
      if (!roof) {
        clearRoofState(player);
        return;
      }
      if (roofContainsPoint(roof, player.x, player.y, 8)) return;
      detachEntityFromRoof(player);
      player.actionOverride = player.jumpVz >= 0 ? "jump" : "fall";
      player.overrideTimer = Math.max(player.overrideTimer, 0.12);
    }

    function updatePlayerGround(dt) {
      const player = state.player;
      const intent = readPlayerMoveIntent();
      const is3d = intent.is3d;
      const yaw = Number.isFinite(player.aimAngle) ? player.aimAngle : (player.dir >= 0 ? 0 : Math.PI);
      const moving = intent.moving;
      const sprint = intent.sprint;
      const airControl = player.jumpZ > 0 ? 0.58 : 1;
      const responseRate = moving
        ? (sprint ? 14.5 : 12.5)
        : (player.jumpZ > 0 ? 5.5 : 18);
      const moveBlend = smoothStepForRate(dt, responseRate);
      player.vx = lerp(player.vx, intent.targetX * airControl, moveBlend);
      player.vy = lerp(player.vy, intent.targetY * airControl, moveBlend);
      moveWithBuildingCollision(player, player.vx * dt, player.vy * dt);
      updateRoofTraversalAfterMove(player);
      if (moving && !is3d) {
        player.aimAngle = Math.atan2(intent.moveY, intent.moveX);
        player.dir = Math.cos(player.aimAngle) >= 0 ? 1 : -1;
      } else if (is3d) {
        player.aimAngle = playerAimAngle();
        player.dir = Math.cos(player.aimAngle) >= 0 ? 1 : -1;
      } else if (Math.abs(player.vx) > 4) {
        player.dir = player.vx >= 0 ? 1 : -1;
      }
      if (!is3d) {
        player.lookPitch = lerp(player.lookPitch, clamp((input.mouse.y - H * 0.5) / (H * 0.5), -0.85, 0.85), Math.min(1, dt * 6));
      }
      player.stamina = sprint && moving ? Math.max(0, player.stamina - dt * 16) : Math.min(100, player.stamina + dt * 12);
      if (player.jumpZ > 0) {
        player.actionOverride = player.jumpVz >= 0 ? "jump" : "fall";
        player.overrideTimer = Math.max(player.overrideTimer, 0.08);
      } else if (player.carryItem && moving) {
        player.actionOverride = sprint ? "carryRun" : "carryWalk";
        player.overrideTimer = Math.max(player.overrideTimer, 0.12);
      } else if (moving) {
        player.actionOverride = sprint ? "run" : "walk";
        player.overrideTimer = Math.max(player.overrideTimer, 0.1);
      }
    }

    function updatePlayerWall(dt) {
      const player = state.player;
      const route = CLIMB_ROUTES.find((entry) => entry.id === player.wallRouteId);
      if (!route) {
        player.mode = "ground";
        return;
      }
      const moveY = (keyDown("KeyS") || keyDown("ArrowDown") ? 1 : 0) - (keyDown("KeyW") || keyDown("ArrowUp") ? 1 : 0);
      if (moveY !== 0) {
        player.y = clamp(player.y + moveY * 150 * dt, route.y1, route.y2);
        player.actionOverride = "wallClimb";
        player.overrideTimer = Math.max(player.overrideTimer, 0.08);
      } else {
        player.actionOverride = "wallGrab";
        player.overrideTimer = Math.max(player.overrideTimer, 0.08);
      }
      player.x = route.x;
      player.dir = 1;
      player.aimAngle = normalizeAngle(Number.isFinite(route.faceAngle) ? route.faceAngle : player.aimAngle || 0);
      player.lookPitch = lerp(player.lookPitch || 0, moveY < 0 ? -0.2 : 0.14, Math.min(1, dt * 6));
      if (player.y <= route.y1 + 4) {
        exitWallClimb(route, true);
      } else if (player.y >= route.y2 - 4 && (moveY > 0 || keyPressed("Space") || keyPressed("KeyE"))) {
        exitWallClimb(route, false);
      }
    }

    function updatePlayerCeiling(dt) {
      const player = state.player;
      const route = CEILING_ROUTES.find((entry) => entry.id === player.ceilingRouteId);
      if (!route) {
        player.mode = "ground";
        return;
      }
      const moveX = (keyDown("KeyD") || keyDown("ArrowRight") ? 1 : 0) - (keyDown("KeyA") || keyDown("ArrowLeft") ? 1 : 0);
      if (moveX !== 0) {
        player.x = clamp(player.x + moveX * 165 * dt, route.x1, route.x2);
        player.dir = moveX >= 0 ? 1 : -1;
        player.actionOverride = "ceilingClimb";
        player.overrideTimer = Math.max(player.overrideTimer, 0.08);
      } else {
        player.actionOverride = "ceilingGrab";
        player.overrideTimer = Math.max(player.overrideTimer, 0.08);
      }
      player.y = route.y;
      if (player.x >= route.x2 - 3) {
        player.mode = "ground";
        player.ceilingRouteId = "";
        attachEntityToRoof(player, route.land.roofId);
        player.x = route.land.x;
        player.y = route.land.y;
        player.actionOverride = "land";
        player.overrideTimer = 0.35;
      } else if (keyPressed("Space") || keyPressed("KeyE")) {
        player.mode = "ground";
        player.ceilingRouteId = "";
        player.y += 70;
        player.actionOverride = "fall";
        player.overrideTimer = 0.42;
      }
    }

    function updatePlayerVehicle(dt) {
      const vehicle = activeVehicle();
      if (!vehicle) {
        state.player.mode = "ground";
        return;
      }
      const spec = VEHICLE_SPECS[vehicle.model];
      const accel = (keyDown("KeyW") || keyDown("ArrowUp") ? 1 : 0) - (keyDown("KeyS") || keyDown("ArrowDown") ? 1 : 0);
      const steer = (keyDown("KeyD") || keyDown("ArrowRight") ? 1 : 0) - (keyDown("KeyA") || keyDown("ArrowLeft") ? 1 : 0);
      vehicle.speed = clamp(vehicle.speed + accel * spec.accel * dt, -spec.maxSpeed * 0.45, spec.maxSpeed);
      vehicle.speed = lerp(vehicle.speed, 0, dt * (accel ? 0.4 : 1.4));
      const nextAngle = vehicle.angle + steer * spec.turn * dt * clamp(Math.abs(vehicle.speed) / 140, 0.25, 1);
      const nextX = vehicle.x + Math.cos(nextAngle) * vehicle.speed * dt;
      const nextY = vehicle.y + Math.sin(nextAngle) * vehicle.speed * dt;
      if (!commitVehicleMotion(vehicle, nextX, nextY, nextAngle)) {
        vehicle.speed *= -0.18;
        damageVehicle(vehicle, 10, vehicle.angle + Math.PI);
      }
      state.player.x = vehicle.x;
      state.player.y = vehicle.y;
      if (state.dimensionMode === "3d" && state.cameraMode === "first-person") {
        const currentAim = Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : vehicle.angle;
        const idleLookSeconds = state.totalPlaySeconds - (lastLookInputAt || 0);
        const followStrength = idleLookSeconds > 0.75
          ? smoothStepForRate(dt, 1.25) * clamp(Math.abs(vehicle.speed || 0) / Math.max(1, spec.maxSpeed), 0.18, 0.85)
          : 0;
        const followedAim = normalizeAngle(currentAim + shortestAngleDelta(currentAim, vehicle.angle) * followStrength);
        state.player.aimAngle = normalizeAngle(clampAngleAround(vehicle.angle, followedAim, 1.48));
        state.player.lookPitch = clamp(state.player.lookPitch, -0.85, 0.65);
      } else {
        const currentAim = Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : vehicle.angle;
        state.player.aimAngle = normalizeAngle(currentAim + shortestAngleDelta(currentAim, vehicle.angle) * Math.min(1, dt * 8));
        state.player.lookPitch = lerp(state.player.lookPitch || 0, 0, Math.min(1, dt * 6));
      }
      state.player.dir = Math.cos(state.player.aimAngle) >= 0 ? 1 : -1;
      if (Math.abs(vehicle.speed) > 40) triggerPlayerAction("dash", 0.08);
      if (Math.abs(vehicle.speed) > 220) synth.play("drive");
    }

    function updatePlayer(dt) {
      if (!state.player) return;
      if (state.dimensionMode === "3d") update3DLook(dt);
      state.player.fireCooldown = Math.max(0, state.player.fireCooldown - dt);
      state.player.interactCooldown = Math.max(0, state.player.interactCooldown - dt);
      state.player.splitCooldown = Math.max(0, state.player.splitCooldown - dt);
      state.player.invuln = Math.max(0, state.player.invuln - dt);
      state.player.overrideTimer = Math.max(0, state.player.overrideTimer - dt);
      state.player.shotKick = Math.max(0, (state.player.shotKick || 0) - dt * 5.8);
      updateJumpState(state.player, dt);

      if (keyPressed("KeyQ")) state.actionDeckOpen = !state.actionDeckOpen;
      if (keyPressed("Tab")) state.mapOpen = !state.mapOpen;
      if (keyPressed("Escape")) state.paused = !state.paused;
      if (keyPressed("KeyC")) cycleWeapon(1);
      if (keyPressed("KeyJ")) setFirstPersonRigStyle(state.firstPersonRigStyle === "mesh" ? "sprite" : "mesh");
      if (keyPressed("KeyX")) deploySplitDecoys();
      if (keyPressed("KeyB")) toggleDimensionMode();
      if (keyPressed("KeyN")) cycleCameraMode();
      if (keyPressed("F1")) setPresentationMode("2d", "topdown");
      if (keyPressed("F2")) setPresentationMode("3d", "third-person");
      if (keyPressed("F3")) setPresentationMode("3d", "first-person");
      if (keyPressed("Space") && state.player.mode === "ground") {
        if (state.player.roofId) jumpOffRoof();
        else triggerJump();
      }
      if (keyPressed("KeyV") && nearSafehouse()) saveGame();
      if (keyPressed("BracketLeft")) state.actionPage = Math.max(0, state.actionPage - 1);
      if (keyPressed("BracketRight") && runtime) state.actionPage = Math.min(Math.ceil(runtime.actionNames.length / ACTIONS_PER_PAGE) - 1, state.actionPage + 1);

      if (state.actionDeckOpen && runtime) {
        const digits = ["Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0"];
        for (let i = 0; i < digits.length; i++) {
          if (keyPressed(digits[i])) {
            const actionName = runtime.actionNames[state.actionPage * ACTIONS_PER_PAGE + i];
            if (actionName) triggerDeckAction(actionName);
          }
        }
      }

      if (keyPressed("KeyE")) useInteract();
      if (keyPressed("KeyG")) throwCarriedItem(240);
      if (mouseClicked() || keyPressed("KeyF")) firePlayerWeapon();

      if (state.player.mode === "ground") updatePlayerGround(dt);
      else if (state.player.mode === "wall") updatePlayerWall(dt);
      else if (state.player.mode === "ceiling") updatePlayerCeiling(dt);
      else if (state.player.mode === "vehicle") updatePlayerVehicle(dt);
    }

    function updateNpcMovementToNode(npc, speed, dt) {
      const node = ROAD_NODES[npc.targetNode] || ROAD_NODES[0];
      const dx = node.x - npc.x;
      const dy = node.y - npc.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 12) {
        npc.prevNode = npc.targetNode;
        npc.targetNode = nextGraphNode(npc.targetNode, npc.prevNode);
        return;
      }
      npc.vx = (dx / (dist || 1)) * speed;
      npc.vy = (dy / (dist || 1)) * speed;
      moveWithBuildingCollision(npc, npc.vx * dt, npc.vy * dt);
      if (Math.abs(npc.vx) > 1) npc.dir = npc.vx >= 0 ? 1 : -1;
    }

    function fireNpcWeapon(npc, targetX, targetY) {
      if (npc.fireCooldown > 0) return;
      const weapon = npc.kind === "boss" ? WEAPONS[2] : npc.kind === "police" ? WEAPONS[1] : WEAPONS[0];
      const angle = Math.atan2(targetY - npc.y, targetX - npc.x) + rand(-weapon.spread * 1.3, weapon.spread * 1.3);
      spawnBullet(npc.id, npc.x + Math.cos(angle) * 18, npc.y - 18 + Math.sin(angle) * 6, angle, weapon, "enemy");
      npc.fireCooldown = npc.kind === "boss" ? 0.24 : weapon.cooldown + rand(0.05, 0.28);
    }

    function updateNpc(dt, npc) {
      if (npc.hidden) return;
      npc.aiTimer -= dt;
      npc.fireCooldown = Math.max(0, npc.fireCooldown - dt);
      npc.alertTimer = Math.max(0, npc.alertTimer - dt);
      npc.benchTimer -= dt;
      npc.sitTimer = Math.max(0, npc.sitTimer - dt);
      const bait = targetForEnemies();
      const playerDist = distance(state.player.x, state.player.y, npc.x, npc.y);

      if (npc.kind === "ally") {
        if (npc.state === "captured") {
          npc.action = "drag";
          return;
        }
        const targetX = state.player.mode === "vehicle" ? state.player.x - 40 : state.player.x - state.player.dir * 34;
        const targetY = state.player.y + 18;
        const dx = targetX - npc.x;
        const dy = targetY - npc.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 18) {
          npc.vx = (dx / dist) * 150;
          npc.vy = (dy / dist) * 150;
          moveWithBuildingCollision(npc, npc.vx * dt, npc.vy * dt);
          npc.dir = npc.vx >= 0 ? 1 : -1;
          npc.action = "run";
        } else {
          npc.action = "idle";
        }
        return;
      }

      if (npc.kind === "civilian") {
        if (playerDist < 120 && state.notoriety > 0.5) {
          npc.state = "panic";
          npc.alertTimer = 2.8;
        } else if (npc.alertTimer <= 0 && npc.state === "panic") {
          npc.state = "roam";
        }
        if (npc.state === "panic") {
          const dx = npc.x - state.player.x;
          const dy = npc.y - state.player.y;
          const dist = Math.hypot(dx, dy) || 1;
          npc.vx = (dx / dist) * 160;
          npc.vy = (dy / dist) * 160;
          moveWithBuildingCollision(npc, npc.vx * dt, npc.vy * dt);
          npc.dir = npc.vx >= 0 ? 1 : -1;
          npc.action = "run";
          return;
        }
        if (npc.sitTimer > 0) {
          npc.action = "sit";
          return;
        }
        if (npc.benchTimer <= 0) {
          const bench = BENCHES[randInt(0, BENCHES.length - 1)];
          npc.x = bench.x;
          npc.y = bench.y - 8;
          npc.sitTimer = rand(2.5, 5.5);
          npc.benchTimer = rand(8, 14);
          npc.action = "sit";
          return;
        }
        updateNpcMovementToNode(npc, 70, dt);
        npc.action = "walk";
        return;
      }

      if (npc.kind === "gang" || npc.kind === "police" || npc.kind === "boss") {
        const targetDist = distance(bait.x, bait.y, npc.x, npc.y);
        const engageRange = npc.kind === "boss" ? 320 : npc.kind === "police" ? 260 : 220;
        if (npc.alertTimer > 0 || targetDist < engageRange || currentMission().id === "split_decision") {
          npc.state = "chase";
        } else if (npc.state !== "guard") {
          npc.state = "guard";
        }
        if (npc.state === "chase") {
          const dx = bait.x - npc.x;
          const dy = bait.y - npc.y;
          const dist = Math.hypot(dx, dy) || 1;
          const keepAway = npc.kind === "boss" ? 170 : npc.kind === "police" ? 150 : 130;
          if (dist > keepAway) {
            npc.vx = (dx / dist) * (npc.kind === "boss" ? 118 : 102);
            npc.vy = (dy / dist) * (npc.kind === "boss" ? 118 : 102);
            moveWithBuildingCollision(npc, npc.vx * dt, npc.vy * dt);
            npc.dir = npc.vx >= 0 ? 1 : -1;
            npc.action = npc.kind === "boss" ? "dash" : "run";
          } else {
            npc.vx *= 0.8;
            npc.vy *= 0.8;
            npc.action = "idle";
            fireNpcWeapon(npc, bait.x, bait.y);
          }
        } else {
          npc.vx *= 0.7;
          npc.vy *= 0.7;
          npc.action = "idle";
        }
      }
    }

    function updateVehicles(dt) {
      for (const vehicle of state.vehicles) {
        if (vehicle.occupantId === "player") continue;
        const spec = VEHICLE_SPECS[vehicle.model];
        if (vehicle.model === "cruiser" && state.notoriety > 0.5) {
          const dx = state.player.x - vehicle.x;
          const dy = state.player.y - vehicle.y;
          const targetAngle = Math.atan2(dy, dx);
          const da = Math.atan2(Math.sin(targetAngle - vehicle.angle), Math.cos(targetAngle - vehicle.angle));
          const nextAngle = vehicle.angle + clamp(da, -spec.turn * dt, spec.turn * dt);
          vehicle.speed = clamp(lerp(vehicle.speed, spec.maxSpeed * 0.82, dt), 0, spec.maxSpeed);
          const nextX = vehicle.x + Math.cos(nextAngle) * vehicle.speed * dt;
          const nextY = vehicle.y + Math.sin(nextAngle) * vehicle.speed * dt;
          if (!commitVehicleMotion(vehicle, nextX, nextY, nextAngle)) {
            vehicle.speed *= -0.12;
            vehicle.targetNode = nearestNodeIndex(vehicle.x, vehicle.y);
          }
          if (distance(vehicle.x, vehicle.y, state.player.x, state.player.y) < 70) damagePlayer(9 * dt * 8);
        } else if (vehicle.aiDriver) {
          const node = ROAD_NODES[vehicle.targetNode] || ROAD_NODES[0];
          const dx = node.x - vehicle.x;
          const dy = node.y - vehicle.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 18) {
            vehicle.prevNode = vehicle.targetNode;
            vehicle.targetNode = nextGraphNode(vehicle.targetNode, vehicle.prevNode);
          } else {
            const targetAngle = Math.atan2(dy, dx);
            const da = Math.atan2(Math.sin(targetAngle - vehicle.angle), Math.cos(targetAngle - vehicle.angle));
            const nextAngle = vehicle.angle + clamp(da, -spec.turn * dt, spec.turn * dt);
            vehicle.speed = lerp(vehicle.speed, spec.maxSpeed * 0.58, dt * 1.4);
            const nextX = vehicle.x + Math.cos(nextAngle) * vehicle.speed * dt;
            const nextY = vehicle.y + Math.sin(nextAngle) * vehicle.speed * dt;
            if (!commitVehicleMotion(vehicle, nextX, nextY, nextAngle)) {
              vehicle.speed *= 0.35;
              vehicle.targetNode = nextGraphNode(vehicle.targetNode, vehicle.prevNode);
            }
          }
        }
        vehicle.highlight = Math.max(0, vehicle.highlight - dt * 0.35);
      }
    }

    function updateBullets(dt) {
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const bullet = state.bullets[i];
        bullet.ttl -= dt;
        if (bullet.ttl <= 0) {
          state.bullets.splice(i, 1);
          continue;
        }
        bullet.x += bullet.vx * dt;
        bullet.y += bullet.vy * dt;
        if (bullet.x < 0 || bullet.y < 0 || bullet.x > WORLD_W || bullet.y > WORLD_H) {
          state.bullets.splice(i, 1);
          continue;
        }
        let hit = false;
        for (const building of BUILDINGS) {
          if (pointInRect(bullet.x, bullet.y, building)) {
            hit = true;
            break;
          }
        }
        if (hit) {
          spawnBurst(bullet.x, bullet.y, bullet.color, 6);
          state.bullets.splice(i, 1);
          continue;
        }
        if (bullet.team === "player") {
          for (const npc of state.npcs) {
            if (npc.hidden || npc.kind === "ally") continue;
            if (distanceSq(bullet.x, bullet.y, npc.x, npc.y - 18) <= (npc.kind === "boss" ? 34 : 24) * (npc.kind === "boss" ? 34 : 24)) {
              if (damageNpc(npc, bullet.damage, "player") && npc.id === "captain_static") state.missionPhase = 1;
              hit = true;
              break;
            }
          }
          if (!hit) {
            for (const vehicle of state.vehicles) {
              if (distanceSq(bullet.x, bullet.y, vehicle.x, vehicle.y) <= 28 * 28) {
                damageVehicle(vehicle, bullet.damage, Math.atan2(bullet.vy, bullet.vx));
                hit = true;
                break;
              }
            }
          }
        } else if (distanceSq(bullet.x, bullet.y, state.player.x, state.player.y - 18) <= 20 * 20) {
          damagePlayer(bullet.damage);
          hit = true;
        } else {
          for (let j = 0; j < state.decoys.length; j++) {
            const decoy = state.decoys[j];
            if (distanceSq(bullet.x, bullet.y, decoy.x, decoy.y - 18) <= 22 * 22) {
              decoy.ttl = Math.min(decoy.ttl, 0.25);
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          const splashRadius = Number(bullet.splashRadius) || 0;
          const splashDamage = Number(bullet.splashDamage) || 0;
          spawnBurst(bullet.x, bullet.y, bullet.color, splashRadius > 0 ? 18 : 8);
          if (splashRadius > 0 && splashDamage > 0) {
            for (const npc of state.npcs) {
              if (!npc.hidden && distanceSq(bullet.x, bullet.y, npc.x, npc.y) < splashRadius * splashRadius) damageNpc(npc, splashDamage, "player");
            }
            for (const vehicle of state.vehicles) {
              if (distanceSq(bullet.x, bullet.y, vehicle.x, vehicle.y) < splashRadius * splashRadius) {
                damageVehicle(vehicle, Math.max(6, splashDamage * 0.65), Math.atan2(bullet.vy, bullet.vx));
              }
            }
          }
          state.bullets.splice(i, 1);
        }
      }
    }

    function updatePickupsAndDecoys(dt) {
      for (let i = state.pickups.length - 1; i >= 0; i--) {
        const pickup = state.pickups[i];
        pickup.bob += dt * 2;
        if (pickup.payload && pickup.payload.id === "cargo_crate") {
          const zone = state.deliveryZones[0];
          if (zone && distance(pickup.x, pickup.y, zone.x, zone.y) <= zone.r) {
            state.pickups.splice(i, 1);
            state.worldFlags.cargoDelivered = true;
            spawnBurst(zone.x, zone.y, zone.color, 22);
            setMessage("Cargo delivered.", 1.6);
          }
        }
      }
      for (let i = state.decoys.length - 1; i >= 0; i--) {
        const decoy = state.decoys[i];
        decoy.ttl -= dt;
        if (decoy.ttl <= 0) {
          state.decoys.splice(i, 1);
          continue;
        }
        decoy.x = clamp(decoy.x + decoy.vx * dt, 24, WORLD_W - 24);
        decoy.y = clamp(decoy.y + decoy.vy * dt, 24, WORLD_H - 24);
        decoy.vx = lerp(decoy.vx, 0, dt * 1.6);
        decoy.vy = lerp(decoy.vy, 0, dt * 2.5);
      }
    }

    function spawnPoliceIfNeeded() {
      const policeCount = state.npcs.filter((npc) => !npc.hidden && npc.kind === "police").length + state.vehicles.filter((vehicle) => vehicle.model === "cruiser").length;
      if (state.notoriety < 1 || policeCount >= Math.ceil(state.notoriety)) return;
      const spawnNode = ROAD_NODES[(nearestNodeIndex(state.player.x, state.player.y) + 6) % ROAD_NODES.length];
      state.npcs.push(createNpc("police_" + Date.now(), "police", spawnNode.x + 30, spawnNode.y + 18, { state: "chase", animator: makeAnimator("run") }));
      state.vehicles.push(createVehicle("cruiser_" + Date.now(), "cruiser", spawnNode.x, spawnNode.y, 0, { aiDriver: true, highlight: 1 }));
      setMessage("Metro heat is climbing.", 1.8);
    }

    function missionEnemiesAlive(tag) {
      return state.npcs.some((npc) => !npc.hidden && npc.missionTag === tag && npc.kind !== "ally" && npc.kind !== "civilian");
    }

    function resolveMissionProgress() {
      const mission = currentMission();
      if (!mission) return;
      if (mission.id === "courier_crash") {
        if (state.missionPhase === 0 && distance(state.player.x, state.player.y, 2460, 1460) < 140) {
          state.missionPhase = 1;
          setMessage("Courier spotted. Drop the guards.", 2.2);
        } else if (state.missionPhase === 1 && !missionEnemiesAlive("courier_crash")) {
          state.missionPhase = 2;
          if (!state.pickups.some((pickup) => pickup.payload && pickup.payload.id === "neon_drive")) {
            givePickup(2460, 1460, "mission", { id: "neon_drive", label: "Neon Drive", color: "#6ee7ff", missionTag: "courier_crash" });
          }
          setMessage("Grab the Neon Drive.", 2.2);
        } else if (state.missionPhase === 2 && state.player.carryItem === "neon_drive") {
          state.missionPhase = 3;
          const getaway = state.vehicles.find((vehicle) => vehicle.id === "getaway");
          if (getaway) getaway.highlight = 2.2;
          setMessage("Get in the highlighted coupe.", 2.2);
        } else if (state.missionPhase === 3 && state.player.vehicleId === "getaway") {
          state.missionPhase = 4;
          setMessage("Drive the drive back to Hideout Row.", 2.2);
        } else if (state.missionPhase === 4 && distance(state.player.x, state.player.y, 430, 2000) < 124) {
          state.player.carryItem = "";
          state.player.carryLabel = "";
          state.player.carryColor = "#ffffff";
          if (!missionComplete("courier_crash")) state.completedMissions.push("courier_crash");
          giveWeapon("smg", 120);
          giveWeapon("beat_blaster", 90);
          state.cash += 450;
          initializeMission(1, false);
        }
        return;
      }
      if (mission.id === "skyline_rescue") {
        if (state.missionPhase === 0 && distance(state.player.x, state.player.y, 1236, 886) < 90) {
          state.missionPhase = 1;
          setMessage("Grab the ladder and climb.", 2.2);
        } else if (state.missionPhase === 1 && state.player.roofId === "archive-tower") {
          state.missionPhase = 2;
          setMessage("Grab the billboard ceiling route.", 2.2);
        } else if (state.missionPhase === 2 && state.player.roofId === "archive-east") {
          state.missionPhase = 3;
          setMessage("Free Byte from the rooftop trap.", 2.2);
        } else if (state.missionPhase === 4) {
          const byte = state.npcs.find((npc) => npc.id === "byte");
          if (byte && distance(byte.x, byte.y, 468, 2000) < 92) {
            byte.hidden = true;
          if (!missionComplete("skyline_rescue")) state.completedMissions.push("skyline_rescue");
          state.cash += 650;
          state.player.armor = 100;
          giveWeapon("launcher", 10);
          giveWeapon("vinyl", 26);
          initializeMission(2, false);
        }
        }
        return;
      }
      if (mission.id === "dockside_throwdown") {
        if (state.missionPhase === 0 && state.player.vehicleId === "signal_van") {
          state.missionPhase = 1;
          setMessage("Drive in and clear the warehouse.", 2.2);
        } else if (state.missionPhase === 1 && !missionEnemiesAlive("dockside_throwdown")) {
          state.missionPhase = 2;
          if (!state.pickups.some((pickup) => pickup.payload && pickup.payload.id === "cargo_crate")) {
            givePickup(2320, 620, "mission", { id: "cargo_crate", label: "Cargo Crate", color: "#2dd4bf", missionTag: "dockside_throwdown" });
          }
          setMessage("Pick up the crate.", 2.2);
        } else if (state.missionPhase === 2 && state.player.carryItem === "cargo_crate") {
          state.missionPhase = 3;
          state.deliveryZones = [{ id: "dock-drop", x: 2770, y: 860, r: 76, color: "#2dd4bf" }];
          setMessage("Throw the crate into the drop zone.", 2.2);
        } else if (state.missionPhase === 3 && state.worldFlags.cargoDelivered) {
          if (!missionComplete("dockside_throwdown")) state.completedMissions.push("dockside_throwdown");
          state.cash += 800;
          giveWeapon("dubstep_cannon", 10);
          giveWeapon("mic_lancer", 22);
          initializeMission(3, false);
        }
        return;
      }
      if (mission.id === "split_decision") {
        if (state.missionPhase === 0 && distance(state.player.x, state.player.y, 2440, 1290) < 180) {
          state.missionPhase = 1;
          setMessage("Split your swarm and drop Captain Static.", 2.2);
        }
      }
    }

    function softRespawn() {
      const safehouse = SAFEHOUSES.find((entry) => entry.id === state.lastSafehouseId) || SAFEHOUSES[0];
      for (const vehicle of state.vehicles) {
        if (vehicle.occupantId === "player") vehicle.occupantId = "";
      }
      state.player.x = safehouse.x;
      state.player.y = safehouse.y;
      state.player.outdoorX = safehouse.x;
      state.player.outdoorY = safehouse.y;
      state.player.vehicleId = "";
      state.player.mode = "ground";
      state.player.interiorId = "";
      clearRoofState(state.player);
      state.player.hp = 100;
      state.player.armor = 40;
      state.player.invuln = 1.2;
      state.notoriety = 0;
      state.gameOver = false;
      state.overlay = "";
      initializeMission(state.activeMission, true);
      setMessage(currentPackLabel() + " patched up and back in.", 2.4);
    }

    function syncActorAnimator(actor, desiredAction, dt, facing, speedScale) {
      if (!runtime) return;
      if (!actor.animator) actor.animator = makeAnimator(desiredAction || "idle");
      const resolved = runtime.resolveAlias(desiredAction || "idle");
      if (resolved && actor.animator.action !== resolved) {
        actor.animator.setAction(desiredAction || "idle", { loop: true, speedScale: speedScale || 1 });
      } else {
        actor.animator.speedScale = Math.max(0.35, speedScale || 1);
      }
      actor.animator.facing = facing || 1;
      actor.animator.update(dt);
    }

    function updateAllAnimators(dt) {
      if (!runtime) return;
      const playerAction =
        state.player.overrideTimer > 0 ? state.player.actionOverride || "idle" :
        state.player.mode === "wall" ? "wallGrab" :
        state.player.mode === "ceiling" ? "ceilingGrab" :
        state.player.mode === "vehicle" ? "dash" :
        state.player.jumpZ > 2 ? (state.player.jumpVz >= 0 ? "jump" : "fall") :
        state.player.carryItem && (Math.abs(state.player.vx) > 8 || Math.abs(state.player.vy) > 8) ? "carryWalk" :
        Math.abs(state.player.vx) > 120 || Math.abs(state.player.vy) > 120 ? "run" :
        Math.abs(state.player.vx) > 18 || Math.abs(state.player.vy) > 18 ? "walk" :
        "idle";
      syncActorAnimator(state.player, playerAction, dt, state.player.dir, state.player.mode === "vehicle" ? 1.25 : 1);
      for (const npc of state.npcs) {
        if (!npc.hidden) syncActorAnimator(npc, npc.action || "idle", dt, npc.dir, npc.action === "run" || npc.action === "dash" ? 1.15 : 1);
      }
      for (const decoy of state.decoys) syncActorAnimator(decoy, "split", dt, decoy.dir, 1);
    }

    function updateCamera(dt) {
      const anchor = worldAnchor();
      const bounds = sceneBounds();
      const maxX = Math.max(0, bounds.w - W);
      const maxY = Math.max(0, bounds.h - H);
      const targetX = clamp(anchor.x - W * 0.5, 0, maxX);
      const targetY = clamp(anchor.y - H * 0.58, 0, maxY);
      camera.x = lerp(camera.x, targetX, Math.min(1, dt * 5));
      camera.y = lerp(camera.y, targetY, Math.min(1, dt * 5));
    }

    function update(dt) {
      state.titlePulse += dt;
      state.totalPlaySeconds += dt;
      state.markerPulse += dt * 2;
      state.dropZonePulse += dt * 2.6;
      state.rainPhase += dt * 0.6;
      state.messageTimer = Math.max(0, state.messageTimer - dt);
      state.saveToast = Math.max(0, state.saveToast - dt);
      state.hintTimer = Math.max(0, state.hintTimer - dt);
      state.wantedFlash = Math.max(0, state.wantedFlash - dt);
      screenFx.update(dt);

      if (keyPressed("KeyH")) {
        if (state.characterSelectOpen) closeCharacterSelect();
        else openCharacterSelect();
      }
      if (state.characterSelectOpen) {
        updateCharacterSelectInput();
        updateCamera(dt);
        updateAllAnimators(dt);
        input.clearClicked();
        return;
      }

      if (state.mode === "title") {
        if (keyPressed("Enter") || mouseClicked()) {
          state.mode = "playing";
          setMessage(currentPackLabel() + " is live. Move out.", 2.2);
        }
        updateCamera(dt);
        updateAllAnimators(dt);
        input.clearClicked();
        return;
      }

      if (state.gameOver) {
        if (keyPressed("Enter")) softRespawn();
        updateCamera(dt);
        updateAllAnimators(dt);
        input.clearClicked();
        return;
      }

      if (state.won) {
        if (keyPressed("Enter")) {
          seedWorld();
          state.mode = "title";
          state.won = false;
          state.overlay = "";
        }
        updateCamera(dt);
        updateAllAnimators(dt);
        input.clearClicked();
        return;
      }

      if (state.paused) {
        updateCamera(dt);
        updateAllAnimators(dt);
        input.clearClicked();
        return;
      }

      updatePlayer(dt);
      updateVehicles(dt);
      for (const npc of state.npcs) updateNpc(dt, npc);
      updateBullets(dt);
      updatePickupsAndDecoys(dt);
      updateAllAnimators(dt);
      resolveMissionProgress();

      state.notoriety = clamp(lerp(state.notoriety, 0, dt * 0.03), 0, 5);
      ambientTimer += dt;
      trafficTimer += dt;
      policeSirenTimer += dt;
      if (ambientTimer >= 7) {
        ambientTimer = 0;
        if (Math.random() > 0.55) {
          const weaponId = pick(["smg", "launcher", "beat_blaster", "vinyl", "mic_lancer", "paint_sprayer"]);
          const node = ROAD_NODES[randInt(0, ROAD_NODES.length - 1)];
          givePickup(node.x, node.y, "ammo", {
            weaponId,
            amount: weaponId === "launcher" || weaponId === "dubstep_cannon" ? 4 : weaponId === "vinyl" ? 10 : weaponId === "mic_lancer" ? 8 : weaponId === "paint_sprayer" ? 44 : 24,
            label: weaponById(weaponId).name + " ammo"
          });
        }
      }
      if (trafficTimer >= 10) {
        trafficTimer = 0;
        const baseNode = ROAD_NODES[randInt(0, ROAD_NODES.length - 1)];
        state.vehicles.push(createVehicle("traffic_" + Date.now(), pick(["coupe", "van", "streetfire", "midnight", "muscle", "pickup"]), baseNode.x, baseNode.y, 0));
        const keepTrafficIds = new Set(
          state.vehicles
            .filter((vehicle) => /^traffic_/.test(vehicle.id))
            .filter((vehicle) => vehicle.occupantId === "player" || !vehicle.tag)
            .slice(-10)
            .map((vehicle) => vehicle.id)
        );
        state.vehicles = state.vehicles.filter((vehicle) => !/^traffic_/.test(vehicle.id) || keepTrafficIds.has(vehicle.id) || vehicle.occupantId === "player");
      }
      if (state.notoriety >= 1 && policeSirenTimer >= 5.5) {
        policeSirenTimer = 0;
        synth.play("siren");
        spawnPoliceIfNeeded();
      }

      updateCamera(dt);
      input.clearClicked();
    }

    function renderBackdrop() {
      const interior = currentInterior();
      if (interior) {
        const bg = ctx.createLinearGradient(0, 0, 0, H);
        bg.addColorStop(0, "#050911");
        bg.addColorStop(0.5, interior.wall);
        bg.addColorStop(1, "#04070d");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        const haze = ctx.createRadialGradient(W * 0.5, H * 0.24, 24, W * 0.5, H * 0.24, 260);
        haze.addColorStop(0, rgba(interior.accent, 0.28));
        haze.addColorStop(0.28, rgba(interior.accent, 0.12));
        haze.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = haze;
        ctx.fillRect(0, 0, W, H);
        return;
      }
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#02040b");
      bg.addColorStop(0.24, "#0b1430");
      bg.addColorStop(0.64, "#101a34");
      bg.addColorStop(1, "#040813");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const haze = ctx.createRadialGradient(W * 0.78, H * 0.16, 20, W * 0.78, H * 0.16, 260);
      haze.addColorStop(0, "rgba(137, 200, 255, 0.26)");
      haze.addColorStop(0.28, "rgba(111, 150, 255, 0.14)");
      haze.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, W, H);

      for (let layer = 0; layer < 4; layer++) {
        const baseY = 140 + layer * 44;
        ctx.fillStyle = layer === 0 ? "rgba(8, 16, 34, 0.94)" : layer === 1 ? "rgba(10, 18, 38, 0.72)" : "rgba(13, 22, 43, 0.58)";
        for (let i = 0; i < 10; i++) {
          const width = 64 + ((i * 37 + layer * 19) % 120);
          const height = 54 + ((i * 53 + layer * 23) % 120);
          const x = -20 + i * 118 + layer * 18;
          const y = baseY - height;
          Draw.roundRect(ctx, x, y, width, height + 18, 10, ctx.fillStyle);
          if (layer < 2) {
            ctx.fillStyle = "rgba(121, 178, 255, 0.05)";
            for (let wy = y + 18; wy < baseY - 12; wy += 12) {
              for (let wx = x + 10; wx < x + width - 10; wx += 18) {
                ctx.fillRect(wx, wy, 6, 3);
              }
            }
            ctx.fillStyle = layer === 0 ? "rgba(8, 16, 34, 0.94)" : "rgba(10, 18, 38, 0.72)";
          }
        }
      }

      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let i = 0; i < 28; i++) {
        const x = (i * 71 + 28) % W;
        const y = 24 + ((i * 47) % 110);
        ctx.beginPath();
        ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 30; i++) {
        const x = (i * 97 + (state.rainPhase * 120)) % W;
        const y = (i * 61 + state.rainPhase * 180) % H;
        ctx.fillStyle = "rgba(120,180,255,0.12)";
        ctx.fillRect(x, y, 2, 16);
      }
    }

    function renderInteriorScene(interior) {
      ctx.save();
      screenFx.applyShake(ctx);
      ctx.translate(-camera.x, -camera.y);

      Draw.roundRect(ctx, 24, 24, interior.w - 48, interior.h - 48, 22, interior.floor);
      Draw.roundRect(ctx, 42, 42, interior.w - 84, interior.h - 84, 18, rgba(interior.accent, 0.1));
      ctx.strokeStyle = rgba(interior.accent, 0.24);
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, interior.w - 80, interior.h - 80);

      for (const rect of interior.colliders || []) {
        Draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 14, interior.prop);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.fillRect(rect.x + 10, rect.y + 8, rect.w - 20, 4);
      }

      Draw.roundRect(ctx, interior.exitZone.x, interior.exitZone.y, interior.exitZone.w, interior.exitZone.h, 8, "rgba(255,255,255,0.12)");
      ctx.fillStyle = "#eef6ff";
      ctx.font = "700 11px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText("ROLL UP", interior.exitZone.x + interior.exitZone.w * 0.5, interior.exitZone.y - 10);

      const marker = objectiveMarker();
      if (marker) {
        ctx.strokeStyle = interior.accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 18 + Math.sin(state.markerPulse * 2) * 2, 0, Math.PI * 2);
        ctx.stroke();
      }

      const drawActor = (actor, height, glow) => {
        const jumpLift = actor.jumpZ || 0;
        if (runtime && actor.animator) {
          runtime.drawActor(ctx, actor.animator, actor.x, actor.y - jumpLift, {
            height,
            facing: -(actor.dir || 1),
            glow,
            shadowScale: 1 - Math.min(0.55, jumpLift / 120)
          });
        }
      };

      const actors = []
        .concat(state.decoys.map((actor) => ({ type: "decoy", actor })))
        .concat(state.player ? [{ type: "player", actor: state.player }] : [])
        .sort((a, b) => a.actor.y - b.actor.y);

      for (const entry of actors) {
        if (entry.type === "player") drawActor(entry.actor, 92, null);
        else drawActor(entry.actor, 86, "rgba(255,120,190,0.6)");
      }

      particles.render(ctx);
      ctx.restore();
    }

    function renderWorld() {
      const interior = currentInterior();
      if (interior) {
        renderInteriorScene(interior);
        return;
      }
      ctx.save();
      screenFx.applyShake(ctx);
      ctx.translate(-camera.x, -camera.y);

      for (const district of DISTRICTS) {
        const grad = ctx.createLinearGradient(district.x, district.y, district.x + district.w, district.y + district.h);
        grad.addColorStop(0, district.base);
        grad.addColorStop(1, "#050814");
        ctx.fillStyle = grad;
        ctx.fillRect(district.x, district.y, district.w, district.h);
        ctx.fillStyle = district.glow;
        ctx.fillRect(district.x, district.y, district.w, district.h);
        ctx.strokeStyle = "rgba(255,255,255,0.04)";
        ctx.strokeRect(district.x, district.y, district.w, district.h);
      }

      ctx.lineWidth = 74;
      ctx.lineCap = "round";
      for (let i = 0; i < ROAD_NODES.length; i++) {
        const neighbors = roadGraph.get(i) || [];
        for (const next of neighbors) {
          if (next <= i) continue;
          ctx.strokeStyle = "rgba(22,27,46,0.95)";
          ctx.beginPath();
          ctx.moveTo(ROAD_NODES[i].x, ROAD_NODES[i].y);
          ctx.lineTo(ROAD_NODES[next].x, ROAD_NODES[next].y);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.lineWidth = 4;
          ctx.setLineDash([18, 18]);
          ctx.beginPath();
          ctx.moveTo(ROAD_NODES[i].x, ROAD_NODES[i].y);
          ctx.lineTo(ROAD_NODES[next].x, ROAD_NODES[next].y);
          ctx.stroke();
          ctx.lineWidth = 74;
          ctx.setLineDash([]);
        }
      }
      for (let i = 0; i < ROAD_NODES.length; i++) {
        const node = ROAD_NODES[i];
        const pool = ctx.createRadialGradient(node.x, node.y, 4, node.x, node.y, 96);
        pool.addColorStop(0, "rgba(255, 216, 124, 0.18)");
        pool.addColorStop(0.45, "rgba(255, 206, 118, 0.08)");
        pool.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = pool;
        ctx.fillRect(node.x - 96, node.y - 96, 192, 192);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fillRect(node.x - 2, node.y - 86, 4, 44);
        ctx.fillStyle = "rgba(255, 240, 184, 0.8)";
        ctx.beginPath();
        ctx.arc(node.x, node.y - 88, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const building of BUILDINGS) {
        const signText = BUILDING_SIGN_TEXT[building.id] || "";
        Draw.roundRect(ctx, building.x + 14, building.y + 22, building.w, building.h, 24, "rgba(2, 6, 18, 0.42)");
        Draw.roundRect(ctx, building.x, building.y, building.w, building.h, 22, building.fill);
        const facadeGlow = ctx.createLinearGradient(building.x, building.y, building.x, building.y + building.h);
        facadeGlow.addColorStop(0, "rgba(255,255,255,0.08)");
        facadeGlow.addColorStop(0.34, "rgba(255,255,255,0.03)");
        facadeGlow.addColorStop(1, "rgba(0,0,0,0.18)");
        ctx.fillStyle = facadeGlow;
        Draw.roundRect(ctx, building.x, building.y, building.w, building.h, 22, facadeGlow);
        ctx.fillStyle = building.roof;
        Draw.roundRect(ctx, building.x + 14, building.y + 14, building.w - 28, 54, 18, building.roof);
        ctx.fillStyle = "rgba(8, 12, 24, 0.6)";
        Draw.roundRect(ctx, building.x + building.w * 0.5 - 24, building.y + building.h - 56, 48, 42, 10, "rgba(8, 12, 24, 0.6)");
        ctx.fillStyle = "rgba(255, 243, 204, 0.18)";
        ctx.fillRect(building.x + building.w * 0.5 - 14, building.y + building.h - 44, 28, 30);
        for (let wy = building.y + 92; wy < building.y + building.h - 34; wy += 34) {
          for (let wx = building.x + 28; wx < building.x + building.w - 32; wx += 42) {
            const lit = ((wx + wy + building.x) / 6 + state.markerPulse * 14) % 7 < 3.4;
            ctx.fillStyle = lit ? "rgba(168, 224, 255, 0.16)" : "rgba(158, 208, 255, 0.05)";
            Draw.roundRect(ctx, wx, wy, 18, 14, 4, ctx.fillStyle);
          }
        }
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(building.x + 26, building.y + 28, building.w - 52, 4);
        for (let unit = 0; unit < 2; unit++) {
          const rx = building.x + 34 + unit * 44;
          const ry = building.y + 18 + (unit % 2) * 16;
          Draw.roundRect(ctx, rx, ry, 26, 18, 5, "rgba(8, 14, 28, 0.55)");
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(rx + 4, ry + 4, 18, 2);
        }
        if (signText) {
          const signW = Math.min(126, 16 + signText.length * 8);
          const signX = building.x + building.w - signW - 24;
          const signY = building.y + 76;
          const signGlow = ctx.createLinearGradient(signX, signY, signX + signW, signY + 20);
          signGlow.addColorStop(0, rgba(currentMission().theme, 0.16));
          signGlow.addColorStop(1, "rgba(0,0,0,0.18)");
          Draw.roundRect(ctx, signX, signY, signW, 22, 8, "rgba(8, 12, 24, 0.75)");
          Draw.roundRect(ctx, signX, signY, signW, 22, 8, signGlow);
          ctx.strokeStyle = rgba(currentMission().theme, 0.52);
          ctx.lineWidth = 1.5;
          Draw.roundRect(ctx, signX, signY, signW, 22, 8, null, rgba(currentMission().theme, 0.52));
          ctx.fillStyle = "#f8fbff";
          ctx.font = "700 11px Segoe UI";
          ctx.textAlign = "center";
          ctx.fillText(signText, signX + signW * 0.5, signY + 15);
        }
      }

      for (const bench of BENCHES) {
        ctx.fillStyle = "#784f2e";
        ctx.fillRect(bench.x - 18, bench.y - 4, bench.w, bench.h);
        ctx.fillStyle = "#463222";
        ctx.fillRect(bench.x - 16, bench.y + 6, 8, 12);
        ctx.fillRect(bench.x + 12, bench.y + 6, 8, 12);
      }

      for (const safehouse of SAFEHOUSES) {
        const decal = ctx.createRadialGradient(safehouse.x, safehouse.y, 12, safehouse.x, safehouse.y, safehouse.radius + 18);
        decal.addColorStop(0, "rgba(0,0,0,0)");
        decal.addColorStop(0.72, "rgba(110,231,255,0.04)");
        decal.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = decal;
        ctx.fillRect(safehouse.x - safehouse.radius - 20, safehouse.y - safehouse.radius - 20, (safehouse.radius + 20) * 2, (safehouse.radius + 20) * 2);
        ctx.strokeStyle = safehouse.id === state.lastSafehouseId ? "rgba(110,231,255,0.4)" : "rgba(110,231,255,0.12)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(safehouse.x, safehouse.y, safehouse.radius + Math.sin(state.markerPulse * 1.3) * 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(safehouse.x, safehouse.y, safehouse.radius - 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      for (const route of CLIMB_ROUTES) {
        const railOffset = route.side === "west" || route.side === "east" ? 8 : 10;
        ctx.strokeStyle = "rgba(224, 196, 255, 0.78)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(route.x - railOffset, route.y1);
        ctx.lineTo(route.x - railOffset, route.y2);
        ctx.moveTo(route.x + railOffset, route.y1);
        ctx.lineTo(route.x + railOffset, route.y2);
        ctx.stroke();
        ctx.strokeStyle = "rgba(192,132,252,0.42)";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(route.x, route.y1 + 10);
        ctx.lineTo(route.x, route.y2 - 10);
        ctx.stroke();
        ctx.strokeStyle = "rgba(250,245,255,0.9)";
        ctx.lineWidth = 3;
        for (let y = route.y1 + 18; y < route.y2 - 10; y += 22) {
          ctx.beginPath();
          ctx.moveTo(route.x - railOffset + 2, y);
          ctx.lineTo(route.x + railOffset - 2, y);
          ctx.stroke();
        }
      }
      for (const route of CEILING_ROUTES) {
        ctx.strokeStyle = "rgba(45,212,191,0.45)";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(route.x1, route.y);
        ctx.lineTo(route.x2, route.y);
        ctx.stroke();
        ctx.fillStyle = "rgba(220,255,249,0.35)";
        for (let x = route.x1; x <= route.x2; x += 28) {
          ctx.fillRect(x - 3, route.y - 8, 6, 16);
        }
      }

      for (const zone of state.deliveryZones) {
        ctx.strokeStyle = zone.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.r + Math.sin(state.dropZonePulse) * 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      const marker = objectiveMarker();
      if (marker) {
        ctx.strokeStyle = currentMission().theme;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(marker.x, marker.y, 20 + Math.sin(state.markerPulse * 2) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(marker.x, marker.y - 34);
        ctx.lineTo(marker.x - 10, marker.y - 14);
        ctx.lineTo(marker.x + 10, marker.y - 14);
        ctx.closePath();
        ctx.fill();
      }

      for (const pickup of state.pickups) {
        const bob = Math.sin(pickup.bob) * 5;
        ctx.fillStyle = pickup.kind === "cash" ? "#f6d365" : pickup.kind === "armor" ? "#7dd3fc" : pickup.kind === "ammo" ? "#fde68a" : (pickup.payload && pickup.payload.color) || "#ffffff";
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y - 12 + bob, pickup.kind === "mission" ? 14 : 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(5,8,20,0.8)";
        ctx.font = "12px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(
          pickup.kind === "mission"
            ? "!"
            : pickup.kind === "weapon"
            ? "+"
            : pickup.kind === "ammo"
            ? "*"
            : "$",
          pickup.x,
          pickup.y - 8 + bob
        );
      }

      for (const vehicle of state.vehicles) {
        const spec = VEHICLE_SPECS[vehicle.model];
        const halfW = spec.width * 0.5;
        const halfH = spec.height * 0.5;
        ctx.save();
        ctx.translate(vehicle.x, vehicle.y);
        ctx.rotate(vehicle.angle);
        ctx.fillStyle = "rgba(2, 7, 18, 0.32)";
        ctx.beginPath();
        ctx.ellipse(0, 10, halfW * 0.92, halfH * 0.82, 0, 0, Math.PI * 2);
        ctx.fill();
        if (vehicle.highlight > 0) {
          ctx.strokeStyle = "rgba(255,255,255,0.78)";
          ctx.lineWidth = 2.5;
          ctx.setLineDash([12, 8]);
          ctx.beginPath();
          ctx.ellipse(0, 8, halfW + 16, halfH + 12, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        for (const wheelX of [-spec.wheelX, spec.wheelX]) {
          for (const wheelY of [-spec.wheelY, spec.wheelY]) {
            Draw.roundRect(ctx, wheelX - 6, wheelY - 4, 12, 8, 4, "#0b1020");
            ctx.fillStyle = "rgba(255,255,255,0.16)";
            ctx.fillRect(wheelX - 2, wheelY - 1, 4, 2);
          }
        }
        const bodyPaint = ctx.createLinearGradient(-halfW, -halfH, halfW, halfH);
        bodyPaint.addColorStop(0, rgba(spec.body, 0.96));
        bodyPaint.addColorStop(0.5, spec.body);
        bodyPaint.addColorStop(1, rgba(spec.body, 0.74));
        Draw.roundRect(ctx, -halfW + 4, -halfH + 3, spec.width - 8, spec.height - 6, 12, bodyPaint);
        if (spec.truckBed) {
          Draw.roundRect(ctx, -halfW + 14, -halfH + 8, spec.width * 0.4, spec.height - 16, 10, spec.accent);
          Draw.roundRect(ctx, -halfW + 14 + spec.width * 0.4 + 8, -halfH + 10, spec.width * 0.28, spec.height - 20, 8, "rgba(255,255,255,0.18)");
        } else {
          const roofWidth = Math.max(18, spec.width * (spec.roofScale || 0.58));
          Draw.roundRect(ctx, -roofWidth * 0.5, -halfH + 8, roofWidth, spec.height - 16, 10, spec.accent);
        }
        if (spec.stripe) Draw.roundRect(ctx, -halfW + 16, -2, spec.width - 32, 4, 4, rgba(spec.stripe, 0.82));
        Draw.roundRect(ctx, -halfW + 12, -halfH + 10, spec.width * 0.22, spec.height - 20, 7, "rgba(255,255,255,0.74)");
        Draw.roundRect(ctx, halfW - 12 - spec.width * 0.22, -halfH + 10, spec.width * 0.22, spec.height - 20, 7, "rgba(255,255,255,0.74)");
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        Draw.roundRect(ctx, -halfW + 14, -halfH + 9, spec.width - 28, 8, 6, "rgba(255,255,255,0.18)");
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        ctx.fillRect(-halfW + 8, -2, spec.width - 16, 3);
        ctx.fillStyle = vehicle.model === "cruiser" && Math.sin(state.markerPulse * 8) > 0 ? "#ef4444" : "rgba(255, 244, 160, 0.9)";
        ctx.fillRect(halfW - 8, -halfH + 9, 5, 8);
        ctx.fillRect(halfW - 8, halfH - 17, 5, 8);
        ctx.fillStyle = "rgba(251, 191, 36, 0.85)";
        ctx.fillRect(-halfW + 3, -halfH + 9, 4, 8);
        ctx.fillRect(-halfW + 3, halfH - 17, 4, 8);
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(-spec.width * 0.08, -halfH + 5, spec.width * 0.16, spec.height - 10);
        if (spec.hoodScoop) {
          Draw.roundRect(ctx, 4, -6, 18, 12, 5, "rgba(12,18,30,0.82)");
          Draw.roundRect(ctx, 6, -4, 14, 8, 4, "rgba(255,255,255,0.12)");
        }
        if (spec.spoiler) {
          Draw.roundRect(ctx, halfW - 16, -halfH + 6, 8, spec.height - 12, 4, "rgba(8,12,24,0.88)");
          Draw.roundRect(ctx, halfW - 10, -halfH + 4, 4, spec.height - 8, 3, rgba(spec.stripe || "#ffffff", 0.8));
        }
        if (vehicle.model === "cruiser") {
          Draw.roundRect(ctx, -12, -halfH + 5, 24, 5, 3, Math.sin(state.markerPulse * 8) > 0 ? "#60a5fa" : "#ef4444");
        }
        ctx.restore();
        if (vehicle.occupantId === "player" && runtime && state.player.animator) {
          runtime.drawActor(ctx, state.player.animator, vehicle.x, vehicle.y + 4, {
            height: 54,
            facing: -(Math.cos(vehicle.angle) >= 0 ? 1 : -1),
            shadow: false,
            offsetY: -8
          });
        }
      }

      const drawActor = (actor, height, glow) => {
        const jumpLift = actor.jumpZ || 0;
        if (runtime && actor.animator) {
          runtime.drawActor(ctx, actor.animator, actor.x, actor.y - jumpLift, {
            height,
            facing: -(actor.dir || 1),
            glow,
            shadowScale: 1 - Math.min(0.55, jumpLift / 120)
          });
        } else {
          ctx.fillStyle = glow || "#ffffff";
          ctx.beginPath();
          ctx.arc(actor.x, actor.y - 18 - jumpLift, 16, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const sortedActors = []
        .concat(state.decoys.map((actor) => ({ type: "decoy", actor })))
        .concat(state.npcs.filter((npc) => !npc.hidden).map((actor) => ({ type: "npc", actor })))
        .concat(state.player ? [{ type: "player", actor: state.player }] : [])
        .sort((a, b) => a.actor.y - b.actor.y);

      for (const entry of sortedActors) {
        if (entry.type === "player" && state.player.mode === "vehicle") continue;
        if (entry.type === "player") drawActor(entry.actor, 92, null);
        else if (entry.type === "decoy") drawActor(entry.actor, 86, "rgba(255,120,190,0.6)");
        else drawActor(entry.actor, entry.actor.kind === "boss" ? 98 : 84, entry.actor.kind === "ally" ? "#8dfbd1" : entry.actor.kind === "boss" ? "#ff5aa9" : null);
      }

      for (const bullet of state.bullets) {
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      particles.render(ctx);
      ctx.restore();
    }

    function renderHud() {
      const interior = currentInterior();
      const panelGrad = ctx.createLinearGradient(14, 14, 14, 118);
      panelGrad.addColorStop(0, "rgba(8, 13, 26, 0.94)");
      panelGrad.addColorStop(1, "rgba(4, 7, 16, 0.82)");
      Draw.roundRect(ctx, 14, 14, 286, 126, 16, panelGrad);
      ctx.fillStyle = rgba(currentPackAccent(), 0.9);
      ctx.fillRect(26, 26, 74, 3);
      ctx.fillStyle = "#e5f2ff";
      ctx.font = "700 18px Segoe UI";
      ctx.textAlign = "left";
      ctx.fillText(BRAND.title, 26, 38);
      ctx.font = "12px Segoe UI";
      ctx.fillStyle = "#9ab1d8";
      ctx.fillText(currentPackLabel() + "  |  " + dimensionLabel(), 26, 56);
      ctx.fillText((interior ? interior.name : currentMission().title) + "  |  " + objectiveText(), 26, 74);

      const hpW = 140;
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      Draw.roundRect(ctx, 26, 82, hpW, 10, 5, "rgba(255,255,255,0.12)");
      Draw.roundRect(ctx, 26, 82, hpW * (state.player.hp / 100), 10, 5, "#f87171");
      Draw.roundRect(ctx, 26, 98, hpW * (state.player.armor / 100), 10, 5, "#60a5fa");
      Draw.roundRect(ctx, 26, 114, hpW * (state.player.stamina / 100), 10, 5, "#34d399");

      ctx.fillStyle = "#ffffff";
      ctx.fillText("HP", 174, 91);
      ctx.fillText("Armor", 174, 107);
      ctx.fillText("Stamina", 174, 123);

      const weaponGrad = ctx.createLinearGradient(W - 258, 14, W - 258, 126);
      weaponGrad.addColorStop(0, "rgba(8, 13, 26, 0.94)");
      weaponGrad.addColorStop(1, "rgba(4, 7, 16, 0.82)");
      Draw.roundRect(ctx, W - 258, 14, 244, 128, 16, weaponGrad);
      ctx.fillStyle = rgba(currentMission().theme, 0.9);
      ctx.fillRect(W - 240, 26, 58, 3);
      ctx.fillStyle = "#fff";
      ctx.font = "700 16px Segoe UI";
      ctx.fillText("$" + Math.floor(state.cash), W - 240, 38);
      ctx.font = "12px Segoe UI";
      ctx.fillStyle = "#9ab1d8";
      ctx.fillText("Weapon: " + currentWeapon().name, W - 240, 58);
      ctx.fillText("Ammo: " + (currentWeapon().infiniteAmmo ? "INF" : (state.player.ammo[state.player.currentWeapon] || 0)), W - 240, 76);
      ctx.fillText("Heat: " + state.notoriety.toFixed(1) + " / 5", W - 240, 94);
      ctx.fillText("Split: " + (state.player.splitCooldown > 0 ? state.player.splitCooldown.toFixed(1) + "s" : "READY"), W - 240, 112);
      ctx.fillText("Hands: " + firstPersonRigStyleLabel(), W - 240, 130);

      if (state.player.carryItem) {
        Draw.roundRect(ctx, 318, 14, 210, 44, 14, "rgba(11, 18, 36, 0.85)");
        ctx.fillStyle = state.player.carryColor;
        ctx.font = "700 14px Segoe UI";
        ctx.fillText("Carrying: " + state.player.carryLabel, 332, 42);
      }

      if (state.messageTimer > 0 && state.message) {
        const msgGrad = ctx.createLinearGradient(220, H - 76, 220, H - 30);
        msgGrad.addColorStop(0, "rgba(10, 15, 28, 0.92)");
        msgGrad.addColorStop(1, "rgba(6, 9, 20, 0.86)");
        Draw.roundRect(ctx, 220, H - 76, 520, 46, 14, msgGrad);
        ctx.fillStyle = rgba(currentMission().theme, 0.95);
        ctx.fillRect(250, H - 68, 96, 2);
        ctx.fillStyle = "#eef6ff";
        ctx.font = "14px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(state.message, W * 0.5, H - 48);
      }

      if (state.saveToast > 0) {
        ctx.fillStyle = "rgba(125, 211, 252, 0.92)";
        ctx.font = "12px Segoe UI";
        ctx.textAlign = "right";
        ctx.fillText("Saved", W - 18, H - 16);
      }

      if (state.hintTimer > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.font = "12px Segoe UI";
        ctx.textAlign = "left";
        ctx.fillText(
          state.dimensionMode === "3d"
            ? "WASD move  mouse look  click capture  E mount/step off ladder  W/S climb  F/click shoot  B 2D/3D  N camera  J hands  C switch  X split  H shimeji"
            : "WASD move  E mount/step off ladder  W/S climb  F/click shoot  B 2D/3D  N camera  J hands  C switch  X split  Q deck  Tab map  H shimeji",
          18,
          H - 18
        );
      }

      const district = interior ? { name: interior.name } : DISTRICTS.find((entry) => pointInRect(state.player.x, state.player.y, entry));
      if (district) {
        ctx.fillStyle = "rgba(255,255,255,0.88)";
        ctx.font = "700 13px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(district.name, W * 0.5, 28);
      }

      if (state.wantedFlash > 0.01) {
        ctx.fillStyle = "rgba(255, 80, 120, " + (state.wantedFlash * 0.22) + ")";
        ctx.fillRect(0, 0, W, H);
      }

      if (state.dimensionMode === "3d") {
        if (state.cameraMode === "first-person" && state.player.mode === "wall") {
          const ladderTop = H * 0.18;
          const ladderBottom = H * 0.82;
          const ladderLeft = W * 0.5 - 42;
          const ladderRight = W * 0.5 + 42;
          ctx.save();
          ctx.strokeStyle = "rgba(224,196,255,0.78)";
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.moveTo(ladderLeft, ladderTop);
          ctx.lineTo(ladderLeft, ladderBottom);
          ctx.moveTo(ladderRight, ladderTop);
          ctx.lineTo(ladderRight, ladderBottom);
          ctx.stroke();
          ctx.strokeStyle = "rgba(255,245,255,0.92)";
          ctx.lineWidth = 3;
          for (let y = ladderTop + 20; y < ladderBottom - 12; y += 28) {
            ctx.beginPath();
            ctx.moveTo(ladderLeft + 8, y);
            ctx.lineTo(ladderRight - 8, y);
            ctx.stroke();
          }
          const glow = ctx.createRadialGradient(W * 0.5, H * 0.5, 20, W * 0.5, H * 0.5, 180);
          glow.addColorStop(0, "rgba(192,132,252,0.18)");
          glow.addColorStop(1, "rgba(192,132,252,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(W * 0.5 - 180, H * 0.5 - 180, 360, 360);
          ctx.restore();
        }
        const spread = 12 + (state.player.shotKick || 0) * 16 + (state.player.mode === "vehicle" ? 4 : 0);
        const cx = W * 0.5;
        const cy = H * 0.5 + (state.player.lookPitch || 0) * 36;
        const shotPulse = Math.max(0, 1 - (state.totalPlaySeconds - (state.player.lastShotAt || -99)) / 0.22);
        ctx.strokeStyle = "rgba(240,248,255,0.88)";
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx - spread, cy);
        ctx.lineTo(cx - 5, cy);
        ctx.moveTo(cx + 5, cy);
        ctx.lineTo(cx + spread, cy);
        ctx.moveTo(cx, cy - spread);
        ctx.lineTo(cx, cy - 5);
        ctx.moveTo(cx, cy + 5);
        ctx.lineTo(cx, cy + spread);
        ctx.stroke();
        ctx.fillStyle = "rgba(110,231,255,0.95)";
        ctx.beginPath();
        ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
        ctx.fill();

        if (shotPulse > 0.02 && state.cameraMode === "first-person") {
          const flashX = state.player.mode === "vehicle" ? W * 0.66 : W * 0.7;
          const flashY = state.player.mode === "vehicle" ? H * 0.72 : H * 0.76;
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const blast = ctx.createRadialGradient(flashX, flashY, 4, flashX, flashY, 80 + shotPulse * 90);
          blast.addColorStop(0, "rgba(255,250,230," + (0.9 * shotPulse) + ")");
          blast.addColorStop(0.18, "rgba(255,220,140," + (0.7 * shotPulse) + ")");
          blast.addColorStop(0.5, "rgba(255,160,90," + (0.28 * shotPulse) + ")");
          blast.addColorStop(1, "rgba(255,160,90,0)");
          ctx.fillStyle = blast;
          ctx.beginPath();
          ctx.arc(flashX, flashY, 80 + shotPulse * 90, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    function renderMiniMap() {
      const interior = currentInterior();
      const mapW = 260;
      const mapH = 180;
      const x = W - mapW - 16;
      const y = H - mapH - 16;
      Draw.roundRect(ctx, x, y, mapW, mapH, 14, "rgba(3, 7, 18, 0.88)");
      ctx.textAlign = "left";
      if (interior) {
        const sx = mapW / interior.w;
        const sy = mapH / interior.h;
        ctx.fillStyle = interior.floor;
        ctx.fillRect(x + 12, y + 24, mapW - 24, mapH - 32);
        for (const rect of interior.colliders || []) {
          ctx.fillStyle = interior.prop;
          ctx.fillRect(x + rect.x * sx, y + rect.y * sy, rect.w * sx, rect.h * sy);
        }
        ctx.fillStyle = interior.accent;
        ctx.fillRect(x + interior.exitZone.x * sx, y + interior.exitZone.y * sy, interior.exitZone.w * sx, interior.exitZone.h * sy);
        ctx.fillStyle = "#76d7ff";
        ctx.beginPath();
        ctx.arc(x + state.player.x * sx, y + state.player.y * sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "12px Segoe UI";
        ctx.fillText(interior.name, x + 12, y + 18);
        return;
      }
      const sx = mapW / WORLD_W;
      const sy = mapH / WORLD_H;
      for (const district of DISTRICTS) {
        ctx.fillStyle = district.base;
        ctx.fillRect(x + district.x * sx, y + district.y * sy, district.w * sx, district.h * sy);
      }
      for (const building of BUILDINGS) {
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(x + building.x * sx, y + building.y * sy, building.w * sx, building.h * sy);
      }
      ctx.fillStyle = currentMission().theme;
      const marker = objectiveMarker();
      if (marker) {
        ctx.beginPath();
        ctx.arc(x + marker.x * sx, y + marker.y * sy, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#76d7ff";
      ctx.beginPath();
      ctx.arc(x + state.player.x * sx, y + state.player.y * sy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Segoe UI";
      ctx.fillText("City Map", x + 12, y + 18);
    }

    function renderActionDeck() {
      if (!runtime) return;
      Draw.roundRect(ctx, 56, 88, W - 112, H - 176, 20, "rgba(3, 7, 18, 0.92)");
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 18px Segoe UI";
      ctx.fillText(currentPackLabel() + " Action Deck", 82, 122);
      ctx.font = "12px Segoe UI";
      ctx.fillStyle = "#9ab1d8";
      ctx.fillText("Use the authored mascot animations directly. 1-0 triggers the visible row.", 82, 144);
      const start = state.actionPage * ACTIONS_PER_PAGE;
      const actions = runtime.actionNames.slice(start, start + ACTIONS_PER_PAGE);
      for (let i = 0; i < actions.length; i++) {
        const action = runtime.actions[actions[i]];
        const rowY = 172 + i * 28;
        Draw.roundRect(ctx, 82, rowY - 16, W - 164, 22, 10, i % 2 ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)");
        ctx.fillStyle = "#ffffff";
        ctx.fillText((i === 9 ? 0 : i + 1) + ". " + actions[i], 96, rowY);
        ctx.fillStyle = "#8fb3ff";
        ctx.fillText(action.category, W - 210, rowY);
      }
      ctx.fillStyle = "#d6e5ff";
      ctx.fillText("Page " + (state.actionPage + 1) + " / " + Math.max(1, Math.ceil(runtime.actionNames.length / ACTIONS_PER_PAGE)), 82, H - 88);
      let hintY = H - 64;
      for (const line of currentActionHints()) {
        ctx.fillStyle = "#9ab1d8";
        ctx.fillText(line, 82, hintY);
        hintY += 18;
      }
    }

    function renderCharacterSelect() {
      const pagePacks = currentCharacterPagePacks();
      const totalPages = characterPageCount();
      state.characterCards = [];
      ctx.fillStyle = "rgba(2, 4, 12, 0.74)";
      ctx.fillRect(0, 0, W, H);
      Draw.roundRect(ctx, 86, 68, W - 172, H - 136, 24, "rgba(4, 8, 18, 0.94)");
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "700 24px Segoe UI";
      ctx.fillText("Owned Shimeji Select", 118, 116);
      ctx.font = "13px Segoe UI";
      ctx.fillStyle = "#9ab1d8";
      ctx.fillText("Switch mascots without dropping world progress. Click a card or use arrows + Enter.", 118, 140);
      ctx.fillText("H / Esc closes, PageUp / PageDown switch pages, 1-6 picks the visible row.", 118, 160);
      const cardW = 220;
      const cardH = 112;
      const gapX = 18;
      const gapY = 18;
      const startX = 118;
      const startY = 188;
      for (let i = 0; i < pagePacks.length; i++) {
        const pack = pagePacks[i];
        const globalIndex = state.characterPage * PACKS_PER_PAGE + i;
        const col = i % 3;
        const row = Math.floor(i / 3);
        const rect = {
          x: startX + col * (cardW + gapX),
          y: startY + row * (cardH + gapY),
          w: cardW,
          h: cardH
        };
        const isSelected = normalizePackId(pack.packId) === normalizePackId(state.selectedPackId);
        const isCursor = globalIndex === state.characterCursor;
        const accent = packTheme(pack.packId, currentPackAccent());
        const bg = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
        bg.addColorStop(0, isCursor ? rgba(accent, 0.2) : "rgba(18, 25, 45, 0.94)");
        bg.addColorStop(1, "rgba(8, 12, 24, 0.98)");
        Draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, bg);
        Draw.roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 18, null, isSelected ? rgba(accent, 0.95) : isCursor ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.08)");
        ctx.fillStyle = rgba(accent, 0.95);
        ctx.fillRect(rect.x + 16, rect.y + 14, 58, 4);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 16px Segoe UI";
        ctx.fillText((i + 1) + ". " + pack.name, rect.x + 16, rect.y + 42);
        ctx.font = "12px Segoe UI";
        ctx.fillStyle = "#9ab1d8";
        ctx.fillText(pack.origin || "Owned Shimeji", rect.x + 16, rect.y + 64);
        ctx.fillText(pack.packId, rect.x + 16, rect.y + 84);
        if (isSelected) {
          ctx.fillStyle = rgba(accent, 0.18);
          Draw.roundRect(ctx, rect.x + rect.w - 92, rect.y + 14, 68, 24, 10, rgba(accent, 0.18), rgba(accent, 0.42));
          ctx.fillStyle = "#eef6ff";
          ctx.textAlign = "center";
          ctx.fillText("ACTIVE", rect.x + rect.w - 58, rect.y + 30);
          ctx.textAlign = "left";
        }
        state.characterCards.push({ index: globalIndex, packId: pack.packId, rect });
      }
      ctx.textAlign = "left";
      ctx.fillStyle = "#dbeafe";
      ctx.font = "13px Segoe UI";
      ctx.fillText("Page " + (state.characterPage + 1) + " / " + totalPages + "  |  Total owned shimeji: " + state.availablePacks.length, 118, H - 92);
      ctx.fillText("Current: " + currentPackLabel() + (state.packLoadBusy ? "  |  " + state.packLoadMessage : ""), 118, H - 70);
    }

    function renderOverlay() {
      if (state.mode === "title") {
        Draw.roundRect(ctx, 120, 82, W - 240, H - 164, 24, "rgba(3, 7, 18, 0.88)");
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "700 36px Segoe UI";
        ctx.fillText(BRAND.title, W * 0.5, 160);
        ctx.font = "18px Segoe UI";
        ctx.fillStyle = "#9ab1d8";
        ctx.fillText(brandSubtitleFor(currentPackLabel()), W * 0.5, 194);
        ctx.font = "14px Segoe UI";
        ctx.fillText("A selectable shimeji open-world sandbox using the mascot's authored action set.", W * 0.5, 238);
        ctx.fillText("Campaign: four chained missions, driving, climbing, carry/throw objectives, combat, save/load, split decoys.", W * 0.5, 264);
        ctx.fillText("Press Enter or click to launch. Press H to choose a shimeji.", W * 0.5, 316);
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText(currentPackLabel() + " actions available: " + (runtime ? runtime.actionNames.length : 0), W * 0.5, 350);
        ctx.fillText("Current shimeji: " + currentPackLabel(), W * 0.5, 376);
      }
      if (state.paused) {
        ctx.fillStyle = "rgba(2, 4, 12, 0.62)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#ffffff";
        ctx.font = "700 32px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("Paused", W * 0.5, H * 0.5 - 8);
        ctx.font = "14px Segoe UI";
        ctx.fillText("Press Esc to resume.", W * 0.5, H * 0.5 + 24);
      }
      if (state.gameOver) {
        ctx.fillStyle = "rgba(22, 0, 10, 0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "700 34px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText(currentPackLabel() + " Flatlined", W * 0.5, H * 0.5 - 12);
        ctx.font = "14px Segoe UI";
        ctx.fillText("Press Enter to respawn at the last safehouse.", W * 0.5, H * 0.5 + 22);
      }
      if (state.won) {
        ctx.fillStyle = "rgba(4, 18, 12, 0.72)";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = "#fff";
        ctx.font = "700 34px Segoe UI";
        ctx.textAlign = "center";
        ctx.fillText("City Secured", W * 0.5, H * 0.5 - 12);
        ctx.font = "14px Segoe UI";
        ctx.fillText("Captain Static is down. Press Enter to roll the intro again.", W * 0.5, H * 0.5 + 22);
      }
      if (runtimeError) {
        ctx.fillStyle = "rgba(120, 0, 20, 0.85)";
        Draw.roundRect(ctx, 30, H - 126, W - 60, 78, 14, "rgba(120, 0, 20, 0.85)");
        ctx.fillStyle = "#fff";
        ctx.font = "13px Segoe UI";
        ctx.textAlign = "left";
        ctx.fillText(currentPackLabel() + " pack load failed: " + runtimeError, 46, H - 82);
      }
      if (scene3dError) {
        ctx.fillStyle = "rgba(70, 22, 0, 0.82)";
        Draw.roundRect(ctx, 30, H - 212, W - 60, 62, 14, "rgba(70, 22, 0, 0.82)");
        ctx.fillStyle = "#fff";
        ctx.font = "13px Segoe UI";
        ctx.textAlign = "left";
        ctx.fillText("3D renderer fallback: " + scene3dError, 46, H - 176);
      }
      if (state.packLoadError && !runtimeError) {
        ctx.fillStyle = "rgba(90, 22, 0, 0.84)";
        Draw.roundRect(ctx, 30, H - 286, W - 60, 62, 14, "rgba(90, 22, 0, 0.84)");
        ctx.fillStyle = "#fff";
        ctx.font = "13px Segoe UI";
        ctx.textAlign = "left";
        ctx.fillText("Pack switch failed: " + state.packLoadError, 46, H - 250);
      }
      if (state.characterSelectOpen) renderCharacterSelect();
    }

    async function ensure3DRenderer() {
      if (scene3d) return scene3d;
      if (scene3dPromise) return scene3dPromise;
      scene3dPromise = import(resolvePackUrl("shared/mascot-games/game-openworld-3d.js"))
        .then((mod) => mod.createMascotOpenWorld3DRenderer(sceneHost, {
          world: {
            width: WORLD_W,
            height: WORLD_H,
            districts: DISTRICTS,
            roadNodes: ROAD_NODES,
            buildings: BUILDINGS,
            climbRoutes: CLIMB_ROUTES,
            interiors: INTERIORS
          }
        }))
        .then((renderer) => {
          scene3d = renderer;
          scene3dError = "";
          return renderer;
        })
        .catch((error) => {
          scene3dError = error && error.message ? error.message : String(error);
          state.dimensionMode = "2d";
          state.cameraMode = "topdown";
          return null;
        })
        .finally(() => {
          scene3dPromise = null;
        });
      return scene3dPromise;
    }

    function build3DSnapshot() {
      const interior = currentInterior();
      const marker = objectiveMarker();
      const playerFocusAngle =
        state.player.mode === "vehicle" && activeVehicle()
          ? activeVehicle().angle
          : (Number.isFinite(state.player.aimAngle) ? state.player.aimAngle : (state.player.dir >= 0 ? 0 : Math.PI));
      const actors = [];
      if (state.player && state.player.mode !== "vehicle" && state.cameraMode !== "first-person") {
        actors.push({
          id: "player",
          x: state.player.x,
          y: state.player.y,
          jumpZ: state.player.jumpZ,
          jumpAbsolute: entityAbsoluteZ(state.player),
          roofId: state.player.roofId || "",
          supportRoofId: entitySupportRoofId(state.player),
          dir: state.player.dir,
          animator: state.player.animator
        });
      }
      for (const decoy of state.decoys) {
        actors.push({
          id: decoy.id,
          x: decoy.x,
          y: decoy.y,
          jumpZ: decoy.jumpZ || 0,
          jumpAbsolute: entityAbsoluteZ(decoy),
          roofId: decoy.roofId || "",
          supportRoofId: entitySupportRoofId(decoy),
          dir: decoy.dir,
          animator: decoy.animator
        });
      }
      if (!interior) {
        for (const npc of state.npcs) {
          if (npc.hidden) continue;
          actors.push({
            id: npc.id,
            x: npc.x,
            y: npc.y,
            jumpZ: npc.jumpZ || 0,
            jumpAbsolute: entityAbsoluteZ(npc),
            roofId: npc.roofId || "",
            supportRoofId: entitySupportRoofId(npc),
            dir: npc.dir,
            animator: npc.animator
          });
        }
      }
      const markerRoof = !interior && marker ? roofAtPoint(marker.x, marker.y, 6) : null;
      return {
        bounds: sceneBounds(),
        interiorId: interior ? interior.id : "",
        anchor: worldAnchor(),
        cameraMode: state.cameraMode,
        focusAngle: playerFocusAngle,
        lookPitch: state.player.lookPitch || 0,
        playerJump: state.player.jumpZ || 0,
        playerJumpAbsolute: entityAbsoluteZ(state.player),
        playerRoofId: state.player.roofId || "",
        playerSupportRoofId: entitySupportRoofId(state.player),
        playerAnimator: state.player.animator,
        playerMode: state.player.mode,
        playerVehicleId: state.player.vehicleId || "",
        playerSpeed: Math.hypot(state.player.vx || 0, state.player.vy || 0),
        vehicleSpeed: activeVehicle() ? Math.abs(activeVehicle().speed || 0) : 0,
        currentWeaponId: state.player.currentWeapon,
        firstPersonRigStyle: state.firstPersonRigStyle,
        selectedPackId: state.selectedPackId,
        selectedPackName: state.selectedPackName,
        shotKick: state.player.shotKick || 0,
        shotPulse: Math.max(0, 1 - (state.totalPlaySeconds - (state.player.lastShotAt || -99)) / 0.22),
        runtime,
        actors,
        vehicles: interior ? [] : state.vehicles.map((vehicle) => Object.assign({
          spec: VEHICLE_SPECS[vehicle.model]
        }, vehicle)),
        pickups: interior ? [] : state.pickups.map((pickup, index) => ({
          id: pickup.id || (pickup.kind + "_" + index),
          x: pickup.x,
          y: pickup.y,
          bob: pickup.bob || 0,
          color: pickup.kind === "cash" ? "#f6d365" : pickup.kind === "armor" ? "#7dd3fc" : pickup.kind === "ammo" ? "#fde68a" : (pickup.payload && pickup.payload.color) || "#ffffff",
          visible: true
        })),
        objectiveMarker: marker ? Object.assign({ roofId: markerRoof ? markerRoof.id : "" }, marker) : null,
        missionTheme: currentMission().theme,
        notoriety: state.notoriety,
        pulse: state.markerPulse,
        time: state.totalPlaySeconds
      };
    }

    function render() {
      ctx.clearRect(0, 0, W, H);
      const wants3d = state.dimensionMode === "3d";
      if (wants3d && !scene3d && !scene3dPromise) ensure3DRenderer();
      const canRender3d = wants3d && !!scene3d;
      sceneHost.style.display = canRender3d ? "block" : "none";
      if (canRender3d) scene3d.renderFrame(build3DSnapshot());
      else {
        renderBackdrop();
        renderWorld();
      }
      renderHud();
      if (state.mapOpen) renderMiniMap();
      if (state.actionDeckOpen) renderActionDeck();
      renderOverlay();
      const vignette = ctx.createRadialGradient(W * 0.5, H * 0.46, H * 0.18, W * 0.5, H * 0.46, W * 0.72);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);
      screenFx.renderFlash(ctx, W, H);
    }

    function manualAdvance(ms) {
      const total = Math.max(0, Number(ms) || 0);
      let remaining = total / 1000;
      while (remaining > 0) {
        const step = Math.min(remaining, 1 / 60);
        update(step);
        remaining -= step;
      }
      render();
    }

    function renderGameToText() {
      if (!state.player) {
        return [
          "mode=" + state.mode,
          "pack=" + state.selectedPackId + ":" + currentPackLabel() + " owned=" + state.availablePacks.length + " selector=" + (state.characterSelectOpen ? "open" : "closed") + " loading=" + (state.packLoadBusy ? "1" : "0"),
          "boot=waiting"
        ].join("\n");
      }
      const vehicle = activeVehicle();
      const lines = [
        "mode=" + state.mode,
        "pack=" + state.selectedPackId + ":" + currentPackLabel() + " owned=" + state.availablePacks.length + " selector=" + (state.characterSelectOpen ? "open" : "closed") + " loading=" + (state.packLoadBusy ? "1" : "0"),
        "view=" + state.dimensionMode + ":" + state.cameraMode + ":" + state.firstPersonRigStyle + (currentInterior() ? ":" + currentInterior().id : ""),
        "mission=" + currentMission().id + ":" + state.missionPhase,
        "player=(" + Math.round(state.player.x) + "," + Math.round(state.player.y) + ") z=" + Math.round(entityAbsoluteZ(state.player)) + " vz=" + Math.round(state.player.jumpVz || 0) + " surface=" + (entitySupportRoofId(state.player) || "ground") + " hp=" + Math.round(state.player.hp) + " armor=" + Math.round(state.player.armor),
        "aim=" + (state.player.aimAngle || 0).toFixed(2) + " pitch=" + (state.player.lookPitch || 0).toFixed(2),
        "weapon=" + state.player.currentWeapon + " ammo=" + (currentWeapon().infiniteAmmo ? "INF" : (state.player.ammo[state.player.currentWeapon] || 0)),
        "vehicle=" + (vehicle ? vehicle.id + ":" + vehicle.model : "none"),
        "carry=" + (state.player.carryItem || "none"),
        "npcs=" + state.npcs.filter((npc) => !npc.hidden).length + " vehicles=" + state.vehicles.length + " pickups=" + state.pickups.length + " decoys=" + state.decoys.length,
        "heat=" + state.notoriety.toFixed(2) + " cash=" + Math.floor(state.cash),
        "objective=" + objectiveText(),
        "message=" + s(state.message)
      ];
      return lines.join("\n");
    }

    function frame(ts) {
      if (!running) return;
      rafId = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
      lastTs = ts || performance.now();
      update(dt);
      render();
    }

    function start() {
      if (running) return;
      running = true;
      lastTs = performance.now();
      rafId = requestAnimationFrame(frame);
    }

    function stop() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function destroy() {
      stop();
      releasePointerLock();
      input.destroy();
      document.removeEventListener("mousemove", handleLookPointerMove);
      document.removeEventListener("mouseup", handleLookPointerUp);
      cvs.removeEventListener("mousedown", handleLookPointerDown);
      cvs.removeEventListener("click", handleViewportClick);
      if (scene3d && typeof scene3d.destroy === "function") scene3d.destroy();
      scene3d = null;
      if (stage.parentNode) stage.parentNode.removeChild(stage);
      if (window.advanceTime === rootApi.step) delete window.advanceTime;
      if (window.render_game_to_text === renderGameToText) delete window.render_game_to_text;
      if (window.__gsMascotOpenWorldInstance === rootApi) delete window.__gsMascotOpenWorldInstance;
    }

    async function boot() {
      const initialSave = await saveStore.get(SAVE_KEY, null);
      state.availablePacks = await discoverOwnedShimejiPacks();
      if (!state.availablePacks.length) {
        state.availablePacks = sortPackSpecs(LOCAL_SHIMEJI_PACKS.map((entry) => ({
          packId: entry.packId,
          name: entry.name,
          origin: entry.origin,
          configPath: entry.configPath,
          spritesheetPath: entry.spritesheetPath,
          source: "local"
        })));
      }
      const requestedPackId = s(initialSave && initialSave.selectedPackId || state.selectedPackId || DEFAULT_PACK_ID).trim() || DEFAULT_PACK_ID;
      const initialPack = findLocalPackSpec(requestedPackId) || state.availablePacks.find((entry) => normalizePackId(entry.packId) === normalizePackId(requestedPackId)) || state.availablePacks[0] || findLocalPackSpec(DEFAULT_PACK_ID);
      if (initialPack) {
        state.selectedPackId = normalizePackId(initialPack.packId);
        state.selectedPackName = s(initialPack.name || friendlyPackName(initialPack.packId));
        state.selectedPackOrigin = s(initialPack.origin || "");
      }
      syncCharacterCursorToSelected();
      seedWorld();
      try {
        if (initialPack) {
          await selectPack(initialPack.packId, { silent: true, skipSave: true });
        } else {
          runtime = await loadBonniRuntime();
          resetRuntimeAnimators();
        }
      } catch (error) {
        runtimeError = error && error.message ? error.message : String(error);
      }
      if (runtime) resetRuntimeAnimators();
      await loadGame(initialSave);
      if (state.dimensionMode === "3d") ensure3DRenderer();
      updateCamera(1 / 60);
      render();
      start();
    }

    rootApi.start = start;
    rootApi.stop = stop;
    rootApi.destroy = destroy;
    rootApi.setPresentationMode = setPresentationMode;
    rootApi.toggleDimensionMode = toggleDimensionMode;
    rootApi.cycleCameraMode = cycleCameraMode;
    rootApi.canvas = cvs;
    window.advanceTime = rootApi.step;
    window.render_game_to_text = renderGameToText;
    window.__gsMascotOpenWorldInstance = rootApi;
    boot();
    return rootApi;
  }

  window.__gsMascotGameOpenWorld = {
    create: createOpenWorldGame,
    loadBonniRuntime,
    loadPackRuntime,
    discoverOwnedShimejiPacks
  };
})();
