// GLSL for the scene engines. Every engine is a scalar field t in 0..1 (calm to bright) that the
// finish maps onto the scene's colour ramp, so any engine composes with any finish. One program is
// compiled per engine + finish pair, on first use, with only that engine's code in it.
//
// GLSL ES 1.00 (WebGL 1) so it runs on every GPU Electron supports, including software fallbacks.

import { CLICK_LIFE } from './pointer.js'

export const ENGINES = [
  'radiance', 'temple', 'summit', 'aurora', 'clouds', 'moonsea', 'dunes', 'blackhole', 'planet', 'skyline', 'sakura',
  'gradient', 'nebula', 'tides', 'starfield', 'embers', 'streaks', 'wings', 'horizon', 'rain', 'constellation',
  'marble', 'plasma', 'svg'
]
export const FINISHES = ['none', 'dither', 'halftone', 'ascii', 'braille', 'grain', 'scanlines', 'crt', 'glitch', 'pixel']

export const VERTEX = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`

const COMMON = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec3 u_c0, u_c1, u_c2, u_c3, u_c4;
uniform float u_n;
uniform float u_scale, u_intensity, u_density, u_seed;
uniform vec2 u_dir;
uniform float u_cell, u_levels, u_pattern;
uniform sampler2D u_glyphs;
uniform float u_glyphCount;
uniform sampler2D u_tex;
uniform float u_invert;
uniform vec3 u_pointer;
uniform float u_pmode;
uniform vec2 u_pvel;
uniform vec3 u_click0, u_click1, u_click2, u_click3;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = r * p * 2.02 + vec2(1.7, 9.2);
    a *= 0.5;
  }
  return v;
}

// Twinkling point stars in a cell grid; shared by every sky.
float stars(vec2 p, float cells, float t, float seed, float density) {
  vec2 g = p * cells;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5;
  float h = hash(id + seed);
  float alive = step(h, density);
  vec2 o = (vec2(hash(id + seed + 3.1), hash(id + seed + 7.7)) - 0.5) * 0.7;
  float d = length(f - o);
  float tw = 0.55 + 0.45 * sin(t * (0.8 + 2.4 * h) + h * 40.0);
  float size = 0.05 + 0.09 * hash(id + seed + 1.3);
  return alive * tw * (smoothstep(size, 0.0, d) + 0.3 * smoothstep(size * 3.5, 0.0, d));
}

// A 1D ridgeline (mountain silhouettes): ridged fbm, sharp peaks and soft valleys.
float ridge(float x, float seed) {
  float h = 0.0;
  float a = 0.5;
  float f = 1.0;
  for (int i = 0; i < 6; i++) {
    float n = 1.0 - abs(noise(vec2(x * f, seed + float(i) * 7.3)) * 2.0 - 1.0);
    h += a * n * n;
    f *= 2.07;
    a *= 0.48;
  }
  return h;
}

float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

vec3 ramp(float t) {
  t = clamp(t, 0.0, 1.0) * (u_n - 1.0);
  vec3 c = mix(u_c0, u_c1, clamp(t, 0.0, 1.0));
  c = mix(c, u_c2, clamp(t - 1.0, 0.0, 1.0));
  c = mix(c, u_c3, clamp(t - 2.0, 0.0, 1.0));
  c = mix(c, u_c4, clamp(t - 3.0, 0.0, 1.0));
  return c;
}

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
float bayer2s(vec2 a) { return bayer2(a); }
float ign(vec2 a) { return fract(52.9829189 * fract(dot(a, vec2(0.06711056, 0.00583715)))); }
`

