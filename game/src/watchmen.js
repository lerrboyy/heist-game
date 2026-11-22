// Moonlit Gallery — the three night watchmen: patrol loops, vision cones,
// suspicion, investigation, chase, and catching Wren.
import { GUARD, ROOM, clamp, dist, angleTo, angleDiff } from './config.js';
import { segmentBlocked, rayLength } from './gallery.js';
import { sfx } from './audio.js';

// Fixed patrol loops: each guard walks its corners, pausing at each one.
const LOOPS = [
  [ // Bram — the north loop, around the central plinth
    { x: 330, y: 170 }, { x: 760, y: 170 }, { x: 760, y: 560 }, { x: 330, y: 560 },
  ],
  [ // Odo — the west loop, past the scarab and the palms
    { x: 150, y: 200 }, { x: 150, y: 560 }, { x: 420, y: 560 }, { x: 420, y: 250 },
  ],
  [ // Fen — the east loop, past the pearl and the rope
    { x: 900, y: 200 }, { x: 900, y: 520 }, { x: 640, y: 520 }, { x: 640, y: 190 },
  ],
];
const NAMES = ['Bram', 'Odo', 'Fen'];

export function createWatchmen() {
  return LOOPS.map((loop, i) => ({
    name: NAMES[i],
    loop,
    wp: 0,
    x: loop[0].x, y: loop[0].y,
    facing: 0,
    state: 'patrol', // patrol | suspect | investigate | chase | return
    pause: 0,
    suspicion: 0, // 0..1; fills while Wren is glimpsed
    target: null, // {x, y} the guard is walking toward
    lookTimer: 0,
    lastSeen: null,
    memory: 0,
    mark: null, // '?' while suspicious, '!' while chasing
    speed: GUARD.patrolSpeed,
  }));
}

export function resetWatchmen(guards) {
  guards.forEach((g, i) => {
    g.wp = 0; g.x = LOOPS[i][0].x; g.y = LOOPS[i][0].y;
    g.state = 'patrol'; g.suspicion = 0; g.target = null;
    g.mark = null; g.pause = 0; g.memory = 0;
  });
}

// How clearly can this guard see Wren right now? 0 = not at all,
// 1 = dead to rights. Moonbeams expose her; sneaking hides her.
export function guardSees(guard, thief, gallery) {
  const d = dist(guard.x, guard.y, thief.x, thief.y);
  let range = GUARD.coneRange;
  if (thief.exposed) range *= 1.45;
  if (thief.sneaking) range *= 0.62;
  if (d > range) return 0;
  const ang = angleTo(guard.x, guard.y, thief.x, thief.y);
  if (Math.abs(angleDiff(ang, guard.facing)) > GUARD.coneHalfAngle) return 0;
  if (segmentBlocked(gallery, guard.x, guard.y, thief.x, thief.y)) return 0;
  // Closer and more centred = clearer sight.
  const closeness = 1 - d / range;
  const centred = 1 - Math.abs(angleDiff(ang, guard.facing)) / GUARD.coneHalfAngle;
  return clamp(0.35 + closeness * 0.5 + centred * 0.25, 0, 1);
}

// Clip the vision cone at cover: one ray length per fan slice.
export function coneFan(guard, gallery) {
  const rays = [];
  const slices = 15;
  for (let i = 0; i <= slices; i++) {
    const a = guard.facing - GUARD.coneHalfAngle + (2 * GUARD.coneHalfAngle * i) / slices;
    rays.push({ angle: a, len: rayLength(gallery, guard.x, guard.y, a, GUARD.coneRange) });
  }
  return rays;
}

