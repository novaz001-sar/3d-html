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
