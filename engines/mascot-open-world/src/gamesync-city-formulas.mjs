// SPDX-License-Identifier: GPL-3.0-or-later
// Original GameSync pinned 2D city facts and exact movement stages.
// City SHA-256 4d004092a3dd8d164869457b5cebab0ef9109dabb118d553bd0f3765b2fdc628, shared core f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e.
  const WORLD_W = 3200;
  const WORLD_H = 2200;
  const BRAND = Object.freeze({
    title: "Midnight Mascot Syndicate",
    subtitle: "The mascot crew takes the city back one mission at a time."
  });
  const clamp = (v, lo, hi) => v < lo ? lo : v > hi ? hi : v;
  function s(v) {
    return v == null ? "" : String(v);
  }
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

  const DISTRICTS = Object.freeze([
    { id: "safehouse", name: "Hideout Row", x: 0, y: 1500, w: 980, h: 700, base: "#0b1530", glow: "rgba(49, 97, 255, 0.20)" },
    { id: "midtown", name: "Midtown Mirage", x: 980, y: 1280, w: 1060, h: 920, base: "#111c38", glow: "rgba(255, 156, 55, 0.18)" },
    { id: "market", name: "Neon Market", x: 1900, y: 1180, w: 1300, h: 1020, base: "#191228", glow: "rgba(255, 71, 146, 0.16)" },
    { id: "docks", name: "Docklight", x: 1880, y: 0, w: 1320, h: 1260, base: "#0b202c", glow: "rgba(41, 209, 194, 0.14)" },
    { id: "archive", name: "Archive Heights", x: 720, y: 220, w: 1080, h: 1060, base: "#21172b", glow: "rgba(186, 92, 255, 0.16)" }
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

export function authoredCityGeometry(){
 return structuredClone({width:WORLD_W,height:WORLD_H,buildings:BUILDINGS,districts:DISTRICTS,interiors:INTERIORS});
}

export function bindOriginalTraversal(state,setMessage){
    function currentInterior() {
      return state.player && state.player.interiorId ? INTERIORS.find((entry) => entry.id === state.player.interiorId) || null : null;
    }

    function sceneBounds() {
      const interior = currentInterior();
      return interior ? { w: interior.w, h: interior.h } : { w: WORLD_W, h: WORLD_H };
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

    function pointInRect(x, y, rect) {
      return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    function roofById(id) {
      return id ? BUILDINGS.find((building) => building.id === id) || null : null;
    }

    function roofContainsPoint(roof, x, y, inset) {
      if (!roof) return false;
      const pad = Number.isFinite(inset) ? inset : 18;
      return x >= roof.x + pad && x <= roof.x + roof.w - pad && y >= roof.y + pad && y <= roof.y + roof.h - pad;
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
 return {currentInterior,sceneBounds,nearInteriorDoor,nearInteriorExit,pointInRect,entityAbsoluteZ,
   moveWithBuildingCollision,updateRoofTraversalAfterMove,enterInterior,exitInterior,
   district:(x,y)=>DISTRICTS.find(entry=>pointInRect(x,y,entry))?.name??null};
}