// Each engine: float engine(vec2 p, float t). p is centred, y spans -0.5..0.5, already divided by scale.
const ENGINE_SRC = {
  radiance: `
float engine(vec2 p, float t) {
  vec2 c = vec2(0.3, 0.03);
  vec2 d = p - c;
  float r = length(d);
  float a = atan(d.y, d.x) + t * 0.012;
  float r0 = 0.165;
  float n = 200.0;
  float k = a / 6.28318 * n;
  float id = floor(k);
  float f = abs(fract(k) - 0.5);
  float h = hash(vec2(id, 3.7));
  float len = 0.18 + 0.62 * pow(hash(vec2(id, 9.1)), 1.4);
  float line = 1.0 - smoothstep(0.06 + 0.06 * h, 0.16 + 0.06 * h, f);
  float reach = smoothstep(r0 + 0.004, r0 + 0.02, r) * (1.0 - smoothstep(r0 + len * 0.75, r0 + len, r));
  float sheaf = 0.45 + 0.9 * smoothstep(0.5, 0.95, noise(vec2(a * 2.6, 1.7)));
  float shimmer = 0.65 + 0.35 * sin(t * (0.5 + h) + h * 30.0);
  float rays = line * reach * sheaf * shimmer * (0.5 + 0.5 * h);
  float disc = 1.0 - smoothstep(r0 - 0.003, r0, r);
  float hatch = smoothstep(0.35, 0.85, 0.5 + 0.5 * sin((p.y + 0.02 * fbm(d * 9.0)) * 540.0));
  float engraving = disc * (0.18 + 0.42 * hatch * smoothstep(0.25, 0.75, fbm(d * 10.0 + t * 0.03)));
  float ring = exp(-abs(r - r0) * 300.0);
  float dots = exp(-abs(r - r0 - 0.03) * 420.0) * step(0.55, fract(a * 72.0 / 6.28318));
  float field = 0.07 * fbm(p * 2.5 + t * 0.015) + 0.14 * exp(-r * 4.5);
  return clamp(field + rays + engraving + ring * 0.85 + dots * 0.5, 0.0, 1.0);
}`,
  temple: `
float tBox(vec2 p, vec2 c, vec2 b) {
  vec2 d = abs(p - c) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

// One cell of a Greek key: c runs 0..1 along the band and 0..1 across it; distance to the stroke.
float tKey(vec2 c) {
  float d = segDist(c, vec2(0.0, 0.0), vec2(1.0, 0.0));
  d = min(d, segDist(c, vec2(0.0, 0.0), vec2(0.0, 1.0)));
  d = min(d, segDist(c, vec2(0.0, 1.0), vec2(0.75, 1.0)));
  d = min(d, segDist(c, vec2(0.75, 1.0), vec2(0.75, 0.25)));
  d = min(d, segDist(c, vec2(0.75, 0.25), vec2(0.25, 0.25)));
  d = min(d, segDist(c, vec2(0.25, 0.25), vec2(0.25, 0.75)));
  return min(d, segDist(c, vec2(0.25, 0.75), vec2(0.5, 0.75)));
}

// Backlit marble, engraved: dark stone in fine diagonal hatching, flutes, and a bright rim where the
// light wraps the edge. x runs -1..1 across the drum.
float tFluted(float x, vec2 p) {
  float f = fract((x * 0.5 + 0.5) * 5.0);
  float flute = 1.0 - smoothstep(0.0, 0.16, min(f, 1.0 - f));
  float hatch = smoothstep(0.7, 1.0, 0.5 + 0.5 * sin((p.x + p.y) * 640.0));
  return 0.07 + 0.16 * flute + 0.1 * hatch + 0.62 * smoothstep(0.66, 0.97, abs(x));
}

// A column drum adrift: centre c, half size b, tilted by ang. Returns (distance, value).
vec2 tDrum(vec2 p, vec2 c, vec2 b, float ang) {
  vec2 q = p - c;
  float s = sin(ang);
  float k = cos(ang);
  q = vec2(k * q.x + s * q.y, -s * q.x + k * q.y);
  vec2 dd = abs(q) - b;
  float sd = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0);
  float val = tFluted(q.x / b.x, q) + 0.5 * exp(-abs(abs(q.y) - b.y) * 600.0);
  return vec2(sd, val);
}

// A white feather adrift: shaft, a vane in fine engraved barbs, a curved tip. Returns (coverage, value).
vec2 tFeather(vec2 p, vec2 c, float ang, float L, float px) {
  vec2 q = p - c;
  float s = sin(ang);
  float k = cos(ang);
  q = vec2(k * q.x + s * q.y, -s * q.x + k * q.y);
  float y = q.y / L;
  float x = q.x + 0.1 * L * (4.0 * y * y - 1.0);
  float w = 0.17 * L * sqrt(max(1.0 - 4.0 * y * y, 0.0)) * (0.75 + 0.35 * (y + 0.5));
  float vane = (1.0 - smoothstep(-px, px, abs(x) - w)) * step(-0.42, y);
  float shaft = (1.0 - smoothstep(0.0012, 0.0012 + px, abs(x))) * step(-0.62, y) * step(y, 0.48);
  float barbs = smoothstep(0.35, 0.8, 0.5 + 0.5 * sin((abs(x) * 0.7 - q.y) * 900.0));
  float edge = exp(-abs(abs(x) - w) * 900.0) * vane;
  float cov = max(vane, shaft);
  return vec2(cov, min(0.42 + 0.3 * barbs * vane + 0.3 * edge + 0.35 * shaft, 0.74));
}

// The top of a bank of cumulus: the highest of a row of round puffs.
float tPuffs(float x, float base, float w, float seed) {
  float top = base - 1.0;
  float cell = floor(x / w);
  for (int i = -2; i <= 2; i++) {
    float ci = cell + float(i);
    float cx = (ci + 0.5 + 0.35 * (hash(vec2(ci, seed)) - 0.5)) * w;
    float rr = w * (0.6 + 0.9 * hash(vec2(ci, seed + 1.7)));
    float dx = x - cx;
    top = max(top, base + 0.25 * rr * hash(vec2(ci, seed + 4.1)) + 0.62 * sqrt(max(rr * rr - dx * dx, 0.0)));
  }
  return top;
}

// Inside a cloud: a silver lining at its top edge where the sun is behind, engraved lines below it.
float tCloud(vec2 p, float top, float lit, float t) {
  float dIn = max(top - p.y, 0.0);
  float body = (0.45 + 0.55 * fbm(vec2(p.x * 5.0 + t * 0.01, p.y * 9.0))) * exp(-dIn * 7.0) * lit;
  float lines = smoothstep(1.0 - body, 1.12 - body, 0.5 + 0.5 * sin(p.y * 560.0 + 2.0 * body));
  return 0.1 + 0.42 * lines * body + 0.12 * body + 0.65 * lit * exp(-dIn * 240.0);
}

float engine(vec2 p, float t) {
  float px = 1.2 / u_res.y;
  vec2 T = vec2(0.3, -0.02);
  vec2 S = T + vec2(0.0, 0.1);
  float R = 0.2;
  vec2 d = p - S;
  float r = length(d);
  float a = atan(d.y, d.x);
  float lit = 0.3 + 0.7 * exp(-abs(p.x - S.x) * 2.5);

  // Sky: Nous blue deepening upward, a soft glow around the sun, engraved horizontal hatching, a few stars.
  float v = 0.1 + 0.1 * smoothstep(0.5, -0.25, p.y) + 0.22 * exp(-r * 3.2) + 0.05 * fbm(p * 2.0 + vec2(t * 0.01, 0.0));
  v += 0.035 * smoothstep(0.6, 1.0, 0.5 + 0.5 * sin(p.y * 420.0 + 2.0 * fbm(p * 3.0)));
  v += 0.5 * stars(p + vec2(t * 0.002, 0.0), 26.0, t, 11.0, 0.12) * smoothstep(0.05, 0.4, p.y);

  // Engraved rays fanning out behind everything; they stay white, the gold is the sun's alone.
  float k = (a + t * 0.01) / 6.28318 * 180.0;
  float id = floor(k);
  float h = hash(vec2(id, 3.7));
  float len = 0.15 + 0.75 * pow(hash(vec2(id, 9.1)), 1.3);
  float line = 1.0 - smoothstep(0.05 + 0.05 * h, 0.14 + 0.06 * h, abs(fract(k) - 0.5));
  float r0 = R + 0.06;
  float reach = smoothstep(r0, r0 + 0.02, r) * (1.0 - smoothstep(r0 + len * 0.7, r0 + len, r));
  float sheaf = 0.4 + 0.9 * smoothstep(0.45, 0.95, noise(vec2(a * 2.6, 1.7 + t * 0.02)));
  float shimmer = 0.6 + 0.4 * sin(t * (0.4 + h) + h * 30.0);
  v = min(v + 0.75 * line * reach * sheaf * shimmer * (0.45 + 0.55 * h), 0.74);

  // An astrolabe circle with fine ticks, two small bodies on slow orbits.
  float rO = R + 0.19;
  float ticks = (1.0 - smoothstep(0.04, 0.08, abs(fract(a / 6.28318 * 72.0) - 0.5) * 2.0 - 0.9)) * step(rO, r) * step(r, rO + 0.01);
  v = max(v, 0.38 * exp(-abs(r - rO) * 1400.0) + 0.3 * ticks);
  for (int m = 0; m < 2; m++) {
    float am = t * (0.03 + 0.015 * float(m)) + float(m) * 2.6;
    vec2 body = S + vec2(cos(am), sin(am)) * (rO + 0.005);
    v = max(v, 0.75 * (1.0 - smoothstep(0.004, 0.006, length(p - body))));
  }

  // A Greek key ring turning slowly around the sun, between two fine circles.
  float r1 = R + 0.016;
  float r2 = R + 0.05;
  float band = step(r1, r) * step(r, r2);
  float u = (a / 6.28318 + 0.5) * 44.0 + t * 0.03;
  float key = 1.0 - smoothstep(0.06, 0.1, tKey(vec2(fract(u), (r - r1) / (r2 - r1) * 1.3 - 0.15)));
  v = mix(v, 0.2 + 0.55 * key, band);
  v += 0.5 * (exp(-abs(r - r1 + 0.004) * 900.0) + exp(-abs(r - r2 - 0.004) * 900.0));

  // The sun: an engraved disc with a hot gold core and a bright rim.
  float hatch = smoothstep(0.3, 0.8, 0.5 + 0.5 * sin((d.y + 0.015 * fbm(d * 8.0 + t * 0.02)) * 380.0));
  float sun = 0.5 + 0.25 * hatch + 0.45 * exp(-r / R * 2.2);
  v = mix(v, sun, 1.0 - smoothstep(R - px, R, r));
  v += 0.6 * exp(-abs(r - R) * 400.0);

  // The far bank of cloud, behind the temple.
  float topB = tPuffs(p.x + t * 0.004, -0.19, 0.045, 3.0);
  v = mix(v, tCloud(p, topB, lit, t), smoothstep(topB + px, topB - px, p.y));

  // The temple, backlit: three steps, six columns (one broken), its roof floating free above them.
  vec2 q = p - T;
  float cov = 0.0;
  float stone = 0.0;
  for (int s = 0; s < 3; s++) {
    float fs = float(s);
    float top = -0.13 - 0.016 * fs;
    float c = 1.0 - smoothstep(-px, px, tBox(q, vec2(0.0, top - 0.008), vec2(0.235 + 0.016 * fs, 0.008)));
    stone = mix(stone, 0.08 + 0.1 * smoothstep(0.7, 1.0, 0.5 + 0.5 * sin((q.x + q.y) * 640.0)) + 0.55 * exp(-abs(q.y - top) * 900.0), c);
    cov = max(cov, c);
  }
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float cx = -0.19 + fi * 0.076;
    float broken = step(3.5, fi) * step(fi, 4.5);
    float top = mix(0.06, -0.02 + 0.016 * noise(vec2(q.x * 90.0, fi)), broken);
    float hw = 0.0165 - 0.0025 * clamp((q.y + 0.13) / 0.19, 0.0, 1.0);
    float c = 1.0 - smoothstep(-px, px, max(abs(q.x - cx) - hw, max(-0.13 - q.y, q.y - top)));
    stone = mix(stone, tFluted((q.x - cx) / hw, q), c);
    cov = max(cov, c);
    float cap = min(tBox(q, vec2(cx, 0.065), vec2(0.021, 0.005)), tBox(q, vec2(cx, 0.074), vec2(0.026, 0.004)));
    c = (1.0 - smoothstep(-px, px, cap)) * (1.0 - broken);
    stone = mix(stone, 0.08 + 0.5 * exp(-abs(q.y - 0.078) * 900.0) + 0.35 * exp(-abs(q.y - 0.07) * 900.0), c);
    cov = max(cov, c);
  }
  // The broken column's upper drums drift up into the light.
  for (int j = 0; j < 3; j++) {
    float fj = float(j);
    vec2 dr = tDrum(q, vec2(0.114 + 0.006 * sin(t * 0.2 + fj * 2.4), 0.014 + 0.042 * fj + 0.006 * sin(t * 0.5 + fj * 2.0)),
                    vec2(0.0145, 0.016), 0.14 * sin(t * 0.3 + fj * 1.7) + 0.1 * (fj - 1.0));
    float c = 1.0 - smoothstep(-px, px, dr.x);
    stone = mix(stone, dr.y, c);
    cov = max(cov, c);
  }
  // Entablature and pediment, lifted on the light.
  float L = 0.034 + 0.006 * sin(t * 0.4);
  float yA = 0.078 + L;
  float c = 1.0 - smoothstep(-px, px, tBox(q, vec2(0.0, yA + 0.011), vec2(0.225, 0.011)));
  stone = mix(stone, 0.08 + 0.5 * exp(-abs(q.y - yA) * 900.0) + 0.4 * exp(-abs(q.y - yA - 0.022) * 900.0) + 0.2 * exp(-abs(q.y - yA - 0.011) * 900.0), c);
  cov = max(cov, c);
  float yF = yA + 0.022;
  c = 1.0 - smoothstep(-px, px, tBox(q, vec2(0.0, yF + 0.013), vec2(0.225, 0.013)));
  float fkey = 1.0 - smoothstep(0.07, 0.11, tKey(vec2(fract(q.x / 0.026 + 0.5), (q.y - yF) / 0.026 * 1.3 - 0.15)));
  stone = mix(stone, 0.09 + 0.5 * fkey, c);
  cov = max(cov, c);
  float yC = yF + 0.026;
  c = 1.0 - smoothstep(-px, px, tBox(q, vec2(0.0, yC + 0.005), vec2(0.24, 0.005)));
  float dentils = step(0.5, fract(q.x * 110.0)) * step(q.y, yC + 0.004);
  stone = mix(stone, 0.1 + 0.2 * dentils + 0.55 * exp(-abs(q.y - yC - 0.01) * 900.0), c);
  cov = max(cov, c);
  float yP = yC + 0.01;
  float ped = min(q.y - yP, yP + 0.07 * (1.0 - abs(q.x) / 0.24) - q.y);
  c = smoothstep(-px, px, ped);
  float inner = min(q.y - yP - 0.007, yP + 0.07 * (1.0 - abs(q.x) / 0.24) - 0.011 - q.y);
  float emblem = length(q - vec2(0.0, yP + 0.024));
  float pedVal = 0.08 + 0.1 * smoothstep(0.7, 1.0, 0.5 + 0.5 * sin((q.x + q.y) * 640.0)) + 0.5 * exp(-abs(inner) * 800.0)
    + 0.6 * (1.0 - smoothstep(0.007, 0.0085, emblem)) + 0.4 * exp(-abs(emblem - 0.012) * 1600.0);
  stone = mix(stone, pedVal, c);
  cov = max(cov, c);
  v = mix(v, stone, cov);
  v += 0.1 * exp(-r * 4.0);

  // Feathers drifting down past the temple, swaying as they fall.
  for (int f = 0; f < 5; f++) {
    float ff = float(f);
    float hx = hash(vec2(ff, 21.0));
    float fall = fract(hash(vec2(ff, 5.0)) - t * (0.004 + 0.003 * hx));
    vec2 fc = vec2(mix(-0.7, 0.85, fract(hx + ff * 0.37)) + 0.03 * sin(t * 0.45 + ff * 2.3), 0.52 - fall * 1.0);
    vec2 fe = tFeather(p, fc, 0.9 * sin(t * 0.35 + ff * 1.7) + 0.6 * (hx - 0.5), 0.06 + 0.035 * hash(vec2(ff, 9.0)), px);
    v = mix(v, fe.y, fe.x);
  }

  // The near bank of cloud, over the temple's lowest step, in stacked puffs.
  float drift = p.x - t * 0.007;
  float topF = tPuffs(drift, -0.255, 0.07, 9.0);
  float e1 = tPuffs(drift + 0.031, -0.32, 0.065, 13.0);
  float e2 = tPuffs(drift + 0.017, -0.39, 0.085, 17.0);
  float cf = tCloud(p, topF, lit * 0.95, t);
  cf = mix(cf, tCloud(p, e1, lit * 0.85, t), step(p.y, e1));
  cf = mix(cf, tCloud(p, e2, lit * 0.75, t), step(p.y, e2));
  v = mix(v, cf, smoothstep(topF + px, topF - px, p.y));

  // Motes rising in the glow.
  v += 0.6 * stars(p + vec2(0.0, -t * 0.015), 55.0, t * 2.0, 5.0, 0.08) * exp(-r * 3.0);
  return clamp(v, 0.0, 1.0);
}`,
  summit: `
float engine(vec2 p, float t) {
  float drift = t * 0.005;
  float v = 0.16 + 0.44 * smoothstep(0.55, -0.1, p.y);
  vec2 sp = vec2(0.42, 0.13);
  float sd = length(p - sp);
  v += 0.5 * exp(-sd * 8.0);
  v = max(v, smoothstep(0.065, 0.059, sd));
  float wisps = fbm(vec2(p.x * 1.2 + t * 0.007, p.y * 7.5 - 1.3));
  v += 0.16 * smoothstep(0.55, 0.85, wisps) * smoothstep(-0.02, 0.22, p.y);
  v += 0.55 * stars(p + vec2(drift * 0.2, 0.0), 24.0, t, 3.0, 0.3) * smoothstep(0.12, 0.45, p.y);
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float base = 0.04 - fi * 0.12;
    float amp = 0.17 + fi * 0.07;
    float x = (p.x + drift * (fi + 1.0)) * (1.1 + fi * 0.45) + fi * 13.0;
    float h = base + amp * ridge(x, fi * 4.0);
    float fog = 0.12 * smoothstep(0.07, 0.0, abs(p.y - (base - 0.015))) * (0.6 + 0.4 * fbm(vec2(p.x * 3.0 - t * 0.02, fi)));
    if (p.y < h) {
      float tone = 0.44 - fi * 0.13;
      float rim = smoothstep(0.01, 0.0, h - p.y) * (0.24 - fi * 0.05) * smoothstep(-0.6, 0.5, p.x);
      v = tone + rim;
    }
    v += fog * (1.0 - fi * 0.2);
  }
  return clamp(v, 0.0, 1.0);
}`,
  clouds: `
float engine(vec2 p, float t) {
  float hz = 0.03;
  float v = 0.34 + 0.38 * smoothstep(0.55, hz, p.y);
  vec2 sp = vec2(-0.4, hz + 0.07);
  float sd = length(p - sp);
  v += 0.5 * exp(-sd * 6.0);
  v = max(v, smoothstep(0.05, 0.045, sd));
  float ang = atan(p.y - sp.y, p.x - sp.x);
  v += 0.1 * smoothstep(0.55, 1.0, noise(vec2(ang * 9.0, t * 0.04))) * exp(-sd * 1.8) * step(sp.y, p.y);
  v += 0.12 * smoothstep(0.55, 0.8, fbm(vec2(p.x * 1.4 + t * 0.008, p.y * 8.0))) * step(hz + 0.12, p.y);
  if (p.y < hz) {
    float z = 0.36 / (hz - p.y + 0.035);
    vec2 c = vec2(p.x * z * 0.9 + t * 0.025, z * 0.55 + t * 0.018);
    float dens = fbm(c * 0.85);
    float puff = smoothstep(0.38, 0.72, dens);
    float lit = clamp(dens - fbm(c * 0.85 + vec2(0.22, -0.1)), -0.3, 0.3);
    float cloud = 0.4 + 0.42 * puff + 1.5 * lit;
    float near = smoothstep(16.0, 2.0, z);
    v = mix(v, cloud, near * (0.55 + 0.45 * puff));
    v = mix(v, 0.7, smoothstep(5.0, 13.0, z) * 0.55);
  }
  return clamp(v, 0.0, 1.0);
}`,
  moonsea: `
float engine(vec2 p, float t) {
  float hz = -0.06;
  vec2 mp = vec2(0.34, 0.23);
  float md = length(p - mp);
  if (p.y > hz) {
    float v = 0.05 + 0.16 * smoothstep(0.5, hz, p.y);
    v += 0.7 * stars(p, 32.0, t, 2.0, 0.4) * (1.0 - exp(-md * 5.0));
    v += 0.32 * exp(-md * 7.0);
    float disc = smoothstep(0.07, 0.066, md);
    float maria = fbm((p - mp) * 26.0);
    v = mix(v, 0.86 + 0.14 * smoothstep(0.35, 0.65, maria) - 0.14 * smoothstep(0.58, 0.78, maria), disc);
    v += 0.1 * smoothstep(0.55, 0.8, fbm(vec2(p.x * 2.0 - t * 0.01, p.y * 9.0))) * exp(-md * 3.0);
    return clamp(v, 0.0, 1.0);
  }
  float depth = hz - p.y;
  float z = 0.22 / (depth + 0.01);
  vec2 w = vec2(p.x * z * 7.0, z * 2.6 + t * 0.32);
  float waves = noise(w) * 0.6 + noise(w * 2.3 + t * 0.2) * 0.4;
  float spread = 0.025 + depth * 0.85;
  float path = exp(-pow((p.x - mp.x) / spread, 2.0));
  float glint = smoothstep(0.64, 0.86, waves) * path;
  float sea = 0.05 + 0.1 * waves * clamp(1.0 - depth * 1.3, 0.0, 1.0) + 0.14 * exp(-depth * 28.0);
  return clamp(sea + glint + path * 0.07, 0.0, 1.0);
}`,
  dunes: `
float dune(float x, float fi) {
  float k = x * (1.4 + fi * 0.6) + fi * 3.7;
  float w = 0.5 + 0.5 * sin(k + 0.6 * sin(k * 0.5 + fi));
  return pow(w, 1.8) + 0.18 * fbm(vec2(x * 1.5, fi * 3.1));
}
float engine(vec2 p, float t) {
  float hz = -0.02;
  float v = 0.3 + 0.4 * smoothstep(0.55, hz, p.y);
  vec2 sp = vec2(0.3, hz + 0.11);
  float sd = length(p - sp);
  v += 0.45 * exp(-sd * 5.0);
  v = max(v, smoothstep(0.11, 0.104, sd));
  v += 0.08 * smoothstep(0.6, 0.85, fbm(vec2(p.x * 1.2 + t * 0.006, p.y * 9.0))) * step(hz + 0.05, p.y);
  float x = p.x + sin(p.y * 240.0 + t * 3.0) * 0.003 * smoothstep(0.07, 0.0, abs(p.y - hz));
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float xs = x + t * 0.004 * (fi + 1.0);
    float base = hz - 0.04 - fi * 0.15;
    float amp = 0.07 + fi * 0.06;
    float crest = base + amp * dune(xs, fi);
    if (p.y < crest) {
      float e = 0.004;
      float slope = (dune(xs + e, fi) - dune(xs - e, fi)) / (2.0 * e) * amp;
      float lit = smoothstep(0.25, -0.25, slope);
      float depth = clamp((crest - p.y) / (amp + 0.1), 0.0, 1.0);
      float tone = mix(0.12, 0.5, lit) - fi * 0.05 - depth * 0.08;
      float ripples = 0.035 * lit * smoothstep(0.2, 1.0, sin((p.y - crest) * 380.0 + xs * 22.0 + fbm(p * 6.0) * 4.0));
      float edge = smoothstep(0.005, 0.0, crest - p.y) * 0.22;
      float blow = smoothstep(0.03, 0.0, crest - p.y) * smoothstep(0.6, 0.9, noise(vec2(p.x * 30.0 - t * 2.0, p.y * 60.0))) * 0.2;
      v = tone + ripples + edge + blow;
    }
  }
  return clamp(v, 0.0, 1.0);
}`,
  blackhole: `
float disk(vec2 q, float t) {
  float rd = length(q);
  float a = atan(q.y, q.x);
  float inner = 0.15;
  float outer = 0.78;
  float band = smoothstep(inner, inner + 0.02, rd) * (1.0 - smoothstep(outer * 0.45, outer, rd));
  float swirl = fbm(vec2(rd * 10.0, a * 2.0 + t * 0.9 / (rd + 0.15)));
  float lanes = 0.5 + 0.5 * sin(rd * 120.0 + swirl * 7.0);
  float heat = pow(1.0 - clamp((rd - inner) / (outer - inner), 0.0, 1.0), 1.7);
  return band * (0.18 + 0.82 * heat) * (0.5 + 0.5 * swirl) * (0.7 + 0.3 * lanes);
}
float engine(vec2 p, float t) {
  vec2 c = vec2(0.3, 0.04);
  vec2 q = p - c;
  float r = length(q);
  float la = atan(q.y, q.x);
  float rs = 0.12;
  vec2 bent = q * (1.0 + rs * rs * 1.8 / max(r * r, 0.0004));
  float v = 0.03 + 0.6 * stars(bent + c, 36.0, t, 6.0, 0.3);
  // The far side of the disk, bent by gravity into a thin ring over and under the shadow.
  float ringR = 0.15 + max(r - rs * 1.12, 0.0) * 3.2;
  float ring = disk(vec2(cos(la), sin(la)) * ringR, t);
  float ringMask = smoothstep(rs * 1.07, rs * 1.13, r) * (1.0 - smoothstep(rs * 1.5, rs * 1.95, r));
  v = max(v, ring * ringMask * (0.55 + 0.45 * abs(sin(la))) * 1.3);
  v = max(v, exp(-abs(r - rs * 1.09) * 220.0));
  v *= smoothstep(rs * 0.98, rs * 1.02, r);
  // The near side of the disk crossing in front, nearly edge-on; the approaching side is brighter.
  vec2 dq = vec2(q.x, q.y / 0.15) / 1.25;
  float front = disk(dq, t) * (0.78 + 0.32 * (-dq.x / (length(dq) + 0.001)));
  float visible = q.y < 0.0 ? 1.0 : step(rs * 1.02, r);
  v = max(v, front * visible * 1.15);
  v += 0.1 * exp(-r * 5.0) * (1.0 - smoothstep(rs * 0.98, rs * 1.02, r) * 0.0);
  return clamp(v, 0.0, 1.0);
}`,
  planet: `
float engine(vec2 p, float t) {
  vec2 c = vec2(-0.12, -1.06);
  float R = 0.93;
  vec2 q = (p - c) / R;
  float d = length(q);
  vec3 L = normalize(vec3(0.72, 0.58, 0.32));
  float v = 0.03 + 0.5 * stars(p, 30.0, t, 9.0, 0.32) * smoothstep(1.0, 1.2, d);
  float side = dot(normalize(vec3(q, 0.0001)), L);
  v += exp(-(d - 1.0) * 26.0) * step(1.0, d) * (0.2 + 0.8 * smoothstep(-0.3, 0.6, side)) * 0.95;
  if (d < 1.0) {
    vec3 n = vec3(q, sqrt(1.0 - d * d));
    float rot = t * 0.01;
    vec3 s = vec3(n.x * cos(rot) + n.z * sin(rot), n.y, -n.x * sin(rot) + n.z * cos(rot));
    vec2 uv = vec2(atan(s.x, s.z), asin(s.y)) * 1.6;
    float land = smoothstep(0.48, 0.56, fbm(uv * 1.3 + 3.0));
    float cloud = smoothstep(0.5, 0.8, fbm(uv * 2.2 + vec2(t * 0.012, 0.0)));
    float light = dot(n, L);
    float day = smoothstep(-0.05, 0.25, light);
    float surface = mix(0.16, 0.3, land) + 0.45 * cloud;
    float lit = surface * (0.3 + 0.7 * max(light, 0.0)) * day;
    vec2 cell = floor(uv * 60.0);
    float city = land * step(0.82, hash(cell)) * smoothstep(0.1, -0.15, light) * (0.6 + 0.4 * sin(t + hash(cell) * 9.0));
    float rim = pow(1.0 - n.z, 3.0) * (0.35 + 0.65 * smoothstep(-0.2, 0.5, light));
    v = lit + city * 0.7 + rim * 0.6 + 0.02;
  }
  vec2 fp = c + normalize(L.xy) * R;
  float fd = length(p - fp);
  v += 0.9 * exp(-fd * 26.0) + 0.22 * exp(-fd * 5.0) + 0.12 * exp(-abs(p.y - fp.y) * 60.0) * exp(-abs(p.x - fp.x) * 2.0);
  return clamp(v, 0.0, 1.0);
}`,
  skyline: `
float engine(vec2 p, float t) {
  float street = -0.3;
  float y = p.y;
  bool mirror = y < street;
  if (mirror) y = 2.0 * street - y;
  float x = p.x + (mirror ? 0.007 * sin(p.y * 140.0 + t * 2.0) : 0.0);
  float v = 0.08 + 0.34 * smoothstep(0.5, street, y);
  vec2 mp = vec2(0.36, 0.18);
  float md = length(vec2(x, y) - mp);
  v = max(v, 0.5 * smoothstep(0.13, 0.125, md) * (0.85 + 0.15 * step(0.5, fract(y * 38.0))));
  v += 0.12 * exp(-md * 4.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float w = 0.07 + 0.035 * fi;
    float bx = (x + fi * 3.7 + t * 0.002 * (fi + 1.0)) / w;
    float bid = floor(bx);
    float fx = fract(bx);
    float h = street + 0.07 + 0.05 * (2.0 - fi) + (0.42 - fi * 0.09) * pow(hash(vec2(bid, fi)), 1.2);
    float spire = step(0.8, hash(vec2(bid, fi + 9.0))) * step(abs(fx - 0.5), 0.06) * 0.08;
    if (y < h + spire) {
      float tone = 0.2 - fi * 0.075;
      vec2 wc = vec2(fx * 4.0, (y - street) * (60.0 + fi * 18.0));
      vec2 wid = floor(wc);
      vec2 wf = fract(wc);
      float win = step(0.22, wf.x) * step(wf.x, 0.78) * step(0.28, wf.y) * step(wf.y, 0.78) * step(y, h - 0.01);
      float on = step(0.66, hash(wid + bid * 13.0 + fi));
      float warm = step(0.5, hash(wid + bid * 7.0));
      float flick = 0.9 + 0.1 * sin(t * 0.4 + hash(wid) * 40.0);
      float lit = win * on * flick * mix(0.62, 0.72, warm) * (0.75 + 0.12 * fi);
      float sign = step(0.7, hash(vec2(bid, 7.0 + fi))) * step(1.5, fi);
      float sy = street + 0.04 + 0.12 * hash(vec2(bid, 3.0));
      float tube = (1.0 - smoothstep(0.02, 0.05, abs(fx - 0.82))) * step(abs(y - sy - 0.07), 0.07);
      float pulse = 0.75 + 0.25 * step(0.25, fract(t * 0.25 + hash(vec2(bid, 1.0))));
      v = max(tone + lit, sign * tube * pulse * 0.95);
      v *= 0.55 + 0.45 * step(0.04, fx) * step(fx, 0.96);
    }
  }
  vec2 rc = vec2((p.x + p.y * 0.2) * 150.0, p.y * 5.0 + t * 7.0);
  float col = floor(rc.x);
  float drop = step(0.93, hash(vec2(col, floor(rc.y + hash(vec2(col, 2.0)) * 10.0))));
  v += drop * smoothstep(0.0, 0.7, fract(rc.y)) * step(abs(fract(rc.x) - 0.5), 0.1) * 0.14;
  if (mirror) v *= 0.55 + 0.12 * sin(p.y * 360.0 + t);
  return clamp(v, 0.0, 1.0);
}`,
  sakura: `
float petal(vec2 q, float ang) {
  float c = cos(ang);
  float s = sin(ang);
  q = mat2(c, -s, s, c) * q;
  q.x *= 1.6;
  float body = smoothstep(0.52, 0.4, length(q));
  float notch = smoothstep(0.16, 0.05, length(q - vec2(0.0, 0.5)));
  return body * (1.0 - notch);
}
float blossoms(vec2 p) {
  vec2 g = p * 52.0;
  vec2 id = floor(g);
  vec2 f = fract(g) - 0.5 - (vec2(hash(id), hash(id + 1.7)) - 0.5) * 0.5;
  return smoothstep(0.44, 0.2, length(f)) * (0.55 + 0.45 * hash(id + 5.0));
}
float cluster(vec2 p, float t) {
  vec2 g = p * vec2(9.0, 7.5);
  vec2 id = floor(g);
  float best = 0.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 n = id + vec2(float(i), float(j));
      vec2 o = vec2(hash(n), hash(n + 3.7)) + 0.06 * sin(t * 0.5 + hash(n) * 9.0);
      float r = 0.35 + 0.3 * hash(n + 8.0);
      float d = length(g - n - o) / r;
      best = max(best, smoothstep(1.0, 0.75, d) * (0.6 + 0.4 * (1.0 - d)));
    }
  }
  return best;
}
float engine(vec2 p, float t) {
  float v = 0.04 + 0.09 * smoothstep(-0.5, 0.5, p.y);
  float edge = 0.19 + 0.12 * fbm(vec2(p.x * 2.0, 1.0)) + 0.06 * sin(p.x * 2.4 + 0.7);
  float reach = smoothstep(edge - 0.06, edge + 0.08, p.y);
  float blooms = cluster(p + vec2(t * 0.003, 0.0), t) * reach;
  float flowers = blossoms(p + vec2(t * 0.003, 0.0));
  float bough = edge + 0.05 + 0.035 * sin(p.x * 5.0 + 1.3) + 0.02 * fbm(vec2(p.x * 6.0, 7.0));
  float branch = smoothstep(0.009, 0.0, abs(p.y - bough)) * smoothstep(-0.9, -0.2, -abs(p.x - 0.1));
  v = mix(v, 0.95, branch * 0.9);
  v = max(v, blooms * (0.3 + 0.55 * flowers));
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float cells = 2.6 + fl * 2.0;
    vec2 q = p * cells + vec2(t * (0.16 + fl * 0.06), t * (0.3 + fl * 0.12));
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 5.0);
    float alive = step(h, 0.22 + 0.4 * u_density);
    vec2 o = (vec2(hash(id + 1.3), hash(id + 4.1)) - 0.5) * 0.4 + vec2(0.1 * sin(t * 1.1 + h * 20.0), 0.0);
    float ang = t * (0.6 + h) + h * 6.28;
    float size = 0.15 + 0.08 * hash(id + 9.0);
    float pe = petal((f - o) / size, ang) * (0.6 + 0.4 * abs(sin(ang * 1.3)));
    v = max(v, alive * pe * (0.48 + fl * 0.18));
  }
  return clamp(v, 0.0, 1.0);
}`,
  gradient: `
float engine(vec2 p, float t) {
  float a = dot(p, u_dir);
  float w = fbm(p * 0.8 + vec2(t * 0.03, -t * 0.02));
  float v = 0.5 + 0.5 * sin(a * 2.4 + w * 3.2 + t * 0.12);
  return smoothstep(0.0, 1.0, v) * 0.92 + 0.08 * w;
}`,
  nebula: `
float engine(vec2 p, float t) {
  p *= 1.7;
  vec2 q = vec2(fbm(p + vec2(0.0, t * 0.035)), fbm(p + vec2(5.2, 1.3) - t * 0.03));
  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 0.045), fbm(p + 3.4 * q + vec2(8.3, 2.8) - t * 0.04));
  float f = fbm(p + 3.0 * r);
  float v = f * f * 1.6 + 0.3 * length(q) * f;
  return smoothstep(0.1, 1.15, v);
}`,
  aurora: `
float curtains(vec2 p, float t) {
  float v = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = p.x * (0.9 + 0.25 * fi) + fi * 1.7;
    float y0 = 0.17 - 0.06 * fi + 0.09 * sin(x * 1.3 + t * 0.2 + fi) + 0.12 * (fbm(vec2(x * 0.8, t * 0.05 + fi * 3.0)) - 0.5);
    float d = p.y - y0;
    float curtain = smoothstep(-0.012, 0.0, d) * exp(-max(d, 0.0) * (3.0 + fi * 1.2));
    float rays = 0.45 + 0.55 * noise(vec2(x * 18.0 + fi * 7.0, t * 0.3));
    float edge = exp(-abs(d) * 40.0) * 0.55;
    v += (curtain * rays + edge) * (0.85 - 0.2 * fi);
  }
  return v;
}
float sky(vec2 p, float t) {
  float v = 0.05 + 0.1 * smoothstep(0.5, -0.2, p.y);
  v += 0.75 * stars(p, 28.0, t, 5.0, 0.35) * smoothstep(-0.12, 0.35, p.y);
  return v + curtains(p, t);
}
float range(float x) { return -0.1 + 0.11 * ridge(x * 1.5 + 2.0, 11.0); }
float engine(vec2 p, float t) {
  float lake = -0.13;
  if (p.y >= lake) {
    float top = range(p.x);
    if (p.y < top) return 0.04 + 0.03 * fbm(p * 7.0) + 0.16 * smoothstep(0.012, 0.0, top - p.y);
    return clamp(sky(p, t), 0.0, 1.0);
  }
  float depth = lake - p.y;
  vec2 q = vec2(p.x + 0.004 * sin(p.y * 150.0 + t * 1.4) * (0.5 + depth * 4.0), 2.0 * lake - p.y);
  float r = q.y < range(q.x) ? 0.02 : sky(q, t);
  float ripple = 0.8 + 0.2 * sin(p.y * 280.0 + t * 1.8);
  return clamp(r * 0.72 * ripple * (1.0 - depth * 0.8), 0.0, 1.0);
}`,
  tides: `
float engine(vec2 p, float t) {
  float n = mix(9.0, 30.0, u_density);
  float h = p.y + 0.09 * sin(p.x * 2.1 + t * 0.32) + 0.18 * (fbm(p * 1.2 + vec2(t * 0.035, 0.0)) - 0.5)
          + 0.04 * sin(p.x * 5.3 - t * 0.45);
  float k = h * n;
  float d = abs(fract(k) - 0.5);
  float line = 1.0 - smoothstep(0.05, 0.15, d);
  float band = 0.55 + 0.45 * sin(floor(k) * 0.8 + t * 0.18);
  float deep = 0.35 + 0.65 * smoothstep(0.55, -0.45, p.y);
  return clamp(line * band * deep + 0.1 * fbm(p * 2.0), 0.0, 1.0);
}`,
  starfield: `
float engine(vec2 p, float t) {
  float v = 0.2 * smoothstep(0.25, 0.8, fbm(p * 1.1 + t * 0.008));
  vec2 drift = u_dir * t * 0.015;
  float d = 0.18 + 0.6 * u_density;
  v += stars(p + drift, 7.0, t, 1.0, d);
  v += 0.8 * stars(p + drift * 2.0, 13.0, t, 11.0, d);
  v += 0.6 * stars(p + drift * 3.5, 22.0, t, 23.0, d);
  return clamp(v, 0.0, 1.0);
}`,
  embers: `
float engine(vec2 p, float t) {
  float glow = smoothstep(0.2, -0.62, p.y);
  float v = glow * (0.22 + 0.4 * fbm(vec2(p.x * 1.6, p.y * 1.1 - t * 0.22)));
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float cells = 6.0 + fl * 5.0;
    vec2 q = p * cells;
    q.y -= t * (0.7 + fl * 0.45);
    q.x += sin(q.y * 0.55 + fl * 2.0 + t * 0.3) * 0.35;
    vec2 id = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(id + fl * 17.0);
    float alive = step(h, 0.2 + u_density * 0.5);
    vec2 o = (vec2(hash(id + 3.1 + fl), hash(id + 5.3 + fl)) - 0.5) * 0.6;
    float d = length(f - o);
    float flick = 0.6 + 0.4 * sin(t * 5.0 * (h + 0.3) + h * 30.0);
    float fade = smoothstep(0.6, -0.3, p.y);
    v += alive * flick * fade * (smoothstep(0.17, 0.0, d) + 0.35 * smoothstep(0.45, 0.0, d)) * (1.0 - fl * 0.22);
  }
  return clamp(v, 0.0, 1.0);
}`,
  streaks: `
float engine(vec2 p, float t) {
  vec2 dir = u_dir;
  vec2 nrm = vec2(-dir.y, dir.x);
  vec2 q = vec2(dot(p, dir), dot(p, nrm));
  float v = 0.2 * fbm(vec2(q.x * 0.7 - t * 0.12, q.y * 3.0));
  for (int L = 0; L < 3; L++) {
    float fl = float(L);
    float rows = 12.0 + fl * 14.0;
    float row = floor(q.y * rows);
    float fy = fract(q.y * rows);
    float h = hash(vec2(row, fl * 7.0));
    float speed = (0.6 + 1.4 * h) * (1.0 + fl * 0.5);
    float x = q.x * (1.1 + fl * 0.35) - t * speed * 0.4 + h * 20.0;
    float seg = fract(x * 0.45);
    float len = 0.12 + 0.3 * hash(vec2(row, 3.0 + fl));
    float streak = smoothstep(1.0 - len, 1.0, seg) * step(seg, 0.995);
    float thick = 1.0 - smoothstep(0.08, 0.3, abs(fy - 0.5));
    float gate = step(hash(vec2(row, 9.0 + fl)), 0.25 + 0.55 * u_density);
    v += gate * streak * thick * (1.0 - fl * 0.25);
  }
  return clamp(v, 0.0, 1.0);
}`,
  wings: `
// One feather rooted at b, pointing along ang: length L, half width W. The trailing vane is wider, the
// barbs are engraved lines, the tip catches more light. Returns (coverage, value).
vec2 wFeather(vec2 p, vec2 b, float ang, float L, float W, float px) {
  vec2 dir = vec2(cos(ang), sin(ang));
  vec2 q = p - b;
  float u = dot(q, dir);
  float v = dot(q, vec2(-dir.y, dir.x)) + 0.06 * L * (u / L) * (u / L);
  float x = clamp(u / L, 0.0, 1.0);
  float w = W * sqrt(max(1.0 - x * x * x, 0.0)) * smoothstep(0.0, 0.2, x) * (v < 0.0 ? 1.0 : 0.6);
  float sd = max(abs(v) - w, max(-u, u - L));
  float cov = 1.0 - smoothstep(-px, px, sd);
  float barbs = smoothstep(0.35, 0.85, 0.5 + 0.5 * sin((abs(v) * 1.5 - u) * 560.0));
  float edge = exp(-abs(abs(v) - w) * 700.0);
  float shaft = exp(-abs(v) * 1500.0) * step(u, L * 0.96);
  return vec2(cov, (0.52 + 0.24 * barbs + 0.34 * edge + 0.25 * shaft) * (0.74 + 0.26 * x));
}

// A whole wing in its own frame (shoulder at the origin): four rows of feathers rooted along a curved
// leading edge, from the long flight feathers at the back to small coverts along the edge.
vec2 wWing(vec2 pa, float beat, float px) {
  vec2 W = vec2(0.24, 0.25);
  vec2 nrm = normalize(vec2(-W.y, W.x));
  float cov = 0.0;
  float wv = 0.0;
  for (int r = 0; r < 4; r++) {
    float fr = float(r);
    float n = r == 3 ? 14.0 : 11.0 - 1.5 * fr;
    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      if (fi >= n) break;
      float k = fi / (n - 1.0);
      vec2 root = W * k * (1.0 - 0.04 * fr) + nrm * (0.05 * sin(3.14159 * k) - 0.006 * fr);
      float ang = mix(-0.95, 0.38, k) + 0.07 * beat * k;
      float len = r == 3 ? 0.07 + 0.012 * sin(fi * 2.7) : (mix(0.16, 0.46, pow(k, 0.85)) * (1.0 - 0.31 * fr) + 0.015 * sin(fi * 4.1));
      if (length(pa - root) > len + 0.04) continue;
      vec2 fe = wFeather(pa, root, ang, len, r == 3 ? 0.022 : 0.034 - 0.004 * fr, px);
      wv = mix(wv, fe.y * (0.84 + 0.05 * fr), fe.x);
      cov = max(cov, fe.x);
    }
  }
  return vec2(cov, wv);
}

float engine(vec2 p, float t) {
  float px = 1.2 / u_res.y;

  // Night sky lightening toward a horizon far below, faint stars smeared by speed.
  float v = 0.06 + 0.16 * smoothstep(0.55, -0.4, p.y) + 0.04 * fbm(p * 1.5 + vec2(t * 0.06, 0.0));
  v += 0.4 * stars(vec2(p.x * 0.35 + t * 0.02, p.y), 30.0, t, 4.0, 0.1) * smoothstep(-0.1, 0.3, p.y);

  // A floor of cloud far below, torn into long drifts by the speed, lit along its crests.
  float floorY = -0.3 + 0.025 * sin(p.x * 2.0 + t * 0.3);
  vec2 cq = vec2(p.x * 0.5 + t * 0.4, p.y * 9.0);
  float drift = fbm(cq) + 0.5 * fbm(cq * 2.3 + 4.0);
  float body = smoothstep(0.55, 0.95, drift + (floorY - p.y) * 4.0);
  float lines = smoothstep(0.5, 0.95, 0.5 + 0.5 * sin(p.y * 330.0 + drift * 7.0));
  v = mix(v, 0.12 + 0.3 * body * (0.5 + 0.5 * lines) + 0.25 * exp(-abs(drift - 0.7) * 30.0) * body, smoothstep(floorY + 0.03, floorY - 0.03, p.y));
  v += 0.22 * exp(-abs(p.y - floorY) * 50.0);

  // Wind rushing past.
  for (int l = 0; l < 2; l++) {
    float fl = float(l);
    float rows = 22.0 + fl * 18.0;
    float row = floor(p.y * rows);
    float h = hash(vec2(row, fl * 7.0 + 1.0));
    float seg = fract((p.x + t * (0.5 + 0.6 * h) * (1.0 + fl)) * (0.5 + 0.4 * h) + h * 13.0);
    float streak = smoothstep(0.0, 0.03, seg) * (1.0 - smoothstep(0.03, 0.35 + 0.3 * h, seg));
    float thick = 1.0 - smoothstep(0.05, 0.22, abs(fract(p.y * rows) - 0.5));
    v += (0.2 - 0.07 * fl) * streak * thick * step(h, 0.35 + 0.4 * u_density);
  }

  // A pair of wings beating slowly: the far one higher, smaller and dimmer, the near one in front.
  float beat = sin(t * 0.9);
  float rot = 0.09 * beat;
  mat2 R = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
  vec2 far = wWing(R * ((p - vec2(-0.06, 0.1)) / 0.8), beat, px / 0.8);
  v = mix(v, far.y * 0.5, far.x);
  vec2 near = wWing(R * (p - vec2(0.1, -0.06)), beat, px);
  v = mix(v, near.y, near.x);

  // Feathers torn loose by the wind, tumbling away behind.
  for (int f = 0; f < 6; f++) {
    float ff = float(f);
    float h = hash(vec2(ff, 3.3));
    float x = 0.75 - fract(h * 3.7 + t * (0.05 + 0.04 * h)) * 1.9;
    vec2 c = vec2(x, -0.2 + 0.55 * hash(vec2(ff, 8.1)) + 0.04 * sin(t * 0.8 + ff * 1.3));
    float ang = t * (0.6 + 0.8 * h) * (h > 0.5 ? 1.0 : -1.0) + ff;
    float len = 0.06 + 0.05 * hash(vec2(ff, 1.9));
    vec2 b = c - vec2(cos(ang), sin(ang)) * len * 0.5;
    vec2 fe = wFeather(p, b, ang, len, 0.009 + 0.006 * h, px);
    v = mix(v, fe.y, fe.x);
  }
  return clamp(v, 0.0, 1.0);
}`,
  horizon: `
float engine(vec2 p, float t) {
  float hz = -0.06;
  if (p.y < hz) {
    float z = 0.32 / (hz - p.y + 0.015);
    float x = p.x * z;
    float lx = 1.0 - smoothstep(0.0, 0.05, abs(fract(x * 1.3 + 0.5) - 0.5));
    float lz = 1.0 - smoothstep(0.0, 0.05, abs(fract(z * 0.8 - t * 0.3 + 0.5) - 0.5));
    float fog = smoothstep(19.0, 2.5, z);
    float glow = 0.4 * exp(-(hz - p.y) * 9.0);
    return clamp(max(lx, lz) * fog * 0.85 + glow + 0.05, 0.0, 1.0);
  }
  float sky = 0.08 + 0.3 * smoothstep(0.5, hz, p.y);
  vec2 sc = vec2(0.0, hz + 0.19);
  float r = length(p - sc);
  float sun = smoothstep(0.2, 0.193, r);
  float rise = clamp((p.y - hz) / 0.38, 0.0, 1.0);
  float stripe = step(0.5, fract(p.y * 26.0 + t * 0.25));
  float cut = mix(stripe, 1.0, smoothstep(0.32, 0.62, rise));
  float sunV = sun * cut * mix(0.62, 1.0, rise);
  float halo = 0.25 * exp(-r * 4.0);
  return clamp(max(sky + halo, sunV), 0.0, 1.0);
}`,
  rain: `
float engine(vec2 p, float t) {
  float cols = mix(26.0, 64.0, u_density);
  float cx = floor(p.x * cols);
  float h = hash(vec2(cx, 1.0));
  float h2 = hash(vec2(cx, 2.0));
  float speed = 0.25 + 0.6 * h;
  float y = p.y + 0.5;
  float head = fract(-t * speed * 0.22 + h2);
  float d = fract(y - head);
  float len = 0.2 + 0.45 * hash(vec2(cx, 3.0));
  float trail = 1.0 - smoothstep(0.0, len, d);
  float flick = 0.7 + 0.3 * hash(vec2(cx, floor(y * 38.0) + floor(t * 7.0)));
  float headGlow = smoothstep(0.025, 0.0, d);
  float on = step(0.12, hash(vec2(cx, 5.0)));
  return clamp((trail * 0.85 * flick + headGlow * 0.6) * on + 0.04, 0.0, 1.0);
}`,
  constellation: `
vec2 nodePos(vec2 id, float t) {
  float a = hash(id);
  float b = hash(id + 13.7);
  return id + 0.5 + 0.36 * vec2(sin(t * (0.25 + 0.35 * a) + b * 6.283), cos(t * (0.2 + 0.35 * b) + a * 6.283));
}
float engine(vec2 p, float t) {
  float cells = mix(3.5, 8.0, u_density);
  vec2 g = p * cells;
  vec2 id = floor(g);
  float v = 0.12 * smoothstep(0.3, 0.8, fbm(p * 1.4 + t * 0.015));
  vec2 pts[9];
  for (int j = 0; j < 3; j++) {
    for (int i = 0; i < 3; i++) {
      pts[j * 3 + i] = nodePos(id + vec2(float(i - 1), float(j - 1)), t);
    }
  }
  vec2 c = pts[4];
  for (int i = 0; i < 9; i++) {
    float d = length(g - pts[i]);
    float pulse = 0.75 + 0.25 * sin(t * 1.3 + hash(floor(pts[i])) * 20.0);
    v += (smoothstep(0.075, 0.0, d) * 0.95 + smoothstep(0.3, 0.0, d) * 0.12) * pulse;
    if (i != 4) {
      float L = length(pts[i] - c);
      v += (1.0 - smoothstep(0.012, 0.03, segDist(g, c, pts[i]))) * smoothstep(1.55, 0.55, L) * 0.55;
    }
  }
  float l1 = 1.0 - smoothstep(0.012, 0.03, segDist(g, pts[1], pts[3]));
  float l2 = 1.0 - smoothstep(0.012, 0.03, segDist(g, pts[1], pts[5]));
  float l3 = 1.0 - smoothstep(0.012, 0.03, segDist(g, pts[7], pts[3]));
  float l4 = 1.0 - smoothstep(0.012, 0.03, segDist(g, pts[7], pts[5]));
  v += (l1 * smoothstep(1.55, 0.55, length(pts[1] - pts[3])) + l2 * smoothstep(1.55, 0.55, length(pts[1] - pts[5]))
      + l3 * smoothstep(1.55, 0.55, length(pts[7] - pts[3])) + l4 * smoothstep(1.55, 0.55, length(pts[7] - pts[5]))) * 0.55;
  return clamp(v, 0.0, 1.0);
}`,
  marble: `
float engine(vec2 p, float t) {
  vec2 q = p * 1.35;
  float w = fbm(q * 1.2 + vec2(t * 0.02, -t * 0.015));
  float w2 = fbm(q * 2.6 - vec2(t * 0.012, 0.0) + w);
  float veins = abs(sin((q.x * 1.1 + q.y * 0.8) * 3.0 + w * 7.0 + w2 * 3.0));
  float fine = pow(1.0 - veins, 9.0);
  float thread = pow(1.0 - abs(sin((q.y - q.x * 0.4) * 5.0 + w2 * 6.0)), 16.0);
  return clamp(0.32 * w2 + fine * 0.85 + thread * 0.35, 0.0, 1.0);
}`,
  plasma: `
float engine(vec2 p, float t) {
  vec2 q = p * 2.4;
  float v = sin(q.x * 1.3 + t * 0.45) + sin(q.y * 1.7 - t * 0.38) + sin((q.x + q.y) * 1.1 + t * 0.3)
          + sin(length(q + vec2(sin(t * 0.21), cos(t * 0.27))) * 2.4 - t * 0.55);
  return 0.5 + 0.125 * v;
}`,
  svg: `
float engine(vec2 p, float t) {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec3 c = texture2D(u_tex, uv).rgb;
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}`
}

