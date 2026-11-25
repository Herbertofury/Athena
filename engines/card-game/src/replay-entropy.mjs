// SPDX-License-Identifier: GPL-3.0-or-later
// Versioned local replay fixture entropy. Not cryptographic or authoritative multiplayer RNG.
export const REPLAY_ENTROPY_VERSION = 'mulberry32-clock-v1';

export function createReplayEntropy(seed, timeBase = 0) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff ||
      !Number.isSafeInteger(timeBase) || timeBase < 0) {
    throw new TypeError('A uint32 seed and nonnegative safe logical time are required');
  }
  let cursor = seed;
  let tick = timeBase;
  return Object.freeze({
    version: REPLAY_ENTROPY_VERSION,
    next() {
      cursor = (cursor + 0x6d2b79f5) >>> 0;
      let value = cursor;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 0x100000000;
    },
    now() {
      if (tick === Number.MAX_SAFE_INTEGER) throw new RangeError('Logical clock exhausted');
      return tick++;
    }
  });
}
