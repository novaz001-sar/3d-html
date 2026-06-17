import { clamp } from '../shared/utils.js';

export function normalizeQuat(q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

export function quatMultiply(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz
  ];
}

export function quatFromAxisAngle(axis, angle) {
  const s = Math.sin(angle / 2);
  const c = Math.cos(angle / 2);
  return normalizeQuat([axis[0] * s, axis[1] * s, axis[2] * s, c]);
}

export function rotateVec(v, q) {
  const [x, y, z] = v;
  const [qx, qy, qz, qw] = q;
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  return [
    ix * qw + iw * -qx + iy * -qz - iz * -qy,
    iy * qw + iw * -qy + iz * -qx - ix * -qz,
    iz * qw + iw * -qz + ix * -qy - iy * -qx
  ];
}

export function normalize3(v) {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

export function hexToRgb(hex) {
  const raw = String(hex || '#60a5fa').replace('#', '');
  const value = parseInt(raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function shadeRgb(rgb, factor) {
  return {
    r: clamp(Math.round(rgb.r * factor), 0, 255),
    g: clamp(Math.round(rgb.g * factor), 0, 255),
    b: clamp(Math.round(rgb.b * factor), 0, 255)
  };
}

export function rgba(rgb, a = 1) {
  return `rgba(${rgb.r},${rgb.g},${rgb.b},${a})`;
}

export function stepAutoRotation(q, axisMode, speed, dt) {
  const angle = Math.PI * 2 / Math.max(0.8, Number(speed || 4)) * dt;
  const axis = axisMode === 1 ? [0, 1, 0] : [1, 0, 0];
  return normalizeQuat(quatMultiply(quatFromAxisAngle(axis, angle), q));
}
