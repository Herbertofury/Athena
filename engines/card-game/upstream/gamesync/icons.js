/**
 * @module cardgame/icons
 * @description Inline SVG icon library for the card game.
 * Hand-authored 16×16 path-only SVGs — no emoji anywhere.
 *
 * Every icon returns an SVG string. Wrap with iconEl() to get a DOM element.
 * Color is inherited from CSS `color` or overridden via `fill`.
 */

const S = (d, vb = "0 0 16 16") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" fill="currentColor" width="16" height="16">${d}</svg>`;

/* ─── Keyword icons ─────────────────────────────────────────────── */

export const ICON_TAUNT = S(`<path d="M8 1L2 5v6l6 4 6-4V5L8 1zm0 2l4 2.5v5L8 13l-4-2.5v-5L8 3z"/><path d="M8 6a2 2 0 110 4 2 2 0 010-4z"/>`);

export const ICON_CHARGE = S(`<path d="M9.5 1L5 7h3L6 15l6-8H9l2.5-6z"/>`);

export const ICON_SHIELD = S(`<path d="M8 1L2 4v4c0 3.5 2.5 6.5 6 7.5 3.5-1 6-4 6-7.5V4L8 1zm0 2.2l4 2.2v3.2c0 2.5-1.8 4.8-4 5.8-2.2-1-4-3.3-4-5.8V5.4l4-2.2z"/>`);

export const ICON_RUSH = S(`<path d="M1 8h2l2-3v3h4V5l2 3h2l1-1-4-5-1 1 1 2H6L7 3 6 2 2 7l-1 1z"/><path d="M3 10h10v1H3z" opacity=".5"/>`);

export const ICON_STEALTH = S(`<path d="M8 4C4.5 4 1.7 7.3 1 8c.7.7 3.5 4 7 4s6.3-3.3 7-4c-.7-.7-3.5-4-7-4z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2"/><path d="M2 14L14 2" stroke="currentColor" stroke-width="1.2"/>`);

export const ICON_LIFESTEAL = S(`<path d="M8 14s5.5-3.5 5.5-7.5c0-2-1.7-3.5-3.5-3.5-1.2 0-2.3.7-2.8 1.7h-1.4C5.3 3.7 4.2 3 3 3 1.2 3 -.5 4.5-.5 6.5-.5 10.5 8 14 8 14z" transform="translate(2.5 0)"/>`);

export const ICON_POISONOUS = S(`<path d="M8 1C6.5 1 5 3 5 5.5S6 9 6 10h4c0-1 1-2 1-4.5S9.5 1 8 1z"/><path d="M6 11v1c0 1 .5 2 2 3 1.5-1 2-2 2-3v-1H6z"/><circle cx="6.5" cy="5.5" r=".8" fill="var(--cg-surface-shell)"/><circle cx="9.5" cy="5.5" r=".8" fill="var(--cg-surface-shell)"/>`);

export const ICON_WINDFURY = S(`<path d="M4 3c2 0 3 1.5 3 3H4V3z"/><path d="M12 3c-2 0-3 1.5-3 3h3V3z"/><path d="M4 8c2 0 3 1.5 3 3H4V8z" opacity=".6"/><path d="M12 8c-2 0-3 1.5-3 3h3V8z" opacity=".6"/>`);

export const ICON_BATTLECRY = S(`<path d="M8 1l2 4h4l-3 3 1.5 5L8 10.5 3.5 13 5 8 2 5h4l2-4z"/>`);

