/**
 * @module cardgame/settings
 * @description Settings screen for the card game tab.
 * §25: Difficulty slider, hero mode toggle, audio controls,
 * accessibility options, performance toggles, card-back selector.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   Default Settings Schema
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_SETTINGS = {
  difficulty: 2,           // 0..4 → Casual, Easy, Normal, Hard, Heroic
  heroMode: "standard",    // "standard" | "draft" | "arena"
  musicVolume: 70,
  sfxVolume: 80,
  narrationVolume: 60,
  animationSpeed: 1,       // 0.5 | 1 | 1.5 | 2
  reducedMotion: false,
  largeText: false,
  highContrast: false,
  confirmEndTurn: false,
  autoEndTurn: true,
  cardBack: "default",
  showDamageNumbers: true,
  showTimers: true,
};

const DIFFICULTY_LABELS = ["Casual", "Easy", "Normal", "Hard", "Heroic"];
const ANIM_SPEED_OPTIONS = [
  { value: 0.5, label: "Slow" },
  { value: 1,   label: "Normal" },
  { value: 1.5, label: "Fast" },
  { value: 2,   label: "Instant" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Render Settings
   ═══════════════════════════════════════════════════════════════════════════ */

export function renderSettings(currentSettings, callbacks = {}) {
  const s = { ...DEFAULT_SETTINGS, ...currentSettings };
  const root = document.createElement("div");
  root.className = "cg-settings";

  /* ─── Helper builders ─── */
  function addGroup(title) {
    const g = document.createElement("div");
    g.className = "cg-settings-group";
    const h = document.createElement("h3");
    h.className = "cg-settings-group-title";
    h.textContent = title;
    g.appendChild(h);
    root.appendChild(g);
    return g;
  }

  function addSlider(group, label, key, min, max, step, displayFn) {
    const row = document.createElement("div");
    row.className = "cg-settings-row";

    const lbl = document.createElement("label");
    lbl.className = "cg-settings-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const wrap = document.createElement("div");
    wrap.className = "cg-settings-control";

    const range = document.createElement("input");
    range.type = "range";
    range.className = "cg-settings-slider";
    range.min = min;
    range.max = max;
    range.step = step;
    range.value = s[key];

    const val = document.createElement("span");
    val.className = "cg-settings-value";
    val.textContent = displayFn ? displayFn(s[key]) : s[key];

    range.addEventListener("input", () => {
      const v = parseFloat(range.value);
      s[key] = v;
      val.textContent = displayFn ? displayFn(v) : v;
      callbacks.onChange?.(key, v);
    });

    wrap.appendChild(range);
    wrap.appendChild(val);
    row.appendChild(wrap);
    group.appendChild(row);
  }

  function addToggle(group, label, key) {
    const row = document.createElement("div");
    row.className = "cg-settings-row";

    const lbl = document.createElement("label");
    lbl.className = "cg-settings-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const wrap = document.createElement("div");
    wrap.className = "cg-settings-control";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.className = "cg-settings-toggle";
    cb.checked = !!s[key];

    cb.addEventListener("change", () => {
      s[key] = cb.checked;
      callbacks.onChange?.(key, cb.checked);
    });

    wrap.appendChild(cb);
    row.appendChild(wrap);
    group.appendChild(row);
  }

  function addSelect(group, label, key, options) {
    const row = document.createElement("div");
    row.className = "cg-settings-row";

    const lbl = document.createElement("label");
    lbl.className = "cg-settings-label";
    lbl.textContent = label;
    row.appendChild(lbl);

    const wrap = document.createElement("div");
    wrap.className = "cg-settings-control";

    const sel = document.createElement("select");
    sel.className = "cg-settings-select";
    for (const opt of options) {
      const o = document.createElement("option");
      o.value = opt.value;
      o.textContent = opt.label;
      if (String(s[key]) === String(opt.value)) o.selected = true;
      sel.appendChild(o);
    }

    sel.addEventListener("change", () => {
      const v = sel.value;
      s[key] = isNaN(v) ? v : parseFloat(v);
      callbacks.onChange?.(key, s[key]);
    });

    wrap.appendChild(sel);
    row.appendChild(wrap);
    group.appendChild(row);
  }

  /* ─── Gameplay ─── */
  const gp = addGroup("Gameplay");
  addSlider(gp, "AI Difficulty", "difficulty", 0, 4, 1, v => DIFFICULTY_LABELS[v] || v);
  addSelect(gp, "Game Mode", "heroMode", [
    { value: "standard", label: "Standard" },
    { value: "draft",    label: "Draft" },
    { value: "arena",    label: "Arena" },
  ]);
  addToggle(gp, "Confirm End Turn", "confirmEndTurn");
  addToggle(gp, "Auto End Turn (empty hand)", "autoEndTurn");

  /* ─── Audio ─── */
  const au = addGroup("Audio");
  addSlider(au, "Music Volume", "musicVolume", 0, 100, 5, v => `${v}%`);
  addSlider(au, "SFX Volume", "sfxVolume", 0, 100, 5, v => `${v}%`);
  addSlider(au, "Narration Volume", "narrationVolume", 0, 100, 5, v => `${v}%`);

  /* ─── Visual ─── */
  const vi = addGroup("Visual");
  addSelect(vi, "Animation Speed", "animationSpeed", ANIM_SPEED_OPTIONS);
  addToggle(vi, "Show Damage Numbers", "showDamageNumbers");
  addToggle(vi, "Show Timers", "showTimers");

  /* ─── Accessibility ─── */
  const ac = addGroup("Accessibility");
  addToggle(ac, "Reduced Motion", "reducedMotion");
  addToggle(ac, "Large Text", "largeText");
  addToggle(ac, "High Contrast", "highContrast");

  /* ─── Reset ─── */
  const resetRow = document.createElement("div");
  resetRow.className = "cg-settings-row cg-settings-reset-row";
  const resetBtn = document.createElement("button");
  resetBtn.className = "cg-btn cg-btn-danger";
  resetBtn.textContent = "Reset to Defaults";
  resetBtn.addEventListener("click", () => {
    if (confirm("Reset all card game settings to defaults?")) {
      callbacks.onReset?.(DEFAULT_SETTINGS);
    }
  });
  resetRow.appendChild(resetBtn);
  root.appendChild(resetRow);

  return root;
}
