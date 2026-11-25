/**
 * @module cardgame/vfx
 * @description Canvas-based visual effects engine — beams, bursts, particles,
 * screen shake, card glow, legendary reveals, and impact effects.
 * Uses requestAnimationFrame for silky-smooth rendering at native refresh rate.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   VFX Engine
   ═══════════════════════════════════════════════════════════════════════════ */

export function createVfxEngine(hostEl) {
  if (!(hostEl instanceof HTMLElement)) return null;
  hostEl.style.position = hostEl.style.position || "relative";

  const canvas = document.createElement("canvas");
  canvas.className = "cg-vfx-canvas";
  canvas.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:50;";
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  hostEl.appendChild(canvas);

  const state = {
    beams: [],
    particles: [],
    trails: [],
    glows: [],
    shakeUntil: 0,
    shakeMag: 0,
    running: false,
    raf: 0,
    t0: performance.now(),
  };

  // Resize observer
  function resize() {
    const r = hostEl.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.floor(r.width * dpr));
    canvas.height = Math.max(1, Math.floor(r.height * dpr));
    canvas.style.width = `${Math.floor(r.width)}px`;
    canvas.style.height = `${Math.floor(r.height)}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(hostEl);

  function toLocal(clientX, clientY) {
    const r = hostEl.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function centerOf(el) {
    if (!(el instanceof HTMLElement)) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return toLocal(r.left + r.width / 2, r.top + r.height / 2);
  }

  // ─── Render loop (dt-based, no FPS cap) ───
  let lastTime = 0;
  function tick(now) {
    state.raf = requestAnimationFrame(tick);
    const dt = lastTime ? (now - lastTime) / 1000 : 0.016;
    lastTime = now;
    const t = (now - state.t0) / 1000;

    const w = canvas.width / (Math.min(2, window.devicePixelRatio || 1));
    const h = canvas.height / (Math.min(2, window.devicePixelRatio || 1));
    ctx.clearRect(0, 0, w + 2, h + 2);

    // Shake
    if (now < state.shakeUntil) {
      const mag = state.shakeMag;
      const dx = (Math.random() * 2 - 1) * mag;
      const dy = (Math.random() * 2 - 1) * mag;
      hostEl.style.transform = `translate(${dx}px,${dy}px)`;
    } else if (hostEl.style.transform) {
      hostEl.style.transform = "";
    }

    // ─── Beams ───
    state.beams = state.beams.filter(b => (t - b.t) < b.dur);
    for (const b of state.beams) {
      const age = (t - b.t) / b.dur;
      const alpha = (1 - age) * b.alpha;
      const width = b.w * (1 - age * 0.6);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = width;
      ctx.lineCap = "round";
      ctx.strokeStyle = b.color;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = b.glow || 12;

      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      const mx = (b.x1 + b.x2) / 2 + b.curve;
      const my = (b.y1 + b.y2) / 2 - 20 + b.curve * 0.5;
      ctx.quadraticCurveTo(mx, my, b.x2, b.y2);
      ctx.stroke();

      // Inner bright core
      ctx.lineWidth = width * 0.4;
      ctx.strokeStyle = "#fff";
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.quadraticCurveTo(mx, my, b.x2, b.y2);
      ctx.stroke();

      ctx.restore();
    }

    // ─── Particles ───
    state.particles = state.particles.filter(p => (t - p.t) < p.dur);
    for (const p of state.particles) {
      const age = t - p.t;
      const k = age / p.dur;
      const alpha = (1 - k) * p.alpha;
      const x = p.x + p.vx * age;
      const y = p.y + p.vy * age + p.g * age * age;
      const r = p.r * (1 - k * 0.5);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.glow || 6;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ─── Trails (lingering afterglow lines) ───
    state.trails = state.trails.filter(tr => (t - tr.t) < tr.dur);
    for (const tr of state.trails) {
      const age = (t - tr.t) / tr.dur;
      ctx.save();
      ctx.globalAlpha = (1 - age) * 0.6;
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = tr.w * (1 - age);
      ctx.lineCap = "round";
      ctx.shadowColor = tr.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(tr.x1, tr.y1);
      ctx.lineTo(tr.x2, tr.y2);
      ctx.stroke();
      ctx.restore();
    }

    // ─── Glows (circular pulses) ───
    state.glows = state.glows.filter(g => (t - g.t) < g.dur);
    for (const g of state.glows) {
      const age = (t - g.t) / g.dur;
      const radius = g.r * (0.3 + age * 0.7);
      const alpha = (1 - age) * g.alpha;

      ctx.save();
      ctx.globalAlpha = alpha;
      const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, radius);
      grad.addColorStop(0, g.color);
      grad.addColorStop(0.4, g.color.replace(/[\d.]+\)$/, `${alpha * 0.5})`));
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(g.x, g.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Stop if nothing is playing
    const hasContent = state.beams.length || state.particles.length ||
      state.trails.length || state.glows.length || now < state.shakeUntil;
    if (!hasContent) {
      cancelAnimationFrame(state.raf);
      state.running = false;
      lastTime = 0;
    }
  }

  function ensureRunning() {
    if (state.running) return;
    state.running = true;
    state.t0 = performance.now();
    lastTime = 0;
    state.raf = requestAnimationFrame(tick);
  }

  /* ═══════════════════════════════════════════════════════════════
     Public effects API
     ═══════════════════════════════════════════════════════════════ */

  function beam(from, to, opts = {}) {
    const t = (performance.now() - state.t0) / 1000;
    state.beams.push({
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      color: opts.color || "rgba(102,170,255,1)",
      w: opts.width || 6,
      dur: opts.duration || 0.35,
      alpha: opts.alpha || 0.95,
      glow: opts.glow || 14,
      curve: opts.curve || (Math.random() * 30 - 15),
      t,
    });
    ensureRunning();
  }

  function burst(pos, opts = {}) {
    const t = (performance.now() - state.t0) / 1000;
    const count = opts.count || 24;
    const color = opts.color || "rgba(255,220,80,1)";
    const speed = opts.speed || 180;
    const spread = opts.spread || 280;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
      const sp = speed + Math.random() * spread;
      state.particles.push({
        x: pos.x + (Math.random() - 0.5) * 4,
        y: pos.y + (Math.random() - 0.5) * 4,
        vx: Math.cos(angle) * sp,
        vy: Math.sin(angle) * sp - (60 + Math.random() * 40),
        g: 400 + Math.random() * 300,
        r: 1.5 + Math.random() * 2.5,
        dur: 0.5 + Math.random() * 0.35,
        color,
        alpha: 0.9,
        glow: opts.glow || 8,
        t,
      });
    }
    ensureRunning();
  }

  function impactBurst(pos, opts = {}) {
    burst(pos, { count: 36, speed: 220, spread: 350, ...opts });
    glow(pos, { radius: 60, duration: 0.4, ...opts });
    shake(140, 3.5);
  }

  function legendaryBurst(pos) {
    // Multi-layered legendary card reveal effect
    burst(pos, { count: 50, speed: 280, spread: 400, color: "rgba(255,197,66,1)", glow: 16 });
    burst(pos, { count: 30, speed: 140, spread: 200, color: "rgba(255,255,200,1)", glow: 12 });
    glow(pos, { radius: 100, duration: 0.8, color: "rgba(255,197,66,0.7)" });
    glow(pos, { radius: 60, duration: 0.5, color: "rgba(255,255,255,0.5)" });
    shake(200, 4);
  }

  function epicBurst(pos) {
    burst(pos, { count: 35, speed: 200, spread: 300, color: "rgba(199,107,255,1)", glow: 12 });
    glow(pos, { radius: 70, duration: 0.6, color: "rgba(199,107,255,0.6)" });
    shake(120, 2.5);
  }

  function rareBurst(pos) {
    burst(pos, { count: 20, speed: 160, spread: 220, color: "rgba(93,159,255,1)", glow: 8 });
    glow(pos, { radius: 50, duration: 0.4, color: "rgba(93,159,255,0.5)" });
    shake(80, 1.5);
  }

  function healBurst(pos) {
    burst(pos, { count: 16, speed: 100, spread: 150, color: "rgba(100,255,140,1)", glow: 10 });
    glow(pos, { radius: 40, duration: 0.5, color: "rgba(100,255,140,0.4)" });
  }

  function deathBurst(pos) {
    burst(pos, { count: 28, speed: 200, spread: 300, color: "rgba(255,80,80,1)", glow: 10 });
    burst(pos, { count: 12, speed: 80, spread: 120, color: "rgba(100,100,100,0.8)" });
    glow(pos, { radius: 50, duration: 0.3, color: "rgba(255,80,80,0.5)" });
    shake(100, 2);
  }

  function shieldPopBurst(pos) {
    burst(pos, { count: 18, speed: 200, spread: 250, color: "rgba(255,230,140,1)", glow: 14 });
    glow(pos, { radius: 45, duration: 0.3, color: "rgba(255,230,140,0.6)" });
  }

  function heroPowerBurst(pos, color) {
    burst(pos, { count: 20, speed: 160, spread: 220, color: color || "rgba(199,107,255,1)", glow: 12 });
    glow(pos, { radius: 55, duration: 0.5, color: color || "rgba(199,107,255,0.5)" });
    shake(90, 2);
  }

  function trail(from, to, opts = {}) {
    const t = (performance.now() - state.t0) / 1000;
    state.trails.push({
      x1: from.x, y1: from.y, x2: to.x, y2: to.y,
      color: opts.color || "rgba(102,170,255,0.7)",
      w: opts.width || 3,
      dur: opts.duration || 0.5,
      t,
    });
    ensureRunning();
  }

  function glow(pos, opts = {}) {
    const t = (performance.now() - state.t0) / 1000;
    state.glows.push({
      x: pos.x, y: pos.y,
      r: opts.radius || 40,
      color: opts.color || "rgba(255,220,80,0.6)",
      alpha: opts.alpha || 0.8,
      dur: opts.duration || 0.5,
      t,
    });
    ensureRunning();
  }

  function shake(ms = 120, mag = 2.5) {
    state.shakeUntil = performance.now() + Math.max(0, Number(ms));
    state.shakeMag = Math.max(0, Number(mag));
    ensureRunning();
  }

  function sparkTrail(from, to, opts = {}) {
    // Animated spark traveling from source to target
    const steps = 8;
    const color = opts.color || "rgba(255,220,80,1)";
    for (let i = 0; i < steps; i++) {
      const frac = i / steps;
      const x = from.x + (to.x - from.x) * frac;
      const y = from.y + (to.y - from.y) * frac;
      const delay = frac * 0.15;
      setTimeout(() => {
        burst({ x, y }, { count: 3, speed: 40, spread: 60, color, glow: 4 });
      }, delay * 1000);
    }
  }

  function destroy() {
    try { cancelAnimationFrame(state.raf); } catch (_) {}
    try { ro.disconnect(); } catch (_) {}
    try { hostEl.style.transform = ""; } catch (_) {}
    try { canvas.remove(); } catch (_) {}
  }

  /* ═══════════════════════════════════════════════════════════════
     Floating damage / heal numbers (DOM-based for crisp text)
     ═══════════════════════════════════════════════════════════════ */

  function floatingText(pos, text, opts = {}) {
    const el = document.createElement("div");
    el.className = `cg-float-number ${opts.type || "damage"}`;
    el.textContent = text;
    el.style.cssText = `left:${pos.x}px;top:${pos.y}px;`;
    if (opts.color) el.style.setProperty("--ft-color", opts.color);
    if (opts.fontSize) el.style.fontSize = opts.fontSize;
    hostEl.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
    // Safety cleanup
    setTimeout(() => { try { el.remove(); } catch (_) {} }, 2000);
  }

  function damageNumber(targetEl, amount) {
    if (!targetEl || amount <= 0) return;
    const pos = centerOf(targetEl);
    floatingText(pos, `-${amount}`, { type: "damage" });
    // Red flash overlay on the target
    targetEl.classList.add("cg-hit-flash");
    setTimeout(() => targetEl.classList.remove("cg-hit-flash"), 400);
  }

  function healNumber(targetEl, amount) {
    if (!targetEl || amount <= 0) return;
    const pos = centerOf(targetEl);
    floatingText(pos, `+${amount}`, { type: "heal", color: "#44ff88" });
    targetEl.classList.add("cg-heal-flash");
    setTimeout(() => targetEl.classList.remove("cg-heal-flash"), 400);
  }

  /* ═══════════════════════════════════════════════════════════════
     Attack arc — animated beam from attacker to defender
     ═══════════════════════════════════════════════════════════════ */

  function attackArc(fromEl, toEl, opts = {}) {
    if (!fromEl || !toEl) return;
    const from = centerOf(fromEl);
    const to = centerOf(toEl);
    beam(from, to, {
      color: opts.color || "rgba(255,100,60,1)",
      width: opts.width || 8,
      duration: opts.duration || 0.35,
      glow: 18,
    });
    // Inner bright core beam
    beam(from, to, {
      color: "rgba(255,220,140,0.9)",
      width: 3,
      duration: 0.3,
      glow: 10,
    });
    // Spark trail along the path
    sparkTrail(from, to, { color: opts.color || "rgba(255,180,80,1)" });
  }

  /* ═══════════════════════════════════════════════════════════════
     Targeting arrow — SVG arrow drawn while selecting target
     (uses DOM overlay, not canvas)
     ═══════════════════════════════════════════════════════════════ */

  let _arrowSvg = null;

  function showTargetArrow(fromEl) {
    hideTargetArrow();
    if (!fromEl) return;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("cg-targeting-arrow");
    svg.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:55;width:100%;height:100%;";
    // Defs for arrowhead marker
    svg.innerHTML = `<defs>
      <marker id="cg-arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#ff4444"/>
      </marker>
      <filter id="cg-arrow-glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <line class="cg-arrow-line" stroke="#ff4444" stroke-width="3" stroke-linecap="round" 
          marker-end="url(#cg-arrowhead)" filter="url(#cg-arrow-glow)" x1="0" y1="0" x2="0" y2="0"/>
    <line class="cg-arrow-line-inner" stroke="#ffccaa" stroke-width="1.5" stroke-linecap="round"
          x1="0" y1="0" x2="0" y2="0"/>`;
    hostEl.appendChild(svg);
    _arrowSvg = svg;

    const from = centerOf(fromEl);
    const line = svg.querySelector(".cg-arrow-line");
    const inner = svg.querySelector(".cg-arrow-line-inner");

    function onMove(e) {
      const rect = hostEl.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", mx);
      line.setAttribute("y2", my);
      inner.setAttribute("x1", from.x);
      inner.setAttribute("y1", from.y);
      inner.setAttribute("x2", mx);
      inner.setAttribute("y2", my);
    }
    hostEl.addEventListener("mousemove", onMove);
    svg._cleanup = () => hostEl.removeEventListener("mousemove", onMove);
  }

  function hideTargetArrow() {
    if (_arrowSvg) {
      _arrowSvg._cleanup?.();
      _arrowSvg.remove();
      _arrowSvg = null;
    }
  }

  return {
    centerOf,
    beam,
    burst,
    impactBurst,
    legendaryBurst,
    epicBurst,
    rareBurst,
    healBurst,
    deathBurst,
    shieldPopBurst,
    heroPowerBurst,
    trail,
    glow,
    shake,
    sparkTrail,
    floatingText,
    damageNumber,
    healNumber,
    attackArc,
    showTargetArrow,
    hideTargetArrow,
    destroy,
  };
}
