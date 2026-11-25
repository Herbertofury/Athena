import * as THREE from "../vendor/three.webgpu.min.js";

const WORLD_SCALE = 0.06;
const VERTICAL_SCALE = 0.018;
const SPRITE_SCALE = 0.02;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function rgbaToColor(value, fallback) {
  const text = String(value || "").trim();
  if (/^#([0-9a-f]{6})$/i.test(text)) return new THREE.Color(text);
  if (/^#([0-9a-f]{3})$/i.test(text)) {
    const hex = text.slice(1);
    return new THREE.Color("#" + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]);
  }
  const match = text.match(/rgba?\(([^)]+)\)/i);
  if (match) {
    const parts = match[1].split(",").map((part) => Number(part.trim()));
    if (parts.length >= 3) return new THREE.Color(parts[0] / 255, parts[1] / 255, parts[2] / 255);
  }
  return new THREE.Color(fallback || "#6ee7ff");
}

function lerpAngle(from, to, alpha) {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * alpha;
}

function smoothAlpha(dt, rate) {
  return 1 - Math.exp(-Math.max(0, Number(dt) || 0) * rate);
}

function toWorld(bounds, x, y) {
  const width = Number(bounds && bounds.w) || 1;
  const height = Number(bounds && bounds.h) || 1;
  return {
    x: (x - width * 0.5) * WORLD_SCALE,
    z: (y - height * 0.5) * WORLD_SCALE
  };
}

function buildRoadSegments(nodes) {
  const segments = [];
  const seen = new Set();
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const sameRow = a.y === b.y && Math.abs(a.x - b.x) <= 540;
      const sameCol = a.x === b.x && Math.abs(a.y - b.y) <= 540;
      if (!sameRow && !sameCol) continue;
      const key = a.x + ":" + a.y + "|" + b.x + ":" + b.y;
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push({ a, b });
    }
  }
  return segments;
}

function createActorSprite() {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.center.set(0.5, 0);
  sprite.renderOrder = 12;
  sprite.userData.canvas = canvas;
  sprite.userData.ctx = ctx;
  sprite.userData.texture = texture;
  sprite.userData.key = "";
  return sprite;
}

function updateActorSprite(sprite, actor, runtime) {
  if (!actor || !runtime || !runtime.image || !actor.animator || typeof actor.animator.currentFrame !== "function") {
    sprite.visible = false;
    return;
  }
  const frame = actor.animator.currentFrame();
  if (!frame || !frame.sw || !frame.sh) {
    sprite.visible = false;
    return;
  }
  const facing = actor.dir >= 0 ? 1 : -1;
  const key = [
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    frame.anchorX,
    frame.anchorY,
    facing
  ].join(":");
  if (sprite.userData.key !== key) {
    const canvas = sprite.userData.canvas;
    const ctx = sprite.userData.ctx;
    const texture = sprite.userData.texture;
    if (canvas.width !== frame.sw || canvas.height !== frame.sh) {
      canvas.width = frame.sw;
      canvas.height = frame.sh;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (facing < 0) {
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(runtime.image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    } else {
      ctx.drawImage(runtime.image, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, canvas.width, canvas.height);
    }
    texture.needsUpdate = true;
    sprite.userData.key = key;
  }
  sprite.visible = true;
  sprite.scale.set(frame.sw * SPRITE_SCALE, frame.sh * SPRITE_SCALE, 1);
}

function createVehicleMesh(spec) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * WORLD_SCALE, 0.72, spec.height * WORLD_SCALE),
    new THREE.MeshStandardMaterial({
      color: rgbaToColor(spec.body, "#38bdf8"),
      emissive: rgbaToColor(spec.body, "#38bdf8"),
      emissiveIntensity: 0.16,
      roughness: 0.34,
      metalness: 0.42
    })
  );
  body.position.y = 0.68;
  group.add(body);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * WORLD_SCALE * (spec.roofScale || 0.58), 0.46, spec.height * WORLD_SCALE * 0.72),
    new THREE.MeshStandardMaterial({
      color: rgbaToColor(spec.accent, "#0f172a"),
      emissive: new THREE.Color("#071019"),
      emissiveIntensity: 0.1,
      roughness: 0.24,
      metalness: 0.58
    })
  );
  roof.position.y = 1.14;
  group.add(roof);

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(spec.width * WORLD_SCALE * 0.74, 0.04, 0.08),
    new THREE.MeshBasicMaterial({
      color: rgbaToColor(spec.stripe || "#ffffff", "#e2e8f0"),
      transparent: true,
      opacity: spec.stripe ? 0.8 : 0
    })
  );
  stripe.position.set(0, 1.05, 0);
  group.add(stripe);

  const wheelGeometry = new THREE.CylinderGeometry(spec.wheelRadius || 0.28, spec.wheelRadius || 0.28, 0.18, 14);
  wheelGeometry.rotateZ(Math.PI * 0.5);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#0b1020"),
    roughness: 0.92,
    metalness: 0.18
  });
  for (const offsetX of [-spec.wheelX, spec.wheelX]) {
    for (const offsetY of [-spec.wheelY, spec.wheelY]) {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.position.set(offsetX * WORLD_SCALE, 0.3, offsetY * WORLD_SCALE);
      group.add(wheel);
    }
  }

  if (spec.hoodScoop) {
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.18, 0.4),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#08101f"),
        emissive: new THREE.Color("#111827"),
        emissiveIntensity: 0.06,
        roughness: 0.42,
        metalness: 0.3
      })
    );
    scoop.position.set(0.44, 1.02, 0);
    group.add(scoop);
  }

  if (spec.spoiler) {
    const spoiler = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.28, spec.height * WORLD_SCALE * 0.72),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(spec.accent, "#0f172a"),
        roughness: 0.34,
        metalness: 0.52
      })
    );
    spoiler.position.set(spec.width * WORLD_SCALE * 0.44, 1.08, 0);
    group.add(spoiler);
  }

  if (spec.truckBed) {
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(spec.width * WORLD_SCALE * 0.28, 0.32, spec.height * WORLD_SCALE * 0.76),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(spec.accent, "#0f172a"),
        roughness: 0.68,
        metalness: 0.18
      })
    );
    bed.position.set(-spec.width * WORLD_SCALE * 0.18, 0.86, 0);
    group.add(bed);
  }

  if (spec.lightbar) {
    const lightbar = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.12, 0.18),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#60a5fa")
      })
    );
    lightbar.position.set(0, 1.5, 0);
    group.add(lightbar);
    group.userData.lightbar = lightbar;
  }

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.width * WORLD_SCALE * 1.3, spec.height * WORLD_SCALE * 1.4),
    new THREE.MeshBasicMaterial({
      color: rgbaToColor(spec.body, "#38bdf8"),
      transparent: true,
      opacity: 0.16,
      depthWrite: false
    })
  );
  glow.rotation.x = -Math.PI * 0.5;
  glow.position.y = 0.02;
  group.add(glow);
  group.userData.glow = glow;

  return group;
}

