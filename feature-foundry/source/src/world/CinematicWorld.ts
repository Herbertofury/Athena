import * as THREE from "three";

type ThemeId = "frutiger" | "frawgy" | string;

type AnimatedObject = THREE.Object3D & {
  userData: {
    baseY?: number;
    phase?: number;
    drift?: number;
    spin?: number;
    [key: string]: unknown;
  };
};

const vertexSky = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentSky = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uFrawgy;
  uniform float uEnergy;

  float glow(vec2 uv, vec2 point, float radius) {
    return radius / max(radius, length(uv - point));
  }

  void main() {
    vec3 aeroTop = vec3(0.025, 0.42, 0.78);
    vec3 aeroHorizon = vec3(0.34, 0.82, 0.96);
    vec3 aeroFloor = vec3(0.12, 0.48, 0.50);
    vec3 frogTop = vec3(0.025, 0.075, 0.055);
    vec3 frogHorizon = vec3(0.18, 0.29, 0.20);
    vec3 frogFloor = vec3(0.055, 0.12, 0.075);
    vec3 topColor = mix(aeroTop, frogTop, uFrawgy);
    vec3 horizonColor = mix(aeroHorizon, frogHorizon, uFrawgy);
    vec3 floorColor = mix(aeroFloor, frogFloor, uFrawgy);
    float horizon = smoothstep(0.0, 0.57, vUv.y);
    vec3 color = mix(floorColor, horizonColor, horizon);
    color = mix(color, topColor, smoothstep(0.58, 1.0, vUv.y));
    vec2 sunPoint = mix(vec2(0.68, 0.76), vec2(0.52, 0.72), uFrawgy);
    vec3 sunColor = mix(vec3(0.78, 0.96, 1.0), vec3(1.0, 0.82, 0.44), uFrawgy);
    float sun = glow(vUv, sunPoint, 0.012) * (0.12 + uEnergy * 0.025);
    color += sunColor * min(sun, 0.62);
    float mist = sin(vUv.x * 15.0 + uTime * 0.06) * 0.015 + 0.03;
    color += mix(vec3(0.18, 0.72, 0.76), vec3(0.36, 0.28, 0.12), uFrawgy)
      * mist * smoothstep(0.34, 0.68, vUv.y) * (1.0 - smoothstep(0.67, 0.84, vUv.y));
    float vignette = smoothstep(0.86, 0.34, distance(vUv, vec2(0.5, 0.53)));
    color *= 0.72 + vignette * 0.34;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const vertexWater = /* glsl */ `
  varying vec2 vUv;
  varying float vWave;
  uniform float uTime;
  uniform float uEnergy;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(p.x * 1.25 + uTime * 0.85) * 0.045;
    wave += cos(p.y * 1.7 - uTime * 0.62) * 0.035;
    wave += sin((p.x + p.y) * 2.15 + uTime * 1.1) * 0.018 * (1.0 + uEnergy * 0.15);
    p.z += wave;
    vWave = wave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentWater = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  varying float vWave;
  uniform float uTime;
  uniform float uFrawgy;
  uniform float uEnergy;
  void main() {
    vec3 aeroNear = vec3(0.015, 0.34, 0.48);
    vec3 aeroFar = vec3(0.21, 0.80, 0.86);
    vec3 frogNear = vec3(0.025, 0.11, 0.075);
    vec3 frogFar = vec3(0.16, 0.29, 0.18);
    vec3 color = mix(mix(aeroNear, aeroFar, vUv.y), mix(frogNear, frogFar, vUv.y), uFrawgy);
    float ripple = sin(vUv.y * 120.0 + uTime * 2.0 + sin(vUv.x * 16.0) * 2.0);
    float caustic = smoothstep(0.87, 1.0, ripple) * (0.07 + uEnergy * 0.015);
    vec3 highlight = mix(vec3(0.55, 0.96, 1.0), vec3(0.95, 0.78, 0.42), uFrawgy);
    color += highlight * caustic;
    color += abs(vWave) * highlight * 0.9;
    float edge = smoothstep(0.0, 0.16, vUv.y) * smoothstep(1.0, 0.80, vUv.y);
    gl_FragColor = vec4(color, 0.74 * edge + 0.1);
  }
`;

function seededRandom(seed = 24): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function setGroupOpacity(group: THREE.Group, opacity: number): void {
  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line)) return;
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    for (const material of materials) {
      material.transparent = opacity < 0.999 || material.transparent;
      const intrinsic = typeof material.userData.intrinsicOpacity === "number"
        ? material.userData.intrinsicOpacity
        : material.opacity;
      material.userData.intrinsicOpacity = intrinsic;
      material.opacity = intrinsic * opacity;
      material.depthWrite = material.opacity > 0.72;
    }
  });
}

