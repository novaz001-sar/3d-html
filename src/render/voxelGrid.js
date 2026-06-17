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
