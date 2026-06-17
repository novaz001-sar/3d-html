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
      faces.push({
        pts3,
        n: rn,
        avgZ,
        color: opts.overrideColor || voxel.color || '#60a5fa',
        mat: opts.overrideMat || voxel.mat || 'wood',
        shape: voxel.shape || 'cube',
        face: face.name
      });
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
    if (face.shape === 'catMagicCube') {
      drawCatMagicFace(ctx, pts, scale, face.face);
    }
    ctx.strokeStyle = face.mat === 'glass' ? 'rgba(255, 255, 255, .78)' : 'rgba(15, 23, 42, .45)';
    ctx.lineWidth = Math.max(1.2, scale * 0.034);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCatMagicFace(ctx, pts, scale, faceName) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawSoftFacePanel(ctx, pts, 'rgba(255, 250, 240, .18)');
  ctx.strokeStyle = faceName === 'top' ? 'rgba(255, 216, 79, .6)' : 'rgba(123, 220, 255, .58)';
  ctx.lineWidth = Math.max(1, scale * 0.016);
  ctx.beginPath();
  pts.forEach((p, index) => index ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
  ctx.stroke();

  drawMagicSpark(ctx, pointOnFace(pts, 0.8, 0.76), scale * 0.074);

  if (faceName !== 'front') {
    ctx.restore();
    return;
  }

  drawSoftFacePanel(ctx, [
    pointOnFace(pts, 0.14, 0.16),
    pointOnFace(pts, 0.86, 0.16),
    pointOnFace(pts, 0.82, 0.84),
    pointOnFace(pts, 0.18, 0.84)
  ], 'rgba(255, 255, 245, .3)');

  const leftEar = [pointOnFace(pts, 0.14, 0.84), pointOnFace(pts, 0.3, 1.14), pointOnFace(pts, 0.43, 0.83)];
  const rightEar = [pointOnFace(pts, 0.57, 0.83), pointOnFace(pts, 0.72, 1.14), pointOnFace(pts, 0.86, 0.84)];
  drawFaceTriangle(ctx, leftEar, '#fff6d8', '#34384a', scale);
  drawFaceTriangle(ctx, rightEar, '#fff6d8', '#34384a', scale);
  drawFaceTriangle(ctx, [
    pointOnFace(pts, 0.23, 0.9),
    pointOnFace(pts, 0.3, 1.04),
    pointOnFace(pts, 0.37, 0.9)
  ], '#ff9fba', 'rgba(52, 56, 74, .18)', scale * 0.48);
  drawFaceTriangle(ctx, [
    pointOnFace(pts, 0.63, 0.9),
    pointOnFace(pts, 0.72, 1.04),
    pointOnFace(pts, 0.78, 0.9)
  ], '#ff9fba', 'rgba(52, 56, 74, .18)', scale * 0.48);

  drawFaceDot(ctx, pointOnFace(pts, 0.38, 0.56), scale * 0.054, '#34384a');
  drawFaceDot(ctx, pointOnFace(pts, 0.62, 0.56), scale * 0.054, '#34384a');
  drawFaceDot(ctx, pointOnFace(pts, 0.27, 0.4), scale * 0.074, '#ff8aad');
  drawFaceDot(ctx, pointOnFace(pts, 0.73, 0.4), scale * 0.074, '#ff8aad');
  drawCatMouth(ctx, pts, scale);
  drawMagicOrbit(ctx, pts, scale);
  ctx.restore();
}

function drawSoftFacePanel(ctx, pts, fillStyle) {
  ctx.beginPath();
  pts.forEach((p, index) => index ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function pointOnFace(pts, u, v) {
  const [p0, p1, p2, p3] = pts;
  const a = (1 - u) * (1 - v);
  const b = u * (1 - v);
  const c = u * v;
  const d = (1 - u) * v;
  return [
    p0[0] * a + p1[0] * b + p2[0] * c + p3[0] * d,
    p0[1] * a + p1[1] * b + p2[1] * c + p3[1] * d
  ];
}

function drawFaceTriangle(ctx, points, fill, stroke, scale) {
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point[0], point[1]) : ctx.moveTo(point[0], point[1]));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = Math.max(1, scale * 0.025);
  ctx.stroke();
}

function drawFaceDot(ctx, point, radius, fill) {
  ctx.beginPath();
  ctx.fillStyle = fill;
  ctx.arc(point[0], point[1], radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawCatMouth(ctx, pts, scale) {
  const left = pointOnFace(pts, 0.45, 0.35);
  const mid = pointOnFace(pts, 0.5, 0.32);
  const right = pointOnFace(pts, 0.55, 0.35);
  ctx.strokeStyle = '#34384a';
  ctx.lineWidth = Math.max(1.2, scale * 0.03);
  ctx.beginPath();
  ctx.arc(left[0], left[1], scale * 0.044, 0, Math.PI);
  ctx.arc(right[0], right[1], scale * 0.044, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(mid[0], mid[1], scale * 0.019, 0, Math.PI * 2);
  ctx.fillStyle = '#34384a';
  ctx.fill();
}

function drawMagicOrbit(ctx, pts, scale) {
  const left = pointOnFace(pts, 0.14, 0.28);
  const right = pointOnFace(pts, 0.86, 0.36);
  const lift = pointOnFace(pts, 0.5, 0.48);
  ctx.save();
  ctx.strokeStyle = 'rgba(123, 220, 255, .58)';
  ctx.lineWidth = Math.max(1.2, scale * 0.026);
  ctx.beginPath();
  ctx.moveTo(left[0], left[1]);
  ctx.quadraticCurveTo(lift[0], lift[1] + scale * 0.08, right[0], right[1]);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, .7)';
  ctx.lineWidth = Math.max(1, scale * 0.012);
  ctx.beginPath();
  ctx.moveTo(pointOnFace(pts, 0.58, 0.4)[0], pointOnFace(pts, 0.58, 0.4)[1]);
  ctx.lineTo(pointOnFace(pts, 0.78, 0.37)[0], pointOnFace(pts, 0.78, 0.37)[1]);
  ctx.stroke();
  ctx.restore();
}

function drawMagicSpark(ctx, point, size) {
  ctx.save();
  ctx.translate(point[0], point[1]);
  ctx.rotate(-0.22);
  ctx.fillStyle = '#ffd84f';
  ctx.strokeStyle = 'rgba(52, 56, 74, .45)';
  ctx.lineWidth = Math.max(1, size * 0.18);
  ctx.beginPath();
  for (let index = 0; index < 8; index += 1) {
    const radius = index % 2 === 0 ? size : size * 0.42;
    const angle = -Math.PI / 2 + index * Math.PI / 4;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    index ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
