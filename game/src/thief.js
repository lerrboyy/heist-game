// Moonlit Gallery — Wren, the thief: movement, sneaking, the coin toss,
// taking treasure.
import { THIEF, COINS, ROOM, clamp, dist } from './config.js';
import { pointBlocked, inMoonbeam, onLaser } from './gallery.js';
import { sfx } from './audio.js';

export function createThief(entry) {
  return {
    x: entry.x, y: entry.y, vx: 0, vy: 0,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    coins: COINS.start,
    coin: null, // {x, y, t} a coin lying on the marble, ringing
    coinFlight: null, // {x0,y0,x1,y1,t} while the coin is in the air
    invulnerableUntil: 0,
    hidden: true, // in shadow
    exposed: false, // standing in a moonbeam
    laserTouchCooldown: 0,
  };
}

export function resetThief(thief, entry) {
  thief.x = entry.x; thief.y = entry.y;
  thief.vx = 0; thief.vy = 0;
  thief.coin = null; thief.coinFlight = null;
  thief.invulnerableUntil = 0;
}

// Move Wren, keeping her inside the walls and out of solid furniture.
export function updateThief(thief, input, dt, gallery, now) {
  const mv = input.moveVector();
  thief.sneaking = input.sneaking();
  const speed = thief.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed;
  const tx = mv.x * speed, ty = mv.y * speed;
  thief.vx += (tx - thief.vx) * Math.min(1, THIEF.friction * dt);
  thief.vy += (ty - thief.vy) * Math.min(1, THIEF.friction * dt);
  if (Math.abs(thief.vx) > 4 || Math.abs(thief.vy) > 4) {
    thief.facing = Math.atan2(thief.vy, thief.vx);
  }
  moveAxis(thief, gallery, thief.vx * dt, 0);
  moveAxis(thief, gallery, 0, thief.vy * dt);
  thief.exposed = inMoonbeam(gallery, thief.x, thief.y);
  thief.hidden = !thief.exposed;

  // Coin flight animation (a quick arc to the target point).
  if (thief.coinFlight) {
    thief.coinFlight.t += dt * 2.4;
    if (thief.coinFlight.t >= 1) {
      thief.coin = { x: thief.coinFlight.x1, y: thief.coinFlight.y1, t: 0 };
      thief.coinFlight = null;
      sfx.coin();
    }
  }
  if (thief.coin) thief.coin.t += dt;
  if (thief.laserTouchCooldown > 0) thief.laserTouchCooldown -= dt;
}

function moveAxis(thief, gallery, dx, dy) {
  const nx = thief.x + dx, ny = thief.y + dy;
  const r = thief.radius - 2;
  const corners = [
    [nx - r, ny - r], [nx + r, ny - r], [nx - r, ny + r], [nx + r, ny + r],
  ];
  for (const [px, py] of corners) {
    if (px < ROOM.x || px > ROOM.x + ROOM.w || py < ROOM.y || py > ROOM.y + ROOM.h) return;
    if (pointBlocked(gallery, px, py)) return;
  }
  thief.x = nx; thief.y = ny;
}

// Toss a brass coin toward the mouse. Returns true if a coin was thrown.
export function tossCoin(thief, mx, my) {
  if (thief.coins <= 0 || thief.coinFlight) return false;
  const d = dist(thief.x, thief.y, mx, my);
  const maxThrow = 260;
  const t = d > maxThrow ? maxThrow / d : 1;
  const tx = thief.x + (mx - thief.x) * t;
  const ty = thief.y + (my - thief.y) * t;
  thief.coins -= 1;
  thief.coinFlight = { x0: thief.x, y0: thief.y, x1: clamp(tx, ROOM.x + 20, ROOM.x + ROOM.w - 20), y1: clamp(ty, ROOM.y + 20, ROOM.y + ROOM.h - 20), t: 0 };
  return true;
}

// Nearest treasure Wren can take right now (within reach), or null.
export function reachableTreasure(thief, gallery) {
  for (const tr of gallery.treasures) {
    if (tr.taken) continue;
    if (dist(thief.x, thief.y, tr.x, tr.y) < 62) return tr;
  }
  return null;
}

// Take a treasure. Returns the treasure taken, or null.
export function takeTreasure(thief, gallery) {
  const tr = reachableTreasure(thief, gallery);
  if (!tr) return null;
  tr.taken = true;
  if (tr.id === 'idol') sfx.idol(); else sfx.treasure();
  return tr;
}

// Is Wren touching a live laser strand right now?
export function laserHit(thief, gallery, t, idolTaken) {
  if (thief.sneaking) return false; // sneaking slips through the gaps safely
  if (thief.laserTouchCooldown > 0) return false;
  return onLaser(gallery, thief.x, thief.y, t, idolTaken);
}
export function markLaserTouch(thief) { thief.laserTouchCooldown = 1.2; }
