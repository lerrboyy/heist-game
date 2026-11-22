// Moonlit Gallery — drawing everything: floor, light, cones, figures,
// HUD, guide panel, messages. One canvas, 1280x720, no images.
import { W, H, HUD_H, BAR_H, GUIDE_X, ROOM } from './config.js';
import { alarmColour, visibilityWord } from './alarm.js';
import { coneFan } from './watchmen.js';
import { cameraFan } from './cameras.js';
import { laserGaps } from './gallery.js';
import { reachableTreasure } from './thief.js';

const GREEN_DARK = '#0d2b1f';
const GREEN = '#123b2a';
const GREEN_LIGHT = '#1d5c40';
const BRASS = '#c9a227';
const BRASS_DIM = '#8a6d1f';
const MARBLE_A = '#274b3a';
const MARBLE_B = '#1e3d2f';
const MARBLE_C = '#2f5c46';
const MOON = '#9fc4e8';
const AMBER = '#f5b942';
const PLUM = '#5b3a6e';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, colour, align, weight, font) {
  ctx.fillStyle = colour;
  ctx.font = `${weight || 600} ${size}px ${font || 'Georgia, serif'}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

export function render(ctx, S, input) {
  ctx.clearRect(0, 0, W, H);
  drawRoom(ctx, S);
  drawLasers(ctx, S);
  drawTreasures(ctx, S);
  drawExit(ctx, S);
  drawCoins(ctx, S);
  drawCameraCones(ctx, S);
  drawGuardCones(ctx, S);
  drawFigures(ctx, S, input);
  drawGuide(ctx, S);
  drawHUD(ctx, S);
  drawBottomBar(ctx, S);
  drawMessages(ctx, S, input);
  if (S.phase === 'title') drawTitle(ctx, S);
  if (S.phase === 'paused') drawPaused(ctx);
}

function drawRoom(ctx, S) {
  const g = S.gallery;
  // Wall surround
  ctx.fillStyle = '#081a12';
  ctx.fillRect(0, HUD_H, W, H - HUD_H - BAR_H);
  // Checkerboard marble floor, darker toward the edges
  const tile = 52;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += tile) {
      const cx = Math.floor((x - ROOM.x) / tile), cy = Math.floor((y - ROOM.y) / tile);
      const edge = (x < ROOM.x + tile || y < ROOM.y + tile || x > ROOM.x + ROOM.w - tile * 2 || y > ROOM.y + ROOM.h - tile * 2);
      ctx.fillStyle = edge ? ((cx + cy) % 2 ? MARBLE_B : '#224636') : ((cx + cy) % 2 ? MARBLE_A : MARBLE_C);
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Brass-trimmed walls
  ctx.strokeStyle = BRASS; ctx.lineWidth = 3;
  ctx.strokeRect(ROOM.x, ROOM.y, ROOM.w, ROOM.h);
  ctx.strokeStyle = BRASS_DIM; ctx.lineWidth = 1;
  ctx.strokeRect(ROOM.x + 5, ROOM.y + 5, ROOM.w - 10, ROOM.h - 10);
  // Paintings
  for (const p of g.paintings) {
    ctx.fillStyle = '#0a1f16';
    ctx.fillRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
    ctx.fillStyle = p.hue;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
  }
  // Moonbeam patches
  for (const m of g.moonbeams) {
    ctx.save();
    ctx.translate(m.x, m.y); ctx.rotate(m.angle);
    const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, m.rx);
    grad.addColorStop(0, 'rgba(159,196,232,0.34)');
    grad.addColorStop(1, 'rgba(159,196,232,0)');
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(0, 0, m.rx, m.ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  // Service door (entry) bottom-left
  ctx.fillStyle = '#3a2c14';
  ctx.fillRect(ROOM.x + 8, ROOM.y + ROOM.h - 34, 96, 26);
  ctx.strokeStyle = BRASS; ctx.lineWidth = 2;
  ctx.strokeRect(ROOM.x + 8, ROOM.y + ROOM.h - 34, 96, 26);
  text(ctx, 'SERVICE DOOR', ROOM.x + 56, ROOM.y + ROOM.h - 20, 10, '#e8d9a0', 'center', 700);
  // Velvet ropes (sagging crimson lines between brass posts)
  for (const r of g.ropes) {
    ctx.strokeStyle = '#7a1f2b'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(r.x1, r.y1);
    ctx.quadraticCurveTo((r.x1 + r.x2) / 2, Math.max(r.y1, r.y2) + 12, r.x2, r.y2);
    ctx.stroke();
    ctx.fillStyle = BRASS;
    ctx.beginPath(); ctx.arc(r.x1, r.y1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r.x2, r.y2, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Benches
  for (const b of g.blockers.filter((x) => x.kind === 'bench')) {
    ctx.fillStyle = '#4a2f1c'; roundRect(ctx, b.x, b.y, b.w, b.h, 6); ctx.fill();
    ctx.strokeStyle = BRASS_DIM; ctx.lineWidth = 1; ctx.stroke();
  }
  // Columns
  for (const b of g.blockers.filter((x) => x.kind === 'column')) {
    ctx.fillStyle = '#d8d2c0'; roundRect(ctx, b.x, b.y, b.w, b.h, 8); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#8a8578';
    ctx.beginPath(); ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 9, 0, Math.PI * 2); ctx.fill();
  }
  // Potted palms (tall cover)
  for (const b of g.blockers.filter((x) => x.kind === 'palm')) {
    const cxp = b.x + b.w / 2, cyp = b.y + b.h / 2;
    ctx.fillStyle = '#8a4a2a';
    ctx.beginPath(); ctx.arc(cxp, cyp, 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2f7a4a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cxp, cyp);
      ctx.quadraticCurveTo(cxp + Math.cos(a) * 20, cyp + Math.sin(a) * 20, cxp + Math.cos(a) * 30, cyp + Math.sin(a) * 30);
      ctx.stroke();
    }
    ctx.fillStyle = '#57a86e';
    ctx.beginPath(); ctx.arc(cxp, cyp, 7, 0, Math.PI * 2); ctx.fill();
  }
  // Side plinths (under their treasures)
  for (const b of g.blockers.filter((x) => x.kind === 'plinth')) {
    ctx.fillStyle = '#e8e2d0'; roundRect(ctx, b.x, b.y, b.w, b.h, 4); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#c9c2ae';
    ctx.fillRect(b.x + 4, b.y + b.h - 8, b.w - 8, 4);
  }
  // Small callout captions so a stranger reads the room at a glance
  text(ctx, 'palms — cover', 150, 392, 11, 'rgba(220,235,220,0.75)', 'center', 400, 'italic Georgia, serif');
  text(ctx, 'moonbeam — exposed', 820, 440, 11, 'rgba(200,220,245,0.8)', 'center', 400, 'italic Georgia, serif');
  text(ctx, 'you are hidden where the cone stops at the plinth', 640, 600, 11, 'rgba(220,235,220,0.7)', 'center', 400, 'italic Georgia, serif');
}

function drawLasers(ctx, S) {
  const g = S.gallery;
  const idolTaken = g.treasures[0].taken;
  const gaps = laserGaps(g, S.time, idolTaken);
  ctx.save();
  ctx.strokeStyle = 'rgba(229,72,77,0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 6]);
  ctx.beginPath();
  // Draw the ring in arcs, skipping the gaps.
  const sorted = [...gaps].sort((a, b) => a - b);
  const gap = 0.34;
  let start = sorted[0] + gap;
  ctx.arc(g.laser.x, g.laser.y, g.laser.radius, start, sorted[1] - gap);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(g.laser.x, g.laser.y, g.laser.radius, sorted[1] + gap, sorted[0] + Math.PI * 2 - gap);
  ctx.stroke();
  ctx.restore();
  // Laser posts
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    ctx.fillStyle = '#c9c2ae';
    ctx.beginPath(); ctx.arc(g.laser.x + Math.cos(a) * g.laser.radius, g.laser.y + Math.sin(a) * g.laser.radius, 4, 0, Math.PI * 2); ctx.fill();
  }
  text(ctx, 'laser grid', g.laser.x - 128, g.laser.y - 12, 11, 'rgba(255,150,150,0.85)', 'right', 400, 'italic Georgia, serif');
}

function drawTreasures(ctx, S) {
  for (const tr of S.gallery.treasures) {
    if (tr.taken) continue;
    const pulse = 1 + Math.sin(S.time * 3 + tr.x) * 0.12;
    ctx.save();
    ctx.translate(tr.x, tr.y);
    if (tr.id === 'idol') {
      const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46 * pulse);
      glow.addColorStop(0, 'rgba(127,224,168,0.55)');
      glow.addColorStop(1, 'rgba(127,224,168,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(0, 0, 46 * pulse, 0, Math.PI * 2); ctx.fill();
      // Jade Idol: a little seated figure, glowing green
      ctx.fillStyle = '#7fe0a8';
      ctx.beginPath(); ctx.arc(0, -8, 9, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(0, -4); ctx.lineTo(10, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2f8f5f';
      ctx.beginPath(); ctx.arc(-3, -9, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(3, -9, 1.6, 0, Math.PI * 2); ctx.fill();
    } else if (tr.id === 'scarab') {
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6d1f'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(0, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-11, -3); ctx.lineTo(-16, -8); ctx.moveTo(-11, 3); ctx.lineTo(-16, 8); ctx.stroke();
    } else if (tr.id === 'pearl') {
      ctx.fillStyle = '#f4eefc';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.arc(i * 5, Math.abs(i) * 2 - 4, 3.4, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.fillStyle = '#8fd6b0';
      ctx.beginPath(); ctx.moveTo(-6, -10); ctx.quadraticCurveTo(-11, 0, -6, 10); ctx.lineTo(6, 10);
      ctx.quadraticCurveTo(11, 0, 6, -10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2f8f5f'; ctx.fillRect(-7, -13, 14, 4);
    }
    ctx.restore();
  }
}

function drawExit(ctx, S) {
  const g = S.gallery;
  const open = g.treasures[0].taken;
  const x = g.exit.x, y = g.exit.y;
  // Skylight shaft
  ctx.save();
  const grad = ctx.createLinearGradient(x, y - 40, x, y + 40);
  grad.addColorStop(0, 'rgba(159,196,232,0.35)');
  grad.addColorStop(1, 'rgba(159,196,232,0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(x - 46, ROOM.y + 8, 92, 66);
  ctx.restore();
  // Rope
  ctx.strokeStyle = open ? '#e8d9a0' : '#6a5a3a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, ROOM.y + 8);
  ctx.lineTo(x, y + 14 + (open ? Math.sin(S.time * 2) * 2 : 0));
  ctx.stroke();
  // Rope knot / exit marker
  ctx.fillStyle = open ? '#7fe0a8' : '#8a8578';
  ctx.beginPath(); ctx.arc(x, y + 16, open ? 12 : 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5; ctx.stroke();
  text(ctx, 'SKYLIGHT ROPE', x, y + 42, 11, open ? '#a8e8c0' : '#c9c2ae', 'center', 700);
  text(ctx, open ? '— GO! —' : '(locked)', x, y + 58, 11, open ? '#a8e8c0' : '#c9c2ae', 'center', 700);
}

function drawCoins(ctx, S) {
  const t = S.thief;
  if (t.coinFlight) {
    const f = t.coinFlight;
    const x = f.x0 + (f.x1 - f.x0) * f.t;
    const y = f.y0 + (f.y1 - f.y0) * f.t - Math.sin(f.t * Math.PI) * 34;
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = BRASS_DIM; ctx.stroke();
  }
  if (t.coin) {
    const ring = 8 + Math.sin(t.coin.t * 6) * 3;
    ctx.strokeStyle = 'rgba(242,193,78,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(t.coin.x, t.coin.y, ring, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f2c14e';
    ctx.beginPath(); ctx.arc(t.coin.x, t.coin.y, 5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawCameraCones(ctx, S) {
  for (const cam of S.cameras) {
    const fan = cameraFan(cam, S.gallery);
    ctx.save();
    ctx.fillStyle = 'rgba(159,196,232,0.20)';
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    for (const r of fan) ctx.lineTo(cam.x + Math.cos(r.angle) * r.len, cam.y + Math.sin(r.angle) * r.len);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(200,225,245,0.5)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
    // Camera body on the wall
    ctx.fillStyle = '#8a6d1f';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8f2fa';
    ctx.beginPath(); ctx.arc(cam.x + Math.cos(cam.angle) * 6, cam.y + Math.sin(cam.angle) * 6, 4, 0, Math.PI * 2); ctx.fill();
    text(ctx, 'ARGUS', cam.x, cam.y - 18, 10, 'rgba(200,225,245,0.8)', 'center', 700);
  }
}

function drawGuardCones(ctx, S) {
  for (const g of S.guards) {
    const fan = coneFan(g, S.gallery);
    const hot = g.state === 'chase';
    ctx.save();
    ctx.fillStyle = hot ? 'rgba(229,72,77,0.30)' : 'rgba(245,185,66,0.26)';
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    for (const r of fan) ctx.lineTo(g.x + Math.cos(r.angle) * r.len, g.y + Math.sin(r.angle) * r.len);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hot ? 'rgba(229,72,77,0.6)' : 'rgba(245,185,66,0.45)';
    ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
}

function drawFigures(ctx, S, input) {
  // Guards
  for (const g of S.guards) {
    ctx.save();
    ctx.translate(g.x, g.y);
    // Lantern glow
    const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 40);
    glow.addColorStop(0, 'rgba(245,185,66,0.22)');
    glow.addColorStop(1, 'rgba(245,185,66,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, 0, 40, 0, Math.PI * 2); ctx.fill();
    // Broad-shouldered navy figure
    ctx.fillStyle = '#1e2f5e';
    ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c4a86';
    ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
    // Cap
    ctx.fillStyle = '#141f3d';
    ctx.fillRect(-9, -17, 18, 7);
    ctx.fillStyle = '#f2c14e';
    ctx.fillRect(-9, -11, 18, 2);
    // Lantern in hand
    ctx.fillStyle = '#f5b942';
    ctx.beginPath(); ctx.arc(Math.cos(g.facing) * 18, Math.sin(g.facing) * 18, 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Suspicion / chase mark
    if (g.mark) {
      text(ctx, g.mark, g.x, g.y - 30, 22, g.mark === '!' ? '#ff5a5a' : '#ffd76a', 'center', 800);
    }
    text(ctx, g.name, g.x, g.y + 28, 10, 'rgba(220,230,240,0.65)', 'center', 400);
  }
  // Wren
  const t = S.thief;
  ctx.save();
  ctx.translate(t.x, t.y);
  // Hidden ring (dark) or exposed ring (pale) under her
  ctx.strokeStyle = t.exposed ? 'rgba(240,244,255,0.9)' : 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.stroke();
  // Plum cloak, hooded
  ctx.fillStyle = PLUM;
  ctx.beginPath(); ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(13, -4, 11, 12);
  ctx.quadraticCurveTo(0, 17, -11, 12);
  ctx.quadraticCurveTo(-13, -4, 0, -14);
  ctx.fill();
  // Pale mask
  ctx.fillStyle = '#f0e6d8';
  ctx.beginPath(); ctx.arc(0, -4, 6.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1a1a22';
  ctx.beginPath(); ctx.arc(-2.4, -5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2.4, -5, 1.2, 0, Math.PI * 2); ctx.fill();
  // Dagger glint / facing tick
  ctx.strokeStyle = '#c9c2ae'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(t.facing) * 16, Math.sin(t.facing) * 16);
  ctx.stroke();
  ctx.restore();
  text(ctx, 'WREN', t.x, t.y + 28, 10, 'rgba(240,230,255,0.8)', 'center', 700);
  // Mouse aim hint: a faint dotted line toward the cursor while playing
  if (S.phase === 'playing' && input && input.mouse.inside) {
    ctx.save();
    ctx.strokeStyle = 'rgba(242,193,78,0.5)';
    ctx.setLineDash([3, 6]);
    ctx.beginPath(); ctx.moveTo(t.x, t.y); ctx.lineTo(input.mouse.x, input.mouse.y); ctx.stroke();
    ctx.restore();
  }
  // "E to take" prompt
  if (S.phase === 'playing') {
    const tr = reachableTreasure(t, S.gallery);
    if (tr) {
      text(ctx, `Press E — take the ${tr.name}`, t.x, t.y - 30, 13, '#ffe9a8', 'center', 700);
    }
  }
}

function lootCount(S) {
  return S.gallery.treasures.filter((t) => t.taken).length;
}

function drawHUD(ctx, S) {
  ctx.fillStyle = GREEN_DARK;
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, HUD_H - 3, W, 3);
  text(ctx, 'MOONLIT GALLERY', 18, 20, 20, '#f0e6c8', 'left', 800);
  text(ctx, 'JOB 1: THE JADE IDOL', 18, 44, 12, BRASS, 'left', 700);
  // Objective, centre
  const idolTaken = S.gallery.treasures[0].taken;
  const obj = S.phase === 'won' ? 'The Idol is yours — gone like moonlight'
    : idolTaken ? 'Reach the skylight rope' : 'Take the Jade Idol';
  text(ctx, obj, 640, 26, 16, '#e8f2e8', 'center', 700);
  const mm = Math.floor(S.time / 60), ss = Math.floor(S.time % 60);
  text(ctx, `TIME ${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`, 640, 48, 12, '#b8cbb8', 'center', 600);
  // Alarm meter, right
  const ax = 880, ay = 16, aw = 200, ah = 14;
  text(ctx, 'ALARM', ax, ay + 2, 12, '#e8e2d0', 'left', 700);
  ctx.fillStyle = '#0a1f16';
  roundRect(ctx, ax + 58, ay - 4, aw, ah, 4); ctx.fill();
  ctx.fillStyle = alarmColour(S.alarm.value);
  const fillW = Math.max(0, (aw - 4) * S.alarm.value / 100);
  if (fillW > 0) { roundRect(ctx, ax + 60, ay - 2, fillW, ah - 4, 3); ctx.fill(); }
  ctx.strokeStyle = BRASS_DIM; ctx.lineWidth = 1;
  roundRect(ctx, ax + 58, ay - 4, aw, ah, 4); ctx.stroke();
  text(ctx, visibilityWord(S.alarm, S.thief), ax + 58 + aw + 10, ay + 2, 12, S.alarm.seenNow ? '#ff7a7a' : '#b8e8c8', 'left', 800);
  // Loot / coins / nerve, right second row
  text(ctx, `LOOT ${lootCount(S)}/4`, ax, 46, 13, '#f0e6c8', 'left', 700);
  let cx = ax + 92;
  text(ctx, 'COINS', cx, 46, 12, '#b8cbb8', 'left', 700);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < S.thief.coins ? '#f2c14e' : '#3a3a2a';
    ctx.beginPath(); ctx.arc(cx + 52 + i * 16, 46, 5, 0, Math.PI * 2); ctx.fill();
  }
  cx = ax + 190;
  text(ctx, 'NERVE', cx, 46, 12, '#b8cbb8', 'left', 700);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < S.alarm.nerve ? '#e5484d' : '#3a2a2a';
    ctx.beginPath(); ctx.arc(cx + 52 + i * 16, 46, 5, 0, Math.PI * 2); ctx.fill();
  }
  // Lockdown banner
  if (S.alarm.lockdown && S.phase === 'playing') {
    ctx.fillStyle = 'rgba(180,20,25,0.9)';
    ctx.fillRect(345, HUD_H + 8, 380, 30);
    text(ctx, '⚠ LOCKDOWN — ALL WATCHMEN HUNTING ⚠', 535, HUD_H + 24, 14, '#ffffff', 'center', 800);
  }
}

const GUIDE_LINES = [
  ['Watchman', 'amber cone — if it sees you, it chases', '#f5b942'],
  ['Argus lens', 'pale sweep — timing beats it', '#9fc4e8'],
  ['Laser grid', 'red ring — sneak through the gaps', '#e5484d'],
  ['Moonbeam', 'pale patch — you are easy to spot', '#cfe4f8'],
  ['Palm / plinth', 'tall cover — cones stop here', '#57a86e'],
  ['Velvet rope', 'old velvet, low — step over', '#a03a4a'],
  ['Skylight rope', 'exit — opens after the Idol', '#7fe0a8'],
  ['Brass coin', 'click to toss — a guard comes to look', '#f2c14e'],
];

function drawGuide(ctx, S) {
  if (!S.showGuide) return;
  ctx.fillStyle = '#0a241a';
  ctx.fillRect(GUIDE_X, HUD_H, W - GUIDE_X, H - HUD_H - BAR_H);
  ctx.fillStyle = BRASS;
  ctx.fillRect(GUIDE_X, HUD_H, 2, H - HUD_H - BAR_H);
  text(ctx, 'GALLERY GUIDE', GUIDE_X + 105, HUD_H + 26, 16, '#f0e6c8', 'center', 800);
  ctx.fillStyle = BRASS_DIM;
  ctx.fillRect(GUIDE_X + 20, HUD_H + 44, W - GUIDE_X - 40, 1);
  let y = HUD_H + 66;
  for (const [name, desc, colour] of GUIDE_LINES) {
    ctx.fillStyle = colour;
    ctx.beginPath(); ctx.arc(GUIDE_X + 26, y, 6, 0, Math.PI * 2); ctx.fill();
    text(ctx, name, GUIDE_X + 40, y, 13, '#f0e6c8', 'left', 700);
    // Wrap the description to two short lines.
    const words = desc.split(' ');
    let line = '', ly = y + 16;
    ctx.font = '400 11px Georgia, serif';
    for (const w of words) {
      if ((line + ' ' + w).trim().length > 24) {
        text(ctx, line.trim(), GUIDE_X + 40, ly, 11, '#b8cbb8', 'left', 400);
        ly += 14; line = w;
      } else line += ' ' + w;
    }
    if (line.trim()) text(ctx, line.trim(), GUIDE_X + 40, ly, 11, '#b8cbb8', 'left', 400);
    y = ly + 26;
  }
  text(ctx, 'H hides this guide', GUIDE_X + 105, H - BAR_H - 24, 11, '#8aa88a', 'center', 400, 'italic Georgia, serif');
}

function drawBottomBar(ctx, S) {
  ctx.fillStyle = GREEN_DARK;
  ctx.fillRect(0, H - BAR_H, W, BAR_H);
  ctx.fillStyle = BRASS;
  ctx.fillRect(0, H - BAR_H, W, 2);
  text(ctx, 'WASD / arrows — move    Shift — sneak    Click — toss a coin    E — take treasure    R — restart    H — guide    M — mute    Esc — pause', 640, H - BAR_H / 2 + 1, 13, '#d8e8d8', 'center', 600);
}

function drawMessages(ctx, S) {
  if (S.message && S.time < S.message.until) {
    const a = Math.min(1, (S.message.until - S.time) * 2);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(8,26,18,0.85)';
    roundRect(ctx, 340, 300, 400, 76, 8); ctx.fill();
    ctx.strokeStyle = BRASS; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, S.message.text, 540, 326, 20, '#ffe9a8', 'center', 800);
    if (S.message.sub) text(ctx, S.message.sub, 540, 354, 13, '#d8e8d8', 'center', 400);
    ctx.restore();
  }
  if (S.phase === 'won') {
    ctx.fillStyle = 'rgba(8,26,18,0.68)';
    ctx.fillRect(0, HUD_H, GUIDE_X, H - HUD_H - BAR_H);
    text(ctx, 'CLEAN GETAWAY', 535, 300, 40, '#a8e8c0', 'center', 800);
    text(ctx, 'The Idol is yours — Wren slips up the skylight rope into the night.', 535, 348, 16, '#e8f2e8', 'center', 400);
    text(ctx, `Loot ${lootCount(S)}/4   •   Time ${Math.floor(S.time / 60)}:${String(Math.floor(S.time % 60)).padStart(2, '0')}   •   Press R to run the job again`, 535, 384, 14, '#b8cbb8', 'center', 400);
  }
  if (S.phase === 'lost') {
    ctx.fillStyle = 'rgba(26,8,8,0.85)';
    ctx.fillRect(0, HUD_H, GUIDE_X, H - HUD_H - BAR_H);
    text(ctx, 'THE GALLERY KEEPS ITS IDOL', 535, 300, 34, '#ff9a9a', 'center', 800);
    text(ctx, 'Three captures — Wren’s nerve is gone. The watchmen lock the doors.', 535, 348, 16, '#e8d8d8', 'center', 400);
    text(ctx, 'Press R to try the job again', 535, 384, 14, '#b8cbb8', 'center', 400);
  }
}

function drawTitle(ctx, S) {
  ctx.fillStyle = 'rgba(6,18,12,0.78)';
  ctx.fillRect(0, HUD_H, W, H - HUD_H - BAR_H);
  text(ctx, 'MOONLIT GALLERY', 640, 240, 52, '#f0e6c8', 'center', 800);
  text(ctx, '— THE JADE IDOL JOB —', 640, 288, 18, BRASS, 'center', 700);
  text(ctx, 'Steal the Jade Idol and leave by the skylight rope.', 640, 336, 17, '#e8f2e8', 'center', 400);
  text(ctx, 'Slip past the watchmen, mind the Argus lenses and the laser grid,', 640, 362, 15, '#b8cbb8', 'center', 400);
  text(ctx, 'and do not let the alarm reach the red.', 640, 384, 15, '#b8cbb8', 'center', 400);
  text(ctx, 'Press Enter to begin', 640, 440, 20, '#ffe9a8', 'center', 700);
  text(ctx, 'WASD move  •  Shift sneak  •  Click toss a coin  •  E take treasure', 640, 476, 13, '#8aa88a', 'center', 400);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(6,18,12,0.7)';
  ctx.fillRect(0, HUD_H, W, H - HUD_H - BAR_H);
  text(ctx, 'PAUSED', 535, 330, 36, '#f0e6c8', 'center', 800);
  text(ctx, 'Press Esc or P to carry on', 535, 372, 15, '#b8cbb8', 'center', 400);
}
