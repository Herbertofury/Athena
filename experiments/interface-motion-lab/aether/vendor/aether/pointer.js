// Pointer interaction modes. Each is shader logic (see FIELD in shader.js) driven by the same few
// uniforms: the pointer's eased position and strength, its eased velocity, and a short ring buffer of
// recent clicks. This file holds only the names, the index each mode has in the shader, and which
// scene engines default to which mode when the setting is Auto.

export const POINTER_MODES = [
  { id: 'lens', label: 'Lens', index: 0, note: 'the scene bends around the pointer like glass' },
  { id: 'ripples', label: 'Ripples', index: 1, note: 'a wake follows the pointer and clicks send out rings' },
  { id: 'well', label: 'Gravity well', index: 2, note: 'the scene is drawn in and swirls toward the pointer' },
  { id: 'repel', label: 'Repel', index: 3, note: 'the pointer pushes the scene aside and clicks send out a shock' },
  { id: 'wind', label: 'Wind', index: 4, note: 'moving the pointer blows the scene along' }
]

export const POINTER_CHOICES = [
  { id: 'auto', label: 'Auto' },
  ...POINTER_MODES.map(({ id, label }) => ({ id, label })),
  { id: 'off', label: 'Off' }
]

// Auto: the mode that suits each engine. Water ripples, drifting things are blown, sparks, petals and
// falling characters are pushed aside, the black hole pulls; everything else keeps the lens.
const AUTO = {
  blackhole: 'well',
  moonsea: 'ripples', aurora: 'ripples', tides: 'ripples',
  sakura: 'repel', embers: 'repel', rain: 'repel', starfield: 'repel',
  wings: 'wind', temple: 'wind', clouds: 'wind', dunes: 'wind', streaks: 'wind'
}

export function autoMode(engine) {
  return AUTO[engine] || 'lens'
}

/** The saved choice: the older boolean `pointer: false` still means off. */
export function pointerChoice(settings) {
  if (!settings || settings.pointer === false || settings.pointerMode === 'off') return 'off'
  return POINTER_CHOICES.some(c => c.id === settings.pointerMode) ? settings.pointerMode : 'auto'
}

/** The shader index for a scene under the saved settings, or -1 when the pointer is off. */
export function modeIndex(settings, engine) {
  const choice = pointerChoice(settings)
  if (choice === 'off') return -1
  const id = choice === 'auto' ? autoMode(engine) : choice
  const mode = POINTER_MODES.find(m => m.id === id) || POINTER_MODES[0]
  return mode.index
}

export const CLICK_SLOTS = 4
export const CLICK_LIFE = 2.4 // seconds a click ring lasts
