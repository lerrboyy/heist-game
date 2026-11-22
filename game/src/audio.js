// Moonlit Gallery — tiny synthesised sounds. No audio files at all:
// every blip is an oscillator through the Web Audio API.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function blip(freq, dur, type, vol, slideTo) {
  if (muted) return;
  const ac = audioCtx();
  if (!ac) return;
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    g.gain.setValueAtTime(vol || 0.12, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* sound is decoration; never break the game */ }
}

export const sfx = {
  coin() { blip(1320, 0.28, 'sine', 0.14, 880); blip(1760, 0.18, 'sine', 0.07); },
  treasure() { blip(660, 0.22, 'sine', 0.13, 990); setTimeout(() => blip(990, 0.3, 'sine', 0.11, 1320), 90); },
  idol() { blip(523, 0.3, 'triangle', 0.13, 784); setTimeout(() => blip(784, 0.45, 'triangle', 0.11, 1046), 120); },
  suspicious() { blip(440, 0.25, 'square', 0.05, 620); },
  spotted() { blip(220, 0.4, 'sawtooth', 0.08, 440); },
  lockdown() { blip(160, 0.7, 'sawtooth', 0.11, 90); },
  caught() { blip(330, 0.35, 'sawtooth', 0.1, 110); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.35, 'triangle', 0.12), i * 130)); },
  click() { blip(880, 0.06, 'sine', 0.06); },
};