function createPickupMesh(color) {
  const group = new THREE.Group();
  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 18),
    new THREE.MeshStandardMaterial({
      color: rgbaToColor(color, "#ffffff"),
      emissive: rgbaToColor(color, "#ffffff"),
      emissiveIntensity: 0.44,
      roughness: 0.18,
      metalness: 0.24
    })
  );
  orb.position.y = 1.4;
  group.add(orb);

  const halo = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.76, 28),
    new THREE.MeshBasicMaterial({
      color: rgbaToColor(color, "#ffffff"),
      transparent: true,
      opacity: 0.36,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  halo.rotation.x = -Math.PI * 0.5;
  halo.position.y = 0.08;
  group.add(halo);

  group.userData.halo = halo;
  group.userData.orb = orb;
  return group;
}

function weaponPalette(weaponId) {
  if (weaponId === "smg") {
    return {
      body: new THREE.Color("#f8d17a"),
      accent: new THREE.Color("#fff2c2"),
      glow: new THREE.Color("#ffd166")
    };
  }
  if (weaponId === "beat_blaster") {
    return {
      body: new THREE.Color("#34d399"),
      accent: new THREE.Color("#dcfce7"),
      glow: new THREE.Color("#6ee7b7")
    };
  }
  if (weaponId === "vinyl") {
    return {
      body: new THREE.Color("#a78bfa"),
      accent: new THREE.Color("#ede9fe"),
      glow: new THREE.Color("#c4b5fd")
    };
  }
  if (weaponId === "mic_lancer") {
    return {
      body: new THREE.Color("#fb923c"),
      accent: new THREE.Color("#ffedd5"),
      glow: new THREE.Color("#fdba74")
    };
  }
  if (weaponId === "paint_sprayer") {
    return {
      body: new THREE.Color("#60a5fa"),
      accent: new THREE.Color("#dbeafe"),
      glow: new THREE.Color("#93c5fd")
    };
  }
  if (weaponId === "dubstep_cannon") {
    return {
      body: new THREE.Color("#ec4899"),
      accent: new THREE.Color("#fdf2f8"),
      glow: new THREE.Color("#f472b6")
    };
  }
  if (weaponId === "launcher") {
    return {
      body: new THREE.Color("#f472b6"),
      accent: new THREE.Color("#fde6f2"),
      glow: new THREE.Color("#fb7185")
    };
  }
  return {
    body: new THREE.Color("#7dd3fc"),
    accent: new THREE.Color("#ecfeff"),
    glow: new THREE.Color("#6ee7ff")
  };
}

const FP_CROPS = Object.freeze({
  leftArm: { x: 0.06, y: 0.26, w: 0.24, h: 0.34 },
  rightArm: { x: 0.7, y: 0.26, w: 0.24, h: 0.34 },
  legs: { x: 0.3, y: 0.66, w: 0.34, h: 0.22 }
});

const DEFAULT_FP_PROFILE = Object.freeze({
  onFoot: {
    rig: { x: 0.44, y: -0.34, z: -0.88, rx: -0.12, ry: -0.15, rz: -0.04 },
    leftArm: {
      crop: FP_CROPS.leftArm,
      x: -0.38,
      y: -0.14,
      z: -0.08,
      rx: -0.34,
      ry: 0.18,
      rz: 0.18,
      scale: 0.72,
      padding: 0.08,
      shadowOpacity: 0.18
    },
    rightArm: {
      crop: FP_CROPS.rightArm,
      x: 0.28,
      y: -0.2,
      z: -0.04,
      rx: -0.28,
      ry: -0.16,
      rz: -0.08,
      scale: 0.82,
      padding: 0.08,
      shadowOpacity: 0.22
    },
    legs: {
      crop: FP_CROPS.legs,
      x: 0,
      y: -0.66,
      z: -0.18,
      rx: -0.36,
      ry: 0,
      rz: 0,
      scale: 1.02,
      padding: 0.06,
      shadowOpacity: 0.18
    }
  },
  vehicle: {
    rig: { x: 0.3, y: -0.24, z: -0.72, rx: -0.02, ry: -0.08, rz: -0.02 },
    leftArm: {
      crop: FP_CROPS.leftArm,
      x: -0.18,
      y: -0.16,
      z: -0.08,
      rx: -0.22,
      ry: 0.16,
      rz: 0.12,
      scale: 0.58,
      padding: 0.06,
      shadowOpacity: 0.14
    },
    rightArm: {
      crop: FP_CROPS.rightArm,
      x: 0.16,
      y: -0.2,
      z: -0.06,
      rx: -0.2,
      ry: -0.12,
      rz: -0.06,
      scale: 0.64,
      padding: 0.06,
      shadowOpacity: 0.18
    },
    legs: {
      crop: FP_CROPS.legs,
      x: 0,
      y: -0.66,
      z: -0.18,
      rx: -0.36,
      ry: 0,
      rz: 0,
      scale: 0.9,
      padding: 0.05,
      shadowOpacity: 0.14
    }
  }
});

const FP_PACK_PROFILES = Object.freeze({
  "five-nights-at-freddys-mangle-01": {
    onFoot: {
      leftArm: { x: -0.42, scale: 0.78, rz: 0.22 },
      rightArm: { x: 0.3, scale: 0.88 },
      legs: { scale: 0.92, y: -0.68 }
    },
    vehicle: {
      leftArm: { x: -0.2, scale: 0.62 },
      rightArm: { x: 0.18, scale: 0.68 }
    }
  },
  "pochita-chainsaw-man-01": {
    onFoot: {
      leftArm: { x: -0.34, scale: 0.62, y: -0.18 },
      rightArm: { x: 0.24, scale: 0.72, y: -0.22 },
      legs: { scale: 0.86, y: -0.7 }
    },
    vehicle: {
      leftArm: { x: -0.16, scale: 0.52 },
      rightArm: { x: 0.13, scale: 0.6 }
    }
  },
  "five-nights-at-freddys-toy-bonnie-01": {
    onFoot: {
      leftArm: { scale: 0.76 },
      rightArm: { scale: 0.86 }
    },
    vehicle: {
      leftArm: { scale: 0.6 },
      rightArm: { scale: 0.66 }
    }
  }
});

const FP_PACK_PALETTE_HINTS = Object.freeze({
  "five-nights-at-freddys-toy-bonnie-01": { skin: "#d9f0ff", cloth: "#76d7ff", accent: "#f0abfc", trim: "#1f2a44" },
  "five-nights-at-freddys-mangle-01": { skin: "#ffe7ee", cloth: "#fda4af", accent: "#fecdd3", trim: "#7f1d1d" },
  "pochita-chainsaw-man-01": { skin: "#f59e0b", cloth: "#f97316", accent: "#ef4444", trim: "#2b1407" },
  "search-rover-xp-01": { skin: "#fef08a", cloth: "#facc15", accent: "#fde68a", trim: "#1f2937" },
  "bonzi-blobbuddy-01": { skin: "#bfdbfe", cloth: "#60a5fa", accent: "#93c5fd", trim: "#1e3a8a" },
  "bonzi-maxalert-01": { skin: "#ddd6fe", cloth: "#a78bfa", accent: "#c4b5fd", trim: "#312e81" },
  "shijima-default-01": { skin: "#d1fae5", cloth: "#34d399", accent: "#6ee7b7", trim: "#064e3b" },
  "webmeji-default-shimeji-01": { skin: "#bae6fd", cloth: "#22d3ee", accent: "#67e8f9", trim: "#164e63" }
});

const FP_PALETTE_CACHE = new Map();

function mergeFpLayer(base, override) {
  const next = { ...base, ...(override || {}) };
  next.crop = { ...(base && base.crop || {}), ...((override && override.crop) || {}) };
  return next;
}

function resolveFirstPersonProfile(packId, vehicleView) {
  const mode = vehicleView ? "vehicle" : "onFoot";
  const base = DEFAULT_FP_PROFILE[mode];
  const override = FP_PACK_PROFILES[packId] && FP_PACK_PROFILES[packId][mode] ? FP_PACK_PROFILES[packId][mode] : null;
  return {
    rig: { ...base.rig, ...((override && override.rig) || {}) },
    leftArm: mergeFpLayer(base.leftArm, override && override.leftArm),
    rightArm: mergeFpLayer(base.rightArm, override && override.rightArm),
    legs: mergeFpLayer(base.legs, override && override.legs)
  };
}

function frameSourceImage(runtime, frame) {
  if (!frame || !runtime) return null;
  return frame.image || runtime.image || null;
}

function colorHex(color) {
  return "#" + new THREE.Color(color).getHexString();
}

function colorLuma(entry) {
  if (!entry) return 0;
  return (entry.r * 0.2126 + entry.g * 0.7152 + entry.b * 0.0722) / 255;
}

function colorSaturation(entry) {
  if (!entry) return 0;
  const max = Math.max(entry.r, entry.g, entry.b);
  const min = Math.min(entry.r, entry.g, entry.b);
  if (max <= 0) return 0;
  return (max - min) / max;
}

function mergeRigPalette(base, hint) {
  return {
    skin: colorHex(hint && hint.skin ? hint.skin : base.skin),
    cloth: colorHex(hint && hint.cloth ? hint.cloth : base.cloth),
    accent: colorHex(hint && hint.accent ? hint.accent : base.accent),
    trim: colorHex(hint && hint.trim ? hint.trim : base.trim)
  };
}

function extractRigPalette(runtime, packId) {
  const cacheKey = String(packId || "") + ":" + String(runtime && runtime.image && (runtime.image.currentSrc || runtime.image.src || (runtime.image.width + "x" + runtime.image.height)) || "none");
  if (FP_PALETTE_CACHE.has(cacheKey)) return FP_PALETTE_CACHE.get(cacheKey);
  const hint = FP_PACK_PALETTE_HINTS[packId] || null;
  const fallback = mergeRigPalette({
    skin: "#f5d0c5",
    cloth: "#6ee7ff",
    accent: "#e5f2ff",
    trim: "#1f2937"
  }, hint);
  const image = runtime && runtime.image;
  if (!image || !image.width || !image.height) {
    FP_PALETTE_CACHE.set(cacheKey, fallback);
    return fallback;
  }
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const counts = new Map();
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 90) continue;
    const r = Math.round(data[i] / 24) * 24;
    const g = Math.round(data[i + 1] / 24) * 24;
    const b = Math.round(data[i + 2] / 24) * 24;
    const key = r + "," + g + "," + b;
    const entry = counts.get(key) || { r, g, b, count: 0 };
    entry.count += 1;
    counts.set(key, entry);
  }
  const palette = Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 12);
  if (!palette.length) {
    FP_PALETTE_CACHE.set(cacheKey, fallback);
    return fallback;
  }
  const dominant = palette[0];
  const accent = palette.slice().sort((a, b) => colorSaturation(b) - colorSaturation(a))[0] || dominant;
  const trim = palette.slice().sort((a, b) => colorLuma(a) - colorLuma(b))[0] || dominant;
  const skinCandidate = palette.find((entry) => colorLuma(entry) > 0.58 && colorSaturation(entry) < 0.45) || palette.slice().sort((a, b) => colorLuma(b) - colorLuma(a))[0] || dominant;
  const resolved = mergeRigPalette({
    skin: new THREE.Color(skinCandidate.r / 255, skinCandidate.g / 255, skinCandidate.b / 255),
    cloth: new THREE.Color(dominant.r / 255, dominant.g / 255, dominant.b / 255),
    accent: new THREE.Color(accent.r / 255, accent.g / 255, accent.b / 255),
    trim: new THREE.Color(trim.r / 255, trim.g / 255, trim.b / 255)
  }, hint);
  FP_PALETTE_CACHE.set(cacheKey, resolved);
  return resolved;
}

