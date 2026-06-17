import { roundRect } from '../shared/utils.js';
import { drawBackdrop, setupCanvas } from './canvas.js';

export function drawVoxelGrid(canvas, voxels, layer, color) {
  const frame = setupCanvas(canvas);
  if (!frame) return;
  const { ctx, width, height } = frame;
  ctx.clearRect(0, 0, width, height);
  drawBackdrop(ctx, width, height, 'grid');
  const { half, size, left, top, cell } = getGridMetrics({ width, height });

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
    if (voxel.shape === 'catMagicCube') {
      drawCatMagicGridCell(ctx, x + 4, y + 4, cell - 8, sameLayer ? voxel.color : '#64748b');
    } else {
      roundRect(ctx, x + 4, y + 4, cell - 8, cell - 8, 8);
      ctx.fill();
      ctx.strokeStyle = sameLayer ? 'rgba(15, 23, 42, .55)' : 'rgba(15, 23, 42, .16)';
      ctx.lineWidth = sameLayer ? 3 : 1;
      ctx.stroke();
    }
  });
  ctx.restore();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
}

function drawCatMagicGridCell(ctx, x, y, size, color) {
  const radius = Math.max(8, size * 0.18);
  const bodyTop = y + size * 0.12;
  const bodyHeight = size * 0.84;
  const bodyGrad = ctx.createLinearGradient(x, bodyTop, x + size, bodyTop + bodyHeight);
  bodyGrad.addColorStop(0, '#fffaf0');
  bodyGrad.addColorStop(0.58, '#fff0d9');
  bodyGrad.addColorStop(1, '#c7e6ff');

  roundRect(ctx, x, bodyTop, size, bodyHeight, radius);
  ctx.fillStyle = bodyGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 56, 74, .62)';
  ctx.lineWidth = Math.max(1.6, size * 0.052);
  ctx.stroke();

  drawLavenderTopPlate(ctx, x, y, size);
  drawCloudBase(ctx, x, y, size);
  drawCatPlanetLogo(ctx, x + size * 0.5, y + size * 0.58, size * 0.29);
  drawTinyPlanetSticker(ctx, x + size * 0.18, y + size * 0.47, size * 0.085);
  drawSpark(ctx, x + size * 0.84, y + size * 0.47, size * 0.065);
  drawSpark(ctx, x + size * 0.78, y + size * 0.78, size * 0.085);

  if (size > 42) {
    ctx.save();
    ctx.fillStyle = '#56627c';
    ctx.font = `900 ${Math.max(8, size * 0.11)}px "Baloo 2", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(x + size * 0.5, y + size * 0.33);
    ctx.rotate(-0.05);
    ctx.fillText('CAT PLANET', 0, 0);
    ctx.restore();
  }
}

function drawLavenderTopPlate(ctx, x, y, size) {
  const plateY = y + size * 0.08;
  const plateH = size * 0.22;
  roundRect(ctx, x + size * 0.1, plateY, size * 0.8, plateH, size * 0.1);
  const topGrad = ctx.createLinearGradient(x, plateY, x, plateY + plateH);
  topGrad.addColorStop(0, '#c4c5ff');
  topGrad.addColorStop(1, '#969adf');
  ctx.fillStyle = topGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(86, 98, 124, .28)';
  ctx.lineWidth = Math.max(1, size * 0.025);
  ctx.stroke();

  ctx.strokeStyle = '#aee8ff';
  ctx.lineWidth = Math.max(1.2, size * 0.035);
  ctx.beginPath();
  ctx.ellipse(x + size * 0.5, plateY + plateH * 0.54, size * 0.21, size * 0.075, 0, 0, Math.PI * 2);
  ctx.stroke();
  drawRoundedStar(ctx, x + size * 0.5, plateY + plateH * 0.52, size * 0.075, '#ffe07a');
}

function drawCloudBase(ctx, x, y, size) {
  ctx.fillStyle = '#a9d5f5';
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.78);
  for (let i = 0; i <= 6; i += 1) {
    const cx = x + size * (i / 6);
    const cy = y + size * (0.78 + (i % 2) * 0.035);
    ctx.quadraticCurveTo(cx + size * 0.04, cy - size * 0.045, cx + size * 0.085, y + size * 0.8);
  }
  ctx.lineTo(x + size, y + size);
  ctx.lineTo(x, y + size);
  ctx.closePath();
  ctx.fill();
}

function drawCatPlanetLogo(ctx, cx, cy, radius) {
  ctx.save();
  ctx.strokeStyle = '#58627d';
  ctx.lineWidth = Math.max(1.6, radius * 0.12);
  ctx.fillStyle = '#fff8e9';

  drawLogoEar(ctx, cx - radius * 0.42, cy - radius * 0.55, radius * 0.3, -1);
  drawLogoEar(ctx, cx + radius * 0.42, cy - radius * 0.55, radius * 0.3, 1);

  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.08, radius * 0.67, Math.PI, 0);
  ctx.lineTo(cx + radius * 0.67, cy + radius * 0.34);
  ctx.lineTo(cx - radius * 0.67, cy + radius * 0.34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#8fd2ff';
  ctx.lineWidth = Math.max(2, radius * 0.17);
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.08, radius * 1.02, radius * 0.28, -0.08, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#34384a';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.28, cy - radius * 0.1, radius * 0.075, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.28, cy - radius * 0.1, radius * 0.075, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff9fba';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.42, cy + radius * 0.1, radius * 0.105, 0, Math.PI * 2);
  ctx.arc(cx + radius * 0.42, cy + radius * 0.1, radius * 0.105, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#34384a';
  ctx.lineWidth = Math.max(1.2, radius * 0.06);
  ctx.beginPath();
  ctx.arc(cx - radius * 0.06, cy + radius * 0.07, radius * 0.08, 0, Math.PI);
  ctx.arc(cx + radius * 0.06, cy + radius * 0.07, radius * 0.08, 0, Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawLogoEar(ctx, x, y, size, direction) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * direction, y + size * 0.58);
  ctx.lineTo(x - size * direction, y + size * 0.58);
  ctx.closePath();
  ctx.fillStyle = '#fff8e9';
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - size * 0.38);
  ctx.lineTo(x + size * 0.48 * direction, y + size * 0.42);
  ctx.lineTo(x - size * 0.48 * direction, y + size * 0.42);
  ctx.closePath();
  ctx.fillStyle = '#ff9fba';
  ctx.fill();
}

function drawTinyPlanetSticker(ctx, cx, cy, size) {
  ctx.save();
  ctx.fillStyle = '#ffb8ca';
  ctx.strokeStyle = '#e79dac';
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.beginPath();
  ctx.arc(cx, cy, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = '#ffe0a8';
  ctx.lineWidth = Math.max(1.3, size * 0.22);
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.08, size * 1.45, size * 0.36, -0.18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSpark(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffd84f';
  ctx.strokeStyle = 'rgba(52, 56, 74, .38)';
  ctx.lineWidth = Math.max(1, size * 0.2);
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 ? size * 0.42 : size;
    const a = -Math.PI / 2 + i * Math.PI / 4;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawRoundedStar(ctx, cx, cy, size, fill) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fill;
  ctx.strokeStyle = 'rgba(86, 98, 124, .22)';
  ctx.lineWidth = Math.max(1, size * 0.14);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 ? size * 0.55 : size;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function gridPointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const { half, size, cell } = getGridMetrics({ width: rect.width, height: rect.height });
  const left = rect.left + (rect.width - size) / 2;
  const top = rect.top + (rect.height - size) / 2;
  const gx = Math.floor((event.clientX - left) / cell);
  const gy = Math.floor((event.clientY - top) / cell);
  if (gx < 0 || gy < 0 || gx > half * 2 || gy > half * 2) return null;
  return { x: gx - half, y: half - gy };
}

function getGridMetrics({ width, height }) {
  const half = 4;
  const size = Math.min(width, height) * 0.86;
  return {
    half,
    size,
    left: (width - size) / 2,
    top: (height - size) / 2,
    cell: size / (half * 2 + 1)
  };
}