const FIELD = `
// One click ring: x, y and z = age in seconds. Returns the wave at p; dir is the outward direction.
float clickRing(vec2 p, vec3 c, out vec2 dir) {
  vec2 d = p - c.xy;
  float r = length(d) + 0.0001;
  dir = d / r;
  float life = clamp(1.0 - c.z / ${CLICK_LIFE.toFixed(1)}, 0.0, 1.0);
  float x = (r - c.z * 0.3) * 20.0;
  return exp(-x * x) * sin(x * 3.0) * life * life / (1.0 + r * 4.0);
}

// The pointer reaction. Every mode only moves where the scene is sampled (p) and nudges its value
// by a bounded amount; the caller clamps the value to 0..1 before the intensity, so no mode can
// make any pixel brighter than the scene's own brightest colour. Strength z fades to zero when the
// pointer rests, and click rings die on their own clock, so a still cursor changes nothing.
void interact(inout vec2 p, inout float lift) {
  if (u_pmode < -0.5) return;
  vec2 d = p - u_pointer.xy;
  float r2 = dot(d, d);
  float s = u_pointer.z;
  if (u_pmode < 0.5) {
    float pull = exp(-r2 * 16.0) * s;
    p -= d * pull * 0.32;
    lift += pull * 0.05;
  } else if (u_pmode < 1.5) {
    float r = sqrt(r2);
    float wake = sin(r * 46.0 - u_time * 5.0) * exp(-r * 4.5) * s;
    p += d / (r + 0.0001) * wake * 0.02;
    lift += wake * 0.14;
    vec2 k;
    float a = clickRing(p, u_click0, k); p += k * a * 0.03; lift += a * 0.2;
    a = clickRing(p, u_click1, k); p += k * a * 0.03; lift += a * 0.2;
    a = clickRing(p, u_click2, k); p += k * a * 0.03; lift += a * 0.2;
    a = clickRing(p, u_click3, k); p += k * a * 0.03; lift += a * 0.2;
  } else if (u_pmode < 2.5) {
    float g = exp(-r2 * 9.0) * s;
    float ang = g * 1.3;
    float cs = cos(ang);
    float sn = sin(ang);
    p += mat2(cs, sn, -sn, cs) * d * (1.0 + g * 0.6) - d;
    lift -= exp(-r2 * 55.0) * s * 0.3;
  } else if (u_pmode < 3.5) {
    float r = sqrt(r2);
    float push = exp(-r2 * 9.0) * s;
    p -= d / (r + 0.05) * push * 0.17;
    float cell = hash(floor(p * 70.0) + floor(u_time * 6.0));
    lift += (cell - 0.5) * push * 0.2;
    vec2 k;
    float a = clickRing(p, u_click0, k); p -= k * a * 0.08;
    a = clickRing(p, u_click1, k); p -= k * a * 0.08;
    a = clickRing(p, u_click2, k); p -= k * a * 0.08;
    a = clickRing(p, u_click3, k); p -= k * a * 0.08;
  } else {
    float g = exp(-r2 * 3.2) * s;
    float gust = 0.55 + 0.9 * noise(p * 4.0 + u_pvel * 0.3 + u_time * 0.6);
    float swirl = (noise(p * 7.0 - u_time * 0.4) - 0.5) * 2.0;
    p -= (u_pvel + vec2(-u_pvel.y, u_pvel.x) * swirl * 0.5) * g * gust * 0.11;
  }
}

float field(vec2 sp) {
  vec2 p = (sp - 0.5 * u_res) / u_res.y;
  float lift = 0.0;
  interact(p, lift);
  p /= u_scale;
  float t = u_time + u_seed * 7.31;
  float v = clamp(engine(p, t) + lift, 0.0, 1.0);
  return (u_invert > 0.5 ? 1.0 - v : v) * u_intensity;
}
`

