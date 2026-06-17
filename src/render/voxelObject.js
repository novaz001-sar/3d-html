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
  drawSoftFacePanel(ctx, pts, 'rgba(255, 250, 240, .2)');

  if (faceName === 'front') {
    drawCatMagicFront(ctx, pts, scale);
  } else if (faceName === 'right' || faceName === 'left') {
    drawCatMagicSideWindow(ctx, pts, scale);
  } else if (faceName === 'top') {
    drawCatMagicTop(ctx, pts, scale);
  } else if (faceName === 'back') {
    drawCatMagicBack(ctx, pts, scale);
  } else {
    drawMagicSpark(ctx, pointOnFace(pts, 0.78, 0.75), scale * 0.07);
  }

  ctx.strokeStyle = 'rgba(86, 98, 124, .34)';
  ctx.lineWidth = Math.max(1, scale * 0.014);
  ctx.beginPath();
  pts.forEach((p, index) => index ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawCatMagicFront(ctx, pts, scale) {
  drawCatMagicCloudBase(ctx, pts, scale);
  drawFaceText(ctx, pts, 'CAT PLANET', 0.5, 0.72, scale * 0.13, -0.07);
  drawCatPlanetIcon(ctx, pts, 0.5, 0.43, scale * 0.38);
  drawTinyPlanetOnFace(ctx, pts, 0.18, 0.46, scale * 0.075);
  drawMagicSpark(ctx, pointOnFace(pts, 0.82, 0.42), scale * 0.07);
  drawMagicSpark(ctx, pointOnFace(pts, 0.76, 0.18), scale * 0.085);
}

function drawCatMagicSideWindow(ctx, pts, scale) {
  const center = pointOnFace(pts, 0.52, 0.54);
  ctx.save();
  ctx.fillStyle = '#fff2dc';
  ctx.strokeStyle = 'rgba(86, 98, 124, .24)';
  ctx.lineWidth = Math.max(1.2, scale * 0.025);
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], scale * 0.28, scale * 0.34, 0.04, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#333d78';
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], scale * 0.21, scale * 0.27, 0.04, 0, Math.PI * 2);
  ctx.fill();
  drawTinyPlanetOnScreen(ctx, center[0] - scale * 0.02, center[1] + scale * 0.02, scale * 0.07);
  drawScreenStar(ctx, center[0] + scale * 0.11, center[1] - scale * 0.08, scale * 0.055, '#ffe07a');
  drawScreenStar(ctx, center[0] - scale * 0.12, center[1] + scale * 0.11, scale * 0.026, '#ffffff');
  drawCatMagicCloudBase(ctx, pts, scale);
  drawMagicSpark(ctx, pointOnFace(pts, 0.18, 0.34), scale * 0.055);
  ctx.restore();
}

function drawCatMagicTop(ctx, pts, scale) {
  const panel = [
    pointOnFace(pts, 0.12, 0.16),
    pointOnFace(pts, 0.88, 0.16),
    pointOnFace(pts, 0.88, 0.84),
    pointOnFace(pts, 0.12, 0.84)
  ];
  drawSoftFacePanel(ctx, panel, 'rgba(150, 154, 223, .72)');
  const center = pointOnFace(pts, 0.5, 0.5);
  ctx.save();
  ctx.strokeStyle = '#aee8ff';
  ctx.lineWidth = Math.max(1.4, scale * 0.04);
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], scale * 0.24, scale * 0.14, -0.12, 0, Math.PI * 2);
  ctx.stroke();
  drawScreenStar(ctx, center[0], center[1], scale * 0.085, '#ffe07a');
  drawScreenStar(ctx, pointOnFace(pts, 0.18, 0.25)[0], pointOnFace(pts, 0.18, 0.25)[1], scale * 0.035, '#ffc0d2');
  drawScreenStar(ctx, pointOnFace(pts, 0.82, 0.72)[0], pointOnFace(pts, 0.82, 0.72)[1], scale * 0.035, '#fff8cc');
  ctx.restore();
}

