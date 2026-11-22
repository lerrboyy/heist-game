// Moonlit Gallery — boot and game loop. Ties every module together:
// input, Wren, watchmen, cameras, alarm, and the renderer.
import { W, H, ROOM, EXIT, clamp, dist } from './config.js';
import { buildGallery } from './gallery.js';
import { createThief, resetThief, updateThief, tossCoin, takeTreasure, laserHit, markLaserTouch } from './thief.js';
import { createWatchmen, resetWatchmen, updateWatchman, guardSees, sendGuardToCoin, guardCaught } from './watchmen.js';
import { createCameras, updateCameras, cameraSees } from './cameras.js';
import { createAlarm, resetAlarm, updateAlarm, loseNerve } from './alarm.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { sfx, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = createInput(canvas);

const S = {
  phase: 'title', // title | playing | paused | won | lost
  time: 0,
  gallery: buildGallery(),
  thief: null,
  guards: createWatchmen(),
  cameras: createCameras(),
  alarm: createAlarm(),
  message: null,
  showGuide: true,
  frozen: false, // screenshot scenes freeze the simulation
  shotMode: null,
  laserAlarmCooldown: 0,
};
S.thief = createThief(S.gallery.entry);

function showMessage(text, sub, seconds) {
  S.message = { text, sub: sub || '', until: S.time + seconds };
}

function startJob() {
  S.gallery = buildGallery();
  resetThief(S.thief, S.gallery.entry);
  resetWatchmen(S.guards);
  resetAlarm(S.alarm);
  S.time = 0;
  S.phase = 'playing';
  S.frozen = false;
  S.message = null;
  S.laserAlarmCooldown = 0;
  showMessage('THE JOB BEGINS', 'Take the Jade Idol — mind the cones', 3);
  sfx.click();
}

function caught(guard) {
  const lastNerve = loseNerve(S.alarm);
  S.thief.invulnerableUntil = S.time + 2.5;
  if (lastNerve) {
    S.phase = 'lost';
    showMessage('', '', 0);
  } else {
    S.phase = 'playing';
    resetThief(S.thief, S.gallery.entry);
    for (const g of S.guards) { g.state = 'return'; g.mark = null; g.suspicion = 0; }
    showMessage('CAUGHT!', `The watchman has you. Nerve lost — ${S.alarm.nerve} left.`, 3);
  }
  if (statusEl) statusEl.textContent = S.phase === 'lost'
    ? 'The gallery keeps its Idol. Press R to try again.'
    : 'Caught! Back at the service door.';
}

function winJob() {
  S.phase = 'won';
  sfx.win();
  if (statusEl) statusEl.textContent = 'Clean getaway — the Jade Idol is yours!';
}

// One simulation step.
function step(dt) {
  S.time += dt;
  const t = S.thief;

  // Coin toss (mouse click, only while playing).
  const click = input.consumeClick();
  if (click && S.phase === 'playing' && click.x < 1070) {
    if (tossCoin(t, click.x, click.y)) {
      // the coin rings once it lands; handled in updateThief
    }
  }
  updateThief(t, input, dt, S.gallery, S.time);

  // A coin that just landed rings and pulls the nearest guard over.
  if (t.coin && t.coin.t < dt * 2 && !t.coin.announced) {
    t.coin.announced = true;
    sendGuardToCoin(S.guards, t.coin.x, t.coin.y);
  }
  if (t.coin && t.coin.t > 6) t.coin = null;

  // Cameras sweep.
  updateCameras(S.cameras, S.time);

  // Who sees Wren, and how clearly?
  let bestSee = 0, seenBy = null;
  for (const g of S.guards) {
    const s = updateWatchman(g, t, S.gallery, dt, S.time, S.alarm);
    if (s > bestSee) { bestSee = s; seenBy = 'guard'; }
  }
  for (const cam of S.cameras) {
    const s = cameraSees(cam, t, S.gallery);
    if (s > bestSee) { bestSee = s; seenBy = 'camera'; }
  }

  // Laser grid: touching a live strand spikes the alarm and alerts guards.
  if (S.laserAlarmCooldown > 0) S.laserAlarmCooldown -= dt;
  if (laserHit(t, S.gallery, S.time, S.gallery.treasures[0].taken)) {
    markLaserTouch(t);
    if (S.laserAlarmCooldown <= 0) {
      S.laserAlarmCooldown = 1.5;
      S.alarm.value = Math.min(100, S.alarm.value + 22);
      sendGuardToCoin(S.guards, t.x, t.y);
      showMessage('LASER TRIPPED!', 'The grid screams — move!', 2);
      sfx.spotted();
    }
    if (bestSee < 0.6) { bestSee = 0.6; seenBy = 'laser'; }
  }

  updateAlarm(S.alarm, dt, bestSee, seenBy);

  // Caught?
  const catcher = guardCaught(S.guards, t, S.time);
  if (catcher) { caught(catcher); return; }

  // Take treasure with E.
  if (input.wasPressed('KeyE')) {
    const tr = takeTreasure(t, S.gallery);
    if (tr) {
      if (tr.id === 'idol') {
        showMessage('THE JADE IDOL IS YOURS', 'Now reach the skylight rope — top right', 3.5);
        if (statusEl) statusEl.textContent = 'Idol taken! Reach the skylight rope.';
      } else {
        showMessage(`${tr.name.toUpperCase()} POCKETED`, '', 1.6);
      }
    }
  }

  // Win: reach the skylight rope after taking the Idol.
  if (S.gallery.treasures[0].taken
    && dist(t.x, t.y, S.gallery.exit.x, S.gallery.exit.y + 16) < 42) {
    winJob();
  }
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;

  // Global keys.
  if (input.wasPressed('Enter') && (S.phase === 'title' || S.phase === 'won' || S.phase === 'lost')) startJob();
  if (input.wasPressed('KeyR') && S.phase !== 'title') startJob();
  if (input.wasPressed('KeyH')) S.showGuide = !S.showGuide;
  if (input.wasPressed('KeyM')) toggleMute();
  if ((input.wasPressed('Escape') || input.wasPressed('KeyP'))) {
    if (S.phase === 'playing') { S.phase = 'paused'; }
    else if (S.phase === 'paused') { S.phase = 'playing'; }
  }
  if (input.wasPressed('Enter') && S.phase === 'paused') S.phase = 'playing';

  if (S.phase === 'playing' && !S.frozen) step(dt);
  else if (S.phase === 'title') S.time += dt; // ambient shimmer behind the title
  render(ctx, S, input);
}

let last = performance.now();

// Screenshot scenes from the address bar: ?shot=start|play|alarm|escape
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  applyShot(S, shot);
  // Frozen scenes render one steady frame; still run the loop so the
  // canvas paints, but the simulation does not advance.
  S.frozen = shot !== 'start' ? true : S.frozen;
  if (shot === 'start') S.frozen = false;
} else {
  S.phase = 'title';
}

if (statusEl) statusEl.textContent = 'Moonlit Gallery — press Enter to begin the job.';
canvas.width = W; canvas.height = H;
requestAnimationFrame(frame);

// Expose a little debug handle for play-testing (not part of the game).
window.__moonlit = S;
