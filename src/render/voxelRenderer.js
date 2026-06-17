import { clamp, hexToRgb, normalize3, normalizeQuat, quatFromAxisAngle, quatMultiply, rgba, rotateVec, roundRect, shadeRgb } from '../core/utils.js';

const CUBE_CORNERS = [
  [-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5],
  [-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]
];

const CUBE_FACES = [
  { idx: [4, 5, 6, 7], n: [0, 0, 1], name: 'front' },
  { idx: [1, 5, 6, 2], n: [1, 0, 0], name: 'right' },
  { idx: [3, 2, 6, 7], n: [0, 1, 0], name: 'top' },
  { idx: [0, 3, 7, 4], n: [-1, 0, 0], name: 'left' },
  { idx: [0, 4, 5, 1], n: [0, -1, 0], name: 'bottom' },
  { idx: [0, 1, 2, 3], n: [0, 0, -1], name: 'back' }
];

export function setupCanvas(canvas) {
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: width / dpr, height: height / dpr };
}

export function drawBackdrop(ctx, width, height, mode = 'object') {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#fff7ed');
  grad.addColorStop(0.45, '#f0fdfa');
  grad.addColorStop(1, '#eff6ff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = mode === 'grid' ? 'rgba(20, 184, 166, .18)' : 'rgba(37, 99, 235, .12)';
  const gap = mode === 'grid' ? 28 : 34;
  for (let x = -gap; x < width + gap; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height * 0.32, height);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.translate(width / 2, height * 0.77);
  ctx.scale(1, 0.25);
  const platform = ctx.createRadialGradient(0, 0, 4, 0, 0, Math.min(width, height) * 0.35);
  platform.addColorStop(0, 'rgba(15, 118, 110, .2)');
  platform.addColorStop(1, 'rgba(15, 118, 110, 0)');
  ctx.fillStyle = platform;
  ctx.beginPath();
  ctx.arc(0, 0, Math.min(width, height) * 0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawObject(canvas, voxels, q, opts = {}) {
  const frame = setupCanvas(canvas);
  if (!frame) return;
  const { ctx, width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, opts.stage || 'object');
  drawVoxelObject(ctx, width, height, voxels || [], normalizeQuat(q || [0, 0, 0, 1]), opts);
}

export function drawVoxelGrid(canvas, voxels, layer, color) {
  const frame = setupCanvas(canvas);
  if (!frame) return;
  const { ctx, width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, 'grid');
  const half = 4;
  const size = Math.min(width, height) * 0.86;
  const left = (width - size) / 2;
  const top = (height - size) / 2;
  const cell = size / (half * 2 + 1);

  ctx.save();
  for (let i = 0; i <= half * 2 + 1; i += 1) {
    const x = Math.round(left + i * cell) + 0.5;
    const y = Math.round(top + i * cell) + 0.5;
    ctx.strokeStyle = 'rgba(15, 23, 42, .16)';
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + size, y);
    ctx.stroke();
  }

  voxels.forEach(voxel => {
    const gx = voxel.x + half;
    const gy = half - voxel.y;
    const x = left + gx * cell;
    const y = top + gy * cell;
    const sameLayer = voxel.z === layer;
    ctx.globalAlpha = sameLayer ? 1 : 0.22;
    ctx.fillStyle = sameLayer ? voxel.color : '#64748b';
    roundRect(ctx, x + 4, y + 4, cell - 8, cell - 8, 8);
    ctx.fill();
    ctx.strokeStyle = sameLayer ? 'rgba(15, 23, 42, .55)' : 'rgba(15, 23, 42, .16)';
    ctx.lineWidth = sameLayer ? 3 : 1;
    ctx.stroke();
  });
  ctx.restore();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
}

export function gridPointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const half = 4;
  const size = Math.min(rect.width, rect.height) * 0.86;
  const left = rect.left + (rect.width - size) / 2;
  const top = rect.top + (rect.height - size) / 2;
  const cell = size / (half * 2 + 1);
  const gx = Math.floor((event.clientX - left) / cell);
  const gy = Math.floor((event.clientY - top) / cell);
  if (gx < 0 || gy < 0 || gx > half * 2 || gy > half * 2) return null;
  return { x: gx - half, y: half - gy };
}

export function makeDragRotator(canvas, getQ, setQ, onChange = () => {}) {
  if (!canvas) return;
  let dragging = false;
  let px = 0;
  let py = 0;
  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    px = event.clientX;
    py = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - px;
    const dy = event.clientY - py;
    px = event.clientX;
    py = event.clientY;
    const qx = quatFromAxisAngle([1, 0, 0], dy * 0.012);
    const qy = quatFromAxisAngle([0, 1, 0], dx * 0.012);
    setQ(normalizeQuat(quatMultiply(qy, quatMultiply(qx, getQ()))));
    onChange();
  });
  const end = event => {
    dragging = false;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
}