function drawCatMagicBack(ctx, pts, scale) {
  drawCatMagicCloudBase(ctx, pts, scale);
  const center = pointOnFace(pts, 0.5, 0.56);
  ctx.save();
  ctx.fillStyle = '#fff6e7';
  ctx.strokeStyle = 'rgba(86, 98, 124, .22)';
  ctx.lineWidth = Math.max(1, scale * 0.02);
  ctx.beginPath();
  ctx.ellipse(center[0], center[1], scale * 0.24, scale * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ff9fba';
  drawFaceDot(ctx, [center[0], center[1] + scale * 0.02], scale * 0.07, '#ff9fba');
  [-0.13, -0.045, 0.045, 0.13].forEach((dx, index) => {
    drawFaceDot(ctx, [center[0] + scale * dx, center[1] - scale * (0.12 + (index % 2) * 0.025)], scale * 0.045, '#ff9fba');
  });
  drawScreenStar(ctx, center[0], center[1] + scale * 0.03, scale * 0.032, '#ffe07a');
  ctx.restore();
}

function drawCatMagicCloudBase(ctx, pts, scale) {
  ctx.save();
  ctx.fillStyle = 'rgba(142, 197, 236, .88)';
  ctx.beginPath();
  ctx.moveTo(...pointOnFace(pts, 0, 0));
  for (let i = 0; i <= 7; i += 1) {
    const u = i / 7;
    const p = pointOnFace(pts, u, 0.2 + (i % 2) * 0.04);
    ctx.quadraticCurveTo(p[0], p[1] - scale * 0.045, pointOnFace(pts, Math.min(1, u + 0.07), 0.16)[0], pointOnFace(pts, Math.min(1, u + 0.07), 0.16)[1]);
  }
  ctx.lineTo(...pointOnFace(pts, 1, 0));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFaceText(ctx, pts, text, u, v, size, angleOffset = 0) {
  const center = pointOnFace(pts, u, v);
  const left = pointOnFace(pts, 0.24, v);
  const right = pointOnFace(pts, 0.76, v);
  const angle = Math.atan2(right[1] - left[1], right[0] - left[0]) + angleOffset;
  ctx.save();
  ctx.translate(center[0], center[1]);
  ctx.rotate(angle);
  ctx.fillStyle = '#56627c';
  ctx.strokeStyle = 'rgba(255, 255, 255, .5)';
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.font = `900 ${Math.max(7, size)}px "Baloo 2", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function drawCatPlanetIcon(ctx, pts, u, v, radius) {
  const center = pointOnFace(pts, u, v);
  ctx.save();
  drawLogoEarOnScreen(ctx, center[0] - radius * 0.38, center[1] - radius * 0.48, radius * 0.22, -1);
  drawLogoEarOnScreen(ctx, center[0] + radius * 0.38, center[1] - radius * 0.48, radius * 0.22, 1);
  ctx.fillStyle = '#fff8e9';
  ctx.strokeStyle = '#56627c';
  ctx.lineWidth = Math.max(1.5, radius * 0.08);
  ctx.beginPath();
  ctx.arc(center[0], center[1] - radius * 0.06, radius * 0.58, Math.PI, 0);
  ctx.lineTo(center[0] + radius * 0.58, center[1] + radius * 0.24);
  ctx.lineTo(center[0] - radius * 0.58, center[1] + radius * 0.24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#8fd2ff';
  ctx.lineWidth = Math.max(2, radius * 0.16);
  ctx.beginPath();
  ctx.ellipse(center[0], center[1] + radius * 0.05, radius * 0.88, radius * 0.24, -0.09, 0, Math.PI * 2);
  ctx.stroke();
  drawFaceDot(ctx, [center[0] - radius * 0.24, center[1] - radius * 0.08], radius * 0.065, '#34384a');
  drawFaceDot(ctx, [center[0] + radius * 0.24, center[1] - radius * 0.08], radius * 0.065, '#34384a');
  drawFaceDot(ctx, [center[0] - radius * 0.38, center[1] + radius * 0.11], radius * 0.085, '#ff9fba');
  drawFaceDot(ctx, [center[0] + radius * 0.38, center[1] + radius * 0.11], radius * 0.085, '#ff9fba');
  ctx.strokeStyle = '#34384a';
  ctx.lineWidth = Math.max(1.2, radius * 0.045);
  ctx.beginPath();
  ctx.arc(center[0] - radius * 0.05, center[1] + radius * 0.06, radius * 0.055, 0, Math.PI);
  ctx.arc(center[0] + radius * 0.05, center[1] + radius * 0.06, radius * 0.055, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawLogoEarOnScreen(ctx, x, y, size, direction) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * direction, y + size * 0.62);
  ctx.lineTo(x - size * direction, y + size * 0.62);
  ctx.closePath();
  ctx.fillStyle = '#fff8e9';
  ctx.fill();
  ctx.strokeStyle = '#56627c';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.35);
  ctx.lineTo(x + size * 0.45 * direction, y + size * 0.42);
  ctx.lineTo(x - size * 0.45 * direction, y + size * 0.42);
  ctx.closePath();
  ctx.fillStyle = '#ff9fba';
  ctx.fill();
}

function drawTinyPlanetOnFace(ctx, pts, u, v, radius) {
  const center = pointOnFace(pts, u, v);
  drawTinyPlanetOnScreen(ctx, center[0], center[1], radius);
}

function drawTinyPlanetOnScreen(ctx, cx, cy, radius) {
  ctx.save();
  ctx.fillStyle = '#ffb8ca';
  ctx.strokeStyle = '#e79dac';
  ctx.lineWidth = Math.max(1, radius * 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffe0a8';
  ctx.lineWidth = Math.max(1.3, radius * 0.22);
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.08, radius * 1.45, radius * 0.36, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawScreenStar(ctx, cx, cy, size, fill) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(86, 98, 124, .32)';
  ctx.lineWidth = Math.max(1, size * 0.16);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? size * 0.52 : size;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