export class CinematicWorld {
  readonly canvas: HTMLCanvasElement;
  readonly supported: boolean;

  private readonly host: HTMLElement;
  private renderer: THREE.WebGLRenderer | null = null;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(48, 1, 0.1, 120);
  private readonly frutigerGroup = new THREE.Group();
  private readonly frawgyGroup = new THREE.Group();
  private readonly dynamicObjects: AnimatedObject[] = [];
  private readonly skyUniforms = {
    uTime: { value: 0 },
    uFrawgy: { value: 0 },
    uEnergy: { value: 0 },
  };
  private readonly waterUniforms = {
    uTime: { value: 0 },
    uFrawgy: { value: 0 },
    uEnergy: { value: 0 },
  };
  private readonly pointer = new THREE.Vector2();
  private readonly pointerTarget = new THREE.Vector2();
  private readonly lookTarget = new THREE.Vector3(0, 0.2, -5.2);
  private readonly accentLight = new THREE.PointLight(0x8effe4, 20, 18, 2);
  private readonly resizeObserver: ResizeObserver;
  private themeBlend = 0;
  private targetThemeBlend = 0;
  private energy = 0;
  private clockTime = 0;
  private lastFrame = performance.now();
  private frameId = 0;
  private width = 1;
  private height = 1;

  constructor(host: HTMLElement) {
    this.host = host;
    this.canvas = document.createElement("canvas");
    this.canvas.className = "premium-world-canvas";
    this.canvas.id = "premiumWorldCanvas";
    this.canvas.setAttribute("aria-label", "GPU-rendered procedural living world");
    this.host.prepend(this.canvas);

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: false,
        antialias: true,
        depth: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: true,
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.18;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer = renderer;
    } catch {
      this.canvas.dataset.fallback = "true";
    }
    this.supported = renderer !== null;

