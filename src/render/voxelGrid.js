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
  const grad = ctx.createLinearGradient(x, bodyTop, x + size, bodyTop + bodyHeight);
  grad.addColorStop(0, '#fffaf0');
  grad.addColorStop(0.48, color);
  grad.addColorStop(1, '#ffddea');
  roundRect(ctx, x, bodyTop, size, bodyHeight, radius);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 56, 74, .62)';
  ctx.lineWidth = Math.max(1.6, size * 0.052);
  ctx.stroke();

  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = '#7bdcff';
  ctx.lineWidth = Math.max(1.2, size * 0.042);
  ctx.beginPath();
  ctx.ellipse(x + size * 0.5, y + size * 0.62, size * 0.46, size * 0.16, -0.16, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  drawEar(ctx, x + size * 0.25, y + size * 0.19, size * 0.22, -1, color);
  drawEar(ctx, x + size * 0.75, y + size * 0.19, size * 0.22, 1, color);
  drawSpark(ctx, x + size * 0.82, y + size * 0.3, size * 0.08);

  ctx.fillStyle = '#ff8aad';
  ctx.beginPath();
  ctx.ellipse(x + size * 0.28, y + size * 0.62, size * 0.095, size * 0.065, -0.08, 0, Math.PI * 2);
  ctx.ellipse(x + size * 0.72, y + size * 0.62, size * 0.095, size * 0.065, 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34384a';
  ctx.beginPath();
  ctx.arc(x + size * 0.39, y + size * 0.47, size * 0.058, 0, Math.PI * 2);
  ctx.arc(x + size * 0.61, y + size * 0.47, size * 0.058, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#34384a';
  ctx.lineWidth = Math.max(1.4, size * 0.048);
  ctx.beginPath();
  ctx.arc(x + size * 0.47, y + size * 0.57, size * 0.055, 0, Math.PI);
  ctx.arc(x + size * 0.53, y + size * 0.57, size * 0.055, 0, Math.PI);
  ctx.stroke();
}

function drawEar(ctx, x, y, size, direction, color) {
  const earGrad = ctx.createLinearGradient(x, y - size, x, y + size);
  earGrad.addColorStop(0, '#fffaf0');
  earGrad.addColorStop(1, color);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + size * direction, y + size * 0.72);
  ctx.lineTo(x - size * direction, y + size * 0.72);
  ctx.closePath();
  ctx.fillStyle = earGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 56, 74, .62)';
  ctx.lineWidth = Math.max(1.3, size * 0.18);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.2);
  ctx.lineTo(x + size * 0.42 * direction, y + size * 0.58);
  ctx.lineTo(x - size * 0.42 * direction, y + size * 0.58);
  ctx.closePath();
  ctx.fillStyle = '#ff9fba';
  ctx.fill();
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
