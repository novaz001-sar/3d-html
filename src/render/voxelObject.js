import { drawBackdrop, setupCanvas } from './canvas.js';
import { hexToRgb, normalize3, normalizeQuat, rgba, rotateVec, shadeRgb } from './math3d.js';

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

export function drawObject(canvas, voxels, q, opts = {}) {
  const frame = setupCanvas(canvas);
  if (!frame) return;
  const { ctx, width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, opts.stage || 'object');
  drawVoxelObject(ctx, width, height, voxels || [], normalizeQuat(q || [0, 0, 0, 1]), opts);
}

export function syncVoxels(voxels, color, mat) {
  return (voxels || []).map(v => ({ ...v, color: color || v.color, mat: mat || v.mat }));
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
