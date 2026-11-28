import { PRESETS } from './vendor/aether/presets.generated.js'
import { POINTER_CHOICES, modeIndex } from './vendor/aether/pointer.js'
import { FINISHES } from './vendor/aether/shader.js'
import { SceneRenderer, cssFallback } from './vendor/aether/renderer.js'
import { GestureField, motionBudget, STILL_TIME } from './interaction.js'

const byId = id => document.getElementById(id)
const ui = Object.fromEntries(['scene','mode','finish','motion','quality','strength','status','background'].map(id => [id, byId(id)]))
const fill = (el, entries) => el.replaceChildren(...entries.map(([value, label]) => new Option(label, value)))
const label = str => str.charAt(0).toUpperCase() + str.slice(1)
const scenes = PRESETS.filter(p => p.scene.engine !== 'svg')
fill(ui.scene, scenes.map(p => [p.slug, p.label]))
fill(ui.mode, POINTER_CHOICES.map(p => [p.id, p.label]))
fill(ui.finish, [['preset','Use scene finish'], ...FINISHES.map(v => [v, label(v)])])
const sceneName = scenes.find(p => p.label === 'Selene') ?? scenes[0]
ui.scene.value = sceneName.slug

const preferences = matchMedia('(prefers-reduced-motion: reduce)')
let canvas = ui.background.querySelector('canvas')
let renderer = new SceneRenderer(canvas)
const gesture = new GestureField()
const veil = { calm: [1.18, 1.6], balanced: [1,1], vivid: [.7,0] }
let budget, scene, mode, rings, raf = 0, visualTime = STILL_TIME, nextFrame = 0, lastDraw = 0
const stop = () => { cancelAnimationFrame(raf); raf = 0; lastDraw = nextFrame = 0 }
function draw(now) {
  if (!renderer.ok) return
  const dt = lastDraw ? Math.min(.25, (now - lastDraw) / 1000) : 0
  lastDraw = now
  visualTime += dt * budget.speed
  gesture.step(renderer, { now, dt, width: innerWidth, height: innerHeight, mode: budget.fps ? mode : -1, rings: budget.fps && rings })
  renderer.draw(visualTime)
}
function tick(now) {
  raf = 0
  if (document.hidden || !renderer.ok || !budget.fps) return
  if (now >= nextFrame - 1) {
    draw(now)
    if (!nextFrame || now - nextFrame > 250) nextFrame = now
    nextFrame += 1000 / budget.fps
  }
  raf = requestAnimationFrame(tick)
}
function resume() {
  stop()
  if (!document.hidden && renderer.ok && budget.fps) raf = requestAnimationFrame(tick)
}
function resize() {
  if (!scene || !renderer.ok) return
  renderer.resize(innerWidth, innerHeight, budget.scale)
  draw(performance.now())
}
function styleFallback(on) {
  ui.background.toggleAttribute('data-fallback', on)
  ui.background.style.background = on ? cssFallback(scene) : ''
}
function update(reset = false) {
  const p = scenes.find(item => item.slug === ui.scene.value) ?? sceneName
  const finish = ui.finish.value === 'preset' ? p.scene.finish : { ...p.scene.finish, style: ui.finish.value }
  const prevScene = scene
  scene = { ...p.scene, finish }
  const state = { pointerMode: ui.mode.value }
  mode = modeIndex(state, scene.engine)
  rings = mode >= 0 && ui.quality.value !== 'battery'
  if (!rings) gesture.clearPresses()
  budget = motionBudget(ui.motion.value, ui.quality.value, scene.speed ?? 1, preferences.matches)
  if (!budget.fps) gesture.clear()
  const [tint, focus] = veil[ui.strength.value]
  const glass = scene.glass ?? {}
  ui.background.style.setProperty('--bg', p.theme.colors.background)
  ui.background.style.setProperty('--tint', Math.min(95, (glass.tint ?? .6) * tint * 100)+'%')
  ui.background.style.setProperty('--focus', Math.min(90, (glass.focus ?? .3) * focus * 100)+'%')
  if (reset || (prevScene?.engine && scene.engine !== prevScene.engine)) { visualTime = STILL_TIME; gesture.clear() }
  let usable = renderer.ok
  if (usable) {
    try { renderer.setScene(scene) } catch { usable = false }
  }
  styleFallback(!usable)
  canvas.toggleAttribute('data-crisp', ['dither','pixel'].includes(finish.style))
  ui.status.textContent = !usable ? 'Static gradient: WebGL unavailable.' : preferences.matches ? 'Still frame: system reduced motion.' : budget.fps ? `WebGL · ${budget.fps} FPS budget · ${label(finish.style)}` : 'Still frame.'
  stop()
  if (usable) { resize(); resume() }
}
function listenCanvas() {
  canvas.addEventListener('webglcontextlost', () => {
    stop()
    styleFallback(true)
    ui.status.textContent = 'Static gradient: WebGL context lost.'
  })
  canvas.addEventListener('webglcontextrestored', () => {
    // New local renderer rather than trusting obsolete GL resource handles.
    const next = document.createElement('canvas')
    renderer.dispose()
    canvas.replaceWith(next); canvas = next
    renderer = new SceneRenderer(canvas); listenCanvas(); update()
  }, { once:true })
}
listenCanvas()
const passive = { passive:true }
const now = () => performance.now()
window.addEventListener('pointermove', e => {
  if (e.isPrimary && budget.fps && mode >= 0) gesture.move(e.clientX, e.clientY, now())
}, passive)
window.addEventListener('pointerdown', e => {
  if (!e.isPrimary || e.button !== 0 || !budget.fps || mode < 0) return
  // Touch has no hover; place the wake immediately without intercepting normal taps/scroll.
  if (e.pointerType !== 'mouse') gesture.move(e.clientX, e.clientY, now())
  if (rings) gesture.press(e.clientX, e.clientY, now())
}, { passive:true, capture:true })
for (const type of ['pointercancel','pointerup']) window.addEventListener(type, e => {
  if (e.isPrimary && e.pointerType !== 'mouse') gesture.deactivate()
}, passive)
window.addEventListener('pointerout', e => { if (!e.relatedTarget) gesture.deactivate() }, passive)
window.addEventListener('resize', resize, passive)
document.addEventListener('visibilitychange', () => { if (document.hidden) gesture.clear(); resume() })
window.addEventListener('pagehide', stop)
window.addEventListener('pageshow', resume)
preferences.addEventListener('change', () => update(true))
for (const id of ['scene','mode','finish','motion','quality','strength']) ui[id].addEventListener('change', () => update(id === 'scene'))
update(true)