function rigPaletteColors(runtime, packId) {
  const palette = extractRigPalette(runtime, packId);
  return {
    skin: new THREE.Color(palette.skin),
    cloth: new THREE.Color(palette.cloth),
    accent: new THREE.Color(palette.accent),
    trim: new THREE.Color(palette.trim)
  };
}

function createPaperCutoutPlane() {
  const group = new THREE.Group();
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#020817"),
      map: texture,
      transparent: true,
      opacity: 0.18,
      alphaTest: 0.02,
      depthWrite: false
    })
  );
  shadow.position.set(0.016, -0.016, -0.01);
  shadow.renderOrder = 20;
  group.add(shadow);
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.02,
      depthWrite: false
    })
  );
  mesh.renderOrder = 21;
  group.add(mesh);
  group.userData.canvas = canvas;
  group.userData.ctx = ctx;
  group.userData.texture = texture;
  group.userData.mesh = mesh;
  group.userData.shadow = shadow;
  group.userData.key = "";
  return group;
}

function updatePaperCutoutPlane(group, runtime, frame, crop, options) {
  if (!group) return false;
  const source = frameSourceImage(runtime, frame);
  if (!source || !frame || !frame.sw || !frame.sh) {
    group.visible = false;
    return false;
  }
  const opts = options || {};
  const cropX = Math.max(0, Math.floor(frame.sw * (crop.x || 0)));
  const cropY = Math.max(0, Math.floor(frame.sh * (crop.y || 0)));
  const cropW = Math.max(1, Math.floor(frame.sw * (crop.w || 1)));
  const cropH = Math.max(1, Math.floor(frame.sh * (crop.h || 1)));
  const key = [
    frame.spriteKey,
    frame.sx,
    frame.sy,
    frame.sw,
    frame.sh,
    cropX,
    cropY,
    cropW,
    cropH,
    opts.flip ? 1 : 0
  ].join(":");
  const canvas = group.userData.canvas;
  const ctx = group.userData.ctx;
  const texture = group.userData.texture;
  if (group.userData.key !== key) {
    if (canvas.width !== cropW || canvas.height !== cropH) {
      canvas.width = cropW;
      canvas.height = cropH;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const srcX = (frame.image ? 0 : frame.sx) + cropX;
    const srcY = (frame.image ? 0 : frame.sy) + cropY;
    ctx.save();
    if (opts.flip) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, srcX, srcY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = imageData[(y * canvas.width + x) * 4 + 3];
        if (alpha < 10) continue;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) {
      group.visible = false;
      group.userData.key = key;
      return false;
    }
    const trimPad = clamp(Math.round(Math.max(cropW, cropH) * Math.max(0, Number(opts.padding) || 0)), 0, 12);
    const trimX = Math.max(0, minX - trimPad);
    const trimY = Math.max(0, minY - trimPad);
    const trimW = Math.max(1, Math.min(canvas.width, maxX - minX + 1 + trimPad * 2));
    const trimH = Math.max(1, Math.min(canvas.height, maxY - minY + 1 + trimPad * 2));
    if (canvas.width !== trimW || canvas.height !== trimH) {
      canvas.width = trimW;
      canvas.height = trimH;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (opts.flip) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(source, srcX + trimX, srcY + trimY, trimW, trimH, 0, 0, canvas.width, canvas.height);
    ctx.restore();
    texture.needsUpdate = true;
    group.userData.key = key;
  }
  const scale = Math.max(0.2, Number(opts.scale) || 1);
  const width = canvas.width * SPRITE_SCALE * scale;
  const height = canvas.height * SPRITE_SCALE * scale;
  group.userData.mesh.scale.set(width, height, 1);
  group.userData.mesh.material.opacity = clamp(Number.isFinite(opts.opacity) ? opts.opacity : 1, 0, 1);
  group.userData.shadow.scale.set(width * 1.04, height * 1.04, 1);
  group.userData.shadow.material.opacity = Number.isFinite(opts.shadowOpacity) ? opts.shadowOpacity : 0.28;
  group.visible = true;
  return true;
}

function weaponViewProfile(weaponId) {
  const base = {
    weapon: { x: 0.1, y: -0.12, z: -0.18, rx: 0.04, ry: -0.04, rz: 0.02 },
    frame: { x: 0.18, y: 0.14, z: 0.52 },
    slide: { x: 0.16, y: 0.08, z: 0.42 },
    barrelRadius: 0.025,
    barrelLength: 0.24,
    rightHand: { x: 0.11, y: -0.16, z: 0.02, rx: -0.95, ry: -0.2, rz: -0.22 },
    leftHand: { x: -0.01, y: -0.02, z: -0.3, rx: -0.82, ry: 0.26, rz: 0.28 },
    spriteLeft: { x: -0.22, y: -0.02, z: -0.16, rx: -0.4, ry: 0.22, rz: 0.18 },
    spriteRight: { x: 0.12, y: -0.17, z: 0.02, rx: -0.52, ry: -0.06, rz: -0.12 },
    muzzle: { x: 0.08, y: 0.03, z: -0.62 },
    flashScale: 1,
    stock: false,
    speaker: false,
    discs: false,
    horn: false,
    tank: false
  };
  if (weaponId === "smg") {
    return {
      ...base,
      frame: { x: 0.2, y: 0.14, z: 0.58 },
      slide: { x: 0.18, y: 0.09, z: 0.48 },
      barrelLength: 0.32,
      leftHand: { x: -0.02, y: -0.01, z: -0.38, rx: -0.86, ry: 0.2, rz: 0.22 },
      muzzle: { x: 0.08, y: 0.03, z: -0.72 },
      stock: true,
      flashScale: 1.1
    };
  }
  if (weaponId === "launcher") {
    return {
      ...base,
      weapon: { x: 0.1, y: -0.08, z: -0.14, rx: 0.02, ry: -0.02, rz: 0 },
      frame: { x: 0.28, y: 0.18, z: 0.84 },
      slide: { x: 0.24, y: 0.11, z: 0.7 },
      barrelRadius: 0.04,
      barrelLength: 0.44,
      rightHand: { x: 0.14, y: -0.12, z: 0.04, rx: -0.98, ry: -0.22, rz: -0.18 },
      leftHand: { x: -0.04, y: -0.02, z: -0.48, rx: -0.78, ry: 0.22, rz: 0.2 },
      spriteLeft: { x: -0.26, y: -0.04, z: -0.22, rx: -0.42, ry: 0.2, rz: 0.16 },
      spriteRight: { x: 0.14, y: -0.18, z: 0.04, rx: -0.5, ry: -0.08, rz: -0.14 },
      muzzle: { x: 0.1, y: 0.03, z: -0.96 },
      stock: true,
      horn: true,
      flashScale: 1.34
    };
  }
  if (weaponId === "vinyl") {
    return {
      ...base,
      frame: { x: 0.24, y: 0.16, z: 0.62 },
      slide: { x: 0.22, y: 0.09, z: 0.54 },
      barrelLength: 0.18,
      leftHand: { x: -0.06, y: 0, z: -0.3, rx: -0.84, ry: 0.3, rz: 0.28 },
      muzzle: { x: 0.08, y: 0.03, z: -0.76 },
      discs: true,
      flashScale: 1.18
    };
  }
  if (weaponId === "beat_blaster") {
    return {
      ...base,
      frame: { x: 0.22, y: 0.18, z: 0.68 },
      slide: { x: 0.2, y: 0.1, z: 0.54 },
      barrelLength: 0.24,
      leftHand: { x: -0.08, y: -0.02, z: -0.34, rx: -0.82, ry: 0.24, rz: 0.24 },
      muzzle: { x: 0.08, y: 0.03, z: -0.82 },
      speaker: true,
      stock: true,
      flashScale: 1.22
    };
  }
  if (weaponId === "mic_lancer") {
    return {
      ...base,
      frame: { x: 0.18, y: 0.12, z: 0.7 },
      slide: { x: 0.16, y: 0.08, z: 0.56 },
      barrelRadius: 0.02,
      barrelLength: 0.5,
      leftHand: { x: -0.03, y: -0.01, z: -0.42, rx: -0.84, ry: 0.22, rz: 0.22 },
      muzzle: { x: 0.08, y: 0.03, z: -0.96 },
      horn: true,
      flashScale: 1.14
    };
  }
  if (weaponId === "dubstep_cannon") {
    return {
      ...base,
      weapon: { x: 0.12, y: -0.08, z: -0.1, rx: 0.02, ry: -0.02, rz: 0 },
      frame: { x: 0.3, y: 0.22, z: 0.82 },
      slide: { x: 0.24, y: 0.1, z: 0.6 },
      barrelRadius: 0.042,
      barrelLength: 0.42,
      rightHand: { x: 0.16, y: -0.12, z: 0.08, rx: -0.98, ry: -0.24, rz: -0.18 },
      leftHand: { x: -0.06, y: 0.01, z: -0.42, rx: -0.78, ry: 0.2, rz: 0.16 },
      spriteLeft: { x: -0.28, y: -0.02, z: -0.22, rx: -0.4, ry: 0.2, rz: 0.14 },
      spriteRight: { x: 0.16, y: -0.18, z: 0.08, rx: -0.48, ry: -0.08, rz: -0.12 },
      muzzle: { x: 0.1, y: 0.04, z: -0.98 },
      speaker: true,
      stock: true,
      tank: true,
      flashScale: 1.5
    };
  }
  if (weaponId === "paint_sprayer") {
    return {
      ...base,
      frame: { x: 0.18, y: 0.16, z: 0.54 },
      slide: { x: 0.16, y: 0.08, z: 0.42 },
      barrelRadius: 0.018,
      barrelLength: 0.3,
      leftHand: { x: -0.04, y: -0.02, z: -0.28, rx: -0.82, ry: 0.28, rz: 0.3 },
      muzzle: { x: 0.08, y: 0.03, z: -0.74 },
      tank: true,
      flashScale: 1.08
    };
  }
  return base;
}

function createMeshArm(materials) {
  const group = new THREE.Group();
  const forearm = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.1, 0.44, 14),
    materials.sleeve
  );
  forearm.rotation.x = Math.PI * 0.5;
  forearm.position.z = -0.18;
  group.add(forearm);
  const cuff = new THREE.Mesh(
    new THREE.CylinderGeometry(0.1, 0.1, 0.07, 14),
    materials.trim
  );
  cuff.rotation.x = Math.PI * 0.5;
  cuff.position.z = -0.04;
  group.add(cuff);
  const hand = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    materials.skin
  );
  hand.scale.set(1.14, 0.76, 1.28);
  hand.position.set(0, -0.02, -0.42);
  group.add(hand);
  const thumb = new THREE.Mesh(
    new THREE.SphereGeometry(0.062, 12, 12),
    materials.skin
  );
  thumb.scale.set(1.1, 0.9, 1.2);
  thumb.position.set(0.08, -0.06, -0.35);
  group.add(thumb);
  group.userData.thumb = thumb;
  return group;
}

