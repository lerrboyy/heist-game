// Moonlit Gallery — the two Argus lenses: brass cameras that sweep a
// pale blue-white arc across the floor and spot Wren inside it.
import { CAMERA, ROOM, clamp, dist, angleTo, angleDiff } from './config.js';
import { segmentBlocked, rayLength } from './gallery.js';

export function createCameras() {
  return [
    { name: 'Argus West', x: ROOM.x + 16, y: 210, baseAngle: 0, phase: 0, angle: 0 },
    { name: 'Argus East', x: ROOM.x + ROOM.w - 16, y: 300, baseAngle: Math.PI, phase: 2.1, angle: Math.PI },
  ];
}

// Sweep back and forth across the floor.
export function updateCameras(cameras, t) {
  for (const c of cameras) {
    c.angle = c.baseAngle + Math.sin(t * CAMERA.sweepSpeed + c.phase) * CAMERA.sweepArc;
  }
}

// 0..1 how clearly this camera sees Wren right now.
export function cameraSees(cam, thief, gallery) {
  const d = dist(cam.x, cam.y, thief.x, thief.y);
  let range = CAMERA.range;
  if (thief.exposed) range *= 1.3;
  if (thief.sneaking) range *= 0.7;
  if (d > range) return 0;
  const ang = angleTo(cam.x, cam.y, thief.x, thief.y);
  if (Math.abs(angleDiff(ang, cam.angle)) > CAMERA.halfAngle) return 0;
  if (segmentBlocked(gallery, cam.x, cam.y, thief.x, thief.y)) return 0;
  return clamp(1.1 - d / range, 0, 1);
}

// Clip the camera arc at cover, like the guard cones.
export function cameraFan(cam, gallery) {
  const rays = [];
  const slices = 11;
  for (let i = 0; i <= slices; i++) {
    const a = cam.angle - CAMERA.halfAngle + (2 * CAMERA.halfAngle * i) / slices;
    rays.push({ angle: a, len: rayLength(gallery, cam.x, cam.y, a, CAMERA.range) });
  }
  return rays;
}
