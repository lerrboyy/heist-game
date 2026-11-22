// Moonlit Gallery — the room itself: walls, plinths, ropes, palms,
// benches, columns, paintings, moonbeams, the laser grid, treasure spots.
import { ROOM, EXIT, ENTRY, LASER } from './config.js';

// Central plinth (the Jade Idol) and the four treasure plinths.
export function buildGallery() {
  const cx = 535, cy = 374; // centre of the room
  const treasures = [
    { id: 'idol', name: 'Jade Idol', x: cx, y: cy, taken: false, kind: 'idol', hue: '#7fe0a8' },
    { id: 'scarab', name: 'Gold Scarab', x: 250, y: 190, taken: false, kind: 'scarab', hue: '#f2c14e' },
    { id: 'pearl', name: 'Pearl Necklace', x: 830, y: 210, taken: false, kind: 'pearl', hue: '#f4eefc' },
    { id: 'vase', name: 'Jade Vase', x: 268, y: 540, taken: false, kind: 'vase', hue: '#8fd6b0' },
  ];
  // Solid things vision cones cannot pass and Wren cannot walk through.
  // Coordinates are canvas coordinates.
  const blockers = [
    // central plinth
    { x: cx - 34, y: cy - 26, w: 68, h: 52, kind: 'plinth' },
    // side plinths
    { x: 250 - 26, y: 190 - 20, w: 52, h: 40, kind: 'plinth' },
    { x: 830 - 26, y: 210 - 20, w: 52, h: 40, kind: 'plinth' },
    { x: 268 - 26, y: 540 - 20, w: 52, h: 40, kind: 'plinth' },
    // marble columns (tall cover)
    { x: 430 - 20, y: 250 - 20, w: 40, h: 40, kind: 'column' },
    { x: 640 - 20, y: 500 - 20, w: 40, h: 40, kind: 'column' },
    // long benches
    { x: 380, y: 470, w: 130, h: 26, kind: 'bench' },
    { x: 640, y: 240, w: 130, h: 26, kind: 'bench' },
    // potted palms (tall cover, round footprint approximated as a box)
    { x: 150 - 24, y: 330 - 24, w: 48, h: 48, kind: 'palm' },
    { x: 920 - 24, y: 420 - 24, w: 48, h: 48, kind: 'palm' },
    { x: 430 - 24, y: 590 - 24, w: 48, h: 48, kind: 'palm' },
    { x: 700 - 24, y: 130 - 24, w: 48, h: 48, kind: 'palm' },
  ];
  // Velvet rope barriers (decorative, low — they do not block sight).
  const ropes = [
    { x1: 300, y1: 300, x2: 470, y2: 300 },
    { x1: 600, y1: 448, x2: 770, y2: 448 },
    { x1: 300, y1: 470, x2: 360, y2: 470 },
  ];
  // Moonbeam patches from the skylight: standing in one makes Wren easy to spot.
  const moonbeams = [
    { x: 535, y: 240, rx: 130, ry: 46, angle: 0.35 },
    { x: 820, y: 480, rx: 120, ry: 42, angle: -0.3 },
    { x: 300, y: 420, rx: 105, ry: 40, angle: 0.5 },
  ];
  // Framed paintings along the walls (decorative).
  const paintings = [
    { x: 120, y: ROOM.y + 4, w: 74, h: 10, hue: '#7a5a8c' },
    { x: 330, y: ROOM.y + 4, w: 60, h: 10, hue: '#3f6d8e' },
    { x: 760, y: ROOM.y + 4, w: 74, h: 10, hue: '#8e6a3f' },
    { x: 120, y: ROOM.y + ROOM.h - 14, w: 66, h: 10, hue: '#5a7a4a' },
    { x: 560, y: ROOM.y + ROOM.h - 14, w: 80, h: 10, hue: '#8c3f4a' },
    { x: ROOM.x + 4, y: 220, w: 10, h: 64, hue: '#6a5a8c' },
    { x: ROOM.x + 4, y: 480, w: 10, h: 64, hue: '#3f8e7a' },
  ];
  return {
    center: { x: cx, y: cy },
    treasures, blockers, ropes, moonbeams, paintings,
    exit: { ...EXIT },
    entry: { ...ENTRY },
    laser: { x: cx, y: cy, radius: LASER.radius },
  };
}

// Is a point inside any solid blocker?
export function pointBlocked(gallery, x, y) {
  for (const b of gallery.blockers) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
  }
  return false;
}

// Does the segment from (ax,ay) to (bx,by) cross any blocker?
// Sampled in small steps; good enough for cone edges and sight lines.
export function segmentBlocked(gallery, ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay);
  const steps = Math.max(1, Math.ceil(d / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (pointBlocked(gallery, ax + (bx - ax) * t, ay + (by - ay) * t)) return true;
  }
  return false;
}

// How far can a ray travel from (x,y) in direction `ang` before it hits
// a blocker, a wall, or `maxDist`? Used to clip vision cones at cover.
export function rayLength(gallery, x, y, ang, maxDist) {
  const step = 6;
  let d = step;
  while (d < maxDist) {
    const px = x + Math.cos(ang) * d;
    const py = y + Math.sin(ang) * d;
    if (px < ROOM.x || px > ROOM.x + ROOM.w || py < ROOM.y || py > ROOM.y + ROOM.h) return d;
    if (pointBlocked(gallery, px, py)) return d;
    d += step;
  }
  return maxDist;
}

// Is Wren standing in a moonbeam patch?
export function inMoonbeam(gallery, x, y) {
  for (const m of gallery.moonbeams) {
    const dx = x - m.x, dy = y - m.y;
    const c = Math.cos(-m.angle), s = Math.sin(-m.angle);
    const lx = dx * c - dy * s, ly = dx * s + dy * c;
    if ((lx * lx) / (m.rx * m.rx) + (ly * ly) / (m.ry * m.ry) <= 1) return true;
  }
  return false;
}

// Laser gap angles at time t (seconds). Two gaps opposite each other,
// slowly rotating; after the Idol is taken they stay open for good.
export function laserGaps(gallery, t, idolTaken) {
  if (idolTaken) return [0, Math.PI];
  const base = (t / LASER.cycleSeconds) * Math.PI * 2 * 0.25;
  return [base, base + Math.PI];
}

// Is point (x,y) touching a live laser strand?
export function onLaser(gallery, x, y, t, idolTaken) {
  const d = Math.hypot(x - gallery.laser.x, y - gallery.laser.y);
  if (Math.abs(d - gallery.laser.radius) > 7) return false;
  const a = Math.atan2(y - gallery.laser.y, x - gallery.laser.x);
  for (const g of laserGaps(gallery, t, idolTaken)) {
    let diff = a - g;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < LASER.gapHalfAngle) return false;
  }
  return true;
}