function drawVoxelObject(ctx, width, height, voxels, q, opts = {}) {
  if (!voxels.length) {
    ctx.save();
    ctx.fillStyle = 'rgba(71, 85, 105, .72)';
    ctx.font = `800 ${Math.max(16, Math.min(width, height) * 0.055)}px Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(opts.emptyText || 'Empty', width / 2, height / 2);
    ctx.restore();
    return;
  }

  const centered = centerVoxels(voxels);
  const radius = Math.max(2.1, Math.sqrt(centered.reduce((m, v) => Math.max(m, v.x * v.x + v.y * v.y + v.z * v.z), 0)) + 1.3);
  const scale = Math.min(width, height) / (radius * 3.15) * (opts.zoom || 1);
  const cx = width / 2;
  const cy = height * 0.52;
  const faces = [];

  for (const voxel of centered) {
    const corners = CUBE_CORNERS.map(c => rotateVec([voxel.x + c[0], voxel.y + c[1], voxel.z + c[2]], q));
    for (const face of CUBE_FACES) {
      const rn = rotateVec(face.n, q);
      if (rn[2] <= 0.02) continue;
      const pts3 = face.idx.map(i => corners[i]);
      const avgZ = pts3.reduce((sum, p) => sum + p[2], 0) / pts3.length;
      faces.push({ pts3, n: rn, avgZ, color: opts.overrideColor || voxel.color || '#60a5fa', mat: opts.overrideMat || voxel.mat || 'wood', face: face.name });
    }
  }

  faces.sort((a, b) => a.avgZ - b.avgZ);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const face of faces) {
    const pts = face.pts3.map(p => [cx + p[0] * scale, cy - p[1] * scale]);
    const light = normalize3([-0.45, 0.78, 0.72]);
    const dot = Math.max(0, face.n[0] * light[0] + face.n[1] * light[1] + face.n[2] * light[2]);
    const shade = 0.58 + dot * 0.48 + (face.face === 'top' ? 0.12 : 0);
    const rgb = hexToRgb(face.color);
    const alpha = face.mat === 'glass' ? 0.72 : 1;
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.closePath();
    const grad = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
    grad.addColorStop(0, rgba(shadeRgb(rgb, shade + 0.16), alpha));
    grad.addColorStop(1, rgba(shadeRgb(rgb, shade), alpha));
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(15, 23, 42, .18)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = face.mat === 'glass' ? 'rgba(255, 255, 255, .78)' : 'rgba(15, 23, 42, .45)';
    ctx.lineWidth = Math.max(1.2, scale * 0.034);
    ctx.stroke();
  }
  ctx.restore();
}

function centerVoxels(voxels) {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;
  voxels.forEach(v => {
    minX = Math.min(minX, v.x);
    minY = Math.min(minY, v.y);
    minZ = Math.min(minZ, v.z);
    maxX = Math.max(maxX, v.x);
    maxY = Math.max(maxY, v.y);
    maxZ = Math.max(maxZ, v.z);
  });
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const cz = (minZ + maxZ) / 2;
  return voxels.map(v => ({ ...v, x: v.x - cx, y: v.y - cy, z: v.z - cz }));
}

export function syncVoxels(voxels, color, mat) {
  return (voxels || []).map(v => ({ ...v, color: color || v.color, mat: mat || v.mat }));
}

export function stepAutoRotation(q, axisMode, speed, dt) {
  const angle = Math.PI * 2 / Math.max(0.8, Number(speed || 4)) * dt;
  const axis = axisMode === 1 ? [0, 1, 0] : [1, 0, 0];
  return normalizeQuat(quatMultiply(quatFromAxisAngle(axis, angle), q));
}

export { clamp };