function createFirstPersonRig(camera) {
  const rig = new THREE.Group();
  rig.position.set(0.44, -0.34, -0.88);
  rig.rotation.set(-0.12, -0.15, -0.04);

  const weaponBodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#7dd3fc"),
    emissive: new THREE.Color("#6ee7ff"),
    emissiveIntensity: 0.18,
    roughness: 0.28,
    metalness: 0.54
  });
  const weaponAccentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#ecfeff"),
    emissive: new THREE.Color("#dbeafe"),
    emissiveIntensity: 0.08,
    roughness: 0.22,
    metalness: 0.72
  });
  const rigSkinMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#f5d0c5"),
    roughness: 0.56,
    metalness: 0.06
  });
  const rigSleeveMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#6ee7ff"),
    emissive: new THREE.Color("#38bdf8"),
    emissiveIntensity: 0.08,
    roughness: 0.46,
    metalness: 0.18
  });
  const rigTrimMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#1f2937"),
    roughness: 0.52,
    metalness: 0.36
  });
  const leftArm = createPaperCutoutPlane();
  leftArm.position.set(-0.32, -0.18, -0.12);
  leftArm.rotation.set(-0.4, 0.18, 0.18);
  rig.add(leftArm);
  const rightArm = createPaperCutoutPlane();
  rightArm.position.set(0.14, -0.2, 0.02);
  rightArm.rotation.set(-0.52, -0.08, -0.12);
  rig.add(rightArm);
  const legs = createPaperCutoutPlane();
  legs.position.set(0.0, -0.66, -0.18);
  legs.rotation.set(-0.36, 0, 0);
  rig.add(legs);

  const meshArmsRoot = new THREE.Group();
  rig.add(meshArmsRoot);
  const leftMeshArm = createMeshArm({ skin: rigSkinMaterial, sleeve: rigSleeveMaterial, trim: rigTrimMaterial });
  const rightMeshArm = createMeshArm({ skin: rigSkinMaterial, sleeve: rigSleeveMaterial, trim: rigTrimMaterial });
  meshArmsRoot.add(leftMeshArm);
  meshArmsRoot.add(rightMeshArm);

  const weapon = new THREE.Group();
  rig.add(weapon);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.14), weaponBodyMaterial);
  grip.position.set(0.05, -0.12, -0.08);
  grip.rotation.x = -0.28;
  weapon.add(grip);

  const frame = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.52), weaponBodyMaterial);
  frame.position.set(0.08, 0.0, -0.26);
  weapon.add(frame);

  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.42), weaponAccentMaterial);
  slide.position.set(0.08, 0.08, -0.23);
  slide.userData.baseZ = -0.23;
  weapon.add(slide);

  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.24, 12), weaponAccentMaterial);
  barrel.rotation.x = Math.PI * 0.5;
  barrel.position.set(0.08, 0.02, -0.48);
  weapon.add(barrel);

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.08), weaponAccentMaterial);
  sight.position.set(0.08, 0.14, -0.28);
  weapon.add(sight);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.16, 0.28), weaponBodyMaterial);
  stock.position.set(0.08, -0.02, 0.02);
  stock.visible = false;
  weapon.add(stock);

  const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.12), weaponAccentMaterial);
  magazine.position.set(0.06, -0.12, -0.18);
  weapon.add(magazine);

  const speakerLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 18), weaponAccentMaterial);
  speakerLeft.rotation.z = Math.PI * 0.5;
  speakerLeft.position.set(-0.08, 0.03, -0.28);
  speakerLeft.visible = false;
  weapon.add(speakerLeft);
  const speakerRight = speakerLeft.clone();
  speakerRight.position.x = 0.24;
  weapon.add(speakerRight);

  const discLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.024, 24), weaponAccentMaterial);
  discLeft.rotation.x = Math.PI * 0.5;
  discLeft.position.set(-0.02, 0.02, -0.34);
  discLeft.visible = false;
  weapon.add(discLeft);
  const discRight = discLeft.clone();
  discRight.position.x = 0.18;
  weapon.add(discRight);

  const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.22, 16), weaponAccentMaterial);
  horn.rotation.x = Math.PI * 0.5;
  horn.position.set(0.08, 0.02, -0.62);
  horn.visible = false;
  weapon.add(horn);

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 16), weaponBodyMaterial);
  tank.rotation.z = Math.PI * 0.5;
  tank.position.set(0.14, -0.14, -0.05);
  tank.visible = false;
  weapon.add(tank);

  const muzzleFlash = new THREE.Mesh(
    new THREE.PlaneGeometry(0.26, 0.18),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#fff4bf"),
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );
  muzzleFlash.position.set(0.08, 0.03, -0.62);
  muzzleFlash.visible = false;
  weapon.add(muzzleFlash);

  const muzzleGlow = new THREE.PointLight(new THREE.Color("#fff4bf"), 0, 4.5, 2);
  muzzleGlow.position.set(0.08, 0.04, -0.58);
  weapon.add(muzzleGlow);

  camera.add(rig);

  return {
    rig,
    weapon,
    leftArm,
    rightArm,
    legs,
    leftMeshArm,
    rightMeshArm,
    meshArmsRoot,
    slide,
    barrel,
    frame,
    stock,
    magazine,
    speakerLeft,
    speakerRight,
    discLeft,
    discRight,
    horn,
    tank,
    muzzleFlash,
    muzzleGlow,
    weaponBodyMaterial,
    weaponAccentMaterial,
    rigSkinMaterial,
    rigSleeveMaterial,
    rigTrimMaterial
  };
}

