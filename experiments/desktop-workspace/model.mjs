/** Host-owned, opt-in desktop state. It never launches a process or accesses
 * system bookmarks. The host supplies an allowlisted activity registry. */
export function desktopSession(ids, saved = {}) {
  const defined = new Set(ids);
  const pins = Array.from(new Set(Array.isArray(saved.pins) ? saved.pins : ids.slice(0, 2))).filter(id => defined.has(id));
  let enabled = saved.enabled === true;
  let windows = [];
  let active = null;
  let previous = [];
  const visible = () => windows.filter(win => !win.minimized);

  function focus(id) {
    if (!defined.has(id)) return false;
    const found = windows.find(row => row.id === id);
    windows = windows.filter(row => row.id !== id);
    windows.push({...found, id, minimized:false});
    active = id;
    previous = [];
    return true;
  }
  function setEnabled(value) { enabled = value === true; }
  function activate(id) {
    if (!enabled || !defined.has(id)) return false;
    if (active === id) return minimize(id);
    return focus(id);
  }
  function minimize(id) {
    if (!enabled || !windows.some(w => w.id === id && !w.minimized)) return false;
    windows = windows.map(row => row.id === id ? {...row, minimized:true} : row);
    if (active === id) active = visible().at(-1)?.id ?? null;
    return true;
  }
  function close(id) {
    if (!enabled || !windows.some(w => w.id === id)) return false;
    windows = windows.filter(row => row.id !== id);
    previous = previous.filter(x => x !== id);
    if (active === id) active = visible().at(-1)?.id ?? null;
    return true;
  }
  function toggleDesktop() {
    if (!enabled) return;
    if (previous.length) {
      const resume = new Set(previous);
      windows = windows.map(row => resume.has(row.id) ? {...row, minimized:false} : row);
      active = visible().at(-1)?.id ?? null;
      previous = [];
    } else {
      previous = visible().map(row => row.id);
      windows = windows.map(row => ({...row, minimized:true}));
      active = null;
    }
  }
  function togglePin(id) {
    if (!enabled || !defined.has(id)) return false;
    const index = pins.indexOf(id);
    if (index < 0) pins.push(id); else pins.splice(index,1);
    return true;
  }
  function movePin(id, offset) {
    const index = pins.indexOf(id), target = index + offset;
    if (!enabled || index < 0 || ![-1,1].includes(offset) || target < 0 || target >= pins.length) return false;
    [pins[index],pins[target]] = [pins[target],pins[index]];
    return true;
  }
  const state = () => ({enabled, pins:[...pins], windows: windows.map(w => ({...w})), active, showingDesktop:previous.length > 0});
  return {state, setEnabled, open:(id)=>enabled && focus(id), activate, minimize, close, toggleDesktop, togglePin, movePin, preferences:() => ({enabled,pins:[...pins]})};
}