function walkToward(g, tx, ty, speed, dt) {
  const d = dist(g.x, g.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  g.facing = angleTo(g.x, g.y, tx, ty);
  g.x += Math.cos(g.facing) * step;
  g.y += Math.sin(g.facing) * step;
  return d - step < 6;
}

export function updateWatchman(g, thief, gallery, dt, now, alarm) {
  const seen = guardSees(g, thief, gallery);
  const lockdown = alarm.value >= 100;
  const speedMul = alarm.value >= 50 ? 1.35 : 1;
  const fast = lockdown ? GUARD.lockdownSpeed : GUARD.chaseSpeed;

  // Lockdown: every guard runs at Wren.
  if (lockdown && g.state !== 'chase') {
    g.state = 'chase'; g.mark = '!'; g.target = { x: thief.x, y: thief.y };
    sfx.spotted();
  }

  if (g.state === 'chase') {
    g.target = { x: thief.x, y: thief.y };
    walkToward(g, thief.x, thief.y, fast * speedMul, dt);
    g.mark = '!';
    if (seen <= 0) {
      g.memory -= dt;
      if (g.memory <= 0) { g.state = 'return'; g.mark = null; }
    } else {
      g.memory = GUARD.memoryTime;
    }
    return seen;
  }

  if (seen > 0.72) {
    // Seen clearly: shout and chase.
    if (g.state !== 'chase') sfx.spotted();
    g.state = 'chase'; g.mark = '!'; g.memory = GUARD.memoryTime;
    g.target = { x: thief.x, y: thief.y };
    return seen;
  }
  if (seen > 0.3) {
    // A glimpse at the edge of the cone: grow suspicious, walk to look.
    if (g.state !== 'suspect' && g.state !== 'investigate') sfx.suspicious();
    g.suspicion = Math.min(1, g.suspicion + dt * 1.4);
    if (g.state === 'patrol') { g.state = 'suspect'; g.mark = '?'; g.pause = GUARD.suspectTime; }
    g.lastSeen = { x: thief.x, y: thief.y };
    if (g.suspicion >= 1) {
      g.state = 'investigate'; g.mark = '?'; g.target = { ...g.lastSeen };
    }
    return seen;
  }

  // Not seen: suspicion cools off.
  g.suspicion = Math.max(0, g.suspicion - dt * 0.35);

  if (g.state === 'suspect') {
    g.pause -= dt;
    if (g.pause <= 0) {
      if (g.suspicion > 0.55 && g.lastSeen) {
        g.state = 'investigate'; g.target = { ...g.lastSeen };
      } else {
        g.state = 'patrol'; g.mark = null;
      }
    }
    return seen;
  }

  if (g.state === 'investigate') {
    const arrived = walkToward(g, g.target.x, g.target.y, GUARD.investigateSpeed * speedMul, dt);
    if (arrived) {
      g.lookTimer += dt;
      g.facing += dt * 1.6; // look around
      if (g.lookTimer > GUARD.lookAroundTime) {
        g.lookTimer = 0; g.state = 'return'; g.mark = null; g.suspicion = 0;
      }
    }
    return seen;
  }

  if (g.state === 'return') {
    // Walk back to the nearest patrol corner, then resume the loop.
    let best = 0, bestD = Infinity;
    g.loop.forEach((p, i) => {
      const d = dist(g.x, g.y, p.x, p.y);
      if (d < bestD) { bestD = d; best = i; }
    });
    const arrived = walkToward(g, g.loop[best].x, g.loop[best].y, GUARD.patrolSpeed * speedMul, dt);
    if (arrived) { g.wp = best; g.state = 'patrol'; }
    return seen;
  }

  // Patrol: walk the loop, pausing at each corner.
  if (g.pause > 0) {
    g.pause -= dt;
    if (g.pause <= 0) g.wp = (g.wp + 1) % g.loop.length;
    return seen;
  }
  const p = g.loop[g.wp];
  const arrived = walkToward(g, p.x, p.y, GUARD.patrolSpeed * speedMul, dt);
  if (arrived) g.pause = 1.4;
  return seen;
}

// Send the nearest guard to look at a coin that just rang on the marble.
export function sendGuardToCoin(guards, x, y) {
  let best = null, bestD = Infinity;
  for (const g of guards) {
    if (g.state === 'chase') continue;
    const d = dist(g.x, g.y, x, y);
    if (d < bestD) { bestD = d; best = g; }
  }
  if (best) {
    best.state = 'investigate';
    best.target = { x, y };
    best.mark = '?';
    best.lookTimer = 0;
  }
}

// Did any guard just catch Wren? (touching while chasing, or in lockdown)
export function guardCaught(guards, thief, now) {
  if (now < thief.invulnerableUntil) return null;
  for (const g of guards) {
    if ((g.state === 'chase') && dist(g.x, g.y, thief.x, thief.y) < GUARD.catchDistance) {
      return g;
    }
  }
  return null;
}