function buildOutdoorScene(group, world) {
  const buildingById = new Map((world.buildings || []).map((entry) => [entry.id, entry]));
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(world.width * WORLD_SCALE, world.height * WORLD_SCALE, 1, 1),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color("#050814"),
      roughness: 0.96,
      metalness: 0.04
    })
  );
  ground.rotation.x = -Math.PI * 0.5;
  group.add(ground);

  for (const district of world.districts || []) {
    const center = toWorld({ w: world.width, h: world.height }, district.x + district.w * 0.5, district.y + district.h * 0.5);
    const tile = new THREE.Mesh(
      new THREE.PlaneGeometry(district.w * WORLD_SCALE, district.h * WORLD_SCALE, 1, 1),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(district.base, "#101826"),
        emissive: rgbaToColor(district.glow, "#38bdf8"),
        emissiveIntensity: 0.22,
        roughness: 0.92,
        metalness: 0.04
      })
    );
    tile.rotation.x = -Math.PI * 0.5;
    tile.position.set(center.x, 0.02, center.z);
    group.add(tile);
  }

  for (const segment of buildRoadSegments(world.roadNodes || [])) {
    const dx = segment.b.x - segment.a.x;
    const dy = segment.b.y - segment.a.y;
    const length = Math.hypot(dx, dy) * WORLD_SCALE;
    const center = toWorld({ w: world.width, h: world.height }, (segment.a.x + segment.b.x) * 0.5, (segment.a.y + segment.b.y) * 0.5);
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.04, 4.4),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#161c2d"),
        roughness: 0.84,
        metalness: 0.08
      })
    );
    road.position.set(center.x, 0.03, center.z);
    road.rotation.y = -Math.atan2(dy, dx);
    group.add(road);

    const stripe = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.98, 0.02, 0.12),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#f8e7a1"),
        transparent: true,
        opacity: 0.42
      })
    );
    stripe.position.set(center.x, 0.07, center.z);
    stripe.rotation.y = road.rotation.y;
    group.add(stripe);
  }

  for (const building of world.buildings || []) {
    const center = toWorld({ w: world.width, h: world.height }, building.x + building.w * 0.5, building.y + building.h * 0.5);
    const height = clamp(building.h * 0.09, 9, 28);
    const shell = new THREE.Mesh(
      new THREE.BoxGeometry(building.w * WORLD_SCALE, height, building.h * WORLD_SCALE),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(building.fill, "#1d2646"),
        emissive: rgbaToColor(building.roof, "#33457a"),
        emissiveIntensity: 0.1,
        roughness: 0.82,
        metalness: 0.14
      })
    );
    shell.position.set(center.x, height * 0.5, center.z);
    group.add(shell);

    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(building.w * WORLD_SCALE * 0.92, 0.42, building.h * WORLD_SCALE * 0.92),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(building.roof, "#33457a"),
        emissive: rgbaToColor(building.roof, "#33457a"),
        emissiveIntensity: 0.14,
        roughness: 0.54,
        metalness: 0.28
      })
    );
    roof.position.set(center.x, height + 0.24, center.z);
    group.add(roof);

    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(clamp(building.w * WORLD_SCALE * 0.46, 3.6, 7.6), 1.16),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#eef6ff"),
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide
      })
    );
    sign.position.set(center.x, height * 0.68, center.z + building.h * WORLD_SCALE * 0.51);
    group.add(sign);
  }

  for (const route of world.climbRoutes || []) {
    const building = buildingById.get(route.buildingId);
    if (!building) continue;
    const center = toWorld({ w: world.width, h: world.height }, building.x + building.w * 0.5, building.y + building.h * 0.5);
    const ladder = new THREE.Group();
    const ladderHeight = Math.max(4.2, Math.abs(route.y2 - route.y1) * VERTICAL_SCALE * 0.92);
    const railOffset = 0.28;
    const railMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#f5e7ff"),
      emissive: new THREE.Color("#c084fc"),
      emissiveIntensity: 0.34,
      roughness: 0.32,
      metalness: 0.58
    });
    const rungMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#efe2ff"),
      emissive: new THREE.Color("#d8b4fe"),
      emissiveIntensity: 0.24,
      roughness: 0.28,
      metalness: 0.48
    });
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(0.98, ladderHeight + 0.3),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#c084fc"),
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    glow.position.set(0, ladderHeight * 0.5, -0.03);
    ladder.add(glow);
    for (const railX of [-railOffset, railOffset]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.1, ladderHeight, 0.09), railMaterial);
      rail.position.set(railX, ladderHeight * 0.5, 0);
      ladder.add(rail);
    }
    const rungCount = Math.max(4, Math.round(ladderHeight / 0.56));
    for (let i = 0; i < rungCount; i++) {
      const rung = new THREE.Mesh(new THREE.BoxGeometry(railOffset * 2 - 0.08, 0.08, 0.08), rungMaterial);
      rung.position.set(0, 0.22 + (i / Math.max(1, rungCount - 1)) * (ladderHeight - 0.44), 0);
      ladder.add(rung);
    }
    const anchor = toWorld({ w: world.width, h: world.height }, route.x, (route.y1 + route.y2) * 0.5);
    if (route.side === "south") {
      ladder.position.set(center.x + (anchor.x - center.x), 0.08, center.z + building.h * WORLD_SCALE * 0.62);
    } else if (route.side === "west") {
      ladder.position.set(center.x - building.w * WORLD_SCALE * 0.62, 0.08, anchor.z);
      ladder.rotation.y = -Math.PI * 0.5;
    } else if (route.side === "east") {
      ladder.position.set(center.x + building.w * WORLD_SCALE * 0.62, 0.08, anchor.z);
      ladder.rotation.y = Math.PI * 0.5;
    } else {
      ladder.position.set(anchor.x, 0.08, center.z - building.h * WORLD_SCALE * 0.62);
      ladder.rotation.y = Math.PI;
    }
    group.add(ladder);
  }
}

function buildInteriorGroup(spec) {
  const group = new THREE.Group();
  const bounds = { w: spec.w, h: spec.h };
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w * WORLD_SCALE, spec.h * WORLD_SCALE),
    new THREE.MeshStandardMaterial({
      color: rgbaToColor(spec.floor, "#0f172a"),
      emissive: rgbaToColor(spec.accent, "#38bdf8"),
      emissiveIntensity: 0.06,
      roughness: 0.88,
      metalness: 0.1
    })
  );
  floor.rotation.x = -Math.PI * 0.5;
  group.add(floor);

  const wallMaterial = new THREE.MeshStandardMaterial({
    color: rgbaToColor(spec.wall, "#162038"),
    emissive: rgbaToColor(spec.accent, "#38bdf8"),
    emissiveIntensity: 0.08,
    roughness: 0.86,
    metalness: 0.12
  });
  const wallHeight = 4.2;
  const north = new THREE.Mesh(new THREE.BoxGeometry(spec.w * WORLD_SCALE, wallHeight, 0.28), wallMaterial);
  north.position.set(0, wallHeight * 0.5, -spec.h * WORLD_SCALE * 0.5);
  group.add(north);
  const south = north.clone();
  south.position.z = spec.h * WORLD_SCALE * 0.5;
  group.add(south);
  const west = new THREE.Mesh(new THREE.BoxGeometry(0.28, wallHeight, spec.h * WORLD_SCALE), wallMaterial);
  west.position.set(-spec.w * WORLD_SCALE * 0.5, wallHeight * 0.5, 0);
  group.add(west);
  const east = west.clone();
  east.position.x = spec.w * WORLD_SCALE * 0.5;
  group.add(east);

  for (const rect of spec.colliders || []) {
    const center = toWorld(bounds, rect.x + rect.w * 0.5, rect.y + rect.h * 0.5);
    const prop = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.3, rect.w * WORLD_SCALE), clamp(rect.h * WORLD_SCALE * 0.2, 0.5, 1.8), Math.max(0.3, rect.h * WORLD_SCALE)),
      new THREE.MeshStandardMaterial({
        color: rgbaToColor(spec.prop || spec.accent, "#60a5fa"),
        emissive: rgbaToColor(spec.accent, "#38bdf8"),
        emissiveIntensity: 0.05,
        roughness: 0.7,
        metalness: 0.14
      })
    );
    prop.position.set(center.x, clamp(rect.h * WORLD_SCALE * 0.1, 0.25, 0.9), center.z);
    group.add(prop);
  }

  return group;
}

