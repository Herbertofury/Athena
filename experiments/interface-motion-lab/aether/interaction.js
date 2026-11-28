// Adapted from abundantbeing/Aether desktop-src/backdrop.js at 71129b3 (MIT).
// The host stores pointer data in memory and passes only visual state to the renderer.
import { CLICK_SLOTS } from './vendor/aether/pointer.js'
export const QUALITY = {
  battery: { fps: 12, scale: .35 },
  balanced: { fps: 24, scale: .50 },
  high: { fps: 30, scale: .75 },
}
export const STILL_TIME = 23.7
export function motionBudget(motion, quality, speed, reduced = false) {
  const q = QUALITY[quality] ?? QUALITY.balanced
  if (reduced || motion === 'still' || speed === 0) return { scale: q.scale, fps: 0, speed: 0 }
  return { scale: q.scale, fps: motion === 'calm' ? Math.min(15, q.fps) : q.fps, speed: speed * (motion === 'calm' ? .45 : 1) }
}
export class GestureField {
  constructor() { this.clear() }
  clear() {
    this.target = { x: -1, y: -1, at: -Infinity }
    this.current = { x: -1, y: -1, s: 0, vx: 0, vy: 0 }
    this.clearPresses()
  }
  clearPresses() {
    this.clicks = Array(CLICK_SLOTS).fill(null)
    this.next = 0
  }
  move(x, y, now) {
    this.target = { x, y, at: now }
    if (this.current.x < 0) this.current = { x, y, s: 0, vx: 0, vy: 0 }
  }
  deactivate() {
    // Keep any prior press ripple, but let the resting pointer release its hold.
    this.target.at = -Infinity
  }
  press(x, y, now) {
    this.clicks[this.next] = { x, y, at: now }
    this.next = (this.next + 1) % CLICK_SLOTS
  }
  step(r, state) {
    const { now, dt, width, height, mode, rings } = state
    const want = mode >= 0 && now - this.target.at < 2200 && this.target.x >= 0 ? 1 : 0
    const p = this.current
    const px = p.x, py = p.y
    p.x += (this.target.x - p.x) * .14
    p.y += (this.target.y - p.y) * .14
    p.s += (want - p.s) * (want ? .08 : .03)
    if (dt > 0 && px >= 0) {
      const k = Math.max(1, height) * dt
      p.vx += ((p.x - px) / k - p.vx) * .3
      p.vy += (-(p.y - py) / k - p.vy) * .3
      const m = Math.hypot(p.vx, p.vy)
      if (m > 1.4) { p.vx *= 1.4 / m; p.vy *= 1.4 / m }
    }
    r.setPointer(p.x, p.y, p.s < .002 ? 0 : p.s, width, height)
    r.setInteraction(mode, p.vx, p.vy)
    for (let i = 0; i < CLICK_SLOTS; i++) {
      const a = rings ? this.clicks[i] : null
      r.setClick(i, a?.x ?? 0, a?.y ?? 0, a ? (now - a.at) / 1000 : 99, width, height)
    }
  }
}
