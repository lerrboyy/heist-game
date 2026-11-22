// Moonlit Gallery — the alarm meter, lockdown, nerve pips, win and lose.
import { ALARM, NERVE_START } from './config.js';
import { sfx } from './audio.js';

export function createAlarm() {
  return {
    value: 0, // 0..100
    lockdown: false,
    nerve: NERVE_START,
    seenNow: false,
    seenBy: null, // 'guard' | 'camera' | 'laser'
  };
}

export function resetAlarm(alarm) {
  alarm.value = 0;
  alarm.lockdown = false;
  alarm.nerve = NERVE_START;
  alarm.seenNow = false;
  alarm.seenBy = null;
}

// dt step: the meter rises while Wren is seen, falls while she is hidden.
export function updateAlarm(alarm, dt, seenStrength, seenBy) {
  alarm.seenNow = seenStrength > 0;
  alarm.seenBy = seenStrength > 0 ? seenBy : null;
  if (seenStrength > 0) {
    const rate = seenBy === 'camera' ? ALARM.riseCamera
      : seenBy === 'laser' ? ALARM.riseLaser : ALARM.riseGuard;
    alarm.value += rate * seenStrength * dt;
  } else {
    alarm.value -= ALARM.fall * dt;
  }
  if (alarm.value < 0) alarm.value = 0;
  if (alarm.value > 100) alarm.value = 100;
  const wasLockdown = alarm.lockdown;
  alarm.lockdown = alarm.value >= 100;
  if (alarm.lockdown && !wasLockdown) sfx.lockdown();
}

// Lose one nerve pip (a capture). Returns true if that was the last pip.
export function loseNerve(alarm) {
  alarm.nerve -= 1;
  alarm.value = Math.min(100, alarm.value + ALARM.catchBonus);
  sfx.caught();
  return alarm.nerve <= 0;
}

export function alarmColour(v) {
  if (v < 50) return '#5ec97a';
  if (v < 80) return '#e8a33d';
  return '#e5484d';
}

export function visibilityWord(alarm, thief) {
  if (alarm.seenNow) return 'SEEN!';
  if (thief.exposed) return 'EXPOSED';
  return 'HIDDEN';
}
