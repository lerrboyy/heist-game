// Moonlit Gallery — the fixed screenshot scenes behind "?shot=".
// Each scene sets the whole game state to one steady, readable moment
// using the fixed seed, so the four pictures never wobble between runs.
//   ?shot=start  — title screen over the dim gallery
//   ?shot=play   — mid-play: Wren near the central plinth, cones, camera,
//                  the Idol glowing, alarm part full, guide open
//   ?shot=alarm  — lockdown chase: a guard closing in, alarm red
//   ?shot=escape — victory: Wren at the skylight rope with the Idol
import { mulberry32, SHOT_SEED } from './config.js';
import { resetThief } from './thief.js';
import { resetWatchmen } from './watchmen.js';
import { resetAlarm } from './alarm.js';

export function applyShot(S, mode) {
  const rng = mulberry32(SHOT_SEED);
  resetThief(S.thief, S.gallery.entry);
  resetWatchmen(S.guards);
  resetAlarm(S.alarm);
  for (const tr of S.gallery.treasures) tr.taken = false;
  S.thief.coin = null; S.thief.coinFlight = null;
  S.message = null;
  S.showGuide = true;
  S.shotMode = mode;

  if (mode === 'start') {
    S.phase = 'title';
    S.time = 0;
    S.thief.x = 200; S.thief.y = 560;
    placeGuards(S, rng);
    return;
  }

  if (mode === 'play') {
    S.phase = 'playing';
    S.time = 96; // 1:36 on the clock
    S.frozen = true;
    // Wren crouched by the laser ring, just south of the Idol.
    S.thief.x = 560; S.thief.y = 505;
    S.thief.sneaking = true;
    S.thief.facing = -Math.PI / 2;
    // One small treasure already pocketed, so LOOT reads 1/4.
    S.gallery.treasures[2].taken = true; // the pearl necklace
    S.alarm.value = 38;
    S.alarm.seenNow = true;
    S.alarm.seenBy = 'guard';
    // Bram patrols the north edge with his cone sweeping the plinth;
    // Odo prowls the west side; Fen holds the east.
    S.guards[0].x = 700; S.guards[0].y = 300; S.guards[0].facing = Math.PI * 0.78; S.guards[0].state = 'patrol';
    S.guards[1].x = 300; S.guards[1].y = 380; S.guards[1].facing = 0.35; S.guards[1].state = 'suspect'; S.guards[1].mark = '?';
    S.guards[2].x = 860; S.guards[2].y = 480; S.guards[2].facing = Math.PI * 1.15; S.guards[2].state = 'patrol';
    S.cameras[0].angle = 0.35; S.cameras[1].angle = Math.PI - 0.4;
    return;
  }

  if (mode === 'alarm') {
    S.phase = 'playing';
    S.time = 214; // 3:34
    S.frozen = true;
    S.thief.x = 640; S.thief.y = 470;
    S.thief.facing = Math.PI * 0.75;
    S.gallery.treasures[1].taken = true; // scarab pocketed
    S.gallery.treasures[2].taken = true; // pearl pocketed
    S.alarm.value = 100;
    S.alarm.lockdown = true;
    S.alarm.seenNow = true;
    S.alarm.seenBy = 'guard';
    // Bram has spotted her and is closing in, exclamation overhead.
    S.guards[0].x = 700; S.guards[0].y = 400; S.guards[0].facing = angleTo(700, 400, 640, 470);
    S.guards[0].state = 'chase'; S.guards[0].mark = '!';
    S.guards[1].x = 420; S.guards[1].y = 560; S.guards[1].facing = angleTo(420, 560, 640, 470);
    S.guards[1].state = 'chase'; S.guards[1].mark = '!';
    S.guards[2].x = 880; S.guards[2].y = 330; S.guards[2].facing = angleTo(880, 330, 640, 470);
    S.guards[2].state = 'chase'; S.guards[2].mark = '!';
    S.cameras[0].angle = 0.6; S.cameras[1].angle = Math.PI - 0.7;
    return;
  }

  if (mode === 'escape') {
    S.phase = 'won';
    S.time = 301; // 5:01
    S.frozen = true;
    for (const tr of S.gallery.treasures) tr.taken = true;
    S.thief.x = S.gallery.exit.x; S.thief.y = S.gallery.exit.y + 22;
    S.thief.facing = -Math.PI / 2;
    S.alarm.value = 22;
    S.guards[0].x = 700; S.guards[0].y = 300; S.guards[0].facing = Math.PI * 0.8; S.guards[0].state = 'patrol';
    S.guards[1].x = 300; S.guards[1].y = 420; S.guards[1].facing = 0; S.guards[1].state = 'patrol';
    S.guards[2].x = 860; S.guards[2].y = 480; S.guards[2].facing = Math.PI; S.guards[2].state = 'patrol';
    S.cameras[0].angle = -0.3; S.cameras[1].angle = Math.PI + 0.3;
    return;
  }

  // Unknown ?shot= value: fall back to the title.
  S.phase = 'title';
  S.time = 0;
  placeGuards(S, rng);
}

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function placeGuards(S, rng) {
  // A gentle spread for the title backdrop.
  S.guards[0].x = 640; S.guards[0].y = 220; S.guards[0].facing = Math.PI * 0.7;
  S.guards[1].x = 260; S.guards[1].y = 460; S.guards[1].facing = -0.4;
  S.guards[2].x = 880; S.guards[2].y = 420; S.guards[2].facing = Math.PI * 1.2;
  void rng;
}