function createLookupMap(scene, factory) {
  const map = new Map();
  return {
    update(entries, onUpdate) {
      const live = new Set();
      for (const entry of entries) {
        const key = entry.id;
        if (!key) continue;
        live.add(key);
        let object = map.get(key);
        if (!object) {
          object = factory(entry);
          scene.add(object);
          map.set(key, object);
        }
        onUpdate(object, entry);
      }
      for (const [key, object] of map.entries()) {
        if (live.has(key)) continue;
        scene.remove(object);
        if (object.material && object.material.map) object.material.map.dispose?.();
        object.material?.dispose?.();
        map.delete(key);
      }
    },
    clear() {
      for (const object of map.values()) scene.remove(object);
      map.clear();
    }
  };
}

export async function createMascotOpenWorld3DRenderer(host, config) {
  const world = config && config.world ? config.world : {};
  const interiors = Array.isArray(world.interiors) ? world.interiors : [];
  const interiorById = new Map(interiors.map((entry) => [entry.id, entry]));

  const renderer = new THREE.WebGPURenderer({
    antialias: true,
    alpha: false
  });
  await renderer.init();
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  host.innerHTML = "";
  host.style.position = "absolute";
  host.style.inset = "0";
  host.style.overflow = "hidden";
  host.style.borderRadius = "10px";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  renderer.domElement.style.display = "block";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#040912");
  scene.fog = new THREE.FogExp2(new THREE.Color("#050814"), 0.03);

  const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 500);
  camera.position.set(0, 6.5, 18);
  scene.add(camera);

  const hemi = new THREE.HemisphereLight(new THREE.Color("#8ac8ff"), new THREE.Color("#08101a"), 1.18);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(new THREE.Color("#f8fbff"), 1.8);
  keyLight.position.set(18, 28, 10);
  scene.add(keyLight);

  const neonFill = new THREE.PointLight(new THREE.Color("#38bdf8"), 9, 110, 2);
  neonFill.position.set(-12, 11, 16);
  scene.add(neonFill);

  const magentaFill = new THREE.PointLight(new THREE.Color("#fb7185"), 7, 95, 2);
  magentaFill.position.set(12, 9, -18);
  scene.add(magentaFill);

  const outdoorGroup = new THREE.Group();
  buildOutdoorScene(outdoorGroup, world);
  scene.add(outdoorGroup);

  const interiorGroups = new Map();
  for (const interior of interiors) {
    const group = buildInteriorGroup(interior);
    group.visible = false;
    interiorGroups.set(interior.id, group);
    scene.add(group);
  }

  const objectiveMarker = new THREE.Group();
  const markerColumn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.28, 4.8, 18),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#6ee7ff"),
      transparent: true,
      opacity: 0.3
    })
  );
  markerColumn.position.y = 2.4;
  objectiveMarker.add(markerColumn);
  const markerRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.08, 14, 32),
    new THREE.MeshBasicMaterial({
      color: new THREE.Color("#f8fbff"),
      transparent: true,
      opacity: 0.65
    })
  );
  markerRing.rotation.x = Math.PI * 0.5;
  markerRing.position.y = 0.08;
  objectiveMarker.add(markerRing);
  scene.add(objectiveMarker);

  const actors = createLookupMap(scene, createActorSprite);
  const vehicles = createLookupMap(scene, (entry) => createVehicleMesh(entry.spec));
  const pickups = createLookupMap(scene, (entry) => createPickupMesh(entry.color));
  const fpRig = createFirstPersonRig(camera);

  const resizeObserver = new ResizeObserver(() => {
    const width = Math.max(1, host.clientWidth || 1);
    const height = Math.max(1, host.clientHeight || 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(host);
  const width = Math.max(1, host.clientWidth || 1);
  const height = Math.max(1, host.clientHeight || 1);
  renderer.setSize(width, height, false);

  const focus = new THREE.Vector3(0, 1.6, 0);
  let yaw = 0;
  let lastSnapshotTime = 0;

  function placeObject(object, bounds, x, y, lift, facingYaw) {
    const point = toWorld(bounds, x, y);
    object.position.set(point.x, lift || 0, point.z);
    if (typeof facingYaw === "number") object.rotation.y = -facingYaw;
  }

  function roofData(roofId) {
    if (!roofId) return null;
    const building = (world.buildings || []).find((b) => b.id === roofId);
    if (!building) return null;
    return {
      physicsHeight: clamp(building.h * 0.09, 9, 28) * 16,
      worldLift: clamp(building.h * 0.09, 9, 28) + 0.42
    };
  }

  function liftFromJump(jumpValue, roofId, attached) {
    const jump = Math.max(0, Number(jumpValue) || 0);
    const roof = roofData(roofId);
    if (!roof) return jump * VERTICAL_SCALE;
    if (attached) return roof.worldLift + jump * VERTICAL_SCALE;
    if (jump <= roof.physicsHeight) return roof.physicsHeight > 0 ? roof.worldLift * (jump / roof.physicsHeight) : 0;
    return roof.worldLift + (jump - roof.physicsHeight) * VERTICAL_SCALE;
  }

  function updateCamera(snapshot) {
    const sampleTime = Number(snapshot.time) || 0;
    const dt = lastSnapshotTime && sampleTime > lastSnapshotTime
      ? clamp(sampleTime - lastSnapshotTime, 1 / 240, 1 / 20)
      : 1 / 60;
    lastSnapshotTime = sampleTime || lastSnapshotTime;
    const bounds = snapshot.bounds || { w: world.width || 1, h: world.height || 1 };
    const focusTarget = toWorld(bounds, snapshot.anchor.x, snapshot.anchor.y);
    const currentYaw = Number(snapshot.focusAngle) || 0;
    yaw = lerpAngle(yaw, currentYaw, smoothAlpha(dt, snapshot.cameraMode === "first-person" ? 22 : 13));
    const playerLift = snapshot.playerRoofId
      ? (snapshot.playerJump || 0)
      : (snapshot.playerJumpAbsolute || 0);
    const lift = liftFromJump(playerLift, snapshot.playerSupportRoofId || snapshot.playerRoofId, !!snapshot.playerRoofId);
    const indoor = !!snapshot.interiorId;
    const playerSpeed = clamp((snapshot.playerSpeed || 0) / 220, 0, 1);
    const vehicleSpeed = clamp((snapshot.vehicleSpeed || 0) / 320, 0, 1);
    const moveFactor = snapshot.playerMode === "vehicle" ? vehicleSpeed : playerSpeed;
    const bob = Math.sin((snapshot.time || 0) * (snapshot.playerMode === "vehicle" ? 12 : 8.5)) * (snapshot.playerMode === "vehicle" ? 0.08 : 0.035) * moveFactor;

    if (snapshot.cameraMode === "first-person") {
      const vehicleView = snapshot.playerMode === "vehicle";
      const wallView = snapshot.playerMode === "wall";
      const ceilingView = snapshot.playerMode === "ceiling";
      const eyeHeight = (vehicleView ? 1.42 : wallView ? 1.56 : ceilingView ? 1.48 : 1.72) + lift;
      const eyeOffset = vehicleView ? 1.2 : wallView ? -0.56 : ceilingView ? 0.12 : 0.28;
      const lookDistance = vehicleView ? 8.6 : wallView ? 3.9 : ceilingView ? 4.4 : 4.8;
      const pitch = snapshot.lookPitch || 0;
      const horizDist = lookDistance * Math.cos(pitch);
      const vertDist = lookDistance * Math.sin(pitch);
      camera.position.lerp(
        new THREE.Vector3(
          focusTarget.x + Math.cos(yaw) * eyeOffset,
          eyeHeight + bob,
          focusTarget.z + Math.sin(yaw) * eyeOffset
        ),
        smoothAlpha(dt, vehicleView ? 18 : 22)
      );
      focus.set(
        focusTarget.x + Math.cos(yaw) * horizDist,
        eyeHeight + bob * 0.45 + vertDist,
        focusTarget.z + Math.sin(yaw) * horizDist
      );
    } else {
      const chaseDistance = indoor ? 7.4 : snapshot.playerMode === "vehicle" ? 12.4 : 10.8;
      const chaseHeight = (indoor ? 3.7 : snapshot.playerMode === "vehicle" ? 4.6 : 5.1) + lift;
      const lead = (snapshot.playerMode === "vehicle" ? vehicleSpeed * 2.1 : playerSpeed * 1.25) * (indoor ? 0.35 : 1);
      const offsetX = Math.cos(yaw) * chaseDistance;
      const offsetZ = Math.sin(yaw) * chaseDistance;
      camera.position.lerp(
        new THREE.Vector3(
          focusTarget.x - offsetX + Math.cos(yaw) * lead,
          chaseHeight,
          focusTarget.z - offsetZ + Math.sin(yaw) * lead
        ),
        smoothAlpha(dt, snapshot.playerMode === "vehicle" ? 9 : 11)
      );
      focus.set(
        focusTarget.x + Math.cos(yaw) * (1.4 + lead * 0.45),
        1.8 + lift + bob * 0.18,
        focusTarget.z + Math.sin(yaw) * (1.4 + lead * 0.45)
      );
    }

    camera.lookAt(focus);
  }

  function applyWeaponProfile(weaponId) {
    const profile = weaponViewProfile(weaponId);
    fpRig.weapon.position.set(profile.weapon.x, profile.weapon.y, profile.weapon.z);
    fpRig.weapon.rotation.set(profile.weapon.rx, profile.weapon.ry, profile.weapon.rz);
    fpRig.frame.scale.set(profile.frame.x / 0.18, profile.frame.y / 0.14, profile.frame.z / 0.52);
    fpRig.frame.position.set(0.08, 0, -profile.frame.z * 0.5);
    fpRig.slide.scale.set(profile.slide.x / 0.16, profile.slide.y / 0.08, profile.slide.z / 0.42);
    fpRig.slide.position.set(0.08, 0.08, -profile.slide.z * 0.55);
    fpRig.slide.userData.baseZ = -profile.slide.z * 0.55;
    fpRig.barrel.scale.set(profile.barrelRadius / 0.025, profile.barrelRadius / 0.025, profile.barrelLength / 0.24);
    fpRig.barrel.position.set(0.08, 0.02, -0.38 - profile.barrelLength * 0.5);
    fpRig.stock.visible = profile.stock;
    fpRig.stock.position.set(0.08, -0.02, 0.08);
    fpRig.speakerLeft.visible = profile.speaker;
    fpRig.speakerRight.visible = profile.speaker;
    fpRig.speakerLeft.position.set(-0.08, 0.03, -profile.frame.z * 0.4);
    fpRig.speakerRight.position.set(0.24, 0.03, -profile.frame.z * 0.4);
    fpRig.discLeft.visible = profile.discs;
    fpRig.discRight.visible = profile.discs;
    fpRig.discLeft.position.set(-0.02, 0.02, -profile.frame.z * 0.56);
    fpRig.discRight.position.set(0.18, 0.02, -profile.frame.z * 0.56);
    fpRig.horn.visible = profile.horn;
    fpRig.horn.position.set(profile.muzzle.x, profile.muzzle.y, profile.muzzle.z + 0.06);
    fpRig.tank.visible = profile.tank;
    fpRig.magazine.position.set(0.06, -0.12, -Math.min(profile.frame.z * 0.36, 0.28));
    fpRig.muzzleFlash.position.set(profile.muzzle.x, profile.muzzle.y, profile.muzzle.z);
    fpRig.muzzleGlow.position.set(profile.muzzle.x, profile.muzzle.y + 0.01, profile.muzzle.z + 0.04);
    fpRig.weapon.userData.viewProfile = profile;
    return profile;
  }

  function setMeshArmPose(arm, pose, side) {
    if (!arm || !pose) return;
    arm.position.set(pose.x, pose.y, pose.z);
    arm.rotation.set(pose.rx, pose.ry, pose.rz);
    if (arm.userData.thumb) arm.userData.thumb.position.x = side === "left" ? -0.08 : 0.08;
  }

  function updateFirstPersonRig(snapshot) {
    const visible = snapshot.cameraMode === "first-person";
    fpRig.rig.visible = visible;
    if (!visible) return;
    const runtime = snapshot.runtime;
    const weaponColors = weaponPalette(snapshot.currentWeaponId);
    const mascotPalette = rigPaletteColors(runtime, snapshot.selectedPackId || "");
    fpRig.weaponBodyMaterial.color.copy(weaponColors.body);
    fpRig.weaponBodyMaterial.emissive.copy(weaponColors.glow);
    fpRig.weaponAccentMaterial.color.copy(weaponColors.accent);
    fpRig.weaponAccentMaterial.emissive.copy(weaponColors.glow);
    fpRig.rigSkinMaterial.color.copy(mascotPalette.skin);
    fpRig.rigSleeveMaterial.color.copy(mascotPalette.cloth);
    fpRig.rigSleeveMaterial.emissive.copy(mascotPalette.accent);
    fpRig.rigTrimMaterial.color.copy(mascotPalette.trim);
    const movePulse = Math.sin((snapshot.time || 0) * (snapshot.playerMode === "vehicle" ? 8.2 : 6.8));
    const sway = (snapshot.playerMode === "vehicle" ? snapshot.vehicleSpeed || 0 : snapshot.playerSpeed || 0) / (snapshot.playerMode === "vehicle" ? 320 : 220);
    const kick = clamp(snapshot.shotKick || 0, 0, 1.6);
    const pitch = snapshot.lookPitch || 0;
    const vehicleView = snapshot.playerMode === "vehicle";
    const climbing = snapshot.playerMode === "wall" || snapshot.playerMode === "ceiling";
    const useMeshHands = snapshot.firstPersonRigStyle === "mesh";
    const profile = resolveFirstPersonProfile(snapshot.selectedPackId || "", vehicleView);
    const weaponProfile = applyWeaponProfile(snapshot.currentWeaponId);
    const armAction = climbing
      ? (snapshot.playerMode === "wall" ? "wallClimb" : "ceilingClimb")
      : snapshot.shotPulse > 0.08
      ? "throwCarry"
      : vehicleView
      ? "sit"
      : (snapshot.playerJump || 0) > 8
      ? "jump"
      : (snapshot.playerSpeed || 0) > 130
      ? "run"
      : (snapshot.playerSpeed || 0) > 18
      ? "walk"
      : "idle";
    const weaponPose = runtime && typeof runtime.sampleFrame === "function"
      ? runtime.sampleFrame(armAction, snapshot.time || 0, vehicleView ? 1.18 : snapshot.playerMode === "wall" ? 1.06 : 1)
      : null;
    const legsPose = !vehicleView && !climbing && runtime && typeof runtime.sampleFrame === "function"
      ? runtime.sampleFrame(
          (snapshot.playerJump || 0) > 8 ? "jump" : (snapshot.playerSpeed || 0) > 130 ? "run" : (snapshot.playerSpeed || 0) > 18 ? "walk" : "idle",
          snapshot.time || 0,
          (snapshot.playerSpeed || 0) > 130 ? 1.2 : 1
        )
      : null;
    fpRig.rig.position.set(
      profile.rig.x,
      profile.rig.y + movePulse * 0.01 * sway - kick * 0.035 + pitch * 0.08 + (climbing ? 0.04 : 0),
      profile.rig.z + kick * 0.11 + (climbing ? 0.08 : 0)
    );
    fpRig.rig.rotation.set(
      profile.rig.rx - kick * 0.18 - pitch * 0.32 + (climbing ? 0.1 : 0),
      profile.rig.ry - movePulse * 0.02 * sway,
      profile.rig.rz + movePulse * 0.015 * sway
    );
    fpRig.weapon.visible = !climbing;
    if (!climbing) {
      fpRig.weapon.position.x = weaponProfile.weapon.x + movePulse * 0.008 * sway;
      fpRig.weapon.position.y = weaponProfile.weapon.y - kick * 0.05 + pitch * 0.035;
      fpRig.weapon.position.z = weaponProfile.weapon.z + kick * 0.12;
      fpRig.weapon.rotation.x = weaponProfile.weapon.rx - kick * 0.12;
      fpRig.weapon.rotation.y = weaponProfile.weapon.ry - movePulse * 0.012 * sway;
      fpRig.weapon.rotation.z = weaponProfile.weapon.rz + movePulse * 0.014 * sway;
    }
    const leftVisible = updatePaperCutoutPlane(fpRig.leftArm, runtime, weaponPose, profile.leftArm.crop, {
      scale: profile.leftArm.scale * 1.02,
      padding: (profile.leftArm.padding || 0) + 0.06,
      shadowOpacity: profile.leftArm.shadowOpacity
    });
    const rightVisible = updatePaperCutoutPlane(fpRig.rightArm, runtime, weaponPose, profile.rightArm.crop, {
      scale: profile.rightArm.scale * 1.04,
      padding: (profile.rightArm.padding || 0) + 0.06,
      shadowOpacity: profile.rightArm.shadowOpacity
    });
    fpRig.leftArm.visible = leftVisible && !useMeshHands && !climbing;
    fpRig.rightArm.visible = rightVisible && !useMeshHands && !climbing;
    if (fpRig.leftArm.visible) {
      fpRig.leftArm.position.set(
        weaponProfile.spriteLeft.x,
        weaponProfile.spriteLeft.y + movePulse * 0.012 * sway + Math.max(0, -pitch) * 0.03 + (climbing ? -0.02 : 0),
        weaponProfile.spriteLeft.z
      );
      fpRig.leftArm.rotation.set(
        weaponProfile.spriteLeft.rx + (climbing && snapshot.playerMode === "ceiling" ? -0.18 : 0),
        weaponProfile.spriteLeft.ry,
        weaponProfile.spriteLeft.rz + movePulse * 0.016 * sway
      );
    }
    if (fpRig.rightArm.visible) {
      fpRig.rightArm.position.set(
        weaponProfile.spriteRight.x,
        weaponProfile.spriteRight.y - kick * 0.03 + pitch * 0.04 + (climbing ? -0.02 : 0),
        weaponProfile.spriteRight.z
      );
      fpRig.rightArm.rotation.set(
        weaponProfile.spriteRight.rx + (climbing ? -0.08 : 0),
        weaponProfile.spriteRight.ry,
        weaponProfile.spriteRight.rz - movePulse * 0.015 * sway
      );
    }
    fpRig.meshArmsRoot.visible = useMeshHands && !climbing;
    if (useMeshHands) {
      if (climbing) {
        setMeshArmPose(fpRig.leftMeshArm, { x: -0.18, y: -0.04, z: -0.3, rx: -0.72, ry: 0.12, rz: snapshot.playerMode === "ceiling" ? -0.34 : 0.22 }, "left");
        setMeshArmPose(fpRig.rightMeshArm, { x: 0.18, y: -0.04, z: -0.28, rx: -0.72, ry: -0.12, rz: snapshot.playerMode === "ceiling" ? 0.34 : -0.22 }, "right");
      } else {
        setMeshArmPose(fpRig.leftMeshArm, weaponProfile.leftHand, "left");
        setMeshArmPose(fpRig.rightMeshArm, weaponProfile.rightHand, "right");
        fpRig.leftMeshArm.position.y += movePulse * 0.012 * sway;
        fpRig.rightMeshArm.position.y -= kick * 0.028;
      }
    }
    const showLegs = updatePaperCutoutPlane(fpRig.legs, runtime, legsPose, profile.legs.crop, {
      scale: profile.legs.scale * 1.02,
      padding: (profile.legs.padding || 0) + 0.04,
      shadowOpacity: profile.legs.shadowOpacity
    });
    fpRig.legs.visible = showLegs && !vehicleView && !climbing;
    if (fpRig.legs.visible) {
      const legVisibility = clamp(0.18 + Math.max(0, -pitch) * 0.9 + sway * 0.32, 0.16, 0.86);
      fpRig.legs.userData.mesh.material.opacity = legVisibility;
      fpRig.legs.userData.shadow.material.opacity = Math.min(0.38, legVisibility * 0.45);
      fpRig.legs.position.set(
        profile.legs.x,
        profile.legs.y + Math.max(0, -pitch) * 0.12 + movePulse * 0.012 * sway,
        profile.legs.z
      );
      fpRig.legs.rotation.set(
        profile.legs.rx - Math.max(0, -pitch) * 0.1,
        profile.legs.ry,
        profile.legs.rz
      );
    }
    fpRig.slide.position.z = fpRig.slide.userData.baseZ + (snapshot.shotPulse || 0) * 0.08;
    fpRig.muzzleFlash.visible = !climbing && (snapshot.shotPulse || 0) > 0.04;
    fpRig.muzzleFlash.material.opacity = (snapshot.shotPulse || 0) * 0.92;
    fpRig.muzzleFlash.material.color.copy(weaponColors.accent);
    fpRig.muzzleFlash.scale.set(
      1 + (snapshot.shotPulse || 0) * 1.8 * weaponProfile.flashScale,
      1 + (snapshot.shotPulse || 0) * 0.8 * weaponProfile.flashScale,
      1
    );
    fpRig.muzzleGlow.color.copy(weaponColors.accent);
    fpRig.muzzleGlow.intensity = climbing ? 0 : (snapshot.shotPulse || 0) * 8;
  }

  function renderFrame(snapshot) {
    const bounds = snapshot.bounds || { w: world.width || 1, h: world.height || 1 };
    const interiorId = snapshot.interiorId || "";
    outdoorGroup.visible = !interiorId;
    for (const [id, group] of interiorGroups) group.visible = id === interiorId;

    const accentColor = rgbaToColor(snapshot.missionTheme, "#6ee7ff");
    neonFill.color.copy(accentColor);
    neonFill.intensity = 8 + (snapshot.notoriety || 0) * 1.2;
    markerColumn.material.color.copy(accentColor);
    markerRing.material.color.copy(new THREE.Color("#ffffff"));
    markerRing.material.opacity = 0.45 + Math.sin(snapshot.pulse || 0) * 0.12;
    markerRing.scale.setScalar(1 + Math.sin(snapshot.pulse || 0) * 0.1);

    const actorBounds = interiorId && interiorById.has(interiorId)
      ? { w: interiorById.get(interiorId).w, h: interiorById.get(interiorId).h }
      : bounds;

    actors.update(snapshot.actors || [], (sprite, actor) => {
      updateActorSprite(sprite, actor, snapshot.runtime);
      if (!sprite.visible) return;
      const actorLift = actor.roofId ? (actor.jumpZ || 0) : (actor.jumpAbsolute || 0);
      const y = liftFromJump(actorLift, actor.supportRoofId || actor.roofId, !!actor.roofId);
      const point = toWorld(actorBounds, actor.x, actor.y);
      sprite.position.set(point.x, y, point.z);
    });

    vehicles.update(snapshot.vehicles || [], (mesh, vehicle) => {
      const point = toWorld(bounds, vehicle.x, vehicle.y);
      mesh.position.set(point.x, 0, point.z);
      mesh.rotation.y = -vehicle.angle;
      mesh.visible = !interiorId && !(snapshot.cameraMode === "first-person" && snapshot.playerVehicleId && vehicle.id === snapshot.playerVehicleId);
      if (mesh.userData.glow) mesh.userData.glow.material.opacity = vehicle.highlight > 0 ? 0.28 : 0.14;
      if (mesh.userData.lightbar) mesh.userData.lightbar.material.color.set(Math.sin((snapshot.time || 0) * 8) > 0 ? "#60a5fa" : "#ef4444");
    });

    pickups.update(snapshot.pickups || [], (mesh, pickup) => {
      const point = toWorld(actorBounds, pickup.x, pickup.y);
      mesh.position.set(point.x, 0, point.z);
      const bob = Math.sin((pickup.bob || 0) + (snapshot.time || 0) * 2.2) * 0.18;
      mesh.userData.orb.position.y = 1.42 + bob;
      mesh.userData.halo.rotation.z = (snapshot.time || 0) * 0.9;
      mesh.visible = pickup.visible !== false;
    });

    if (snapshot.objectiveMarker) {
      const point = toWorld(actorBounds, snapshot.objectiveMarker.x, snapshot.objectiveMarker.y);
      objectiveMarker.visible = true;
      objectiveMarker.position.set(point.x, snapshot.objectiveMarker.roofId ? liftFromJump(0, snapshot.objectiveMarker.roofId, true) : 0, point.z);
    } else {
      objectiveMarker.visible = false;
    }

    updateCamera(snapshot);
    updateFirstPersonRig(snapshot);
    renderer.render(scene, camera);
  }

  function destroy() {
    resizeObserver.disconnect();
    actors.clear();
    vehicles.clear();
    pickups.clear();
    renderer.dispose();
    host.innerHTML = "";
  }

  return {
    renderFrame,
    destroy
  };
}
