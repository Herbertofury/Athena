// The scene renderer: one WebGL context drawing one scene into one canvas. The backdrop owns one,
// and the gallery shares a second one for every thumbnail (drawn, then copied into each card's own
// 2D canvas), so the app never holds more than two GL contexts for Aether however many cards show.

import { CLICK_SLOTS } from './pointer.js'
import { fragmentSource, finishSizing, VERTEX } from './shader.js'

export const GLYPHS = ' .:-=+*xo#%@'

function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '')
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.padEnd(6, '0').slice(0, 6)
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
}

export function svgDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// Defence in depth: the backend already refused anything that is not a self-contained drawing, and
// an <img> never runs script; this keeps a hand-edited or stale record from reaching the page.
export function svgLooksSafe(svg) {
  return typeof svg === 'string' && svg.length <= 131072 && !/<script|<foreignObject|\son\w+\s*=|javascript:/i.test(svg)
}

export function cssFallback(scene) {
  const stops = (scene && scene.colors) || ['#101014', '#202030']
  const angle = Math.round((scene && scene.direction) || 0) + 90
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`
}

function buildGlyphAtlas() {
  const cellW = 40
  const cellH = 64
  const canvas = document.createElement('canvas')
  canvas.width = cellW * GLYPHS.length
  canvas.height = cellH
  const g = canvas.getContext('2d')
  g.clearRect(0, 0, canvas.width, canvas.height)
  g.fillStyle = '#ffffff'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.font = `600 ${Math.round(cellH * 0.78)}px "JetBrains Mono", ui-monospace, monospace`
  for (let i = 0; i < GLYPHS.length; i++) g.fillText(GLYPHS[i], cellW * i + cellW / 2, cellH * 0.54)
  return canvas
}

export class SceneRenderer {
  constructor(canvas) {
    this.canvas = canvas
    this.scene = null
    this.programs = new Map()
    this.lost = false
    this.svgImage = null
    this.svgCanvas = null
    this.size = { w: 1, h: 1, scale: 1 }
    this.pointer = [0, 0, 0] // field coords x, y and strength 0..1
    this.mode = -1 // pointer mode index in the shader; -1 is off
    this.pvel = [0, 0] // eased pointer velocity, field units per second
    this.clicks = new Float32Array(CLICK_SLOTS * 3).fill(0) // x, y, age (seconds) per slot
    for (let i = 0; i < CLICK_SLOTS; i++) this.clicks[i * 3 + 2] = 99
    this.gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power'
    })
    if (!this.gl) return
    const gl = this.gl
    this.quad = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW)
    this.onLost = event => {
      event.preventDefault()
      this.lost = true
      this.programs.clear()
    }
    canvas.addEventListener('webglcontextlost', this.onLost)
  }

  get ok() {
    return Boolean(this.gl) && !this.lost
  }

  program(engine, finish) {
    const key = `${engine}:${finish}`
    if (this.programs.has(key)) return this.programs.get(key)
    const gl = this.gl
    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s)
        gl.deleteShader(s)
        throw new Error(`aether shader ${key}: ${log}`)
      }
      return s
    }
    const p = gl.createProgram()
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fragmentSource(engine, finish)))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`aether link ${key}: ${gl.getProgramInfoLog(p)}`)
    const names = ['u_res', 'u_time', 'u_c0', 'u_c1', 'u_c2', 'u_c3', 'u_c4', 'u_n', 'u_scale', 'u_intensity',
      'u_density', 'u_seed', 'u_dir', 'u_cell', 'u_levels', 'u_pattern', 'u_glyphs', 'u_glyphCount', 'u_tex',
      'u_invert', 'u_pointer', 'u_pmode', 'u_pvel', 'u_click0', 'u_click1', 'u_click2', 'u_click3']
    const loc = {}
    for (const n of names) loc[n] = gl.getUniformLocation(p, n)
    const entry = { program: p, loc, pos: gl.getAttribLocation(p, 'a_pos') }
    this.programs.set(key, entry)
    return entry
  }

  texture(source, flip) {
    const gl = this.gl
    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, Boolean(flip))
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
    return tex
  }

  setScene(scene) {
    this.scene = scene
    if (!this.ok) return
    const finish = (scene.finish && scene.finish.style) || 'none'
    this.entry = this.program(scene.engine, finish)
    if (finish === 'ascii' && !this.glyphTex) this.glyphTex = this.texture(buildGlyphAtlas(), false)
    if (scene.engine === 'svg') this.loadSvg(scene.svg)
  }

  loadSvg(svg) {
    if (!svgLooksSafe(svg)) return
    const img = new Image()
    img.decoding = 'async'
    img.src = svgDataUrl(svg)
    this.svgImage = img
    if (!this.svgCanvas) this.svgCanvas = document.createElement('canvas')
  }

  // cssW/cssH: the size the canvas is shown at. quality scales the 'smooth' finishes.
  resize(cssW, cssH, quality = 0.5) {
    const scene = this.scene
    const finish = (scene && scene.finish && scene.finish.style) || 'none'
    const cell = Math.max(1, (scene && scene.finish && scene.finish.pixel) || 1)
    const mode = finishSizing(finish)
    const scale = mode === 'pixel' ? 1 / cell : mode === 'cell' ? 1 : quality
    const w = Math.max(1, Math.round(cssW * scale))
    const h = Math.max(1, Math.round(cssH * scale))
    if (this.canvas.width !== w) this.canvas.width = w
    if (this.canvas.height !== h) this.canvas.height = h
    this.size = { w, h, scale, mode }
    return this.size
  }

  draw(time) {
    if (!this.ok || !this.entry || !this.scene) return false
    const gl = this.gl
    const { program, loc, pos } = this.entry
    const scene = this.scene
    const finish = scene.finish || {}
    const colors = (scene.colors || []).slice(0, 5)
    while (colors.length < 2) colors.push(colors[0] || '#000000')
    const rgb = colors.map(hexToRgb)
    const levels = finish.levels && finish.levels >= 2 ? finish.levels : colors.length
    const rad = ((scene.direction || 0) * Math.PI) / 180

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    gl.uniform2f(loc.u_res, this.canvas.width, this.canvas.height)
    gl.uniform1f(loc.u_time, time)
    for (let i = 0; i < 5; i++) {
      const c = rgb[Math.min(i, rgb.length - 1)]
      gl.uniform3f(loc[`u_c${i}`], c[0], c[1], c[2])
    }
    gl.uniform1f(loc.u_n, rgb.length)
    gl.uniform1f(loc.u_scale, scene.scale || 1)
    gl.uniform1f(loc.u_intensity, scene.intensity == null ? 0.8 : scene.intensity)
    gl.uniform1f(loc.u_density, scene.density == null ? 0.5 : scene.density)
    gl.uniform1f(loc.u_seed, scene.seed || 0)
    gl.uniform2f(loc.u_dir, Math.cos(rad), Math.sin(rad))
    gl.uniform1f(loc.u_cell, Math.max(1, (finish.pixel || 1) * (this.size.mode === 'cell' ? this.size.scale : 1)))
    gl.uniform1f(loc.u_levels, levels)
    gl.uniform1f(loc.u_pattern, { bayer8: 1, noise: 2, bayer2: 3 }[finish.pattern] || 0)
    gl.uniform1f(loc.u_invert, scene.invert ? 1 : 0)
    gl.uniform3f(loc.u_pointer, this.pointer[0], this.pointer[1], this.pointer[2])
    gl.uniform1f(loc.u_pmode, this.mode)
    gl.uniform2f(loc.u_pvel, this.pvel[0], this.pvel[1])
    const k = this.clicks
    gl.uniform3f(loc.u_click0, k[0], k[1], k[2])
    gl.uniform3f(loc.u_click1, k[3], k[4], k[5])
    gl.uniform3f(loc.u_click2, k[6], k[7], k[8])
    gl.uniform3f(loc.u_click3, k[9], k[10], k[11])
    if (this.glyphTex && loc.u_glyphs) {
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.glyphTex)
      gl.uniform1i(loc.u_glyphs, 0)
      gl.uniform1f(loc.u_glyphCount, GLYPHS.length)
    }
    if (scene.engine === 'svg' && loc.u_tex) {
      if (!this.rasterizeSvg()) return false
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.svgTex)
      gl.uniform1i(loc.u_tex, 1)
    }
    gl.drawArrays(gl.TRIANGLES, 0, 6)
    return true
  }

  // An SVG scene with a finish is drawn into a 2D canvas each frame (the browser advances its CSS
  // animation), then uploaded as a texture the finish reads brightness from.
  rasterizeSvg() {
    const img = this.svgImage
    if (!img || !img.complete || !img.naturalWidth) return false
    const c = this.svgCanvas
    if (c.width !== this.canvas.width) c.width = this.canvas.width
    if (c.height !== this.canvas.height) c.height = this.canvas.height
    const g = c.getContext('2d')
    const s = Math.max(c.width / img.naturalWidth, c.height / img.naturalHeight)
    const w = img.naturalWidth * s
    const h = img.naturalHeight * s
    g.drawImage(img, (c.width - w) / 2, (c.height - h) / 2, w, h)
    const gl = this.gl
    if (this.svgTex) gl.deleteTexture(this.svgTex)
    this.svgTex = this.texture(c, true)
    return true
  }

  /** Pointer position in CSS pixels of the canvas box (cssW x cssH), and its strength 0..1. */
  setPointer(x, y, strength, cssW, cssH) {
    const h = Math.max(1, cssH)
    this.pointer = [(x - cssW / 2) / h, (cssH - y - cssH / 2) / h, strength]
  }

  /** The pointer mode (see pointer.js; -1 is off) and the pointer's velocity in field units per second. */
  setInteraction(mode, vx, vy) {
    this.mode = mode
    this.pvel[0] = vx
    this.pvel[1] = vy
  }

  /** One click ring slot: where it landed (CSS pixels) and its age in seconds (99 = none). */
  setClick(slot, x, y, age, cssW, cssH) {
    const h = Math.max(1, cssH)
    const i = slot * 3
    this.clicks[i] = (x - cssW / 2) / h
    this.clicks[i + 1] = (cssH - y - cssH / 2) / h
    this.clicks[i + 2] = age
  }

  dispose() {
    this.canvas.removeEventListener('webglcontextlost', this.onLost)
    const gl = this.gl
    if (!gl) return
    for (const { program } of this.programs.values()) gl.deleteProgram(program)
    this.programs.clear()
    const lose = gl.getExtension('WEBGL_lose_context')
    if (lose) lose.loseContext()
    this.gl = null
  }
}