const FINISH_MAIN = {
  none: `
void main() { gl_FragColor = vec4(ramp(field(gl_FragCoord.xy)), 1.0); }`,
  grain: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float g = hash(fc + floor(u_time * 8.0) * 17.0) - 0.5;
  gl_FragColor = vec4(ramp(field(fc)) + g * 0.07, 1.0);
}`,
  pixel: `
void main() { gl_FragColor = vec4(ramp(field(gl_FragCoord.xy)), 1.0); }`,
  dither: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float t = field(fc);
  float levels = max(u_levels, 2.0);
  float th = u_pattern < 0.5 ? bayer4(fc) : (u_pattern < 1.5 ? bayer8(fc) : (u_pattern < 2.5 ? ign(fc) : bayer2s(fc)));
  float q = floor(t * (levels - 1.0) + th);
  gl_FragColor = vec4(ramp(q / (levels - 1.0)), 1.0);
}`,
  scanlines: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float s = sin(fc.y * 3.14159 / u_cell);
  gl_FragColor = vec4(ramp(field(fc)) * (0.8 + 0.2 * s * s), 1.0);
}`,
  halftone: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  mat2 rot = mat2(0.7071, 0.7071, -0.7071, 0.7071);
  mat2 back = mat2(0.7071, -0.7071, 0.7071, 0.7071);
  vec2 rp = rot * fc;
  vec2 cid = floor(rp / u_cell);
  vec2 local = rp - (cid + 0.5) * u_cell;
  float t = field(back * ((cid + 0.5) * u_cell));
  float level = smoothstep(0.12, 0.95, t / max(u_intensity, 0.001));
  float r = sqrt(level) * u_cell * 0.7;
  float m = 1.0 - smoothstep(r - 0.7, r + 0.7, length(local));
  gl_FragColor = vec4(mix(u_c0, ramp(mix(0.35, 1.0, level)), m), 1.0);
}`,
  braille: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 cs = vec2(u_cell * 0.6, u_cell);
  vec2 cid = floor(fc / cs);
  vec2 local = (fc - cid * cs) / cs;
  vec2 sub = floor(local * vec2(2.0, 4.0));
  vec2 dotPx = (fract(local * vec2(2.0, 4.0)) - 0.5) * vec2(cs.x * 0.5, cs.y * 0.25);
  float t = field(cid * cs + (sub + 0.5) / vec2(2.0, 4.0) * cs);
  float level = t / max(u_intensity, 0.001);
  float on = step(bayer8(vec2(sub.x + cid.x * 2.0, sub.y + cid.y * 4.0)) * 0.92 + 0.04, level);
  float radius = 0.34 * min(cs.x * 0.5, cs.y * 0.25);
  float m = on * (1.0 - smoothstep(radius - 0.6, radius + 0.6, length(dotPx)));
  gl_FragColor = vec4(mix(u_c0, ramp(mix(0.45, 1.0, t)), m), 1.0);
}`,
  crt: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 cc = fc / u_res - 0.5;
  vec2 bent = (cc * (1.0 + 0.05 * dot(cc, cc)) + 0.5) * u_res;
  float split = 1.4;
  vec3 col = vec3(ramp(field(bent + vec2(split, 0.0))).r, ramp(field(bent)).g, ramp(field(bent - vec2(split, 0.0))).b);
  float s = sin(fc.y * 3.14159 / u_cell);
  float m = mod(fc.x, 3.0);
  vec3 mask = vec3(m < 1.0 ? 1.0 : 0.84, m >= 1.0 && m < 2.0 ? 1.0 : 0.84, m >= 2.0 ? 1.0 : 0.84);
  float vignette = 1.0 - 0.35 * smoothstep(0.35, 0.75, length(cc));
  gl_FragColor = vec4(col * (0.78 + 0.22 * s * s) * mask * vignette, 1.0);
}`,
  glitch: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  float cycle = floor(u_time / 5.0);
  float phase = fract(u_time / 5.0);
  float active = step(0.46, phase) * step(phase, 0.58);
  float band = floor(fc.y / (u_res.y / (7.0 + 9.0 * hash(vec2(cycle, 2.0)))));
  float hit = active * step(0.62, hash(vec2(band, cycle)));
  float shift = (hash(vec2(band, cycle + 4.0)) - 0.5) * u_res.x * 0.06 * hit;
  vec2 at = fc + vec2(shift, 0.0);
  float split = 3.0 * hit;
  vec3 col = hit > 0.5
    ? vec3(ramp(field(at + vec2(split, 0.0))).r, ramp(field(at)).g, ramp(field(at - vec2(split, 0.0))).b)
    : ramp(field(at));
  float blocks = active * step(0.97, hash(floor(fc / 8.0) + cycle));
  gl_FragColor = vec4(mix(col, ramp(1.0 - field(at)), blocks), 1.0);
}`,
  ascii: `