export const ICON_DEATHRATTLE = S(`<circle cx="8" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="6.5" cy="5.5" r="1"/><circle cx="9.5" cy="5.5" r="1"/><path d="M5.5 8h5" stroke="currentColor" stroke-width="1"/><path d="M6 8v2M8 8v2M10 8v2" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_DISCOVER = S(`<circle cx="8" cy="7" r="5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M11 10l3 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M6.5 5v4M6.5 7h3" stroke="currentColor" stroke-width="1"/>`);

export const ICON_INSTALL = S(`<rect x="3" y="2" width="10" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 5v4M6 7.5L8 10l2-2.5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"/>`);

export const ICON_PATCH = S(`<path d="M3 8a5 5 0 015-5" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M13 8a5 5 0 01-5 5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="1.5"/><path d="M4.5 4.5l2 2M9.5 9.5l2 2" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>`);

export const ICON_OVERHAUL = S(`<circle cx="8" cy="8" r="5.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 8h5M8 5.5v5" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_VOLATILE = S(`<path d="M8 1l1.5 5H14l-3.5 3L12 14 8 11l-4 3 1.5-5L2 6h4.5L8 1z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 7l4 2M10 7l-4 2" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_STABLE = S(`<path d="M2 12h12M4 12V7l4-4 4 4v5"/><path d="M6.5 12V9h3v3" fill="none" stroke="currentColor" stroke-width="1"/>`);

export const ICON_FRAMEWORK = S(`<path d="M2 3h12v2H2zM4 5v7l4 2 4-2V5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 7h4M6 9h4" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_COMBO = S(`<circle cx="5.5" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="10.5" cy="8" r="3" fill="none" stroke="currentColor" stroke-width="1.2"/>`);

/* ─── New keyword icons (B1-B10) ────────────────────────────────── */

export const ICON_REBORN = S(`<path d="M8 2a5.5 5.5 0 00-5 7.5l1.5-1A4 4 0 018 4a4 4 0 014.5 4.5l1.5 1A5.5 5.5 0 008 2z"/><path d="M8 14l-2-3h4l-2 3z"/><circle cx="8" cy="8.5" r="1.5"/>`);

export const ICON_FREEZE = S(`<path d="M8 1v14M3 4.5l10 7M3 11.5l10-7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="8" r="1.8"/>`);

export const ICON_OVERLOAD = S(`<path d="M9 1L5 7h3L6 15l6-8H9l2-6z"/><path d="M3 13h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="2 2"/>`);

export const ICON_DORMANT = S(`<path d="M4 10c0-3 1.8-5.5 4-5.5s4 2.5 4 5.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 10h10" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 7.5h1.5M9 7.5h1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M6.5 12h3" stroke="currentColor" stroke-width=".8" stroke-linecap="round"/>`);

export const ICON_RETURN_TO_HAND = S(`<path d="M11 4a5 5 0 11-6 0" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 6V2h4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`);

export const ICON_HAND_SCALING = S(`<path d="M4 12V7l1-1v4M6 11V5l1-1v6M8 10V4l1-1v6M10 11V5l1 1v5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/><path d="M11 9c1 .5 1.5 1 1.5 2v1c0 1-1 2-3 2H6c-1.5 0-2.5-1-2.5-2" stroke="currentColor" stroke-width="1" fill="none"/>`);

export const ICON_HEAL_ALL = S(`<path d="M6 5h4v3h3v4h-3v3H6v-3H3V8h3V5z" opacity=".4"/><path d="M6 5h4v3h3v4h-3v3H6v-3H3V8h3V5z" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="3" cy="4" r="1.2"/><circle cx="13" cy="4" r="1.2"/><circle cx="3" cy="14" r="1" opacity=".6"/><circle cx="13" cy="14" r="1" opacity=".6"/>`);

export const ICON_UNIVERSAL_AOE = S(`<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="3" fill="none" stroke="currentColor" stroke-width=".8"/><circle cx="8" cy="8" r="1"/><path d="M2 8h2M12 8h2M8 2v2M8 12v2" stroke="currentColor" stroke-width=".8" stroke-linecap="round"/>`);

/* ─── New mode icons ────────────────────────────────────────────── */

export const ICON_ADVENTURE = S(`<path d="M8 1L3 6l5 4 5-4L8 1z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 6v5l5 4 5-4V6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 10v5" stroke="currentColor" stroke-width="1"/>`);

export const ICON_SEALED = S(`<rect x="3" y="2" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 2v3c0 .5.9 1 2 1s2-.5 2-1V2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M6 9h4M6 11h2" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_GAUNTLET = S(`<path d="M4 3h8v2l-2 2v2l2 2v2H4v-2l2-2V7L4 5V3z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 5h4M6 11h4" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_PUZZLE = S(`<path d="M2 6h4V2h4v4h4v4h-4v4H6v-4H2V6z" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="1.5"/>`);

export const ICON_SINGLETON = S(`<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7 4.5h2v5.5H7z"/><circle cx="8" cy="12" r=".8"/>`);

export const ICON_CARD_FORGE = S(`<path d="M4 14V6l4-4 4 4v8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 14h12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M7 8h2v3H7z"/><path d="M6 6h4" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_WARBAND = S(`<circle cx="5" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="11" cy="5" r="2" fill="none" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M6.5 6.5L7 9M9.5 6.5L9 9" stroke="currentColor" stroke-width=".8"/>`);

/* ─── Tribe icons ───────────────────────────────────────────────── */

export const ICON_TRIBE_BEAST = S(`<path d="M4 6c-1-2 1-4 3-3l1 1 1-1c2-1 4 1 3 3l-1 2c0 2 1 3 0 4s-2 1-3 1-2 0-3-1 0-2 0-4l-1-2z" fill="none" stroke="currentColor" stroke-width="1"/>`);

export const ICON_TRIBE_DRAGON = S(`<path d="M3 10c0-4 2-7 5-7s5 3 5 7l-3-1v2l-2-2-2 2v-2l-3 1z" fill="none" stroke="currentColor" stroke-width="1.1"/>`);

export const ICON_TRIBE_MECH = S(`<rect x="4" y="4" width="8" height="8" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="7" cy="7" r="1"/><circle cx="10" cy="7" r="1"/><path d="M6 10h4" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_SHARD = S(`<path d="M8 1l4 6-4 8-4-8 4-6z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4 7h8" stroke="currentColor" stroke-width=".8"/>`);

/* ─── Hero power icons ──────────────────────────────────────────── */

export const ICON_POWER_DAMAGE = S(`<path d="M8 2C5.5 2 3 5 3 8s2 4.5 5 6c3-1.5 5-3 5-6s-2.5-6-5-6z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M7 5l1 3.5L6.5 10l3-1L11 6 8.5 7 7 5z"/>`);

export const ICON_POWER_HEAL = S(`<path d="M6 4h4v3h3v4h-3v3H6v-3H3V7h3V4z"/>`);

export const ICON_POWER_ARMOR = S(`<path d="M8 1L2 4v5c0 3 2 5.5 6 7 4-1.5 6-4 6-7V4L8 1z"/>`);

export const ICON_POWER_SUMMON = S(`<path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>`);

export const ICON_POWER_DRAW = S(`<rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 4h6M5 6.5h6M5 9h4" stroke="currentColor" stroke-width=".9"/>`);

export const ICON_POWER_BUFF = S(`<path d="M8 1l2.5 5h5l-4 3.5 1.5 5.5L8 12l-5 3 1.5-5.5-4-3.5h5L8 1z"/>`);

export const ICON_POWER_PING = S(`<path d="M9 1L5 7h3L6 15l6-8H9l2-6z"/>`);

/* ─── Navigation / UI icons ─────────────────────────────────────── */

export const ICON_BACK = S(`<path d="M10 3L5 8l5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`);

export const ICON_COLLECTION = S(`<rect x="1" y="3" width="5" height="7" rx=".8" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="6" y="2" width="5" height="7" rx=".8" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="10" y="3" width="5" height="7" rx=".8" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M3 12h10v1.5H3z" opacity=".4"/>`);

export const ICON_DECKS = S(`<rect x="2" y="3" width="9" height="12" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.1"/><rect x="5" y="1" width="9" height="12" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M7 5h5M7 7.5h3" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_PACKS = S(`<rect x="3" y="2" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 8h10" stroke="currentColor" stroke-width="1"/><circle cx="8" cy="8" r="1.8"/>`);

export const ICON_JOURNAL = S(`<rect x="3" y="1" width="10" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 4h5M5.5 6.5h5M5.5 9h3" stroke="currentColor" stroke-width=".9"/><path d="M2 3v10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>`);

export const ICON_PLAY = S(`<path d="M4 2v12l10-6L4 2z"/>`);

export const ICON_SWORD = S(`<path d="M3 13l2-2m6-6L5 11M11 5l2-2v3l-1 1M11 5l-3 1 1 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`);

export const ICON_DICE = S(`<rect x="2" y="2" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="5.5" cy="5.5" r="1"/><circle cx="10.5" cy="5.5" r="1"/><circle cx="8" cy="8" r="1"/><circle cx="5.5" cy="10.5" r="1"/><circle cx="10.5" cy="10.5" r="1"/>`);

export const ICON_BOSS = S(`<path d="M4 6c0-3 2-5 4-5s4 2 4 5v2c0 2-1.5 3-4 4-2.5-1-4-2-4-4V6z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 6l2-2M14 6l-2-2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6 7h1M9 7h1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><path d="M6.5 9.5c1 1 2 1 3 0" fill="none" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_FLAME = S(`<path d="M8 1C6 4 4 6 4 9c0 2.5 1.8 4.5 4 4.5s4-2 4-4.5c0-3-2-5-4-8zm0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>`);

export const ICON_TROPHY = S(`<path d="M4 2h8v4c0 2.5-1.8 4.5-4 5-2.2-.5-4-2.5-4-5V2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M4 4H2c0 2 1 3 2 3M12 4h2c0 2-1 3-2 3" stroke="currentColor" stroke-width="1"/><path d="M6 12h4M7 12v2h2v-2" stroke="currentColor" stroke-width="1"/>`);

export const ICON_SHOP = S(`<path d="M2 7l1-5h10l1 5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M2 7c0 1.1.9 2 2 2s2-.9 2-2M6 7c0 1.1.9 2 2 2s2-.9 2-2M10 7c0 1.1.9 2 2 2s2-.9 2-2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M3 9v5h10V9" fill="none" stroke="currentColor" stroke-width="1.2"/><rect x="6" y="11" width="4" height="3" rx=".5" fill="none" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_SETTINGS = S(`<circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>`);

export const ICON_DECK_WORKSHOP = S(`<rect x="2" y="3" width="9" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1"/><rect x="5" y="1" width="9" height="11" rx="1" fill="none" stroke="currentColor" stroke-width="1"/><path d="M7 5h5M7 7.5h3" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_GIFT = S(`<rect x="2" y="7" width="12" height="7" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M2 9.5h12" stroke="currentColor" stroke-width=".8"/><path d="M8 7v7" stroke="currentColor" stroke-width=".8"/><path d="M8 7c-1-2-3-3-4-2s0 3 4 2z" fill="none" stroke="currentColor" stroke-width="1"/><path d="M8 7c1-2 3-3 4-2s0 3-4 2z" fill="none" stroke="currentColor" stroke-width="1"/>`);

export const ICON_COIN = S(`<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="4" fill="none" stroke="currentColor" stroke-width=".7"/><path d="M7 5.5v5M7 5.5h2c1 0 1.5 1.2 0 1.5H7M7 7h2.2c1.2 0 1.5 1.5 0 1.8H7" stroke="currentColor" stroke-width=".7"/>`);

export const ICON_TICKET = S(`<path d="M2 5h12v6H2z" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M2 7a1.5 1.5 0 010 2M14 7a1.5 1.5 0 000 2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M6 5v6" stroke="currentColor" stroke-width=".8" stroke-dasharray="1 1"/>`);

export const ICON_SPARKLE = S(`<path d="M8 1l1 4.5L13 8l-4.5 1L8 15l-1-4.5L3 8l4-2.5L8 1z"/><circle cx="12" cy="3" r="1"/><circle cx="4" cy="12" r=".7"/>`);

/* ─── Mode-hub icons (used in screens.js NAV_ICONS) ─────────────── */

export const ICON_PRACTICE = S(`<path d="M2 3h12v10H2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 6l2 2 4-4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 11h6" stroke="currentColor" stroke-width=".9" stroke-linecap="round"/>`);

export const ICON_DRAFT = S(`<path d="M4 2h8l-1 12H5L4 2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 5h4M6 7.5h4M6 10h2" stroke="currentColor" stroke-width=".9"/><circle cx="11" cy="4" r="2" fill="none" stroke="currentColor" stroke-width="1"/><path d="M11 3v2M10 4h2" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_BOSS_RUN = S(`<path d="M8 1L3 5v4c0 3 2 5 5 6.5C11 14 13 12 13 9V5L8 1z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 7h1M9 7h1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><path d="M5.5 9.5c1.2 1.5 3.8 1.5 5 0" fill="none" stroke="currentColor" stroke-width="1"/><path d="M4 4l-1-2M12 4l1-2" stroke="currentColor" stroke-width="1.1" stroke-linecap="round"/>`);

export const ICON_BRAWL = S(`<path d="M3 13l2-2m0 0l4-4m0 0l2-4M9 7l4 4" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="4" r="2.5" fill="none" stroke="currentColor" stroke-width="1.1"/><circle cx="12" cy="12" r="2" fill="none" stroke="currentColor" stroke-width="1.1"/>`);

export const ICON_ACHIEVEMENT = S(`<path d="M8 1l2 2.5h3l-1 3L14 9l-3 1-1 3-2-2.5L6 13l-1-3-3-1 2-2.5-1-3h3L8 1z"/><circle cx="8" cy="6.5" r="2" fill="none" stroke="var(--cg-bg-deep, #0c0a14)" stroke-width=".8"/>`);

/* ─── Pack family icons ─────────────────────────────────────────── */

export const ICON_PACK_CORE = S(`<rect x="3" y="2" width="10" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 6h4M6 8.5h4M6 11h2" stroke="currentColor" stroke-width=".9"/>`);

export const ICON_PACK_MOD = S(`<path d="M3 13V5l5-3 5 3v8l-5 2-5-2z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 7l2 1.5L10 7M8 8.5V12" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>`);

export const ICON_PACK_PLATFORM = S(`<rect x="2" y="3" width="12" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5 14h6" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><path d="M8 12v2" stroke="currentColor" stroke-width="1"/>`);

export const ICON_PACK_GENRE = S(`<rect x="2" y="4" width="12" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M6 4V3a2 2 0 014 0v1" stroke="currentColor" stroke-width="1"/><path d="M5 8h2v2H5zM9 8h2v2H9z" fill="currentColor"/>`);

export const ICON_PACK_EXPANSION = S(`<path d="M8 1l2 5h5l-4 3 1.5 5L8 11l-4.5 3L5 9 1 6h5l2-5z"/>`);

export const ICON_PACK_HERO = S(`<circle cx="8" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M3 14c0-3 2.2-5 5-5s5 2 5 5" fill="none" stroke="currentColor" stroke-width="1.2"/>`);

export const ICON_PACK_COSMETIC = ICON_SPARKLE;

export const ICON_PACK_DRAFT = ICON_DICE;

export const ICON_PACK_ACHIEVEMENT = ICON_TROPHY;

export const ICON_PACK_CATCHUP = ICON_GIFT;

/* ─── Quest type icons ──────────────────────────────────────────── */

export const ICON_QUEST_DAILY = S(`<rect x="3" y="2" width="10" height="12" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M5 5h6M5 7.5h6M5 10h3" stroke="currentColor" stroke-width=".8"/><path d="M3 4.5h10" stroke="currentColor" stroke-width=".8"/>`);

export const ICON_QUEST_WEEKLY = S(`<rect x="2" y="3" width="12" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M2 6h12" stroke="currentColor" stroke-width=".8"/><path d="M5 1v3M11 1v3" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><circle cx="5" cy="9" r=".8"/><circle cx="8" cy="9" r=".8"/><circle cx="11" cy="9" r=".8"/>`);

export const ICON_QUEST_EVENT = S(`<path d="M8 1l1 3h3l-2.5 2 1 3L8 7.5 5.5 9l1-3L4 4h3l1-3z"/><path d="M3 12h10" stroke="currentColor" stroke-width="1" stroke-linecap="round"/><path d="M4 14h8" stroke="currentColor" stroke-width="1" stroke-linecap="round" opacity=".5"/>`);

/* ─── Reward type icons ──────────────────────────────────────────── */

export const ICON_REWARD_PACK = ICON_PACKS;
export const ICON_REWARD_GOLD = ICON_COIN;
export const ICON_REWARD_TICKET = ICON_TICKET;
export const ICON_REWARD_COSMETIC = ICON_SPARKLE;

/* ═══════════════════════════════════════════════════════════════════════════
   Lookup maps — for programmatic access by key
   ═══════════════════════════════════════════════════════════════════════════ */

export const KEYWORD_ICONS = {
  taunt: ICON_TAUNT,
  charge: ICON_CHARGE,
  shield: ICON_SHIELD,
  rush: ICON_RUSH,
  stealth: ICON_STEALTH,
  lifesteal: ICON_LIFESTEAL,
  poisonous: ICON_POISONOUS,
  windfury: ICON_WINDFURY,
  battlecry: ICON_BATTLECRY,
  deathrattle: ICON_DEATHRATTLE,
  discover: ICON_DISCOVER,
  install: ICON_INSTALL,
  patch: ICON_PATCH,
  overhaul: ICON_OVERHAUL,
  volatile: ICON_VOLATILE,
  stable: ICON_STABLE,
  framework: ICON_FRAMEWORK,
  combo: ICON_COMBO,
  reborn: ICON_REBORN,
  freeze: ICON_FREEZE,
  overload: ICON_OVERLOAD,
  dormant: ICON_DORMANT,
  returnToHand: ICON_RETURN_TO_HAND,
  handScaling: ICON_HAND_SCALING,
  healAll: ICON_HEAL_ALL,
  universalAoe: ICON_UNIVERSAL_AOE,
};

export const POWER_ICONS = {
  damage: ICON_POWER_DAMAGE,
  heal: ICON_POWER_HEAL,
  armor: ICON_POWER_ARMOR,
  summon: ICON_POWER_SUMMON,
  draw: ICON_POWER_DRAW,
  buff: ICON_POWER_BUFF,
  ping: ICON_POWER_PING,
};

export const PACK_ICONS = {
  core: ICON_PACK_CORE,
  mod: ICON_PACK_MOD,
  platform: ICON_PACK_PLATFORM,
  genre: ICON_PACK_GENRE,
  expansion: ICON_PACK_EXPANSION,
  hero: ICON_PACK_HERO,
  cosmetic: ICON_PACK_COSMETIC,
  draft: ICON_PACK_DRAFT,
  achievement: ICON_PACK_ACHIEVEMENT,
  catchup: ICON_PACK_CATCHUP,
};

export const MODE_ICONS = {
  practice: ICON_PRACTICE,
  draft: ICON_DRAFT,
  boss: ICON_BOSS_RUN,
  brawl: ICON_BRAWL,
  adventure: ICON_ADVENTURE,
  sealed: ICON_SEALED,
  gauntlet: ICON_GAUNTLET,
  puzzle: ICON_PUZZLE,
  singleton: ICON_SINGLETON,
  cardForge: ICON_CARD_FORGE,
  warband: ICON_WARBAND,
};

export const QUEST_TYPE_ICONS = {
  daily: ICON_QUEST_DAILY,
  weekly: ICON_QUEST_WEEKLY,
  event: ICON_QUEST_EVENT,
};

export const REWARD_TYPE_ICONS = {
  pack: ICON_REWARD_PACK,
  gold: ICON_REWARD_GOLD,
  ticket: ICON_REWARD_TICKET,
  cosmetic: ICON_REWARD_COSMETIC,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Utility — wrap SVG string → DOM element with class
   ═══════════════════════════════════════════════════════════════════════════ */

export function iconEl(svgStr, className) {
  const wrap = document.createElement("span");
  wrap.className = className ? `cg-icon ${className}` : "cg-icon";
  wrap.innerHTML = svgStr;
  return wrap;
}
