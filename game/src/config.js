// Moonlit Gallery — tuning numbers, all in one place.
// Canvas is 1280x720. The play room occupies the left 1070 px; the right
// 210 px is the GALLERY GUIDE panel. HUD strip on top, control bar below.
export const W = 1280;
export const H = 720;
export const HUD_H = 64;
export const BAR_H = 36;
export const GUIDE_X = 1070;
export const ROOM = { x: 14, y: HUD_H + 14, w: 1042, h: 556 }; // inner walls
export const ENTRY = { x: 78, y: 606 };
export const EXIT = { x: 992, y: 118 };

// Wren the thief
export const THIEF = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 96,
  accel: 1400,
  friction: 10,
};

// Watchmen
export const GUARD = {
  radius: 15,
  patrolSpeed: 62,
  suspectSpeed: 78,
  investigateSpeed: 96,
  chaseSpeed: 178,
  lockdownSpeed: 205,
  coneRange: 235,
  coneHalfAngle: 0.42, // radians, about 48 degrees total
  glimpseRange: 235,
  clearSeeRange: 150,
  catchDistance: 27,
  suspectTime: 1.1,
  lookAroundTime: 2.6,
  memoryTime: 4.0,
};

// Argus cameras
export const CAMERA = {
  range: 330,
  halfAngle: 0.26,
  sweepSpeed: 0.55, // radians per second
  sweepArc: 0.85, // radians each side of the base angle
};

// Alarm meter 0..100
export const ALARM = {
  riseGuard: 16,
  riseCamera: 30,
  riseLaser: 22,
  fall: 4.5,
  halfPoint: 50,
  catchBonus: 14,
};

// Lasers around the central plinth
export const LASER = {
  radius: 96,
  gapHalfAngle: 0.34,
  cycleSeconds: 7,
};

// Coins
export const COINS = { start: 3, ringRadius: 130, attractRadius: 420 };

export const NERVE_START = 3;
export const TIME_LIMIT = null; // job counts up, no hard limit

// Fixed seed so the ?shot= pictures are steady every render.
export const SHOT_SEED = 20261122;

// Tiny deterministic random generator (mulberry32).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function lerp(a, b, t) { return a + (b - a) * t; }