void main() {
  vec2 fc = gl_FragCoord.xy;
  vec2 cs = vec2(u_cell * 0.62, u_cell);
  vec2 cid = floor(fc / cs);
  vec2 local = (fc - cid * cs) / cs;
  float t = field((cid + 0.5) * cs);
  float level = clamp(t / max(u_intensity, 0.001), 0.0, 0.999);
  float g = floor(level * u_glyphCount);
  float m = texture2D(u_glyphs, vec2((g + local.x) / u_glyphCount, 1.0 - local.y)).a;
  gl_FragColor = vec4(mix(u_c0, ramp(mix(0.45, 1.0, t)), m), 1.0);
}`
}

export function fragmentSource(engine, finish) {
  const e = ENGINE_SRC[engine] ? engine : 'nebula'
  const f = FINISH_MAIN[finish] ? finish : 'none'
  return COMMON + ENGINE_SRC[e] + FIELD + FINISH_MAIN[f]
}

// How the canvas is sized for a finish: 'pixel' scales the backing store down by the cell and lets
// the browser upscale it crisply; 'cell' keeps one canvas pixel per CSS pixel because the finish
// draws sub-cell detail; 'smooth' renders below CSS size and upscales softly (the field is soft).
export function finishSizing(finish) {
  if (finish === 'dither' || finish === 'pixel') return 'pixel'
  if (['halftone', 'ascii', 'braille', 'scanlines', 'crt'].includes(finish)) return 'cell'
  return 'smooth'
}