    this.camera.position.set(0, 1.9, 8.6);
    this.scene.add(this.frutigerGroup, this.frawgyGroup);
    this.buildSky();
    this.buildLighting();
    this.buildWater();
    this.buildFrutigerWorld();
    this.buildFrawgyWorld();
    this.buildAtmosphere();
    this.setTheme(document.body.dataset.theme ?? "frutiger");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.host);
    this.resize();
    this.start();
  }

  private buildSky(): void {
    const material = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: vertexSky,
      fragmentShader: fragmentSky,
      depthWrite: false,
      depthTest: false,
    });
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(42, 25), material);
    sky.position.set(0, 2.1, -18);
    sky.renderOrder = -10;
    this.scene.add(sky);
  }

  private buildLighting(): void {
    const hemisphere = new THREE.HemisphereLight(0xd8fbff, 0x124f45, 2.2);
    const sun = new THREE.DirectionalLight(0xfff3cf, 4.4);
    sun.position.set(-4, 10, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -5;
    this.accentLight.position.set(4, 3, 1);
    this.scene.add(hemisphere, sun, this.accentLight);
  }

  private buildWater(): void {
    const geometry = new THREE.PlaneGeometry(34, 34, 96, 96);
    const material = new THREE.ShaderMaterial({
      uniforms: this.waterUniforms,
      vertexShader: vertexWater,
      fragmentShader: fragmentWater,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const water = new THREE.Mesh(geometry, material);
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -1.18, -5);
    water.receiveShadow = true;
    this.scene.add(water);
  }

  private glassMaterial(color: number, opacity = 0.82): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.14,
      roughness: 0.16,
      transmission: 0.18,
      transparent: true,
      opacity,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      emissive: new THREE.Color(color).multiplyScalar(0.055),
      emissiveIntensity: 1,
    });
    material.userData.intrinsicOpacity = opacity;
    return material;
  }

  private addCloud(group: THREE.Group, x: number, y: number, z: number, scale: number): void {
    const cloud = new THREE.Group();
    const material = this.glassMaterial(0xf4ffff, 0.54);
    const parts = [
      [-0.7, 0, 0, 0.78],
      [0, 0.18, 0, 1.05],
      [0.82, 0.02, 0, 0.68],
      [0.26, -0.15, 0.13, 0.9],
    ] as const;
    for (const [px, py, pz, radius] of parts) {
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 20, 14), material);
      sphere.position.set(px, py, pz);
      sphere.scale.y = 0.55;
      cloud.add(sphere);
    }
    cloud.position.set(x, y, z);
    cloud.scale.setScalar(scale);
    cloud.userData.baseY = y;
    cloud.userData.phase = x * 0.7;
    cloud.userData.drift = 0.06 + scale * 0.015;
    this.dynamicObjects.push(cloud as AnimatedObject);
    group.add(cloud);
  }

  private addTree(group: THREE.Group, x: number, z: number, scale: number, frog = false): void {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.16, 1.6, 12),
      new THREE.MeshStandardMaterial({ color: frog ? 0x6b4b2b : 0x3a8c72, roughness: 0.8 }),
    );
    trunk.position.y = -0.35;
    trunk.castShadow = true;
    tree.add(trunk);
    const leafMaterial = new THREE.MeshPhysicalMaterial({
      color: frog ? 0x365f38 : 0x3fca72,
      roughness: 0.48,
      clearcoat: 0.55,
      emissive: frog ? 0x101f10 : 0x082b18,
      emissiveIntensity: 0.45,
    });
    for (let i = 0; i < 7; i += 1) {
      const angle = (i / 7) * Math.PI * 2;
      const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.68, 2), leafMaterial);
      crown.position.set(Math.cos(angle) * 0.42, 0.52 + (i % 2) * 0.18, Math.sin(angle) * 0.34);
      crown.scale.set(1.05, 0.78, 0.86);
      crown.castShadow = true;
      tree.add(crown);
    }
    tree.position.set(x, -0.04, z);
    tree.scale.setScalar(scale);
    tree.userData.phase = x;
    tree.userData.spin = frog ? 0.002 : 0.004;
    this.dynamicObjects.push(tree as AnimatedObject);
    group.add(tree);
  }

  private addBubble(group: THREE.Group, x: number, y: number, z: number, radius: number, color = 0x9ff6ff): void {
    const material = new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.55,
      transparent: true,
      opacity: 0.36,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
      emissive: color,
      emissiveIntensity: 0.06,
    });
    material.userData.intrinsicOpacity = 0.36;
    const bubble = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), material);
    bubble.position.set(x, y, z);
    bubble.userData.baseY = y;
    bubble.userData.phase = x * 1.7 + z;
    bubble.userData.drift = 0.13 + radius * 0.08;
    this.dynamicObjects.push(bubble as AnimatedObject);
    group.add(bubble);
  }

  private buildFrutigerWorld(): void {
    const glass = this.glassMaterial(0xbff7ff, 0.77);
    const blueGlass = this.glassMaterial(0x53c9ec, 0.7);
    const whiteGlass = this.glassMaterial(0xf0ffff, 0.62);

    const canopy = new THREE.Mesh(new THREE.TorusGeometry(7.7, 0.15, 14, 112, Math.PI), whiteGlass);
    canopy.position.set(0, 0.9, -5.2);
    canopy.rotation.z = 0.02;
    this.frutigerGroup.add(canopy);
    const canopyInner = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.055, 10, 96, Math.PI), blueGlass);
    canopyInner.position.set(0, 0.85, -5.1);
    this.frutigerGroup.add(canopyInner);

    for (const x of [-7.2, 7.2]) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.32, 6.8, 20), whiteGlass);
      pillar.position.set(x, 0.2, -5.1);
      pillar.rotation.z = x < 0 ? -0.09 : 0.09;
      pillar.castShadow = true;
      this.frutigerGroup.add(pillar);
    }

    const towerHeights = [3.8, 5.6, 4.5, 6.4, 5.1, 3.4, 4.7];
    towerHeights.forEach((height, index) => {
      const tower = new THREE.Mesh(
        new THREE.BoxGeometry(0.58 + (index % 2) * 0.14, height, 0.62),
        index % 2 ? glass : blueGlass,
      );
      tower.position.set(-2.4 + index * 0.78, -1.0 + height / 2, -10.5 - Math.abs(index - 3) * 0.34);
      tower.rotation.y = (index - 3) * 0.035;
      tower.castShadow = true;
      this.frutigerGroup.add(tower);
      for (let floor = 0; floor < Math.floor(height * 2.3); floor += 1) {
        const line = new THREE.Mesh(
          new THREE.BoxGeometry(tower.scale.x + 0.64, 0.018, 0.65),
          new THREE.MeshBasicMaterial({ color: 0xdfffff, transparent: true, opacity: 0.28 }),
        );
        line.position.set(tower.position.x, tower.position.y - height / 2 + 0.22 + floor * 0.42, tower.position.z + 0.33);
        this.frutigerGroup.add(line);
      }
    });

    const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x208c69, roughness: 0.82 });
    for (const [x, y, z, sx, sy, sz] of [
      [-7.2, -1.1, -9.5, 6.8, 2.2, 3.2],
      [7.5, -1.0, -10.0, 6.2, 2.5, 3.1],
      [-1.2, -1.5, -14.0, 8.0, 2.0, 2.4],
    ] as const) {
      const hill = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), hillMaterial);
      hill.position.set(x, y, z);
      hill.scale.set(sx, sy, sz);
      hill.receiveShadow = true;
      this.frutigerGroup.add(hill);
    }

    const waterfallMaterial = new THREE.MeshBasicMaterial({
      color: 0xd9ffff,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    waterfallMaterial.userData.intrinsicOpacity = 0.72;
    for (const x of [-6.25, 6.4]) {
      const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 4.2, 1, 12), waterfallMaterial);
      fall.position.set(x, 0.4, -8.2);
      this.frutigerGroup.add(fall);
    }

    this.addTree(this.frutigerGroup, -6.3, -3.7, 1.7);
    this.addTree(this.frutigerGroup, -4.9, -4.5, 1.12);
    this.addTree(this.frutigerGroup, 6.1, -4.3, 1.55);
    this.addTree(this.frutigerGroup, 7.25, -5.2, 0.92);
    this.addTree(this.frutigerGroup, 4.7, -7.4, 0.72);
    this.addCloud(this.frutigerGroup, -4.6, 4.9, -11.8, 1.3);
    this.addCloud(this.frutigerGroup, 4.3, 5.2, -13.0, 1.65);
    this.addCloud(this.frutigerGroup, 0.4, 6.0, -15.0, 0.85);
    this.addBubble(this.frutigerGroup, -3.6, 2.1, -3.4, 0.42);
    this.addBubble(this.frutigerGroup, 3.9, 2.8, -5.6, 0.28);
    this.addBubble(this.frutigerGroup, 5.4, 1.1, -2.8, 0.58);
    this.addBubble(this.frutigerGroup, -5.2, 3.5, -7.8, 0.2);

    const table = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 0.22, 72), glass);
    table.position.set(2.4, -0.95, 2.0);
    table.scale.z = 0.68;
    table.receiveShadow = true;
    this.frutigerGroup.add(table);
  }

  private addPearlString(group: THREE.Group, x: number, top: number, z: number, count: number): void {
    const pearlMaterial = this.glassMaterial(0xffebbc, 0.82);
    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xbca766, transparent: true, opacity: 0.54 });
    lineMaterial.userData.intrinsicOpacity = 0.54;
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, count * 0.42, 8), lineMaterial);
    line.position.set(x, top - count * 0.21, z);
    group.add(line);
    for (let index = 0; index < count; index += 1) {
      const radius = index % 3 === 0 ? 0.095 : 0.06;
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), pearlMaterial);
      pearl.position.set(x, top - index * 0.42, z);
      pearl.userData.baseY = pearl.position.y;
      pearl.userData.phase = x + index * 0.4;
      pearl.userData.drift = 0.018;
      this.dynamicObjects.push(pearl as AnimatedObject);
      group.add(pearl);
    }
  }

  private addFrog(group: THREE.Group, x: number, y: number, z: number, scale: number): void {
    const frog = new THREE.Group();
    const green = new THREE.MeshPhysicalMaterial({ color: 0x54783e, roughness: 0.37, clearcoat: 0.82 });
    const gold = new THREE.MeshStandardMaterial({ color: 0xc8a862, metalness: 0.88, roughness: 0.2 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x11180d, roughness: 0.18 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.58, 28, 20), green);
    body.scale.set(1, 0.8, 0.82);
    frog.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 28, 18), green);
    head.position.y = 0.54;
    head.scale.set(1.2, 0.78, 0.9);
    frog.add(head);
    for (const eyeX of [-0.3, 0.3]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), gold);
      eye.position.set(eyeX, 0.91, 0.18);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), dark);
      pupil.position.set(eyeX, 0.93, 0.31);
      frog.add(eye, pupil);
    }
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.38, 7, 1, true), gold);
    crown.position.y = 1.22;
    frog.add(crown);
    frog.position.set(x, y, z);
    frog.scale.setScalar(scale);
    frog.rotation.y = x < 0 ? 0.35 : -0.35;
    frog.userData.baseY = y;
    frog.userData.phase = x;
    frog.userData.drift = 0.025;
    this.dynamicObjects.push(frog as AnimatedObject);
    group.add(frog);
  }

  private addRoyalFrawgyBuddy(group: THREE.Group): void {
    const buddy = new THREE.Group();
    const skin = new THREE.MeshPhysicalMaterial({ color: 0xe6b899, roughness: 0.48, clearcoat: 0.18 });
    const cloth = new THREE.MeshPhysicalMaterial({ color: 0x6f8267, roughness: 0.36, clearcoat: 0.58, sheen: 0.72, sheenColor: new THREE.Color(0xe5d6aa) });
    const armor = new THREE.MeshStandardMaterial({ color: 0xc5aa67, metalness: 0.86, roughness: 0.2, emissive: 0x251804, emissiveIntensity: 0.24 });
    const hair = new THREE.MeshStandardMaterial({ color: 0x6b4027, roughness: 0.64 });
    const pearl = this.glassMaterial(0xffecc2, 0.82);
    const eye = new THREE.MeshStandardMaterial({ color: 0x263a1e, roughness: 0.14 });

    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.78, 2.25, 36), cloth);
    skirt.position.y = 0.2;
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.5, 1.05, 28), cloth);
    torso.position.y = 1.42;
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 10, 32, Math.PI), armor);
    collar.rotation.x = Math.PI / 2;
    collar.rotation.z = Math.PI;
    collar.position.set(0, 1.92, 0.08);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.14, 0.28, 18), skin);
    neck.position.y = 2.02;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 24), skin);
    head.position.set(0, 2.39, 0.02);
    head.scale.set(0.88, 1.08, 0.9);
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.48, 28, 22), hair);
    hairBack.position.set(0, 2.38, -0.17);
    hairBack.scale.set(1, 1.26, 0.72);
    buddy.add(skirt, torso, collar, neck, hairBack, head);

    for (const side of [-1, 1]) {
      const upperArm = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.64, 7, 14), cloth);
      upperArm.position.set(side * 0.45, 1.42, 0.02);
      upperArm.rotation.z = side * -0.32;
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), skin);
      hand.position.set(side * 0.58, 1.02, 0.12);
      buddy.add(upperArm, hand);
    }

    for (const side of [-1, 1]) {
      const white = new THREE.Mesh(new THREE.SphereGeometry(0.052, 15, 10), pearl);
      white.position.set(side * 0.13, 2.44, 0.34);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 8), eye);
      pupil.position.set(side * 0.13, 2.445, 0.382);
      buddy.add(white, pupil);
    }

    const crownBand = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.035, 10, 36), armor);
    crownBand.rotation.x = Math.PI / 2;
    crownBand.position.y = 2.79;
    buddy.add(crownBand);
    for (let index = 0; index < 7; index += 1) {
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.3, 8), armor);
      const angle = (index / 7) * Math.PI * 2;
      point.position.set(Math.cos(angle) * 0.27, 2.94, Math.sin(angle) * 0.27);
      buddy.add(point);
    }

    const frogBrooch = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 12), new THREE.MeshPhysicalMaterial({ color: 0x668849, roughness: 0.28, clearcoat: 0.88 }));
    frogBrooch.position.set(0, 1.72, 0.49);
    frogBrooch.scale.set(1.3, 0.84, 0.45);
    buddy.add(frogBrooch);
    const orb = new THREE.Mesh(new THREE.SphereGeometry(0.27, 26, 18), this.glassMaterial(0xc9f7d8, 0.72));
    orb.position.set(-0.65, 0.86, 0.24);
    buddy.add(orb);

    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.025, 8, 72), armor);
    halo.position.set(0, 2.38, -0.4);
    buddy.add(halo);
    buddy.traverse((object) => {
      if (object instanceof THREE.Mesh) { object.castShadow = true; object.receiveShadow = true; }
    });
    buddy.position.set(-5.25, -0.65, 0.8);
    buddy.rotation.y = 0.18;
    buddy.scale.setScalar(1.16);
    buddy.userData.baseY = buddy.position.y;
    buddy.userData.phase = 2.4;
    buddy.userData.drift = 0.006;
    this.dynamicObjects.push(buddy as AnimatedObject);
    group.add(buddy);
  }

  private buildFrawgyWorld(): void {
    const gold = new THREE.MeshStandardMaterial({
      color: 0xc8a862,
      metalness: 0.88,
      roughness: 0.19,
      emissive: 0x3c2a08,
      emissiveIntensity: 0.62,
    });
    const greenGlass = this.glassMaterial(0x496b4f, 0.58);
    const jade = new THREE.MeshPhysicalMaterial({ color: 0x254c34, roughness: 0.32, clearcoat: 0.9 });

    for (const radius of [7.8, 6.45, 5.1]) {
      const arch = new THREE.Mesh(new THREE.TorusGeometry(radius, radius === 7.8 ? 0.12 : 0.06, 12, 112, Math.PI), radius === 6.45 ? greenGlass : gold);
      arch.position.set(0, 0.92, -6.8 - (7.8 - radius) * 0.42);
      this.frawgyGroup.add(arch);
    }
    for (const x of [-7.45, -5.95, 5.95, 7.45]) {
      const column = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.15, 7.6, 16), gold);
      column.position.set(x, 0.4, -6.8);
      this.frawgyGroup.add(column);
    }

    for (let index = 0; index < 10; index += 1) {
      const x = -6.7 + index * 1.5;
      const window = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 5.0), greenGlass);
      window.position.set(x, 1.1, -12.8);
      this.frawgyGroup.add(window);
    }

    const padMaterial = new THREE.MeshPhysicalMaterial({ color: 0x315e32, roughness: 0.4, clearcoat: 0.8 });
    const flowerMaterial = this.glassMaterial(0xf6dfc8, 0.86);
    const random = seededRandom(88);
    for (let index = 0; index < 18; index += 1) {
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.3 + random() * 0.45, 28), padMaterial);
      pad.rotation.x = -Math.PI / 2;
      pad.rotation.z = random() * Math.PI;
      pad.position.set(-7 + random() * 14, -1.02, -1.2 - random() * 13);
      this.frawgyGroup.add(pad);
      if (index % 3 === 0) {
        const flower = new THREE.Group();
        for (let petal = 0; petal < 8; petal += 1) {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 8), flowerMaterial);
          const angle = (petal / 8) * Math.PI * 2;
          mesh.position.set(Math.cos(angle) * 0.19, 0.06, Math.sin(angle) * 0.19);
          mesh.scale.set(1.4, 0.28, 0.72);
          mesh.rotation.y = -angle;
          flower.add(mesh);
        }
        flower.position.copy(pad.position).add(new THREE.Vector3(0.06, 0.06, -0.02));
        this.frawgyGroup.add(flower);
      }
    }

    for (const [x, z, scale] of [[-6.6, -4.0, 1.55], [-4.8, -8.5, 0.9], [6.4, -4.4, 1.45], [5.0, -9.4, 0.76]] as const) {
      this.addTree(this.frawgyGroup, x, z, scale, true);
    }
    this.addFrog(this.frawgyGroup, -6.2, -0.65, -1.3, 1.35);
    this.addFrog(this.frawgyGroup, 6.65, -0.78, -2.0, 1.05);
    this.addFrog(this.frawgyGroup, 4.8, -0.85, 1.5, 0.72);
    this.addRoyalFrawgyBuddy(this.frawgyGroup);
    this.addBubble(this.frawgyGroup, -4.6, 2.1, -4.2, 0.3, 0xf0d68f);
    this.addBubble(this.frawgyGroup, 4.3, 3.0, -6.4, 0.42, 0xe3c77a);
    this.addBubble(this.frawgyGroup, 0.8, 4.0, -8.2, 0.2, 0xf7e3b1);

    for (const [x, top, z, count] of [[-6.8, 6.4, -4.5, 11], [-3.4, 6.8, -7.0, 8], [3.2, 6.6, -6.5, 9], [6.7, 6.2, -4.2, 12]] as const) {
      this.addPearlString(this.frawgyGroup, x, top, z, count);
    }

    const dais = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.55, 0.3, 72), jade);
    dais.position.set(-2.8, -0.95, 2.4);
    dais.scale.z = 0.58;
    dais.receiveShadow = true;
    this.frawgyGroup.add(dais);
  }

  private buildAtmosphere(): void {
    const random = seededRandom(2408);
    const count = 280;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = (random() - 0.5) * 22;
      positions[index * 3 + 1] = -0.6 + random() * 9;
      positions[index * 3 + 2] = 3 - random() * 24;
      const warm = random() > 0.68;
      colors[index * 3] = warm ? 1 : 0.48;
      colors[index * 3 + 1] = warm ? 0.82 : 0.92;
      colors[index * 3 + 2] = warm ? 0.5 : 1;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.055,
      vertexColors: true,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    material.userData.intrinsicOpacity = 0.68;
    const motes = new THREE.Points(geometry, material);
    motes.userData.phase = 0;
    motes.userData.spin = 0.0015;
    this.dynamicObjects.push(motes as AnimatedObject);
    this.scene.add(motes);
  }

  setTheme(theme: ThemeId): void {
    this.targetThemeBlend = theme === "frawgy" ? 1 : 0;
    const isFrutiger = theme === "frutiger";
    const isFrawgy = theme === "frawgy";
    this.canvas.dataset.active = String(isFrutiger || isFrawgy);
    this.frutigerGroup.visible = isFrutiger || (!isFrawgy && theme.length === 0);
    this.frawgyGroup.visible = isFrawgy;
    if (!isFrutiger && !isFrawgy) {
      this.frutigerGroup.visible = false;
      this.frawgyGroup.visible = false;
    }
    this.pulse(1.35);
  }

  setPointer(x: number, y: number): void {
    this.pointerTarget.set((x - 0.5) * 2, (0.5 - y) * 2);
  }

  pulse(intensity = 1): void {
    this.energy = Math.min(4, this.energy + intensity);
  }

  step(milliseconds: number): void {
    this.update(Math.max(0, milliseconds) / 1000);
    this.render();
  }

  private update(delta: number): void {
    const boundedDelta = Math.min(0.05, delta || 1 / 60);
    this.clockTime += boundedDelta;
    this.energy = THREE.MathUtils.damp(this.energy, 0, 2.4, boundedDelta);
    this.themeBlend = THREE.MathUtils.damp(this.themeBlend, this.targetThemeBlend, 4.2, boundedDelta);
    this.pointer.lerp(this.pointerTarget, 1 - Math.exp(-boundedDelta * 3.8));
    this.skyUniforms.uTime.value = this.clockTime;
    this.skyUniforms.uFrawgy.value = this.themeBlend;
    this.skyUniforms.uEnergy.value = this.energy;
    this.waterUniforms.uTime.value = this.clockTime;
    this.waterUniforms.uFrawgy.value = this.themeBlend;
    this.waterUniforms.uEnergy.value = this.energy;
    this.accentLight.color.setHex(this.themeBlend > 0.5 ? 0xffd077 : 0x8effe4);
    this.accentLight.intensity = 18 + this.energy * 10;
    this.accentLight.position.x = 4 + this.pointer.x * 2.5;
    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.pointer.x * 0.58, 3.4, boundedDelta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, 1.9 + this.pointer.y * 0.32, 3.4, boundedDelta);
    this.camera.position.z = 8.6 - this.energy * 0.025;
    this.lookTarget.x = this.pointer.x * 0.18;
    this.lookTarget.y = 0.2 + this.pointer.y * 0.08;
    this.camera.lookAt(this.lookTarget);

    for (const object of this.dynamicObjects) {
      const phase = object.userData.phase ?? 0;
      const baseY = object.userData.baseY;
      const drift = object.userData.drift ?? 0;
      if (typeof baseY === "number") {
        object.position.y = baseY + Math.sin(this.clockTime * (0.55 + drift) + phase) * drift * (2.2 + this.energy * 0.18);
      }
      const spin = object.userData.spin ?? 0;
      object.rotation.y += spin * (1 + this.energy * 0.2);
    }
    this.frutigerGroup.rotation.y = this.pointer.x * 0.012;
    this.frawgyGroup.rotation.y = this.pointer.x * 0.009;
    setGroupOpacity(this.frutigerGroup, 1 - this.themeBlend);
    setGroupOpacity(this.frawgyGroup, this.themeBlend);
  }

  private resize(): void {
    const bounds = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    if (width === this.width && height === this.height) return;
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer?.setSize(width, height, false);
  }

  private render(): void {
    if (!this.renderer) return;
    this.resize();
    this.renderer.render(this.scene, this.camera);
  }

  private start(): void {
    const frame = (now: number): void => {
      const delta = Math.min(50, Math.max(0, now - this.lastFrame));
      this.lastFrame = now;
      this.update(delta / 1000);
      this.render();
      this.frameId = requestAnimationFrame(frame);
    };
    cancelAnimationFrame(this.frameId);
    this.frameId = requestAnimationFrame(frame);
  }

  dispose(): void {
    cancelAnimationFrame(this.frameId);
    this.resizeObserver.disconnect();
    this.scene.traverse((object) => {
      if (!(object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Line)) return;
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    });
    this.renderer?.dispose();
    this.canvas.remove();
  }
}
